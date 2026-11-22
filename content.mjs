// All site copy and project data, Romanian and English. Edit here, then run: node build.mjs
// Projects marked placeholder: true are mockups (photos from your archives, provisional names).
// While any placeholder remains, every page carries noindex so search engines and AI do not index the mockup.

import { readFileSync } from 'node:fs';

export const SITE = {
  domain: 'https://stefanbugalete.com', // assumed from the contact email; change if the domain differs
  email: 'contact@stefanbugalete.com',
  instagram: 'https://www.instagram.com/stefan.bugalete/',
  instagramHandle: '@stefan.bugalete',
  name: 'Ștefan Bugalete',
  brand: 'Ștefan Bugalete Architecture & Design',
};

export const ROUTES = {
  home:      { ro: '/',            en: '/en/' },
  portfolio: { ro: '/portofoliu/', en: '/en/portfolio/' },
  about:     { ro: '/despre/',     en: '/en/about/' },
  contact:   { ro: '/contact/',    en: '/en/contact/' },
};

// Category ids and their labels (the same words in both languages, as requested).
export const CATEGORIES = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'interior', label: 'Interior' },
  { id: 'health', label: 'Health' },
];

// Real projects come from proiecte.txt: `node import-drive.mjs` downloads their photos from Google Drive
// and writes data/projects.json. Until that file exists, the mockups below are shown.
// images: files in dist/assets/projects/<name>.jpg (and <name>-sm.jpg). The first is the cover.
const MOCK_PROJECTS = [
  {
    slug: 'casa-in-padure', placeholder: true, category: 'architecture',
    title: { ro: 'Casă în pădure', en: 'Forest house' },
    images: ['forest-1', 'forest-2', 'forest-3', 'forest-4', 'forest-5', 'forest-6'],
    summary: { ro: '', en: '' },
  },
  {
    slug: 'clinica-dentara', placeholder: true, category: 'health',
    title: { ro: 'Clinică dentară', en: 'Dental clinic' },
    images: ['clinic-1', 'clinic-2', 'clinic-3', 'clinic-4', 'clinic-5', 'clinic-6'],
    summary: { ro: '', en: '' },
  },
  {
    slug: 'apartament-nuc', placeholder: true, category: 'interior',
    title: { ro: 'Apartament cu nuc', en: 'Walnut apartment' },
    images: ['apartment-1', 'apartment-2', 'apartment-3', 'apartment-4', 'apartment-5', 'apartment-6'],
    summary: { ro: '', en: '' },
  },
  {
    slug: 'vila-v1', placeholder: true, category: 'architecture',
    title: { ro: 'Vila V1', en: 'Villa V1' },
    images: ['villa-1', 'villa-2', 'villa-3', 'villa-4', 'villa-5', 'villa-6'],
    summary: { ro: '', en: '' },
  },
  {
    slug: 'casa-cu-arcade', placeholder: true, category: 'interior',
    title: { ro: 'Casa cu arcade', en: 'House of arches' },
    images: ['arches-1', 'arches-2', 'arches-3', 'arches-4', 'arches-5', 'arches-6'],
    summary: { ro: '', en: '' },
  },
];

let imported = [];
try { imported = JSON.parse(readFileSync(new URL('./data/projects.json', import.meta.url), 'utf8')); } catch { /* not imported yet */ }
export const PROJECTS = imported.length ? imported : MOCK_PROJECTS;

export const AWARDS = [
  {
    year: '2026',
    title: { ro: 'BIG SEE Interior Design Award 2026', en: 'BIG SEE Interior Design Award 2026' },
    result: { ro: 'Câștigător, Civic Interiors', en: 'Winner, Civic Interiors' },
    project: { ro: 'Clinica Onora', en: 'Onora Clinic' },
  },
  {
    year: '2026',
    title: { ro: 'RAM 2026', en: 'RAM 2026' },
    result: { ro: 'Young Vision Award', en: 'Young Vision Award' },
    project: { ro: 'Clinica Velvet', en: 'Velvet Clinic' },
  },
];

// Press and mentions on the About page. PLACEHOLDERS: replace with real articles, interviews, publications.
// url is optional (leave '' for no link).
export const MENTIONS = [
  { year: '2026', outlet: '[Publicație]', title: { ro: '[Titlul articolului sau al mențiunii]', en: '[Article or mention title]' }, url: '' },
  { year: '2026', outlet: '[Publicație]', title: { ro: '[Titlul articolului sau al mențiunii]', en: '[Article or mention title]' }, url: '' },
];

export const T = {
  ro: {
    lang: 'ro', locale: 'ro_RO', other: 'en', switchLabel: 'EN', switchName: 'English',
    skip: 'Sari la conținut', menu: 'Meniu', close: 'Închide',
    nav: { portfolio: 'Portofoliu', about: 'Despre', contact: 'Contact' },
    tagline: 'Arhitectură & design',
    all: 'Toate',
    view: 'Vezi proiectul',
    next: 'Proiectul următor',
    back: 'Înapoi la portofoliu',
    descriptionSoon: 'Descrierea proiectului urmează.',
    category: 'Categorie',
    footerEmail: 'Scrie-ne',
    rights: 'Toate drepturile rezervate.',

    home: {
      title: 'Ștefan Bugalete: arhitect și designer de interior în Iași și București',
      description: 'Arhitectură și design interior pentru locuințe premium și clinici medicale, de la concept la predare la cheie. Câștigător BIG SEE Interior Design Award 2026.',
      heroTitle: 'design & arhitectură',
      places: 'Iași · București · la distanță',
      heroText: 'Locuințe premium și clinici medicale, de la concept până la cheie.',
      h1: 'Arhitectură & design',
      sub: 'Locuințe premium și clinici medicale, de la concept până la cheie. Iași, București și la distanță.',
      explore: 'Explorează proiectele',
      indexLabel: 'Proiecte',
      selectedTitle: 'Proiecte selectate',
      allProjects: 'Tot portofoliul',
      statement: 'Arhitectura, materialele și viața de zi cu zi, aduse într-un echilibru clar.',
      awardsTitle: 'Premii',
      closeTitle: 'Ai un spațiu în minte?',
      closeCta: 'Scrie-mi',
      lightHint: 'Mișcă mouse-ul pentru a lumina proiectele',
    },

    portfolio: {
      title: 'Portofoliu | Ștefan Bugalete, arhitectură și design interior',
      description: 'Proiecte de arhitectură, design interior și clinici medicale semnate de Ștefan Bugalete.',
      h1: 'Portofoliu',
      lead: 'Arhitectură, interioare și spații medicale.',
      filterLabel: 'Filtrează după categorie',
      count: (n) => n === 1 ? '1 proiect' : `${n} proiecte`,
    },

    about: {
      title: 'Despre Ștefan Bugalete, arhitect și designer de interior',
      description: 'Ștefan Bugalete este arhitect și fondatorul biroului Ștefan Bugalete Architecture & Design, cu sedii în Iași și București.',
      h1: 'Ștefan Bugalete',
      role: 'Arhitect și fondator',
      bio: [
        'Ștefan Bugalete este arhitect și fondatorul biroului. De peste opt ani proiectează interioare rezidențiale în contexte foarte diferite.',
        'Lucrările lui aduc arhitectura, materialele și viața de zi cu zi într-un echilibru clar, ghidat de un minimalism funcțional, de alegeri sincere de materiale și de atenție la fiecare proiect.',
        'Biroul lucrează pentru clienți privați care vor un serviciu de top și pentru clinici medicale, din Iași, din București și la distanță, pentru clienți din alte țări.',
      ],
      portraitAlt: 'Ștefan Bugalete, arhitect, așezat pe o canapea într-un living cu pereți bej',
      awardsTitle: 'Premii',
      servicesTitle: 'Servicii',
      services: ['Proiect de arhitectură', 'Design interior', 'Supervizare execuție', 'Predare la cheie'],
      faqTitle: 'Întrebări frecvente',
      faq: [
        { q: 'Ce servicii oferă Ștefan Bugalete?', a: 'Proiect de arhitectură, design interior, supervizarea execuției și predare la cheie, pentru locuințe premium și clinici medicale.' },
        { q: 'Unde lucrați?', a: 'Biroul are sedii în Iași și București. Lucrez în toată România și, la distanță, pentru clienți din alte țări.' },
        { q: 'Proiectați clinici dentare și medicale?', a: 'Da. Clinica Onora a câștigat BIG SEE Interior Design Award 2026, iar Clinica Velvet a primit RAM 2026 Young Vision Award.' },
      ],
    },

    contact: {
      title: 'Contact | Ștefan Bugalete, arhitect în Iași și București',
      description: 'Trimite o solicitare pentru un proiect de arhitectură sau design interior: casă, apartament sau clinică medicală.',
      h1: 'Orice spațiu începe cu o conversație.',
      lead: 'Proiecte noi, colaborări, presă.',
      topics: ['Proiecte noi', 'Colaborări', 'Presă'],
      direct: 'Email',
      offices: 'Birouri',
      officesValue: 'Iași · București · la distanță',
      form: {
        name: 'Nume', email: 'Email', type: 'Tipul proiectului', message: 'Mesaj',
        types: ['Architecture', 'Interior', 'Health', 'Altceva'], choose: 'Alege',
        send: 'Trimite',
        note: 'Mesajul pleacă din aplicația de email.',
        errName: 'Numele lipsește.', errEmail: 'Adresa de email nu e completă.', errMessage: 'Mesajul e gol.',
        errOne: 'Un câmp trebuie completat.', errMany: '{n} câmpuri trebuie completate.',
        opened: 'Mesajul a fost pregătit în aplicația de email. Adresa directă: contact@stefanbugalete.com.',
        subject: 'Proiect nou',
      },
    },
  },

  en: {
    lang: 'en', locale: 'en_GB', other: 'ro', switchLabel: 'RO', switchName: 'Română',
    skip: 'Skip to content', menu: 'Menu', close: 'Close',
    nav: { portfolio: 'Portfolio', about: 'About', contact: 'Contact' },
    tagline: 'Architecture & design',
    all: 'All',
    view: 'View project',
    next: 'Next project',
    back: 'Back to portfolio',
    descriptionSoon: 'Project description coming soon.',
    category: 'Category',
    footerEmail: 'Write to us',
    rights: 'All rights reserved.',

    home: {
      title: 'Ștefan Bugalete: architect and interior designer in Iași and Bucharest',
      description: 'Architecture and interior design for premium homes and medical clinics, from concept to turnkey. Winner of the BIG SEE Interior Design Award 2026.',
      heroTitle: 'design & architecture',
      places: 'Iași · Bucharest · remote',
      heroText: 'Premium homes and medical clinics, from concept to turnkey.',
      h1: 'Architecture & design',
      sub: 'Premium homes and medical clinics, from concept to turnkey. Iași, Bucharest and remote.',
      explore: 'Explore the projects',
      indexLabel: 'Projects',
      selectedTitle: 'Selected projects',
      allProjects: 'Full portfolio',
      statement: 'Architecture, materials and everyday life, brought into clear balance.',
      awardsTitle: 'Awards',
      closeTitle: 'Have a space in mind?',
      closeCta: 'Write to me',
      lightHint: 'Move the pointer to light the projects',
    },

    portfolio: {
      title: 'Portfolio | Ștefan Bugalete, architecture and interior design',
      description: 'Architecture, interior design and medical clinic projects by Ștefan Bugalete.',
      h1: 'Portfolio',
      lead: 'Architecture, interiors and medical spaces.',
      filterLabel: 'Filter by category',
      count: (n) => n === 1 ? '1 project' : `${n} projects`,
    },

    about: {
      title: 'About Ștefan Bugalete, architect and interior designer',
      description: 'Ștefan Bugalete is an architect and the founder of Ștefan Bugalete Architecture & Design, with offices in Iași and Bucharest.',
      h1: 'Ștefan Bugalete',
      role: 'Architect and founder',
      bio: [
        'Ștefan Bugalete is an architect and the founder of the studio. For more than eight years, he has developed residential interiors across a range of contexts.',
        'His work brings architecture, materials and everyday life into clear balance, guided by functional minimalism, honest material choices and close attention to each project.',
        'The studio works for private clients who expect a top-tier service and for medical clinics, from Iași, from Bucharest and remotely for clients abroad.',
      ],
      portraitAlt: 'Ștefan Bugalete, architect, seated on a sofa in a living room with beige walls',
      awardsTitle: 'Awards',
      servicesTitle: 'Services',
      services: ['Architecture', 'Interior design', 'Site supervision', 'Turnkey delivery'],
      faqTitle: 'Questions',
      faq: [
        { q: 'What services does Ștefan Bugalete offer?', a: 'Architecture, interior design, site supervision and turnkey delivery, for premium homes and medical clinics.' },
        { q: 'Where do you work?', a: 'The studio has offices in Iași and Bucharest. I work across Romania and remotely for clients abroad.' },
        { q: 'Do you design dental and medical clinics?', a: 'Yes. Onora Clinic won the BIG SEE Interior Design Award 2026 and Velvet Clinic received the RAM 2026 Young Vision Award.' },
      ],
    },

    contact: {
      title: 'Contact | Ștefan Bugalete, architect in Iași and Bucharest',
      description: 'Send a request for an architecture or interior design project: a house, apartment or medical clinic.',
      h1: 'Every space begins with a conversation.',
      lead: 'New projects, collaborations, press.',
      topics: ['New projects', 'Collaborations', 'Press'],
      direct: 'Email',
      offices: 'Offices',
      officesValue: 'Iași · Bucharest · remote',
      form: {
        name: 'Name', email: 'Email', type: 'Project type', message: 'Message',
        types: ['Architecture', 'Interior', 'Health', 'Something else'], choose: 'Choose',
        send: 'Send',
        note: 'The message is sent from the email app.',
        errName: 'Name is missing.', errEmail: 'The email address is incomplete.', errMessage: 'The message is empty.',
        errOne: 'One field needs attention.', errMany: '{n} fields need attention.',
        opened: 'The message has been prepared in the email app. Direct address: contact@stefanbugalete.com.',
        subject: 'New project',
      },
    },
  },
};
