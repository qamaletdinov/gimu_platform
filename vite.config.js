import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
  },
  // Убираем секцию server, так как она нужна только для разработки
  // В продакшене статические файлы будет отдавать веб-сервер (Nginx)
  define: {
    'process.env.BASE_URL': JSON.stringify('/')
  },
  build: {
    outDir: 'dist', // Убедимся, что сборка идет в папку dist
    emptyOutDir: true, // Очищать папку dist перед сборкой
  }
})
