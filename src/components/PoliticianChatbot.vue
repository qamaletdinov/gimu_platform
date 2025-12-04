<template>
  <div class="chatbot-wrapper">
    <!-- Кнопка открытия чата -->
    <v-btn
      v-if="!isOpen"
      class="chatbot-fab"
      color="primary"
      size="large"
      icon
      elevation="8"
      @click="toggleChat"
    >
      <v-icon size="32">mdi-chat</v-icon>
    </v-btn>

    <!-- Окно чата -->
    <v-card
      v-if="isOpen"
      class="chatbot-window"
      elevation="12"
    >
      <!-- Заголовок -->
      <v-card-title class="chatbot-header d-flex align-center">
        <v-icon class="mr-2">mdi-robot</v-icon>
        <span class="flex-grow-1">Чат-бот политика</span>
        <v-btn
          icon
          size="small"
          variant="text"
          @click="clearHistory"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          variant="text"
          @click="toggleChat"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Область сообщений -->
      <v-card-text class="chatbot-messages" ref="messagesContainer">
        <div v-if="!isLoaded" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-2 text-caption">Загрузка контекста...</p>
        </div>

        <div v-else-if="messages.length === 0" class="text-center pa-4 text-medium-emphasis">
          <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
          <p class="mt-2">Начните диалог с ботом!</p>
          <p class="text-caption">Задайте любой вопрос</p>
        </div>

        <div v-else>
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-wrapper"
            :class="{ 'user-message': msg.role === 'user', 'bot-message': msg.role === 'bot' }"
          >
            <div class="message-bubble">
              <div class="message-text">{{ msg.content }}</div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
        </div>

        <!-- Индикатор печати -->
        <div v-if="isTyping" class="message-wrapper bot-message">
          <div class="message-bubble typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Поле ввода -->
      <v-card-actions class="chatbot-input pa-3">
        <v-text-field
          v-model="inputMessage"
          placeholder="Напишите сообщение..."
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="sendMessage"
          :disabled="isTyping || !isLoaded"
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              size="small"
              color="primary"
              :disabled="!inputMessage.trim() || isTyping || !isLoaded"
              @click="sendMessage"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import axios from 'axios';
import { getBackendUrl } from '@/utils/api.js';

const isOpen = ref(false);
const isLoaded = ref(false);
const isTyping = ref(false);
const inputMessage = ref('');
const messages = ref([]);
const messagesContainer = ref(null);

// Генерируем уникальный ID сессии
const sessionId = ref(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

// Переключение открытия/закрытия чата
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// Проверка статуса бота
const checkStatus = async () => {
  try {
    const backendUrl = getBackendUrl();
    const response = await axios.get(`${backendUrl}/api/chatbot/status`);
    isLoaded.value = response.data.isLoaded;

    if (!isLoaded.value) {
      console.warn('Чат-бот еще не загружен. Требуется загрузка данных.');
    }
  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
  }
};

// Отправка сообщения
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value || !isLoaded.value) {
    return;
  }

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';

  // Добавляем сообщение пользователя
  messages.value.push({
    role: 'user',
    content: userMessage,
    time: getCurrentTime()
  });

  scrollToBottom();
  isTyping.value = true;

  try {
    const backendUrl = getBackendUrl();
    const response = await axios.post(`${backendUrl}/api/chatbot/message`, {
      message: userMessage,
      sessionId: sessionId.value
    });

    // Добавляем ответ бота
    messages.value.push({
      role: 'bot',
      content: response.data.response,
      time: getCurrentTime()
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    messages.value.push({
      role: 'bot',
      content: 'Извините, произошла ошибка. Попробуйте еще раз.',
      time: getCurrentTime()
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

// Очистка истории
const clearHistory = async () => {
  try {
    const backendUrl = getBackendUrl();
    await axios.post(`${backendUrl}/api/chatbot/clear-history`, {
      sessionId: sessionId.value
    });
    messages.value = [];
    // Генерируем новый ID сессии
    sessionId.value = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } catch (error) {
    console.error('Ошибка очистки истории:', error);
  }
};

// Прокрутка к последнему сообщению
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Получение текущего времени
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// Автоскролл при добавлении сообщений
watch(() => messages.value.length, () => {
  scrollToBottom();
});

onMounted(() => {
  checkStatus();
});
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.chatbot-fab {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.chatbot-window {
  width: 380px;
  height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%);
  color: white;
  padding: 12px 16px;
  font-weight: 600;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
}

.message-wrapper {
  display: flex;
  margin-bottom: 12px;
}

.user-message {
  justify-content: flex-end;
}

.bot-message {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  word-wrap: break-word;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.bot-message .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.4;
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
  text-align: right;
}

.bot-message .message-time {
  text-align: left;
}

.chatbot-input {
  background: white;
}

/* Анимация печати */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #999;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Scrollbar styling */
.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Адаптивность для мобильных */
@media (max-width: 600px) {
  .chatbot-window {
    width: calc(100vw - 48px);
    height: calc(100vh - 100px);
  }
}
</style>

