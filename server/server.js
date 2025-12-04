const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');

const db = require('./db/index.js');
const authRoutes = require('./routes/auth.js');
const courseRoutes = require('./routes/courses.js');
const chatbotRoutes = require('./routes/chatbot.js');
const politicianChatbot = require('./politicianChatbot.js');
const { summarizeText, generateQuiz, processHomework, generateExamAnswers, generateExamTest, checkExamAnswers } = require('./aiAgent.js');
const { ChromaClient } = require('chromadb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001; // Используем порт из .env или 3001
const upload = multer({ storage: multer.memoryStorage() });

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/', (req, res) => {
  res.send('GIMU Platform Backend is running.');
});

app.get('/api/courses/:courseId/materials', async (req, res) => {
  const { courseId } = req.params;
  try {
    const client = new ChromaClient();
    let collection;
    try {
      collection = await client.getCollection({ name: "gimu_collection" });
    } catch (e) {
      return res.status(404).json({ error: 'No materials found for this course (Collection missing).' });
    }
    
    const results = await collection.get({ where: { "courseId": parseInt(courseId, 10) } });

    if (!results || results.documents.length === 0) {
      return res.status(404).json({ error: 'No materials found for this course to summarize.' });
    }
    
    const combinedContent = results.documents.join('\n\n---\n\n');
    console.log(`[Materials RAG] Combined content length for course ${courseId}: ${combinedContent.length}`);
    // console.log(`[Materials RAG] Combined content sample: ${combinedContent.substring(0, 500)}`); // Uncomment if needed for deeper debug
    
    let summary;
    try {
        summary = await summarizeText(combinedContent);
        console.log(`[Materials RAG] Summary snippet for course ${courseId}: ${summary.substring(0, 200)}...`);
    } catch (summarizeError) {
        console.error(`[Materials RAG] Error during summarizeText for course ${courseId}:`, summarizeError);
        throw summarizeError; // Re-throw to be caught by the outer catch block
    }
    res.json({ content: summary });

  } catch (error) {
    console.error('Error in materials RAG pipeline:', error);
    res.status(500).json({ error: 'Failed to process request for materials.' });
  }
});

app.get('/api/courses/:courseId/quiz', async (req, res) => {
    const { courseId } = req.params;
    try {
        const client = new ChromaClient();
        let collection;
        try {
            collection = await client.getCollection({ name: "gimu_collection" });
        } catch (e) {
            return res.status(404).json({ error: 'No materials found for this course to generate a quiz (Collection missing).' });
        }

        const results = await collection.get({ where: { "courseId": parseInt(courseId, 10) } });

        if (!results || results.documents.length === 0) {
            return res.status(404).json({ error: 'No materials found for this course to generate a quiz.' });
        }

        const combinedContent = results.documents.join('\n\n---\n\n');
        const quiz = await generateQuiz(combinedContent);
        res.json({ content: quiz });
    } catch (error) {
        console.error('Error in quiz RAG pipeline:', error);
        res.status(500).json({ error: 'Failed to process request for quiz.' });
    }
});

app.post('/api/homework', async (req, res) => {
    const { taskDescription, courseId } = req.body;
    if (!taskDescription || !courseId) {
        return res.status(400).json({ error: 'Task description and course ID are required.' });
    }
    try {
        const generatedContent = await processHomework(taskDescription, courseId);
        res.json({ content: generatedContent });
    } catch (error) {
        console.error('Error processing homework:', error);
        res.status(500).json({ error: 'Failed to process homework' });
    }
});

app.post('/api/exams/prepare', upload.single('questionsFile'), async (req, res) => {
    const { courseId } = req.body;
    if (!req.file || !courseId) {
        return res.status(400).json({ error: 'File and course ID are required.' });
    }
    const questionsText = req.file.buffer.toString('utf-8');
    try {
        const answers = await generateExamAnswers(questionsText, courseId);
        res.json(answers);
    } catch (error) {
        console.error('Detailed error in /api/exams/prepare:', error);
        res.status(500).json({ error: 'Failed to process exam file.' });
    }
});

app.post('/api/exams/generate-test', upload.single('questionsFile'), async (req, res) => {
    const { courseId } = req.body;
    if (!req.file || !courseId) {
        return res.status(400).json({ error: 'File and course ID are required.' });
    }
    const questionsText = req.file.buffer.toString('utf-8');
    try {
        console.log(`📝 Генерация теста для курса ${courseId}...`);
        const testQuestions = await generateExamTest(questionsText, courseId);
        console.log(`✅ Сгенерировано ${testQuestions.length} вопросов для теста`);
        res.json(testQuestions);
    } catch (error) {
        console.error('Detailed error in /api/exams/generate-test:', error);
        res.status(500).json({ error: 'Failed to generate test.' });
    }
});

app.post('/api/exams/check-answers', async (req, res) => {
    const { userAnswers, correctAnswers } = req.body;
    if (!userAnswers || !correctAnswers) {
        return res.status(400).json({ error: 'User answers and correct answers are required.' });
    }
    try {
        const results = await checkExamAnswers(userAnswers, correctAnswers);
        res.json(results);
    } catch (error) {
        console.error('Error in /api/exams/check-answers:', error);
        res.status(500).json({ error: 'Failed to check answers.' });
    }
});


app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Автозагрузка данных чат-бота, если настроено в .env
  if (process.env.CHATBOT_AUTOLOAD === 'true' && process.env.CHATBOT_CSV_FILE) {
    console.log('🤖 Автозагрузка данных чат-бота...');
    try {
      const csvPath = path.join(__dirname, 'storage', process.env.CHATBOT_CSV_FILE);
      const count = await politicianChatbot.loadTelegramData(csvPath);
      console.log(`✅ Чат-бот загружен: ${count} сообщений`);
    } catch (error) {
      console.error('❌ Ошибка автозагрузки чат-бота:', error.message);
      console.log('💡 Вы можете загрузить данные вручную: node scripts/load-chatbot-data.js');
    }
  } else {
    console.log('ℹ️  Чат-бот: автозагрузка отключена. Используйте: node scripts/load-chatbot-data.js <файл.csv>');
  }
});
