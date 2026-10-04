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
    this.save(all.filter(d => d.id !== id));
  },
};

class TextareaApp {
  constructor() {
    this.currentDocId = null;
    this.panelMode = 'current';
    this.panelOpen = false;

    this.initializeElements();
    this.attachEventListeners();
    this.showLanding();
    this.renderPanel();
    this.updateLandingView();
  }

  initializeElements() {
    this.article = document.querySelector('article');
    this.landingView = document.getElementById('landing-view');
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
    this.panelToggle.addEventListener('click', () => this.togglePanel());
    this.panelCurrent.addEventListener('click', () => this.switchPanelMode('current'));
    this.panelOthers.addEventListener('click', () => this.switchPanelMode('others'));

    this.menuButton.addEventListener('click', (e) => this.toggleMenu(e));
    document.body.addEventListener('click', (event) => {
      const clickedMenu = event.target.closest('#menu');
      const clickedButton = event.target.closest('#menu-button');
      if (!clickedMenu && !clickedButton) {
        this.menu.classList.remove('visible');
      }
    });

    this.newDocBtn.addEventListener('click', () => this.createNewDocument());
    this.newFromMenu.addEventListener('click', () => {
      this.createNewDocument();
      this.menu.classList.remove('visible');
    });

    this.downloadBtn.addEventListener('click', () => {
      this.downloadCurrentDocument();
      this.menu.classList.remove('visible');
    });

    this.article.addEventListener('input', () => {
      if (this.currentDocId) {
        Storage.update(this.currentDocId, this.article.textContent);
        this.updateTitle();
        this.renderPanel();
        this.updateLandingView();
      }
    });

    this.article.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyS') {
        event.preventDefault();
        this.downloadCurrentDocument();
      }
    });
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
    this.documentPanel.classList.toggle('hidden', !this.panelOpen);
    this.renderPanel();
  }

  switchPanelMode(mode) {
    this.panelMode = mode;
    this.panelCurrent.classList.toggle('active', mode === 'current');
    this.panelOthers.classList.toggle('active', mode === 'others');
    this.renderPanel();
  }

  renderPanel() {
    this.panelContent.innerHTML = '';

    if (!this.currentDocId) {
      const docs = Storage.getAll().sort((a, b) => b.updatedAt - a.updatedAt);
      if (docs.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding: 16px; text-align: center; opacity: 0.55; font-size: 14px;';
        empty.textContent = 'No saved notes yet';
        this.panelContent.appendChild(empty);
        return;
      }

      docs.forEach(doc => this.panelContent.appendChild(this.createDocumentItem(doc, false)));
      return;
    }

    if (this.panelMode === 'current') {
      const doc = Storage.get(this.currentDocId);
      if (doc) this.panelContent.appendChild(this.createCurrentDocView(doc));
      return;
    }

    const docs = Storage.getAll().filter(doc => doc.id !== this.currentDocId).sort((a, b) => b.updatedAt - a.updatedAt);
    if (!docs.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 16px; text-align: center; opacity: 0.55; font-size: 14px;';
      empty.textContent = 'No other notes';
      this.panelContent.appendChild(empty);
      return;
    }

    docs.forEach(doc => this.panelContent.appendChild(this.createDocumentItem(doc, false)));
  }

  createCurrentDocView(doc) {
    const wrap = document.createElement('div');
    wrap.style.padding = '12px';
    wrap.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600;">${this.getDocumentTitle(doc)}</div>
      <div style="font-size: 12px; opacity: 0.7; line-height: 1.7;">
        <div>ID: <code>${doc.id}</code></div>
        <div>Created: ${this.formatDate(doc.createdAt)}</div>
        <div>Modified: ${this.formatDate(doc.updatedAt)}</div>
        <div>Length: ${doc.content.length} chars</div>
      </div>
    `;
    return wrap;
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
    item.appendChild(info);

    if (!isLanding) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'document-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (confirm(`Delete "${this.getDocumentTitle(doc)}"?`)) {
          Storage.delete(doc.id);
          if (this.currentDocId === doc.id) {
            this.showLanding();
          } else {
            this.renderPanel();
            this.updateLandingView();
          }
        }
      });
      item.appendChild(deleteBtn);
    }

    item.addEventListener('click', () => this.loadDocument(doc.id));
    return item;
  }

  loadDocument(id) {
    const doc = Storage.get(id);
    if (!doc) return;

    this.currentDocId = id;
    this.article.textContent = doc.content;
    this.article.style.display = 'block';
    this.landingView.style.display = 'none';
    this.pageTitle.textContent = this.getDocumentTitle(doc);
    document.title = this.getDocumentTitle(doc);

    this.panelOpen = true;
    this.documentPanel.classList.remove('hidden');
    this.renderPanel();
    this.updateLandingView();
    this.article.focus();
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    history.replaceState({}, '', url);
  }

  showLanding() {
    this.currentDocId = null;
    this.article.style.display = 'none';
    this.landingView.style.display = 'flex';
    this.pageTitle.textContent = 'Textarea';
    this.documentStatus.textContent = '';
    this.panelOpen = false;
    this.documentPanel.classList.add('hidden');
    this.updateLandingView();
    this.renderPanel();
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    history.replaceState({}, '', url);
  }

  createNewDocument() {
    const doc = Storage.create('');
    this.loadDocument(doc.id);
  }

  updateTitle() {
    if (!this.currentDocId) return;
    const text = this.article.textContent || '';
    const match = text.match(/^#\s+(.+)/m);
    const title = match ? match[1].trim() : text.split('\n')[0].trim() || 'Untitled';
    this.pageTitle.textContent = title || 'Textarea';
    document.title = title || 'Textarea';
  }

  updateLandingView() {
    const docs = Storage.getAll().sort((a, b) => b.updatedAt - a.updatedAt);
    const container = document.getElementById('landing-docs');
    const section = document.getElementById('documents-section');

    if (!docs.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = '';
    docs.forEach(doc => container.appendChild(this.createDocumentItem(doc, true)));
  }

  getDocumentTitle(doc) {
    const match = (doc.content || '').match(/^#\s+(.+)/m);
    if (match) return match[1].trim();

    const firstLine = (doc.content || '').split('\n')[0].trim();
    if (firstLine) return firstLine.slice(0, 50) + (firstLine.length > 50 ? '…' : '');
    return 'Untitled';
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  }

  toggleMenu(event) {
    if (event.clientX || event.targetTouches) this.ripple(event);
    this.menu.classList.toggle('visible');
  }

  ripple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.left = `${(event.clientX || event.targetTouches[0].pageX) - button.offsetLeft - radius}px`;
    circle.style.top = `${(event.clientY || event.targetTouches[0].pageY) - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const existing = button.querySelector('.ripple');
    if (existing) existing.remove();
    button.appendChild(circle);
  }

  downloadCurrentDocument() {
    if (!this.currentDocId) return;
    const doc = Storage.get(this.currentDocId);
    if (!doc) return;

    const title = this.getDocumentTitle(doc) || 'untitled';
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    this.notify(`Downloaded ${title}`);
  }

  notify(message) {
    this.notification.textContent = message;
    this.notification.classList.add('visible');
    setTimeout(() => this.notification.classList.remove('visible'), 1800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TextareaApp();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
