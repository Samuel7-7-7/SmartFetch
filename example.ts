import { SmartFetch } from './src';

// Inicializando un cliente preconfigurado
const api = new SmartFetch({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000, // Tiempo límite de 5 segundos
  retries: 2,    // Reintentar hasta 2 veces si hay fallo de red o 5xx
  headers: {
    'Authorization': 'Bearer test-token'
  }
});

// Añadiendo interceptores
api.interceptors.request.use((config) => {
  console.log(`[Request] Preparando petición a: ${config.url}`);
  return config;
});

api.interceptors.response.use((response) => {
  console.log(`[Response] Recibimos respuesta exitosa de: ${response.config.url} (${response.status})`);
  return response;
});

async function runExamples() {
  console.log('--- Iniciando Ejemplos de SmartFetch ---\n');

  try {
    // 1. Petición GET básica con query params
    console.log('1. GET /posts (con query params)');
    const postsResponse = await api.get('/posts', { params: { userId: 1 } });
    console.log(`- Se obtuvieron ${postsResponse.data.length} posts.\n`);

    // 2. Petición POST con body (se convierte a JSON automáticamente)
    console.log('2. POST /posts');
    const newPostResponse = await api.post('/posts', {
      title: 'SmartFetch es genial',
      body: 'Wrapper ligero sin dependencias.',
      userId: 1,
    });
    console.log(`- Post creado exitosamente con ID: ${newPostResponse.data.id}\n`);

    // 3. Demostración de manejo de errores (404)
    console.log('3. Demostrando el rechazo automático en errores HTTP (Status 404)');
    await api.get('/ruta-que-no-existe');
  } catch (error: any) {
    console.error(`- [Capturado Correctamente] ${error.message}\n`);
  }

  try {
    // 4. Demostración de Timeout
    console.log('4. Forzando un error por Timeout');
    // Le ponemos un timeout irreal de 1 milisegundo para que falle
    await api.get('/posts', { timeout: 1 });
  } catch (error: any) {
    console.error(`- [Capturado Correctamente] ${error.message}\n`);
  }

  console.log('--- Fin de los ejemplos ---');
}

runExamples();
