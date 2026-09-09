const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

function helperContext(overrides={}){
  const context={console,Promise,Error,Number,Math,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},window:{},...overrides};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('diary-image.js','utf8'),context);
  return context;
}

for(const [label,input,expected] of [
  ['landscape phone photo',[4032,3024],[256,192]],
  ['portrait phone photo',[3024,4032],[192,256]],
  ['square photo',[1200,1200],[256,256]],
  ['small image',[200,150],[200,150]],
])test(`${label} is sized correctly`,()=>{
  const result=helperContext().window.GatheredDiaryImage.diaryImageDimensions(...input);
  assert.deepEqual([result.width,result.height],expected);
  assert.ok(result.width<=256&&result.height<=256);
  assert.ok(result.width<=input[0]&&result.height<=input[1]);
  assert.ok(Math.abs(result.width/result.height-input[0]/input[1])<0.01);
});

test('orientation-normalized decoded dimensions determine portrait output',async()=>{
  let closed=false,drawn;
  const canvas={width:0,height:0,getContext(){return {drawImage(_source,_x,_y,w,h){drawn=[w,h]}}},toBlob(callback,type){callback(new Blob(['processed'],{type}))}};
  const c=helperContext({Blob,document:{createElement(){return canvas}},createImageBitmap:async(_file,options)=>{assert.equal(options.imageOrientation,'from-image');return {width:3024,height:4032,close(){closed=true}}}});
  const result=await c.window.GatheredDiaryImage.prepareDiaryImage({type:'image/jpeg',name:'phone.jpg'});
  assert.deepEqual([result.width,result.height],[192,256]);assert.deepEqual(drawn,[192,256]);assert.equal(result.mimeType,'image/webp');assert.equal(closed,true);
});

test('transparent input falls back to PNG when WebP encoding fails',async()=>{
  const types=[];
  const canvas={getContext(){return {drawImage(){}}},toBlob(callback,type){types.push(type);callback(type==='image/webp'?null:new Blob(['png'],{type}))}};
  const c=helperContext({Blob,document:{createElement(){return canvas}},createImageBitmap:async()=>({width:50,height:40,close(){}})});
  const result=await c.window.GatheredDiaryImage.prepareDiaryImage({type:'image/png',name:'alpha.png'});
  assert.deepEqual(types,['image/webp','image/png']);assert.equal(result.mimeType,'image/png');
});

test('diary image processing is wired before encrypted persistence and remains sequential',()=>{
  const source=fs.readFileSync('diary.js','utf8');
  assert.match(source,/await GatheredDiaryImage\.prepareDiaryImage\(file\).*await putDiaryMedia\(id,stored\)/s);
  assert.doesNotMatch(source,/Promise\.all\(files\.map/);
  assert.match(source,/type:isImage\?'image':'video'/);
  assert.match(source,/state\.diaryEntries=previousEntries/);
});

test('image processor loads before Diary and is available offline',()=>{
  const index=fs.readFileSync('index.html','utf8'),worker=fs.readFileSync('sw.js','utf8');
  assert.ok(index.indexOf('diary-image.js')<index.indexOf('diary.js'));
  assert.match(worker,/APP_SHELL=.*'diary-image\.js'/);
});
