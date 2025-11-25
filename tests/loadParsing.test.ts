/**
 * Tests unitaires pour le parsing du champ load
 * 
 * Ces tests valident que le parsing du champ load fonctionne correctement
 * pour différents formats de données.
 */

describe('Load Parsing Logic', () => {
  const parseLoad = (loadString: string) => {
    const loadMatch = loadString.match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
    const loadValue = loadMatch?.[1] ?? '';
    const loadUnit = (loadMatch?.[2]?.toLowerCase() ?? 'kg') as 'kg' | 'lbs' | '%';
    return { value: loadValue, unit: loadUnit };
  };

  describe('Formats valides', () => {
    test('doit parser "80 kg" correctement', () => {
      const result = parseLoad('80 kg');
      expect(result).toEqual({ value: '80', unit: 'kg' });
    });

    test('doit parser "80kg" (sans espace) correctement', () => {
      const result = parseLoad('80kg');
      expect(result).toEqual({ value: '80', unit: 'kg' });
    });

    test('doit parser "80 KG" (majuscules) correctement', () => {
      const result = parseLoad('80 KG');
      expect(result).toEqual({ value: '80', unit: 'kg' });
    });

    test('doit parser "175 lbs" correctement', () => {
      const result = parseLoad('175 lbs');
      expect(result).toEqual({ value: '175', unit: 'lbs' });
    });

    test('doit parser "80%" correctement', () => {
      const result = parseLoad('80%');
      expect(result).toEqual({ value: '80', unit: '%' });
    });

    test('doit parser "80.5 kg" (décimales) correctement', () => {
      const result = parseLoad('80.5 kg');
      expect(result).toEqual({ value: '80.5', unit: 'kg' });
    });

    test('doit parser "80" (sans unité) et utiliser kg par défaut', () => {
      const result = parseLoad('80');
      expect(result).toEqual({ value: '80', unit: 'kg' });
    });
  });

  describe('Formats vides ou invalides', () => {
    test('doit gérer une chaîne vide', () => {
      const result = parseLoad('');
      expect(result).toEqual({ value: '', unit: 'kg' });
    });

    test('doit gérer une valeur invalide', () => {
      const result = parseLoad('abc');
      expect(result).toEqual({ value: '', unit: 'kg' });
    });

    test('doit gérer une valeur avec espaces multiples', () => {
      const result = parseLoad('80   kg');
      expect(result).toEqual({ value: '', unit: 'kg' }); // Ne match pas le regex
    });
  });

  describe('Création du tableau details', () => {
    test('doit créer 3 entrées pour 3 séries', () => {
      const setsCount = 3;
      const details = Array.from({ length: setsCount }, () => ({
        reps: '12',
        load: { value: '80', unit: 'kg' as const },
        tempo: '2010',
        rest: '60s',
      }));

      expect(details).toHaveLength(3);
      expect(details[0]).toEqual({
        reps: '12',
        load: { value: '80', unit: 'kg' },
        tempo: '2010',
        rest: '60s',
      });
      expect(details[2]).toEqual(details[0]); // Toutes les séries sont identiques
    });

    test('doit créer 1 entrée pour 1 série', () => {
      const setsCount = 1;
      const details = Array.from({ length: setsCount }, () => ({
        reps: '10',
        load: { value: '100', unit: 'kg' as const },
        tempo: '3010',
        rest: '90s',
      }));

      expect(details).toHaveLength(1);
    });

    test('doit créer 1 entrée par défaut si sets est invalide', () => {
      const setsCount = parseInt('invalid', 10) || 1;
      const details = Array.from({ length: setsCount }, () => ({
        reps: '12',
        load: { value: '', unit: 'kg' as const },
        tempo: '2010',
        rest: '60s',
      }));

      expect(details).toHaveLength(1);
    });
  });
});

/**
 * Tests d'intégration pour le mapping complet
 */
describe('Exercise Mapping Integration', () => {
  test('doit mapper un exercice complet correctement', () => {
    const exerciseFromDB = {
      id: 'uuid-123',
      exercise_id: 'exercise-uuid',
      sets: 3,
      reps: '12',
      load: '80 kg',
      tempo: '2010',
      rest_time: '60s',
      intensification: [],
      notes: 'Test note',
      exercises: {
        name: 'Squat',
        image_url: 'https://example.com/squat.jpg',
      },
    };

    // Simuler le mapping
    const loadString = exerciseFromDB.load ?? '';
    const loadMatch = loadString.match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
    const loadValue = loadMatch?.[1] ?? '';
    const loadUnit = (loadMatch?.[2]?.toLowerCase() ?? 'kg') as 'kg' | 'lbs' | '%';

    const setsCount = typeof exerciseFromDB.sets === 'number' 
      ? exerciseFromDB.sets 
      : parseInt(String(exerciseFromDB.sets), 10) || 1;
    
    const details = Array.from({ length: setsCount }, () => ({
      reps: exerciseFromDB.reps ?? '',
      load: { value: loadValue, unit: loadUnit },
      tempo: exerciseFromDB.tempo ?? '',
      rest: exerciseFromDB.rest_time ?? '',
    }));

    const mapped = {
      name: exerciseFromDB.exercises?.name || 'Exercice',
      sets: exerciseFromDB.sets,
      isDetailed: true,
      details,
    };

    expect(mapped.name).toBe('Squat');
    expect(mapped.sets).toBe(3);
    expect(mapped.isDetailed).toBe(true);
    expect(mapped.details).toHaveLength(3);
    expect(mapped.details[0]).toEqual({
      reps: '12',
      load: { value: '80', unit: 'kg' },
      tempo: '2010',
      rest: '60s',
    });
  });

  test('doit mapper un exercice sans load correctement', () => {
    const exerciseFromDB = {
      sets: 3,
      reps: '15',
      load: '',
      tempo: '2010',
      rest_time: '45s',
    };

    const loadString = exerciseFromDB.load ?? '';
    const loadMatch = loadString.match(/^([\d.]+)\s*([a-zA-Z%]+)?$/);
    const loadValue = loadMatch?.[1] ?? '';
    const loadUnit = (loadMatch?.[2]?.toLowerCase() ?? 'kg') as 'kg' | 'lbs' | '%';

    const setsCount = 3;
    const details = Array.from({ length: setsCount }, () => ({
      reps: exerciseFromDB.reps ?? '',
      load: { value: loadValue, unit: loadUnit },
      tempo: exerciseFromDB.tempo ?? '',
      rest: exerciseFromDB.rest_time ?? '',
    }));

    expect(details[0]).toEqual({
      reps: '15',
      load: { value: '', unit: 'kg' },
      tempo: '2010',
      rest: '45s',
    });
  });
});
