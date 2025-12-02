// src/utils/api.js

export const getBackendUrl = () => {
  // В режиме разработки (npm run dev) или если хост - localhost/127.0.0.1
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // В режиме продакшена на ВМ (без домена)
  // Если фронтенд доступен по http://<IP_ВМ>:3000, то бэкенд будет на http://<IP_ВМ>:3001
  // window.location.hostname будет <IP_ВМ>
  // window.location.protocol будет http:
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};

export const getToken = () => localStorage.getItem('token');
