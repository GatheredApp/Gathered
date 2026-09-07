/* Gathered v4 encrypted persistence, session drafts, and security UI. */
const ENVELOPE_KEY = 'encryptedState.v1';
const CRYPTO_FORMAT = 1;
const KDF_ITERATIONS = 600000;
// Trusted unlocks are an absolute (not activity-sliding) two-hour window.
const UNLOCK_TTL_MS = 2 * 60 * 60 * 1000;
const UNLOCK_SESSION_KEY = 'unlockSession.v1';
const UNLOCK_WRAPPING_KEY = 'unlockWrappingKey.v1';
const UNLOCK_REVOCATION_KEY = 'gathered.unlockRevocation';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let cryptoSession = { dek:null, envelope:null, mode:'loading', legacy:null };
let saveChain = Promise.resolve();
let saveRevision = 0;
let draftTimer = 0;
let unlockExpiryTimer = 0;
let unlockClockTimer = 0;
let unlockLastObservedAt = 0;
let unlockChannel = null;
let handlingSessionRevocation = false;

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = value => Uint8Array.from(atob(value), c=>c.charCodeAt(0));
const randomBytes = length => crypto.getRandomValues(new Uint8Array(length));
const sessionLabel = value => value === 'sunday-worship' ? 'Sunday Worship' : value === 'individual-devotion' ? 'Individual Devotion' : 'Small Group';

function estimatePassphrase(passphrase) {
  const value=String(passphrase||''), lower=value.toLowerCase();
  let bits=value.length*3.4;
  if(/\s/.test(value))bits+=Math.min(18,(value.trim().split(/\s+/).length-1)*6);
  if(/[a-z]/.test(value)&&/[A-Z]/.test(value))bits+=5;
  if(/\d/.test(value))bits+=4;
  if(/[^\w\s]/.test(value))bits+=5;
  if(/^(.)\1+$/.test(value)||/12345|abcdef|qwerty|password|letmein|gathered|iloveyou/i.test(lower))bits-=28;
  if(/(.)\1{3,}/.test(value)||/0123|1234|2345|abcd|bcde/i.test(lower))bits-=12;
  bits=Math.max(0,Math.round(bits));
  const label=bits<28?'Weak':bits<40?'Fair':bits<60?'Good':'Strong';
  return {bits,label,acceptable:value.length>=12&&bits>=40};
}

async function deriveKek(passphrase,salt,iterations=KDF_ITERATIONS,usage=['wrapKey','unwrapKey']) {
  const base=await crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,{name:'AES-KW',length:256},false,usage);
}
async function encryptStateSnapshot(snapshot,dek) {
  const iv=randomBytes(12);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},dek,encoder.encode(JSON.stringify(snapshot)));
  return {iv:b64(iv),ciphertext:b64(ciphertext)};
}
async function decryptEnvelope(envelope,dek) {
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(envelope.state.iv)},dek,unb64(envelope.state.ciphertext));
  const parsed=JSON.parse(decoder.decode(plain));
  if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.entries)||!Array.isArray(parsed.members)||!Array.isArray(parsed.prayers)||!Array.isArray(parsed.followUps))throw new Error('Invalid encrypted state');
  return migrateState(parsed);
}
async function makeEnvelope(snapshot,passphrase) {
  const dek=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const salt=randomBytes(16),kek=await deriveKek(passphrase,salt),wrapped=await crypto.subtle.wrapKey('raw',dek,kek,'AES-KW');
  const encrypted=await encryptStateSnapshot(snapshot,dek);
  return {dek,envelope:{format:'gathered-encrypted-state',formatVersion:CRYPTO_FORMAT,schemaVersion:4,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:KDF_ITERATIONS,salt:b64(salt)},wrappedDek:b64(wrapped),state:encrypted,updatedAt:new Date().toISOString()}};
}
async function unlockEnvelope(envelope,passphrase) {
  const k=envelope.kdf,kek=await deriveKek(passphrase,unb64(k.salt),k.iterations);
  const dek=await crypto.subtle.unwrapKey('raw',unb64(envelope.wrappedDek),kek,'AES-KW',{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  return {dek,state:await decryptEnvelope(envelope,dek)};
}

async function getUnlockWrappingKey() {
  let key=await dbGet(UNLOCK_WRAPPING_KEY);
  if(key)return key;
  // IndexedDB structured-clones this non-extractable CryptoKey; its raw key
  // material is never serialized into localStorage or JSON.
  key=await crypto.subtle.generateKey({name:'AES-KW',length:256},false,['wrapKey','unwrapKey']);
  await dbPut(UNLOCK_WRAPPING_KEY,key);
  return key;
}
async function createUnlockSession(dek,now=Date.now()) {
  await clearUnlockSession({broadcast:false});
  const wrappingKey=await getUnlockWrappingKey();
  const wrappedDek=await crypto.subtle.wrapKey('raw',dek,wrappingKey,'AES-KW');
  const record={version:1,authenticatedAt:now,lastSeenAt:now,expiresAt:now+UNLOCK_TTL_MS,wrappedDek:b64(wrappedDek)};
  await dbPut(UNLOCK_SESSION_KEY,record);startUnlockExpiryTimer(record.expiresAt);return record;
}
function validUnlockRecord(record,now) {
  return !!record&&record.version===1&&Number.isFinite(record.authenticatedAt)&&Number.isFinite(record.lastSeenAt)&&Number.isFinite(record.expiresAt)&&typeof record.wrappedDek==='string'&&record.expiresAt-record.authenticatedAt===UNLOCK_TTL_MS&&now>=record.authenticatedAt&&now>=record.lastSeenAt&&now<record.expiresAt;
}
async function restoreUnlockSession(envelope,now=Date.now()) {
  try {
    const record=await dbGet(UNLOCK_SESSION_KEY);
    if(!validUnlockRecord(record,now))throw new Error('Expired, malformed, or clock rollback');
    const wrappingKey=await dbGet(UNLOCK_WRAPPING_KEY);
    if(!wrappingKey)throw new Error('Missing trusted-session wrapping key');
    const dek=await crypto.subtle.unwrapKey('raw',unb64(record.wrappedDek),wrappingKey,'AES-KW',{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
    const restored=await decryptEnvelope(envelope,dek);
    record.lastSeenAt=now;await dbPut(UNLOCK_SESSION_KEY,record);startUnlockExpiryTimer(record.expiresAt);
    return {dek,state:restored,expiresAt:record.expiresAt};
  } catch {await clearUnlockSession({broadcast:false});return null;}
}
async function clearUnlockSession({broadcast=true}={}) {
  clearTimeout(unlockExpiryTimer);clearInterval(unlockClockTimer);unlockExpiryTimer=0;unlockClockTimer=0;unlockLastObservedAt=0;
  try{await dbDelete(UNLOCK_SESSION_KEY);}catch{}
  if(broadcast)broadcastUnlockRevocation();
}
async function flushPendingDraftSaves() {
  clearTimeout(draftTimer);draftTimer=0;
  if(cryptoSession.mode==='unlocked'&&cryptoSession.dek)await saveState();
  await saveChain;
}
async function lockGathered({flush=true,broadcast=true}={}) {
  if(handlingSessionRevocation)return;
  handlingSessionRevocation=true;
  try{if(flush)await flushPendingDraftSaves();}catch{}finally{
    await clearUnlockSession({broadcast});state=defaultState();cryptoSession.dek=null;cryptoSession.mode='locked';
    location.hash='';render();handlingSessionRevocation=false;
  }
}
function startUnlockExpiryTimer(expiresAt) {
  clearTimeout(unlockExpiryTimer);clearInterval(unlockClockTimer);const now=Date.now(),remaining=expiresAt-now;unlockLastObservedAt=now;
  if(remaining<=0){void lockGathered();return;}
  unlockExpiryTimer=setTimeout(()=>void lockGathered(),remaining);
  unlockClockTimer=setInterval(()=>{const observed=Date.now();if(observed<unlockLastObservedAt||observed>=expiresAt){void lockGathered();return;}unlockLastObservedAt=observed;},30000);
}
function broadcastUnlockRevocation() {
  const signal=String(Date.now())+'-'+Math.random();
  try{unlockChannel?.postMessage({type:'revoke',signal});}catch{}
  try{localStorage.setItem(UNLOCK_REVOCATION_KEY,signal);}catch{}
}
function initializeUnlockCoordination() {
  if(typeof BroadcastChannel==='function'){unlockChannel=new BroadcastChannel('gathered-trusted-unlock');unlockChannel.onmessage=e=>{if(e.data?.type==='revoke')void lockGathered({broadcast:false});};}
  window.addEventListener('storage',e=>{if(e.key===UNLOCK_REVOCATION_KEY)void lockGathered({broadcast:false});});
}
initializeUnlockCoordination();

// Serialized snapshots ensure an older encryption operation can never overwrite a newer save.
saveState = function () {
  if(!cryptoSession.dek)return Promise.reject(new Error('Gathered is locked'));
  state.version=4;
  const snapshot=structuredClone(state),revision=++saveRevision;
  saveChain=saveChain.catch(()=>{}).then(async()=>{
    const encrypted=await encryptStateSnapshot(snapshot,cryptoSession.dek);
    const envelope={...cryptoSession.envelope,schemaVersion:4,state:encrypted,revision,updatedAt:new Date().toISOString()};
    await dbPut(ENVELOPE_KEY,envelope);
    cryptoSession.envelope=envelope;
  }).catch(error=>{void lockGathered({flush:false});throw error;});
  return saveChain;
};

loadState = async function () {
  const envelope=await dbGet(ENVELOPE_KEY);
  if(envelope){const restored=await restoreUnlockSession(envelope);if(restored){cryptoSession={dek:restored.dek,envelope,mode:'unlocked',legacy:null};return restored.state;}cryptoSession={dek:null,envelope,mode:'locked',legacy:null};return defaultState();}
  await clearUnlockSession({broadcast:false});
  let legacy=await dbGet(STATE_KEY);
  if(!legacy){const raw=localStorage.getItem(LEGACY_STORAGE_KEY);if(raw){try{legacy=JSON.parse(raw);}catch{legacy=null;}}}
  cryptoSession={dek:null,envelope:null,mode:'setup',legacy:legacy?migrateState(legacy):null};
  return legacy?migrateState(legacy):defaultState();
};

function securityFrame(title,body){return `<div class="security-screen"><section class="security-card"><img class="onboarding-logo" src="icons/icon-192.png" alt="Gathered"><div class="hero"><div class="eyebrow">Private by design</div><h1>${title}</h1></div>${body}</section></div>`;}
function setupScreen(){document.getElementById('app').innerHTML=securityFrame('Protect Gathered',`<form id="securitySetup" class="card form"><p class="subtle">Create a long, memorable app-wide passphrase. Your journal, sessions, members, prayers, follow-ups, and drafts will be encrypted on this device.</p><div class="field"><label for="newPass">New passphrase</label><input class="input" id="newPass" type="password" autocomplete="new-password" required minlength="12"><div class="strength-track"><div id="strengthBar" class="strength-bar"></div></div><small id="strengthText">Enter at least 12 characters.</small></div><div class="field"><label for="confirmPass">Confirm passphrase</label><input class="input" id="confirmPass" type="password" autocomplete="new-password" required></div><label class="inline"><input id="showPass" type="checkbox"> Show passphrase</label><div class="notice"><strong>Gathered cannot recover your passphrase.</strong> If you forget it and do not have another way to unlock your data, your encrypted data cannot be recovered.</div><label class="inline"><input id="ackRecovery" type="checkbox" required> I understand that Gathered cannot recover my data.</label><div id="setupError" class="warning" role="alert"></div><button class="btn primary block">Encrypt and Continue</button></form>`);bindSetup();}
function bindStrength(input,bar,text){const update=()=>{const result=estimatePassphrase(input.value);bar.style.width=`${Math.min(100,result.bits/70*100)}%`;bar.className=`strength-bar ${result.label.toLowerCase()}`;text.textContent=`${result.label} · estimated ${result.bits} bits. Longer memorable phrases are best.`;};input.addEventListener('input',update);update();}
function bindSetup(){const form=document.getElementById('securitySetup'),p=document.getElementById('newPass'),c=document.getElementById('confirmPass');bindStrength(p,document.getElementById('strengthBar'),document.getElementById('strengthText'));document.getElementById('showPass').onchange=e=>{p.type=c.type=e.target.checked?'text':'password';};form.onsubmit=async e=>{e.preventDefault();const error=document.getElementById('setupError'),strength=estimatePassphrase(p.value);if(!strength.acceptable){error.textContent='Choose a stronger passphrase of at least 12 characters.';return;}if(p.value!==c.value){error.textContent='Passphrases do not match.';return;}const button=form.querySelector('button');button.disabled=true;button.textContent='Encrypting…';try{const initial=migrateState(cryptoSession.legacy||state),made=await makeEnvelope(initial,p.value);await dbPut(ENVELOPE_KEY,made.envelope);const verified=await unlockEnvelope(await dbGet(ENVELOPE_KEY),p.value);cryptoSession={dek:verified.dek,envelope:made.envelope,mode:'unlocked',legacy:null};state=verified.state;await createUnlockSession(verified.dek);await dbDelete(STATE_KEY);localStorage.removeItem(LEGACY_STORAGE_KEY);location.hash=state.group?'#home':'';render();}catch{error.textContent='Encryption setup could not be completed. Your existing data was not removed.';button.disabled=false;button.textContent='Encrypt and Continue';}};}
function lockScreen(message=''){document.getElementById('app').innerHTML=securityFrame('Unlock Gathered',`<form id="unlockForm" class="card form"><p class="subtle">Enter your app-wide passphrase to decrypt your data on this device.</p><div class="notice"><strong>Trusted for two hours.</strong> This is an absolute window from authentication, not extended by activity. Anyone using this unlocked browser profile can reopen Gathered during that time.</div><div class="field"><label for="unlockPass">Passphrase</label><input class="input" id="unlockPass" type="password" autocomplete="current-password" required autofocus></div><label class="inline"><input id="showUnlock" type="checkbox"> Show passphrase</label><div id="unlockError" class="warning" role="alert">${esc(message)}</div><button class="btn primary block">Unlock</button></form>`);const form=document.getElementById('unlockForm'),p=document.getElementById('unlockPass');document.getElementById('showUnlock').onchange=e=>p.type=e.target.checked?'text':'password';form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('button');btn.disabled=true;btn.textContent='Unlocking…';try{const unlocked=await unlockEnvelope(cryptoSession.envelope,p.value);cryptoSession.dek=unlocked.dek;cryptoSession.mode='unlocked';state=unlocked.state;await createUnlockSession(unlocked.dek);location.hash=state.group?'#home':'';render();}catch{lockScreen('Incorrect passphrase');}};}

const baseRender=render;
render=function(){if(cryptoSession.mode==='loading')return;if(cryptoSession.mode==='setup'){setupScreen();return;}if(cryptoSession.mode==='locked'){lockScreen();return;}baseRender();};

// Session presentation excludes drafts from completed history and search/home derived views.
entryListItem=function(e){return `<a class="list-item clickable ${e.status==='draft'?'draft-card':''}" href="#${e.status==='draft'?'entry/'+e.id+'/edit':'entry/'+e.id}" style="text-decoration:none"><div class="list-main"><div><span class="pill type-pill">${sessionLabel(e.sessionType)}</span>${e.status==='draft'?'<span class="pill">Draft</span>':''}</div><strong>${esc(e.scripture||sessionLabel(e.sessionType)+' Session')}</strong><div class="meta">${fmtDate(e.date)}${e.status==='draft'&&e.updatedAt?' · Edited '+new Date(e.updatedAt).toLocaleString():''}</div></div><span>›</span></a>`;};
entriesPage=function(){const drafts=state.entries.filter(e=>e.status==='draft').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')),completed=state.entries.filter(e=>e.status!=='draft').sort((a,b)=>b.date.localeCompare(a.date));return shell(`<div class="page"><div class="section-title"><div><div class="eyebrow">History</div><h1>Sessions</h1></div><a class="btn primary small" href="#entry/new">＋ New</a></div><section><div class="section-title"><h2>Draft Sessions</h2><span class="pill">${drafts.length}</span></div>${drafts.length?`<div class="list">${drafts.map(e=>`<div>${entryListItem(e)}<div class="inline"><a class="btn small secondary" href="#entry/${e.id}/edit">Resume Draft</a><button class="btn small danger" data-delete-draft="${esc(e.id)}">Delete Draft</button></div></div>`).join('')}</div>`:'<div class="empty">No drafts. Starting a session creates one automatically.</div>'}</section><section class="section"><div class="section-title"><h2>Completed session history</h2><span class="pill">${completed.length}</span></div>${completed.length?`<div class="list">${completed.map(entryListItem).join('')}</div>`:'<div class="empty">No completed sessions yet.</div>'}</section></div>`,'entries');};
const originalHomePage=homePage;
homePage=function(){const drafts=state.entries.filter(e=>e.status==='draft'),all=state.entries;state.entries=all.filter(e=>e.status!=='draft');let html=originalHomePage();state.entries=all;if(drafts.length)html=html.replace('<a class="fab-card"',`<div class="notice"><a href="#entries"><strong>You have ${drafts.length} Draft Session${drafts.length===1?'':'s'}.</strong> Resume where you left off.</a></div><a class="fab-card"`);return html;};
const originalBindSearch=bindSearch;
bindSearch=function(){const all=state.entries;state.entries=all.filter(e=>e.status!=='draft');originalBindSearch();state.entries=all;};

function sessionTypePicker(){return shell(`<div class="page"><div class="hero"><div class="eyebrow">New Session</div><h1>What are you gathering for?</h1><p class="subtle">Choose a session type. A saved draft is created as soon as you choose, and you can change the type later.</p></div><div class="choice-grid"><button class="session-choice" data-session-choice="small-group"><strong>Small Group</strong><span>Gather around Scripture, community, and shared prayer.</span></button><button class="session-choice" data-session-choice="sunday-worship"><strong>Sunday Worship</strong><span>Capture the sermon, worship reflections, prayer, and next steps.</span></button><button class="session-choice" data-session-choice="individual-devotion"><strong>Individual Devotion</strong><span>Record personal Scripture study, reflection, prayer, and next steps.</span></button></div></div>`,'entries');}
function createDraft(type){const now=new Date().toISOString(),draft={id:uid('entry'),sessionType:type,status:'draft',date:todayISO(),scripture:'',translation:state.settings.translation||'NIV',journal:'',prayerIds:[],followUpIds:[],draftData:{newPrayers:[],prayerUpdates:[],followUps:[]},createdAt:now,updatedAt:now};state.entries.push(draft);return saveState().then(()=>{location.hash=`#entry/${draft.id}/edit`;render();});}

const oldEntryEditor=entryEditor;
entryEditor=function(id){const e=state.entries.find(x=>x.id===id);if(!e)return oldEntryEditor(id);const html=oldEntryEditor(id);return html.replace(`<div class="field"><label for="entryDate">`,`<div class="field"><label for="sessionType">Session type</label><select class="select" id="sessionType"><option value="small-group" ${e.sessionType==='small-group'?'selected':''}>Small Group</option><option value="sunday-worship" ${e.sessionType==='sunday-worship'?'selected':''}>Sunday Worship</option><option value="individual-devotion" ${e.sessionType==='individual-devotion'?'selected':''}>Individual Devotion</option></select></div><div class="save-indicator" id="saveIndicator" role="status">${e.status==='draft'?'Draft · Saved':'Completed session'}</div><div class="field"><label for="entryDate">`).replace(' value="'+esc(e.scripture)+'" placeholder',' value="'+esc(e.scripture)+'" placeholder').replace(' id="scripture" value',' id="scripture" '+(e.status==='draft'?'':'required')+' value');};

const originalBindEntryEditor=bindEntryEditor;
bindEntryEditor=function(id){const entry=state.entries.find(e=>e.id===id);originalBindEntryEditor(id);if(!entry)return;const form=document.getElementById('entryForm');if(!form)return;const data=entry.draftData||{newPrayers:[],prayerUpdates:[],followUps:[]};
  // Rehydrate draft-only rows through existing add buttons, then fill their controls.
  const clickFill=(button,rows,selector,fill)=>rows.forEach(item=>{document.getElementById(button).click();fill([...document.querySelectorAll(selector)].at(-1),item);});
  clickFill('addNewPrayer',data.newPrayers||[], '#newPrayerRows .prayer-row',(r,x)=>{r.dataset.id=x.id;r.querySelector('.prayer-member').value=x.memberId||'';r.querySelector('.prayer-text').value=x.text||'';});
  clickFill('addPrayerUpdate',data.prayerUpdates||[], '#prayerUpdateRows .prayer-row',(r,x)=>{r.querySelector('.update-prayer').value=x.prayerId||'';r.querySelector('.update-text').value=x.text||'';r.querySelector('.update-status').value=x.status||'active';});
  if(entry.status==='draft')clickFill('addFollowUp',data.followUps||[], '#followUpRows .followup-row',(r,x)=>{r.dataset.id=x.id;r.querySelector('.followup-text').value=x.text||'';r.querySelector('.followup-member').value=x.memberId||'';r.querySelector('.followup-due').value=x.dueDate||'';r.querySelector('.followup-status').value=x.status||'open';});
  const originalSubmit=form.onsubmit;
  const capture=()=>{entry.sessionType=document.getElementById('sessionType')?.value||entry.sessionType;entry.date=document.getElementById('entryDate').value;entry.scripture=document.getElementById('scripture').value;entry.translation=document.getElementById('translation').value;entry.journal=document.getElementById('journal').value;entry.updatedAt=new Date().toISOString();entry.draftData={newPrayers:[...document.querySelectorAll('#newPrayerRows .prayer-row')].map(r=>({id:r.dataset.id||uid('prayer'),memberId:r.querySelector('.prayer-member').value,text:r.querySelector('.prayer-text').value})),prayerUpdates:[...document.querySelectorAll('#prayerUpdateRows .prayer-row')].map(r=>({prayerId:r.querySelector('.update-prayer').value,text:r.querySelector('.update-text').value,status:r.querySelector('.update-status').value})),followUps:[...document.querySelectorAll('#followUpRows .followup-row')].map(r=>({id:r.dataset.id||uid('follow'),text:r.querySelector('.followup-text').value,memberId:r.querySelector('.followup-member').value,dueDate:r.querySelector('.followup-due').value,status:r.querySelector('.followup-status').value}))};};
  const autosave=()=>{if(entry.status!=='draft')return;capture();const indicator=document.getElementById('saveIndicator');if(indicator)indicator.textContent='Saving…';clearTimeout(draftTimer);draftTimer=setTimeout(()=>saveState().then(()=>{if(indicator)indicator.textContent='Draft · Saved';}).catch(()=>{if(indicator){indicator.textContent='Auto-save failed — keep this screen open and retry';indicator.classList.add('warning');}}),700);};
  form.addEventListener('input',autosave);form.addEventListener('change',autosave);form.addEventListener('click',e=>{if(e.target.closest('.row-remove')||e.target.closest('#addNewPrayer,#addPrayerUpdate,#addFollowUp'))setTimeout(autosave);});
  form.onsubmit=async ev=>{if(entry.status!=='draft'){entry.sessionType=document.getElementById('sessionType')?.value||entry.sessionType;return originalSubmit.call(form,ev);}ev.preventDefault();capture();const scripture=document.getElementById('scripture');if(!parseScripture(scripture.value.trim(),document.getElementById('translation').value)){toast('Check the Scripture format');scripture.focus();return;}clearTimeout(draftTimer);await saveState();const recovery=structuredClone(state);entry.status='completed';try{await originalSubmit.call(form,ev);}catch{state=recovery;const recovered=state.entries.find(x=>x.id===entry.id);if(recovered)recovered.status='draft';document.getElementById('saveIndicator').textContent='Could not finalize — your draft remains saved';document.getElementById('saveIndicator').classList.add('warning');}};
};

const oldRender=render;
render=function(){if(cryptoSession.mode!=='unlocked'){oldRender();return;}const route=(location.hash||'#home').slice(1);if(route==='entry/new'){document.getElementById('app').innerHTML=sessionTypePicker();window.scrollTo(0,0);return;}oldRender();};

document.addEventListener('click',async e=>{const choice=e.target.closest('[data-session-choice]');if(choice){choice.disabled=true;await createDraft(choice.dataset.sessionChoice);return;}const del=e.target.closest('[data-delete-draft]');if(del&&(await appModal.confirm('Delete this draft session? This cannot be undone.',{title:'Delete draft',confirmLabel:'Delete',destructive:true})).confirmed){state.entries=state.entries.filter(x=>x.id!==del.dataset.deleteDraft);await saveState();render();return;}const deletePrayer=e.target.closest('[data-delete-prayer-request]');if(deletePrayer&&(await appModal.confirm('Delete this prayer request? This will permanently delete the request and all of its updates. This cannot be undone.',{title:'Delete prayer request',confirmLabel:'Delete',destructive:true})).confirmed){const id=deletePrayer.dataset.deletePrayerRequest;state.prayers=state.prayers.filter(p=>p.id!==id);state.entries.forEach(s=>{s.prayerIds=(s.prayerIds||[]).filter(x=>x!==id);if(s.draftData)s.draftData.prayerUpdates=(s.draftData.prayerUpdates||[]).filter(x=>x.prayerId!==id);});await saveState();location.hash='#prayers';render();}});

const oldPrayerDetail=prayerDetail;
prayerDetail=function(id){let html=oldPrayerDetail(id);if(id!=='new'&&!location.hash.endsWith('/edit'))html=html.replace('>Update</a>', '>Edit Request</a>');if(id!=='new'&&location.hash.endsWith('/edit'))html=html.replace('</form>',`<button class="btn danger block" type="button" data-delete-prayer-request="${esc(id)}">Delete Prayer Request</button></form>`);return html;};

const oldEntryDetail=entryDetail;
entryDetail=function(id){const entry=state.entries.find(e=>e.id===id);let html=oldEntryDetail(id);if(entry)html=html.replace(`<div class="eyebrow">${fmtDate(entry.date)}</div>`,`<div class="eyebrow">${sessionLabel(entry.sessionType)} · ${fmtDate(entry.date)}</div>`);return html;};

const oldSettingsPage=settingsPage,oldBindSettings=bindSettings;
settingsPage=function(){let html=oldSettingsPage();return html.replace('</div><div class="notice section">',`<div class="settings-row"><div><strong>Change Passphrase</strong><div class="subtle mini">Re-wraps your data key; your data remains intact.</div></div><button class="btn small secondary" id="changePassphrase">Change</button></div><div class="settings-row"><div><strong>Device Unlock</strong><div class="subtle mini">Available only when WebAuthn PRF and platform verification are securely supported.</div></div><button class="btn small ghost" disabled title="Secure PRF capability is not available or has not been verified">Unavailable</button></div><div class="settings-row"><div><strong>Lock Gathered</strong><div class="subtle mini">Immediately revokes the trusted session in every open tab.</div></div><button class="btn small primary" id="lockGathered">Lock</button></div></div><div class="notice section">`).replace('Export backup','Export encrypted backup').replace('Import backup','Import encrypted backup');};
bindSettings=function(){oldBindSettings();document.getElementById('lockGathered').onclick=()=>lockGathered();document.getElementById('changePassphrase').onclick=()=>changePassphraseDialog();document.getElementById('resetApp').onclick=async()=>{if((await appModal.confirm('Reset Gathered? An encrypted safety backup will download first, then all local Gathered data will be deleted.',{title:'Reset Gathered',confirmLabel:'Reset',destructive:true})).confirmed){await downloadBackup('pre-reset',false);await clearUnlockSession();await dbDelete(ENVELOPE_KEY);await dbDelete(STATE_KEY);localStorage.removeItem(LEGACY_STORAGE_KEY);state=defaultState();cryptoSession={dek:null,envelope:null,mode:'setup',legacy:null};location.hash='';render();}};const input=document.getElementById('importData');input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.backupFormat==='gathered-encrypted-backup'&&data.envelope){const passResult=await appModal.password("Enter this backup's passphrase.",{title:'Unlock backup',label:'Backup passphrase',required:true,confirmLabel:'Unlock'});if(!passResult.confirmed)return;const pass=passResult.value;const restored=await unlockEnvelope(data.envelope,pass);if(!(await appModal.confirm(`Restore encrypted backup for “${restored.state.group?.name||'Gathered'}”? Your current encrypted data will be exported first.`,{title:'Restore backup',confirmLabel:'Restore',destructive:true})).confirmed)return;await downloadBackup('pre-import',false);await clearUnlockSession();await dbPut(ENVELOPE_KEY,data.envelope);cryptoSession={dek:restored.dek,envelope:data.envelope,mode:'unlocked',legacy:null};state=restored.state;await createUnlockSession(restored.dek);location.hash='#home';render();toast('Encrypted backup restored');return;}const check=validateBackup(data);if(!check.valid)throw new Error(check.errors.join('\n'));if(!(await appModal.confirm('This is an older unencrypted backup. Import it and immediately protect it with your current Gathered encryption?',{title:'Import legacy backup',confirmLabel:'Import',destructive:true})).confirmed)return;await downloadBackup('pre-import',false);state=migrateState(data);await saveState();location.hash='#home';render();toast('Legacy backup imported and encrypted');}catch{await appModal.error('The backup could not be decrypted or validated. Check its passphrase and file.',{title:'Restore failed'});}};};
async function changePassphraseDialog(){
  const currentResult=await appModal.password('Enter your current passphrase.',{title:'Change passphrase',label:'Current passphrase',required:true,confirmLabel:'Continue'});if(!currentResult.confirmed)return;
  const nextResult=await appModal.password('Use at least 12 characters and a long, memorable phrase.',{title:'Choose a new passphrase',label:'New passphrase',required:true,confirmLabel:'Continue'});if(!nextResult.confirmed)return;
  if(!estimatePassphrase(nextResult.value).acceptable){await appModal.error('Choose a stronger passphrase.',{title:'Passphrase too weak'});return;}
  const confirmation=await appModal.password('Enter the new passphrase again.',{title:'Confirm new passphrase',label:'Confirm passphrase',required:true,confirmLabel:'Change passphrase'});if(!confirmation.confirmed)return;
  if(nextResult.value!==confirmation.value){await appModal.error('Passphrases do not match.',{title:'Passphrase not changed'});return;}
  try{const {dek}=await unlockEnvelope(cryptoSession.envelope,currentResult.value);const salt=randomBytes(16),kek=await deriveKek(nextResult.value,salt),wrapped=await crypto.subtle.wrapKey('raw',dek,kek,'AES-KW');const candidate={...cryptoSession.envelope,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:KDF_ITERATIONS,salt:b64(salt)},wrappedDek:b64(wrapped)};await dbPut(ENVELOPE_KEY,candidate);await unlockEnvelope(await dbGet(ENVELOPE_KEY),nextResult.value);cryptoSession.envelope=candidate;await lockGathered();toast('Passphrase changed — unlock again to start a new trusted session');}catch{await appModal.error('Incorrect current passphrase. No changes were made.',{title:'Passphrase not changed'});}
}

// Backups export the same authenticated encrypted envelope; no user content is serialized in plaintext.
downloadBackup=async function(label='backup',mark=true){if(mark){state.settings.lastBackupAt=new Date().toISOString();await saveState();}await saveChain;const backup={backupFormat:'gathered-encrypted-backup',backupVersion:1,exportedAt:new Date().toISOString(),envelope:cryptoSession.envelope};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=backupFilename(label);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};

APP_ASSETS.push('crypto.js');
window.GatheredTest={estimatePassphrase,encryptStateSnapshot,migrateState,sessionLabel,UNLOCK_TTL_MS,createUnlockSession,restoreUnlockSession,clearUnlockSession,validUnlockRecord,lockGathered};

function flushDraftSave(){if(cryptoSession.mode==='unlocked'&&cryptoSession.dek){clearTimeout(draftTimer);saveState().catch(()=>{});}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushDraftSave();});
window.addEventListener('pagehide',flushDraftSave);
