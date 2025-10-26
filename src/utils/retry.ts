import { logWarn, logError } from './logger';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Fonction utilitaire pour réessayer une opération asynchrone en cas d'échec
 *
 * @param fn - Fonction asynchrone à exécuter
 * @param options - Options de retry
 * @returns Le résultat de la fonction si elle réussit
 * @throws La dernière erreur si toutes les tentatives échouent
 *
 * Utilisation :
 * const data = await retryAsync(() => getDocs(collection(db, 'users')), {
 *   maxAttempts: 3,
 *   delayMs: 1000,
 * });
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2, onRetry } = options;

  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(lastError)) {
        logError(`Échec immédiat : erreur non-réessayable`, lastError, { attempt, maxAttempts });
        throw lastError;
      }

      if (attempt === maxAttempts) {
        logError(`Échec après ${maxAttempts} tentatives`, lastError, {
          maxAttempts,
          finalDelay: currentDelay,
        });
        throw lastError;
      }

      logWarn(
        `Tentative ${attempt}/${maxAttempts} échouée, nouvelle tentative dans ${currentDelay}ms`,
        { attempt, error: lastError.message, delay: currentDelay }
      );

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Attendre avant la prochaine tentative
      await sleep(currentDelay);

      // Augmenter le délai pour la prochaine tentative (backoff exponentiel)
      currentDelay *= backoffMultiplier;
    }
  }

  // Ce code ne devrait jamais être atteint, mais TypeScript l'exige
  throw lastError || new Error('Erreur inconnue lors du retry');
}

/**
 * Fonction utilitaire pour attendre un certain temps
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Détermine si une erreur est temporaire et mérite un retry
 *
 * @param error - L'erreur à analyser
 * @returns true si l'erreur est temporaire
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const retryableMessages = [
    'network',
    'timeout',
    'unavailable',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryableMessages.some((msg) => errorMessage.includes(msg));
}

/**
 * Wrapper pour retryAsync qui ne retry que sur les erreurs temporaires
 *
 * @param fn - Fonction asynchrone à exécuter
 * @param options - Options de retry
 * @returns Le résultat de la fonction si elle réussit
 */
export async function retryOnNetworkError<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return await retryAsync(fn, options);
}
