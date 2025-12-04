// src/utils/api.js

export const getBackendUrl = () => {
  // В режиме разработки (npm run dev)
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  // В режиме продакшена на ВМ (без домена)
  // Используем IP-адрес Droplet, который будет window.location.hostname
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};

export const getToken = () => localStorage.getItem('token');
