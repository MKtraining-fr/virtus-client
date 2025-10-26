import { describe, test, expect } from 'vitest';
import {
  SignUpSchema,
  SignInSchema,
  CreateExerciseSchema,
  AddFoodItemSchema,
  validateWithSchema,
  sanitizeString,
  validateAndSanitizeEmail,
} from './schemas';

// Fonction utilitaire pour extraire les messages d'erreur de Zod
const getErrorMessages = (result: any): string[] => {
  if (result.success) return [];
  // La fonction validateWithSchema retourne un tableau de chaînes de caractères pour les erreurs
  return result.errors;
};

describe('Validation Schemas', () => {
  // ---- TESTS SIGN UP ----
  describe('SignUpSchema', () => {
    const validSignUp = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'client' as const,
      phone: '0612345678',
      age: 25,
    };

    test('should pass with valid data', () => {
      const result = validateWithSchema(SignUpSchema, validSignUp);
      expect(result.success).toBe(true);
    });

    test('should fail with invalid email', () => {
      const invalidEmail = { ...validSignUp, email: 'invalid-email' };
      const result = validateWithSchema(SignUpSchema, invalidEmail);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain('email: Adresse email invalide');
    });

    test('should fail with weak password', () => {
      const weakPassword = { ...validSignUp, password: 'weak' };
      const result = validateWithSchema(SignUpSchema, weakPassword);
      expect(result.success).toBe(false);
      const errors = getErrorMessages(result);
      // Zod retourne toutes les erreurs pour les champs qui échouent.
      // Nous vérifions si au moins un message d'erreur contient le mot-clé du champ.
      expect(errors).toContain('password: Le mot de passe doit contenir au moins 8 caractères');
      expect(errors).toContain('password: Le mot de passe doit contenir au moins une majuscule');
      expect(errors).toContain('password: Le mot de passe doit contenir au moins un chiffre');
      expect(errors).toContain(
        'password: Le mot de passe doit contenir au moins un caractère spécial'
      );
    });

    test('should fail with too short first name', () => {
      const shortFirstName = { ...validSignUp, firstName: 'J' };
      const result = validateWithSchema(SignUpSchema, shortFirstName);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain(
        'firstName: Le prénom doit contenir au moins 2 caractères'
      );
    });

    test('should fail with invalid age (< 13)', () => {
      const invalidAge = { ...validSignUp, age: 10 };
      const result = validateWithSchema(SignUpSchema, invalidAge);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain("age: L'âge minimum est de 13 ans");
    });
  });

  // ---- TESTS SIGN IN ----
  describe('SignInSchema', () => {
    const validSignIn = {
      email: 'test@example.com',
      password: 'anypassword',
    };

    test('should pass with valid data', () => {
      const result = validateWithSchema(SignInSchema, validSignIn);
      expect(result.success).toBe(true);
    });

    test('should fail with empty email', () => {
      const emptyEmail = { ...validSignIn, email: '' };
      const result = validateWithSchema(SignInSchema, emptyEmail);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain('email: Adresse email invalide');
    });
  });

  // ---- TESTS EXERCICES ----
  describe('CreateExerciseSchema', () => {
    const validExercise = {
      name: 'Squat',
      category: 'Musculation' as const,
      description: 'Exercice de base pour les jambes',
      videoUrl: 'https://example.com/video.mp4',
      illustrationUrl: 'https://example.com/image.jpg',
    };

    test('should pass with valid exercise data', () => {
      const result = validateWithSchema(CreateExerciseSchema, validExercise);
      expect(result.success).toBe(true);
    });

    test('should fail with invalid category', () => {
      const invalidCategory = { ...validExercise, category: 'InvalidCategory' };
      const result = validateWithSchema(CreateExerciseSchema, invalidCategory);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain(
        'category: La catégorie doit être Musculation, Mobilité ou Échauffement'
      );
    });
  });

  // ---- TESTS ALIMENTS ----
  describe('AddFoodItemSchema', () => {
    const validFood = {
      name: 'Poulet',
      category: 'Viandes',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    };

    test('should pass with valid food data', () => {
      const result = validateWithSchema(AddFoodItemSchema, validFood);
      expect(result.success).toBe(true);
    });

    test('should fail with negative calories', () => {
      const negativeCalories = { ...validFood, calories: -100 };
      const result = validateWithSchema(AddFoodItemSchema, negativeCalories);
      expect(result.success).toBe(false);
      expect(getErrorMessages(result)).toContain(
        'calories: Les calories ne peuvent pas être négatives'
      );
    });
  });

  // ---- TESTS UTILITAIRES ----
  describe('Utility Functions', () => {
    test('sanitizeString should sanitize XSS input', () => {
      const xssInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizeString(xssInput);
      // L'assertion doit correspondre à la sortie réelle de la fonction de nettoyage, qui échappe les guillemets.
      // La sortie réelle est &lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;      expect(sanitized).toContain('&#x2F;script&gt;');
      expect(sanitized).toContain('&lt;&#x2F;script&gt;');
      expect(sanitized).toContain('&quot;');
    });

    test('validateAndSanitizeEmail should validate and sanitize a valid email', () => {
      const validEmailTest = validateAndSanitizeEmail('  TEST@EXAMPLE.COM  ');
      expect(validEmailTest).toBe('test@example.com');
    });

    test('validateAndSanitizeEmail should return null for an invalid email', () => {
      const invalidEmailTest = validateAndSanitizeEmail('not-an-email');
      expect(invalidEmailTest).toBe(null);
    });
  });
});
