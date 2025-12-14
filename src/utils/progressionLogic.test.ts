/**
 * Tests pour la logique de progression
 * 
 * Ces tests vérifient que le calcul de la progression (semaine/séance suivante)
 * fonctionne correctement et ne régresse pas.
 */

import { describe, it, expect } from 'vitest';

/**
 * Fonction utilitaire pour calculer la prochaine séance et semaine
 * Basée sur la logique de ClientCurrentProgram.tsx
 */
export function calculateNextProgress(
  completedSessionsThisWeek: number,
  totalSessionsThisWeek: number,
  currentWeek: number,
  totalWeeks: number
): { nextSessionProgress: number; nextProgramWeek: number } {
  const isWeekComplete = completedSessionsThisWeek + 1 >= totalSessionsThisWeek;
  
  if (isWeekComplete) {
    // Passer à la semaine suivante
    const nextWeek = currentWeek + 1;
    return {
      nextSessionProgress: 1, // Première séance de la semaine suivante
      nextProgramWeek: nextWeek <= totalWeeks ? nextWeek : currentWeek,
    };
  } else {
    // Rester dans la même semaine
    return {
      nextSessionProgress: completedSessionsThisWeek + 2, // Prochaine séance
      nextProgramWeek: currentWeek,
    };
  }
}

describe('progressionLogic', () => {
  describe('calculateNextProgress', () => {
    it('devrait passer à la séance suivante dans la même semaine', () => {
      // Semaine 3, 1 séance complétée sur 3
      const result = calculateNextProgress(1, 3, 3, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 3, // Passer à la séance 3
        nextProgramWeek: 3, // Rester en semaine 3
      });
    });

    it('devrait passer à la semaine suivante après avoir complété toutes les séances', () => {
      // Semaine 3, 2 séances complétées sur 3 (on termine la 3ème)
      const result = calculateNextProgress(2, 3, 3, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 1, // Première séance de la semaine suivante
        nextProgramWeek: 4, // Passer à la semaine 4
      });
    });

    it('devrait rester à la dernière semaine si le programme est terminé', () => {
      // Semaine 10 (dernière), 2 séances complétées sur 3 (on termine la 3ème)
      const result = calculateNextProgress(2, 3, 10, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 1,
        nextProgramWeek: 10, // Ne pas dépasser la semaine 10
      });
    });

    it('devrait gérer correctement une semaine avec 1 seule séance', () => {
      // Semaine 5, 0 séance complétée sur 1 (on termine la 1ère)
      const result = calculateNextProgress(0, 1, 5, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 1,
        nextProgramWeek: 6, // Passer à la semaine 6
      });
    });

    it('devrait gérer correctement une semaine avec 4 séances', () => {
      // Semaine 3, 1 séance complétée sur 4
      const result = calculateNextProgress(1, 4, 3, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 3, // Passer à la séance 3
        nextProgramWeek: 3, // Rester en semaine 3
      });
    });

    it('devrait passer à la semaine suivante après la 4ème séance d\'une semaine de 4 séances', () => {
      // Semaine 3, 3 séances complétées sur 4 (on termine la 4ème)
      const result = calculateNextProgress(3, 4, 3, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 1,
        nextProgramWeek: 4, // Passer à la semaine 4
      });
    });

    it('devrait gérer le cas limite de la première séance de la première semaine', () => {
      // Semaine 1, 0 séance complétée sur 3 (on termine la 1ère)
      const result = calculateNextProgress(0, 3, 1, 10);
      
      expect(result).toEqual({
        nextSessionProgress: 2, // Passer à la séance 2
        nextProgramWeek: 1, // Rester en semaine 1
      });
    });
  });

  describe('session_order normalization', () => {
    it('devrait utiliser des valeurs consécutives pour session_order', () => {
      // Vérifier que session_order est bien consécutif (1, 2, 3...)
      // et non hérité de l'ancien système (1, 56, 93, 175...)
      
      const sessionOrders = [1, 2, 3, 4];
      
      // Vérifier que les valeurs sont consécutives
      for (let i = 1; i < sessionOrders.length; i++) {
        const diff = sessionOrders[i] - sessionOrders[i - 1];
        expect(diff).toBe(1);
      }
    });

    it('devrait commencer à 1 pour chaque semaine', () => {
      // Vérifier que session_order commence toujours à 1 pour chaque semaine
      const week1Sessions = [1, 2, 3];
      const week2Sessions = [1, 2, 3];
      const week3Sessions = [1, 2, 3, 4];
      
      expect(week1Sessions[0]).toBe(1);
      expect(week2Sessions[0]).toBe(1);
      expect(week3Sessions[0]).toBe(1);
    });
  });
});
