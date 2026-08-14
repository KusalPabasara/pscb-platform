(function attachPscbSecure(global) {
  function validateTarget(value) {
    const url = new URL(value, global.location.href);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
      throw new Error('PscbSecure requires HTTPS, except for local development.');
    }
    return url;
  }

  global.PscbSecure = {
    open(options) {
      if (!options?.url) throw new Error('PscbSecure.open requires a URL.');
      const target = validateTarget(options.url);
      const launch = new URL('pscb-secure://open');
      launch.searchParams.set('url', target.toString());
      if (options.session) launch.searchParams.set('session', String(options.session));
      global.location.href = launch.toString();
    },
    isSecureViewer() {
      return /PSCB-Secure-Viewer\//.test(global.navigator.userAgent);
    },
  };
})(window);
