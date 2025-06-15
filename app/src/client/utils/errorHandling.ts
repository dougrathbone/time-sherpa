import axios, { AxiosError } from 'axios';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldRetry: (error: any) => {
    // Don't retry if error is not an axios error
    if (!axios.isAxiosError(error)) return false;
    
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    return error.response.status >= 500 && error.response.status < 600;
  }
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    // Check for specific error scenarios
    if (!axiosError.response) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;

    // Handle specific status codes
    switch (status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'The server is experiencing issues. Please try again later.';
      default:
        // Try to get message from response data
        if (data?.message) return data.message;
        if (data?.error) return data.error;
        return `An error occurred (${status}). Please try again.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // Network errors are retryable
    if (!error.response) return true;
    
    // 5xx errors are typically retryable
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  if (error instanceof AppError) {
    return error.isRetryable;
  }

  return false;
}

// Error messages for specific scenarios
export const ERROR_MESSAGES = {
  CALENDAR_FETCH_FAILED: 'Unable to fetch your calendar data. Please try again.',
  ANALYSIS_FAILED: 'Unable to analyze your calendar. Please try again later.',
  SUBSCRIPTION_UPDATE_FAILED: 'Unable to update your subscription preferences. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please sign in again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
}; 