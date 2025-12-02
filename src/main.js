/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
// --- ИСПРАВЛЕНО ЗДЕСЬ: Заменяем алиас на относительный путь ---
import { registerPlugins } from './plugins'
// ---------------------------------------------------------

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
