(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root?.document) root.scripturePrompt = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SHARE_TITLE = 'Find Scripture for a Prayer Request';

  function updateTime(update) {
    const value = update?.date ? `${update.date}T12:00:00` : (update?.createdAt || '');
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function generatePrayerScripturePrompt(prayer) {
    const updates = [...(prayer?.updates || [])]
      .filter(update => typeof update?.text === 'string' && update.text.trim())
      .map((update, index) => ({ update, index }))
      .sort((a, b) => updateTime(a.update) - updateTime(b.update) || a.index - b.index)
      .map(({ update }) => update.text.trim());
    const updateSection = updates.length
      ? `\n\nRecent updates:\n\n${updates.map(text => `- ${text}`).join('\n')}`
      : '';

    return `I have the following prayer request:\n\n"${String(prayer?.text || '').trim()}"${updateSection}\n\nPlease suggest 3–5 Bible passages that are particularly relevant to this prayer request.\n\nFor each passage:\n\n1. Give the Bible citation.\n2. Briefly explain why the passage relates to the prayer request.\n3. Provide a direct YouVersion link to the passage.\n4. Do not invent or paraphrase Scripture and present it as a quotation. If you quote Scripture, ensure the wording and citation are accurate.\n5. Prefer passages that directly address the themes, concerns, circumstances, or spiritual needs reflected in the prayer request rather than merely matching individual keywords.\n\nFormat the response as:\n\n[Bible citation]\n[Brief explanation]\n[YouVersion link]\n\nPlease use standard YouVersion Bible URLs where possible.`;
  }

  function diaryContext(entry) {
    const title = String(entry?.title || '').trim();
    const date = String(entry?.date || '').trim();
    const body = String(entry?.body || '').trim();
    const tags = (entry?.tags || []).map(tag => String(tag).trim()).filter(Boolean).slice(0, 8);
    return `${title ? `Title: ${title}\n` : ''}${date ? `Date: ${date}\n\n` : ''}${body}${tags.length ? `\n\nRelevant tags: ${tags.join(', ')}` : ''}`;
  }

  function generateDiaryScripturePrompt(entry) {
    return `I have the following diary entry:\n\n${diaryContext(entry)}\n\nPlease suggest 3–5 Bible passages that are particularly relevant to what I wrote about in this diary entry.\n\nFor each passage:\n\n1. Give the Bible citation.\n2. Briefly explain why the passage relates to the diary entry.\n3. Provide a direct YouVersion link to the passage.\n4. Do not invent or paraphrase Scripture and present it as a quotation. If you quote Scripture, ensure the wording and citation are accurate.\n5. Prefer passages that directly address the themes, concerns, circumstances, spiritual needs, questions, struggles, gratitude, hopes, or reflections contained in the diary entry rather than merely matching individual keywords.\n\nFormat the response as:\n\n[Bible citation]\n[Brief explanation]\n[YouVersion link]\n\nPlease use standard YouVersion Bible URLs where possible.`;
  }

  function generateScripturePrompt(source, sourceType = 'prayer') {
    return sourceType === 'diary' ? generateDiaryScripturePrompt(source) : generatePrayerScripturePrompt(source);
  }

  async function copyPrompt(text, options = {}) {
    const navigatorObject = options.navigator || globalThis.navigator;
    try {
      if (!navigatorObject?.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigatorObject.clipboard.writeText(text);
      options.notify?.('Prompt copied');
      return true;
    } catch (error) {
      options.selectPrompt?.();
      options.notify?.('Could not copy automatically. The prompt is selected for manual copying.');
      return false;
    }
  }

  async function sharePrompt(text, options = {}) {
    const navigatorObject = options.navigator || globalThis.navigator;
    if (!navigatorObject?.share) return copyPrompt(text, options);
    try {
      await navigatorObject.share({ title: options.title || SHARE_TITLE, text });
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      return copyPrompt(text, options);
    }
  }

  function bindScripturePromptUI(document, dependencies = {}) {
    const overlay = document.getElementById('scripturePromptModal');
    const promptArea = document.getElementById('scripturePromptText');
    if (!overlay || !promptArea) return;
    let previousFocus = null;
    let activeSourceType = 'prayer';
    const notify = dependencies.notify || (message => globalThis.toast?.(message));
    const selectPrompt = () => { promptArea.focus(); promptArea.select(); };
    const close = () => {
      overlay.hidden = true;
      previousFocus?.focus?.();
      previousFocus = null;
    };
    const open = (source, sourceType) => {
      activeSourceType = sourceType;
      previousFocus = document.activeElement;
      promptArea.value = generateScripturePrompt(source, sourceType);
      const diary = sourceType === 'diary';
      const description = document.getElementById('scripturePromptDescription');
      const context = document.getElementById('scripturePromptContext');
      const privacy = document.getElementById('scripturePromptPrivacy');
      if (context) context.textContent = diary ? 'Diary & Scripture' : 'Prayer & Scripture';
      if (description) description.textContent = `Gathered can create a prompt from this ${diary ? 'diary entry' : 'prayer request'} that you can run through the AI assistant of your choice. Gathered does not send the ${diary ? 'diary entry' : 'prayer request'} to an AI service.`;
      if (privacy) privacy.textContent = `Your ${diary ? 'diary entry' : 'prayer'} stays on this device unless you choose to copy or share this prompt.`;
      overlay.hidden = false;
      setTimeout(() => document.getElementById('copyScripturePrompt')?.focus(), 0);
    };

    document.addEventListener('click', event => {
      const opener = event.target.closest?.('[data-find-scripture]');
      if (opener) {
        event.preventDefault();
        const sourceType = opener.dataset.aiSource || 'prayer';
        const getter = sourceType === 'diary' ? (dependencies.getDiaryEntry || globalThis.getDiaryEntry) : (dependencies.getPrayer || globalThis.getPrayer);
        const source = getter?.(opener.dataset.findScripture);
        if (source) open(source, sourceType);
        return;
      }
      if (event.target.closest?.('[data-close-scripture-prompt]') || event.target === overlay) close();
    });
    document.getElementById('copyScripturePrompt').addEventListener('click', () =>
      copyPrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt }));
    document.getElementById('shareScripturePrompt').addEventListener('click', () =>
      sharePrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt, title: activeSourceType === 'diary' ? 'Find Scripture for a Diary Entry' : SHARE_TITLE }));
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const items = [...overlay.querySelectorAll('button:not([disabled]), textarea')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  return { SHARE_TITLE, generateScripturePrompt, generatePrayerScripturePrompt, generateDiaryScripturePrompt, copyPrompt, sharePrompt, bindScripturePromptUI };
});
