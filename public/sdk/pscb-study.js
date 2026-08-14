(function attachPscbStudy(global) {
  class PscbStudy {
    constructor(options) {
      if (!options || !options.baseUrl) throw new Error('PscbStudy requires baseUrl.');
      this.options = options;
      this.baseOrigin = new URL(options.baseUrl).origin;
      this.frame = null;
      this.listener = (event) => {
        if (event.origin !== this.baseOrigin) return;
        if (!event.data || event.data.source !== 'pscb-study-mvp' || event.data.version !== 1) return;
        this.options.onEvent?.({ type: event.data.type, payload: event.data.payload });
      };
    }

    mount(target) {
      if (!(target instanceof HTMLElement)) throw new Error('PscbStudy mount target must be an element.');
      this.destroy();
      const url = new URL('/embed', this.baseOrigin);
      url.searchParams.set('parentOrigin', global.location.origin);
      if (this.options.participantCode) url.searchParams.set('participant', this.options.participantCode);
      if (this.options.tracker) url.searchParams.set('tracker', this.options.tracker);
      if (this.options.accessible) url.searchParams.set('accessible', '1');
      const frame = document.createElement('iframe');
      frame.src = url.toString();
      frame.title = this.options.title || 'Reading and gaze study';
      frame.allow = 'camera';
      frame.referrerPolicy = 'strict-origin';
      frame.style.width = '100%';
      frame.style.minHeight = this.options.minHeight || '820px';
      frame.style.border = '0';
      frame.style.borderRadius = '16px';
      frame.style.background = '#edf1ec';
      target.replaceChildren(frame);
      this.frame = frame;
      global.addEventListener('message', this.listener);
    }

    destroy() {
      global.removeEventListener('message', this.listener);
      this.frame?.remove();
      this.frame = null;
    }
  }

  global.PscbStudy = PscbStudy;
})(window);
