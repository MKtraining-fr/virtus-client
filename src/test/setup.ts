import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Étendre les matchers de Vitest avec ceux de jest-dom
expect.extend(matchers);

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});
