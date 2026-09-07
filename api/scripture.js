'use strict';

const BIBLE_IDS={NIV:111,ESV:59,NKJV:114,NLT:116,KJV:1};
const buckets=new Map();
const WINDOW_MS=60_000;
const MAX_REQUESTS=Number(process.env.SCRIPTURE_RATE_LIMIT||30);

function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}
function plainText(value=''){return String(value).replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;/g,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();}
function validPassageId(value){return typeof value==='string'&&/^(?:[1-3][A-Z]{2}|[A-Z]{3})\.[1-9]\d{0,2}(?:\.[1-9]\d{0,2}(?:-(?:[1-3][A-Z]{2}|[A-Z]{3})\.[1-9]\d{0,2}\.[1-9]\d{0,2})?)?$/.test(value);}
function allowedTranslations(){return new Set((process.env.SCRIPTURE_ALLOWED_TRANSLATIONS||'NIV').split(',').map(x=>x.trim().toUpperCase()).filter(x=>BIBLE_IDS[x]));}
function limited(req){const key=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(),now=Date.now();const recent=(buckets.get(key)||[]).filter(time=>now-time<WINDOW_MS);recent.push(now);buckets.set(key,recent);return recent.length>MAX_REQUESTS;}

async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(limited(req))return send(res,429,{error:'Too many Scripture requests; please try again shortly.'});
  const {passageId,translation,...extra}=req.body||{};
  if(Object.keys(extra).length||!validPassageId(passageId))return send(res,400,{error:'Invalid passage identifier'});
  const normalizedTranslation=typeof translation==='string'?translation.toUpperCase():'';
  if(!allowedTranslations().has(normalizedTranslation))return send(res,400,{error:'Unsupported translation'});
  const credential=process.env.YOUVERSION_API_KEY;
  if(!credential)return send(res,503,{error:'Licensed Scripture provider is not configured'});
  try{
    const upstream=await fetch(`https://api.youversion.com/v1/bibles/${BIBLE_IDS[normalizedTranslation]}/passages/${encodeURIComponent(passageId)}?format=text`,{headers:{'X-YVP-App-Key':credential,'Accept':'application/json'}});
    if(!upstream.ok)return send(res,upstream.status===429?429:502,{error:'Licensed Scripture provider request failed'});
    const data=await upstream.json(),record=data.data||data,text=plainText(record.content||record.text),reference=plainText(record.reference||passageId);
    if(!text)return send(res,502,{error:'Licensed Scripture provider returned no text'});
    const notice=plainText(record.copyright||data.copyright||process.env.SCRIPTURE_COPYRIGHT_NOTICE||`${normalizedTranslation} text provided under license.`);
    return send(res,200,{reference,translation:normalizedTranslation,text,notice});
  }catch(error){return send(res,502,{error:'Licensed Scripture provider is unavailable'});}
}

module.exports=handler;
module.exports._test={validPassageId,plainText,allowedTranslations,buckets};
