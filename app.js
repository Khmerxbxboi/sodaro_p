'use strict';
// Training-only classification: QR recognition of three printed examples.
// It intentionally does not claim to use machine learning or inspect arbitrary photos.
const CASES={
  '01':{
    status:'FAIL',type:'Food safety',title:'Handwashing sink is blocked',
    description:'Dishes, a bucket, and a cloth are stored in a sink intended for employee handwashing. The sink is obstructed and cannot be reserved for handwashing.',
    law:'California Health & Safety Code § 113953.1(a)-(b)',
    url:'https://codes.findlaw.com/ca/health-and-safety-code/hsc-sect-113953-1/',
    actions:['Remove all utensils, containers, and cloths from the handwashing sink.','Keep the handwashing station clean, accessible, and used only for handwashing.','Verify working water, soap, and sanitary hand drying supplies.'],
    warning:'Training assessment of a visible issue. An inspector would verify the full setup and conditions on site.'
  },
  '02':{
    status:'FAIL',type:'Electrical safety',title:'Electrical box is missing its cover',
    description:'The electrical wall box is visibly open. An uncovered box with wiring may present contact and maintenance hazards. The photograph cannot determine whether any conductor is energized.',
    law:'California Code of Regulations, Title 8, § 2473.2(a)',
    url:'https://www.dir.ca.gov/Title8/2473_2.html',
    actions:['Keep people away from the damaged or open electrical enclosure.','Ask a qualified electrician to assess wiring and install an approved cover or faceplate.','Check with the local building department about applicable permits and electrical requirements.'],
    warning:'This is an illustrative electrical-safety reference, not an official City of Oakland violation determination. Do not touch exposed wiring.'
  },
  '03':{
    status:'PASS',type:'Food safety',title:'Prep station looks visually clean',
    description:'The pictured prep counter appears tidy and free of obvious visible debris. For this single training check, no clear visual problem is apparent.',
    law:'California Health & Safety Code § 114115(a)',
    url:'https://law.justia.com/codes/california/code-hsc/division-104/part-7/chapter-5/section-114115/',
    actions:['Continue regular cleaning and sanitizing procedures.','Verify food-contact surfaces are clean to sight and touch.','Confirm actual sanitization, safe temperatures, and other requirements separately.'],
    warning:'PASS means only this visible training check. Clean-looking photos do not prove safe sanitizing, temperatures, approved permits, or an official inspection pass.'
  }
};
const $=id=>document.getElementById(id);
const state={stream:null,timer:null,processing:false,lastCase:null,lastSource:null,lastPreview:null};
let announceTimer;
function hint(message,kind='normal') { const el=$('scanner-hint'); el.textContent=message; el.style.color=kind==='error'?'#ff9eaa':kind==='ok'?'#55e3aa':'#b0bfd0'; }
function cameraStatus(message){$('camera-status').textContent=message;}
function setCameraVisual(mode){
  $('idle-screen').hidden=mode!=='idle';$('camera-video').hidden=mode!=='live';$('photo-preview').hidden=mode!=='photo';
  $('live-corners').hidden=mode!=='live';$('scanline').hidden=mode!=='live';
  $('reset-camera').hidden=mode==='idle';
}
function stopCamera(){
  if(state.timer){clearTimeout(state.timer);state.timer=null;}
  if(state.stream){state.stream.getTracks().forEach(track=>track.stop());state.stream=null;}
  const video=$('camera-video');video.srcObject=null;
  $('live-button').textContent='▣   Scan live';
}
function reset(){stopCamera();setCameraVisual('idle');cameraStatus('READY');hint('Your photo stays on your phone. No server upload.');
 $('empty-result').hidden=false;$('result-content').hidden=true;state.lastCase=null;state.lastSource=null;
 $('capture-input').value='';$('upload-input').value=''; if(state.lastPreview){URL.revokeObjectURL(state.lastPreview);state.lastPreview=null;}}
function showResult(id,source){
  const data=CASES[id];if(!data)return;
  stopCamera();state.lastCase=id;state.lastSource=source;
  $('empty-result').hidden=true;$('result-content').hidden=false;
  const banner=$('result-banner');banner.classList.toggle('fail',data.status==='FAIL');
  $('result-symbol').textContent=data.status==='FAIL'?'✕':'✓';
  $('result-label').textContent=data.status==='FAIL'?'POTENTIAL ISSUE DETECTED':'VISUAL TRAINING CHECK';
  $('result-status').textContent=data.status==='FAIL'?'FAIL':'PASS · VISUAL ONLY';
  $('result-origin').textContent=`SAMPLE ${id}   •   ${source==='qr'?'QR SCAN':source==='marker'?'PHOTO MARKER SCAN':'MANUAL DEMO'}   •   ${data.type.toUpperCase()}`;
  $('result-title').textContent=data.title;$('result-description').textContent=data.description;
  $('result-law').textContent=data.law;
  $('result-law-link').href=data.url;
  const ul=$('result-actions');ul.replaceChildren();
  data.actions.forEach(v=>{const li=document.createElement('li');li.textContent=v;ul.appendChild(li);});
  $('result-warning').textContent=data.warning;
  cameraStatus(data.status==='FAIL'?'ISSUE FOUND':'CHECK COMPLETE');
  hint(source==='qr'||source==='marker'?`Scanned practice card ${id} successfully. The printed training marker selects the prepared result.`:`Opened practice sample ${id} without scanning. Try the printed card to test your phone camera.`,'ok');
  $('reset-camera').hidden=false;
  if(source==='manual'){$('photo-preview').src=`./assets/case-${id}.jpg`;setCameraVisual('photo');}
  else if($('photo-preview').getAttribute('src'))setCameraVisual('photo');
  document.querySelector('#scanner').scrollIntoView({behavior:'smooth',block:'start'});
}
function getDemoId(raw){
 const val=String(raw||'').trim();const m=val.match(/^SODARO\|DEMO-2026\|CASE-(01|02|03)$/);
 return m?m[1]:null;
}
function qrPixels(canvas){
 if(typeof window.jsQR!=='function')return null;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const data=ctx.getImageData(0,0,canvas.width,canvas.height);
 const code=window.jsQR(data.data,data.width,data.height,{inversionAttempts:'attemptBoth'});
 return code?code.data:null;
}
// Fully offline printed-marker recognition. Three unique high-saturation borders are
// used ONLY to identify the classroom card, not to infer safety from arbitrary photos.
// This supplements QR recognition and works on browsers without BarcodeDetector/jsQR.
const MARKER_HUES={ '01':319, '02':87, '03':265 };
function detectColorMarker(canvas){
  const {width,height}=canvas;
  const pixels=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,width,height).data;
  const scores={'01':0,'02':0,'03':0};
  let sampled=0;
  for(let y=0;y<height;y+=4){
    for(let x=0;x<width;x+=4){
      sampled++;
      const ix=(y*width+x)*4;
      const r=pixels[ix]/255,g=pixels[ix+1]/255,b=pixels[ix+2]/255;
      const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;
      if(hi<.38||d<.33||d/hi<.62)continue;
      let h;
      if(hi===r)h=((g-b)/d)%6;
      else if(hi===g)h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h=(h*60+360)%360;
      for(const [id,target] of Object.entries(MARKER_HUES)){
        const delta=Math.abs(h-target),angle=Math.min(delta,360-delta);
        if(angle<17){scores[id]+=1;break;}
      }
    }
  }
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const [best,runner]=ranked;
  // Reject unrelated pictures and ambiguous mixed-marker photos.
  const floor=Math.max(75,sampled*.0025);
  return best[1]>floor&&best[1]>runner[1]*2.1?best[0]:null;
}
let detector=null;
async function detectMarker(canvas){
  // Native QR if available, otherwise offline color-marker detection.
  if('BarcodeDetector' in window){
    try{
      if(!detector)detector=new BarcodeDetector({formats:['qr_code']});
      const matches=await detector.detect(canvas);
      for(const match of matches){if(getDemoId(match.rawValue))return match.rawValue;}
    }catch(err){ /* Safari/Chrome variants may expose the API without QR support. */ }
  }
  const qr=qrPixels(canvas);
  if(getDemoId(qr))return qr;
  const colorId=detectColorMarker(canvas);
  return colorId?`SODARO|DEMO-2026|CASE-${colorId}`:null;
}
function imageCanvas(img,maxSize=1800){
 const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,canvas.width,canvas.height);return canvas;
}
async function fileImage(file){
 try{if('createImageBitmap' in window)return await createImageBitmap(file);}catch(err){}
 return await new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot open selected image.'));};img.src=url;});
}
async function analyzeFile(file){
 if(!file)return;
 stopCamera();
 if(!file.type.startsWith('image/')){hint('Please choose or take a picture, not a document or video.','error');return;}
 cameraStatus('ANALYZING');hint('Reading the printed training marker from your picture…');
 if(state.lastPreview)URL.revokeObjectURL(state.lastPreview);
 state.lastPreview=URL.createObjectURL(file);$('photo-preview').src=state.lastPreview;setCameraVisual('photo');
 try{
   const img=await fileImage(file);
   const options=[1800,1100,750];let raw=null;
   for(const sz of options){raw=await detectMarker(imageCanvas(img,sz));if(raw)break;}
   const id=getDemoId(raw);
   if(id){showResult(id,'marker');}
   else{cameraStatus('NOT RECOGNIZED');$('empty-result').hidden=false;$('result-content').hidden=true;
     hint('No Sodaro practice marker was recognized. Retake the photo with the entire colored square and QR code visible, in good lighting. Or tap a sample below.','error');}
 }catch(err){cameraStatus('TRY AGAIN');hint('This image could not be read. Try another picture or the sample buttons.','error');}
}
async function startLive(){
 if(state.stream){stopCamera();setCameraVisual('idle');cameraStatus('READY');hint('Live camera closed.');return;}
 if(!navigator.mediaDevices?.getUserMedia){
   hint('Live camera needs an HTTPS site and browser camera permission. Use Take a photo instead.','error');return;
 }
 stopCamera();
 try{
   state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false});
   const video=$('camera-video');video.srcObject=state.stream;await video.play();
   setCameraVisual('live');cameraStatus('CAMERA LIVE');$('live-button').textContent='■   Stop live camera';
   hint('Hold the colorful square marker fully in the camera frame. Scanning stays on your phone.');
   liveLoop();
 }catch(err){stopCamera();cameraStatus('CAMERA BLOCKED');
   hint('Camera access was blocked or unavailable. Allow camera permission on an HTTPS page or tap “Take a photo.”','error');}
}
async function liveLoop(){
 if(!state.stream||state.processing)return;
 const video=$('camera-video');
 if(video.readyState>=2&&video.videoWidth){
   state.processing=true;
   try{
     const c=document.createElement('canvas');
     const scale=Math.min(1,900/video.videoWidth);c.width=Math.floor(video.videoWidth*scale);c.height=Math.floor(video.videoHeight*scale);
     c.getContext('2d',{willReadFrequently:true}).drawImage(video,0,0,c.width,c.height);
     const raw=await detectMarker(c);const id=getDemoId(raw);
     if(id){$('photo-preview').src=c.toDataURL('image/jpeg',.85);showResult(id,'marker');state.processing=false;return;}
   }catch(err){}
   state.processing=false;
 }
 if(state.stream)state.timer=setTimeout(liveLoop,320);
}
async function copyResult(){
 if(!state.lastCase)return;
 const data=CASES[state.lastCase];const text=`SODARO TRAINING RESULT | Sample ${state.lastCase}\n${data.status}: ${data.title}\n${data.description}\nReference: ${data.law}\nRecommended actions:\n- ${data.actions.join('\n- ')}\n\nNote: ${data.warning}\nClassroom demo; not an official inspection.`;
 try{await navigator.clipboard.writeText(text);$('copy-result').textContent='Copied to clipboard ✓';setTimeout(()=>$('copy-result').textContent='Copy result summary',1800);}
 catch(err){const blob=new Blob([text],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`sodaro-sample-${state.lastCase}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
}
document.querySelectorAll('[data-start-camera]').forEach(el=>el.addEventListener('click',()=>{document.querySelector('#scanner').scrollIntoView({behavior:'smooth',block:'start'});$('capture-input').click();}));
$('take-photo').addEventListener('click',()=>$('capture-input').click());
$('choose-photo').addEventListener('click',()=>$('upload-input').click());
$('live-button').addEventListener('click',startLive);
$('capture-input').addEventListener('change',e=>analyzeFile(e.target.files[0]));
$('upload-input').addEventListener('change',e=>analyzeFile(e.target.files[0]));
$('reset-camera').addEventListener('click',reset);
$('copy-result').addEventListener('click',copyResult);
document.querySelectorAll('[data-demo]').forEach(el=>el.addEventListener('click',()=>showResult(el.dataset.demo,'manual')));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});
window.addEventListener('pagehide',stopCamera);
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
