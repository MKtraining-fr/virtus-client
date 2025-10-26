import { test, expect, describe, vi } from 'vitest';
import { retryAsync, isRetryableError, retryOnNetworkError } from './retry';

// Mock du temps pour les tests de délai
vi.useFakeTimers();

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

describe('retry.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('Retry réussit après 2 échecs', async () => {
    const flakeyFn = vi.fn(createFlakeyFunction(2, 'success', 'Erreur temporaire'));

    const promise = retryAsync(flakeyFn, { maxAttempts: 3, delayMs: 100 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('success');
    expect(flakeyFn).toHaveBeenCalledTimes(3);
  });

  test('Retry échoue après épuisement des tentatives', async () => {
    const alwaysFailFn = vi.fn(async () => {
      throw new Error('Erreur permanente');
    });

    const promise = retryAsync(alwaysFailFn, { maxAttempts: 3, delayMs: 100 });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('Erreur permanente');
    expect(alwaysFailFn).toHaveBeenCalledTimes(3);
  });

  test('Backoff exponentiel fonctionne', async () => {
    const flakeyFn = vi.fn(createFlakeyFunction(2, 'success', 'Erreur temporaire'));
    const onRetry = vi.fn();

    const promise = retryAsync(flakeyFn, {
      maxAttempts: 3,
      delayMs: 100,
      backoffMultiplier: 2,
      onRetry,
    });

    // 1ère tentative (échec)
    expect(flakeyFn).toHaveBeenCalledTimes(1);

    // 2ème tentative après 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(flakeyFn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);

    // 3ème tentative après 200ms (100 * 2)
    await vi.advanceTimersByTimeAsync(200);
    expect(flakeyFn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);

    await expect(networkPromise).resolves.toBe('success');
  });

  test('isRetryableError détecte les erreurs temporaires', () => {
    expect(isRetryableError(new Error('Network error'))).toBe(true);
    expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
    expect(isRetryableError(new Error('Service unavailable'))).toBe(true);
    expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    expect(isRetryableError(new Error('Permission denied'))).toBe(false);
    expect(isRetryableError('Not an Error object')).toBe(false);
  });

  test('retryOnNetworkError ne retry que les erreurs réseau', async () => {
    // Test 1: Erreur réseau → devrait retry
    const networkErrorFn = vi.fn(createFlakeyFunction(2, 'success', 'Network error'));
    const networkPromise = retryOnNetworkError(networkErrorFn, { maxAttempts: 3, delayMs: 100 });
    await vi.runAllTimersAsync();
    await expect(networkPromise).resolves.toBe('success');
    expect(networkErrorFn).toHaveBeenCalledTimes(3);

    // Test 2: Erreur non-réseau → devrait échouer immédiatement
    const logicErrorFn = vi.fn(async () => {
      throw new Error('Invalid input');
    });

    const logicPromise = retryOnNetworkError(logicErrorFn, { maxAttempts: 3, delayMs: 100 });
    await expect(logicPromise).rejects.toThrow('Invalid input');
    expect(logicErrorFn).toHaveBeenCalledTimes(1); // Seulement 1 appel
  });
});

vi.useRealTimers();
