import { SmartFetch } from './core/SmartFetch';

export * from './types';
export { SmartFetch };

// Exportar una instancia por defecto
const smartFetch = new SmartFetch();
export default smartFetch;
