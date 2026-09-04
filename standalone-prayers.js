// Standalone prayer request flows for Gathered.
// Keeps standalone requests in the same state.prayers collection used by session prayers.

// Ensure Gathered's in-app updater also verifies this module.
if (Array.isArray(APP_ASSETS) && !APP_ASSETS.includes('standalone-prayers.js')) APP_ASSETS.push('standalone-prayers.js');

prayersPage = function () {
  const active = state.prayers
    .filter(p => p.status !== 'answered')
    .sort((a, b) => (prayerLatestDate(b) || '').localeCompare(prayerLatestDate(a) || ''));
  const answered = state.prayers
    .filter(p => p.status === 'answered')
    .sort((a, b) => (b.answeredDate || '').localeCompare(a.answeredDate || ''));

  return shell(`<div class="page">
    <div class="section-title">
      <div class="hero">
        <div class="eyebrow">Prayer Log</div>
        <h1>Prayer requests</h1>
        <p class="subtle">Each request keeps its full story—from first ask through updates and answered prayer, whether it starts in a small group session or anywhere else.</p>
      </div>
      <a class="btn primary small" href="#prayer/new">＋ Add request</a>
    </div>
    <section>
      <div class="section-title"><h2>Active</h2><span class="pill">${active.length}</span></div>
      ${active.length ? `<div class="list">${active.map(prayerListItem).join('')}</div>` : `<div class="empty">No active prayer requests.</div>`}
    </section>
    <section class="section">
      <div class="section-title"><h2>Answered</h2><span class="pill answered">${answered.length}</span></div>
      ${answered.length ? `<div class="list">${answered.map(prayerListItem).join('')}</div>` : `<div class="empty">Answered prayers will collect here.</div>`}
    </section>
  </div>`, 'prayers');
};

function standalonePrayerEditor(id = 'new') {
  const existing = id !== 'new' ? getPrayer(id) : null;
  const prayer = existing || {
    id: 'new',
    memberId: '',
    text: '',
    status: 'active',
    createdDate: todayISO(),
    answeredDate: ''
  };

  return shell(`<div class="page">
    <div class="section-title">
      <div>
        <div class="eyebrow">${existing ? 'Track prayer' : 'New prayer request'}</div>
        <h1>${existing ? esc(prayer.memberName || getMemberName(prayer.memberId, 'General / group')) : 'Add prayer request'}</h1>
      </div>
    </div>
    <form id="standalonePrayerForm" data-prayer-id="${esc(prayer.id)}" class="form">
      <div class="card form flat">
        <div class="field">
          <label for="standalonePrayerMember">Person</label>
          <select class="select" id="standalonePrayerMember">${memberOptions(prayer.memberId)}</select>
        </div>
        <div class="field">
          <label for="standalonePrayerText">Prayer request</label>
          <textarea class="textarea" id="standalonePrayerText" rows="5" placeholder="What would you like to remember and pray for?" required>${esc(prayer.text)}</textarea>
        </div>
        <div class="field">
          <label for="standalonePrayerCreatedDate">Started</label>
          <input class="input" type="date" id="standalonePrayerCreatedDate" value="${esc(prayer.createdDate || todayISO())}" required>
        </div>
        ${existing ? `<div class="field">
          <label for="standalonePrayerStatus">Status</label>
          <select class="select" id="standalonePrayerStatus">
            <option value="active" ${prayer.status !== 'answered' ? 'selected' : ''}>Active</option>
            <option value="answered" ${prayer.status === 'answered' ? 'selected' : ''}>Answered</option>
          </select>
        </div>` : ''}
      </div>
      ${existing ? `<div class="card form flat">
        <div class="card-header">
          <div>
            <h2>Add an update</h2>
            <div class="subtle mini">Optional. Add progress without tying it to a small group session.</div>
          </div>
        </div>
        <div class="field">
          <label for="standalonePrayerUpdateDate">Update date</label>
          <input class="input" type="date" id="standalonePrayerUpdateDate" value="${todayISO()}">
        </div>
        <div class="field">
          <label for="standalonePrayerUpdateText">Update</label>
          <textarea class="textarea" id="standalonePrayerUpdateText" rows="4" placeholder="What changed? How can you continue praying?"></textarea>
        </div>
      </div>` : ''}
      <div class="form-actions">
        <a class="btn ghost" href="${existing ? `#prayer/${existing.id}` : '#prayers'}">Cancel</a>
        <button class="btn primary" type="submit">${existing ? 'Save Update' : 'Add Prayer Request'}</button>
      </div>
    </form>
  </div>`, 'prayers');
}

prayerDetail = function (id) {
  if (id === 'new') return standalonePrayerEditor('new');

  const p = getPrayer(id);
  if (!p) return prayersPage();

  const routeParts = (location.hash || '').slice(1).split('/');
  if (routeParts[2] === 'edit') return standalonePrayerEditor(id);

  const history = [
    { date: p.createdDate, text: 'Prayer request created', entryId: p.createdEntryId },
    ...(p.updates || []).map(u => ({ date: u.date, text: u.text, entryId: u.entryId }))
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return shell(`<div class="page">
    <div class="section-title">
      <div>
        <div class="eyebrow">Prayer history</div>
        <h1>${esc(p.memberName || getMemberName(p.memberId, 'General / group'))}</h1>
      </div>
      <div class="inline">
        <span class="pill ${p.status === 'answered' ? 'answered' : ''}">${p.status === 'answered' ? 'Answered' : 'Active'}</span>
        <a class="btn small secondary" href="#prayer/${p.id}/edit">Update</a>
      </div>
    </div>
    <div class="card flat">
      <div class="detail-body"><strong>${esc(p.text)}</strong></div>
      <div class="meta">Started ${fmtDate(p.createdDate)}${p.answeredDate ? ` · Answered ${fmtDate(p.answeredDate)}` : ''}</div>
    </div>
    <section class="section">
      <div class="section-title"><h2>Timeline</h2></div>
      <div class="timeline">${history.map(h => `<div class="timeline-item"><div class="timeline-dot"></div><div><strong>${fmtDate(h.date)}</strong><div class="detail-body">${esc(h.text)}</div>${h.entryId ? `<a class="mini-link" href="#entry/${h.entryId}">Open session</a>` : ''}</div></div>`).join('')}</div>
    </section>
  </div>`, 'prayers');
};

document.addEventListener('submit', async event => {
  if (event.target?.id !== 'standalonePrayerForm') return;
  event.preventDefault();

  const form = event.target;
  const id = form.dataset.prayerId || 'new';
  const existing = id !== 'new' ? getPrayer(id) : null;
  const memberId = document.getElementById('standalonePrayerMember').value;
  const text = document.getElementById('standalonePrayerText').value.trim();
  const createdDate = document.getElementById('standalonePrayerCreatedDate').value;

  if (!text || !createdDate) {
    toast('Add the prayer request and date');
    return;
  }

  if (!existing) {
    const prayer = {
      id: uid('prayer'),
      memberId,
      memberName: getMemberName(memberId, 'General / group'),
      text,
      status: 'active',
      createdDate,
      createdEntryId: '',
      updates: [],
      answeredDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.prayers.push(prayer);
    await saveState();
    location.hash = `#prayer/${prayer.id}`;
    render();
    toast('Prayer request added');
    return;
  }

  existing.memberId = memberId;
  existing.memberName = getMemberName(memberId, 'General / group');
  existing.text = text;
  existing.createdDate = createdDate;

  const status = document.getElementById('standalonePrayerStatus').value;
  const updateDate = document.getElementById('standalonePrayerUpdateDate').value || todayISO();
  const updateText = document.getElementById('standalonePrayerUpdateText').value.trim();

  if (updateText) {
    existing.updates = existing.updates || [];
    existing.updates.push({
      id: uid('update'),
      date: updateDate,
      entryId: '',
      text: updateText,
      createdAt: new Date().toISOString()
    });
  }

  existing.status = status;
  existing.answeredDate = status === 'answered' ? (existing.answeredDate || updateDate) : '';
  existing.updatedAt = new Date().toISOString();

  await saveState();
  location.hash = `#prayer/${existing.id}`;
  render();
  toast('Prayer request updated');
});
