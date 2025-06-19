const Student = require('../models/Student');

class StudentController {
    // Obtenir tous les étudiants
    static async getAllStudents(req, res) {
        try {
            const students = await Student.findAll();
            
            res.json({
                success: true,
                data: students,
                message: 'Étudiants récupérés avec succès',
                count: students.length
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des étudiants:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des étudiants',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtenir un étudiant par ID
    static async getStudentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID invalide'
                });
            }

            const student = await Student.findById(id);
            
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Étudiant non trouvé'
                });
            }

            res.json({
                success: true,
                data: student,
                message: 'Étudiant récupéré avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'étudiant:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Créer un nouvel étudiant
    static async createStudent(req, res) {
        try {
            console.log('Données reçues:', req.body);
            
            // Vérifier si l'email existe déjà
            const emailExists = await Student.emailExists(req.body.email);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Cette adresse email est déjà utilisée',
                    field: 'email'
                });
            }

            // Créer l'étudiant
            const student = await Student.create(req.body);
            
            console.log('Étudiant créé avec succès:', student);
            
            res.status(201).json({
                success: true,
                data: student,
                message: 'Étudiant créé avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de la création de l\'étudiant:', error);
            
            // Gérer les erreurs de validation
            if (error.validationErrors) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: error.validationErrors
                });
            }
            
            // Gérer les erreurs spécifiques
            if (error.code === 'EMAIL_EXISTS') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    field: 'email'
                });
            }
            
            // Erreur générale
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'étudiant',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Mettre à jour un étudiant
    static async updateStudent(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID invalide'
                });
            }
            
            console.log('Mise à jour étudiant ID:', id, 'Données:', req.body);

            // Vérifier si l'email existe déjà (en excluant l'étudiant actuel)
            if (req.body.email) {
                const emailExists = await Student.emailExists(req.body.email, id);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cette adresse email est déjà utilisée par un autre étudiant',
                        field: 'email'
                    });
                }
            }

            // Effectuer la mise à jour
            const success = await Student.update(id, req.body);
            
            if (success) {
                // Récupérer l'étudiant mis à jour
                const updatedStudent = await Student.findById(id);
                
                console.log('Étudiant mis à jour avec succès:', updatedStudent);
                
                res.json({
                    success: true,
                    data: updatedStudent,
                    message: 'Étudiant mis à jour avec succès'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Étudiant non trouvé ou aucune modification effectuée'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            
            // Gérer les erreurs de validation
            if (error.validationErrors) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreurs de validation',
                    errors: error.validationErrors
                });
            }
            
            // Gérer les erreurs spécifiques
            if (error.code === 'NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.code === 'EMAIL_EXISTS') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    field: 'email'
                });
            }
            
            // Erreur générale
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Supprimer un étudiant
    static async deleteStudent(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID invalide'
                });
            }

            console.log('Suppression étudiant ID:', id);

            const success = await Student.delete(id);
            
            if (success) {
                console.log('Étudiant supprimé avec succès');
                res.json({
                    success: true,
                    message: 'Étudiant supprimé avec succès'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Étudiant non trouvé'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            
            if (error.code === 'NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Rechercher des étudiants
    static async searchStudents(req, res) {
        try {
            const searchTerm = req.query.q;
            
            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Le terme de recherche doit contenir au moins 2 caractères'
                });
            }

            const students = await Student.search(searchTerm.trim());
            
            res.json({
                success: true,
                data: students,
                message: `${students.length} étudiant(s) trouvé(s)`,
                searchTerm: searchTerm.trim(),
                count: students.length
            });
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtenir les statistiques
    static async getStats(req, res) {
        try {
            const stats = await Student.getStats();
            
            res.json({
                success: true,
                data: stats,
                message: 'Statistiques récupérées avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = StudentController;