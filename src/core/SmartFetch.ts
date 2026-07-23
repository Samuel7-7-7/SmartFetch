import { SmartFetchConfig, SmartFetchResponse } from '../types';
import { InterceptorManager } from './InterceptorManager';

export class SmartFetch {
  private config: SmartFetchConfig;
  public interceptors: {
    request: InterceptorManager<SmartFetchConfig>;
    response: InterceptorManager<SmartFetchResponse>;
  };

  constructor(config: SmartFetchConfig = {}) {
    this.config = config;
    this.interceptors = {
      request: new InterceptorManager<SmartFetchConfig>(),
      response: new InterceptorManager<SmartFetchResponse>(),
    };
  }

  async request<T = any>(url: string, config: SmartFetchConfig = {}): Promise<SmartFetchResponse<T>> {
    const mergedConfig: SmartFetchConfig = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };

    const chain: any[] = [{ resolved: (c: SmartFetchConfig) => this.performRequest<T>(url, c), rejected: undefined }];
    
    this.interceptors.request.forEach((interceptor) => {
      chain.unshift({ resolved: interceptor.onFulfilled, rejected: interceptor.onRejected });
    });

    this.interceptors.response.forEach((interceptor) => {
      chain.push({ resolved: interceptor.onFulfilled, rejected: interceptor.onRejected });
    });

    let promise = Promise.resolve(mergedConfig) as Promise<any>;

    while (chain.length > 0) {
      const { resolved, rejected } = chain.shift();
      promise = promise.then(resolved, rejected);
    }

    return promise;
  }

  private async performRequest<T>(url: string, config: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    let finalUrl = url;
    if (config.baseURL && !finalUrl.startsWith('http')) {
      const baseURL = config.baseURL.replace(/\/+$/, '');
      const pathUrl = url.replace(/^\/+/, '');
      finalUrl = `${baseURL}/${pathUrl}`;
    }

    if (config.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(config.params)) {
         if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
         }
      }
      const queryString = searchParams.toString();
      if (queryString) {
         finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    if (
      config.body &&
      typeof config.body === 'object' &&
      !(config.body instanceof FormData) &&
      !(config.body instanceof Blob) &&
      !(config.body instanceof ArrayBuffer) &&
      !(config.body instanceof URLSearchParams)
    ) {
      config.body = JSON.stringify(config.body);
      
      const headers = new Headers(config.headers as HeadersInit);
      if (!headers.has('Content-Type') && !headers.has('content-type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      const headerObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      config.headers = headerObj;
    }

    const retries = config.retries ?? 0;
    let attempt = 0;
    
    while(attempt <= retries) {
       let controller: AbortController | null = null;
       let timeoutId: any = null;
       
       if (config.timeout) {
          controller = new AbortController();
          config.signal = controller.signal;
       }

       try {
          if (controller && config.timeout) {
             timeoutId = setTimeout(() => controller!.abort(), config.timeout);
          }
          const response = await fetch(finalUrl, config);
          if (timeoutId) clearTimeout(timeoutId);

          if (!response.ok) {
             const isServerError = response.status >= 500 && response.status < 600;
             if (isServerError && attempt < retries) {
                 attempt++;
                 continue;
             }
             let errData: any;
             try { errData = await response.json(); } catch(e) { errData = await response.text(); }
             throw new Error(`Request failed with status ${response.status}: ${JSON.stringify(errData)}`);
          }

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

          return {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: config,
          };

       } catch (error: any) {
          if (timeoutId) clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
              throw new Error(`Request timeout of ${config.timeout}ms exceeded`);
          }
          if (attempt < retries) {
              attempt++;
              continue;
          }
          throw error;
       }
    }
    throw new Error('Unreachable');
  }

  get<T = any>(url: string, config?: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  delete<T = any>(url: string, config?: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  post<T = any>(url: string, data?: any, config?: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  put<T = any>(url: string, data?: any, config?: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  patch<T = any>(url: string, data?: any, config?: SmartFetchConfig): Promise<SmartFetchResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }
}
