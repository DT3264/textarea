// Storage Management
const Storage = {
  STORE_KEY: 'textarea_documents',
  
  getAll() {
    const data = localStorage.getItem(this.STORE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  get(id) {
    return this.getAll().find(doc => doc.id === id);
  },
  
  save(documents) {
    localStorage.setItem(this.STORE_KEY, JSON.stringify(documents));
  },
  
  create(content = '') {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const doc = {
      id,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = this.getAll();
    all.push(doc);
    this.save(all);
    return doc;
  },
  
  update(id, content) {
    const all = this.getAll();
    const doc = all.find(d => d.id === id);
    if (doc) {
      doc.content = content;
      doc.updatedAt = Date.now();
      this.save(all);
    }
    return doc;
  },
  
  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(d => d.id !== id);
    this.save(filtered);
  },
};

// UI Management
class TextareaApp {
  constructor() {
    this.currentDocId = null;
    this.panelMode = 'current'; // 'current' or 'others'
    this.initializeElements();
    this.attachEventListeners();
    this.loadFromURL();
    this.updateMarkdown();
  }

  initializeElements() {
    this.article = document.querySelector('article');
    this.landingView = document.getElementById('landing-view');
    this.editorContainer = document.getElementById('editor-container');
    this.pageTitle = document.getElementById('page-title');
    this.documentStatus = document.getElementById('document-status');
    this.panelToggle = document.getElementById('panel-toggle');
    this.documentPanel = document.getElementById('document-panel');
    this.panelContent = document.getElementById('panel-content');
    this.panelCurrent = document.getElementById('panel-current');
    this.panelOthers = document.getElementById('panel-others');
    this.menuButton = document.getElementById('menu-button');
    this.menu = document.getElementById('menu');
    this.newDocBtn = document.getElementById('new-doc-btn');
    this.newFromMenu = document.getElementById('new-from-menu');
    this.downloadBtn = document.getElementById('download-btn');
    this.notification = document.getElementById('notification');
  }

  attachEventListeners() {
    // Panel toggle
    this.panelToggle.addEventListener('click', () => this.togglePanel());
    
    // Panel tabs
    this.panelCurrent.addEventListener('click', () => this.switchPanelMode('current'));
    this.panelOthers.addEventListener('click', () => this.switchPanelMode('others'));
    
    // Menu
    this.menuButton.addEventListener('click', (e) => this.toggleMenu(e));
    document.body.addEventListener('click', (e) => {
      if (!e.target.closest('#menu') && !e.target.closest('#menu-button')) {
        this.menu.classList.remove('visible');
      }
    });
    
    // New document buttons
    this.newDocBtn.addEventListener('click', () => this.createNewDocument());
    this.newFromMenu.addEventListener('click', () => {
      this.createNewDocument();
      this.menu.classList.remove('visible');
    });
    
    // Download
    this.downloadBtn.addEventListener('click', () => {
      this.downloadCurrentDocument();
      this.menu.classList.remove('visible');
    });
    
    // Editor input
    this.article.addEventListener('input', (e) => {
      if (this.currentDocId) {
        Storage.update(this.currentDocId, this.article.textContent);
        this.updateMarkdown();
        this.updateTitle();
        this.updatePanel();
      }
    });
    
    // Keyboard shortcuts
    this.article.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
        e.preventDefault();
        this.downloadCurrentDocument();
      }
    });
    
    // Markdown highlight on blur
    this.article.addEventListener('blur', () => {
      this.updateMarkdown();
    });
  }

  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');
    
    if (docId) {
      const doc = Storage.get(docId);
      if (doc) {
        this.loadDocument(doc.id);
        return;
      }
    }
    
    // Show landing view
    this.showLanding();
  }

  loadDocument(id) {
    const doc = Storage.get(id);
    if (!doc) return;
    
    this.currentDocId = id;
    this.article.textContent = doc.content;
    this.article.style.display = 'block';
    this.landingView.style.display = 'none';
    this.documentPanel.classList.remove('hidden');
    
    // Update URL
    window.history.replaceState({}, '', `?id=${id}`);
    
    this.updateTitle();
    this.updateMarkdown();
    this.updatePanel();
    this.article.focus();
  }

  showLanding() {
    this.currentDocId = null;
    this.article.style.display = 'none';
    this.landingView.style.display = 'flex';
    this.documentPanel.classList.add('hidden');
    this.pageTitle.textContent = 'Textarea';
    this.documentStatus.textContent = '';
    this.updateLandingView();
  }

  createNewDocument() {
    const doc = Storage.create('');
    this.loadDocument(doc.id);
  }

  updateTitle() {
    if (!this.currentDocId) return;
    
    const content = this.article.textContent;
    const match = content.match(/^#\s+(.+)/m);
    const title = match ? match[1].trim() : content.split('\n')[0].slice(0, 50) || 'Untitled';
    
    this.pageTitle.textContent = title || 'Textarea';
    document.title = title || 'Textarea';
  }

  updateMarkdown() {
    if (!this.currentDocId) return;
    
    const content = this.article.textContent;
    const doc = Storage.get(this.currentDocId);
    
    if (!doc) return;
    
    const frag = document.createDocumentFragment();
    this.parseMarkdown(content, frag);
    
    // Preserve cursor position
    const sel = window.getSelection();
    const cursorPos = sel.focusOffset;
    
    this.article.innerHTML = '';
    this.article.appendChild(frag);
    this.article.textContent = content;
    
    // Re-apply markdown without losing text
    this.applyMarkdownStyling();
  }

  applyMarkdownStyling() {
    // This is a simplified version - real markdown highlighting would require
    // a proper parser to avoid losing focus/cursor position
    // For now, we'll keep it simple with basic regex detection
  }

  parseMarkdown(text, container) {
    // Simplified markdown parsing
    const lines = text.split('\n');
    
    lines.forEach((line, i) => {
      if (line.match(/^#+\s/)) {
        const level = line.match(/^#+/)[0].length;
        const span = document.createElement('span');
        span.className = `md-h${level}`;
        span.textContent = line;
        container.appendChild(span);
      } else if (line.match(/^```/)) {
        const span = document.createElement('span');
        span.className = 'md-codeblock';
        span.textContent = line;
        container.appendChild(span);
      } else {
        container.appendChild(document.createTextNode(line));
      }
      
      if (i < lines.length - 1) {
        container.appendChild(document.createTextNode('\n'));
      }
    });
  }

  updatePanel() {
    this.panelContent.innerHTML = '';
    
    if (this.panelMode === 'current' && this.currentDocId) {
      const doc = Storage.get(this.currentDocId);
      if (doc) {
        this.panelContent.appendChild(this.createCurrentDocView(doc));
      }
    } else {
      const docs = Storage.getAll();
      const otherDocs = docs.filter(d => d.id !== this.currentDocId);
      
      if (otherDocs.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding: 16px; text-align: center; opacity: 0.5; font-size: 14px;';
        empty.textContent = 'No other documents';
        this.panelContent.appendChild(empty);
      } else {
        otherDocs.forEach(doc => {
          this.panelContent.appendChild(this.createDocumentItem(doc, false));
        });
      }
    }
  }

  createCurrentDocView(doc) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="padding: 12px; font-size: 14px;">
        <div style="margin-bottom: 12px;">
          <strong>${this.getDocumentTitle(doc)}</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.7; line-height: 1.6;">
          <div>ID: <code style="background: var(--bg-hover); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 11px;">${doc.id}</code></div>
          <div>Created: ${this.formatDate(doc.createdAt)}</div>
          <div>Modified: ${this.formatDate(doc.updatedAt)}</div>
          <div>Length: ${doc.content.length} chars</div>
        </div>
      </div>
    `;
    return div;
  }

  createDocumentItem(doc, isLanding = false) {
    const item = document.createElement('div');
    item.className = isLanding ? 'landing-document-item' : 'document-item';
    
    const info = document.createElement('div');
    info.className = isLanding ? 'landing-document-info' : 'document-main';
    
    const title = document.createElement('div');
    title.className = isLanding ? 'landing-document-title' : 'document-title';
    title.textContent = this.getDocumentTitle(doc);
    
    const meta = document.createElement('div');
    meta.className = isLanding ? 'landing-document-time' : 'document-meta';
    meta.textContent = this.formatDate(doc.updatedAt);
    
    info.appendChild(title);
    info.appendChild(meta);
    
    if (!isLanding) {
      item.appendChild(info);
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'document-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.type = 'button';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${this.getDocumentTitle(doc)}"?`)) {
          Storage.delete(doc.id);
          if (this.currentDocId === doc.id) {
            this.showLanding();
          } else {
            this.updatePanel();
          }
        }
      });
      item.appendChild(deleteBtn);
    } else {
      item.appendChild(info);
    }
    
    item.addEventListener('click', () => this.loadDocument(doc.id));
    
    return item;
  }

  updateLandingView() {
    const docs = Storage.getAll();
    const section = document.getElementById('documents-section');
    const landingDocs = document.getElementById('landing-docs');
    
    if (docs.length === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    landingDocs.innerHTML = '';
    
    // Sort by modified date, newest first
    const sorted = [...docs].sort((a, b) => b.updatedAt - a.updatedAt);
    sorted.forEach(doc => {
      landingDocs.appendChild(this.createDocumentItem(doc, true));
    });
  }

  getDocumentTitle(doc) {
    // Extract title from first heading or first line
    const match = doc.content.match(/^#\s+(.+)/m);
    if (match) {
      return match[1].trim();
    }
    
    const firstLine = doc.content.split('\n')[0].trim();
    if (firstLine) {
      return firstLine.slice(0, 50) + (firstLine.length > 50 ? '…' : '');
    }
    
    return 'Untitled';
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  togglePanel() {
    this.documentPanel.classList.toggle('hidden');
  }

  switchPanelMode(mode) {
    this.panelMode = mode;
    this.panelCurrent.classList.toggle('active', mode === 'current');
    this.panelOthers.classList.toggle('active', mode === 'others');
    this.updatePanel();
  }

  toggleMenu(e) {
    if (e.clientX || e.targetTouches) this.ripple(e);
    this.menu.classList.toggle('visible');
  }

  ripple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${(event.clientX || event.targetTouches[0].pageX) - button.offsetLeft - radius}px`;
    circle.style.top = `${(event.clientY || event.targetTouches[0].pageY) - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    const existing = button.getElementsByClassName('ripple')[0];
    if (existing) existing.remove();
    button.appendChild(circle);
  }

  downloadCurrentDocument() {
    if (!this.currentDocId) return;
    
    const doc = Storage.get(this.currentDocId);
    if (!doc) return;
    
    const title = this.getDocumentTitle(doc);
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    this.notify('Downloaded: ' + title);
  }

  notify(message) {
    this.notification.textContent = message;
    this.notification.classList.add('visible');
    setTimeout(() => this.notification.classList.remove('visible'), 2000);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new TextareaApp();
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

console.log('%cGitHub https://github.com/DT3264/textarea', 'font-size: 16px; border: 1px solid lightblue; border-radius: 12px; padding: 10px 14px;');
