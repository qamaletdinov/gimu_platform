const { ChromaClient } = require('chromadb');
const axios = require('axios');
const { extractText } = require('./utils/fileParser.js');
const { LOCAL_AI_URL, EMBEDDING_MODEL } = require('./config.js');

const client = new ChromaClient();
const COLLECTION_NAME = "gimu_collection";

async function getEmbeddings(text) {
  try {
    const response = await axios.post(`${LOCAL_AI_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error(`Error getting embeddings from local AI:`, error.message);
    throw new Error('Failed to get embeddings from local AI server.');
  }
}

async function getCollection() {
  try {
    // Попытка получить коллекцию. Если ее нет, будет ошибка.
    return await client.getCollection({ name: COLLECTION_NAME });
  } catch (e) {
    // Если коллекция не найдена, создаем ее.
    return await client.createCollection({ name: COLLECTION_NAME });
  }
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

async function indexFile(fileRecord, fileBuffer) {
  console.log(`Indexing file from buffer: ${fileRecord.file_name}`);
  const collection = await getCollection();

  const text = await extractText(fileBuffer, fileRecord.file_name);
  if (!text) return;

  const chunks = chunkText(text);
  const trimmedChunks = chunks.map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
  if (trimmedChunks.length === 0) return;

  const embeddings = [];
  for (const chunk of trimmedChunks) {
    const embedding = await getEmbeddings(chunk);
    embeddings.push(embedding);
  }

  const ids = trimmedChunks.map((_, index) => `file${fileRecord.id}_chunk${index}`);
  const metadatas = trimmedChunks.map(() => ({
    courseId: fileRecord.course_id, // course_id уже число
    fileName: fileRecord.file_name,
  }));

  await collection.add({ ids, embeddings, documents: trimmedChunks, metadatas });
  console.log(`Successfully indexed ${trimmedChunks.length} chunks from ${fileRecord.file_name}.`);
}

async function queryByText(queryText, courseId) {
  const collection = await getCollection();
  
  const trimmedQueryText = queryText.trim();
  if (trimmedQueryText.length === 0) throw new Error("Query text cannot be empty after trimming.");

  const queryEmbedding = await getEmbeddings(trimmedQueryText);

  // --- ИСПРАВЛЕНО ЗДЕСЬ: Гарантируем, что ищем по числу ---
  const numericCourseId = parseInt(courseId, 10);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
    where: { "courseId": numericCourseId },
  });

  return results.documents[0];
}

module.exports = { indexFile, queryByText };
