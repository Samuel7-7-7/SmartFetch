import { SmartFetchConfig, SmartFetchResponse } from '../types';

export class SmartFetch {
  private config: SmartFetchConfig;

  constructor(config: SmartFetchConfig = {}) {
    this.config = config;
  }

  async request<T = any>(url: string, config: SmartFetchConfig = {}): Promise<SmartFetchResponse<T>> {
    // 1. Merge configs
    const mergedConfig: SmartFetchConfig = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };

    // 2. Handle baseURL
    let finalUrl = url;
    if (mergedConfig.baseURL && !finalUrl.startsWith('http')) {
      const baseURL = mergedConfig.baseURL.replace(/\/+$/, '');
      const pathUrl = url.replace(/^\/+/, '');
      finalUrl = `${baseURL}/${pathUrl}`;
    }

    // 3. Auto stringify JSON bodies
    if (
      mergedConfig.body &&
      typeof mergedConfig.body === 'object' &&
      !(mergedConfig.body instanceof FormData) &&
      !(mergedConfig.body instanceof Blob) &&
      !(mergedConfig.body instanceof ArrayBuffer) &&
      !(mergedConfig.body instanceof URLSearchParams)
    ) {
      mergedConfig.body = JSON.stringify(mergedConfig.body);
      
      const headers = new Headers(mergedConfig.headers);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      const headerObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      mergedConfig.headers = headerObj;
    }

    // 4. Perform Request
    const response = await fetch(finalUrl, mergedConfig);

    // 5. Auto JSON parse response
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // 6. Error handling for HTTP status
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${JSON.stringify(responseData)}`);
    }

    // 7. Return extended response
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: mergedConfig,
    };
  }
}
