export interface SmartFetchConfig extends Omit<RequestInit, 'body'> {
  baseURL?: string;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
  retries?: number;
  body?: any;
}



export interface SmartFetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: SmartFetchConfig;
  request?: any;
}
