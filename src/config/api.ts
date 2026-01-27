// Configuración de la API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Headers por defecto
export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Manejo de errores
export const handleApiError = (error: any) => {
  if (error.response) {
    // Error de respuesta del servidor
    return error.response.data.message || 'Error en el servidor';
  } else if (error.request) {
    // No hay respuesta del servidor
    return 'No se pudo conectar con el servidor';
  } else {
    // Error en la configuración de la petición
    return error.message || 'Error desconocido';
  }
};
