(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root?.document) return;

  if (Array.isArray(root.APP_ASSETS) && !root.APP_ASSETS.includes('tour.js')) root.APP_ASSETS.push('tour.js');

  // Add the invitation after every home render without coupling the tour to app data.
  const originalHomePage = root.homePage;
  root.homePage = function () {
    return originalHomePage().replace(
      '</p></section>',
      '</p><button class="tour-invitation" type="button" data-open-tour>Take a tour of the Gathered app</button></section>'
    );
  };

  const start = () => { root.gatheredTour = api.createTour(root.document, root); };
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const icon = path => `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
  const slides = [
    { eyebrow: 'Welcome to Gathered', title: 'Gather what matters.', body: 'A private place to capture Scripture, remember your people, and carry prayer forward from week to week.', note: 'Keep the story of your gatherings close—not scattered across notes and messages.', visual: icon('M18 12h28a6 6 0 0 1 6 6v34H20a8 8 0 0 1-8-8V18a6 6 0 0 1 6-6Zm2 0v40M28 24h15M28 33h15') },
    { eyebrow: 'Sessions', title: 'Capture every gathering.', body: 'Choose Small Group, Sunday Worship, or Individual Devotion, then record the date, Scripture, journal notes, prayers, and follow-ups.', note: 'One flexible rhythm for gathering with others or meeting with God on your own.', visual: icon('M14 19h36v33H14zM22 12v14M42 12v14M14 29h36M23 38h7M36 38h7M23 45h7') },
    { eyebrow: 'Scripture', title: 'Stay in the Word.', body: 'Record a passage, open it in YouVersion, and keep Scripture beside your journal reflections.', note: 'Supported Scripture text can be added when a configured provider is available.', visual: icon('M11 15h17a8 8 0 0 1 8 8v30a8 8 0 0 0-8-8H11zm42 0H36v38a8 8 0 0 1 8-8h9zM19 25h10M19 33h10M43 25h4M43 33h4') },
    { eyebrow: 'People', title: 'Remember your people.', body: 'Organize member profiles with helpful contact details, birthdays, roles, and notes.', note: 'See each person’s prayer and follow-up history, connected across Gathered.', visual: icon('M32 31a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-18 22c1-11 8-17 18-17s17 6 18 17M10 31a7 7 0 0 1 7-7M54 31a7 7 0 0 0-7-7') },
    { eyebrow: 'Prayer', title: 'Carry prayer forward.', body: 'Create requests in a session or on their own. Add updates, edit the story, and mark prayers answered.', note: 'A prayer stays alive across weeks—with its full history—rather than getting lost in an old session.', visual: icon('M32 53S10 41 10 25a11 11 0 0 1 20-7l2 3 2-3a11 11 0 0 1 20 7c0 16-22 28-22 28Zm0-24v14M25 36h14') },
    { eyebrow: 'Prayer & AI prompts', title: 'Find Scripture or hear a pastoral message.', body: 'Gathered prepares thoughtful prompts asking for relevant Bible passages or a short pastoral message that can be read aloud by your chosen AI assistant when available.', note: 'Gathered sends nothing to AI itself. You choose whether to copy or share a prompt—and which AI assistant receives it.', visual: icon('M12 14h40v29H29l-11 9v-9h-6zM23 25h18M23 32h12M45 8v10M40 13h10') },
    { eyebrow: 'Draft Sessions', title: 'Never lose the moment.', body: 'A draft begins when you choose a session type, then saves automatically as you write.', note: 'Leave, resume later, and explicitly save the session when it is ready for your completed history.', visual: icon('M16 11h25l8 8v34H16zM41 11v10h8M23 31h19M23 39h19M23 47h11M47 47l5 5') },
    { eyebrow: 'Follow-through', title: 'Turn care into action.', body: 'Capture what needs to happen, assign it to a person, add a due date, and track it through completion.', note: 'Keep next steps connected to the gathering where they began.', visual: icon('M12 17h40v35H12zM20 10v14M44 10v14M12 28h40M21 40l6 6 16-16') },
    { eyebrow: 'Search', title: 'Find it again.', body: 'Search completed sessions, Scripture, journal notes, members, prayer requests and updates, and follow-ups.', note: 'The details you faithfully captured are ready when you need them.', visual: icon('M27 47a18 18 0 1 0 0-36 18 18 0 0 0 0 36Zm13-6 13 13M20 25h14M20 32h9') },
    { eyebrow: 'Private by design', title: 'Your story stays yours.', body: 'Gathered stores encrypted data on your device, protected by your passphrase, with encrypted backup and restore.', note: 'It works offline, installs like an app, and checks for app updates—without accounts, analytics, or a server database.', cta: 'Start gathering what matters.', visual: icon('M17 28h30v25H17zM23 28v-7a9 9 0 0 1 18 0v7M32 38v7') }
  ];

  function createTour(document, win) {
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<section class="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourStatus">
      <header class="tour-header"><div class="tour-brand"><img src="icons/icon-192.png" alt=""><span>Gathered</span></div><button class="icon-btn tour-close" type="button" data-tour-close aria-label="Close feature tour">×</button></header>
      <div class="tour-track" data-tour-track>${slides.map((slide, index) => `<article class="tour-slide" aria-labelledby="${index === 0 ? 'tourTitle' : `tour-slide-title-${index}`}" data-tour-slide>
        <div class="tour-visual">${slide.visual}</div><div class="tour-copy"><div class="eyebrow">${slide.eyebrow}</div><h2 id="${index === 0 ? 'tourTitle' : `tour-slide-title-${index}`}">${slide.title}</h2><p>${slide.body}</p><p class="tour-note">${slide.note}</p>${slide.cta ? `<strong class="tour-cta">${slide.cta}</strong>` : ''}</div>
      </article>`).join('')}</div>
      <footer class="tour-footer"><p class="tour-status" id="tourStatus" aria-live="polite"></p><div class="tour-dots" role="group" aria-label="Choose a tour slide">${slides.map((_, index) => `<button type="button" data-tour-dot="${index}" aria-label="Go to slide ${index + 1} of ${slides.length}"></button>`).join('')}</div><div class="tour-actions"><button class="btn ghost" type="button" data-tour-previous>Previous</button><button class="btn primary" type="button" data-tour-next>Next</button></div></footer>
    </section>`;
    document.body.appendChild(overlay);

    const track = overlay.querySelector('[data-tour-track]');
    const previous = overlay.querySelector('[data-tour-previous]');
    const next = overlay.querySelector('[data-tour-next]');
    const status = overlay.querySelector('.tour-status');
    const dots = [...overlay.querySelectorAll('[data-tour-dot]')];
    let current = 0, returnFocus = null, scrollTimer;
    const reducedMotion = () => win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    function update(index, move = true) {
      current = Math.max(0, Math.min(slides.length - 1, index));
      previous.disabled = current === 0;
      next.textContent = current === slides.length - 1 ? 'Done' : 'Next';
      status.textContent = `Slide ${current + 1} of ${slides.length}`;
      dots.forEach((dot, i) => { dot.setAttribute('aria-current', i === current ? 'step' : 'false'); });
      if (move) track.scrollTo({ left: current * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
    function hide() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      document.body.classList.remove('tour-open');
      returnFocus?.focus?.();
      returnFocus = null;
    }
    function close() {
      if (win.history.state?.gatheredTour) win.history.back();
      else hide();
    }
    function open(invoker) {
      if (!overlay.hidden) return;
      returnFocus = invoker || document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('tour-open');
      win.history.pushState({ ...(win.history.state || {}), gatheredTour: true }, '', win.location.href);
      update(0);
      win.setTimeout(() => overlay.querySelector('[data-tour-close]').focus(), 0);
    }

    document.addEventListener('click', event => {
      const opener = event.target.closest?.('[data-open-tour]');
      if (opener) { event.preventDefault(); open(opener); }
    });
    overlay.addEventListener('click', event => {
      if (event.target.closest('[data-tour-close]')) close();
      else if (event.target.closest('[data-tour-previous]')) update(current - 1);
      else if (event.target.closest('[data-tour-next]')) current === slides.length - 1 ? close() : update(current + 1);
      else if (event.target.closest('[data-tour-dot]')) update(Number(event.target.closest('[data-tour-dot]').dataset.tourDot));
    });
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); update(current + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); update(current - 1); }
      if (event.key !== 'Tab') return;
      const focusable = [...overlay.querySelectorAll('button:not([disabled])')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    track.addEventListener('scroll', () => {
      win.clearTimeout(scrollTimer);
      scrollTimer = win.setTimeout(() => update(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)), false), 80);
    }, { passive: true });
    win.addEventListener('popstate', () => { if (!overlay.hidden && !win.history.state?.gatheredTour) hide(); });
    win.addEventListener('resize', () => { if (!overlay.hidden) update(current, true); });
    update(0, false);
    return { open, close, goTo: update, get current() { return current; }, get isOpen() { return !overlay.hidden; }, slides };
  }
  return { createTour, slides };
});
