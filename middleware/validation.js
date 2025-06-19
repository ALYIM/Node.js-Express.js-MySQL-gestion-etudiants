const Student = require('../models/Student');

const validateStudent = async (req, res, next) => {
    const studentData = req.body;
    const isUpdate = req.method === 'PUT' || req.method === 'PATCH';
    const studentId = isUpdate ? req.params.id : null;

    // Nettoyage des données
    const sanitizedData = Student.sanitizeData(studentData);
    
    // Validation des données
    const { isValid, errors: validationErrors } = Student.validate(sanitizedData, isUpdate);

    // Vérification de l'unicité de l'email (uniquement pour les nouvelles inscriptions)
    if (!isUpdate && sanitizedData.email) {
        try {
            const emailExists = await Student.emailExists(sanitizedData.email);
            if (emailExists) {
                validationErrors.email = 'Cet email est déjà utilisé par un autre étudiant';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'email:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de l\'email'
            });
        }
    }

    // Vérification de l'unicité de l'email pour les mises à jour
    if (isUpdate && sanitizedData.email) {
        try {
            const emailExists = await Student.emailExists(sanitizedData.email, studentId);
            if (emailExists) {
                validationErrors.email = 'Cet email est déjà utilisé par un autre étudiant';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'email:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de l\'email'
            });
        }
    }

    if (!isValid || Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: validationErrors
        });
    }

    // Ajout des données nettoyées à la requête pour les middlewares suivants
    req.validatedStudentData = sanitizedData;
    next();
};

module.exports = { validateStudent };