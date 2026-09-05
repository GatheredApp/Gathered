// Native device sharing for Gathered.
(() => {
  const SHARE_TEXT = 'Check out Gathered to journal and record prayer requests from your small group meetings.';

  if (Array.isArray(APP_ASSETS) && !APP_ASSETS.includes('share.js')) APP_ASSETS.push('share.js');

  const originalShell = shell;
  shell = function (content, active = 'home') {
    const html = originalShell(content, active);
    const button = `<button class="icon-btn" type="button" data-share-gathered aria-label="Share Gathered" title="Share Gathered">↗</button>`;
    return html.replace('<div class="top-actions">', `<div class="top-actions">${button}`);
  };

  async function copyFallback() {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      toast('Share message copied');
    } catch {
      const area = document.createElement('textarea');
      area.value = SHARE_TEXT;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      toast('Share message copied');
    }
  }

  async function shareGathered() {
    if (!navigator.share) {
      await copyFallback();
      return;
    }
    try {
      await navigator.share({ text: SHARE_TEXT });
    } catch (error) {
      if (error?.name !== 'AbortError') await copyFallback();
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-share-gathered]');
    if (!button) return;
    event.preventDefault();
    shareGathered();
  });
})();
