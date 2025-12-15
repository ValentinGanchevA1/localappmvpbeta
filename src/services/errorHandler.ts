// src/services/errorHandler.ts
import { isAxiosError, getErrorMessage } from '@/types/error';

export enum ErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ServiceError {
  message: string;
  code: ErrorCodes;
  statusCode?: number;
  details?: Record<string, unknown>;
}

class ErrorHandler {
  public handleError(error: unknown, context: string): ServiceError {
    const message = getErrorMessage(error);
    let code = ErrorCodes.UNKNOWN_ERROR;
    let statusCode: number | undefined;

    if (isAxiosError(error)) {
      statusCode = error.response?.status;

      if (error.code === 'ECONNABORTED' || error.message.includes('Network')) {
        code = ErrorCodes.NETWORK_ERROR;
      } else if (statusCode === 401) {
        code = ErrorCodes.AUTH_ERROR;
      } else if (statusCode === 404) {
        code = ErrorCodes.NOT_FOUND;
      } else if (statusCode === 422 || statusCode === 400) {
        code = ErrorCodes.VALIDATION_ERROR;
      } else if (statusCode && statusCode >= 500) {
        code = ErrorCodes.SERVER_ERROR;
      }
    }

    const serviceError: ServiceError = {
      message,
      code,
      statusCode,
      details: { context },
    };

    console.error(`[${context}] Error:`, serviceError.message, {
      code: serviceError.code,
      statusCode: serviceError.statusCode,
    });

    return serviceError;
  }

  public createError(message: string, code: ErrorCodes): ServiceError {
    return { message, code };
  }
}

export const errorHandler = new ErrorHandler();
