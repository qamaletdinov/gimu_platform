/**
 * Тест подключения к Gemini API
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('🧪 Тест подключения к Gemini API\n');

  // Проверяем API ключ
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY не установлен в .env файле!');
    return;
  }

  console.log(`✅ API ключ найден: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);

  try {
    // Инициализируем Gemini
    console.log('\n📡 Инициализация Gemini AI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    console.log('✅ Gemini модель инициализирована (gemini-2.0-flash-exp)');

    // Тестовый запрос
    console.log('\n📤 Отправка тестового запроса...');
    const prompt = 'Привет! Ответь одним словом: работает ли API?';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('\n✅ Ответ получен от Gemini:');
    console.log(`   "${text}"`);
    console.log('\n🎉 Gemini API работает корректно!');

  } catch (error) {
    console.error('\n❌ Ошибка при работе с Gemini API:');
    console.error(`   Тип: ${error.name}`);
    console.error(`   Сообщение: ${error.message}`);

    if (error.response) {
      console.error('   Response:', error.response);
    }

    if (error.message.includes('API_KEY')) {
      console.error('\n💡 Проверьте правильность API ключа в .env файле');
    }

    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

testGemini();

