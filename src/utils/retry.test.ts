import { retryAsync, isRetryableError, retryOnNetworkError } from './retry';

/**
 * Tests pour le système de retry
 * 
 * Exécution : npx tsx src/utils/retry.test.ts
 */

// Fonction utilitaire pour créer une fonction qui échoue N fois puis réussit
function createFlakeyFunction<T>(failCount: number, result: T, errorMessage: string) {
  let attempts = 0;
  return async () => {
    attempts++;
    if (attempts <= failCount) {
      throw new Error(errorMessage);
    }
    return result;
  };
}

async function testRetrySuccess() {
  console.log('\n🧪 Test 1: Retry réussit après 2 échecs');
  
  const flakeyFn = createFlakeyFunction(2, 'success', 'Erreur temporaire');
  
  try {
    const result = await retryAsync(flakeyFn, {
      maxAttempts: 3,
      delayMs: 100,
    });
    
    if (result === 'success') {
      console.log('✅ Test réussi : La fonction a réussi après 2 échecs');
    } else {
      console.log('❌ Test échoué : Résultat inattendu');
    }
  } catch (error) {
    console.log('❌ Test échoué : Une erreur a été levée alors que la fonction aurait dû réussir');
  }
}

async function testRetryFailure() {
  console.log('\n🧪 Test 2: Retry échoue après épuisement des tentatives');
  
  const alwaysFailFn = async () => {
    throw new Error('Erreur permanente');
  };
  
  try {
    await retryAsync(alwaysFailFn, {
      maxAttempts: 3,
      delayMs: 100,
    });
    console.log('❌ Test échoué : Aucune erreur n\'a été levée');
  } catch (error) {
    if (error instanceof Error && error.message === 'Erreur permanente') {
      console.log('✅ Test réussi : L\'erreur a été correctement propagée après 3 tentatives');
    } else {
      console.log('❌ Test échoué : Erreur inattendue');
    }
  }
}

async function testRetryBackoff() {
  console.log('\n🧪 Test 3: Backoff exponentiel fonctionne');
  
  const delays: number[] = [];
  let lastTime = Date.now();
  
  const flakeyFn = createFlakeyFunction(2, 'success', 'Erreur temporaire');
  
  await retryAsync(flakeyFn, {
    maxAttempts: 3,
    delayMs: 100,
    backoffMultiplier: 2,
    onRetry: () => {
      const now = Date.now();
      delays.push(now - lastTime);
      lastTime = now;
    },
  });
  
  // Le premier délai devrait être ~100ms, le second ~200ms
  if (delays.length === 2 && delays[0] >= 90 && delays[1] >= 180) {
    console.log('✅ Test réussi : Le backoff exponentiel fonctionne correctement');
    console.log(`   Délais mesurés : ${delays.map(d => `${d}ms`).join(', ')}`);
  } else {
    console.log('❌ Test échoué : Les délais ne correspondent pas au backoff attendu');
    console.log(`   Délais mesurés : ${delays.map(d => `${d}ms`).join(', ')}`);
  }
}

function testIsRetryableError() {
  console.log('\n🧪 Test 4: Détection des erreurs temporaires');
  
  const tests = [
    { error: new Error('Network error'), expected: true },
    { error: new Error('Connection timeout'), expected: true },
    { error: new Error('Service unavailable'), expected: true },
    { error: new Error('Invalid input'), expected: false },
    { error: new Error('Permission denied'), expected: false },
    { error: 'Not an Error object', expected: false },
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(({ error, expected }) => {
    const result = isRetryableError(error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (result === expected) {
      console.log(`✅ "${errorMsg}" → ${result} (attendu: ${expected})`);
      passed++;
    } else {
      console.log(`❌ "${errorMsg}" → ${result} (attendu: ${expected})`);
      failed++;
    }
  });
  
  console.log(`\nRésultat : ${passed}/${tests.length} tests réussis`);
}

async function testRetryOnNetworkError() {
  console.log('\n🧪 Test 5: retryOnNetworkError ne retry que les erreurs réseau');
  
  // Test 1: Erreur réseau → devrait retry
  const networkErrorFn = createFlakeyFunction(2, 'success', 'Network error');
  
  try {
    const result = await retryOnNetworkError(networkErrorFn, {
      maxAttempts: 3,
      delayMs: 100,
    });
    
    if (result === 'success') {
      console.log('✅ Erreur réseau : Retry effectué avec succès');
    } else {
      console.log('❌ Erreur réseau : Résultat inattendu');
    }
  } catch (error) {
    console.log('❌ Erreur réseau : Une erreur a été levée alors que la fonction aurait dû réussir');
  }
  
  // Test 2: Erreur non-réseau → devrait échouer immédiatement
  const logicErrorFn = async () => {
    throw new Error('Invalid input');
  };
  
  try {
    await retryOnNetworkError(logicErrorFn, {
      maxAttempts: 3,
      delayMs: 100,
    });
    console.log('❌ Erreur logique : Aucune erreur n\'a été levée');
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid input') {
      console.log('✅ Erreur logique : Erreur propagée sans retry');
    } else {
      console.log('❌ Erreur logique : Erreur inattendue');
    }
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 Tests du système de retry');
  console.log('='.repeat(60));
  
  await testRetrySuccess();
  await testRetryFailure();
  await testRetryBackoff();
  testIsRetryableError();
  await testRetryOnNetworkError();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Tous les tests sont terminés');
  console.log('='.repeat(60) + '\n');
}

// Exécuter les tests si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
