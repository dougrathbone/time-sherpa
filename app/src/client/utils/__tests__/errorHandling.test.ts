import { AxiosError } from 'axios';
import { AppError, withRetry, getErrorMessage, isRetryableError } from '../errorHandling';

// Mock axios module
jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
}));

// Import axios after mocking
import axios from 'axios';
const mockedIsAxiosError = axios.isAxiosError as unknown as jest.Mock;

describe('errorHandling utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('creates an error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 500, true);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('AppError');
    });
  });

  describe('withRetry', () => {
    it('returns result on first successful attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, { retryDelay: 10 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(withRetry(mockFn, { maxRetries: 2, retryDelay: 10 }))
        .rejects.toThrow('Always fails');
      
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('does not retry when shouldRetry returns false', async () => {
      const error = new Error('Non-retryable');
      const mockFn = jest.fn().mockRejectedValue(error);
      
      await expect(
        withRetry(mockFn, {
          shouldRetry: () => false,
          retryDelay: 10
        })
      ).rejects.toThrow('Non-retryable');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorMessage', () => {
    it('returns message from AppError', () => {
      const error = new AppError('Custom app error');
      mockedIsAxiosError.mockReturnValue(false);
      expect(getErrorMessage(error)).toBe('Custom app error');
    });

    it('returns network error message for axios error without response', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(getErrorMessage(axiosError)).toBe(
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    });

    it('returns appropriate message for 401 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(getErrorMessage(axiosError)).toBe('Your session has expired. Please sign in again.');
    });

    it('returns server error message for 5xx errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 503, data: {} },
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(getErrorMessage(axiosError)).toBe('The server is experiencing issues. Please try again later.');
    });

    it('returns custom message from response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: { 
          status: 400, 
          data: { message: 'Custom error from server' } 
        },
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(getErrorMessage(axiosError)).toBe('Custom error from server');
    });

    it('returns generic message for unknown errors', () => {
      mockedIsAxiosError.mockReturnValue(false);
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(isRetryableError(axiosError)).toBe(true);
    });

    it('returns true for 5xx errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 502 },
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(isRetryableError(axiosError)).toBe(true);
    });

    it('returns false for 4xx errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
      } as AxiosError;
      
      mockedIsAxiosError.mockReturnValue(true);
      
      expect(isRetryableError(axiosError)).toBe(false);
    });

    it('returns isRetryable property from AppError', () => {
      const retryableError = new AppError('Retryable', undefined, undefined, true);
      const nonRetryableError = new AppError('Non-retryable', undefined, undefined, false);
      
      mockedIsAxiosError.mockReturnValue(false);
      
      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });

    it('returns false for non-axios errors', () => {
      mockedIsAxiosError.mockReturnValue(false);
      expect(isRetryableError(new Error('Regular error'))).toBe(false);
      expect(isRetryableError('string error')).toBe(false);
    });
  });
}); 