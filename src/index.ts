import { SmartFetch } from './core/SmartFetch';
import { SmartFetchConfig } from './types';

export * from './types';
export * from './core/InterceptorManager';
export { SmartFetch };

export const create = (config?: SmartFetchConfig): SmartFetch => {
  return new SmartFetch(config);
};

// Exportar una instancia por defecto
const smartFetch = new SmartFetch();
export default smartFetch;
