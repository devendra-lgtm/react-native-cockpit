import { NetworkRequest } from '../types';

/**
 * Converts a NetworkRequest object to a valid bash cURL command.
 */
export function generateCurl(request: NetworkRequest): string {
  const parts: string[] = ['curl'];

  // Method
  if (request.method && request.method.toUpperCase() !== 'GET') {
    parts.push(`-X ${request.method.toUpperCase()}`);
  }

  // URL (wrapped in single quotes)
  parts.push(`'${request.url}'`);

  // Headers
  if (request.requestHeaders) {
    for (const [key, value] of Object.entries(request.requestHeaders)) {
      // Escape single quotes inside header value
      const escapedVal = String(value).replace(/'/g, "'\\''");
      parts.push(`-H '${key}: ${escapedVal}'`);
    }
  }

  // Body
  if (request.requestBody != null) {
    let bodyString = '';
    if (typeof request.requestBody === 'string') {
      bodyString = request.requestBody;
    } else {
      try {
        bodyString = JSON.stringify(request.requestBody);
      } catch {
        bodyString = String(request.requestBody);
      }
    }

    if (bodyString) {
      const escapedBody = bodyString.replace(/'/g, "'\\''");
      parts.push(`--data-raw '${escapedBody}'`);
    }
  }

  parts.push('--compressed');

  return parts.join(' \\\n  ');
}
