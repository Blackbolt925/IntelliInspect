// environment.prod.ts (for Docker prod)
export const environment = {
  production: true,
  MAX_FILE_SIZE: 14 * 1024 * 1024 * 1024,
  apiUrl: 'http://backend:8080/api',
  mlUrl: 'http://ml-fastapi:8000/api'
};
