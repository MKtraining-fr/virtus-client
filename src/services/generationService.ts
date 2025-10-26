/**
 * Service de génération de contenu pour les plans d'entraînement et de nutrition
 * Ce service fournit des templates prédéfinis sans dépendance à des API externes
 */

/**
 * Génère une description de plan d'entraînement basée sur le nom du programme
 * @param programName Le nom du programme d'entraînement
 * @returns Une description motivante du programme
 */
export const generateWorkoutPlan = async (programName: string): Promise<string> => {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 500));

  const templates = [
    `Le programme "${programName}" est conçu pour vous aider à atteindre vos objectifs de fitness grâce à des séances d'entraînement structurées et progressives. Chaque session est optimisée pour maximiser vos résultats tout en respectant votre niveau actuel.`,
    `"${programName}" combine des exercices ciblés et une progression adaptée pour développer votre force, votre endurance et votre condition physique générale. Préparez-vous à repousser vos limites !`,
    `Découvrez "${programName}", un programme complet qui vous accompagne vers l'excellence physique. Des séances variées et motivantes vous attendent pour transformer votre corps et votre esprit.`,
    `Le programme "${programName}" est votre allié pour une transformation durable. Avec des exercices soigneusement sélectionnés et une progression intelligente, atteignez vos objectifs en toute confiance.`,
  ];

  // Sélection d'un template basé sur le hash du nom du programme pour la cohérence
  const index = Math.abs(hashString(programName)) % templates.length;
  return templates[index];
};

/**
 * Génère un plan alimentaire structuré basé sur l'objectif
 * @param planName Le nom ou l'objectif du plan alimentaire
 * @returns Un objet contenant les repas de la journée
 */
export const generateMealPlan = async (planName: string): Promise<Record<string, string>> => {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mealPlans: Record<string, Record<string, string>> = {
    perte_de_poids: {
      petit_dejeuner:
        "Flocons d'avoine (50g) avec des fruits rouges (100g) et une poignée d'amandes (15g).",
      collation_du_matin: 'Yaourt grec 0% (150g) avec une cuillère de miel (10g).',
      dejeuner:
        'Poitrine de poulet grillée (150g), quinoa (150g cuit) et légumes verts à la vapeur (200g).',
      collation_de_l_apres_midi:
        'Une pomme (150g) avec une cuillère de beurre de cacahuètes (15g).',
      diner:
        'Filet de saumon au four (150g) avec des patates douces rôties (150g) et des brocolis (200g).',
    },
    prise_de_masse: {
      petit_dejeuner: 'Omelette 4 œufs avec fromage (30g), pain complet (80g) et avocat (1/2).',
      collation_du_matin: "Shake protéiné (30g whey) avec une banane et flocons d'avoine (50g).",
      dejeuner:
        "Bœuf maigre (200g), riz basmati (250g cuit), haricots verts (150g) et huile d'olive (15ml).",
      collation_de_l_apres_midi: 'Fromage blanc (200g) avec des noix (30g) et du miel (20g).',
      diner: 'Saumon (200g), pâtes complètes (200g cuites), épinards (200g) et parmesan (20g).',
    },
    maintien: {
      petit_dejeuner:
        "Porridge d'avoine (60g) avec lait demi-écrémé, fruits secs (20g) et cannelle.",
      collation_du_matin: 'Fruits frais de saison (150g) et quelques amandes (15g).',
      dejeuner: 'Poulet rôti (150g), boulgour (180g cuit), légumes méditerranéens grillés (200g).',
      collation_de_l_apres_midi: 'Pain complet (40g) avec beurre de cacahuète (20g).',
      diner:
        "Poisson blanc (150g), riz complet (150g cuit), ratatouille (200g) et huile d'olive (10ml).",
    },
    vegetarien: {
      petit_dejeuner:
        'Smoothie bowl aux fruits (banane, fruits rouges) avec granola (40g) et graines de chia (10g).',
      collation_du_matin: 'Houmous (50g) avec bâtonnets de légumes crus (150g).',
      dejeuner: 'Tofu grillé (150g), quinoa (200g cuit), légumes sautés (200g) et sauce soja.',
      collation_de_l_apres_midi:
        "Yaourt végétal (150g) avec des noix (20g) et du sirop d'érable (10g).",
      diner: 'Curry de lentilles (250g) avec riz basmati (150g cuit) et épinards (150g).',
    },
    default: {
      petit_dejeuner: "Flocons d'avoine (60g) avec lait, fruits frais (100g) et amandes (15g).",
      collation_du_matin: 'Yaourt nature (150g) avec une cuillère de miel (10g).',
      dejeuner:
        'Protéine au choix (150g), féculents complets (180g cuit) et légumes variés (200g).',
      collation_de_l_apres_midi: "Fruit de saison (150g) avec une poignée d'oléagineux (15g).",
      diner:
        'Poisson ou viande maigre (150g), accompagnement de féculents (150g) et légumes (200g).',
    },
  };

  // Déterminer le type de plan basé sur le nom
  const planLower = planName.toLowerCase();
  let selectedPlan = mealPlans.default;

  if (planLower.includes('perte') || planLower.includes('poids') || planLower.includes('sèche')) {
    selectedPlan = mealPlans.perte_de_poids;
  } else if (
    planLower.includes('masse') ||
    planLower.includes('muscle') ||
    planLower.includes('volume')
  ) {
    selectedPlan = mealPlans.prise_de_masse;
  } else if (planLower.includes('maintien') || planLower.includes('équilibre')) {
    selectedPlan = mealPlans.maintien;
  } else if (planLower.includes('végé') || planLower.includes('vegan')) {
    selectedPlan = mealPlans.vegetarien;
  }

  return selectedPlan;
};

/**
 * Fonction utilitaire pour générer un hash simple d'une chaîne
 * @param str La chaîne à hasher
 * @returns Un nombre entier représentant le hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Conversion en entier 32 bits
  }
  return hash;
}
