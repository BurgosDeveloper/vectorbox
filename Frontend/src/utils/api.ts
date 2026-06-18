const getBaseUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:5000/api`;
};

const BASE_URL = getBaseUrl();

export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  results?: number;
  data?: T;
}

export class ApiError extends Error {
  status: string;
  data: any;

  constructor(message: string, status: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Permite el envío y recepción de la cookie JWT HttpOnly
  });

  // Si la respuesta es de tipo descarga (attachment/stream) no parsear como JSON
  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition && contentDisposition.includes('attachment')) {
    return response as any; // Devolver objeto Response para que el consumidor maneje el blob/stream
  }

  let json: any;
  try {
    json = await response.json();
  } catch (err) {
    if (response.ok) {
      return {} as T;
    }
    throw new ApiError('Error al procesar la respuesta del servidor', 'error');
  }

  if (!response.ok) {
    throw new ApiError(
      json.message || 'Ocurrió un error en la solicitud',
      json.status || 'fail',
      json.data
    );
  }

  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),
    
  post: <T = any>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  put: <T = any>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  delete: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
