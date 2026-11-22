// Imports projects from proiecte.txt: reads each Google Drive folder link, downloads the photos and renders,
// resizes them for the web and writes data/projects.json, which content.mjs uses instead of the mockups.
// Then it rebuilds the site.
//
//   node import-drive.mjs            import new photos (photos already downloaded are kept)
//   node import-drive.mjs --force    download every photo again
//
// No extra installs: Node 18+ and Windows (resizing uses the built-in .NET image library through PowerShell).

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(ROOT, 'dist', 'assets', 'projects');
const DATA = join(ROOT, 'data', 'projects.json');
const TMP = join(tmpdir(), 'sb-drive-import');
const FORCE = process.argv.includes('--force');
const MAX_PER_PROJECT = 14;

// ---------- 1. read proiecte.txt ----------
const FIELDS = {
  'nume': 'title_ro', 'nume en': 'title_en', 'categorie': 'category', 'an': 'year',
  'suprafață': 'area', 'suprafata': 'area', 'oraș': 'place', 'oras': 'place',
  'descriere': 'summary_ro', 'descriere en': 'summary_en', 'poze': 'folder',
};
function parseProjects(text) {
  const blocks = text.split(/^\s*---\s*$/m);
  const out = [];
  for (const block of blocks) {
    const p = {};
    for (const raw of block.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([^:]+):\s*(.*)$/);
      if (!m) continue;
      const key = m[1].replace(/\(.*?\)/g, '').trim().toLowerCase();
      if (FIELDS[key]) p[FIELDS[key]] = m[2].trim();
    }
    if (p.title_ro && p.folder && !p.folder.includes('LIPESTE_AICI')) out.push(p);
  }
  return out;
}

const CATS = { architecture: 'architecture', arhitectura: 'architecture', 'arhitectură': 'architecture', interior: 'interior', 'design interior': 'interior', health: 'health', clinici: 'health', clinica: 'health', 'clinică': 'health', medical: 'health' };
const category = (v = '') => CATS[v.trim().toLowerCase()] || 'interior';
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function folderId(url) {
  const m = url.match(/folders\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  if (!m) throw new Error(`Nu găsesc ID-ul folderului în linkul: ${url}`);
  return m[1];
}

// ---------- 2. list a public Drive folder (no API key needed) ----------
async function listFolder(id) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}#list`);
  if (!res.ok) throw new Error(`Folderul ${id} nu poate fi citit (HTTP ${res.status}). Este partajat cu „Oricine are linkul”?`);
  const html = await res.text();
  const files = [];
  const re = /id="entry-([\w-]+)"[\s\S]*?class="flip-entry-title">([^<]+)</g;
  let m;
  while ((m = re.exec(html))) {
    const name = m[2].trim();
    if (/\.(jpe?g|png|webp|tiff?)$/i.test(name)) files.push({ id: m[1], name });
  }
  if (!files.length) throw new Error(`Nu am găsit poze în folderul ${id}. Verifică partajarea și că pozele sunt direct în folder (nu în subfoldere).`);
  return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

async function download(fileId, dest) {
  const res = await fetch(`https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`);
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.startsWith('image/')) throw new Error(`Fișierul ${fileId} nu s-a putut descărca (${res.status}, ${type}).`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// ---------- 3. resize with Windows' built-in image library ----------
function resizeAll(jobs) {
  if (!jobs.length) return;
  const list = join(TMP, 'jobs.json');
  writeFileSync(list, JSON.stringify(jobs));
  const ps = `
Add-Type -AssemblyName System.Drawing
$jobs = Get-Content -Raw -Encoding UTF8 '${list.replace(/'/g, "''")}' | ConvertFrom-Json
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$p = New-Object System.Drawing.Imaging.EncoderParameters 1
$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
foreach ($j in $jobs) {
  $img = [System.Drawing.Image]::FromFile($j.src)
  foreach ($size in 1800, 900) {
    $dst = if ($size -eq 1800) { $j.big } else { $j.small }
    $r = [Math]::Min([double]1.0, [double]$size / [Math]::Max($img.Width, $img.Height))
    $w = [int]($img.Width * $r); $h = [int]($img.Height * $r)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dst, $enc, $p)
    $g.Dispose(); $bmp.Dispose()
  }
  $img.Dispose()
}`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'inherit' });
}

// ---------- run ----------
const source = readFileSync(join(ROOT, 'proiecte.txt'), 'utf8');
const items = parseProjects(source);
if (!items.length) {
  console.log('proiecte.txt nu conține încă niciun proiect cu link de Drive. Site-ul rămâne cu proiectele de probă.');
  process.exit(0);
}
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(dirname(DATA), { recursive: true });
mkdirSync(TMP, { recursive: true });

const projects = [];
let failed = 0;
for (const it of items) {
  const slug = slugify(it.title_ro);
  process.stdout.write(`• ${it.title_ro} … `);
  try {
    const files = (await listFolder(folderId(it.folder))).slice(0, MAX_PER_PROJECT);
    const jobs = [];
    const names = [];
    for (let k = 0; k < files.length; k++) {
      const name = `${slug}-${k + 1}`;
      names.push(name);
      const big = join(OUT_DIR, `${name}.jpg`), small = join(OUT_DIR, `${name}-sm.jpg`);
      if (!FORCE && existsSync(big) && existsSync(small)) continue;
      const src = join(TMP, `${slug}-${k + 1}${files[k].name.match(/\.\w+$/)[0]}`);
      await download(files[k].id, src);
      jobs.push({ src, big, small });
    }
    resizeAll(jobs);
    projects.push({
      slug, placeholder: false, category: category(it.category),
      title: { ro: it.title_ro, en: it.title_en || it.title_ro },
      summary: { ro: it.summary_ro || '', en: it.summary_en || '' },
      year: it.year || '', area: it.area || '',
      place: it.place ? { ro: it.place, en: it.place } : '',
      images: names,
    });
    console.log(`${names.length} poze`);
  } catch (e) {
    failed++;
    console.log(`EROARE: ${e.message}`);
  }
}

if (!projects.length) {
  console.log('\nNiciun proiect nu a putut fi importat. Site-ul rămâne neschimbat.');
  process.exitCode = 1; // no process.exit(): open network sockets crash Node on Windows when forced to quit
} else {
  writeFileSync(DATA, JSON.stringify(projects, null, 2));
  rmSync(TMP, { recursive: true, force: true });
  console.log(`\n${projects.length} proiecte importate${failed ? `, ${failed} cu erori (vezi mai sus)` : ''}. Refac site-ul…`);
  execFileSync(process.execPath, [join(ROOT, 'build.mjs')], { stdio: 'inherit', cwd: ROOT });
}
