/**
 * Utility functions for handling token validation and expiration
 */

/**
 * Checks if an error is related to token expiration
 */
export function isTokenExpiredError(error: any): boolean {
  if (!error) return false;
  const message = String(error.message || error).toLowerCase();
  return message.includes("expired") || message.includes("invalid jwt") || message.includes("invalid token");
}

/**
 * Extracts token expiration error message
 */
export function getTokenExpiredErrorMessage(error: any): string {
  if (isTokenExpiredError(error)) {
    return "Session expired. Please sign in again and retry.";
  }
  return error?.message || "Unknown error";
}

/**
 * Retry function for operations that might fail due to token expiration
 * @param operation - Async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 2)
 * @param delayMs - Delay between retries in milliseconds (default: 1000)
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a token error and we have retries left, wait and retry
      if (isTokenExpiredError(error) && attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      
      // If it's not a token error, don't retry
      throw error;
    }
  }

  throw lastError || new Error("Operation failed after retries");
}
