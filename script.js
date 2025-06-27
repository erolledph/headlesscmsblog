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

// Content grid
const contentGrid = document.getElementById('contentGrid');
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
            showNotification('Content updated successfully!', 'success');
        } else {
            // Create new content
            contentData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            contentData.publishDate = contentData.status === 'published' 
                ? firebase.firestore.FieldValue.serverTimestamp() 
                : null;
            
            await firebaseServices.db.collection('content').add(contentData);
            showNotification('Content created successfully!', 'success');
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
        showNotification('Error saving content: ' + error.message, 'error');
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
        renderContentGrid();
        
    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Error loading content: ' + error.message, 'error');
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

function renderContentGrid() {
    if (!contentGrid) return;
    
    contentGrid.innerHTML = '';
    
    if (allContent.length === 0) {
        contentGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>No content yet</h3>
                <p>Create your first piece of content to get started!</p>
            </div>
        `;
        return;
    }
    
    allContent.forEach(item => {
        const card = createContentCard(item);
        contentGrid.appendChild(card);
    });
}

function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    // Extract first paragraph as excerpt
    const excerpt = extractExcerpt(item.content);
    
    // Format date
    const formattedDate = item.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    card.innerHTML = `
        <div class="content-card-header">
            <h3 class="content-title">${escapeHtml(item.title)}</h3>
            <div class="content-slug">/${item.slug}</div>
            <div class="content-meta">
                <span class="content-author">By ${escapeHtml(item.author)}</span>
                <span class="content-date">${formattedDate}</span>
            </div>
        </div>
        
        <div class="content-preview">
            <p class="content-excerpt">${excerpt}</p>
        </div>
        
        ${item.tags && item.tags.length > 0 ? `
        <div class="content-tags">
            ${item.tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            ${item.tags.length > 3 ? `<span class="tag">+${item.tags.length - 3} more</span>` : ''}
        </div>
        ` : ''}
        
        <div class="content-footer">
            <span class="status-badge status-${item.status}">
                ${item.status}
            </span>
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
        </div>
    `;
    
    return card;
}

function extractExcerpt(content) {
    // Remove markdown formatting and get first paragraph
    const plainText = content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
        .replace(/\n\n/g, ' ') // Replace double newlines
        .replace(/\n/g, ' ') // Replace single newlines
        .trim();
    
    // Get first sentence or first 150 characters
    const firstSentence = plainText.split('.')[0];
    if (firstSentence.length > 150) {
        return plainText.substring(0, 150) + '...';
    }
    return firstSentence + (plainText.length > firstSentence.length ? '...' : '');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) return;
    
    showLoading();
    
    try {
        await firebaseServices.db.collection('content').doc(id).delete();
        await loadContent();
        await generateApiJson();
        showNotification('Content deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting content:', error);
        showNotification('Error deleting content: ' + error.message, 'error');
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

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 10000;
                max-width: 400px;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                background: linear-gradient(135deg, #48bb78, #38a169);
                color: white;
            }
            
            .notification-error {
                background: linear-gradient(135deg, #e53e3e, #c53030);
                color: white;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Make functions globally available
window.editContent = editContent;
window.deleteContent = deleteContent;
window.visitContent = visitContent;