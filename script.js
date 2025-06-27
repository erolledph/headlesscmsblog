// Global variables
let currentUser = null;
let allContent = [];

// DOM elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// Tab elements
const navLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Content form elements
const contentForm = document.getElementById('contentForm');
const titleInput = document.getElementById('title');
const slugInput = document.getElementById('slug');
const contentInput = document.getElementById('content');
const editingIdInput = document.getElementById('editingId');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEdit');

// Stats elements
const totalContentEl = document.getElementById('totalContent');
const publishedContentEl = document.getElementById('publishedContent');
const draftContentEl = document.getElementById('draftContent');

// Content table
const contentTableBody = document.getElementById('contentTableBody');
const refreshContentBtn = document.getElementById('refreshContent');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication state
    firebaseServices.auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showDashboard();
            loadContent();
        } else {
            showLogin();
        }
    });

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    contentForm.addEventListener('submit', handleContentSubmit);
    titleInput.addEventListener('input', generateSlug);
    refreshContentBtn.addEventListener('click', loadContent);
    cancelEditBtn.addEventListener('click', cancelEdit);

    // Tab navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Mobile navigation
    createMobileNavToggle();
}

function createMobileNavToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.innerHTML = '☰';
    toggleBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('mobile-open');
    });
    document.body.appendChild(toggleBtn);
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showLogin() {
    loginPage.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

function showDashboard() {
    loginPage.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showLoading();
    loginError.textContent = '';
    
    try {
        await firebaseServices.auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        await firebaseServices.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function switchTab(tabName) {
    // Update navigation
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabName) {
            link.classList.add('active');
        }
    });

    // Update tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName) {
            content.classList.add('active');
        }
    });

    // Close mobile menu
    document.querySelector('.sidebar').classList.remove('mobile-open');
}

function generateSlug() {
    const title = titleInput.value;
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    
    slugInput.value = slug;
}

async function handleContentSubmit(e) {
    e.preventDefault();
    
    showLoading();
    
    try {
        const formData = new FormData(contentForm);
        const contentData = {
            title: document.getElementById('title').value,
            slug: document.getElementById('slug').value,
            content: document.getElementById('content').value,
            featuredImageUrl: document.getElementById('featuredImageUrl').value || '',
            metaDescription: document.getElementById('metaDescription').value || '',
            seoTitle: document.getElementById('seoTitle').value || '',
            keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k),
            author: document.getElementById('author').value,
            categories: document.getElementById('categories').value.split(',').map(c => c.trim()).filter(c => c),
            tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
            status: document.getElementById('status').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editingId = editingIdInput.value;
        
        if (editingId) {
            // Update existing content
            await firebaseServices.db.collection('content').doc(editingId).update(contentData);
            alert('Content updated successfully!');
        } else {
            // Create new content
            contentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            contentData.publishDate = contentData.status === 'published' 
                ? firebase.firestore.FieldValue.serverTimestamp() 
                : null;
            
            await firebaseServices.db.collection('content').add(contentData);
            alert('Content created successfully!');
        }

        // Reset form and refresh content
        contentForm.reset();
        editingIdInput.value = '';
        formTitle.textContent = 'Create New Content';
        cancelEditBtn.classList.add('hidden');
        
        await loadContent();
        await generateApiJson();
        
        // Switch to manage tab
        switchTab('manage');
        
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Error saving content: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadContent() {
    showLoading();
    
    try {
        const snapshot = await firebaseServices.db.collection('content')
            .orderBy('createdAt', 'desc')
            .get();
        
        allContent = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allContent.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                publishDate: data.publishDate?.toDate?.() || null
            });
        });
        
        updateStats();
        renderContentTable();
        
    } catch (error) {
        console.error('Error loading content:', error);
        alert('Error loading content: ' + error.message);
    } finally {
        hideLoading();
    }
}

function updateStats() {
    const total = allContent.length;
    const published = allContent.filter(item => item.status === 'published').length;
    const drafts = allContent.filter(item => item.status === 'draft').length;
    
    totalContentEl.textContent = total;
    publishedContentEl.textContent = published;
    draftContentEl.textContent = drafts;
}

function renderContentTable() {
    contentTableBody.innerHTML = '';
    
    allContent.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${item.title}</strong>
                <br>
                <small style="color: #666;">/${item.slug}</small>
            </td>
            <td>
                <span class="status-badge status-${item.status}">
                    ${item.status}
                </span>
            </td>
            <td>${item.author}</td>
            <td>${item.createdAt.toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-edit" onclick="editContent('${item.id}')">
                        Edit
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteContent('${item.id}')">
                        Delete
                    </button>
                    <button class="btn-small btn-visit" onclick="visitContent('${item.slug}')">
                        Visit
                    </button>
                </div>
            </td>
        `;
        contentTableBody.appendChild(row);
    });
}

async function editContent(id) {
    const content = allContent.find(item => item.id === id);
    if (!content) return;
    
    // Populate form
    document.getElementById('title').value = content.title;
    document.getElementById('slug').value = content.slug;
    document.getElementById('content').value = content.content;
    document.getElementById('featuredImageUrl').value = content.featuredImageUrl || '';
    document.getElementById('metaDescription').value = content.metaDescription || '';
    document.getElementById('seoTitle').value = content.seoTitle || '';
    document.getElementById('keywords').value = content.keywords?.join(', ') || '';
    document.getElementById('author').value = content.author;
    document.getElementById('categories').value = content.categories?.join(', ') || '';
    document.getElementById('tags').value = content.tags?.join(', ') || '';
    document.getElementById('status').value = content.status;
    
    editingIdInput.value = id;
    formTitle.textContent = 'Edit Content';
    cancelEditBtn.classList.remove('hidden');
    
    // Switch to create tab
    switchTab('create');
}

function cancelEdit() {
    contentForm.reset();
    editingIdInput.value = '';
    formTitle.textContent = 'Create New Content';
    cancelEditBtn.classList.add('hidden');
}

async function deleteContent(id) {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    showLoading();
    
    try {
        await firebaseServices.db.collection('content').doc(id).delete();
        await loadContent();
        await generateApiJson();
        alert('Content deleted successfully!');
    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content: ' + error.message);
    } finally {
        hideLoading();
    }
}

function visitContent(slug) {
    const url = `https://mythirdpartywebsite.com/${slug}`;
    window.open(url, '_blank');
}

async function generateApiJson() {
    try {
        // Get only published content for the API
        const publishedContent = allContent
            .filter(item => item.status === 'published')
            .map(item => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                content: item.content,
                featuredImageUrl: item.featuredImageUrl,
                metaDescription: item.metaDescription,
                seoTitle: item.seoTitle,
                keywords: item.keywords,
                author: item.author,
                categories: item.categories,
                tags: item.tags,
                status: item.status,
                publishDate: item.publishDate?.toISOString() || null,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString()
            }));

        // Store the JSON in Firestore for the API endpoint
        await firebaseServices.db.collection('api').doc('content').set({
            data: publishedContent,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('API JSON generated successfully');
    } catch (error) {
        console.error('Error generating API JSON:', error);
    }
}

// Make functions globally available
window.editContent = editContent;
window.deleteContent = deleteContent;
window.visitContent = visitContent;