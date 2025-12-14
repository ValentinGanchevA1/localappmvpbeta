// src/types/error.ts

import { AxiosError } from 'axios';

// Base API error response structure
export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Application error that can be thrown and caught
export interface AppError {
  message: string;
  code: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  originalError?: unknown;
}

// Type guard to check if error is an AxiosError
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    error !== null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

// Type guard to check if error has a message property
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

// Extract error message from unknown error
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred'
    );
  }
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Create an AppError from unknown error
export function createAppError(error: unknown, context: string): AppError {
  const message = getErrorMessage(error);
  const code = isAxiosError(error)
    ? error.response?.data?.code || `HTTP_${error.response?.status || 'UNKNOWN'}`
    : 'UNKNOWN_ERROR';
  const statusCode = isAxiosError(error) ? error.response?.status : undefined;

  return {
    message,
    code,
    statusCode,
    details: { context },
    originalError: error,
  };
}
