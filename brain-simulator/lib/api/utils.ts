/**
 * Validates if an OpenAI API key is available
 */
export function validateApiKey(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return typeof apiKey === 'string' && apiKey.startsWith('sk-') && apiKey.length > 20;
}

/**
 * Error handling for API requests
 */
export function handleApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as any).error;
    }
  }
  return 'Unknown error occurred';
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
} 