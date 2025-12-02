const fs = require('fs/promises');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

/**
 * Извлекает текст из буфера файла на основе его расширения.
 * @param {Buffer} buffer - Содержимое файла в виде буфера.
 * @param {string} filename - Имя файла для определения расширения.
 * @returns {Promise<string>} - Извлеченный текст.
 */
async function extractText(buffer, filename) {
  const extension = path.extname(filename).toLowerCase();

  try {
    switch (extension) {
      case '.txt':
        return buffer.toString('utf-8');
      
      case '.docx':
        if (!buffer || buffer.length === 0) {
          throw new Error("Buffer is empty, cannot parse DOCX.");
        }
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;

      case '.pdf':
        if (!buffer || buffer.length === 0) {
          throw new Error("Buffer is empty, cannot parse PDF.");
        }
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
      
      default:
        console.warn(`Unsupported file type: ${extension}. Skipping file.`);
        return '';
    }
  } catch (error) {
    console.error(`Failed to parse buffer for ${filename}:`, error);
    return '';
  }
}

module.exports = { extractText };
