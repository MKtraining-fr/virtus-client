import React from 'react';
import {
    Squares2x2Icon, UserGroupIcon, ClipboardDocumentListIcon, FireIcon, BeakerIcon,
    ChatBubbleLeftRightIcon, Cog6ToothIcon, AcademicCapIcon, ShoppingBagIcon, ArrowDownTrayIcon,
    ChartBarIcon, BookOpenIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon
} from './icons';
import { ClientNav } from '../types';

interface NavItem {
    name: string;
    path: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    subItems: { name: string; path: string }[];
}

// --- ADMIN NAVIGATION ---
export const ADMIN_NAV_ITEMS: Omit<NavItem, 'subItems'>[] = [
  { name: 'Dashboard', path: '/app', icon: Squares2x2Icon },
  { name: 'Utilisateurs', path: '/app/users', icon: UserGroupIcon },
  { name: 'Formations Pro', path: '/app/pro-formations', icon: AcademicCapIcon },
  { name: 'Formations Clients', path: '/app/client-formations', icon: BookOpenIcon },
  { name: 'Boutique', path: '/app/shop', icon: ShoppingBagIcon },
  { name: 'Exercices', path: '/app/exercises', icon: FireIcon },
  { name: 'Statistiques', path: '/app/stats', icon: ChartBarIcon },
  { name: 'Import', path: '/app/import', icon: ArrowDownTrayIcon },
];


// --- COACH NAVIGATION ---
export const COACH_NAV_ITEMS: NavItem[] = [
  { name: 'Tableau de bord', path: '/app', icon: Squares2x2Icon, subItems: [] },
  { name: 'Mes clients', path: '/app/clients', icon: UserGroupIcon, subItems: [] },
  {
    name: 'Bilan', path: '/app/bilan', icon: ClipboardDocumentListIcon, subItems: [
      { name: 'Nouveau bilan', path: '/app/bilan/nouveau' },
      { name: 'Modèles de bilan', path: '/app/bilan/templates' },
      { name: 'Archive', path: '/app/bilan/archive' },
    ]
  },
  {
    name: 'Musculation', path: '/app/musculation', icon: FireIcon, subItems: [
      { name: 'Créateur de séance', path: '/app/musculation/createur' },
      { name: 'Bibliothèque', path: '/app/musculation/bibliotheque' },
      { name: 'Base de données', path: '/app/musculation/database' },
    ]
  },
  {
    name: 'Nutrition', path: '/app/nutrition', icon: BeakerIcon, subItems: [
      { name: 'Créateur de repas', path: '/app/nutrition/createur' },
      { name: 'Bibliothèque', path: '/app/nutrition/bibliotheque' },
      { name: 'Ciqual', path: '/app/nutrition/ciqual' },
    ]
  },
  { name: 'Formation', path: '/app/formations', icon: AcademicCapIcon, subItems: [] },
  { name: 'Boutique', path: '/app/shop', icon: ShoppingBagIcon, subItems: [] },
  { name: 'Messagerie', path: '/app/messagerie', icon: ChatBubbleLeftRightIcon, subItems: [] },
  { name: 'Paramètres', path: '/app/parametres', icon: Cog6ToothIcon, subItems: [] },
];


// --- CLIENT NAVIGATION ---
export const CLIENT_NAV_ITEMS: ClientNav[] = [
    { path: '/app/workout', name: 'Entraînement', icon: FireIcon },
    { path: '/app/library', name: 'Bibliothèque', icon: BookOpenIcon },
    { path: '/app/nutrition', name: 'Nutrition', icon: BeakerIcon },
    { path: '/app/messaging', name: 'Messagerie', icon: ChatBubbleLeftEllipsisIcon },
    { path: '/app/shop', name: 'Boutique', icon: ShoppingBagIcon },
    { path: '/app/profile', name: 'Profil', icon: UserCircleIcon },
];