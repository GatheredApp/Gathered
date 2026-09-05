// Standalone prayer request flows for Gathered.
// Keeps standalone requests in the same state.prayers collection used by session prayers.

// Ensure Gathered's in-app updater also verifies this module.
if (Array.isArray(APP_ASSETS) && !APP_ASSETS.includes('standalone-prayers.js')) APP_ASSETS.push('standalone-prayers.js');

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .prayer-update-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .prayer-update-actions .btn{padding:6px 10px}
    .prayer-update-stamp{font-size:12px;color:var(--muted,#68756f);margin-bottom:5px}
    .prayer-update-editor{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:20px;background:rgba(14,27,22,.58);backdrop-filter:blur(5px)}
    .prayer-update-editor-card{width:min(460px,100%);background:var(--surface,#fff);border:1px solid var(--line,#dce5e0);border-radius:22px;padding:18px;box-shadow:0 24px 70px rgba(12,30,23,.28)}
  `;
  document.head.appendChild(style);
})();

function fmtUpdateTimestamp(update) {
  const createdAt = update?.createdAt;
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
      });
    }
  }
  return fmtDate(update?.date);
}

function updateSortKey(update) {
  if (update?.createdAt) {
    const t = new Date(update.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (update?.date) {
    const t = new Date(`${update.date}T12:00:00`).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function renderPrayerUpdate(p, update) {
  return `<div class="timeline-item" data-prayer-update-id="${esc(update.id || '')}">
    <div class="timeline-dot"></div>
    <div>
      <div class="prayer-update-stamp">${esc(fmtUpdateTimestamp(update))}</div>
      <div class="detail-body">${esc(update.text)}</div>
      ${update.entryId ? `<a class="mini-link" href="#entry/${update.entryId}">Open session</a>` : ''}
      <div class="prayer-update-actions">
        <button class="btn small ghost" type="button" data-edit-prayer-update="${esc(update.id || '')}" data-prayer-id="${esc(p.id)}">Edit</button>
        <button class="btn small danger" type="button" data-delete-prayer-update="${esc(update.id || '')}" data-prayer-id="${esc(p.id)}">Delete</button>
      </div>
    </div>
  </div>`;
}

function openPrayerUpdateEditor(prayerId, updateId) {
  const prayer = getPrayer(prayerId);
  const update = prayer?.updates?.find(u => u.id === updateId);
  if (!prayer || !update) return;

  const overlay = document.createElement('div');
  overlay.className = 'prayer-update-editor';
  overlay.innerHTML = `<form class="prayer-update-editor-card form" id="prayerUpdateEditForm">
    <div class="card-header">
      <div><div class="eyebrow">Prayer update</div><h2>Edit update</h2></div>
      <button class="icon-btn" type="button" data-close-prayer-update-editor aria-label="Close">×</button>
    </div>
    <div class="field">
      <label for="editPrayerUpdateDate">Update date</label>
      <input class="input" type="date" id="editPrayerUpdateDate" value="${esc(update.date || todayISO())}" required>
    </div>
    <div class="field">
      <label for="editPrayerUpdateText">Update</label>
      <textarea class="textarea" id="editPrayerUpdateText" rows="5" required>${esc(update.text)}</textarea>
    </div>
    <div class="meta">Originally recorded ${esc(fmtUpdateTimestamp(update))}</div>
    <div class="form-actions">
      <button class="btn ghost" type="button" data-close-prayer-update-editor>Cancel</button>
      <button class="btn primary" type="submit">Save Changes</button>
    </div>
  </form>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelectorAll('[data-close-prayer-update-editor]').forEach(btn => btn.addEventListener('click', close));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#prayerUpdateEditForm').addEventListener('submit', async e => {
    e.preventDefault();
    const text = overlay.querySelector('#editPrayerUpdateText').value.trim();
    const date = overlay.querySelector('#editPrayerUpdateDate').value;
    if (!text || !date) return;
    update.text = text;
    update.date = date;
    update.updatedAt = new Date().toISOString();
    prayer.updatedAt = new Date().toISOString();
    await saveState();
    close();
    render();
    toast('Prayer update saved');
  });
  overlay.querySelector('#editPrayerUpdateText').focus();
}

async function deletePrayerUpdate(prayerId, updateId) {
  const prayer = getPrayer(prayerId);
  const update = prayer?.updates?.find(u => u.id === updateId);
  if (!prayer || !update) return;
  if (!confirm('Delete this prayer update? This cannot be undone.')) return;
  prayer.updates = (prayer.updates || []).filter(u => u.id !== updateId);
  prayer.updatedAt = new Date().toISOString();
  await saveState();
  render();
  toast('Prayer update deleted');
}

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
    id: 'new', memberId: '', text: '', status: 'active', createdDate: todayISO(), answeredDate: ''
  };

  return shell(`<div class="page">
    <div class="section-title"><div><div class="eyebrow">${existing ? 'Track prayer' : 'New prayer request'}</div><h1>${existing ? esc(prayer.memberName || getMemberName(prayer.memberId, 'General / group')) : 'Add prayer request'}</h1></div></div>
    <form id="standalonePrayerForm" data-prayer-id="${esc(prayer.id)}" class="form">
      <div class="card form flat">
        <div class="field"><label for="standalonePrayerMember">Person</label><select class="select" id="standalonePrayerMember">${memberOptions(prayer.memberId)}</select></div>
        <div class="field"><label for="standalonePrayerText">Prayer request</label><textarea class="textarea" id="standalonePrayerText" rows="5" placeholder="What would you like to remember and pray for?" required>${esc(prayer.text)}</textarea></div>
        <div class="field"><label for="standalonePrayerCreatedDate">Started</label><input class="input" type="date" id="standalonePrayerCreatedDate" value="${esc(prayer.createdDate || todayISO())}" required></div>
        ${existing ? `<div class="field"><label for="standalonePrayerStatus">Status</label><select class="select" id="standalonePrayerStatus"><option value="active" ${prayer.status !== 'answered' ? 'selected' : ''}>Active</option><option value="answered" ${prayer.status === 'answered' ? 'selected' : ''}>Answered</option></select></div>` : ''}
      </div>
      ${existing ? `<div class="card form flat">
        <div class="card-header"><div><h2>Add an update</h2><div class="subtle mini">Optional. Add progress without tying it to a small group session.</div></div></div>
        <div class="field"><label for="standalonePrayerUpdateDate">Update date</label><input class="input" type="date" id="standalonePrayerUpdateDate" value="${todayISO()}"></div>
        <div class="field"><label for="standalonePrayerUpdateText">Update</label><textarea class="textarea" id="standalonePrayerUpdateText" rows="4" placeholder="What changed? How can you continue praying?"></textarea></div>
      </div>` : ''}
      <div class="form-actions"><a class="btn ghost" href="${existing ? `#prayer/${existing.id}` : '#prayers'}">Cancel</a><button class="btn primary" type="submit">${existing ? 'Save Update' : 'Add Prayer Request'}</button></div>
    </form>
  </div>`, 'prayers');
}

prayerDetail = function (id) {
  if (id === 'new') return standalonePrayerEditor('new');
  const p = getPrayer(id);
  if (!p) return prayersPage();
  const routeParts = (location.hash || '').slice(1).split('/');
  if (routeParts[2] === 'edit') return standalonePrayerEditor(id);

  const updates = [...(p.updates || [])].sort((a, b) => updateSortKey(b) - updateSortKey(a));
  return shell(`<div class="page">
    <div class="section-title">
      <div><div class="eyebrow">Prayer history</div><h1>${esc(p.memberName || getMemberName(p.memberId, 'General / group'))}</h1></div>
      <div class="inline"><span class="pill ${p.status === 'answered' ? 'answered' : ''}">${p.status === 'answered' ? 'Answered' : 'Active'}</span><a class="btn small secondary" href="#prayer/${p.id}/edit">Update</a></div>
    </div>
    <div class="card flat"><div class="detail-body"><strong>${esc(p.text)}</strong></div><div class="meta">Started ${fmtDate(p.createdDate)}${p.answeredDate ? ` · Answered ${fmtDate(p.answeredDate)}` : ''}</div></div>
    <section class="section">
      <div class="section-title"><h2>Timeline</h2></div>
      <div class="timeline">
        ${updates.map(u => renderPrayerUpdate(p, u)).join('')}
        <div class="timeline-item"><div class="timeline-dot"></div><div><div class="prayer-update-stamp">${esc(p.createdAt ? new Date(p.createdAt).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : fmtDate(p.createdDate))}</div><div class="detail-body">Prayer request created</div>${p.createdEntryId ? `<a class="mini-link" href="#entry/${p.createdEntryId}">Open session</a>` : ''}</div></div>
      </div>
    </section>
  </div>`, 'prayers');
};

document.addEventListener('click', event => {
  const edit = event.target.closest?.('[data-edit-prayer-update]');
  if (edit) {
    event.preventDefault();
    openPrayerUpdateEditor(edit.dataset.prayerId, edit.dataset.editPrayerUpdate);
    return;
  }
  const del = event.target.closest?.('[data-delete-prayer-update]');
  if (del) {
    event.preventDefault();
    deletePrayerUpdate(del.dataset.prayerId, del.dataset.deletePrayerUpdate);
  }
});

document.addEventListener('submit', async event => {
  if (event.target?.id !== 'standalonePrayerForm') return;
  event.preventDefault();

  const form = event.target;
  const id = form.dataset.prayerId || 'new';
  const existing = id !== 'new' ? getPrayer(id) : null;
  const memberId = document.getElementById('standalonePrayerMember').value;
  const text = document.getElementById('standalonePrayerText').value.trim();
  const createdDate = document.getElementById('standalonePrayerCreatedDate').value;

  if (!text || !createdDate) { toast('Add the prayer request and date'); return; }

  if (!existing) {
    const prayer = {
      id: uid('prayer'), memberId, memberName: getMemberName(memberId, 'General / group'), text,
      status: 'active', createdDate, createdEntryId: '', updates: [], answeredDate: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
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
      id: uid('update'), date: updateDate, entryId: '', text: updateText,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
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
