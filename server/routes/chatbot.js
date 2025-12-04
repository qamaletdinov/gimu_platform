const express = require('express');
const router = express.Router();
const politicianChatbot = require('../politicianChatbot.js');
const path = require('path');

// Хранилище истории чатов в памяти (для production лучше использовать Redis или БД)
const chatHistories = new Map();

/**
 * POST /api/chatbot/message
 * Отправка сообщения чат-боту
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    // Получаем или создаем историю для этой сессии
    if (!chatHistories.has(sessionId)) {
      chatHistories.set(sessionId, []);
    }

    const history = chatHistories.get(sessionId);

    // Генерируем ответ
    const response = await politicianChatbot.generateResponse(message, history);

    // Добавляем в историю
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });

    // Ограничиваем размер истории (последние 20 сообщений)
    if (history.length > 20) {
      chatHistories.set(sessionId, history.slice(-20));
    }

    res.json({
      response,
      sessionId
    });
  } catch (error) {
    console.error('Ошибка в /api/chatbot/message:', error);
    res.status(500).json({ error: 'Ошибка при обработке сообщения' });
  }
});

/**
 * GET /api/chatbot/status
 * Получить статус чат-бота
 */
router.get('/status', (req, res) => {
  const status = politicianChatbot.getStatus();
  res.json(status);
});

/**
 * POST /api/chatbot/clear-history
 * Очистить историю чата
 */
router.post('/clear-history', (req, res) => {
  const { sessionId } = req.body;

  if (sessionId && chatHistories.has(sessionId)) {
    chatHistories.delete(sessionId);
  }

  res.json({ success: true });
});

/**
 * POST /api/chatbot/load-data
 * Загрузить данные из CSV (только для администраторов)
 */
router.post('/load-data', async (req, res) => {
  try {
    const { csvFileName } = req.body;

    if (!csvFileName) {
      return res.status(400).json({ error: 'Не указан файл CSV' });
    }

    // Путь к файлу CSV (предполагаем, что файл находится в папке server/storage)
    const csvPath = path.join(__dirname, '../storage', csvFileName);

    const count = await politicianChatbot.loadTelegramData(csvPath);

    res.json({
      success: true,
      messagesLoaded: count,
      message: `Успешно загружено ${count} сообщений`
    });
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    res.status(500).json({
      error: 'Ошибка при загрузке данных',
      details: error.message
    });
  }
});

module.exports = router;

