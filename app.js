// NoteZ Advanced - Professional Note-Taking App
class NoteZAdvanced {
    constructor() {
        this.user = null;
        this.folders = [];
        this.notes = [];
        this.tags = [];
        this.currentFolder = null;
        this.currentNote = null;
        this.favorites = [];
        this.searchQuery = '';
        this.theme = localStorage.getItem('notez-theme') || 'dark';
        this.fontSize = parseInt(localStorage.getItem('notez-font-size')) || 16;
        this.autoSave = localStorage.getItem('notez-autosave') !== 'false';
        this.isDirty = false;
        this.autoSaveTimeout = null;
        
        this.init();
    }

    async init() {
        this.applyTheme(this.theme);
        this.applyFontSize(this.fontSize);
        this.checkAuth();
        window.addEventListener('resize', () => this.handleResize());
    }

    // ===== AUTH SYSTEM =====
    checkAuth() {
        const user = localStorage.getItem('notez-user');
        if (user) {
            this.user = JSON.parse(user);
            this.loadAllData();
            this.showApp();
            document.getElementById('app-loading').classList.add('hidden');
        } else {
            this.showAuth();
            document.getElementById('app-loading').classList.add('hidden');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showToast('warning', 'Missing Fields', 'Please fill all fields');
            return;
        }

        this.user = {
            id: 'user-' + Date.now(),
            username: username.split('@')[0],
            email: username.includes('@') ? username : username + '@notez.app',
            createdAt: new Date().toLocaleString()
        };

        localStorage.setItem('notez-user', JSON.stringify(this.user));
        this.createDefaultFolders();
        this.loadAllData();
        this.showApp();
        this.showToast('success', 'Welcome!', `Logged in as ${this.user.username}`);
        document.getElementById('login-form').reset();
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            this.showToast('warning', 'Missing Fields', 'Please fill all fields');
            return;
        }

        if (password.length < 6) {
            this.showToast('warning', 'Weak Password', 'Password must be at least 6 characters');
            return;
        }

        this.user = {
            id: 'user-' + Date.now(),
            username: name.split(' ')[0],
            email: email,
            fullName: name,
            createdAt: new Date().toLocaleString()
        };

        localStorage.setItem('notez-user', JSON.stringify(this.user));
        this.createDefaultFolders();
        this.loadAllData();
        this.showApp();
        this.showToast('success', 'Account Created!', `Welcome to NoteZ, ${name.split(' ')[0]}!`);
        document.getElementById('signup-form').reset();
    }

    createDefaultFolders() {
        const defaults = [
            { id: 'f-' + Date.now(), name: '📚 Work', icon: '📚', color: '#7c3aed', notes: [] },
            { id: 'f-' + (Date.now() + 1), name: '💡 Ideas', icon: '💡', color: '#f59e0b', notes: [] },
            { id: 'f-' + (Date.now() + 2), name: '🎓 Learning', icon: '🎓', color: '#3b82f6', notes: [] }
        ];
        this.folders = defaults;
        this.saveFolders();
    }

    logout() {
        if (!confirm('Sign out of NoteZ?')) return;
        localStorage.removeItem('notez-user');
        this.user = null;
        this.folders = [];
        this.notes = [];
        this.favorites = [];
        this.showAuth();
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();
    }

    // ===== DATA MANAGEMENT =====
    loadAllData() {
        const folders = localStorage.getItem('notez-folders');
        this.folders = folders ? JSON.parse(folders) : [];
        
        const notes = localStorage.getItem('notez-notes');
        this.notes = notes ? JSON.parse(notes) : [];
        
        const favorites = localStorage.getItem('notez-favorites');
        this.favorites = favorites ? JSON.parse(favorites) : [];

        this.updateUI();
        this.renderLibrary();
    }

    saveFolders() {
        localStorage.setItem('notez-folders', JSON.stringify(this.folders));
    }

    saveNotes() {
        localStorage.setItem('notez-notes', JSON.stringify(this.notes));
    }

    saveFavorites() {
        localStorage.setItem('notez-favorites', JSON.stringify(this.favorites));
    }

    updateUI() {
        const avatar = this.user.username.charAt(0).toUpperCase();
        document.getElementById('user-avatar').textContent = avatar;
        document.getElementById('user-name').textContent = this.user.username;
        document.getElementById('user-email').textContent = this.user.email;
        
        const stats = `${this.notes.length} notes • ${this.folders.length} folders`;
        document.getElementById('header-stats').textContent = stats;
        document.getElementById('all-notes-count').textContent = this.notes.length;
        document.getElementById('favorites-count').textContent = this.favorites.length;
    }

    // ===== FOLDER OPERATIONS =====
    createFolder() {
        const name = prompt('📁 Enter folder name:');
        if (!name || !name.trim()) return;

        const folder = {
            id: 'f-' + Date.now(),
            name: name.trim(),
            icon: this.getRandomIcon(),
            color: this.getRandomColor(),
            notes: [],
            createdAt: new Date().toLocaleString()
        };

        this.folders.push(folder);
        this.saveFolders();
        this.renderLibrary();
        this.showToast('success', 'Folder Created', `"${name}" has been created`);
    }

    deleteFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;

        if (!confirm(`Delete "${folder.name}"? (${folder.notes.length} notes will be removed)`)) return;

        this.notes = this.notes.filter(n => !folder.notes.includes(n.id));
        this.folders = this.folders.filter(f => f.id !== folderId);
        this.saveFolders();
        this.saveNotes();
        this.showLibraryView();
        this.renderLibrary();
        this.showToast('success', 'Folder Deleted', `"${folder.name}" has been removed`);
    }

    renameFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;

        const newName = prompt('Rename folder:', folder.name);
        if (!newName || !newName.trim()) return;

        folder.name = newName.trim();
        this.saveFolders();
        this.renderLibrary();
        this.showToast('success', 'Folder Renamed', `Renamed to "${newName}"`);
    }

    openFolder(folderId) {
        this.currentFolder = this.folders.find(f => f.id === folderId);
        if (!this.currentFolder) return;

        this.showFolderView();
        this.renderFolderContents();
    }

    // ===== NOTE OPERATIONS =====
    createNewNote() {
        const note = {
            id: 'n-' + Date.now(),
            title: 'Untitled Note',
            content: '',
            folderId: this.currentFolder?.id || null,
            tags: [],
            isFavorite: false,
            wordCount: 0,
            charCount: 0,
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

        this.currentNote = JSON.parse(JSON.stringify(note));
        this.isDirty = false;
        this.showEditorView();
        this.renderEditor();
    }

    saveNote() {
        if (!this.currentNote) return;

        const title = document.getElementById('editor-title').textContent.trim() || 'Untitled Note';
        const content = document.getElementById('editor-area').innerHTML;

        this.currentNote.title = title;
        this.currentNote.content = content;
        this.currentNote.updatedAt = new Date().toLocaleString();

        // Count words and characters
        const text = document.getElementById('editor-area').textContent;
        this.currentNote.wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        this.currentNote.charCount = text.length;

        const existingIndex = this.notes.findIndex(n => n.id === this.currentNote.id);
        
        if (existingIndex >= 0) {
            this.notes[existingIndex] = this.currentNote;
        } else {
            this.notes.push(this.currentNote);
            if (this.currentFolder && !this.currentFolder.notes.includes(this.currentNote.id)) {
                this.currentFolder.notes.push(this.currentNote.id);
                this.saveFolders();
            }
        }

        this.saveNotes();
        this.isDirty = false;
        this.showToast('success', 'Saved', 'Note saved successfully');

        if (this.currentFolder) {
            this.renderFolderContents();
        }
    }

    deleteNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        if (!confirm(`Delete "${note.title}"?`)) return;

        this.notes = this.notes.filter(n => n.id !== noteId);
        this.favorites = this.favorites.filter(id => id !== noteId);
        
        this.folders.forEach(f => {
            f.notes = f.notes.filter(id => id !== noteId);
        });

        this.saveNotes();
        this.saveFolders();
        this.saveFavorites();
        this.showToast('success', 'Deleted', `"${note.title}" has been removed`);

        if (this.currentFolder) {
            this.renderFolderContents();
        } else {
            this.renderLibrary();
        }
    }

    toggleFavorite(noteId) {
        const index = this.favorites.indexOf(noteId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(noteId);
        }
        this.saveFavorites();
        this.updateUI();
    }

    duplicateNote(noteId) {
        const original = this.notes.find(n => n.id === noteId);
        if (!original) return;

        const duplicate = {
            ...original,
            id: 'n-' + Date.now(),
            title: original.title + ' (Copy)',
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString()
        };

        this.notes.push(duplicate);
        this.saveNotes();
        this.showToast('success', 'Duplicated', `Note copied as "${duplicate.title}"`);
        this.renderFolderContents();
    }

    // ===== FILE OPERATIONS =====
    handleFileUpload(files) {
        const file = Array.from(files).find(f => f.name.endsWith('.html'));
        
        if (!file) {
            this.showToast('danger', 'Invalid File', 'Only .html files are supported');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showToast('danger', 'File Too Large', 'Maximum size is 10 MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const title = file.name.replace('.html', '');

            const note = {
                id: 'n-' + Date.now(),
                title: title,
                content: content,
                folderId: this.currentFolder?.id || null,
                tags: ['imported'],
                isFavorite: false,
                wordCount: 0,
                charCount: 0,
                createdAt: new Date().toLocaleString(),
                updatedAt: new Date().toLocaleString()
            };

            this.notes.push(note);

            if (this.currentFolder) {
                this.currentFolder.notes.push(note.id);
                this.saveFolders();
            }

            this.saveNotes();
            this.showLibraryView();
            this.renderLibrary();
            this.showToast('success', 'Uploaded', `"${title}" imported successfully`);
        };

        reader.onerror = () => {
            this.showToast('danger', 'Error', 'Failed to read file');
        };

        reader.readAsText(file);
    }

    exportAllNotes() {
        if (this.notes.length === 0) {
            this.showToast('warning', 'No Notes', 'Create some notes first');
            return;
        }

        const exportData = {
            exportedAt: new Date().toLocaleString(),
            user: this.user.username,
            notesCount: this.notes.length,
            foldersCount: this.folders.length,
            notes: this.notes,
            folders: this.folders
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notez-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        this.showToast('success', 'Exported', 'All notes backed up');
    }

    // ===== SEARCH & FILTER =====
    searchNotes(query) {
        this.searchQuery = query.toLowerCase();
        
        if (!query.trim()) {
            if (this.currentFolder) {
                this.renderFolderContents();
            } else {
                this.renderLibrary();
            }
            return;
        }

        const results = this.notes.filter(note => 
            note.title.toLowerCase().includes(this.searchQuery) ||
            note.content.toLowerCase().includes(this.searchQuery)
        );

        this.renderSearchResults(results);
    }

    renderSearchResults(results) {
        const container = document.getElementById('notes-grid') || document.getElementById('folders-grid');
        if (!container) return;

        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-icon">🔍</div><div class="empty-title">No Results</div><div class="empty-message">No notes match your search</div></div>';
            return;
        }

        results.forEach(note => {
            this.renderNoteItem(note, container);
        });
    }

    // ===== UI RENDERING =====
    renderLibrary() {
        const grid = document.getElementById('folders-grid');
        const emptyState = document.getElementById('empty-state');

        grid.innerHTML = '';

        if (this.folders.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        this.folders.forEach(folder => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-card-icon">${folder.icon || '📁'}</div>
                <div class="note-card-title">${folder.name}</div>
                <div class="note-card-meta">
                    <span>📝 ${folder.notes.length} notes</span>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.button !== 2) this.openFolder(folder.id);
            });

            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, [
                    { label: '📂 Rename', action: () => this.renameFolder(folder.id) },
                    { label: '🗑️ Delete', action: () => this.deleteFolder(folder.id), danger: true }
                ]);
            });

            grid.appendChild(card);
        });

        this.renderFoldersList();
    }

    renderFoldersList() {
        const list = document.getElementById('folders-list');
        list.innerHTML = '';

        this.folders.forEach(folder => {
            const item = document.createElement('div');
            item.className = 'folder-item';
            item.innerHTML = `
                <span class="folder-icon">${folder.icon || '📁'}</span>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-count">${folder.notes.length}</span>
            `;

            item.addEventListener('click', () => this.openFolder(folder.id));
            list.appendChild(item);
        });
    }

    renderFolderContents() {
        if (!this.currentFolder) return;

        const grid = document.getElementById('notes-grid');
        grid.innerHTML = '';

        const notes = this.notes.filter(n => this.currentFolder.notes.includes(n.id));

        if (notes.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-icon">📭</div><div class="empty-title">No Notes Yet</div><div class="empty-message">Create your first note in this folder</div></div>';
            return;
        }

        notes.forEach(note => this.renderNoteItem(note, grid));
    }

    renderNoteItem(note, container) {
        const item = document.createElement('div');
        item.className = 'note-item';
        
        const preview = note.content.replace(/<[^>]*>/g, '').substring(0, 80);
        const isFav = this.favorites.includes(note.id);

        item.innerHTML = `
            <div class="note-item-header">
                <div class="note-item-icon">📄</div>
                <div style="flex: 1;">
                    <div class="note-item-title">${note.title}</div>
                </div>
                <span style="font-size: 16px; cursor: pointer; ${isFav ? 'color: var(--accent)' : ''}" id="fav-${note.id}">
                    ${isFav ? '❤️' : '🤍'}
                </span>
            </div>
            <div class="note-item-preview">${preview || 'Empty note'}</div>
            <div class="note-item-footer">
                <span>${note.updatedAt.split(' ')[0]}</span>
                <span>${note.wordCount || 0} words</span>
            </div>
        `;

        item.querySelector(`#fav-${note.id}`).addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(note.id);
            item.querySelector(`#fav-${note.id}`).textContent = this.favorites.includes(note.id) ? '❤️' : '🤍';
        });

        item.addEventListener('click', () => this.editNote(note.id));

        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, [
                { label: '✏️ Edit', action: () => this.editNote(note.id) },
                { label: '📋 Duplicate', action: () => this.duplicateNote(note.id) },
                { label: '❤️ ' + (this.favorites.includes(note.id) ? 'Unfavorite' : 'Favorite'), action: () => this.toggleFavorite(note.id) },
                { label: '🗑️ Delete', action: () => this.deleteNote(note.id), danger: true }
            ]);
        });

        container.appendChild(item);
    }

    renderEditor() {
        if (!this.currentNote) return;

        document.getElementById('editor-title').textContent = this.currentNote.title;
        document.getElementById('editor-area').innerHTML = this.currentNote.content;
        this.updateWordCount();
        document.getElementById('editor-area').focus();
    }

    updateWordCount() {
        const text = document.getElementById('editor-area').textContent || '';
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        document.getElementById('word-count').textContent = words;
        document.getElementById('char-count').textContent = chars;
    }

    // ===== SETTINGS & THEME =====
    changeTheme(theme) {
        this.theme = theme;
        localStorage.setItem('notez-theme', theme);
        this.applyTheme(theme);
    }

    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.removeAttribute('data-theme');
        } else {
            html.setAttribute('data-theme', theme);
        }
    }

    changeFontSize(size) {
        this.fontSize = parseInt(size);
        localStorage.setItem('notez-font-size', size);
        this.applyFontSize(size);
    }

    applyFontSize(size) {
        document.body.style.fontSize = size + 'px';
    }

    // ===== VIEW MANAGEMENT =====
    showAuth() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    showLibraryView() {
        this.hideAllViews();
        document.getElementById('library-view').classList.add('active');
        document.getElementById('page-title').textContent = 'Library';
        this.currentFolder = null;
        this.currentNote = null;
    }

    showFolderView() {
        this.hideAllViews();
        document.getElementById('folder-view').classList.add('active');
        document.getElementById('page-title').textContent = this.currentFolder.name;
    }

    showEditorView() {
        this.hideAllViews();
        document.getElementById('editor-view').classList.add('active');
    }

    showUploadView() {
        this.hideAllViews();
        document.getElementById('upload-view').classList.add('active');
        document.getElementById('page-title').textContent = 'Upload Note';
    }

    hideAllViews() {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    }

    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        this.updateSettingsUI();
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    updateSettingsUI() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.theme) btn.classList.add('active');
        });

        document.getElementById('font-size-slider').value = this.fontSize;
        document.getElementById('font-size-value').textContent = this.fontSize + 'px';
    }

    toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }

    // ===== UTILITIES =====
    showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = { success: '✓', warning: '⚠', danger: '✕', info: 'ℹ' };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    showContextMenu(e, items) {
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu show';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        items.forEach((item, i) => {
            const btn = document.createElement('button');
            btn.className = 'context-menu-item' + (item.danger ? ' danger' : '');
            btn.textContent = item.label;
            btn.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(btn);

            if (i < items.length - 1) {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                menu.appendChild(divider);
            }
        });

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 10);
    }

    getRandomIcon() {
        const icons = ['📚', '💼', '🎓', '💡', '📝', '🎨', '🔬', '🏆'];
        return icons[Math.floor(Math.random() * icons.length)];
    }

    getRandomColor() {
        const colors = ['#a900ff', '#7c3aed', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b'];
        return colors[Math.floor(Math.random() * colors.length)];
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

    handleResize() {
        if (window.innerWidth < 768) {
            document.getElementById('toggle-sidebar-btn').style.display = 'flex';
        } else {
            document.getElementById('toggle-sidebar-btn').style.display = 'none';
            document.querySelector('.sidebar').classList.remove('mobile-open');
        }
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new NoteZAdvanced();
    
    // Auth events
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab + '-form').classList.add('active');
            document.getElementById('auth-title').textContent = 
                this.dataset.tab === 'login' ? 'Welcome Back' : 'Create Account';
        });
    });

    document.getElementById('login-form').addEventListener('submit', (e) => app.handleLogin(e));
    document.getElementById('signup-form').addEventListener('submit', (e) => app.handleSignup(e));

    // Sidebar
    document.getElementById('new-folder-btn').addEventListener('click', () => app.createFolder());
    document.getElementById('upload-note-btn').addEventListener('click', () => app.showUploadView());
    document.getElementById('export-btn').addEventListener('click', () => app.exportAllNotes());
    document.getElementById('settings-btn').addEventListener('click', () => app.openSettings());
    document.getElementById('logout-btn').addEventListener('click', () => app.logout());
    document.getElementById('all-notes-btn').addEventListener('click', () => app.showLibraryView());

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        app.searchNotes(e.target.value);
    });

    // Editor
    document.getElementById('editor-area').addEventListener('input', () => {
        app.isDirty = true;
        app.updateWordCount();
        if (app.autoSave) {
            clearTimeout(app.autoSaveTimeout);
            app.autoSaveTimeout = setTimeout(() => app.saveNote(), 1500);
        }
    });

    document.getElementById('save-note-btn').addEventListener('click', () => app.saveNote());
    document.getElementById('close-editor-btn').addEventListener('click', () => app.closeEditor());

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
        app.handleFileUpload(e.dataTransfer.files);
    });

    uploadInput.addEventListener('change', (e) => app.handleFileUpload(e.target.files));

    // Settings
    document.getElementById('close-settings-btn').addEventListener('click', () => app.closeSettings());
    document.getElementById('signout-btn').addEventListener('click', () => app.logout());

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => app.changeTheme(btn.dataset.theme));
    });

    document.getElementById('font-size-slider').addEventListener('input', (e) => {
        app.changeFontSize(e.target.value);
    });

    // Fullscreen
    document.getElementById('fullscreen-btn').addEventListener('click', () => app.toggleFullscreen());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('editor-view').classList.contains('active')) {
                app.saveNote();
            }
        }
    });

    window.noteZApp = app;
});
