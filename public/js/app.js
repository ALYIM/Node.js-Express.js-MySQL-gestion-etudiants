// Configuration de l'API
const API_BASE_URL = '/api/students';

// Variables globales
let students = [];
let isEditing = false;
let currentEditId = null;

// Elements du DOM
const elements = {
    formCard: document.getElementById('form-card'),
    toggleFormBtn: document.getElementById('toggle-form-btn'),
    studentForm: document.getElementById('student-form'),
    studentsTable: document.getElementById('students-table'),
    searchInput: document.getElementById('search-input'),
    loadingOverlay: document.getElementById('loading-overlay'),
    noStudents: document.getElementById('no-students'),
    formTitle: document.getElementById('form-title'),
    submitBtn: document.getElementById('submit-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
    exportBtn: document.getElementById('export-btn'),
    // Statistiques
    totalStudents: document.getElementById('total-students'),
    activeStudents: document.getElementById('active-students'),
    inactiveStudents: document.getElementById('inactive-students'),
    graduatedStudents: document.getElementById('graduated-students')
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    attachEventListeners();
});

// Initialisation
async function initializeApp() {
    try {
        showLoading(true);
        await loadStudents();
        await loadStats();
        console.log('✅ Application initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showAlert('Erreur lors du chargement des données', 'error');
    } finally {
        showLoading(false);
    }
}

// Attacher les événements
function attachEventListeners() {
    // Toggle du formulaire
    elements.toggleFormBtn.addEventListener('click', toggleForm);
    
    // Soumission du formulaire
    elements.studentForm.addEventListener('submit', handleFormSubmit);
    
    // Recherche
    elements.searchInput.addEventListener('input', handleSearch);
    
    // Export
    elements.exportBtn.addEventListener('click', exportToCSV);
    
    // Annuler
    elements.cancelBtn.addEventListener('click', resetForm);
}

// Afficher/Masquer le formulaire
function toggleForm() {
    const isVisible = elements.formCard.style.display !== 'none';
    
    if (isVisible) {
        hideForm();
    } else {
        showForm();
    }
}

function showForm() {
    elements.formCard.style.display = 'block';
    elements.toggleFormBtn.innerHTML = '<i class="bi bi-x-circle"></i> Masquer le formulaire';
    elements.toggleFormBtn.classList.remove('btn-primary');
    elements.toggleFormBtn.classList.add('btn-secondary');
    
    // Scroll vers le formulaire
    elements.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideForm() {
    elements.formCard.style.display = 'none';
    elements.toggleFormBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Ajouter un étudiant';
    elements.toggleFormBtn.classList.remove('btn-secondary');
    elements.toggleFormBtn.classList.add('btn-primary');
    resetForm();
}

// Réinitialiser le formulaire
function resetForm() {
    elements.studentForm.reset();
    document.getElementById('student-id').value = '';
    isEditing = false;
    currentEditId = null;
    
    // Réinitialiser l'interface
    elements.formTitle.textContent = 'Ajouter un étudiant';
    elements.submitBtn.innerHTML = '<i class="bi bi-save"></i> Ajouter';
    elements.submitBtn.classList.remove('btn-warning');
    elements.submitBtn.classList.add('btn-primary');
    
    // Effacer les erreurs
    clearErrors();
}

// Gestion de la soumission du formulaire
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        const formData = getFormData();
        
        // Validation simple
        if (!formData.nom || !formData.prenom || !formData.email) {
            throw new Error('Les champs Nom, Prénom et Email sont obligatoires');
        }

        if (isEditing && currentEditId) {
            await updateStudent(currentEditId, formData);
            showAlert('Étudiant mis à jour avec succès', 'success');
        } else {
            await createStudent(formData);
            showAlert('Étudiant ajouté avec succès', 'success');
        }

        await loadStudents();
        await loadStats();
        resetForm();
        hideForm();
    } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Récupérer les données du formulaire
function getFormData() {
    return {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        email: document.getElementById('email').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        date_naissance: document.getElementById('date_naissance').value || null,
        adresse: document.getElementById('adresse').value.trim(),
        niveau_etude: document.getElementById('niveau_etude').value,
        filiere: document.getElementById('specialite').value.trim(),
        statut: document.getElementById('statut').value
    };
}

// Créer un étudiant
async function createStudent(data) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw error;
    }
    
    return await response.json();
}

// Mettre à jour un étudiant
async function updateStudent(id, data) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw error;
    }
    
    return await response.json();
}

// Charger les étudiants
async function loadStudents() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des étudiants');
        }
        
        const result = await response.json();
        students = result.data || [];
        renderStudents(students);
        
    } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
        showAlert(error.message, 'error');
        throw error;
    }
}

// Charger les statistiques
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des statistiques');
        }
        
        const result = await response.json();
        const stats = result.data;
        
        elements.totalStudents.textContent = stats.total || 0;
        elements.activeStudents.textContent = stats.byStatus?.actif || 0;
        elements.inactiveStudents.textContent = stats.byStatus?.inactif || 0;
        elements.graduatedStudents.textContent = stats.byStatus?.diplome || 0;
        
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        showAlert('Erreur lors du chargement des statistiques', 'error');
    }
}

// Afficher les étudiants dans le tableau
function renderStudents(studentsArray) {
    if (!studentsArray || studentsArray.length === 0) {
        elements.studentsTable.innerHTML = '';
        elements.noStudents.style.display = 'block';
        return;
    }
    
    elements.noStudents.style.display = 'none';
    
    const tbody = elements.studentsTable;
    tbody.innerHTML = '';
    
    studentsArray.forEach(student => {
        const row = createStudentRow(student);
        tbody.appendChild(row);
    });
}

// Créer une ligne du tableau
function createStudentRow(student) {
    const row = document.createElement('tr');
    row.className = 'slide-up';
    
    row.innerHTML = `
        <td><strong>${escapeHtml(student.nom)}</strong></td>
        <td>${escapeHtml(student.prenom)}</td>
        <td>${escapeHtml(student.email)}</td>
        <td>${escapeHtml(student.telephone || '-')}</td>
        <td>${escapeHtml(student.filiere || '-')}</td>
        <td>${getStatusBadge(student.statut)}</td>
        <td class="text-end">
            <button class="btn btn-sm btn-info me-1" onclick="viewStudent(${student.id})" title="Voir">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning me-1" onclick="editStudent(${student.id})" title="Modifier">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="Supprimer">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    return row;
}

// Voir les détails d'un étudiant
function viewStudent(id) {
    const student = students.find(s => s.id === id);
    if (student) {
        Swal.fire({
            title: `${student.prenom} ${student.nom}`,
            html: `
                <div class="text-start">
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Téléphone:</strong> ${student.telephone || 'Non renseigné'}</p>
                    <p><strong>Date de naissance:</strong> ${student.date_naissance || 'Non renseignée'}</p>
                    <p><strong>Adresse:</strong> ${student.adresse || 'Non renseignée'}</p>
                    <p><strong>Niveau d'étude:</strong> ${student.niveau_etude}</p>
                    <p><strong>Filière:</strong> ${student.filiere || 'Non renseignée'}</p>
                    <p><strong>Statut:</strong> ${student.statut}</p>
                </div>
            `,
            confirmButtonText: 'Fermer'
        });
    }
}

// Modifier un étudiant
function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    isEditing = true;
    currentEditId = id;

    // Remplir le formulaire avec les données existantes
    document.getElementById('student-id').value = id;
    document.getElementById('nom').value = student.nom;
    document.getElementById('prenom').value = student.prenom;
    document.getElementById('email').value = student.email;
    document.getElementById('telephone').value = student.telephone || '';
    document.getElementById('date_naissance').value = student.date_naissance || '';
    document.getElementById('adresse').value = student.adresse || '';
    document.getElementById('niveau_etude').value = student.niveau_etude;
    document.getElementById('specialite').value = student.filiere || '';
    document.getElementById('statut').value = student.statut;

    elements.formTitle.textContent = 'Modifier un étudiant';
    elements.submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Mettre à jour';
    elements.submitBtn.classList.remove('btn-primary');
    elements.submitBtn.classList.add('btn-warning');

    showForm();
}

// Supprimer un étudiant
async function deleteStudent(id) {
    const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas annuler cette action!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        showAlert('Étudiant supprimé avec succès', 'success');
        await loadStudents();
        await loadStats();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showAlert('Échec de la suppression', 'error');
    } finally {
        showLoading(false);
    }
}

// Rechercher dans la liste
function handleSearch() {
    const query = elements.searchInput.value.toLowerCase();
    const filtered = students.filter(student =>
        student.nom.toLowerCase().includes(query) ||
        student.prenom.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.filiere && student.filiere.toLowerCase().includes(query))
    );
    renderStudents(filtered);
}

// Exporter en CSV
function exportToCSV() {
    if (students.length === 0) {
        showAlert('Aucun étudiant à exporter', 'warning');
        return;
    }
    
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Date de naissance', 'Adresse', 'Niveau d\'étude', 'Filière', 'Statut'];
    const rows = students.map(s => [
        `"${s.nom}"`,
        `"${s.prenom}"`,
        `"${s.email}"`,
        `"${s.telephone || ''}"`,
        `"${s.date_naissance || ''}"`,
        `"${s.adresse || ''}"`,
        `"${s.niveau_etude}"`,
        `"${s.filiere || ''}"`,
        `"${s.statut}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `etudiants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showAlert('Export CSV terminé', 'success');
}

// Utilitaires
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
    Swal.fire({
        title: type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Information',
        text: message,
        icon: type,
        confirmButtonText: 'OK'
    });
}

function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.style.display = 'none';
    });
}

// Générer le badge de statut
function getStatusBadge(status) {
    const classes = {
        'actif': 'success',
        'inactif': 'secondary',
        'diplome': 'info'
    };
    const badgeClass = classes[status] || 'light';
    return `<span class="badge bg-${badgeClass}">${status}</span>`;
}

// Échapper le HTML pour éviter les failles XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Rendre les fonctions accessibles globalement
window.viewStudent = viewStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.toggleForm = toggleForm;
window.resetForm = resetForm;