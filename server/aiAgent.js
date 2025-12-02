const axios = require('axios');
const { queryByText } = require('./vectorDb.js');
const { LOCAL_AI_URL, CHAT_MODEL } = require('./config.js');

const cleanText = (text) => text.replace(/```json/g, '').replace(/```/g, '').trim();

async function generateWithOllama(prompt) {
  try {
    const response = await axios.post(`${LOCAL_AI_URL}/api/chat`, {
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });
    return response.data.message.content;
  } catch (error) {
    console.error(`Error communicating with local AI at ${LOCAL_AI_URL}:`, error.message);
    throw new Error('Failed to get response from local AI server.');
  }
}

async function summarizeText(text) {
  const prompt = `
    Ты — ИИ-ассистент в учебной платформе. Твоя задача — помочь студенту понять суть материала.
    Проанализируй следующий текст из лекций и создай из него краткий, но емкий конспект.
    
    Требования к конспекту:
    1.  **Ключевые тезисы:** Выдели 3-5 самых главных мыслей в виде списка.
    2.  **Краткий конспект:** Напиши связный текст (2-3 абзаца), который обобщает материал.
    3.  **Стиль:** Пиши в научном, но понятном стиле.

    Материал для анализа:
    ---
    ${text}
    ---
  `;
  return await generateWithOllama(prompt);
}

async function generateQuiz(text) {
  const prompt = `
    Ты — ИИ-ассистент, создающий тесты. Проанализируй текст на русском языке и создай по нему тест для самопроверки.
    
    Требования:
    1.  Все вопросы и варианты ответов должны быть на русском языке.
    2.  Создай 3 вопроса, которые проверяют понимание ИМЕННО ЭТОГО текста, а не общие знания.
    3.  **Обязательно верни результат в формате JSON.**

    Пример формата JSON:
    {
      "title": "Тест для самопроверки",
      "questions": [
        {
          "question": "Пример вопроса?",
          "options": ["Вариант А", "Вариант Б", "Вариант В"],
          "correctAnswer": "Вариант А"
        }
      ]
    }

    Текст для анализа:
    ---
    ${text}
    ---
  `;
  const result = await generateWithOllama(prompt);
  const jsonText = cleanText(result);
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from local AI for quiz:", jsonText);
    throw new Error("AI model returned invalid format for quiz.");
  }
}

async function generateExamAnswers(questionsText, courseId) {
  const questions = questionsText.split('\n').filter(q => q.trim().length > 5);
  const answers = [];
  for (const question of questions) {
    const relevantChunks = await queryByText(question, courseId);
    let answerText = '';
    if (!relevantChunks || relevantChunks.length === 0) {
      answerText = "Не удалось найти релевантную информацию в материалах курса для ответа на этот вопрос.";
    } else {
      const context = relevantChunks.join("\n\n---\n\n");
      const prompt = `
        Ты — ИИ-эксперт, который помогает студенту готовиться к экзамену.
        Твоя задача — дать максимально развернутый и подробный ответ на вопрос студента, основываясь **строго на предоставленном контексте из учебных материалов**.

        **Контекст из материалов курса:**
        ---
        ${context}
        ---

        **Экзаменационный вопрос:**
        "${question}"

        **Инструкция:**
        Сформулируй полный, исчерпывающий ответ на экзаменационный вопрос. Включи в ответ определения, ключевые аспекты и примеры, если они есть в контексте. Не придумывай информацию, которой нет в контексте.
      `;
      answerText = await generateWithOllama(prompt);
    }
    answers.push({ question, answer: answerText });
  }
  return answers;
}

async function processHomework(description, courseId) {
  const relevantChunks = await queryByText(description, courseId);
  if (!relevantChunks || relevantChunks.length === 0) {
    return "К сожалению, я не смог найти релевантную информацию в материалах курса, чтобы ответить на ваш вопрос. Попробуйте переформулировать его.";
  }
  const context = relevantChunks.join("\n\n---\n\n");
  const prompt = `
    Ты — ИИ-ассистент в учебной платформе. Твоя задача — помочь студенту выполнить домашнее задание, основываясь на материалах курса.
    
    **Контекст из материалов курса:**
    ---
    ${context}
    ---

    **Вопрос студента:**
    "${description}"

    **Инструкция:**
    Ответь на вопрос студента. Свой ответ формулируй **строго на основе предоставленного выше контекста**. Не придумывай информацию. Если контекст не позволяет ответить на вопрос, вежливо сообщи об этом.
  `;
  return await generateWithOllama(prompt);
}

module.exports = { 
  summarizeText, 
  generateQuiz, 
  generateExamAnswers,
  processHomework
};
