import React from 'react';

// HeroIcons SVGs (MIT License)

const Squares2x2Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.75-5.455c.097-.534-.234-1.06-.738-1.282A10.5 10.5 0 0 0 19.5 12c0-2.343-1.04-4.438-2.724-5.882-1.684-1.444-3.92-2.318-6.276-2.318s-4.592.874-6.276 2.318C2.54 7.562 1.5 9.657 1.5 12c0 1.35.324 2.639.898 3.787-.504.222-.835.748-.738 1.282A9.09 9.09 0 0 0 6 18.72m12 0a9.09 9.09 0 0 1-12 0m12 0a9.09 9.09 0 0 0-12 0m12 0a9.09 9.09 0 0 0-12 0M6 12c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6Z" />
  </svg>
);

const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h.75v.75h-.75V7.5ZM6.75 10.5h.75v.75h-.75v-.75ZM6.75 13.5h.75v.75h-.75v-.75Z" />
  </svg>
);

const FireIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 3.75 3.75 0 0 0-1.993-2.158c-.192-.086-.397-.148-.602-.192a3.75 3.75 0 0 0-4.198 4.198c.044.205.106.41.192.602a3.75 3.75 0 0 0 2.158 1.993A3.75 3.75 0 0 0 12 18Z" />
  </svg>
);

const BeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c.149-.011.3-.019.45-.019h3.6c.15 0 .299.008.45.019m-4.5 0v5.714c0 .597.237 1.17.659 1.591L10.5 14.5m0-11.396c.149-.011.3-.019.45-.019h3.6c.15 0 .299.008.45.019m0 0v5.714a2.25 2.25 0 0 0 .659 1.591l2.432 2.432m0 0v3.182m-6.364 0v3.182m-6.364 0-2.432-2.432A2.25 2.25 0 0 1 3 10.818V7.636a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.636v3.182a2.25 2.25 0 0 1-.659 1.591l-2.432 2.432m-6.364 0-.45-.45a2.25 2.25 0 0 0-3.182 0l-.45.45m6.364 0a2.25 2.25 0 0 1-3.182 0" />
    </svg>
);


const ChatBubbleLeftRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.532a2.25 2.25 0 0 1-2.28 0l-3.722-.532c-1.133-.093-1.98-1.057-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097m0 0A7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 8.25 2.511M8.25 8.511a7.5 7.5 0 0 0-5.482 2.511M3.75 10.608V14.894c0 1.136.847 2.1 1.98 2.193l3.722.532a2.25 2.25 0 0 0 2.28 0l3.722-.532c1.133-.093 1.98-1.057 1.98-2.193V10.608" />
  </svg>
);

const Cog6ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.26.713.53.967l.82 1.028c.449.562.449 1.442 0 2.004l-.82 1.028c-.27.254-.467.593-.53.967l-.213 1.281c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.26-.713-.53-.967l-.82-1.028c-.449-.562-.449-1.442 0-2.004l.82-1.028c.27-.254.467.593-.53-.967l.213-1.281zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);


export const NAV_ITEMS = [
  { name: 'Tableau de bord', path: '/', icon: <Squares2x2Icon className="w-6 h-6" />, subItems: [] },
  { name: 'Mes clients', path: '/clients', icon: <UserGroupIcon className="w-6 h-6" />, subItems: [] },
  {
    name: 'Bilan', path: '/bilan', icon: <ClipboardDocumentListIcon className="w-6 h-6" />, subItems: [
      { name: 'Nouveau bilan', path: '/bilan/nouveau' },
      { name: 'Archive', path: '/bilan/archive' },
    ]
  },
  {
    name: 'Musculation', path: '/musculation', icon: <FireIcon className="w-6 h-6" />, subItems: [
      { name: 'Créateur de séance', path: '/musculation/createur' },
      { name: 'Bibliothèque', path: '/musculation/bibliotheque' },
      { name: 'Base de données', path: '/musculation/database' },
    ]
  },
  {
    name: 'Nutrition', path: '/nutrition', icon: <BeakerIcon className="w-6 h-6" />, subItems: [
      { name: 'Créateur de repas', path: '/nutrition/createur' },
      { name: 'Bibliothèque', path: '/nutrition/bibliotheque' },
      { name: 'Ciqual', path: '/nutrition/ciqual' },
    ]
  },
  { name: 'Messagerie', path: '/messagerie', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, subItems: [] },
  { name: 'Paramètres', path: '/parametres', icon: <Cog6ToothIcon className="w-6 h-6" />, subItems: [] },
];
