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

  function generatePrayerMessagePrompt(prayer) {
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

  function diaryContext(entry) {
    const title = String(entry?.title || '').trim();
    const date = String(entry?.date || '').trim();
    const body = String(entry?.body || '').trim();
    const tags = (entry?.tags || []).map(tag => String(tag).trim()).filter(Boolean).slice(0, 8);
    return `${title ? `Title: ${title}\n` : ''}${date ? `Date: ${date}\n\n` : ''}${body}${tags.length ? `\n\nRelevant tags: ${tags.join(', ')}` : ''}`;
  }

  function generateDiaryMessagePrompt(entry) {
    return `I have the following diary entry:\n\n${diaryContext(entry)}\n\nCreate a short pastoral message based specifically on what I wrote about in this diary entry.\n\nThe message should feel like a thoughtful pastor speaking directly to the writer. Blend pastoral encouragement, biblical teaching, and Scripture into one coherent message rather than simply providing a list of Bible verses.\n\nPlease follow these guidelines:\n\n1. Write approximately 500–800 words, suitable for about a 3–5 minute spoken message.\n2. Begin by acknowledging the specific circumstances, concerns, emotions, gratitude, questions, hopes, struggles, or spiritual themes reflected in the diary entry.\n3. Identify the deeper biblical or spiritual themes raised by the entry.\n4. Weave 2–4 particularly relevant Bible passages naturally into the message.\n5. Explain how those passages apply to the journaled situation rather than merely citing them.\n6. Use a warm, pastoral, compassionate tone without becoming sentimental, preachy, or overly dramatic.\n7. Avoid clichés and generic encouragement that could apply to any diary entry.\n8. Do not claim to know God's specific plan.\n9. Do not promise a particular outcome.\n10. Do not say that God told, revealed, or guaranteed something about the writer's circumstances.\n11. Do not invent Scripture or present paraphrased Scripture as a direct quotation. If quoting Scripture, make sure the wording and citation are accurate.\n12. When discussing a Bible passage, include its citation and provide a standard YouVersion link so the listener can explore it further.\n13. Keep the message broadly Christian and centered on Scripture rather than denominational controversies unless the diary entry itself makes such context relevant.\n14. Speak directly and naturally to the writer rather than producing an academic essay.\n15. End with a short prayer of approximately 75–125 words that relates specifically to the diary entry.\n16. Produce prose that sounds natural when read aloud.\n\nWrite the response as a continuous pastoral message with natural paragraphs and transitions, not as an outline, sermon notes, or a list of points.\n\nIf your AI assistant supports voice or read-aloud functionality, the user may choose to listen to the resulting message aloud.`;
  }

  function generateMessagePrompt(source, sourceType = 'prayer') {
    return sourceType === 'diary' ? generateDiaryMessagePrompt(source) : generatePrayerMessagePrompt(source);
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

  function bindMessagePromptUI(document, dependencies = {}) {
    const overlay = document.getElementById('messagePromptModal');
    const promptArea = document.getElementById('messagePromptText');
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
      promptArea.value = generateMessagePrompt(source, sourceType);
      const diary = sourceType === 'diary';
      const context = document.getElementById('messagePromptContext');
      const description = document.getElementById('messagePromptDescription');
      const privacy = document.getElementById('messagePromptPrivacy');
      if (context) context.textContent = diary ? 'Diary & Message' : 'Prayer & Message';
      if (description) description.textContent = `Gathered can create a prompt asking an AI assistant to prepare a short pastoral message for this ${diary ? 'diary entry' : 'prayer request'}. Gathered does not send the ${diary ? 'diary entry' : 'prayer request'} to an AI service.`;
      if (privacy) privacy.textContent = `Your ${diary ? 'diary entry' : 'prayer'} stays on this device unless you choose to copy or share this prompt.`;
      overlay.hidden = false;
      setTimeout(() => document.getElementById('copyMessagePrompt')?.focus(), 0);
    };

    document.addEventListener('click', event => {
      const opener = event.target.closest?.('[data-listen-message]');
      if (opener) {
        event.preventDefault();
        const sourceType = opener.dataset.aiSource || 'prayer';
        const getter = sourceType === 'diary' ? (dependencies.getDiaryEntry || globalThis.getDiaryEntry) : (dependencies.getPrayer || globalThis.getPrayer);
        const source = getter?.(opener.dataset.listenMessage);
        if (source) open(source, sourceType);
        return;
      }
      if (event.target.closest?.('[data-close-message-prompt]') || event.target === overlay) close();
    });
    document.getElementById('copyMessagePrompt').addEventListener('click', () =>
      copyPrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt }));
    document.getElementById('shareMessagePrompt').addEventListener('click', () =>
      sharePrompt(promptArea.value, { navigator: dependencies.navigator, notify, selectPrompt, title: activeSourceType === 'diary' ? 'Create a Pastoral Message for a Diary Entry' : SHARE_TITLE }));
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const items = [...overlay.querySelectorAll('button:not([disabled]), textarea')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  return { SHARE_TITLE, generateMessagePrompt, generatePrayerMessagePrompt, generateDiaryMessagePrompt, copyPrompt, sharePrompt, bindMessagePromptUI };
});
