// Fix for setImmediate not defined
global.setImmediate = global.setImmediate || ((fn: any, ...args: any[]) => setTimeout(fn, 0, ...args));

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;

beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
}); 