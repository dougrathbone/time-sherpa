import '@testing-library/jest-dom';

// Setup TextEncoder/TextDecoder for tests
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only log actual errors, not React warnings
    if (!args[0]?.includes?.('Warning:') && !args[0]?.includes?.('Error: Not authenticated')) {
      originalConsoleError(...args);
    }
  });
  
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 