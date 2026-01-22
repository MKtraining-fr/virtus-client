import React from 'react';
import {
  Activity,
  Award,
  Dumbbell,
  MessageCircle,
  TrendingUp,
  Utensils,
  Zap,
  Target,
} from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { ProgressChart } from '../components/dashboard/ProgressChart';
import { ActivityCard } from '../components/dashboard/ActivityCard';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { StreakCard } from '../components/dashboard/StreakCard';
import { NextWorkoutCard } from '../components/dashboard/NextWorkoutCard';
import { CurrentProgramCard } from '../components/dashboard/CurrentProgramCard';

const Dashboard: React.FC = () => {
  // Données mockées pour les KPIs
  const kpis = [
    {
      title: 'Entraînements',
      value: '12',
      subtitle: 'Ce mois-ci',
      icon: Dumbbell,
      trend: { value: 15, isPositive: true },
      color: 'violet' as const,
    },
    {
      title: 'Calories brûlées',
      value: '3,240',
      subtitle: 'Cette semaine',
      icon: Zap,
      trend: { value: 8, isPositive: true },
      color: 'orange' as const,
    },
    {
      title: 'Progression',
      value: '87%',
      subtitle: 'Objectifs atteints',
      icon: Target,
      color: 'green' as const,
    },
    {
      title: 'Records',
      value: '5',
      subtitle: 'Ce mois-ci',
      icon: Award,
      trend: { value: 25, isPositive: true },
      color: 'blue' as const,
    },
  ];

  // Données mockées pour le graphique de progression
  const progressData = [
    { label: 'Lun', value: 75 },
    { label: 'Mar', value: 82 },
    { label: 'Mer', value: 78 },
    { label: 'Jeu', value: 85 },
    { label: 'Ven', value: 90 },
    { label: 'Sam', value: 88 },
    { label: 'Dim', value: 92 },
  ];

  // Données mockées pour les exercices
  const exerciseData = [
    { label: 'Squat', value: 120 },
    { label: 'Développé couché', value: 95 },
    { label: 'Soulevé de terre', value: 140 },
    { label: 'Développé militaire', value: 65 },
    { label: 'Rowing', value: 85 },
  ];

  // Données mockées pour les activités récentes
  const activities = [
    {
      id: '1',
      type: 'workout' as const,
      title: 'Séance Jambes complétée',
      description: '8 exercices • 65 minutes',
      time: "Aujourd'hui à 10:30",
      icon: Dumbbell,
    },
    {
      id: '2',
      type: 'achievement' as const,
      title: 'Nouveau record personnel !',
      description: 'Squat : 125kg (+5kg)',
      time: "Aujourd'hui à 11:15",
      icon: Award,
    },
    {
      id: '3',
      type: 'message' as const,
      title: 'Message de votre coach',
      description: 'Excellent travail cette semaine !',
      time: 'Hier à 18:45',
      icon: MessageCircle,
    },
    {
      id: '4',
      type: 'nutrition' as const,
      title: 'Objectif calorique atteint',
      description: '2,450 kcal / 2,400 kcal',
      time: 'Hier à 22:00',
      icon: Utensils,
    },
  ];

  // Données mockées pour les actions rapides
  const quickActions = [
    {
      id: '1',
      title: 'Démarrer',
      description: 'Entraînement',
      icon: Dumbbell,
      color: 'violet' as const,
      path: '/training',
    },
    {
      id: '2',
      title: 'Suivre',
      description: 'Nutrition',
      icon: Utensils,
      color: 'green' as const,
      path: '/nutrition',
    },
    {
      id: '3',
      title: 'Contacter',
      description: 'Mon coach',
      icon: MessageCircle,
      color: 'blue' as const,
      path: '/messages',
    },
    {
      id: '4',
      title: 'Voir',
      description: 'Progression',
      icon: TrendingUp,
      color: 'orange' as const,
      path: '/training',
    },
  ];

  // Données mockées pour la série d'entraînement
  const weekActivity = [true, true, false, true, true, true, true]; // L M M J V S D

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Message de bienvenue mobile */}
      <div className="bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] rounded-2xl p-5 shadow-xl">
        <h2 className="text-white text-lg font-bold mb-1">
          Bienvenue ! 👋
        </h2>
        <p className="text-white/80 text-sm">
          Voici un aperçu de votre progression
        </p>
      </div>

      {/* KPIs - Grille 2x2 pour mobile */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Programme en cours */}
      <CurrentProgramCard
        programName="Push Pull Legs - Hypertrophie"
        currentWeek={3}
        totalWeeks={12}
        progressPercentage={25}
        nextSession={{
          name: "Push - Pectoraux & Triceps",
          date: "Aujourd'hui",
          time: "10:00"
        }}
      />

      {/* Série d'entraînement */}
      <StreakCard
        currentStreak={6}
        bestStreak={14}
        weekActivity={weekActivity}
      />

      {/* Actions rapides */}
      <QuickActionCard actions={quickActions} />

      {/* Graphique de progression */}
      <ProgressChart
        title="Performance cette semaine"
        data={progressData}
        color="violet"
        type="line"
      />

      {/* Graphique des exercices */}
      <ProgressChart
        title="Records personnels (kg)"
        data={exerciseData}
        color="orange"
        type="bar"
      />

      {/* Activités récentes */}
      <ActivityCard activities={activities} />
    </div>
  );
};

export default Dashboard;
