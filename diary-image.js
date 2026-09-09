/* Local, metadata-stripping preparation for newly attached diary photos. */
const DIARY_IMAGE_MAX_DIMENSION=256;
const DIARY_IMAGE_WEBP_QUALITY=0.82;

function diaryImageDimensions(width,height,maxDimension=DIARY_IMAGE_MAX_DIMENSION){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('The image has invalid dimensions.');
  const scale=Math.min(1,maxDimension/width,maxDimension/height);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale)),scale};
}

function canvasBlob(canvas,type,quality){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error(`Could not encode the image as ${type}.`)),type,quality));
}

async function decodeDiaryImage(file){
  if(typeof createImageBitmap==='function'){
    try{
      const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      return {source:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close?.()};
    }catch(_error){/* HTMLImageElement is a broadly supported, orientation-aware fallback. */}
  }
  const url=URL.createObjectURL(file),image=new Image();
  try{
    image.decoding='async';image.src=url;await image.decode();
    return {source:image,width:image.naturalWidth,height:image.naturalHeight,release:()=>URL.revokeObjectURL(url)};
  }catch(error){
    URL.revokeObjectURL(url);
    throw new Error(`Could not decode ${file.name||'this image'}.`,{cause:error});
  }
}

async function prepareDiaryImage(file){
  const decoded=await decodeDiaryImage(file);
  let canvas;
  try{
    const dimensions=diaryImageDimensions(decoded.width,decoded.height);
    canvas=document.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.height;
    const context=canvas.getContext('2d',{alpha:true});
    if(!context)throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(decoded.source,0,0,dimensions.width,dimensions.height);
    let blob;
    try{blob=await canvasBlob(canvas,'image/webp',DIARY_IMAGE_WEBP_QUALITY);}catch(_webpError){
      const mayHaveAlpha=/^image\/(png|webp|gif)$/i.test(file.type);
      blob=await canvasBlob(canvas,mayHaveAlpha?'image/png':'image/jpeg',mayHaveAlpha?undefined:DIARY_IMAGE_WEBP_QUALITY);
    }
    return {blob,width:dimensions.width,height:dimensions.height,mimeType:blob.type||'image/png'};
  }finally{
    decoded.release();
    if(canvas){canvas.width=0;canvas.height=0;canvas=null;}
  }
}

window.GatheredDiaryImage={DIARY_IMAGE_MAX_DIMENSION,DIARY_IMAGE_WEBP_QUALITY,diaryImageDimensions,prepareDiaryImage};
