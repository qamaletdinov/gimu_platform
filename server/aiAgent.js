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

async function generateExamTest(questionsText, courseId) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const db = require('./db/index.js');
  const fs = require('fs').promises;
  const path = require('path');

  const questions = questionsText.split('\n').filter(q => q.trim().length > 5);
  const testQuestions = [];

  for (const question of questions) {
    let context = '';
    let relevantChunks = [];

    // Пробуем получить контекст через RAG (векторная БД)
    try {
      relevantChunks = await queryByText(question, courseId);
      if (relevantChunks && relevantChunks.length > 0) {
        context = relevantChunks.join("\n\n---\n\n");
        console.log(`✅ Контекст получен через RAG для вопроса: ${question.substring(0, 50)}...`);
      }
    } catch (ragError) {
      console.log(`⚠️ RAG недоступен, используем fallback для: ${question.substring(0, 50)}...`);
    }

    // Fallback: если RAG не сработал, читаем материалы курса из файлов
    if (!context) {
      try {
        const materials = await db.all(
          'SELECT content FROM materials WHERE course_id = ?',
          [courseId]
        );

        if (materials && materials.length > 0) {
          // Берем все материалы курса
          context = materials.map(m => m.content).join('\n\n---\n\n');
          console.log(`📚 Контекст получен из БД для вопроса: ${question.substring(0, 50)}...`);
        } else {
          console.log(`⚠️ Нет материалов для курса ${courseId}`);
          continue;
        }
      } catch (dbError) {
        console.error(`❌ Ошибка чтения материалов из БД:`, dbError.message);
        continue;
      }
    }

    if (!context) {
      console.log(`⚠️ Нет контекста для вопроса: ${question}`);
      continue;
    }

    const prompt = `Ты — эксперт по созданию экзаменационных тестов. На основе учебного материала создай тестовый вопрос.

📚 УЧЕБНЫЙ МАТЕРИАЛ:
${context.substring(0, 3000)} 

❓ ЭКЗАМЕНАЦИОННЫЙ ВОПРОС:
"${question}"

🎯 ЗАДАЧА:
Создай тестовый вопрос с 4 вариантами ответа (A, B, C, D), где ТОЛЬКО ОДИН правильный.

📋 ТРЕБОВАНИЯ:
1. Правильный ответ должен быть основан СТРОГО на материале выше
2. Неправильные варианты должны быть правдоподобными, но ошибочными
3. Все варианты должны быть примерно одинаковой длины
4. Формат ответа - СТРОГО JSON

ФОРМАТ ОТВЕТА (JSON):
{
  "question": "Переформулированный вопрос для теста",
  "options": {
    "A": "Первый вариант ответа",
    "B": "Второй вариант ответа",
    "C": "Третий вариант ответа",
    "D": "Четвертый вариант ответа"
  },
  "correct": "A",
  "explanation": "Краткое объяснение почему этот ответ правильный"
}

ВЕРНИ ТОЛЬКО JSON, БЕЗ ДОПОЛНИТЕЛЬНОГО ТЕКСТА:`;

    try {
      let result;

      // Пробуем использовать Gemini
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
            }
          });

          const geminiResult = await model.generateContent(prompt);
          const geminiResponse = await geminiResult.response;
          result = geminiResponse.text().trim();
          console.log(`🔷 Тест сгенерирован через Gemini`);
        } catch (geminiError) {
          console.log('⚠️ Gemini недоступен, используем Ollama');
          result = await generateWithOllama(prompt);
          console.log(`🟠 Тест сгенерирован через Ollama`);
        }
      } else {
        result = await generateWithOllama(prompt);
        console.log(`🟠 Тест сгенерирован через Ollama`);
      }

      // Очищаем JSON от markdown
      const cleaned = cleanText(result);
      const testQuestion = JSON.parse(cleaned);

      testQuestions.push({
        id: testQuestions.length + 1,
        originalQuestion: question,
        ...testQuestion
      });

      console.log(`✅ Вопрос ${testQuestions.length} добавлен в тест`);

    } catch (error) {
      console.error(`❌ Ошибка генерации теста для вопроса "${question}":`, error.message);
    }
  }

  console.log(`✅ Тест готов: ${testQuestions.length} вопросов`);
  return testQuestions;
}

async function checkExamAnswers(userAnswers, correctAnswers) {
  const results = [];
  let totalScore = 0;
  const maxScore = correctAnswers.length;

  for (let i = 0; i < correctAnswers.length; i++) {
    const correctAnswer = correctAnswers[i];
    const userAnswer = userAnswers.find(ua => ua.id === correctAnswer.id);

    const isCorrect = userAnswer && userAnswer.answer === correctAnswer.correct;

    results.push({
      id: correctAnswer.id,
      question: correctAnswer.question,
      userAnswer: userAnswer ? userAnswer.answer : null,
      correctAnswer: correctAnswer.correct,
      isCorrect: isCorrect,
      options: correctAnswer.options,
      explanation: correctAnswer.explanation
    });

    if (isCorrect) {
      totalScore++;
    }
  }

  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    results,
    totalScore,
    maxScore,
    percentage,
    passed: percentage >= 60 // 60% для сдачи
  };
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
  generateExamTest,
  checkExamAnswers,
  processHomework
};
