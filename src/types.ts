export interface SmartFetchConfig extends RequestInit {
  baseURL?: string;
  // Próximamente params y timeout...
}

export interface SmartFetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: SmartFetchConfig;
  request?: any;
}
