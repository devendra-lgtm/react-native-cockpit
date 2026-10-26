import { cockpitStore } from './CockpitStore';
import { safeJsonParse } from '../utils/formatters';

let isInterceptorEnabled = false;
let originalFetch: typeof global.fetch | null = null;
let originalXMLHttpRequest: typeof global.XMLHttpRequest | null = null;
let isCallingFetchSync = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class NetworkInterceptor {
  public static enable() {
    if (isInterceptorEnabled) return;
    isInterceptorEnabled = true;

    NetworkInterceptor.interceptFetch();
    NetworkInterceptor.interceptXHR();
  }

  public static disable() {
    if (!isInterceptorEnabled) return;
    isInterceptorEnabled = false;

    if (originalFetch && typeof global !== 'undefined') {
      global.fetch = originalFetch;
      originalFetch = null;
    }

    if (originalXMLHttpRequest && typeof global !== 'undefined') {
      global.XMLHttpRequest = originalXMLHttpRequest;
      originalXMLHttpRequest = null;
    }
  }

  private static interceptFetch() {
    if (typeof global === 'undefined' || !global.fetch) return;
    originalFetch = global.fetch;

    global.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const id = generateId();
      const startTime = Date.now();

      // Extract URL & method
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        url = input.url;
      }

      const method = (
        init?.method ||
        (typeof input === 'object' && 'method' in input ? (input as any).method : 'GET') ||
        'GET'
      ).toUpperCase();

      // Extract request headers
      const requestHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (typeof Headers !== 'undefined' && init.headers instanceof Headers) {
          init.headers.forEach((val, key) => {
            requestHeaders[key] = val;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, val]) => {
            requestHeaders[key] = val;
          });
        } else if (typeof init.headers === 'object') {
          Object.assign(requestHeaders, init.headers);
        }
      }

      // Extract body
      let requestBody: any = init?.body;
      if (requestBody && typeof requestBody === 'string') {
        const { isJson, value } = safeJsonParse(requestBody);
        if (isJson) requestBody = value;
      }

      cockpitStore.addRequest({
        id,
        url,
        method,
        requestHeaders,
        requestBody,
        startTime,
      });

      let response: Response;
      try {
        isCallingFetchSync = true;
        try {
          response = await originalFetch!(input, init);
        } finally {
          isCallingFetchSync = false;
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Clone response to inspect without consuming caller's stream
        const responseClone = response.clone();

        // Extract response headers
        const responseHeaders: Record<string, string> = {};
        if (response.headers) {
          response.headers.forEach((val, key) => {
            responseHeaders[key] = val;
          });
        }

        // Read response body text
        responseClone
          .text()
          .then((text) => {
            const size = typeof Blob !== 'undefined' ? new Blob([text]).size : text.length;
            const { isJson, value } = safeJsonParse(text);

            cockpitStore.updateRequest(id, {
              status: response.status,
              statusText: response.statusText,
              responseHeaders,
              responseBody: isJson ? value : text,
              endTime,
              duration,
              size,
            });
          })
          .catch(() => {
            cockpitStore.updateRequest(id, {
              status: response.status,
              statusText: response.statusText,
              responseHeaders,
              endTime,
              duration,
            });
          });

        return response;
      } catch (err: any) {
        const endTime = Date.now();
        cockpitStore.updateRequest(id, {
          status: 0,
          error: err?.message || 'Network request failed',
          endTime,
          duration: endTime - startTime,
        });
        throw err;
      }
    };
  }

  private static interceptXHR() {
    if (typeof global === 'undefined' || !global.XMLHttpRequest) return;
    originalXMLHttpRequest = global.XMLHttpRequest;

    const OriginalXHR = originalXMLHttpRequest;

    function CockpitXHR() {
      const xhr = new OriginalXHR();
      // If instantiated synchronously while inside fetch(), mark it to avoid duplicate capture
      const isFromFetch = isCallingFetchSync;
      (xhr as any).__cockpitFromFetch = isFromFetch;

      const id = generateId();
      let method = 'GET';
      let url = '';
      const requestHeaders: Record<string, string> = {};
      let startTime = 0;

      const origOpen = xhr.open;
      xhr.open = function (
        m: string,
        u: string | URL,
        async: boolean = true,
        user?: string | null,
        password?: string | null
      ) {
        method = m.toUpperCase();
        url = typeof u === 'string' ? u : u.toString();
        return origOpen.call(xhr, m, u, async, user, password);
      };

      const origSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function (header: string, value: string) {
        requestHeaders[header] = value;
        return origSetRequestHeader.call(xhr, header, value);
      };

      const origSend = xhr.send;
      xhr.send = function (body?: any) {
        // If this XHR was initiated by fetch(), skip tracking to prevent duplicate rows
        if ((xhr as any).__cockpitFromFetch) {
          return origSend.call(xhr, body);
        }

        startTime = Date.now();
        let parsedBody = body;
        if (typeof body === 'string') {
          const { isJson, value } = safeJsonParse(body);
          if (isJson) parsedBody = value;
        }

        cockpitStore.addRequest({
          id,
          url,
          method,
          requestHeaders,
          requestBody: parsedBody,
          startTime,
        });

        const handleFinish = () => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Parse raw response headers
          const rawHeaders = xhr.getAllResponseHeaders() || '';
          const responseHeaders: Record<string, string> = {};
          rawHeaders
            .trim()
            .split(/[\r\n]+/)
            .forEach((line) => {
              const parts = line.split(': ');
              const header = parts.shift();
              const val = parts.join(': ');
              if (header) responseHeaders[header.toLowerCase()] = val;
            });

          let responseBody: any = xhr.response;
          if (typeof responseBody === 'string') {
            const { isJson, value } = safeJsonParse(responseBody);
            if (isJson) responseBody = value;
          }

          const responseText = typeof xhr.response === 'string' ? xhr.response : JSON.stringify(xhr.response || '');
          const size = responseText ? responseText.length : 0;

          cockpitStore.updateRequest(id, {
            status: xhr.status,
            statusText: xhr.statusText,
            responseHeaders,
            responseBody,
            responseType: xhr.responseType,
            endTime,
            duration,
            size,
            error: xhr.status === 0 ? 'Network Error' : undefined,
          });
        };

        xhr.addEventListener('load', handleFinish);
        xhr.addEventListener('error', () => {
          const endTime = Date.now();
          cockpitStore.updateRequest(id, {
            status: 0,
            error: 'Network request failed',
            endTime,
            duration: endTime - startTime,
          });
        });
        xhr.addEventListener('abort', () => {
          const endTime = Date.now();
          cockpitStore.updateRequest(id, {
            status: 0,
            error: 'Request aborted',
            endTime,
            duration: endTime - startTime,
          });
        });

        return origSend.call(xhr, body);
      };

      return xhr;
    }

    CockpitXHR.prototype = OriginalXHR.prototype;
    for (const key of Object.keys(OriginalXHR)) {
      try {
        (CockpitXHR as any)[key] = (OriginalXHR as any)[key];
      } catch {
        // ignore read-only
      }
    }

    (global as any).XMLHttpRequest = CockpitXHR;
  }
}
