// NoteZ App - Main Application Logic
class NoteZApp {
    constructor() {
        this.currentUser = null;
        this.currentFolder = null;
        this.currentNote = null;
        this.folders = [];
        this.notes = [];
        this.theme = localStorage.getItem('notez-theme') || 'dark';
        this.fontSize = localStorage.getItem('notez-font-size') || '16';
        this.autoSave = localStorage.getItem('notez-autosave') !== 'false';
        this.isDirty = false;

        this.init();
    }

    async init() {
        this.setupDOM();
        this.setupEventListeners();
        this.applyTheme(this.theme);
        this.applyFontSize(this.fontSize);
        
        // Simulate auth check
        await this.checkAuth();
    }

    setupDOM() {
        this.authScreen = document.getElementById('auth-screen');
        this.app = document.getElementById('app');
        this.appLoading = document.getElementById('app-loading');
        this.sidebar = document.querySelector('.sidebar');
        this.content = document.querySelector('.content');
        this.toastContainer = document.getElementById('toast-container');
        
        this.libraryView = document.getElementById('library-view');
        this.folderView = document.getElementById('folder-view');
        this.editorView = document.getElementById('editor-view');
        this.uploadView = document.getElementById('upload-view');
    }

    setupEventListeners() {
        // Auth
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        // Sidebar
        document.getElementById('new-folder-btn').addEventListener('click', () => this.createNewFolder());
        document.getElementById('upload-note-btn').addEventListener('click', () => this.showUploadView());
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('user-profile').addEventListener('click', () => this.openSettings());

        // Settings Modal
        document.getElementById('close-settings-btn').addEventListener('click', () => this.closeSettings());
        document.getElementById('signout-btn').addEventListener('click', () => this.logout());
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') this.closeSettings();
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeTheme(btn.dataset.theme));
        });

        // Font size slider
        document.getElementById('font-size-slider').addEventListener('input', (e) => {
            this.changeFontSize(e.target.value);
        });

        // Auto-save toggle
        document.getElementById('autosave-toggle').addEventListener('click', () => {
            this.toggleAutoSave();
        });

        // Editor
        document.getElementById('close-editor-btn').addEventListener('click', () => this.closeEditor());
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveNote());
        const editorArea = document.getElementById('editor-area');
        editorArea.addEventListener('input', () => {
            this.isDirty = true;
            if (this.autoSave) {
                clearTimeout(this.autoSaveTimeout);
                this.autoSaveTimeout = setTimeout(() => this.saveNote(), 1000);
            }
        });

        // Upload
        const uploadZone = document.getElementById('upload-zone');
        const uploadInput = document.getElementById('upload-input');
        
        uploadZone.addEventListener('click', () => uploadInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        uploadInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Fullscreen
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveNote();
                }
            }
        });
    }

    // Auth Methods
    async checkAuth() {
        // Simulate auth check with localStorage
        const user = localStorage.getItem('notez-user');
        
        if (user) {
            this.currentUser = JSON.parse(user);
            await this.loadUserData();
            this.showApp();
        } else {
            this.showAuth();
        }

        // Hide loading overlay
        this.appLoading.classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showToast('warning', 'Missing Fields', 'Please fill in all fields');
            return;
        }

        // Simulate login
        this.currentUser = {
            id: 'user-' + Date.now(),
            username: username,
            email: username.includes('@') ? username : username + '@notez.app'
        };

        localStorage.setItem('notez-user', JSON.stringify(this.currentUser));
        await this.loadUserData();
        this.showApp();
        this.showToast('success', 'Welcome!', `Signed in as ${this.currentUser.username}`);

        // Clear form
        document.getElementById('login-form').reset();
    }

    async handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!username || !email || !password) {
            this.showToast('warning', 'Missing Fields', 'Please fill in all fields');
            return;
        }

        this.currentUser = {
            id: 'user-' + Date.now(),
            username: username,
            email: email
        };

        localStorage.setItem('notez-user', JSON.stringify(this.currentUser));
        
        // Create default folders
        this.createDefaultFolders();
        await this.loadUserData();
        this.showApp();
        this.showToast('success', 'Account Created!', `Welcome to NoteZ, ${username}!`);

        // Clear form
        document.getElementById('signup-form').reset();
    }

    createDefaultFolders() {
        const defaultFolders = [
            { id: 'folder-1', name: 'Urdu', color: '🟣', notes: [] },
            { id: 'folder-2', name: 'Maths', color: '🟢', notes: [] },
            { id: 'folder-3', name: 'Chemistry', color: '🟡', notes: [] },
            { id: 'folder-4', name: 'English', color: '🔵', notes: [] },
            { id: 'folder-5', name: 'Islamiat', color: '🟣', notes: [] },
            { id: 'folder-6', name: 'Physics', color: '🟨', notes: [] }
        ];

        localStorage.setItem('notez-folders', JSON.stringify(defaultFolders));
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');

        const titles = {
            login: 'Welcome Back',
            signup: 'Create Account'
        };
        document.getElementById('auth-title').textContent = titles[tab];
    }

    // Data Methods
    async loadUserData() {
        // Load from localStorage
        const folderData = localStorage.getItem('notez-folders');
        this.folders = folderData ? JSON.parse(folderData) : [];
        
        const notesData = localStorage.getItem('notez-notes');
        this.notes = notesData ? JSON.parse(notesData) : [];

        this.updateUserUI();
        this.renderLibrary();
    }

    saveUserData() {
        localStorage.setItem('notez-folders', JSON.stringify(this.folders));
        localStorage.setItem('notez-notes', JSON.stringify(this.notes));
    }

    updateUserUI() {
        const avatar = this.currentUser.username.charAt(0).toUpperCase();
        document.getElementById('user-avatar').textContent = avatar;
        document.getElementById('user-name').textContent = this.currentUser.username;
        document.getElementById('user-email').textContent = this.currentUser.email;
    }

    // Folder Methods
    createNewFolder() {
        const name = prompt('Enter folder name:');
        if (!name) return;

        const folder = {
            id: 'folder-' + Date.now(),
            name: name,
            color: '🟣',
            notes: []
        };

        this.folders.push(folder);
        this.saveUserData();
        this.renderLibrary();
        this.showToast('success', 'Folder Created', `Created folder "${name}"`);
    }

    openFolder(folderId) {
        this.currentFolder = this.folders.find(f => f.id === folderId);
        if (!this.currentFolder) return;

        this.showFolderView();
        this.renderFolderContents();
    }

    // Note Methods
    createNewNote() {
        const note = {
            id: 'note-' + Date.now(),
            title: 'Untitled Note',
            content: '',
            folderId: this.currentFolder?.id || null,
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString()
        };

        this.currentNote = note;
        this.isDirty = false;
        this.showEditorView();
        this.renderEditor();
    }

    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNote = note;
        this.isDirty = false;
        this.showEditorView();
        this.renderEditor();
    }

    async saveNote() {
        if (!this.currentNote) return;

        const titleElement = document.getElementById('editor-title');
        const title = titleElement.textContent.trim();
        const content = document.getElementById('editor-area').innerHTML;

        if (!title || title === 'New Note') {
            this.showToast('warning', 'Title Required', 'Please enter a note title');
            return;
        }

        const existingIndex = this.notes.findIndex(n => n.id === this.currentNote.id);
        
        this.currentNote.title = title;
        this.currentNote.content = content;
        this.currentNote.updatedAt = new Date().toLocaleString();

        if (existingIndex >= 0) {
            this.notes[existingIndex] = this.currentNote;
        } else {
            this.notes.push(this.currentNote);
            
            // Add to folder
            if (this.currentFolder) {
                const folder = this.folders.find(f => f.id === this.currentFolder.id);
                if (folder && !folder.notes.includes(this.currentNote.id)) {
                    folder.notes.push(this.currentNote.id);
                }
            }
        }

        this.saveUserData();
        this.isDirty = false;
        this.showToast('success', 'Note Saved', 'Your note has been saved');
        
        if (this.currentFolder) {
            this.renderFolderContents();
        }
    }

    deleteNote(noteId) {
        if (!confirm('Delete this note?')) return;

        this.notes = this.notes.filter(n => n.id !== noteId);
        
        // Remove from folder
        this.folders.forEach(folder => {
            folder.notes = folder.notes.filter(id => id !== noteId);
        });

        this.saveUserData();
        this.showToast('success', 'Note Deleted', 'Note has been removed');
        
        if (this.currentFolder) {
            this.renderFolderContents();
        }
    }

    async handleFileUpload(files) {
        const file = Array.from(files).find(f => f.name.endsWith('.html'));
        
        if (!file) {
            this.showToast('danger', 'Invalid File', 'Only .html files are accepted');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const title = file.name.replace('.html', '');

            const note = {
                id: 'note-' + Date.now(),
                title: title,
                content: content,
                folderId: this.currentFolder?.id || null,
                createdAt: new Date().toLocaleString(),
                updatedAt: new Date().toLocaleString()
            };

            this.notes.push(note);

            if (this.currentFolder) {
                const folder = this.folders.find(f => f.id === this.currentFolder.id);
                if (folder) {
                    folder.notes.push(note.id);
                }
            }

            this.saveUserData();
            this.showLibraryView();
            this.renderLibrary();
            this.showToast('success', 'Note Uploaded', `"${title}" has been added`);
        };

        reader.readAsText(file);
    }

    // View Methods
    showAuth() {
        this.authScreen.classList.remove('hidden');
        this.app.classList.add('hidden');
    }

    showApp() {
        this.authScreen.classList.add('hidden');
        this.app.classList.remove('hidden');
    }

    showLibraryView() {
        this.currentFolder = null;
        this.currentNote = null;
        this.hideAllViews();
        this.libraryView.classList.add('active');
        document.getElementById('page-title').textContent = 'Library';
    }

    showFolderView() {
        this.hideAllViews();
        this.folderView.classList.add('active');
        document.getElementById('page-title').textContent = this.currentFolder.name;
    }

    showEditorView() {
        this.hideAllViews();
        this.editorView.classList.add('active');
    }

    showUploadView() {
        this.hideAllViews();
        this.uploadView.classList.add('active');
        document.getElementById('page-title').textContent = 'Upload Note';
    }

    showLibraryView() {
        this.currentFolder = null;
        this.currentNote = null;
        this.hideAllViews();
        this.libraryView.classList.add('active');
        document.getElementById('page-title').textContent = 'Library';
    }

    hideAllViews() {
        this.libraryView.classList.remove('active');
        this.folderView.classList.remove('active');
        this.editorView.classList.remove('active');
        this.uploadView.classList.remove('active');
    }

    // Render Methods
    renderLibrary() {
        const grid = document.getElementById('folders-grid');
        const foldersList = document.getElementById('folders-list');
        
        grid.innerHTML = '';
        foldersList.innerHTML = '';

        this.folders.forEach(folder => {
            const count = folder.notes.length;

            // Grid card
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-card-icon">${folder.color}</div>
                <div class="note-card-title">${folder.name}</div>
                <div class="note-card-count">📝 ${count} ${count === 1 ? 'note' : 'notes'}</div>
            `;
            card.addEventListener('click', () => this.openFolder(folder.id));
            grid.appendChild(card);

            // Sidebar item
            const item = document.createElement('div');
            item.className = 'folder-item';
            item.innerHTML = `
                <span>${folder.color}</span>
                <span>${folder.name}</span>
                <span class="folder-count">${count}</span>
            `;
            item.addEventListener('click', () => this.openFolder(folder.id));
            foldersList.appendChild(item);
        });

        // Update count
        document.getElementById('library-count').textContent = `${this.folders.length} ${this.folders.length === 1 ? 'folder' : 'folders'}`;

        // Show recent if there are notes
        const recentNotes = this.notes.slice(-3).reverse();
        if (recentNotes.length > 0) {
            document.getElementById('recent-section').style.display = 'block';
            this.renderNotesList(recentNotes, 'recent-list');
        }
    }

    renderFolderContents() {
        if (!this.currentFolder) return;

        const folderNotes = this.notes.filter(n => this.currentFolder.notes.includes(n.id));
        this.renderNotesList(folderNotes, 'notes-grid');

        // Update sidebar active state
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.folder-item').forEach(item => {
            if (item.textContent.includes(this.currentFolder.name)) {
                item.classList.add('active');
            }
        });
    }

    renderNotesList(notes, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        notes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'note-item';
            
            const contentPreview = note.content
                .replace(/<[^>]*>/g, '')
                .substring(0, 60)
                .replace(/&[a-z]+;/g, '');

            item.innerHTML = `
                <div class="note-item-header">
                    <div class="note-item-icon">📄</div>
                    <div style="flex: 1;">
                        <div class="note-item-title">${note.title}</div>
                    </div>
                </div>
                <div class="note-item-content">${contentPreview || 'No content'}</div>
                <div class="note-item-meta">
                    <span>${note.updatedAt}</span>
                </div>
            `;

            item.addEventListener('click', () => this.editNote(note.id));
            container.appendChild(item);
        });

        if (notes.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No notes yet. Create your first note!</div>';
        }
    }

    renderEditor() {
        if (!this.currentNote) return;

        document.getElementById('editor-title').textContent = this.currentNote.title;
        document.getElementById('editor-area').innerHTML = this.currentNote.content;
        document.getElementById('editor-area').focus();
    }

    closeEditor() {
        if (this.isDirty) {
            if (!confirm('You have unsaved changes. Close anyway?')) return;
        }

        if (this.currentFolder) {
            this.showFolderView();
            this.renderFolderContents();
        } else {
            this.showLibraryView();
            this.renderLibrary();
        }
    }

    // Settings Methods
    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        this.updateSettingsUI();
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    updateSettingsUI() {
        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.theme) {
                btn.classList.add('active');
            }
        });

        // Update font size
        document.getElementById('font-size-slider').value = this.fontSize;
        document.getElementById('font-size-value').textContent = this.fontSize + 'px';

        // Update auto-save
        const toggle = document.getElementById('autosave-toggle');
        if (this.autoSave) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }

        // Update sync status
        const noteCount = this.notes.length;
        document.getElementById('sync-status').textContent = 
            `✓ ${noteCount} ${noteCount === 1 ? 'note' : 'notes'} — ${new Date().toLocaleString()}`;
    }

    changeTheme(theme) {
        this.theme = theme;
        this.applyTheme(theme);
        localStorage.setItem('notez-theme', theme);
        this.updateSettingsUI();
    }

    applyTheme(theme) {
        document.documentElement.removeAttribute('data-theme');
        if (theme !== 'dark') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    changeFontSize(size) {
        this.fontSize = size;
        this.applyFontSize(size);
        localStorage.setItem('notez-font-size', size);
        document.getElementById('font-size-value').textContent = size + 'px';
    }

    applyFontSize(size) {
        document.body.style.fontSize = size + 'px';
    }

    toggleAutoSave() {
        this.autoSave = !this.autoSave;
        localStorage.setItem('notez-autosave', this.autoSave);
        document.getElementById('autosave-toggle').classList.toggle('active');
        this.showToast('success', 'Auto-save ' + (this.autoSave ? 'enabled' : 'disabled'));
    }

    // Utility Methods
    toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }

    logout() {
        if (confirm('Sign out of NoteZ?')) {
            localStorage.removeItem('notez-user');
            this.currentUser = null;
            this.currentFolder = null;
            this.currentNote = null;
            this.folders = [];
            this.notes = [];
            this.showAuth();
            
            // Reset forms
            document.getElementById('login-form').reset();
            document.getElementById('signup-form').reset();
            document.getElementById('login-username').focus();
        }
    }

    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            warning: '⚠',
            danger: '✕'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.noteZApp = new NoteZApp();
});
