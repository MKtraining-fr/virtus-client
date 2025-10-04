/**
 * Tests pour les schémas de validation Zod
 * Ces tests vérifient que la validation fonctionne correctement
 */

import {
  SignUpSchema,
  SignInSchema,
  UpdateClientProfileSchema,
  CreateExerciseSchema,
  AddFoodItemSchema,
  validateWithSchema,
  sanitizeString,
  validateAndSanitizeEmail,
} from './schemas';

// ---- TESTS SIGN UP ----

console.log('=== Tests SignUpSchema ===\n');

// Test 1: Données valides
const validSignUp = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'client' as const,
  phone: '0612345678',
  age: 25,
};

const result1 = validateWithSchema(SignUpSchema, validSignUp);
console.log('✅ Test 1 - Données valides:', result1.success ? 'PASS' : 'FAIL');
if (!result1.success) console.log('Erreurs:', result1.errors);

// Test 2: Email invalide
const invalidEmail = { ...validSignUp, email: 'invalid-email' };
const result2 = validateWithSchema(SignUpSchema, invalidEmail);
console.log('✅ Test 2 - Email invalide:', !result2.success ? 'PASS' : 'FAIL');
if (!result2.success) console.log('Erreurs attendues:', result2.errors);

// Test 3: Mot de passe faible
const weakPassword = { ...validSignUp, password: 'weak' };
const result3 = validateWithSchema(SignUpSchema, weakPassword);
console.log('✅ Test 3 - Mot de passe faible:', !result3.success ? 'PASS' : 'FAIL');
if (!result3.success) console.log('Erreurs attendues:', result3.errors);

// Test 4: Prénom trop court
const shortFirstName = { ...validSignUp, firstName: 'J' };
const result4 = validateWithSchema(SignUpSchema, shortFirstName);
console.log('✅ Test 4 - Prénom trop court:', !result4.success ? 'PASS' : 'FAIL');
if (!result4.success) console.log('Erreurs attendues:', result4.errors);

// Test 5: Âge invalide
const invalidAge = { ...validSignUp, age: 10 };
const result5 = validateWithSchema(SignUpSchema, invalidAge);
console.log('✅ Test 5 - Âge invalide (< 13):', !result5.success ? 'PASS' : 'FAIL');
if (!result5.success) console.log('Erreurs attendues:', result5.errors);

// ---- TESTS SIGN IN ----

console.log('\n=== Tests SignInSchema ===\n');

// Test 6: Connexion valide
const validSignIn = {
  email: 'test@example.com',
  password: 'anypassword',
};

const result6 = validateWithSchema(SignInSchema, validSignIn);
console.log('✅ Test 6 - Connexion valide:', result6.success ? 'PASS' : 'FAIL');

// Test 7: Email vide
const emptyEmail = { ...validSignIn, email: '' };
const result7 = validateWithSchema(SignInSchema, emptyEmail);
console.log('✅ Test 7 - Email vide:', !result7.success ? 'PASS' : 'FAIL');

// ---- TESTS EXERCICES ----

console.log('\n=== Tests CreateExerciseSchema ===\n');

// Test 8: Exercice valide
const validExercise = {
  name: 'Squat',
  category: 'Musculation' as const,
  description: 'Exercice de base pour les jambes',
  videoUrl: 'https://example.com/video.mp4',
  illustrationUrl: 'https://example.com/image.jpg',
};

const result8 = validateWithSchema(CreateExerciseSchema, validExercise);
console.log('✅ Test 8 - Exercice valide:', result8.success ? 'PASS' : 'FAIL');

// Test 9: Catégorie invalide
const invalidCategory = { ...validExercise, category: 'InvalidCategory' };
const result9 = validateWithSchema(CreateExerciseSchema, invalidCategory);
console.log('✅ Test 9 - Catégorie invalide:', !result9.success ? 'PASS' : 'FAIL');

// ---- TESTS ALIMENTS ----

console.log('\n=== Tests AddFoodItemSchema ===\n');

// Test 10: Aliment valide
const validFood = {
  name: 'Poulet',
  category: 'Viandes',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
};

const result10 = validateWithSchema(AddFoodItemSchema, validFood);
console.log('✅ Test 10 - Aliment valide:', result10.success ? 'PASS' : 'FAIL');

// Test 11: Calories négatives
const negativeCalories = { ...validFood, calories: -100 };
const result11 = validateWithSchema(AddFoodItemSchema, negativeCalories);
console.log('✅ Test 11 - Calories négatives:', !result11.success ? 'PASS' : 'FAIL');

// ---- TESTS UTILITAIRES ----

console.log('\n=== Tests Utilitaires ===\n');

// Test 12: Sanitization XSS
const xssInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeString(xssInput);
console.log('✅ Test 12 - Sanitization XSS:', !sanitized.includes('<script>') ? 'PASS' : 'FAIL');
console.log('Résultat:', sanitized);

// Test 13: Validation email
const validEmailTest = validateAndSanitizeEmail('  TEST@EXAMPLE.COM  ');
console.log('✅ Test 13 - Validation email:', validEmailTest === 'test@example.com' ? 'PASS' : 'FAIL');
console.log('Résultat:', validEmailTest);

// Test 14: Email invalide
const invalidEmailTest = validateAndSanitizeEmail('not-an-email');
console.log('✅ Test 14 - Email invalide:', invalidEmailTest === null ? 'PASS' : 'FAIL');

// ---- RÉSUMÉ ----

console.log('\n=== Résumé des Tests ===\n');
console.log('Tous les tests de validation ont été exécutés.');
console.log('Vérifiez que tous les tests affichent "PASS".');
console.log('\nSi des tests échouent, vérifiez les schémas de validation dans schemas.ts');
