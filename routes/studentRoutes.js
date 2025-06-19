// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { validateStudent } = require('../middleware/validation');

// Routes pour les étudiants
router.get('/search', StudentController.searchStudents);          // Changé search → searchStudents
router.get('/stats', StudentController.getStats);                // Changé stats → getStats
router.get('/', StudentController.getAllStudents);               // OK
router.get('/:id', StudentController.getStudentById);            // OK
router.post('/', validateStudent, StudentController.createStudent); // OK
router.put('/:id', validateStudent, StudentController.updateStudent);  // Changé update → updateStudent
router.delete('/:id', StudentController.deleteStudent);          // Changé destroy → deleteStudent

module.exports = router;