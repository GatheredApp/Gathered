const STORAGE_KEY = 'smallGroupJournal.v1';

const TRANSLATIONS = {
  NIV: { id: 111, label: 'NIV' },
  ESV: { id: 59, label: 'ESV' },
  NKJV: { id: 114, label: 'NKJV' },
  NLT: { id: 116, label: 'NLT' },
  KJV: { id: 1, label: 'KJV' }
};

const BOOKS = {
  'genesis':'GEN','gen':'GEN','ge':'GEN','gn':'GEN', 'exodus':'EXO','exod':'EXO','exo':'EXO','ex':'EXO',
  'leviticus':'LEV','lev':'LEV','lv':'LEV', 'numbers':'NUM','num':'NUM','nm':'NUM','nu':'NUM',
  'deuteronomy':'DEU','deut':'DEU','dt':'DEU','deu':'DEU', 'joshua':'JOS','josh':'JOS','jos':'JOS',
  'judges':'JDG','judg':'JDG','jdg':'JDG', 'ruth':'RUT','ru':'RUT',
  '1 samuel':'1SA','1samuel':'1SA','1 sam':'1SA','1sam':'1SA','1 sa':'1SA','1sa':'1SA',
  '2 samuel':'2SA','2samuel':'2SA','2 sam':'2SA','2sam':'2SA','2 sa':'2SA','2sa':'2SA',
  '1 kings':'1KI','1kings':'1KI','1 kgs':'1KI','1kgs':'1KI','1 ki':'1KI','1ki':'1KI',
  '2 kings':'2KI','2kings':'2KI','2 kgs':'2KI','2kgs':'2KI','2 ki':'2KI','2ki':'2KI',
  '1 chronicles':'1CH','1chronicles':'1CH','1 chr':'1CH','1chr':'1CH','1 ch':'1CH','1ch':'1CH',
  '2 chronicles':'2CH','2chronicles':'2CH','2 chr':'2CH','2chr':'2CH','2 ch':'2CH','2ch':'2CH',
  'ezra':'EZR','ezr':'EZR', 'nehemiah':'NEH','neh':'NEH', 'esther':'EST','est':'EST',
  'job':'JOB', 'psalms':'PSA','psalm':'PSA','ps':'PSA','psa':'PSA', 'proverbs':'PRO','prov':'PRO','pr':'PRO','pro':'PRO',
  'ecclesiastes':'ECC','eccl':'ECC','ecc':'ECC', 'song of solomon':'SNG','song of songs':'SNG','songs':'SNG','sos':'SNG','song':'SNG',
  'isaiah':'ISA','isa':'ISA','is':'ISA', 'jeremiah':'JER','jer':'JER', 'lamentations':'LAM','lam':'LAM',
  'ezekiel':'EZK','ezek':'EZK','ezk':'EZK', 'daniel':'DAN','dan':'DAN','dn':'DAN', 'hosea':'HOS','hos':'HOS',
  'joel':'JOL','jl':'JOL', 'amos':'AMO','am':'AMO', 'obadiah':'OBA','obad':'OBA','ob':'OBA',
  'jonah':'JON','jon':'JON', 'micah':'MIC','mic':'MIC', 'nahum':'NAM','nah':'NAM','nam':'NAM',
  'habakkuk':'HAB','hab':'HAB', 'zephaniah':'ZEP','zeph':'ZEP','zep':'ZEP', 'haggai':'HAG','hag':'HAG',
  'zechariah':'ZEC','zech':'ZEC','zec':'ZEC', 'malachi':'MAL','mal':'MAL',
  'matthew':'MAT','matt':'MAT','mt':'MAT','mat':'MAT', 'mark':'MRK','mk':'MRK','mrk':'MRK',
  'luke':'LUK','lk':'LUK','luk':'LUK', 'john':'JHN','jn':'JHN','jhn':'JHN', 'acts':'ACT','ac':'ACT','act':'ACT',
  'romans':'ROM','rom':'ROM','ro':'ROM',
  '1 corinthians':'1CO','1corinthians':'1CO','1 cor':'1CO','1cor':'1CO','1 co':'1CO','1co':'1CO',
  '2 corinthians':'2CO','2corinthians':'2CO','2 cor':'2CO','2cor':'2CO','2 co':'2CO','2co':'2CO',
  'galatians':'GAL','gal':'GAL', 'ephesians':'EPH','eph':'EPH', 'philippians':'PHP','phil':'PHP','php':'PHP',
  'colossians':'COL','col':'COL',
  '1 thessalonians':'1TH','1thessalonians':'1TH','1 thess':'1TH','1thess':'1TH','1 th':'1TH','1th':'1TH',
  '2 thessalonians':'2TH','2thessalonians':'2TH','2 thess':'2TH','2thess':'2TH','2 th':'2TH','2th':'2TH',
  '1 timothy':'1TI','1timothy':'1TI','1 tim':'1TI','1tim':'1TI','1 ti':'1TI','1ti':'1TI',
  '2 timothy':'2TI','2timothy':'2TI','2 tim':'2TI','2tim':'2TI','2 ti':'2TI','2ti':'2TI',
  'titus':'TIT','tit':'TIT', 'philemon':'PHM','philem':'PHM','phm':'PHM', 'hebrews':'HEB','heb':'HEB',
  'james':'JAS','jas':'JAS','jm':'JAS',
  '1 peter':'1PE','1peter':'1PE','1 pet':'1PE','1pet':'1PE','1 pe':'1PE','1pe':'1PE',
  '2 peter':'2PE','2peter':'2PE','2 pet':'2PE','2pet':'2PE','2 pe':'2PE','2pe':'2PE',
  '1 john':'1JN','1john':'1JN','1 jn':'1JN','1jn':'1JN', '2 john':'2JN','2john':'2JN','2 jn':'2JN','2jn':'2JN',
  '3 john':'3JN','3john':'3JN','3 jn':'3JN','3jn':'3JN', 'jude':'JUD','jud':'JUD',
  'revelation':'REV','rev':'REV','re':'REV'
};

function uid(prefix='id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function todayISO() { return new Date().toISOString().slice(0,10); }
function fmtDate(v) { if (!v) return ''; const d = new Date(`${v}T12:00:00`); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
function esc(v='') { return String(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function initials(name='') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || '?'; }

function defaultState() {
  return { version:1, group:null, members:[], entries:[], settings:{ translation:'NIV' } };
}
function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaultState(); }
}
let state = loadState();
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function toast(msg) {
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(()=>el.classList.remove('show'),1800);
}

function parseScripture(reference, translation='NIV') {
  const raw = reference.trim().replace(/[–—]/g,'-').replace(/\s+/g,' ');
  if (!raw) return null;
  const match = raw.match(/^(.+?)\s+(\d+)(?::(\d+(?:-\d+)?))?(?:\s*[-,;].*)?$/i);
  if (!match) return null;
  const bookRaw = match[1].toLowerCase().replace(/\./g,'').trim();
  const code = BOOKS[bookRaw];
  if (!code) return null;
  const chapter = match[2]; const verses = match[3];
  const tr = TRANSLATIONS[translation] || TRANSLATIONS.NIV;
  const locator = verses ? `${code}.${chapter}.${verses}.${tr.label}` : `${code}.${chapter}.${tr.label}`;
  return { url:`https://www.bible.com/bible/${tr.id}/${locator}`, code, chapter, verses };
}

function getPrayerItems() {
  return state.entries.flatMap(entry => (entry.prayers || []).map(p => ({...p, entryId:entry.id, entryDate:entry.date, scripture:entry.scripture})))
    .sort((a,b)=> (b.entryDate||'').localeCompare(a.entryDate||''));
}
function getMemberName(id, fallback='General') { return state.members.find(m=>m.id===id)?.name || fallback; }

function shell(content, active='home') {
  const groupName = state.group?.name || 'Small Group Journal';
  return `<div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup"><div class="brand-mark">✦</div><div class="brand-text"><strong>${esc(groupName)}</strong><span>Journal & prayer log</span></div></div>
      <a class="icon-btn" href="#settings" aria-label="Settings">⚙</a>
    </header>
    <main>${content}</main>
    <nav class="bottom-nav">
      ${navItem('home','⌂','Home',active)}
      ${navItem('prayers','♡','Prayers',active)}
      ${navItem('members','♙','Members',active)}
      ${navItem('entries','☷','Sessions',active)}
    </nav>
  </div>`;
}
function navItem(route, icon, label, active) { return `<a class="nav-btn ${active===route?'active':''}" href="#${route}"><span>${icon}</span><span>${label}</span></a>`; }

function renderOnboarding() {
  document.getElementById('app').innerHTML = `<div class="onboarding"><section class="onboarding-panel">
    <div class="brand-mark">✦</div>
    <div class="hero"><div class="eyebrow">Welcome</div><h1>Build your small group journal.</h1><p class="subtle">Set up the group once. Everything is stored privately on this device unless you export a backup.</p></div>
    <form id="onboardingForm" class="card form">
      <div class="field"><label for="groupName">Small group name</label><input class="input" id="groupName" required placeholder="e.g., Thursday Night Small Group" /></div>
      <div class="field"><label>Members</label><small>Add names now. You can add contact details from each member profile later.</small><div id="memberDrafts" class="grid"></div><button type="button" class="btn secondary" id="addDraftMember">＋ Add member</button></div>
      <button class="btn primary block" type="submit">Create Small Group</button>
      <div class="notice">This version is local-first: no account and no cloud database. If you switch devices or clear browser storage, restore from an exported backup.</div>
    </form>
  </section></div>`;
  const drafts = document.getElementById('memberDrafts');
  function addDraft() { const row=document.createElement('div'); row.className='inline'; row.innerHTML=`<input class="input draft-name" placeholder="Member name" /><button type="button" class="icon-btn remove-draft" aria-label="Remove">×</button>`; drafts.appendChild(row); row.querySelector('.remove-draft').onclick=()=>row.remove(); }
  addDraft(); addDraft();
  document.getElementById('addDraftMember').onclick=addDraft;
  document.getElementById('onboardingForm').onsubmit=e=>{
    e.preventDefault();
    const name=document.getElementById('groupName').value.trim(); if(!name) return;
    state.group={ id:uid('group'), name, createdAt:new Date().toISOString() };
    state.members=[...document.querySelectorAll('.draft-name')].map(i=>i.value.trim()).filter(Boolean).map(name=>({id:uid('member'),name,role:'',email:'',phone:'',birthday:'',notes:'',createdAt:new Date().toISOString()}));
    saveState(); location.hash='#home'; render();
  };
}

function homePage() {
  const prayers=getPrayerItems(); const active=prayers.filter(p=>p.status!=='answered'); const recent=state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return shell(`<div class="page">
    <section class="hero"><div class="eyebrow">Small Group</div><h1>${esc(state.group.name)}</h1><p class="subtle">Capture the Word, what stood out, and who your group is praying for.</p></section>
    <a class="fab-card" href="#entry/new"><div><h2>New SG Entry</h2><p>Scripture · journal · prayer requests</p></div><div class="icon">＋</div></a>
    <section class="section"><div class="grid two"><div class="card stat"><strong>${state.members.length}</strong><span>Members</span></div><div class="card stat"><strong>${active.length}</strong><span>Active prayers</span></div></div></section>
    <section class="section"><div class="section-title"><h2>Prayer focus</h2><a class="btn small secondary" href="#prayers">View all</a></div>
      ${active.length ? `<div class="list">${active.slice(0,3).map(prayerListItem).join('')}</div>` : `<div class="empty">No active prayer requests yet.</div>`}
    </section>
    <section class="section"><div class="section-title"><h2>Recent sessions</h2><a class="btn small secondary" href="#entries">View all</a></div>
      ${recent.length ? `<div class="list">${recent.map(entryListItem).join('')}</div>` : `<div class="empty">Your first small group entry will appear here.</div>`}
    </section>
  </div>`,'home');
}
function entryListItem(e) { return `<a class="list-item clickable" href="#entry/${e.id}" style="text-decoration:none"><div class="list-main"><strong>${esc(e.scripture || 'Small Group Session')}</strong><div class="meta">${fmtDate(e.date)} · ${(e.prayers||[]).length} prayer request${(e.prayers||[]).length===1?'':'s'}</div></div><span>›</span></a>`; }
function prayerListItem(p) { return `<div class="list-item"><div class="list-main"><strong>${esc(p.memberName || getMemberName(p.memberId))}</strong><div class="meta">${esc(p.text)}</div></div><span class="pill ${p.status==='answered'?'answered':''}">${p.status==='answered'?'Answered':'Active'}</span></div>`; }

function entriesPage() {
  const entries=state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date));
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">History</div><h1>Small group sessions</h1></div><a class="btn primary small" href="#entry/new">＋ New</a></div>
    ${entries.length?`<div class="list">${entries.map(entryListItem).join('')}</div>`:`<div class="empty">No sessions logged yet.</div>`}</div>`,'entries');
}

function entryEditor(id) {
  const existing=id && id!=='new' ? state.entries.find(e=>e.id===id) : null;
  const entry=existing || { id:uid('entry'), date:todayISO(), scripture:'', translation:state.settings.translation||'NIV', journal:'', prayers:[] };
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${existing?'Edit':'New'} Session</div><h1>${existing?'Update SG Entry':'Create SG Entry'}</h1></div>${existing?`<button class="btn small danger" id="deleteEntry">Delete</button>`:''}</div>
    <form class="form" id="entryForm">
      <div class="card form flat">
        <div class="field"><label for="entryDate">Session date</label><input class="input" type="date" id="entryDate" value="${esc(entry.date)}" required></div>
        <div class="field"><label for="scripture">Scripture</label><input class="input" id="scripture" value="${esc(entry.scripture)}" placeholder="e.g., John 3:16-18" required><small>Enter one primary passage. A YouVersion link is created automatically.</small></div>
        <div class="field"><label for="translation">Bible translation</label><select class="select" id="translation">${Object.keys(TRANSLATIONS).map(k=>`<option ${entry.translation===k?'selected':''}>${k}</option>`).join('')}</select></div>
        <div id="scripturePreview"></div>
      </div>
      <div class="card form flat"><div class="field"><label for="journal">Session journal</label><textarea class="textarea" id="journal" rows="9" placeholder="What stood out? What did the group discuss? What do you want to remember?">${esc(entry.journal)}</textarea></div></div>
      <div class="card form flat"><div class="card-header"><div><h2>Prayer requests</h2><div class="subtle" style="font-size:12px">Add requests from members or the group generally.</div></div><button class="btn small secondary" type="button" id="addPrayer">＋ Add</button></div><div id="prayerRows" class="grid"></div></div>
      <div class="form-actions"><a href="#${existing?'entry/'+existing.id:'home'}" class="btn ghost">Cancel</a><button class="btn primary" type="submit">Save Entry</button></div>
    </form></div>`,'entries');
}

function bindEntryEditor(id) {
  const existing=id && id!=='new' ? state.entries.find(e=>e.id===id) : null;
  const seed=(existing?.prayers||[]).map(p=>({...p}));
  const rows=document.getElementById('prayerRows');
  function memberOptions(memberId='') { return `<option value="">General / group</option>${state.members.map(m=>`<option value="${m.id}" ${m.id===memberId?'selected':''}>${esc(m.name)}</option>`).join('')}`; }
  function addPrayer(p={id:uid('prayer'),memberId:'',memberName:'',text:'',status:'active'}) {
    const row=document.createElement('div'); row.className='prayer-row'; row.dataset.id=p.id;
    row.innerHTML=`<div class="row-top"><select class="select prayer-member">${memberOptions(p.memberId)}</select><button type="button" class="icon-btn prayer-remove" aria-label="Remove prayer">×</button></div><textarea class="textarea prayer-text" rows="3" placeholder="Prayer request">${esc(p.text)}</textarea><select class="select prayer-status"><option value="active" ${p.status!=='answered'?'selected':''}>Active</option><option value="answered" ${p.status==='answered'?'selected':''}>Answered</option></select>`;
    rows.appendChild(row); row.querySelector('.prayer-remove').onclick=()=>row.remove();
  }
  seed.forEach(addPrayer); document.getElementById('addPrayer').onclick=()=>addPrayer();
  const scripture=document.getElementById('scripture'), translation=document.getElementById('translation'), preview=document.getElementById('scripturePreview');
  function updatePreview(){ const p=parseScripture(scripture.value,translation.value); preview.innerHTML=p?`<a class="scripture-link" href="${p.url}" target="_blank" rel="noopener">Open in YouVersion ↗</a>`:`<div class="subtle" style="font-size:12px">Use a format like “Romans 8:28” or “Psalm 23”.</div>`; }
  scripture.addEventListener('input',updatePreview); translation.addEventListener('change',updatePreview); updatePreview();
  document.getElementById('entryForm').onsubmit=e=>{
    e.preventDefault();
    const scriptureVal=scripture.value.trim(); if(!parseScripture(scriptureVal,translation.value)){ toast('Check the Scripture format'); scripture.focus(); return; }
    const prayers=[...rows.querySelectorAll('.prayer-row')].map(row=>{ const memberId=row.querySelector('.prayer-member').value; return {id:row.dataset.id||uid('prayer'),memberId,memberName:getMemberName(memberId,'General / group'),text:row.querySelector('.prayer-text').value.trim(),status:row.querySelector('.prayer-status').value}; }).filter(p=>p.text);
    const saved={ id:existing?.id || uid('entry'), date:document.getElementById('entryDate').value, scripture:scriptureVal, translation:translation.value, journal:document.getElementById('journal').value.trim(), prayers, updatedAt:new Date().toISOString(), createdAt:existing?.createdAt||new Date().toISOString() };
    if(existing) state.entries=state.entries.map(x=>x.id===existing.id?saved:x); else state.entries.push(saved);
    state.settings.translation=translation.value; saveState(); toast('Entry saved'); location.hash=`#entry/${saved.id}`; render();
  };
  if(existing) document.getElementById('deleteEntry').onclick=()=>{ if(confirm('Delete this small group entry?')){ state.entries=state.entries.filter(x=>x.id!==existing.id); saveState(); location.hash='#entries'; render(); } };
}

function entryDetail(id) {
  const e=state.entries.find(x=>x.id===id); if(!e) return entriesPage(); const parsed=parseScripture(e.scripture,e.translation);
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${fmtDate(e.date)}</div><h1>${esc(e.scripture)}</h1></div><a class="btn small secondary" href="#entry/${e.id}/edit">Edit</a></div>
    ${parsed?`<a class="scripture-link" href="${parsed.url}" target="_blank" rel="noopener">Open ${esc(e.scripture)} in YouVersion ↗</a>`:''}
    <section class="section"><div class="card"><div class="kicker">Session journal</div><div class="detail-body">${e.journal?esc(e.journal):'<span class="subtle">No journal notes.</span>'}</div></div></section>
    <section class="section"><div class="section-title"><h2>Prayer requests</h2><span class="pill">${(e.prayers||[]).length}</span></div>
      ${(e.prayers||[]).length?`<div class="list">${e.prayers.map(p=>`<div class="list-item"><div class="list-main"><strong>${esc(p.memberName||getMemberName(p.memberId))}</strong><div class="meta">${esc(p.text)}</div></div><button class="btn small ${p.status==='answered'?'secondary':'ghost'} prayer-toggle" data-prayer="${p.id}">${p.status==='answered'?'✓ Answered':'Mark answered'}</button></div>`).join('')}</div>`:`<div class="empty">No prayer requests logged for this session.</div>`}
    </section></div>`,'entries');
}
function bindEntryDetail(id) { document.querySelectorAll('.prayer-toggle').forEach(btn=>btn.onclick=()=>{ const entry=state.entries.find(e=>e.id===id); const p=entry?.prayers.find(x=>x.id===btn.dataset.prayer); if(p){ p.status=p.status==='answered'?'active':'answered'; saveState(); render(); toast(p.status==='answered'?'Marked answered':'Marked active'); } }); }

function prayersPage() {
  const all=getPrayerItems(); const active=all.filter(p=>p.status!=='answered'), answered=all.filter(p=>p.status==='answered');
  return shell(`<div class="page"><div class="hero"><div class="eyebrow">Prayer Log</div><h1>Prayer requests</h1><p class="subtle">Keep current needs visible and preserve answered prayers as part of the group’s story.</p></div>
    <section><div class="section-title"><h2>Active</h2><span class="pill">${active.length}</span></div>${active.length?`<div class="list">${active.map(p=>prayerCard(p)).join('')}</div>`:`<div class="empty">No active prayer requests.</div>`}</section>
    <section class="section"><div class="section-title"><h2>Answered</h2><span class="pill answered">${answered.length}</span></div>${answered.length?`<div class="list">${answered.map(p=>prayerCard(p)).join('')}</div>`:`<div class="empty">Answered prayers will collect here.</div>`}</section>
  </div>`,'prayers');
}
function prayerCard(p){ return `<div class="list-item"><div class="list-main"><strong>${esc(p.memberName||getMemberName(p.memberId))}</strong><div class="meta">${esc(p.text)} · ${fmtDate(p.entryDate)}</div></div><a class="btn small ghost" href="#entry/${p.entryId}">Session</a></div>`; }

function membersPage() {
  const members=state.members.slice().sort((a,b)=>a.name.localeCompare(b.name));
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">People</div><h1>Members</h1></div><a class="btn primary small" href="#member/new">＋ Add</a></div>
    ${members.length?`<div class="list">${members.map(m=>`<a href="#member/${m.id}" class="list-item clickable" style="text-decoration:none"><div class="member-line"><div class="member-avatar">${esc(initials(m.name))}</div><div class="list-main"><strong>${esc(m.name)}</strong><div class="meta">${esc(m.role||m.email||m.phone||'Member profile')}</div></div></div><span>›</span></a>`).join('')}</div>`:`<div class="empty">No members yet.</div>`}</div>`,'members');
}

function memberEditor(id) {
  const existing=id && id!=='new'?state.members.find(m=>m.id===id):null; const m=existing||{name:'',role:'',email:'',phone:'',birthday:'',notes:''};
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${existing?'Edit':'New'} Member</div><h1>${existing?esc(m.name):'Add member'}</h1></div>${existing?`<button class="btn small danger" id="deleteMember">Delete</button>`:''}</div>
    <form id="memberForm" class="card form flat">
      <div class="field"><label>Name</label><input class="input" id="memberName" value="${esc(m.name)}" required></div>
      <div class="field"><label>Role / relationship</label><input class="input" id="memberRole" value="${esc(m.role)}" placeholder="e.g., Host, Leader, Member"></div>
      <div class="field"><label>Email</label><input class="input" id="memberEmail" type="email" value="${esc(m.email)}" placeholder="name@example.com"></div>
      <div class="field"><label>Phone</label><input class="input" id="memberPhone" type="tel" value="${esc(m.phone)}" placeholder="(555) 555-5555"></div>
      <div class="field"><label>Birthday</label><input class="input" id="memberBirthday" type="date" value="${esc(m.birthday)}"></div>
      <div class="field"><label>Notes</label><textarea class="textarea" id="memberNotes" rows="5" placeholder="Family details, follow-up notes, or anything helpful to remember.">${esc(m.notes)}</textarea></div>
      <div class="form-actions"><a class="btn ghost" href="#${existing?'member/'+existing.id:'members'}">Cancel</a><button class="btn primary" type="submit">Save Member</button></div>
    </form></div>`,'members');
}
function bindMemberEditor(id) {
  const existing=id && id!=='new'?state.members.find(m=>m.id===id):null;
  document.getElementById('memberForm').onsubmit=e=>{e.preventDefault(); const m={id:existing?.id||uid('member'),name:document.getElementById('memberName').value.trim(),role:document.getElementById('memberRole').value.trim(),email:document.getElementById('memberEmail').value.trim(),phone:document.getElementById('memberPhone').value.trim(),birthday:document.getElementById('memberBirthday').value,notes:document.getElementById('memberNotes').value.trim(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}; if(existing) state.members=state.members.map(x=>x.id===existing.id?m:x); else state.members.push(m); saveState(); location.hash=`#member/${m.id}`; render(); toast('Member saved');};
  if(existing) document.getElementById('deleteMember').onclick=()=>{if(confirm(`Delete ${existing.name}? Existing prayer history will retain the member's name.`)){ state.members=state.members.filter(x=>x.id!==existing.id); saveState(); location.hash='#members'; render(); }};
}
function memberDetail(id) {
  const m=state.members.find(x=>x.id===id); if(!m) return membersPage(); const prayers=getPrayerItems().filter(p=>p.memberId===m.id); const active=prayers.filter(p=>p.status!=='answered');
  return shell(`<div class="page"><div class="section-title"><div class="member-line"><div class="member-avatar">${esc(initials(m.name))}</div><div><div class="eyebrow">Member</div><h1 style="margin-bottom:0">${esc(m.name)}</h1></div></div><a class="btn small secondary" href="#member/${m.id}/edit">Edit</a></div>
    <div class="card flat"><div class="kicker">${esc(m.role||'Small group member')}</div><div class="contact-links">${m.phone?`<a class="btn small ghost" href="tel:${esc(m.phone)}">Call</a><a class="btn small ghost" href="sms:${esc(m.phone)}">Text</a>`:''}${m.email?`<a class="btn small ghost" href="mailto:${esc(m.email)}">Email</a>`:''}</div>${m.birthday?`<p><strong>Birthday:</strong> ${fmtDate(m.birthday)}</p>`:''}${m.notes?`<div class="divider"></div><div class="detail-body">${esc(m.notes)}</div>`:''}</div>
    <section class="section"><div class="section-title"><h2>Active prayers</h2><span class="pill">${active.length}</span></div>${active.length?`<div class="list">${active.map(prayerCard).join('')}</div>`:`<div class="empty">No active requests for ${esc(m.name)}.</div>`}</section>
  </div>`,'members');
}

function settingsPage() {
  return shell(`<div class="page"><div class="hero"><div class="eyebrow">App</div><h1>Settings</h1></div>
    <div class="card flat">
      <div class="settings-row"><div><strong>Small group</strong><div class="subtle" style="font-size:12px">${esc(state.group.name)}</div></div><button class="btn small ghost" id="renameGroup">Rename</button></div>
      <div class="settings-row"><div><strong>Default translation</strong><div class="subtle" style="font-size:12px">Used for new YouVersion links.</div></div><select class="select" id="defaultTranslation" style="width:auto">${Object.keys(TRANSLATIONS).map(k=>`<option ${state.settings.translation===k?'selected':''}>${k}</option>`).join('')}</select></div>
      <div class="settings-row"><div><strong>Export backup</strong><div class="subtle" style="font-size:12px">Download all group data as JSON.</div></div><button class="btn small secondary" id="exportData">Export</button></div>
      <div class="settings-row"><div><strong>Import backup</strong><div class="subtle" style="font-size:12px">Replace this device's data from a backup.</div></div><label class="btn small ghost" for="importData">Import</label><input class="file-input" type="file" id="importData" accept="application/json,.json"></div>
      <div class="settings-row"><div><strong>Reset app</strong><div class="subtle" style="font-size:12px">Delete all local data and start over.</div></div><button class="btn small danger" id="resetApp">Reset</button></div>
    </div>
    <div class="notice section">Prayer requests can contain sensitive personal information. This build intentionally keeps data on-device; use exports carefully and store backups somewhere you trust.</div>
  </div>`,'');
}
function bindSettings() {
  document.getElementById('defaultTranslation').onchange=e=>{state.settings.translation=e.target.value;saveState();toast('Default updated');};
  document.getElementById('renameGroup').onclick=()=>{const n=prompt('Small group name',state.group.name);if(n?.trim()){state.group.name=n.trim();saveState();render();}};
  document.getElementById('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`small-group-journal-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);};
  document.getElementById('importData').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data.group||!Array.isArray(data.members)||!Array.isArray(data.entries))throw new Error();if(confirm('Import this backup and replace current data?')){state={...defaultState(),...data};saveState();location.hash='#home';render();}}catch{alert('That file does not look like a valid Small Group Journal backup.');}};
  document.getElementById('resetApp').onclick=()=>{if(confirm('Delete ALL journal entries, prayer requests, members, and group settings from this device?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();location.hash='';render();}};
}

function render() {
  if(!state.group){ renderOnboarding(); return; }
  const route=(location.hash||'#home').slice(1); const parts=route.split('/');
  if(parts[0]==='home'){ document.getElementById('app').innerHTML=homePage(); }
  else if(parts[0]==='entries'){ document.getElementById('app').innerHTML=entriesPage(); }
  else if(parts[0]==='prayers'){ document.getElementById('app').innerHTML=prayersPage(); }
  else if(parts[0]==='members'){ document.getElementById('app').innerHTML=membersPage(); }
  else if(parts[0]==='settings'){ document.getElementById('app').innerHTML=settingsPage(); bindSettings(); }
  else if(parts[0]==='entry'){
    if(parts[1]==='new' || parts[2]==='edit'){ const id=parts[1]==='new'?'new':parts[1]; document.getElementById('app').innerHTML=entryEditor(id); bindEntryEditor(id); }
    else { document.getElementById('app').innerHTML=entryDetail(parts[1]); bindEntryDetail(parts[1]); }
  }
  else if(parts[0]==='member'){
    if(parts[1]==='new' || parts[2]==='edit'){ const id=parts[1]==='new'?'new':parts[1]; document.getElementById('app').innerHTML=memberEditor(id); bindMemberEditor(id); }
    else document.getElementById('app').innerHTML=memberDetail(parts[1]);
  }
  else { location.hash='#home'; }
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',render);
window.addEventListener('DOMContentLoaded',()=>{
  render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
});
