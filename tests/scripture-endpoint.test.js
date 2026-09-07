const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/scripture');

function response(){return{headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=JSON.parse(body)}}}
test('endpoint validates passages and translation allowlist',async()=>{
  process.env.SCRIPTURE_ALLOWED_TRANSLATIONS='NIV';
  let res=response();await handler({method:'POST',headers:{},socket:{remoteAddress:'bad-1'},body:{passageId:'../../secret',translation:'NIV'}},res);assert.equal(res.statusCode,400);
  res=response();await handler({method:'POST',headers:{},socket:{remoteAddress:'bad-2'},body:{passageId:'JHN.3.16',translation:'ESV'}},res);assert.equal(res.statusCode,400);assert.equal(res.body.error,'Unsupported translation');
});

test('endpoint keeps credential server-side and returns normalized licensed text',async()=>{
  process.env.YOUVERSION_API_KEY='server-secret';process.env.SCRIPTURE_ALLOWED_TRANSLATIONS='NIV';
  const original=global.fetch;let upstream;
  global.fetch=async(url,options)=>{upstream={url,options};return{ok:true,json:async()=>({data:{reference:'John 3:16',content:'<b> For God </b>  loved',copyright:'NIV license notice'}})}};
  try{const res=response();await handler({method:'POST',headers:{},socket:{remoteAddress:'ok-1'},body:{passageId:'JHN.3.16',translation:'NIV'}},res);assert.equal(res.statusCode,200);assert.equal(res.body.text,'For God loved');assert.equal(res.body.notice,'NIV license notice');assert.equal(upstream.options.headers['X-YVP-App-Key'],'server-secret');assert.doesNotMatch(JSON.stringify(res.body),/server-secret/);}finally{global.fetch=original;delete process.env.YOUVERSION_API_KEY;}
});
