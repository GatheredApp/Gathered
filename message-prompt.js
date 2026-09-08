(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root?.document) root.messagePrompt = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SHARE_TITLE = 'Create a Pastoral Message for a Prayer Request';

  function updateTime(update) {
    const value = update?.date ? `${update.date}T12:00:00` : (update?.createdAt || '');
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function generateMessagePrompt(prayer) {
    const updates = [...(prayer?.updates || [])]
      .filter(update => typeof update?.text === 'string' && update.text.trim())
      .map((update, index) => ({ update, index }))
      .sort((a, b) => updateTime(a.update) - updateTime(b.update) || a.index - b.index)
      .map(({ update }) => update.text.trim());
    const updateSection = updates.length
      ? `\n\nUpdates to this prayer:\n\n${updates.map(text => `- ${text}`).join('\n')}`
      : '';

    return `I have the following prayer request:\n\n"${String(prayer?.text || '').trim()}"${updateSection}\n\nCreate a short pastoral message based specifically on this prayer request.\n\nThe message should feel like a thoughtful pastor speaking directly to someone who brought this prayer forward. Blend pastoral encouragement, biblical teaching, and Scripture into one coherent message rather than simply providing a list of Bible verses.\n\nPlease follow these guidelines:\n\n1. Write approximately 500–800 words, suitable for about a 3–5 minute spoken message.\n2. Begin by acknowledging the specific concern, circumstance, hope, struggle, or spiritual need expressed in the prayer.\n3. Identify the deeper biblical or spiritual themes raised by the prayer.\n4. Weave 2–4 particularly relevant Bible passages naturally into the message.\n5. Explain how those passages apply to the person's situation rather than merely citing them.\n6. Use a warm, pastoral, compassionate tone without becoming sentimental, preachy, or overly dramatic.\n7. Avoid clichés and generic encouragement that could apply to any prayer request.\n8. Do not claim to know God's specific plan, promise a particular outcome, or imply that faithful prayer guarantees the requested result.\n9. Do not say that God told you, revealed to you, or guaranteed something about this person's specific circumstances.\n10. Do not invent Scripture or present paraphrased Scripture as a direct quotation. If quoting Scripture, make sure the wording and citation are accurate.\n11. When mentioning a Bible passage, include its citation and provide a standard YouVersion link so the listener can explore the passage further.\n12. Keep the message broadly Christian and centered on Scripture rather than denominational controversies unless the prayer request specifically makes such context relevant.\n13. Speak directly and naturally to the person rather than writing an academic essay or theological outline.\n14. Conclude with a short prayer of approximately 75–125 words that directly relates to the original prayer request.\n\nWrite the response as a continuous pastoral message with natural paragraphs and transitions.\n\nDo not format it as an outline, sermon notes, or a list of points.\n\nThe result should sound natural when read aloud.\n\nIf your AI assistant supports voice or read-aloud functionality, the user may choose to listen to the resulting message aloud.`;
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
      await navigatorObject.share({ title: SHARE_TITLE, text });
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      return copyPrompt(text, options);
    }
  }

  function bindMessagePromptUI(document, dependencies = {}) {
    const overlay = document.getElementById('messagePromptModal');
    const promptArea = document.getElementById('messagePromptText');
    if (!overlay || !promptArea) return;
    let previousFocus = null;
    const notify = dependencies.notify || (message => globalThis.toast?.(message));
    const selectPrompt = () => { promptArea.focus(); promptArea.select(); };
    const close = () => {
      overlay.hidden = true;
      previousFocus?.focus?.();
      previousFocus = null;
    };
    const open = prayer => {
      previousFocus = document.activeElement;
      promptArea.value = generateMessagePrompt(prayer);
      overlay.hidden = false;
      setTimeout(() => document.getElementById('copyMessagePrompt')?.focus(), 0);
    };

    document.addEventListener('click', event => {
      const opener = event.target.closest?.('[data-listen-message]');
      if (opener) {
        event.preventDefault();
        const prayer = (dependencies.getPrayer || globalThis.getPrayer)?.(opener.dataset.listenMessage);
        if (prayer) open(prayer);
        return;
      }
      if (event.target.closest?.('[data-close-message-prompt]') || event.target === overlay) close();
    });
    document.getElementById('copyMessagePrompt').addEventListener('click', () =>
      copyPrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt }));
    document.getElementById('shareMessagePrompt').addEventListener('click', () =>
      sharePrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt }));
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const items = [...overlay.querySelectorAll('button:not([disabled]), textarea')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  return { SHARE_TITLE, generateMessagePrompt, copyPrompt, sharePrompt, bindMessagePromptUI };
});
