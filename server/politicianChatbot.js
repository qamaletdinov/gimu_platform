const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs').promises;

// Функция для получения модели Gemini
function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY не установлен в .env файле - используем Ollama');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Используем новую модель Gemini 2.0 Flash - быстрая и качественная
    return genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,  // Высокая температура для разнообразия и уникальности ответов
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
  } catch (error) {
    console.error('❌ Ошибка инициализации Gemini:', error.message);
    return null;
  }
}

// Функция для генерации через Ollama (fallback)
async function generateWithOllama(prompt) {
  const LOCAL_AI_URL = process.env.LOCAL_AI_URL || 'http://83.151.2.114:11434';
  const CHAT_MODEL = process.env.LOCAL_AI_CHAT_MODEL || 'theonemarket';

  try {
    const response = await axios.post(`${LOCAL_AI_URL}/api/chat`, {
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: 0.6,
        top_p: 0.9,
      }
    });
    return response.data.message.content.trim();
  } catch (error) {
    console.error('❌ Ошибка Ollama:', error.message);
    throw error;
  }
}

class PoliticianChatbot {
  constructor() {
    this.context = [];
    this.isLoaded = false;
    this.maxContextMessages = 50; // Максимум сообщений для контекста
  }

  /**
   * Загрузка данных из CSV файла Telegram канала
   */
  async loadTelegramData(csvFilePath) {
    try {
      const csvContent = await fs.readFile(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');

      // Пропускаем заголовок
      const messages = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Простой парсинг CSV (предполагаем формат: date,text или id,date,text)
        // Можете адаптировать под ваш формат CSV
        const parts = this.parseCSVLine(line);
        if (parts.length >= 2) {
          const messageText = parts[parts.length - 1]; // Последняя колонка - текст
          if (messageText && messageText.length > 10) {
            messages.push(messageText);
          }
        }
      }

      this.context = messages;
      this.isLoaded = true;
      console.log(`✅ Загружено ${messages.length} сообщений из Telegram канала`);
      return messages.length;
    } catch (error) {
      console.error('❌ Ошибка загрузки данных из CSV:', error);
      throw error;
    }
  }

  /**
   * Простой парсер CSV строки (учитывает кавычки)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, '')); // Убираем кавычки
  }

  /**
   * Поиск релевантных сообщений по запросу (простой поиск по ключевым словам)
   */
  findRelevantMessages(query, topK = 10) {
    if (!this.isLoaded || this.context.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();

    // Стоп-слова (общие слова, которые не помогают в поиске)
    const stopWords = new Set([
      'что', 'как', 'где', 'когда', 'почему', 'который', 'которая', 'которые',
      'это', 'эти', 'этот', 'эта', 'тот', 'та', 'те',
      'и', 'или', 'но', 'а', 'да', 'нет', 'не', 'ни',
      'в', 'на', 'с', 'по', 'из', 'к', 'от', 'о', 'об', 'для', 'у', 'за', 'до', 'при',
      'вы', 'ты', 'я', 'мы', 'он', 'она', 'они', 'оно',
      'быть', 'был', 'была', 'было', 'были', 'есть', 'буду', 'будет', 'будут',
      'ваш', 'ваша', 'ваши', 'твой', 'твоя', 'твои', 'мой', 'моя', 'мои',
      'можете', 'можешь', 'могу', 'может', 'могут',
      'думаете', 'думаешь', 'думаю', 'думает', 'думают',
      'скажите', 'скажи', 'расскажите', 'расскажи', 'говорите', 'говори'
    ]);

    const queryWords = queryLower
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    console.log(`🔍 Ключевые слова для поиска: [${queryWords.join(', ')}]`);

    // Ранжируем сообщения по количеству совпадающих слов
    const scored = this.context.map(msg => {
      const msgLower = msg.toLowerCase();
      let score = 0;

      // Полное совпадение фразы дает больший вес
      if (msgLower.includes(queryLower)) {
        score += 100;
      }

      // Подсчитываем совпадения отдельных слов
      queryWords.forEach(word => {
        // Экранируем спецсимволы regex
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Точное совпадение слова
        try {
          const regex = new RegExp(`\\b${escapedWord}\\w*\\b`, 'gi'); // Учитываем однокоренные слова
          const matches = msgLower.match(regex);
          if (matches) {
            score += matches.length * 15;
          }
        } catch (e) {
          // Игнорируем ошибки regex для особых символов
        }

        // Частичное вхождение (меньший вес)
        if (msgLower.includes(word.toLowerCase())) {
          score += 5;
        }
      });

      return { message: msg, score };
    });

    // Сортируем по score и берем топ-K
    const relevant = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.message);

    return relevant;
  }

  /**
   * Генерация ответа с использованием RAG
   */
  async generateResponse(userMessage, chatHistory = []) {
    if (!this.isLoaded) {
      return 'Извините, контекст еще не загружен. Пожалуйста, попробуйте позже.';
    }

    // Находим релевантные сообщения из Telegram канала
    const relevantMessages = this.findRelevantMessages(userMessage, 15);

    console.log(`\n🔍 RAG Debug для вопроса: "${userMessage}"`);
    console.log(`📊 Найдено релевантных сообщений: ${relevantMessages.length}`);

    if (relevantMessages.length > 0) {
      console.log('📝 Релевантные сообщения:');
      relevantMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ Релевантные сообщения не найдены!');
    }

    // Если не нашли релевантных - берем случайные для контекста
    let contextMessages = relevantMessages;
    if (contextMessages.length === 0 && this.context.length > 0) {
      console.log('📌 Используем случайные сообщения для контекста');
      const randomIndices = [];
      while (randomIndices.length < Math.min(10, this.context.length)) {
        const idx = Math.floor(Math.random() * this.context.length);
        if (!randomIndices.includes(idx)) {
          randomIndices.push(idx);
        }
      }
      contextMessages = randomIndices.map(i => this.context[i]);
    }

    // Формируем контекст из релевантных сообщений (очищаем от CSV мусора)
    const cleanMessages = contextMessages.map(msg => {
      // Убираем CSV артефакты (ID, точки с запятой и т.д.)
      return msg
        .replace(/^\d+\.?\s*/, '') // Убираем номера в начале
        .replace(/;\d+;+/g, ' ') // Убираем CSV разделители
        .replace(/https?:\/\/[^\s]+/g, '') // Убираем ссылки
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
    }).filter(msg => msg.length > 10); // Оставляем только содержательные

    const contextText = cleanMessages.length > 0
      ? cleanMessages.map((msg, i) => `${i + 1}. "${msg}"`).join('\n\n')
      : 'Контекст не доступен.';

    // Формируем историю чата (последние 3 сообщения для экономии токенов)
    const historyText = chatHistory.slice(-3).map(msg =>
      `${msg.role === 'user' ? 'Пользователь' : 'Ты'}: ${msg.content}`
    ).join('\n');

    // Создаем промпт для AI (оптимизированный для Gemini)
    const prompt = `Ты — AI-ассистент, который помогает имитировать стиль общения российского политика на основе его реальных сообщений из Telegram.

📚 ТВОЯ ЗАДАЧА:
1. ИЗУЧИ примеры высказываний политика ниже
2. ПРОАНАЛИЗИРУЙ его стиль, манеру речи, темы, позиции
3. СГЕНЕРИРУЙ свой собственный УНИКАЛЬНЫЙ ответ на вопрос пользователя в таком же стиле

⚠️ КРИТИЧЕСКИ ВАЖНО:
- НЕ копируй дословно фразы из примеров
- НЕ склеивай куски текста из разных сообщений
- НЕ повторяй одни и те же заключительные фразы в каждом ответе
- ВАРЬИРУЙ структуру и содержание ответов - каждый должен быть УНИКАЛЬНЫМ
- ГЕНЕРИРУЙ свой текст, но в СТИЛЕ этого политика
- Используй примеры как СПРАВОЧНИК о взглядах и манере речи
- Если тема есть в примерах - опирайся на его позицию
- Если темы нет - отвечай в общем стиле, не выдумывая конкретных фактов

📋 СТИЛЬ И МАНЕРА (что анализировать в примерах):
- Лексика (формальная/неформальная, сарказм, резкость)
- Длина предложений (короткие/развернутые)
- Темы и позиции (экономика, политика, социальные вопросы)
- Отношение к разным странам/институтам
- Характерные обороты речи
- НО каждый ответ должен быть РАЗНЫМ по структуре

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 ПРИМЕРЫ ВЫСКАЗЫВАНИЙ ПОЛИТИКА:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${historyText ? `💬 ИСТОРИЯ ТЕКУЩЕГО ДИАЛОГА:\n${historyText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` : ''}❓ ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${userMessage}

🎯 ИНСТРУКЦИЯ:
Проанализируй примеры выше и ответь на вопрос ОТ ЛИЦА политика.
Генерируй СВОЙ ОРИГИНАЛЬНЫЙ текст в его стиле (2-4 предложения).
НЕ копируй дословно, НЕ склеивай куски - создавай уникальный ответ.
ВАЖНО: НЕ используй шаблонные заключительные фразы типа "Время расставит всё по местам" - варьируй концовки!

💬 ТВОЙ ОТВЕТ:`;

    console.log(`\n📤 Промпт готов (${prompt.length} символов)\n`);

    try {
      // Пробуем использовать Gemini
      const geminiModel = getGeminiModel();

      if (geminiModel) {
        try {
          console.log('🔷 Используем Gemini API...');
          const result = await geminiModel.generateContent(prompt);
          const response = await result.response;
          const answer = response.text().trim();

          console.log(`✅ Ответ получен от Gemini: ${answer.substring(0, 100)}...\n`);
          return answer;
        } catch (geminiError) {
          console.error('❌ Ошибка Gemini API:', geminiError.message);
          console.log('⚠️  Переключаемся на Ollama (fallback)...\n');
          // Продолжаем к Ollama
        }
      } else {
        console.log('⚠️  Gemini недоступен, используем Ollama...\n');
      }

      // Fallback на Ollama
      console.log('🟠 Используем Ollama...');
      const answer = await generateWithOllama(prompt);
      console.log(`✅ Ответ получен от Ollama: ${answer.substring(0, 100)}...\n`);
      return answer;

    } catch (error) {
      console.error('❌ Критическая ошибка при генерации ответа:');
      console.error('   Тип:', error.name);
      console.error('   Сообщение:', error.message);
      return 'Извините, произошла ошибка при обработке вашего сообщения.';
    }
  }

  /**
   * Получить статус загрузки
   */
  getStatus() {
    return {
      isLoaded: this.isLoaded,
      messagesCount: this.context.length
    };
  }
}

// Создаем единственный экземпляр (singleton)
const politicianChatbot = new PoliticianChatbot();

module.exports = politicianChatbot;

