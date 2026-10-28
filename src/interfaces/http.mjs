import http from 'node:http';import crypto from 'node:crypto';
import {approvalContract} from '../approvals/approval-contract.mjs';
export function createMatcherHttpServer(matcher,{token,allowOnline=false,maxBytes=65536,maxConcurrent=2}={}){
 if(!Number.isInteger(maxBytes)||maxBytes<1||maxBytes>1_048_576||!Number.isInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>4)throw new Error('INVALID_HTTP_LIMITS');
 let running=0;
 const server=http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value));};
  if(req.headers.origin){send(403,{error:'ORIGIN_NOT_ALLOWED'});return;}
  if(!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/u.test(req.headers.host||'')&&!token){send(403,{error:'HOST_NOT_ALLOWED'});return;}
  if(token){const a=Buffer.from(req.headers.authorization||''),b=Buffer.from('Bearer '+token);if(a.length!==b.length||!crypto.timingSafeEqual(a,b)){send(401,{error:'UNAUTHORIZED'});return;}}
  if(running>=maxConcurrent){send(429,{error:'BUSY'});return;}running++;
  try{
   if(req.method==='GET'&&req.url==='/health'){send(200,{status:'ok',name:'coz-sw-matcher',version:'0.2.0',mode:allowOnline?'online':'offline'});return;}
   if(req.method==='GET'&&req.url==='/v1/approval-contract'){send(200,approvalContract);return;}
   if(req.method!=='POST'||req.url!=='/v1/match'){send(404,{error:'NOT_FOUND'});return;}
   if(!/^application\/json(?:;|$)/iu.test(req.headers['content-type']||'')){send(415,{error:'JSON_REQUIRED'});return;}
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes){send(413,{error:'BODY_TOO_LARGE'});return;}chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{send(400,{error:'INVALID_JSON'});return;}
   send(200,await matcher.match(body,{online:allowOnline}));
  }catch{if(!res.writableEnded)send(400,{error:'INVALID_REQUEST'});}finally{running--;}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.timeout=45000;return server;
}
