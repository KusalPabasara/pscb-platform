(function attachPscbViewer(global) {
  class PscbViewer {
    constructor(options) {
      if (!options || !options.baseUrl) throw new Error('PscbViewer requires baseUrl.');
      this.options = options;
      this.baseOrigin = new URL(options.baseUrl).origin;
      this.frame = null;
      this.document = null;
      this.page = null;
      this.ready = false;
      this.authorized = false;
      this.sessionToken = String(options.sessionToken || '');
      this.accessible = Boolean(options.accessible);
      this.listener = (event) => {
        if (event.origin !== this.baseOrigin || event.source !== this.frame?.contentWindow) return;
        if (!event.data || event.data.source !== 'pscb-protected-viewer' || event.data.version !== 1) return;
        if (event.data.type === 'viewer.ready') {
          this.ready = true;
          this.post('viewer.authorize', { token: this.sessionToken });
        }
        if (event.data.type === 'viewer.authorized') {
          this.authorized = true;
          this.sendContent();
          if (this.accessible) this.setAccessible(true);
        }
        this.options.onEvent?.({ type: event.data.type, payload: event.data.payload });
      };
    }

    mount(target) {
      if (!(target instanceof HTMLElement)) throw new Error('PscbViewer mount target must be an element.');
      this.destroy();
      const url = new URL('/viewer', this.baseOrigin);
      url.searchParams.set('parentOrigin', global.location.origin);
      const frame = document.createElement('iframe');
      frame.src = url.toString();
      frame.title = this.options.title || 'Protected document viewer';
      frame.referrerPolicy = 'strict-origin';
      frame.style.width = '100%';
      frame.style.minHeight = this.options.minHeight || '720px';
      frame.style.border = '0';
      frame.style.borderRadius = '18px';
      frame.style.background = '#e9ede7';
      target.replaceChildren(frame);
      this.frame = frame;
      this.ready = false;
      this.authorized = false;
      global.addEventListener('message', this.listener);
    }

    loadDocument(documentPayload) {
      if (!documentPayload || typeof documentPayload.content !== 'string') {
        throw new Error('PscbViewer.loadDocument requires string content.');
      }
      this.document = {
        documentId: String(documentPayload.documentId || 'document'),
        label: String(documentPayload.label || 'Protected document'),
        title: String(documentPayload.title || 'Untitled document'),
        content: documentPayload.content,
      };
      this.page = null;
      this.sendContent();
    }

    loadPage(pagePayload) {
      if (!pagePayload || !Array.isArray(pagePayload.blocks) || typeof pagePayload.title !== 'string') {
        throw new Error('PscbViewer.loadPage requires a title and structured blocks.');
      }
      this.page = pagePayload;
      this.document = null;
      this.sendContent();
    }

    clearDisplay() {
      this.post('viewer.clear');
    }

    setAccessible(enabled) {
      this.accessible = Boolean(enabled);
      this.post('viewer.accessibility', { enabled: this.accessible });
    }

    sendContent() {
      if (this.ready && this.authorized && this.document) this.post('viewer.load', this.document);
      if (this.ready && this.authorized && this.page) this.post('viewer.load-page', this.page);
    }

    post(type, payload) {
      if (!this.ready || !this.frame?.contentWindow) return;
      this.frame.contentWindow.postMessage({ source: 'pscb-viewer-host', version: 1, type, payload }, this.baseOrigin);
    }

    destroy() {
      global.removeEventListener('message', this.listener);
      this.frame?.remove();
      this.frame = null;
      this.ready = false;
      this.authorized = false;
    }
  }

  global.PscbViewer = PscbViewer;
})(window);
