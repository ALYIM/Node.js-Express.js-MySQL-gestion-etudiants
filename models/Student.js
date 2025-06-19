const pool = require('../config/database');

class Student {
    constructor(data) {
        this.nom = data.nom;
        this.prenom = data.prenom;
        this.email = data.email;
        this.telephone = data.telephone;
        this.date_naissance = data.date_naissance;
        this.adresse = data.adresse;
        this.niveau_etude = data.niveau_etude;
        this.filiere = data.filiere;
        this.statut = data.statut || 'actif';
        this.date_inscription = data.date_inscription;
    }

    // Créer un étudiant
    async save() {
        const query = `
            INSERT INTO etudiants (nom, prenom, email, telephone, date_naissance, adresse, niveau_etude, filiere, statut, date_inscription)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Nettoyer et valider les données avant insertion
        const cleanData = Student.sanitizeData(this);
        const validation = Student.validate(cleanData);
        
        if (!validation.isValid) {
            const error = new Error('Données invalides');
            error.validationErrors = validation.errors;
            throw error;
        }
        
        const values = [
            cleanData.nom, 
            cleanData.prenom, 
            cleanData.email, 
            cleanData.telephone,
            cleanData.date_naissance, 
            cleanData.adresse, 
            cleanData.niveau_etude,
            cleanData.filiere, 
            cleanData.statut, 
            cleanData.date_inscription || new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
        ];

        try {
            const [result] = await pool.execute(query, values);
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l\'étudiant:', error);
            
            // Gérer les erreurs spécifiques de MySQL
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('email')) {
                    const customError = new Error('Cette adresse email est déjà utilisée');
                    customError.code = 'EMAIL_EXISTS';
                    throw customError;
                }
            }
            
            throw error;
        }
    }

    // Récupérer tous les étudiants
    static async findAll() {
        const query = 'SELECT * FROM etudiants ORDER BY date_inscription DESC, nom, prenom';
        try {
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des étudiants:', error);
            throw error;
        }
    }

    // Récupérer un étudiant par ID
    static async findById(id) {
        const query = 'SELECT * FROM etudiants WHERE id = ?';
        try {
            const [rows] = await pool.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'étudiant:', error);
            throw error;
        }
    }

    // Mettre à jour un étudiant
    static async update(id, data) {
        // Nettoyer et valider les données
        const cleanData = Student.sanitizeData(data);
        const validation = Student.validate(cleanData, true);
        
        if (!validation.isValid) {
            const error = new Error('Données invalides');
            error.validationErrors = validation.errors;
            throw error;
        }

        // Vérifier que l'étudiant existe
        const existingStudent = await Student.findById(id);
        if (!existingStudent) {
            const error = new Error('Étudiant non trouvé');
            error.code = 'NOT_FOUND';
            throw error;
        }

        const query = `
            UPDATE etudiants 
            SET nom=?, prenom=?, email=?, telephone=?, date_naissance=?, 
                adresse=?, niveau_etude=?, filiere=?, statut=?, 
                date_modification=CURRENT_TIMESTAMP
            WHERE id=?
        `;
        
        const values = [
            cleanData.nom, 
            cleanData.prenom, 
            cleanData.email, 
            cleanData.telephone, 
            cleanData.date_naissance,
            cleanData.adresse, 
            cleanData.niveau_etude, 
            cleanData.filiere, 
            cleanData.statut, 
            id
        ];

        try {
            const [result] = await pool.execute(query, values);
            
            if (result.affectedRows === 0) {
                const error = new Error('Aucune modification effectuée');
                error.code = 'NO_CHANGES';
                throw error;
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            
            // Gérer les erreurs spécifiques
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('email')) {
                    const customError = new Error('Cette adresse email est déjà utilisée par un autre étudiant');
                    customError.code = 'EMAIL_EXISTS';
                    throw customError;
                }
            }
            
            throw error;
        }
    }

    // Supprimer un étudiant
    static async delete(id) {
        // Vérifier que l'étudiant existe
        const existingStudent = await Student.findById(id);
        if (!existingStudent) {
            const error = new Error('Étudiant non trouvé');
            error.code = 'NOT_FOUND';
            throw error;
        }

        const query = 'DELETE FROM etudiants WHERE id = ?';
        try {
            const [result] = await pool.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            throw error;
        }
    }

    // Vérifier si un email existe déjà
    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM etudiants WHERE email = ?';
        const params = [email.toLowerCase().trim()];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        try {
            const [rows] = await pool.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'email:', error);
            throw error;
        }
    }

    // Rechercher des étudiants
    static async search(searchTerm) {
        const query = `
            SELECT * FROM etudiants 
            WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR filiere LIKE ?
            ORDER BY nom, prenom
        `;
        const pattern = `%${searchTerm}%`;
        try {
            const [rows] = await pool.execute(query, [pattern, pattern, pattern, pattern]);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            throw error;
        }
    }

    // Obtenir les statistiques
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM etudiants');
            const total = totalResult[0].total;

            const [statusResult] = await pool.execute(
                'SELECT statut, COUNT(*) as count FROM etudiants GROUP BY statut'
            );
            const byStatus = {};
            statusResult.forEach(r => { byStatus[r.statut] = r.count; });

            const [levelResult] = await pool.execute(
                'SELECT niveau_etude, COUNT(*) as count FROM etudiants WHERE niveau_etude IS NOT NULL GROUP BY niveau_etude'
            );
            const byLevel = {};
            levelResult.forEach(r => { byLevel[r.niveau_etude] = r.count; });

            const [fieldResult] = await pool.execute(
                `SELECT filiere, COUNT(*) as count 
                 FROM etudiants 
                 WHERE filiere IS NOT NULL AND filiere != "" 
                 GROUP BY filiere 
                 ORDER BY count DESC 
                 LIMIT 10`
            );
            const byField = {};
            fieldResult.forEach(r => { byField[r.filiere] = r.count; });

            const [monthResult] = await pool.execute(
                `SELECT COUNT(*) as count 
                 FROM etudiants 
                 WHERE MONTH(date_inscription) = MONTH(CURRENT_DATE()) 
                   AND YEAR(date_inscription) = YEAR(CURRENT_DATE())`
            );
            const thisMonth = monthResult[0].count;

            return { total, byStatus, byLevel, byField, thisMonth };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }

    // Validation des données - VERSION CORRIGÉE
    static validate(data, isUpdate = false) {
        const errors = {};

        // Validation du nom (obligatoire)
        if (!data.nom || typeof data.nom !== 'string' || data.nom.trim().length < 2) {
            errors.nom = 'Le nom doit contenir au moins 2 caractères';
        }

        // Validation du prénom (obligatoire)
        if (!data.prenom || typeof data.prenom !== 'string' || data.prenom.trim().length < 2) {
            errors.prenom = 'Le prénom doit contenir au moins 2 caractères';
        }

        // Validation de l'email (obligatoire)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
            errors.email = 'Veuillez saisir une adresse email valide';
        }

        // Validation du téléphone (optionnel mais si fourni, doit être valide)
        if (data.telephone && data.telephone.trim()) {
            const phoneRegex = /^[+]?[\d\s\-()]{8,20}$/;
            if (!phoneRegex.test(data.telephone.trim())) {
                errors.telephone = 'Format de téléphone invalide (8-20 caractères, chiffres, espaces, +, -, () autorisés)';
            }
        }

        // Validation du statut
        const validStatuses = ['actif', 'inactif', 'diplome'];
        if (data.statut && !validStatuses.includes(data.statut)) {
            errors.statut = 'Statut invalide. Valeurs autorisées: actif, inactif, diplome';
        }

        // Validation de la date de naissance
        if (data.date_naissance) {
            const birthDate = new Date(data.date_naissance);
            const today = new Date();
            
            if (isNaN(birthDate.getTime())) {
                errors.date_naissance = 'Format de date invalide (YYYY-MM-DD attendu)';
            } else {
                // Calculer l'âge
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                if (age < 16) {
                    errors.date_naissance = 'L\'étudiant doit avoir au moins 16 ans';
                } else if (age > 100) {
                    errors.date_naissance = 'L\'âge ne peut pas dépasser 100 ans';
                }
                
                // Vérifier que la date n'est pas dans le futur
                if (birthDate > today) {
                    errors.date_naissance = 'La date de naissance ne peut pas être dans le futur';
                }
            }
        }

        // Validation de la filière
        if (data.filiere && typeof data.filiere === 'string' && data.filiere.trim().length > 100) {
            errors.filiere = 'La filière ne peut pas dépasser 100 caractères';
        }

        // Validation de l'adresse
        if (data.adresse && typeof data.adresse === 'string' && data.adresse.trim().length > 500) {
            errors.adresse = 'L\'adresse ne peut pas dépasser 500 caractères';
        }

        // Validation du niveau d'étude
        if (data.niveau_etude && typeof data.niveau_etude === 'string' && data.niveau_etude.trim().length > 50) {
            errors.niveau_etude = 'Le niveau d\'étude ne peut pas dépasser 50 caractères';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Nettoyage des données - VERSION CORRIGÉE
    static sanitizeData(data) {
        const sanitized = {
            nom: data.nom ? data.nom.toString().trim() : '',
            prenom: data.prenom ? data.prenom.toString().trim() : '',
            email: data.email ? data.email.toString().trim().toLowerCase() : '',
            telephone: data.telephone ? data.telephone.toString().trim() : null,
            date_naissance: data.date_naissance || null,
            adresse: data.adresse ? data.adresse.toString().trim() : null,
            niveau_etude: data.niveau_etude ? data.niveau_etude.toString().trim() : null,
            filiere: data.filiere ? data.filiere.toString().trim() : null,
            statut: data.statut || 'actif',
            date_inscription: data.date_inscription || new Date().toISOString().split('T')[0]
        };

        // Nettoyer les valeurs vides
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === '' || sanitized[key] === 'null' || sanitized[key] === 'undefined') {
                if (['nom', 'prenom', 'email', 'statut'].includes(key)) {
                    // Ces champs ne peuvent pas être null
                    if (sanitized[key] === '') {
                        sanitized[key] = null; // Sera attrapé par la validation
                    }
                } else {
                    sanitized[key] = null;
                }
            }
        });

        return sanitized;
    }

    // Méthode utilitaire pour créer un étudiant (méthode statique)
    static async create(data) {
        const student = new Student(data);
        const id = await student.save();
        return await Student.findById(id);
    }
}

module.exports = Student;