const { Router } = require('express');
const db = require('../db/index.js');
const { protect, authorize } = require('../middleware/auth.js');
const { indexFile } = require('../vectorDb.js');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, description FROM courses ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;
  try {
    const { rows } = await db.query(
      'INSERT INTO courses (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, userId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:courseId', protect, authorize('teacher', 'admin'), async (req, res) => {
  const { courseId } = req.params;
  try {
    await db.query('DELETE FROM courses WHERE id = ?', [courseId]);
    const dirPath = path.join(__dirname, '..', 'storage', courseId);
    await fs.rm(dirPath, { recursive: true, force: true }).catch(() => {});
    res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

router.post('/:courseId/upload', protect, authorize('teacher', 'admin'), upload.single('file'), async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  const decodedFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const fakeFilePath = `in-memory-buffer-for-${decodedFilename}`;

  try {
    const { rows } = await db.query(
      'INSERT INTO files (course_id, file_name, file_path, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [courseId, decodedFilename, fakeFilePath, 'document', userId]
    );
    const numericCourseId = parseInt(courseId, 10);
    const newFileRecord = { id: rows[0].id, course_id: numericCourseId, file_name: decodedFilename };

    await indexFile(newFileRecord, req.file.buffer);

    res.status(201).json({ message: 'File indexed successfully.', file: newFileRecord });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file metadata.' });
  }
});

module.exports = router;
