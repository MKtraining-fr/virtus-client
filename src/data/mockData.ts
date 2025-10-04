import { Client, Exercise, WorkoutProgram, WorkoutSession, NutritionPlan } from '../types';

export const PEOPLE_DB: Client[] = [
    {
        id: '1', status: 'active', firstName: 'Jean', lastName: 'Dupont', age: 32, sex: 'Homme',
        email: 'jean.d@email.com', phone: '0612345678', registrationDate: '2023-01-15',
        address: '123 rue de la Forme, 75001 Paris', dob: '1992-03-20',
        programWeek: 5, totalWeeks: 8, sessionProgress: 2, totalSessions: 3, viewed: true,
        objective: 'Prise de masse musculaire',
        notes: 'Faire attention au genou droit sur les exercices de squat. Bonne progression sur le développé couché.',
        medicalInfo: { history: 'Aucun antécédent notable.', allergies: 'Pollen' },
        nutrition: {
            measurements: { neck: 40, chest: 105, l_bicep: 38, r_bicep: 38.5, waist: 85, hips: 95, l_thigh: 60, r_thigh: 61 },
            weightHistory: [ { date: 'W1', value: 78 }, { date: 'W2', value: 78.5 }, { date: 'W3', value: 79 }, { date: 'W4', value: 79.2 }, { date: 'W5', value: 80 } ],
            calorieHistory: [ { date: 'W1', value: 2800 }, { date: 'W2', value: 2850 }, { date: 'W3', value: 2900 }, { date: 'W4', value: 3000 }, { date: 'W5', value: 3000 } ],
            macros: { protein: 160, carbs: 350, fat: 80 },
            historyLog: [
                {
                    date: '05/08/2024',
                    weight: 80.0,
                    calories: 3000,
                    macros: { protein: 160, carbs: 350, fat: 80 },
                    measurements: { neck: 40, chest: 105, l_bicep: 38, r_bicep: 38.5, waist: 85, hips: 95, l_thigh: 60, r_thigh: 61 }
                },
                {
                    date: '29/07/2024',
                    weight: 79.2,
                    calories: 3000,
                    macros: { protein: 160, carbs: 350, fat: 80 },
                },
                {
                    date: '22/07/2024',
                    weight: 78.5,
                    calories: 2800,
                    macros: { protein: 150, carbs: 300, fat: 88 },
                    measurements: { neck: 39, chest: 104, l_bicep: 37.5, r_bicep: 38, waist: 86, hips: 95, l_thigh: 59, r_thigh: 60 }
                },
                {
                    date: '15/07/2024',
                    weight: 78,
                    calories: 2800,
                    macros: { protein: 150, carbs: 300, fat: 88 },
                }
            ],
        },
        performanceLog: [
            {
                date: '10/07/2024',
                week: 1,
                programName: 'Full Body Foundation',
                sessionName: 'Séance A',
                exerciseLogs: [
                    {
                        exerciseId: 1,
                        exerciseName: 'Squat',
                        loggedSets: [
                            { reps: '10', load: '90' },
                            { reps: '10', load: '90' },
                            { reps: '8', load: '90' },
                        ]
                    },
                    {
                        exerciseId: 2,
                        exerciseName: 'Développé couché',
                        loggedSets: [
                            { reps: '8', load: '60' },
                            { reps: '8', load: '60' },
                            { reps: '7', load: '60' },
                        ]
                    }
                ]
            },
            {
                date: '12/07/2024',
                week: 1,
                programName: 'Full Body Foundation',
                sessionName: 'Séance B',
                exerciseLogs: [
                     {
                        exerciseId: 4,
                        exerciseName: 'Hip Thrust',
                        loggedSets: [
                            { reps: '15', load: '50' },
                            { reps: '15', load: '50' },
                            { reps: '14', load: '50' },
                            { reps: '12', load: '50' },
                        ]
                    }
                ]
            }
        ],
        assignedPrograms: [],
        role: 'client',
    },
    {
        id: '2', status: 'active', firstName: 'Marie', lastName: 'Curie', age: 28, sex: 'Femme',
        email: 'm.curie@email.com', phone: '0612345679', registrationDate: '2023-03-01',
        programWeek: 2, totalWeeks: 12, sessionProgress: 1, totalSessions: 4, viewed: false,
        objective: 'Perte de poids et tonification',
        notes: 'Très motivée, suit le plan à la lettre.',
        medicalInfo: { history: 'RAS', allergies: 'Aucune connue' },
        nutrition: {
            measurements: { waist: 70, hips: 98 },
            weightHistory: [ { date: 'W1', value: 65 }, { date: 'W2', value: 64.5 }, { date: 'W3', value: 64 }, { date: 'W4', value: 63.8 } ],
            calorieHistory: [ { date: 'W1', value: 1800 }, { date: 'W2', value: 1800 }, { date: 'W3', value: 1750 }, { date: 'W4', value: 1750 } ],
            macros: { protein: 120, carbs: 180, fat: 60 },
            historyLog: [],
        },
        performanceLog: [],
        assignedPrograms: [],
        role: 'client',
    },
    { id: '3', status: 'active', registrationDate: '2022-11-05', objective: 'Amélioration cardio', firstName: 'Pierre', lastName: 'Martin', age: 45, sex: 'Homme', email: 'p.martin@email.com', phone: '0612345678', programWeek: 8, totalWeeks: 8, sessionProgress: 3, totalSessions: 3, viewed: true, notes: 'Augmenter les poids', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
    { id: '4', status: 'active', registrationDate: '2023-05-01', objective: 'Débuter la musculation', firstName: 'Sophie', lastName: 'Lefebvre', age: 25, sex: 'Femme', email: 's.lefebvre@email.com', phone: '0612345678', programWeek: 1, totalWeeks: 6, sessionProgress: 0, totalSessions: 2, viewed: false, notes: 'Débutante', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
    { id: '5', status: 'archived', registrationDate: '2021-09-10', objective: 'Entretien', firstName: 'Lucas', lastName: 'Garcia', age: 30, sex: 'Homme', email: 'l.garcia@email.com', phone: '0612345678', programWeek: 3, totalWeeks: 4, sessionProgress: 1, totalSessions: 5, viewed: true, notes: '', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
    { id: 'prospect1', status: 'prospect', firstName: 'Luc', lastName: 'Skywalker', age: 22, sex: 'Homme', email: 'l.skywalker@email.com', phone: '0601020304', registrationDate: '2023-05-10', objective: 'Devenir un Jedi.', notes: '', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
    { id: 'prospect2', status: 'prospect', firstName: 'Leia', lastName: 'Organa', age: 22, sex: 'Femme', email: 'l.organa@email.com', phone: '0601020305', registrationDate: '2023-06-15', objective: 'Restaurer la République.', notes: 'Ancien client', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
    { id: 'prospect3', status: 'prospect', firstName: 'Han', lastName: 'Solo', age: 35, sex: 'Homme', email: 'h.solo@email.com', phone: '0601020306', registrationDate: '2023-08-20', objective: 'Payer ses dettes.', notes: '', medicalInfo: { history: '', allergies: '' }, nutrition: { measurements: {}, weightHistory: [], calorieHistory: [], macros: { protein: 0, carbs: 0, fat: 0 }, historyLog: [] }, performanceLog: [], assignedPrograms: [], role: 'client' },
];

export const EXERCISE_DB: Exercise[] = [
  { id: '1', name: 'Développé couché', category: 'Musculation', description: 'Exercice de base pour les pectoraux, les épaules et les triceps.', videoUrl: 'https://www.youtube.com/embed/vb-45b6G4V4', illustrationUrl: 'https://img.gymvisual.com/illustrations/8/male-Dumbbell-Bench-Press.png', equipment: 'Haltères', alternativeIds: ['5'], muscleGroups: ['Pectoraux', 'Triceps', 'Épaules'] },
  { id: '2', name: 'Squat', category: 'Musculation', description: 'Mouvement fondamental pour développer la force et la masse des jambes et des fessiers.', videoUrl: 'https://www.youtube.com/embed/U3HlEF_E9fo', illustrationUrl: 'https://img.gymvisual.com/illustrations/403/male-Barbell-Squat.png', equipment: 'Barre olympique', muscleGroups: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'] },
  { id: '3', name: 'Étirement du psoas', category: 'Mobilité', description: 'Étirement important pour soulager les tensions du bas du dos et améliorer la flexibilité de la hanche.', videoUrl: 'https://www.youtube.com/embed/ylQvI5sH0_A', illustrationUrl: 'https://img.gymvisual.com/illustrations/1618/male-Kneeling-Hip-Flexor-Stretch.png', equipment: 'Poids du corps', muscleGroups: ['Hanches'] },
  { id: '4', name: 'Jumping Jacks', category: 'Échauffement', description: 'Excellent exercice cardiovasculaire pour augmenter la fréquence cardiaque avant un entraînement.', videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtEg', illustrationUrl: 'https://img.gymvisual.com/illustrations/283/male-Jumping-Jack.png', equipment: 'Poids du corps', muscleGroups: ['Cardio'] },
  { id: '5', name: 'Soulevé de terre', category: 'Musculation', description: 'Exercice polyarticulaire qui sollicite presque tous les muscles du corps.', videoUrl: 'https://www.youtube.com/embed/wjsu6ce24I', illustrationUrl: 'https://img.gymvisual.com/illustrations/399/male-Barbell-Deadlift.png', equipment: 'Barre olympique', alternativeIds: ['1'], muscleGroups: ['Dos', 'Ischio-jambiers', 'Lombaires'] },
  { id: '6', name: 'Rameur', category: 'Échauffement', description: 'Échauffement complet du corps, à la fois cardiovasculaire et musculaire.', videoUrl: 'https://www.youtube.com/embed/H0r_Zge283g', illustrationUrl: 'https://img.gymvisual.com/illustrations/105/male-Rowing-Machine.png', equipment: 'Machine à charge guidée', muscleGroups: ['Cardio', 'Dos', 'Jambes'] },
];


export const WORKOUT_PROGRAMS_DB: WorkoutProgram[] = [];
export const WORKOUT_SESSIONS_DB: any[] = []; // Using 'any' for simplicity, could be a more specific standalone session type
export const NUTRITION_PLANS_DB: NutritionPlan[] = [];