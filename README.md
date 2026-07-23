# SmartFetch

Un wrapper avanzado, resiliente y altamente configurable sobre la API nativa `fetch` de JavaScript. Cero dependencias, diseñado para ofrecer una experiencia similar a `axios` pero sin las vulnerabilidades asociadas a dependencias de terceros.

## Instalación

```bash
# Aún no publicado, instalar localmente o vía github
# npm install smartfetch
```

## ¿Por qué SmartFetch?

- **Cero dependencias**: Utiliza directamente las APIs nativas `fetch`, `AbortController` y `URLSearchParams`.
- **Configuración centralizada**: Define `baseURL`, `headers` por defecto, `timeout` global, etc.
- **Manejo automático de JSON**: Parsea automáticamente las respuestas a JSON (o texto) y hace `stringify` de los bodies en las peticiones.
- **Manejo estricto de errores**: A diferencia del `fetch` nativo, rechaza automáticamente la promesa si el código HTTP es menor a 200 o mayor o igual a 300.
- **Reintentos automáticos (Retries)**: Si una petición falla (errores 5xx o de conexión), SmartFetch la reintentará el número de veces configurado.
- **Timeouts**: Cancela automáticamente peticiones que excedan el tiempo límite.
- **Interceptores (Interceptors)**: Modifica y controla las peticiones antes de ser enviadas o las respuestas antes de ser entregadas, de forma global.
- **Soporte para Query Params**: Pasa un objeto `params` y se convertirá automáticamente en la query string.

## Uso Básico

```typescript
import smartFetch from 'smartfetch';

async function getTodo() {
  try {
    const response = await smartFetch.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log('Todo data:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Creando una Instancia Personalizada

Para proyectos más grandes, es muy útil instanciar el cliente base para una API concreta:

```typescript
import { SmartFetch } from 'smartfetch';

const api = new SmartFetch({
  baseURL: 'https://api.example.com/v1',
  timeout: 5000, // Timeout en 5 segundos
  retries: 3,    // Reintenta hasta 3 veces si la API responde con 5xx
  headers: {
    'Authorization': 'Bearer tu_token_aqui'
  }
});

// Peticiones
const users = await api.get('/users', { params: { role: 'admin' } }); // GET /users?role=admin
const created = await api.post('/users', { name: 'Juan', role: 'admin' });
const updated = await api.put('/users/1', { name: 'Juanito' });
const deleted = await api.delete('/users/1');
```

## Interceptores

Al igual que en axios, los interceptores te permiten manipular las configuraciones de request o la data de un response antes de que sean manejadas por tu código (`.then` / `.catch`).

```typescript
// Interceptor de Petición (Request)
api.interceptors.request.use((config) => {
  // Inyectar un header dinámicamente antes de enviar
  config.headers = {
    ...config.headers,
    'X-Timestamp': Date.now().toString()
  };
  return config;
});

// Interceptor de Respuesta (Response)
api.interceptors.response.use(
  (response) => {
    // Si queremos manipular la respuesta globalmente
    console.log(`[Success] ${response.status}`);
    return response;
  },
  (error) => {
    // Manejar errores de autorización a nivel global
    if (error.message.includes('status 401')) {
      console.log('¡No autorizado, redirigiendo al login!');
    }
    throw error;
  }
);
```
