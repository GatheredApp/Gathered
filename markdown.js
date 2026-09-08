(function (root) {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function safeLink(url) {
    const value = String(url || '').trim();
    if (!/^https?:\/\//i.test(value)) return null;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }

  function inlineMarkdown(source) {
    const code = [];
    let value = escapeHtml(source).replace(/`([^`\n]+)`/g, (_, contents) => {
      code.push(`<code>${contents}</code>`);
      return `\u0000CODE${code.length - 1}\u0000`;
    });
    value = value.replace(/\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+["'][^"']*["'])?\)/g, (match, label, url) => {
      const safe = safeLink(url.replace(/&amp;/g, '&'));
      return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
    value = value
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
      .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
    return value.replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)]);
  }

  function renderMarkdown(text, options = {}) {
    const source = String(text ?? '').replace(/\r\n?/g, '\n');
    if (!source) return '';
    if (options.inline) return inlineMarkdown(source).replace(/\n/g, '<br>');

    const output = [];
    const lines = source.split('\n');
    let paragraph = [], listType = '', listItems = [], quote = [];
    const flushParagraph = () => {
      if (paragraph.length) output.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (listItems.length) output.push(`<${listType}>${listItems.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</${listType}>`);
      listType = ''; listItems = [];
    };
    const flushQuote = () => {
      if (quote.length) output.push(`<blockquote>${quote.map(inlineMarkdown).join('<br>')}</blockquote>`);
      quote = [];
    };
    const flush = () => { flushParagraph(); flushList(); flushQuote(); };

    lines.forEach(line => {
      if (!line.trim()) { flush(); return; }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      const quoted = line.match(/^\s*>\s?(.*)$/);
      if (heading) { flush(); const level = Math.min(6, heading[1].length); output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); }
      else if (unordered || ordered) {
        flushParagraph(); flushQuote();
        const nextType = unordered ? 'ul' : 'ol';
        if (listType && listType !== nextType) flushList();
        listType = nextType; listItems.push((unordered || ordered)[1]);
      } else if (quoted) { flushParagraph(); flushList(); quote.push(quoted[1]); }
      else { flushList(); flushQuote(); paragraph.push(line); }
    });
    flush();
    return output.join('');
  }

  root.renderMarkdown = renderMarkdown;
  if (typeof module !== 'undefined' && module.exports) module.exports = { renderMarkdown, safeLink };
})(typeof globalThis !== 'undefined' ? globalThis : this);
