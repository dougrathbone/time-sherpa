import '@testing-library/jest-dom';

// Fix for setImmediate not defined
global.setImmediate = global.setImmediate || ((fn: any, ...args: any[]) => setTimeout(fn, 0, ...args));

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only log actual errors, not expected ones
    if (!args[0]?.includes?.('Warning:') && !args[0]?.includes?.('Error: Not authenticated')) {
      originalConsoleError(...args);
    }
  });
  
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Setup TextEncoder/TextDecoder for tests
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder }); 