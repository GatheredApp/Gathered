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
});

test('authorized proxy receives only normalized passage id and translation',async()=>{
  let request;
  const api=loadClient(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({reference:'John 3:16–17',text:'Plain text',notice:'Licensed'})}});
  assert.equal(await api.fetchScriptureText('John 3:16-17','NIV',{}),'John 3:16–17 (NIV)\nPlain text');
  assert.deepEqual(JSON.parse(request.options.body),{passageId:'JHN.3.16-JHN.3.17',translation:'NIV'});
  assert.equal(request.url,'/api/scripture');
});

test('no proxy provider is distinguished and unsupported translations are rejected',async()=>{
  const api=loadClient(async()=>({ok:false,status:503,json:async()=>({})}));
  await assert.rejects(api.fetchScriptureText('John 3:16','NIV',{}),error=>error.code==='NO_PROVIDER');
  await assert.rejects(api.fetchScriptureText('John 3:16','BOGUS',{}),/Unsupported translation/);
});

test('request cancellation and API errors propagate without producing text',async()=>{
  const aborted=new Error('cancelled');aborted.name='AbortError';
  const cancelled=loadClient(async()=>{throw aborted});
  await assert.rejects(cancelled.fetchScriptureText('Psalm 23','NIV',{},new AbortController().signal),{name:'AbortError'});
  const failed=loadClient(async()=>({ok:false,status:500}));
  await assert.rejects(failed.fetchScriptureText('Psalm 23','NIV',{}),/500/);
});

test('editor requires opt-in KJV and preserves journal notes and stale references',()=>{
  assert.match(source,/useKjvFallback/);
  assert.match(source,/translation\.value='KJV'/);
  assert.match(source,/if\(journal\.value===''/);
  assert.match(source,/scripture\.value\.trim\(\)!==reference/);
  assert.doesNotMatch(source,/bible\.com[^`]*fetch/);
});

