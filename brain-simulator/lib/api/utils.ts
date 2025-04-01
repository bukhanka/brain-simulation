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
    // Check for OpenAI specific errors
    if ('status' in error && typeof (error as any).status === 'number') {
      const status = (error as any).status;
      // Check for geographic restriction error (403)
      if (status === 403) {
        const errorObj = error as any;
        if (errorObj.code === 'unsupported_country_region_territory' || 
           (errorObj.error && errorObj.error.code === 'unsupported_country_region_territory')) {
          return 'OpenAI API недоступна в вашем регионе. Настройте прокси-сервер в разрешенном регионе или используйте VPN.';
        }
        return 'Доступ к API запрещен. Проверьте ваш API ключ и права доступа.';
      }
    }
    
    // Standard error handling
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as any).error;
    }
    if ('error' in error && typeof (error as any).error === 'object' && (error as any).error !== null) {
      if ('message' in (error as any).error && typeof (error as any).error.message === 'string') {
        return (error as any).error.message;
      }
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