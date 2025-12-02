const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');

const db = require('./db/index.js');
const authRoutes = require('./routes/auth.js');
const courseRoutes = require('./routes/courses.js');
const { summarizeText, generateQuiz, processHomework, generateExamAnswers } = require('./aiAgent.js');
const { ChromaClient } = require('chromadb');

const app = express();
const port = process.env.PORT || 3001; // Используем порт из .env или 3001
const upload = multer({ storage: multer.memoryStorage() });

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

app.get('/', (req, res) => {
  res.send('GIMU Platform Backend is running.');
});

app.get('/api/courses/:courseId/materials', async (req, res) => {
  const { courseId } = req.params;
  try {
    const client = new ChromaClient();
    const collection = await client.getCollection({ name: "gimu_collection" });
    const results = await collection.get({ where: { "courseId": parseInt(courseId, 10) } });

    if (!results || results.documents.length === 0) {
      return res.status(404).json({ error: 'No materials found for this course to summarize.' });
    }
    
    const combinedContent = results.documents.join('\n\n---\n\n');
    const summary = await summarizeText(combinedContent);
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
        const collection = await client.getCollection({ name: "gimu_collection" });
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


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
