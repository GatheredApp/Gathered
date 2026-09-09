const LEGACY_STORAGE_KEY = 'smallGroupJournal.v1';
const DB_NAME = 'GatheredDB';
const DB_VERSION = 2;
const STATE_STORE = 'state';
const MEDIA_STORE = 'diaryMedia';
const STATE_KEY = 'appState';
const BACKUP_REMINDER_DAYS = 30;
const APP_VERSION = '1.14.1';
const APP_ASSETS = ['./', 'index.html', 'styles.css', 'enhancements.css', 'diary.css', 'modal-controller.js', 'public-config.js', 'markdown.js', 'app.js', 'diary.js', 'scripture-prompt.js', 'message-prompt.js', 'tour.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

const TRANSLATIONS = {
  NIV: { id: 111, label: 'NIV' },
  ESV: { id: 59, label: 'ESV' },
  NKJV: { id: 114, label: 'NKJV' },
  NLT: { id: 116, label: 'NLT' },
  KJV: { id: 1, label: 'KJV' }
};
const SCRIPTURE_PROXY_ENDPOINT = '/api/scripture';
const KJV_PUBLIC_DOMAIN_API = 'https://bible-api.com/';

const BOOKS = {
  'genesis':'GEN','gen':'GEN','ge':'GEN','gn':'GEN','exodus':'EXO','exod':'EXO','exo':'EXO','ex':'EXO',
  'leviticus':'LEV','lev':'LEV','lv':'LEV','numbers':'NUM','num':'NUM','nm':'NUM','nu':'NUM',
  'deuteronomy':'DEU','deut':'DEU','dt':'DEU','deu':'DEU','joshua':'JOS','josh':'JOS','jos':'JOS',
  'judges':'JDG','judg':'JDG','jdg':'JDG','ruth':'RUT','ru':'RUT',
  '1 samuel':'1SA','1samuel':'1SA','1 sam':'1SA','1sam':'1SA','1 sa':'1SA','1sa':'1SA',
  '2 samuel':'2SA','2samuel':'2SA','2 sam':'2SA','2sam':'2SA','2 sa':'2SA','2sa':'2SA',
  '1 kings':'1KI','1kings':'1KI','1 kgs':'1KI','1kgs':'1KI','1 ki':'1KI','1ki':'1KI',
  '2 kings':'2KI','2kings':'2KI','2 kgs':'2KI','2kgs':'2KI','2 ki':'2KI','2ki':'2KI',
  '1 chronicles':'1CH','1chronicles':'1CH','1 chr':'1CH','1chr':'1CH','1 ch':'1CH','1ch':'1CH',
  '2 chronicles':'2CH','2chronicles':'2CH','2 chr':'2CH','2chr':'2CH','2 ch':'2CH','2ch':'2CH',
  'ezra':'EZR','ezr':'EZR','nehemiah':'NEH','neh':'NEH','esther':'EST','est':'EST','job':'JOB',
  'psalms':'PSA','psalm':'PSA','ps':'PSA','psa':'PSA','proverbs':'PRO','prov':'PRO','pr':'PRO','pro':'PRO',
  'ecclesiastes':'ECC','eccl':'ECC','ecc':'ECC','song of solomon':'SNG','song of songs':'SNG','songs':'SNG','sos':'SNG','song':'SNG',
  'isaiah':'ISA','isa':'ISA','is':'ISA','jeremiah':'JER','jer':'JER','lamentations':'LAM','lam':'LAM',
  'ezekiel':'EZK','ezek':'EZK','ezk':'EZK','daniel':'DAN','dan':'DAN','dn':'DAN','hosea':'HOS','hos':'HOS',
  'joel':'JOL','jl':'JOL','amos':'AMO','am':'AMO','obadiah':'OBA','obad':'OBA','ob':'OBA','jonah':'JON','jon':'JON',
  'micah':'MIC','mic':'MIC','nahum':'NAM','nah':'NAM','nam':'NAM','habakkuk':'HAB','hab':'HAB',
  'zephaniah':'ZEP','zeph':'ZEP','zep':'ZEP','haggai':'HAG','hag':'HAG','zechariah':'ZEC','zech':'ZEC','zec':'ZEC',
  'malachi':'MAL','mal':'MAL','matthew':'MAT','matt':'MAT','mt':'MAT','mat':'MAT','mark':'MRK','mk':'MRK','mrk':'MRK',
  'luke':'LUK','lk':'LUK','luk':'LUK','john':'JHN','jn':'JHN','jhn':'JHN','acts':'ACT','ac':'ACT','act':'ACT','romans':'ROM','rom':'ROM','ro':'ROM',
  '1 corinthians':'1CO','1corinthians':'1CO','1 cor':'1CO','1cor':'1CO','1 co':'1CO','1co':'1CO',
  '2 corinthians':'2CO','2corinthians':'2CO','2 cor':'2CO','2cor':'2CO','2 co':'2CO','2co':'2CO',
  'galatians':'GAL','gal':'GAL','ephesians':'EPH','eph':'EPH','philippians':'PHP','phil':'PHP','php':'PHP','colossians':'COL','col':'COL',
  '1 thessalonians':'1TH','1thessalonians':'1TH','1 thess':'1TH','1thess':'1TH','1 th':'1TH','1th':'1TH',
  '2 thessalonians':'2TH','2thessalonians':'2TH','2 thess':'2TH','2thess':'2TH','2 th':'2TH','2th':'2TH',
  '1 timothy':'1TI','1timothy':'1TI','1 tim':'1TI','1tim':'1TI','1 ti':'1TI','1ti':'1TI',
  '2 timothy':'2TI','2timothy':'2TI','2 tim':'2TI','2tim':'2TI','2 ti':'2TI','2ti':'2TI',
  'titus':'TIT','tit':'TIT','philemon':'PHM','philem':'PHM','phm':'PHM','hebrews':'HEB','heb':'HEB','james':'JAS','jas':'JAS','jm':'JAS',
  '1 peter':'1PE','1peter':'1PE','1 pet':'1PE','1pet':'1PE','1 pe':'1PE','1pe':'1PE',
  '2 peter':'2PE','2peter':'2PE','2 pet':'2PE','2pet':'2PE','2 pe':'2PE','2pe':'2PE',
  '1 john':'1JN','1john':'1JN','1 jn':'1JN','1jn':'1JN','2 john':'2JN','2john':'2JN','2 jn':'2JN','2jn':'2JN',
  '3 john':'3JN','3john':'3JN','3 jn':'3JN','3jn':'3JN','jude':'JUD','jud':'JUD','revelation':'REV','rev':'REV','re':'REV'
};

function uid(prefix='id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDate(v) { if (!v) return ''; const d = new Date(`${v}T12:00:00`); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
function esc(v='') { return String(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function initials(name='') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || '?'; }
function daysSince(iso) { if (!iso) return Infinity; return Math.floor((Date.now()-new Date(iso).getTime())/86400000); }

function defaultState() {
  return { version:5, group:null, members:[], entries:[], prayers:[], followUps:[], diaryEntries:[], settings:{ translation:'NIV', youVersionApiKey:'', lastBackupAt:null } };
}

function migrateState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  if (raw.version >= 2 && Array.isArray(raw.prayers) && Array.isArray(raw.followUps)) {
    return { ...base, ...raw, version:5, diaryEntries:Array.isArray(raw.diaryEntries)?raw.diaryEntries:[], entries:(Array.isArray(raw.entries)?raw.entries:[]).map(e=>({...e,sessionType:e.sessionType||'small-group',status:e.status||'completed'})), settings:{...base.settings,...(raw.settings||{})} };
  }
  const migrated = { ...base, group:raw.group||null, members:Array.isArray(raw.members)?raw.members:[], settings:{...base.settings,...(raw.settings||{})} };
  for (const oldEntry of Array.isArray(raw.entries)?raw.entries:[]) {
    const prayerIds=[];
    for (const p of Array.isArray(oldEntry.prayers)?oldEntry.prayers:[]) {
      const prayerId=p.id||uid('prayer');
      prayerIds.push(prayerId);
      migrated.prayers.push({
        id:prayerId, memberId:p.memberId||'', memberName:p.memberName||getMemberNameFrom(migrated.members,p.memberId,'General / group'),
        text:p.text||'', status:p.status==='answered'?'answered':'active', createdDate:oldEntry.date||todayISO(), createdEntryId:oldEntry.id,
        updates:[], answeredDate:p.status==='answered'?(oldEntry.date||todayISO()):'', createdAt:oldEntry.createdAt||new Date().toISOString(), updatedAt:oldEntry.updatedAt||new Date().toISOString()
      });
    }
    migrated.entries.push({ ...oldEntry, prayers:undefined, prayerIds, followUpIds:[], sessionType:oldEntry.sessionType||'small-group', status:oldEntry.status||'completed' });
  }
  return migrated;
}

function openDB() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE); if(!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function dbGet(key) { const db=await openDB(); return new Promise((resolve,reject)=>{ const tx=db.transaction(STATE_STORE,'readonly'); const req=tx.objectStore(STATE_STORE).get(key); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
async function dbPut(key,value) { const db=await openDB(); return new Promise((resolve,reject)=>{ const tx=db.transaction(STATE_STORE,'readwrite'); tx.objectStore(STATE_STORE).put(value,key); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); }); }
async function dbDelete(key) { const db=await openDB(); return new Promise((resolve,reject)=>{ const tx=db.transaction(STATE_STORE,'readwrite'); tx.objectStore(STATE_STORE).delete(key); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); }); }

let state=defaultState();
async function loadState() {
  // Replaced at startup by crypto.js. Keeping this safe default prevents a
  // future loading-order mistake from writing user content in plaintext.
  return defaultState();
}
async function saveState() { throw new Error('Encrypted persistence has not initialized'); }

function getMemberNameFrom(members,id,fallback='General') { return members.find(m=>m.id===id)?.name || fallback; }
function getMemberName(id,fallback='General') { return getMemberNameFrom(state.members,id,fallback); }
function getPrayer(id) { return state.prayers.find(p=>p.id===id); }
function getFollowUp(id) { return state.followUps.find(f=>f.id===id); }
function prayerLatestDate(p) { const updates=p.updates||[]; return updates.length ? updates[updates.length-1].date : p.createdDate; }
function entryPrayerIds(e) { return Array.isArray(e.prayerIds)?e.prayerIds:[]; }
function entryFollowUpIds(e) { return Array.isArray(e.followUpIds)?e.followUpIds:[]; }

function toast(msg) { const el=document.getElementById('toast'); if(!el)return; el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }

function parseScripture(reference, translation='NIV') {
  const raw=reference.trim().replace(/[–—]/g,'-').replace(/\s+/g,' '); if(!raw)return null;
  const match=raw.match(/^(.+?)\s+(\d+)(?::(\d+(?:-\d+)?))?(?:\s*[-,;].*)?$/i); if(!match)return null;
  const bookRaw=match[1].toLowerCase().replace(/\./g,'').trim(); const code=BOOKS[bookRaw]; if(!code)return null;
  const chapter=match[2], verses=match[3], tr=TRANSLATIONS[translation]||TRANSLATIONS.NIV;
  const locator=verses?`${code}.${chapter}.${verses}.${tr.label}`:`${code}.${chapter}.${tr.label}`;
  const canonicalReference=`${match[1]} ${chapter}${verses?`:${verses}`:''}`;
  return {url:`https://www.bible.com/bible/${tr.id}/${locator}`,code,chapter,verses,canonicalReference};
}

function scripturePassageId(reference,translation) {
  const parsed=parseScripture(reference,translation);
  if(!parsed)return null;
  const [firstVerse,lastVerse]=parsed.verses?.split('-')||[];
  const start=firstVerse?`${parsed.code}.${parsed.chapter}.${firstVerse}`:`${parsed.code}.${parsed.chapter}`;
  return lastVerse?`${start}-${parsed.code}.${parsed.chapter}.${lastVerse}`:start;
}

function normalizeScriptureResponse(passage,reference,translation) {
  const content=passage.data?.content||passage.content||passage.data?.text||passage.text||'';
  const text=new DOMParser().parseFromString(String(content),'text/html').body.textContent.replace(/\s+/g,' ').trim();
  if(!text)throw new Error('Scripture text was empty');
  return {text:`${passage.data?.reference||passage.reference||reference} (${translation})\n${text}`,notice:passage.notice||passage.copyright||passage.data?.copyright||''};
}

async function scriptureRequestError(response,translation) {
  let providerMessage='';
  try{
    const payload=await response.json();
    providerMessage=String(payload?.message||payload?.error?.message||payload?.error||payload?.detail||'').trim();
  }catch(_error){/* The HTTP status remains useful when YouVersion returns no JSON body. */}
  const guidance=response.status===401
    ?'YouVersion did not accept the selected application key.'
    :response.status===403
      ?'YouVersion accepted the request but denied access. Check the application’s NIV permission and allowed browser origin.'
      :'';
  const detail=providerMessage||guidance;
  const error=new Error(`${translation} Scripture request failed (${response.status})${detail?`: ${detail}`:''}`);
  error.status=response.status;
  error.code=response.status===401||response.status===403?'TRANSLATION_ACCESS':'API_ERROR';
  error.providerMessage=providerMessage;
  return error;
}

function createScriptureProvider({userApiKey='',proxyEndpoint=SCRIPTURE_PROXY_ENDPOINT}={}) {
  return {
    async fetch(reference,translation,signal) {
      const bible=TRANSLATIONS[translation],passageId=scripturePassageId(reference,translation);
      if(!bible||!passageId)throw new Error('Unsupported translation or passage');
      if(userApiKey){
        const response=await fetch(`https://api.youversion.com/v1/bibles/${bible.id}/passages/${encodeURIComponent(passageId)}?format=text`,{headers:{'Accept':'application/json','X-YVP-App-Key':userApiKey},signal});
        if(!response.ok)throw await scriptureRequestError(response,translation);
        return normalizeScriptureResponse(await response.json(),reference,translation);
      }
      const response=await fetch(proxyEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passageId,translation}),signal});
      if(!response.ok){const error=new Error(`Scripture request failed (${response.status})`);error.code=response.status===404||response.status===503?'NO_PROVIDER':'API_ERROR';throw error;}
      return normalizeScriptureResponse(await response.json(),reference,translation);
    },
    async fetchPublicDomain(reference,signal) {
      const parsed=parseScripture(reference,'KJV');
      if(!parsed)throw new Error('Unsupported translation or passage');
      const response=await fetch(`${KJV_PUBLIC_DOMAIN_API}${encodeURIComponent(parsed.canonicalReference)}?translation=kjv`,{signal});
      if(!response.ok)throw new Error(`KJV request failed (${response.status})`);
      const passage=await response.json(),text=String(passage.text||'').replace(/\s+/g,' ').trim();
      if(!text)throw new Error('Scripture text was empty');
      return {text:`${passage.reference||parsed.canonicalReference} (KJV)\n${text}`,notice:'King James Version (KJV) — public domain.'};
    }
  };
}

async function fetchScripturePassage(reference, translation, credential, signal) {
  if(!credential){const error=new Error('No authenticated Scripture provider is configured');error.code='NO_PROVIDER';throw error;}
  return createScriptureProvider({userApiKey:credential}).fetch(reference,translation,signal);
}

async function fetchScriptureText(reference, translation, credential, signal) {
  const result=await fetchScripturePassage(reference,translation,credential,signal);
  return result.text;
}

function canSeedScripture(existing) {
  return !existing||existing.status==='draft';
}

function shell(content,active='home') {
  const groupName=state.group?.name||'Gathered';
  return `<div class="app-shell"><header class="topbar"><div class="brand-lockup"><img class="brand-logo" src="icons/icon-192.png" alt=""><div class="brand-text"><strong>${esc(groupName)}</strong><span>Gathered · Scripture, community & prayer</span></div></div><div class="top-actions"><a class="icon-btn" href="#search" aria-label="Search">⌕</a><a class="icon-btn" href="#settings" aria-label="Settings">⚙</a></div></header><main>${content}</main><nav class="bottom-nav">${navItem('home','⌂','Home',active)}${navItem('prayers','♡','Prayers',active)}${navItem('diary','✎','Diary',active)}${navItem('members','♙','Members',active)}${navItem('entries','☷','Sessions',active)}</nav></div>`;
}
function navItem(route,icon,label,active){return `<a class="nav-btn ${active===route?'active':''}" href="#${route}"><span>${icon}</span><span>${label}</span></a>`;}

function renderOnboarding(){
  document.getElementById('app').innerHTML=`<div class="onboarding"><section class="onboarding-panel"><img class="onboarding-logo" src="icons/icon-192.png" alt="Gathered"><div class="hero"><div class="eyebrow">Welcome to Gathered</div><h1>Build your small group journal.</h1><p class="subtle">Keep Scripture notes, prayer histories, follow-ups, and people in one private place.</p></div><form id="onboardingForm" class="card form"><div class="field"><label for="groupName">Small group name</label><input class="input" id="groupName" required placeholder="e.g., Thursday Night Small Group"></div><div class="field"><label>Members</label><small>Add names now. Contact details can be added later.</small><div id="memberDrafts" class="grid"></div><button type="button" class="btn secondary" id="addDraftMember">＋ Add member</button></div><button class="btn primary block" type="submit">Create Small Group</button><div class="notice">Gathered stores your data in IndexedDB on this device. Export backups periodically, especially before changing devices.</div></form></section></div>`;
  const drafts=document.getElementById('memberDrafts');
  const addDraft=()=>{const row=document.createElement('div');row.className='inline';row.innerHTML=`<input class="input draft-name" placeholder="Member name"><button type="button" class="icon-btn remove-draft" aria-label="Remove">×</button>`;drafts.appendChild(row);row.querySelector('.remove-draft').onclick=()=>row.remove();};
  addDraft();addDraft();document.getElementById('addDraftMember').onclick=addDraft;
  document.getElementById('onboardingForm').onsubmit=async e=>{e.preventDefault();const name=document.getElementById('groupName').value.trim();if(!name)return;state.group={id:uid('group'),name,createdAt:new Date().toISOString()};state.members=[...document.querySelectorAll('.draft-name')].map(i=>i.value.trim()).filter(Boolean).map(name=>({id:uid('member'),name,role:'',email:'',phone:'',birthday:'',notes:'',createdAt:new Date().toISOString()}));await saveState();location.hash='#home';render();};
}

function backupDue(){return state.entries.length>0 && daysSince(state.settings.lastBackupAt)>=BACKUP_REMINDER_DAYS;}
function homePage(){
  const active=state.prayers.filter(p=>p.status!=='answered').sort((a,b)=>(prayerLatestDate(b)||'').localeCompare(prayerLatestDate(a)||''));
  const openFollowUps=state.followUps.filter(f=>f.status!=='completed');
  const recent=state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return shell(`<div class="page"><section class="hero"><div class="eyebrow">Gathered</div><h1>${esc(state.group.name)}</h1><p class="subtle">Capture the Word, remember your people, and carry prayer forward from week to week.</p></section>${backupDue()?`<div class="notice backup-notice"><strong>Backup recommended.</strong> It has been ${state.settings.lastBackupAt?daysSince(state.settings.lastBackupAt)+' days':'more than 30 days'} since your last recorded export. <a href="#settings">Back up now</a>.</div>`:''}<a class="fab-card" href="#entry/new"><div><h2>New Session</h2><p>Scripture · journal · prayer · follow-ups</p></div><div class="icon">＋</div></a><section class="section home-diary"><a class="list-item item-title" href="#diary/new/${todayISO()}"><div class="list-main"><strong>Write in Diary</strong><div class="meta">Remember what mattered today</div></div><span aria-hidden="true">›</span></a></section><section class="section"><div class="grid three"><div class="card stat"><strong>${state.members.length}</strong><span>Members</span></div><div class="card stat"><strong>${active.length}</strong><span>Active prayers</span></div><div class="card stat"><strong>${openFollowUps.length}</strong><span>Open follow-ups</span></div></div></section><section class="section"><div class="section-title"><h2>Prayer focus</h2><a class="btn small secondary" href="#prayers">View all</a></div>${active.length?`<div class="list">${active.slice(0,3).map(prayerListItem).join('')}</div>`:`<div class="empty">No active prayer requests yet.</div>`}</section><section class="section"><div class="section-title"><h2>Recent sessions</h2><a class="btn small secondary" href="#entries">View all</a></div>${recent.length?`<div class="list">${recent.map(entryListItem).join('')}</div>`:`<div class="empty">Your first Gathered session will appear here.</div>`}</section></div>`,'home');
}
function entryListItem(e){return `<a class="list-item clickable" href="#entry/${e.id}" style="text-decoration:none"><div class="list-main"><strong>${esc(e.scripture||'Small Group Session')}</strong><div class="meta">${fmtDate(e.date)} · ${entryPrayerIds(e).length} prayer touchpoint${entryPrayerIds(e).length===1?'':'s'} · ${entryFollowUpIds(e).length} follow-up${entryFollowUpIds(e).length===1?'':'s'}</div></div><span>›</span></a>`;}
function prayerListItem(p){return `<div class="list-item"><div class="list-main"><a class="item-title" href="#prayer/${esc(p.id)}"><strong>${esc(p.memberName||getMemberName(p.memberId,'General / group'))}</strong></a><div class="meta markdown-compact">${renderMarkdown(p.text,{inline:true})}</div></div><span class="pill ${p.status==='answered'?'answered':''}">${p.status==='answered'?'Answered':'Active'}</span></div>`;}

function entriesPage(){const entries=state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date));return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">History</div><h1>Small group sessions</h1></div><a class="btn primary small" href="#entry/new">＋ New</a></div>${entries.length?`<div class="list">${entries.map(entryListItem).join('')}</div>`:`<div class="empty">No sessions logged yet.</div>`}</div>`,'entries');}

function memberOptions(memberId=''){return `<option value="">General / group</option>${state.members.map(m=>`<option value="${m.id}" ${m.id===memberId?'selected':''}>${esc(m.name)}</option>`).join('')}`;}
function activePrayerOptions(selected=''){const prayers=state.prayers.filter(p=>p.status!=='answered');return `<option value="">Choose an active prayer...</option>${prayers.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc((p.memberName||getMemberName(p.memberId,'Group'))+' — '+p.text.slice(0,70))}</option>`).join('')}`;}

function entryEditor(id){
  const existing=id&&id!=='new'?state.entries.find(e=>e.id===id):null;
  const entry=existing||{id:uid('entry'),date:todayISO(),scripture:'',translation:state.settings.translation||'NIV',journal:'',prayerIds:[],followUpIds:[]};
  const seededFollowUps=existing?entryFollowUpIds(existing).map(getFollowUp).filter(Boolean):[];
  return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${existing?'Edit':'New'} Session</div><h1>${existing?'Update session':'Create session'}</h1></div>${existing?`<button class="btn small danger" id="deleteEntry">Delete</button>`:''}</div><form class="form" id="entryForm"><div class="card form flat"><div class="field"><label for="entryDate">Session date</label><input class="input" type="date" id="entryDate" value="${esc(entry.date)}" required></div><div class="field"><label for="scripture">Scripture</label><input class="input" id="scripture" value="${esc(entry.scripture)}" placeholder="e.g., John 3:16-18" required><small>Enter one primary passage. A YouVersion link will remain available, and you can choose when to retrieve the passage.</small></div><div class="field"><label for="translation">Bible translation</label><select class="select" id="translation">${Object.keys(TRANSLATIONS).map(k=>`<option ${entry.translation===k?'selected':''}>${k}</option>`).join('')}</select><small>Licensed insertion requires configured YouVersion access; an eligible NIV access error can offer the public-domain KJV fallback.</small></div><button class="btn secondary scripture-insert" type="button" id="insertScripture">Insert into Session Journal</button><div id="scripturePreview"></div><div id="scriptureStatus" class="subtle mini" role="status" aria-live="polite"></div></div><div class="card form flat"><div class="field"><label for="journal">Session journal</label><textarea class="textarea" id="journal" rows="9" placeholder="What stood out? What did the group discuss? What do you want to remember?">${esc(entry.journal)}</textarea></div></div><div class="card form flat"><div class="card-header"><div><h2>New prayer requests</h2><div class="subtle mini">Create durable requests that continue across future sessions.</div></div><button class="btn small secondary" type="button" id="addNewPrayer">＋ Add</button></div><div id="newPrayerRows" class="grid"></div></div><div class="card form flat"><div class="card-header"><div><h2>Prayer updates</h2><div class="subtle mini">Add progress to an existing request or mark it answered.</div></div><button class="btn small secondary" type="button" id="addPrayerUpdate">＋ Update</button></div><div id="prayerUpdateRows" class="grid"></div></div><div class="card form flat"><div class="card-header"><div><h2>Follow-ups</h2><div class="subtle mini">Capture actions, owners, and due dates from this session.</div></div><button class="btn small secondary" type="button" id="addFollowUp">＋ Add</button></div><div id="followUpRows" class="grid"></div></div><div class="form-actions"><a href="#${existing?'entry/'+existing.id:'home'}" class="btn ghost">Cancel</a><button class="btn primary" type="submit">Save Session</button></div></form></div>`,'entries');
}

function bindEntryEditor(id){
  const existing=id&&id!=='new'?state.entries.find(e=>e.id===id):null;
  const newPrayerRows=document.getElementById('newPrayerRows'), updateRows=document.getElementById('prayerUpdateRows'), followUpRows=document.getElementById('followUpRows');
  function addNewPrayer(p={id:uid('prayer'),memberId:'',text:''}){const row=document.createElement('div');row.className='prayer-row';row.dataset.id=p.id;row.innerHTML=`<div class="row-top"><select class="select prayer-member">${memberOptions(p.memberId)}</select><button type="button" class="icon-btn row-remove">×</button></div><textarea class="textarea prayer-text" rows="3" placeholder="Prayer request">${esc(p.text)}</textarea>`;newPrayerRows.appendChild(row);row.querySelector('.row-remove').onclick=()=>row.remove();}
  function addPrayerUpdate(u={prayerId:'',text:'',status:'active'}){const row=document.createElement('div');row.className='prayer-row';row.innerHTML=`<div class="row-top"><select class="select update-prayer">${activePrayerOptions(u.prayerId)}</select><button type="button" class="icon-btn row-remove">×</button></div><textarea class="textarea update-text" rows="3" placeholder="What changed since the last meeting?">${esc(u.text)}</textarea><select class="select update-status"><option value="active" ${u.status!=='answered'?'selected':''}>Keep active</option><option value="answered" ${u.status==='answered'?'selected':''}>Answered</option></select>`;updateRows.appendChild(row);row.querySelector('.row-remove').onclick=()=>row.remove();}
  function addFollowUp(f={id:uid('follow'),text:'',memberId:'',dueDate:'',status:'open'}){const row=document.createElement('div');row.className='followup-row';row.dataset.id=f.id;row.innerHTML=`<textarea class="textarea followup-text" rows="2" placeholder="Follow-up or action item">${esc(f.text)}</textarea><div class="row-grid"><select class="select followup-member">${memberOptions(f.memberId)}</select><input class="input followup-due" type="date" value="${esc(f.dueDate||'')}"><select class="select followup-status"><option value="open" ${f.status!=='completed'?'selected':''}>Open</option><option value="completed" ${f.status==='completed'?'selected':''}>Completed</option></select><button type="button" class="icon-btn row-remove">×</button></div>`;followUpRows.appendChild(row);row.querySelector('.row-remove').onclick=()=>row.remove();}
  if(existing) entryFollowUpIds(existing).map(getFollowUp).filter(Boolean).forEach(addFollowUp);
  document.getElementById('addNewPrayer').onclick=()=>addNewPrayer(); document.getElementById('addPrayerUpdate').onclick=()=>addPrayerUpdate(); document.getElementById('addFollowUp').onclick=()=>addFollowUp();
  const scripture=document.getElementById('scripture'),translation=document.getElementById('translation'),insertScripture=document.getElementById('insertScripture'),preview=document.getElementById('scripturePreview'),scriptureStatus=document.getElementById('scriptureStatus'),journal=document.getElementById('journal');
  let scriptureRequest,requestSequence=0,lastVerseBlock='',insertingScripture=false;
  const selectedCredential=()=>state.settings.youVersionApiKey?.trim()||globalThis.PUBLIC_YOUVERSION_APP_KEY?.trim()||'';
  const insertPassage=(result,selectedTranslation)=>{
    const notice=result.notice?.trim()||'';
    const block=`${result.text}${notice?`\n${notice}`:''}\n\n`;
    if(lastVerseBlock&&journal.value.startsWith(lastVerseBlock))journal.value=block+journal.value.slice(lastVerseBlock.length);
    else journal.value=block+journal.value;
    lastVerseBlock=block;
    const translationChanged=translation.value!==selectedTranslation;
    translation.value=selectedTranslation;
    preview.innerHTML=`<div class="scripture-preview"><strong>${esc(result.text.split('\n')[0])}</strong>${notice?`<div class="scripture-attribution">${esc(notice)}</div>`:''}</div>`;
    journal.dispatchEvent(new Event('input',{bubbles:true}));
    if(translationChanged)translation.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const loadScripture=async()=>{
    const reference=scripture.value.trim();
    if(insertingScripture)return;
    if(!parseScripture(reference,translation.value)){toast('Enter a valid Bible passage, such as Romans 8:28.');scripture.focus();return;}
    const requestedTranslation=translation.value,sequence=++requestSequence;
    insertingScripture=true;insertScripture.disabled=true;insertScripture.textContent='Inserting…';
    scriptureRequest=new AbortController();scriptureStatus.textContent='Adding Scripture to your journal…';
    try{
      const result=await fetchScripturePassage(reference,requestedTranslation,selectedCredential(),scriptureRequest.signal);
      if(sequence!==requestSequence||scripture.value.trim()!==reference||translation.value!==requestedTranslation)return;
      insertPassage(result,requestedTranslation);
      scriptureStatus.textContent=`Scripture added in ${requestedTranslation}.${result.notice?` ${result.notice}`:''}`;
    }catch(error){if(error.name!=='AbortError'&&sequence===requestSequence){
      scriptureStatus.textContent=`Could not load ${requestedTranslation}: ${error.message}`;
      if(requestedTranslation==='NIV'&&error.code==='TRANSLATION_ACCESS'){
        const {confirmed}=await appModal.confirm(`NIV could not be loaded with the selected application key.\n\n${error.message}\n\nWould you like to use the public-domain KJV instead? The session translation will be changed to KJV.`,{title:'Use KJV instead?',confirmLabel:'Use KJV'});
        if(!confirmed||sequence!==requestSequence)return;
        scriptureStatus.textContent='Loading KJV…';
        try{
          const result=await createScriptureProvider().fetchPublicDomain(reference,scriptureRequest.signal);
          if(sequence!==requestSequence)return;
          insertPassage(result,'KJV');
          scriptureStatus.textContent=`Scripture added in KJV.${result.notice?` ${result.notice}`:''}`;
        }catch(fallbackError){if(fallbackError.name!=='AbortError'&&sequence===requestSequence)scriptureStatus.textContent=`Could not load KJV: ${fallbackError.message}`;}
      }
    }}finally{
      if(sequence===requestSequence){insertingScripture=false;insertScripture.disabled=false;insertScripture.textContent='Insert into Session Journal';}
    }
  };
  const updatePreview=()=>{const p=parseScripture(scripture.value,translation.value);preview.innerHTML=p?`<a class="scripture-link" href="${p.url}" target="_blank" rel="noopener">Open in YouVersion ↗</a>`:`<div class="subtle mini">Use a format like “Romans 8:28” or “Psalm 23”.</div>`;if(!p)scriptureStatus.textContent='';}; scripture.addEventListener('input',updatePreview);translation.addEventListener('change',updatePreview);insertScripture.addEventListener('click',loadScripture);updatePreview();
  document.getElementById('entryForm').onsubmit=async e=>{
    e.preventDefault();const scriptureVal=scripture.value.trim();if(!parseScripture(scriptureVal,translation.value)){toast('Check the Scripture format');scripture.focus();return;}
    const date=document.getElementById('entryDate').value, entryId=existing?.id||uid('entry');
    const touchedPrayerIds=existing?entryPrayerIds(existing).slice():[];
    for(const row of newPrayerRows.querySelectorAll('.prayer-row')){const text=row.querySelector('.prayer-text').value.trim();if(!text)continue;const memberId=row.querySelector('.prayer-member').value;const p={id:row.dataset.id||uid('prayer'),memberId,memberName:getMemberName(memberId,'General / group'),text,status:'active',createdDate:date,createdEntryId:entryId,updates:[],answeredDate:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};state.prayers.push(p);touchedPrayerIds.push(p.id);}
    for(const row of updateRows.querySelectorAll('.prayer-row')){const prayerId=row.querySelector('.update-prayer').value,text=row.querySelector('.update-text').value.trim(),status=row.querySelector('.update-status').value;if(!prayerId||!text)continue;const p=getPrayer(prayerId);if(!p)continue;p.updates=p.updates||[];p.updates.push({id:uid('update'),date,entryId,text,createdAt:new Date().toISOString()});p.status=status;p.answeredDate=status==='answered'?date:'';p.updatedAt=new Date().toISOString();if(!touchedPrayerIds.includes(p.id))touchedPrayerIds.push(p.id);}
    const previousFollowIds=existing?entryFollowUpIds(existing):[];const nextFollowIds=[];
    for(const row of followUpRows.querySelectorAll('.followup-row')){const text=row.querySelector('.followup-text').value.trim();if(!text)continue;const id=row.dataset.id||uid('follow'),memberId=row.querySelector('.followup-member').value,dueDate=row.querySelector('.followup-due').value,status=row.querySelector('.followup-status').value;const old=getFollowUp(id);const item={id,text,memberId,memberName:getMemberName(memberId,'Unassigned'),dueDate,status,createdEntryId:entryId,createdDate:old?.createdDate||date,completedAt:status==='completed'?(old?.completedAt||new Date().toISOString()):'',createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(old)state.followUps=state.followUps.map(x=>x.id===id?item:x);else state.followUps.push(item);nextFollowIds.push(id);}
    state.followUps=state.followUps.filter(f=>!previousFollowIds.includes(f.id)||nextFollowIds.includes(f.id));
    const saved={id:entryId,sessionType:document.getElementById('sessionType')?.value||existing?.sessionType||'small-group',status:'completed',date,scripture:scriptureVal,translation:translation.value,journal:document.getElementById('journal').value.trim(),prayerIds:[...new Set(touchedPrayerIds)],followUpIds:nextFollowIds,updatedAt:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()};
    if(existing)state.entries=state.entries.map(x=>x.id===existing.id?saved:x);else state.entries.push(saved);state.settings.translation=translation.value;await saveState();toast('Session saved');location.hash=`#entry/${saved.id}`;render();
  };
  if(existing)document.getElementById('deleteEntry').onclick=async()=>{if((await appModal.confirm('Delete this session? Prayer histories will remain, but this session link will be removed.',{title:'Delete session',confirmLabel:'Delete',destructive:true})).confirmed){state.entries=state.entries.filter(x=>x.id!==existing.id);state.followUps=state.followUps.filter(f=>f.createdEntryId!==existing.id);state.prayers.forEach(p=>{p.updates=(p.updates||[]).filter(u=>u.entryId!==existing.id);if(p.createdEntryId===existing.id)p.createdEntryId='';});await saveState();location.hash='#entries';render();}};
}

function entryDetail(id){const e=state.entries.find(x=>x.id===id);if(!e)return entriesPage();const parsed=parseScripture(e.scripture,e.translation);const prayers=entryPrayerIds(e).map(getPrayer).filter(Boolean),followUps=entryFollowUpIds(e).map(getFollowUp).filter(Boolean);return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${fmtDate(e.date)}</div><h1>${esc(e.scripture)}</h1></div><a class="btn small secondary" href="#entry/${e.id}/edit">Edit</a></div>${parsed?`<a class="scripture-link" href="${parsed.url}" target="_blank" rel="noopener noreferrer">Open ${esc(e.scripture)} in YouVersion ↗</a>`:''}<section class="section"><div class="card"><div class="kicker">Session journal</div><div class="detail-body markdown-body">${e.journal?renderMarkdown(e.journal):'<span class="subtle">No journal notes.</span>'}</div></div></section><section class="section"><div class="section-title"><h2>Prayer touchpoints</h2><span class="pill">${prayers.length}</span></div>${prayers.length?`<div class="list">${prayers.map(prayerListItem).join('')}</div>`:`<div class="empty">No prayer activity logged.</div>`}</section><section class="section"><div class="section-title"><h2>Follow-ups</h2><span class="pill">${followUps.length}</span></div>${followUps.length?`<div class="list">${followUps.map(followUpItem).join('')}</div>`:`<div class="empty">No follow-ups from this session.</div>`}</section></div>`,'entries');}

function prayersPage(){const active=state.prayers.filter(p=>p.status!=='answered').sort((a,b)=>(prayerLatestDate(b)||'').localeCompare(prayerLatestDate(a)||'')),answered=state.prayers.filter(p=>p.status==='answered').sort((a,b)=>(b.answeredDate||'').localeCompare(a.answeredDate||''));return shell(`<div class="page"><div class="hero"><div class="eyebrow">Prayer Log</div><h1>Prayer requests</h1><p class="subtle">Each request keeps its full story across sessions—from first ask through updates and answered prayer.</p></div><section><div class="section-title"><h2>Active</h2><span class="pill">${active.length}</span></div>${active.length?`<div class="list">${active.map(prayerListItem).join('')}</div>`:`<div class="empty">No active prayer requests.</div>`}</section><section class="section"><div class="section-title"><h2>Answered</h2><span class="pill answered">${answered.length}</span></div>${answered.length?`<div class="list">${answered.map(prayerListItem).join('')}</div>`:`<div class="empty">Answered prayers will collect here.</div>`}</section></div>`,'prayers');}
function prayerDetail(id){const p=getPrayer(id);if(!p)return prayersPage();const history=[{date:p.createdDate,text:'Prayer request created',entryId:p.createdEntryId},...(p.updates||[]).map(u=>({date:u.date,text:u.text,entryId:u.entryId}))].sort((a,b)=>(b.date||'').localeCompare(a.date||''));return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">Prayer history</div><h1>${esc(p.memberName||getMemberName(p.memberId,'General / group'))}</h1></div><span class="pill ${p.status==='answered'?'answered':''}">${p.status==='answered'?'Answered':'Active'}</span></div><div class="card flat"><div class="detail-body markdown-body">${renderMarkdown(p.text)}</div><div class="meta">Started ${fmtDate(p.createdDate)}${p.answeredDate?` · Answered ${fmtDate(p.answeredDate)}`:''}</div></div><section class="section"><div class="section-title"><h2>Timeline</h2></div><div class="timeline">${history.map(h=>`<div class="timeline-item"><div class="timeline-dot"></div><div><strong>${fmtDate(h.date)}</strong><div class="detail-body markdown-body">${renderMarkdown(h.text)}</div>${h.entryId?`<a class="mini-link" href="#entry/${h.entryId}">Open session</a>`:''}</div></div>`).join('')}</div></section></div>`,'prayers');}

function followUpItem(f){return `<div class="list-item"><div class="list-main"><div class="markdown-compact">${renderMarkdown(f.text,{inline:true})}</div><div class="meta">${esc(f.memberName||getMemberName(f.memberId,'Unassigned'))}${f.dueDate?` · Due ${fmtDate(f.dueDate)}`:''}</div></div><span class="pill ${f.status==='completed'?'answered':''}">${f.status==='completed'?'Done':'Open'}</span></div>`;}

function membersPage(){const members=state.members.slice().sort((a,b)=>a.name.localeCompare(b.name));return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">People</div><h1>Members</h1></div><a class="btn primary small" href="#member/new">＋ Add</a></div>${members.length?`<div class="list">${members.map(m=>`<a href="#member/${m.id}" class="list-item clickable" style="text-decoration:none"><div class="member-line"><div class="member-avatar">${esc(initials(m.name))}</div><div class="list-main"><strong>${esc(m.name)}</strong><div class="meta">${esc(m.role||m.email||m.phone||'Member profile')}</div></div></div><span>›</span></a>`).join('')}</div>`:`<div class="empty">No members yet.</div>`}</div>`,'members');}
function memberEditor(id){const existing=id&&id!=='new'?state.members.find(m=>m.id===id):null,m=existing||{name:'',role:'',email:'',phone:'',birthday:'',notes:''};return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">${existing?'Edit':'New'} Member</div><h1>${existing?esc(m.name):'Add member'}</h1></div>${existing?`<button class="btn small danger" id="deleteMember">Delete</button>`:''}</div><form id="memberForm" class="card form flat"><div class="field"><label>Name</label><input class="input" id="memberName" value="${esc(m.name)}" required></div><div class="field"><label>Role / relationship</label><input class="input" id="memberRole" value="${esc(m.role)}" placeholder="e.g., Host, Leader, Member"></div><div class="field"><label>Email</label><input class="input" id="memberEmail" type="email" value="${esc(m.email)}" placeholder="name@example.com"></div><div class="field"><label>Phone</label><input class="input" id="memberPhone" type="tel" value="${esc(m.phone)}" placeholder="(555) 555-5555"></div><div class="field"><label>Birthday</label><input class="input" id="memberBirthday" type="date" value="${esc(m.birthday)}"></div><div class="field"><label>Notes</label><textarea class="textarea" id="memberNotes" rows="5" placeholder="Family details, follow-up notes, or anything helpful to remember.">${esc(m.notes)}</textarea></div><div class="form-actions"><a class="btn ghost" href="#${existing?'member/'+existing.id:'members'}">Cancel</a><button class="btn primary" type="submit">Save Member</button></div></form></div>`,'members');}
function bindMemberEditor(id){const existing=id&&id!=='new'?state.members.find(m=>m.id===id):null;document.getElementById('memberForm').onsubmit=async e=>{e.preventDefault();const m={id:existing?.id||uid('member'),name:document.getElementById('memberName').value.trim(),role:document.getElementById('memberRole').value.trim(),email:document.getElementById('memberEmail').value.trim(),phone:document.getElementById('memberPhone').value.trim(),birthday:document.getElementById('memberBirthday').value,notes:document.getElementById('memberNotes').value.trim(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(existing)state.members=state.members.map(x=>x.id===existing.id?m:x);else state.members.push(m);state.prayers.filter(p=>p.memberId===m.id).forEach(p=>p.memberName=m.name);state.followUps.filter(f=>f.memberId===m.id).forEach(f=>f.memberName=m.name);await saveState();location.hash=`#member/${m.id}`;render();toast('Member saved');};if(existing)document.getElementById('deleteMember').onclick=async()=>{if((await appModal.confirm(`Delete ${existing.name}? Prayer and follow-up history will retain the person's name.`,{title:'Delete member',confirmLabel:'Delete',destructive:true})).confirmed){state.members=state.members.filter(x=>x.id!==existing.id);await saveState();location.hash='#members';render();}};}
function memberDetail(id){const m=state.members.find(x=>x.id===id);if(!m)return membersPage();const prayers=state.prayers.filter(p=>p.memberId===m.id),active=prayers.filter(p=>p.status!=='answered'),answered=prayers.filter(p=>p.status==='answered'),followUps=state.followUps.filter(f=>f.memberId===m.id),timeline=[];prayers.forEach(p=>{timeline.push({date:p.createdDate,type:'Prayer',text:p.text,href:`#prayer/${p.id}`});(p.updates||[]).forEach(u=>timeline.push({date:u.date,type:'Prayer update',text:u.text,href:`#prayer/${p.id}`}));});followUps.forEach(f=>timeline.push({date:f.createdDate,type:'Follow-up',text:f.text,href:`#entry/${f.createdEntryId}`}));timeline.sort((a,b)=>(b.date||'').localeCompare(a.date||''));return shell(`<div class="page"><div class="section-title"><div class="member-line"><div class="member-avatar">${esc(initials(m.name))}</div><div><div class="eyebrow">Member</div><h1 class="flush">${esc(m.name)}</h1></div></div><a class="btn small secondary" href="#member/${m.id}/edit">Edit</a></div><div class="card flat"><div class="kicker">${esc(m.role||'Small group member')}</div><div class="contact-links">${m.phone?`<a class="btn small ghost" href="tel:${esc(m.phone)}">Call</a><a class="btn small ghost" href="sms:${esc(m.phone)}">Text</a>`:''}${m.email?`<a class="btn small ghost" href="mailto:${esc(m.email)}">Email</a>`:''}</div>${m.birthday?`<p><strong>Birthday:</strong> ${fmtDate(m.birthday)}</p>`:''}${m.notes?`<div class="divider"></div><div class="detail-body markdown-body">${renderMarkdown(m.notes)}</div>`:''}</div><section class="section"><div class="grid three"><div class="card stat"><strong>${active.length}</strong><span>Active prayers</span></div><div class="card stat"><strong>${answered.length}</strong><span>Answered</span></div><div class="card stat"><strong>${followUps.filter(f=>f.status!=='completed').length}</strong><span>Open follow-ups</span></div></div></section><section class="section"><div class="section-title"><h2>Timeline</h2></div>${timeline.length?`<div class="timeline">${timeline.map(t=>`<div class="timeline-item"><div class="timeline-dot"></div><div><a class="item-title" href="${t.href}"><strong>${esc(t.type)} · ${fmtDate(t.date)}</strong></a><div class="detail-body markdown-body">${renderMarkdown(t.text)}</div></div></div>`).join('')}</div>`:`<div class="empty">No prayer or follow-up history yet.</div>`}</section></div>`,'members');}

function searchPage(){return shell(`<div class="page"><div class="hero"><div class="eyebrow">Find anything</div><h1>Search Gathered</h1><p class="subtle">Search Scripture, journal notes, members, prayer requests, updates, and follow-ups.</p></div><div class="card flat"><input class="input search-input" id="globalSearch" type="search" placeholder="Search…" autocomplete="off"></div><div id="searchResults" class="section"></div></div>`,'');}
function bindSearch(){const input=document.getElementById('globalSearch'),results=document.getElementById('searchResults');const renderResults=()=>{const q=input.value.trim().toLowerCase();if(!q){results.innerHTML='<div class="empty">Start typing to search your small group history.</div>';return;}const hits=[];state.members.forEach(m=>{const hay=[m.name,m.role,m.email,m.phone,m.notes].join(' ').toLowerCase();if(hay.includes(q))hits.push({type:'Member',title:m.name,meta:m.notes||m.role||'Member profile',markdownMeta:Boolean(m.notes),href:`#member/${m.id}`});});state.entries.forEach(e=>{const hay=[e.scripture,e.journal].join(' ').toLowerCase();if(hay.includes(q))hits.push({type:'Session',title:e.scripture||'Session',meta:e.journal||fmtDate(e.date),markdownMeta:Boolean(e.journal),href:`#entry/${e.id}`});});state.prayers.forEach(p=>{const updates=p.updates||[],matchingUpdate=updates.find(u=>String(u.text||'').toLowerCase().includes(q)),hay=[p.text,p.memberName,...updates.map(u=>u.text)].join(' ').toLowerCase();if(hay.includes(q))hits.push({type:matchingUpdate?'Prayer update':'Prayer',title:p.memberName||'Prayer',meta:matchingUpdate?.text||p.text,markdownMeta:true,href:`#prayer/${p.id}`});});state.diaryEntries.forEach(d=>{const hay=[d.title,d.body,(d.tags||[]).join(' '),d.date].join(' ').toLowerCase();if(hay.includes(q))hits.push({type:'Diary',title:d.title||'Diary entry',meta:d.body||fmtDate(d.date),markdownMeta:Boolean(d.body),href:`#diary/entry/${d.id}`});});state.followUps.forEach(f=>{const hay=[f.text,f.memberName].join(' ').toLowerCase();if(hay.includes(q))hits.push({type:'Follow-up',title:f.memberName||'Follow-up',meta:f.text,markdownMeta:true,href:`#entry/${f.createdEntryId}`});});results.innerHTML=hits.length?`<div class="list">${hits.slice(0,50).map(h=>`<div class="list-item"><div class="list-main"><span class="kicker">${esc(h.type)}</span><a class="item-title" href="${h.href}"><strong>${esc(h.title)}</strong></a><div class="meta markdown-compact">${h.markdownMeta?renderMarkdown(h.meta,{inline:true}):esc(h.meta)}</div></div><a class="item-title" href="${h.href}" aria-label="Open ${esc(h.type)}">›</a></div>`).join('')}</div>`:'<div class="empty">No matches.</div>';};input.addEventListener('input',renderResults);renderResults();input.focus();}

function validateBackup(data){const errors=[];if(!data||typeof data!=='object')errors.push('Backup must be a JSON object.');if(!data.group||typeof data.group.name!=='string'||!data.group.name.trim())errors.push('Missing group name.');if(!Array.isArray(data.members))errors.push('Members must be an array.');if(!Array.isArray(data.entries))errors.push('Entries must be an array.');if(data.version>=2&&!Array.isArray(data.prayers))errors.push('Prayers must be an array.');if(data.version>=2&&!Array.isArray(data.followUps))errors.push('Follow-ups must be an array.');for(const m of data.members||[])if(!m||typeof m.name!=='string'||!m.id)errors.push('Each member needs an id and name.');for(const e of data.entries||[])if(!e||!e.id||!e.date)errors.push('Each session needs an id and date.');return {valid:errors.length===0,errors};}
function backupFilename(label='backup'){return `gathered-${label}-${todayISO()}.json`;}
async function downloadBackup(label='backup',mark=true){const snapshot={...state,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=backupFilename(label);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);if(mark){state.settings.lastBackupAt=new Date().toISOString();await saveState();}}

function settingsPage(){const last=state.settings.lastBackupAt?new Date(state.settings.lastBackupAt).toLocaleString():'Never';return shell(`<div class="page"><div class="hero"><div class="eyebrow">Gathered</div><h1>Settings</h1></div><div class="card flat"><div class="settings-row"><div><strong>Small group</strong><div class="subtle mini">${esc(state.group.name)}</div></div><button class="btn small ghost" id="renameGroup">Rename</button></div><div class="settings-row"><div><strong>Default translation</strong><div class="subtle mini">Used for new YouVersion links. Changing it here is your affirmative choice; Gathered never changes translations automatically.</div></div><select class="select compact" id="defaultTranslation">${Object.keys(TRANSLATIONS).map(k=>`<option ${state.settings.translation===k?'selected':''}>${k}</option>`).join('')}</select></div><div class="settings-row stack"><div><strong>YouVersion API key override (optional)</strong><div class="subtle mini">Overrides Gathered’s built-in public application key on this device. Your override is stored in encrypted local data and encrypted backups and is sent directly to YouVersion. The built-in public key is part of the app files and is never copied into user data or exports.</div></div><div class="inline"><input class="input" id="youVersionApiKey" type="password" value="${esc(state.settings.youVersionApiKey||'')}" autocomplete="off" placeholder="Optional API key override"><button class="btn small secondary" id="saveApiKey" type="button">Save</button></div></div><div class="settings-row"><div><strong>Export backup</strong><div class="subtle mini">Last recorded backup: ${esc(last)}</div></div><button class="btn small secondary" id="exportData">Export</button></div><div class="settings-row"><div><strong>Import backup</strong><div class="subtle mini">Validates the file and exports your current data first.</div></div><label class="btn small ghost" for="importData">Import</label><input class="file-input" type="file" id="importData" accept="application/json,.json"></div><div class="settings-row"><div><strong>Update Gathered</strong><div class="subtle mini">Deletes cached app files and downloads the latest deployed files from the repository host. Your IndexedDB data is preserved.</div></div><button class="btn small secondary" id="updateApp">Update App</button></div><div class="settings-row"><div><strong>Reset app</strong><div class="subtle mini">Exports a safety backup, then deletes local Gathered data.</div></div><button class="btn small danger" id="resetApp">Reset</button></div></div><div class="notice section">Prayer requests can contain sensitive personal information. Gathered remains local-first and stores its primary data in IndexedDB on this device.</div></div>`,'');}
async function installLatestApp(button,hash=location.hash){
  button.disabled=true;button.textContent='Updating…';
  try{
    if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));}
    if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}
    const stamp=Date.now();
    await Promise.all(APP_ASSETS.map(path=>fetch(`${path}${path.includes('?')?'&':'?'}gathered_update=${stamp}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${path}: ${r.status}`);} )));
    if('serviceWorker' in navigator)await navigator.serviceWorker.register(`./sw.js?gathered_update=${stamp}`);
    location.replace(`./?gathered_update=${stamp}${hash||'#home'}`);
  }catch(e){
    console.error(e);await appModal.error('Gathered could not complete the update. Check your connection and try again.',{title:'Update failed'});
    button.disabled=false;button.textContent='Update App';
  }
}
async function forceAppUpdate(){if(!(await appModal.confirm('Update Gathered now? Cached app files will be removed and the latest deployed files will be downloaded. Your journal data will stay intact.',{title:'Update Gathered',confirmLabel:'Update App'})).confirmed)return;await installLatestApp(document.getElementById('updateApp'),'#settings');}

function showUpdateModal(){
  const modal=document.getElementById('updateModal');
  if(!modal||!modal.hidden)return;
  modal.hidden=false;
  document.getElementById('installUpdate')?.focus();
}

function serviceWorkerVersion(worker){
  return new Promise(resolve=>{
    if(!worker){resolve(null);return;}
    const channel=new MessageChannel(),timeout=setTimeout(()=>resolve(null),2000);
    channel.port1.onmessage=event=>{clearTimeout(timeout);resolve(event.data?.version||null);};
    worker.postMessage({type:'GET_APP_VERSION'},[channel.port2]);
  });
}

async function watchForAppUpdates(){
  if(!('serviceWorker' in navigator))return;
  const registration=await navigator.serviceWorker.register('./sw.js');
  const checkVersion=async worker=>{
    const installedVersion=await serviceWorkerVersion(worker);
    if(installedVersion&&installedVersion!==APP_VERSION)showUpdateModal();
  };
  await navigator.serviceWorker.ready;
  await checkVersion(registration.active||navigator.serviceWorker.controller);
  registration.addEventListener('updatefound',()=>{
    const worker=registration.installing;
    worker?.addEventListener('statechange',()=>{
      if(worker.state==='activated')checkVersion(worker);
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>checkVersion(navigator.serviceWorker.controller));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')registration.update().catch(console.error);
  });
  registration.update().catch(console.error);
}

function bindUpdateModal(){
  const modal=document.getElementById('updateModal'),install=document.getElementById('installUpdate');
  document.getElementById('dismissUpdate')?.addEventListener('click',()=>{modal.hidden=true;});
  install?.addEventListener('click',async()=>{
    modal.hidden=true;
    await installLatestApp(install);
  });
}
function bindSettings(){document.getElementById('defaultTranslation').onchange=async e=>{state.settings.translation=e.target.value;await saveState();toast('Default updated');};document.getElementById('saveApiKey').onclick=async()=>{state.settings.youVersionApiKey=document.getElementById('youVersionApiKey').value.trim();await saveState();toast('API key saved');};document.getElementById('renameGroup').onclick=async()=>{const {confirmed,value:n}=await appModal.input('Enter a name for this small group.',{title:'Rename small group',label:'Small group name',value:state.group.name,required:true,confirmLabel:'Rename'});if(confirmed&&n.trim()){state.group.name=n.trim();await saveState();render();}};document.getElementById('exportData').onclick=async()=>{await downloadBackup('backup',true);render();toast('Backup exported');};document.getElementById('importData').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text()),check=validateBackup(data);if(!check.valid)throw new Error(check.errors.join('\n'));const incoming=migrateState(data);if((await appModal.confirm(`Import backup for “${incoming.group.name}”?\n\n${incoming.members.length} members · ${incoming.entries.length} sessions · ${incoming.prayers.length} prayers\n\nYour current Gathered data will be exported first.`,{title:'Restore backup',confirmLabel:'Import',destructive:true})).confirmed){await downloadBackup('pre-import',false);state=incoming;await saveState();location.hash='#home';render();toast('Backup restored');}}catch(err){await appModal.error(`That file is not a valid Gathered backup.\n\n${err.message||''}`,{title:'Import failed'});}};document.getElementById('updateApp').onclick=forceAppUpdate;document.getElementById('resetApp').onclick=async()=>{if((await appModal.confirm('Reset Gathered? A safety backup will download first, then all local journal data will be deleted.',{title:'Reset Gathered',confirmLabel:'Reset',destructive:true})).confirmed){await downloadBackup('pre-reset',false);await dbDelete(STATE_KEY);state=defaultState();location.hash='';render();}};}

function render(){if(!state.group){renderOnboarding();return;}const route=(location.hash||'#home').slice(1),parts=route.split('/');if(parts[0]==='home')document.getElementById('app').innerHTML=homePage();else if(parts[0]==='entries')document.getElementById('app').innerHTML=entriesPage();else if(parts[0]==='prayers')document.getElementById('app').innerHTML=prayersPage();else if(parts[0]==='diary'){renderDiaryRoute(parts);}else if(parts[0]==='members')document.getElementById('app').innerHTML=membersPage();else if(parts[0]==='search'){document.getElementById('app').innerHTML=searchPage();bindSearch();}else if(parts[0]==='settings'){document.getElementById('app').innerHTML=settingsPage();bindSettings();}else if(parts[0]==='prayer')document.getElementById('app').innerHTML=prayerDetail(parts[1]);else if(parts[0]==='entry'){if(parts[1]==='new'||parts[2]==='edit'){const id=parts[1]==='new'?'new':parts[1];document.getElementById('app').innerHTML=entryEditor(id);bindEntryEditor(id);}else document.getElementById('app').innerHTML=entryDetail(parts[1]);}else if(parts[0]==='member'){if(parts[1]==='new'||parts[2]==='edit'){const id=parts[1]==='new'?'new':parts[1];document.getElementById('app').innerHTML=memberEditor(id);bindMemberEditor(id);}else document.getElementById('app').innerHTML=memberDetail(parts[1]);}else location.hash='#home';window.scrollTo(0,0);}
// Resolve `render` when navigation happens so enhancement modules loaded after
// this file can safely extend routing (session type selection and drafts).
window.addEventListener('hashchange',()=>render());
window.addEventListener('DOMContentLoaded',async()=>{state=await loadState();render();bindUpdateModal();watchForAppUpdates().catch(console.error);});
