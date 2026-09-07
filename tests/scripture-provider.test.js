const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function loadClient(fetchImpl){
  const end=source.indexOf('\nfunction canSeedScripture');
  const context={fetch:fetchImpl,DOMParser:class{parseFromString(html){return{body:{textContent:String(html).replace(/<[^>]+>/g,' ')}}}}};
  vm.createContext(context);vm.runInContext(`${source.slice(0,end)};this.api={fetchScriptureText,createScriptureProvider,scripturePassageId};`,context);
  return context.api;
}

test('user-key provider calls YouVersion and normalizes its response',async()=>{
  let request;
  const api=loadClient(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({data:{reference:'John 3:16',content:'<p>For God loved</p>'}})}});
  assert.equal(await api.fetchScriptureText('John 3:16','NIV','personal-key'),'John 3:16 (NIV)\nFor God loved');
  assert.equal(request.options.headers['X-YVP-App-Key'],'personal-key');
  assert.equal(request.options.headers.Accept,'application/json');
});

test('provider proxy receives only normalized passage id and translation',async()=>{
  let request;
  const api=loadClient(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({reference:'John 3:16–17',text:'Plain text',notice:'Licensed'})}});
  assert.equal((await api.createScriptureProvider().fetch('John 3:16-17','NIV')).text,'John 3:16–17 (NIV)\nPlain text');
  assert.deepEqual(JSON.parse(request.options.body),{passageId:'JHN.3.16-JHN.3.17',translation:'NIV'});
  assert.equal(request.url,'/api/scripture');
});

test('public-domain provider normalizes Unicode ranges and returns attributed KJV text',async()=>{
  let request;
  const api=loadClient(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({reference:'James 1:19-20',text:' Wherefore, my beloved brethren,  let every man be swift to hear. '})}});
  const signal=new AbortController().signal;

  const result=await api.createScriptureProvider().fetchPublicDomain('James 1:19–20',signal);

  const requestedUrl=new URL(request.url);
  assert.equal(decodeURIComponent(requestedUrl.pathname.slice(1)),'James 1:19-20');
  assert.equal(requestedUrl.searchParams.get('translation'),'kjv');
  assert.equal(request.options.signal,signal);
  assert.equal(result.text,'James 1:19-20 (KJV)\nWherefore, my beloved brethren, let every man be swift to hear.');
  assert.equal(result.notice,'King James Version (KJV) — public domain.');
});

test('public-domain provider rejects invalid references before requesting',async()=>{
  let requested=false;
  const api=loadClient(async()=>{requested=true;return{ok:true,json:async()=>({})}});

  await assert.rejects(api.createScriptureProvider().fetchPublicDomain('Not a passage'),/Unsupported translation or passage/);
  assert.equal(requested,false);
});

test('explicit credential is required and unsupported translations are rejected',async()=>{
  const api=loadClient(async()=>({ok:false,status:503,json:async()=>({})}));
  await assert.rejects(api.fetchScriptureText('John 3:16','NIV',''),error=>error.code==='NO_PROVIDER');
  await assert.rejects(api.fetchScriptureText('John 3:16','BOGUS','fixture-key'),/Unsupported translation/);
});

test('request cancellation and API errors propagate without producing text',async()=>{
  const aborted=new Error('cancelled');aborted.name='AbortError';
  const cancelled=loadClient(async()=>{throw aborted});
  await assert.rejects(cancelled.fetchScriptureText('Psalm 23','NIV',{},new AbortController().signal),{name:'AbortError'});
  const failed=loadClient(async()=>({ok:false,status:500,json:async()=>({error:'upstream unavailable'})}));
  await assert.rejects(failed.fetchScriptureText('Psalm 23','NIV',{}),/500/);
});

test('authorization failures include safe YouVersion diagnostics without exposing the credential',async()=>{
  const denied=loadClient(async()=>({ok:false,status:403,json:async()=>({message:'Origin is not allowed'})}));
  await assert.rejects(
    denied.fetchScriptureText('John 3:16','NIV','fixture-public-key'),
    error=>error.code==='TRANSLATION_ACCESS'&&error.status===403&&/Origin is not allowed/.test(error.message)&&!error.message.includes('fixture-public-key')
  );
  const unauthorized=loadClient(async()=>({ok:false,status:401,json:async()=>{throw new Error('not json')}}));
  await assert.rejects(unauthorized.fetchScriptureText('John 3:16','NIV','fixture-public-key'),/did not accept the selected application key/);
});

test('editor implements credential precedence, opt-in fallback, note replacement and attribution',()=>{
  assert.match(source,/youVersionApiKey\?\.trim\(\)\|\|globalThis\.PUBLIC_YOUVERSION_APP_KEY/);
  assert.match(source,/appModal\.confirm/);
  assert.match(source,/requestedTranslation==='NIV'&&error\.code==='TRANSLATION_ACCESS'/);
  assert.match(source,/if\(!confirmed/);
  assert.match(source,/fetchScripturePassage\(reference,'KJV'/);
  assert.match(source,/lastVerseBlock&&journal\.value\.startsWith\(lastVerseBlock\)/);
  assert.match(source,/translation\.value=selectedTranslation/);
  assert.match(source,/scripture-attribution/);
  assert.match(source,/fallbackError\.name!=='AbortError'/);
});

test('browser configuration is loaded and precached without copying it into state',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
  const config=fs.readFileSync(path.join(__dirname,'..','public-config.js'),'utf8');
  assert.ok(html.indexOf('public-config.js')<html.indexOf('app.js'));
  assert.match(source,/APP_ASSETS[^\n]+public-config\.js/);
  assert.match(sw,/APP_SHELL[^\n]+public-config\.js/);
  assert.match(config,/intentionally public/);
  assert.doesNotMatch(source,/settings:\{[^}]*PUBLIC_YOUVERSION_APP_KEY/);
});
