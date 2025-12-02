const dotenv = require('dotenv');
dotenv.config();

const LOCAL_AI_URL = process.env.LOCAL_AI_URL;
const CHAT_MODEL = process.env.LOCAL_AI_CHAT_MODEL;
const EMBEDDING_MODEL = process.env.LOCAL_AI_EMBEDDING_MODEL;

if (!LOCAL_AI_URL || !CHAT_MODEL || !EMBEDDING_MODEL) {
  throw new Error(
    'One or more environment variables are not set in your .env file. ' +
    'Please define LOCAL_AI_URL, LOCAL_AI_CHAT_MODEL, and LOCAL_AI_EMBEDDING_MODEL.'
  );
}

module.exports = {
  LOCAL_AI_URL,
  CHAT_MODEL,
  EMBEDDING_MODEL,
};
