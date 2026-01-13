/**
 * Utilitaires pour les calculs de charge et de 1RM
 */

/**
 * Calcule le 1RM estimé à partir du poids et des répétitions
 * Utilise la formule de Brzycki: 1RM = weight / (1.0278 - 0.0278 * reps)
 */
export const calculateOneRM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
};

/**
 * Calcule la charge projetée à partir du 1RM et du nombre de répétitions
 * Formule inverse de Brzycki: weight = 1RM * (1.0278 - 0.0278 * reps)
 */
export const calculateProjectedWeight = (oneRM: number, reps: number): number => {
  return oneRM * (1.0278 - 0.0278 * reps);
};

/**
 * Calcule la charge à partir d'un pourcentage du 1RM
 * @param percentage - Pourcentage (ex: 80 pour 80%)
 * @param oneRM - 1RM de référence en kg
 * @returns Charge calculée arrondie au 0.5 kg près
 */
export const calculateLoadFromPercentage = (percentage: number, oneRM: number): number => {
  const load = (percentage / 100) * oneRM;
  return roundToHalf(load);
};

/**
 * Arrondit un nombre au 0.5 le plus proche
 * Exemples: 64.2 → 64, 64.3 → 64.5, 64.7 → 64.5, 64.8 → 65
 */
export const roundToHalf = (value: number): number => {
  return Math.round(value * 2) / 2;
};

/**
 * Formate l'affichage de la charge avec pourcentage et valeur calculée
 * @param percentage - Pourcentage (ex: 80)
 * @param calculatedLoad - Charge calculée en kg (optionnel)
 * @returns String formatée (ex: "80% (64 kg)" ou "80%")
 */
export const formatLoadDisplay = (percentage: number, calculatedLoad?: number): string => {
  if (calculatedLoad !== undefined && calculatedLoad > 0) {
    return `${percentage}% (${calculatedLoad} kg)`;
  }
  return `${percentage}%`;
};
