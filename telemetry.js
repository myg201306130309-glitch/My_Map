(function(){
 'use strict';
 let metricsConsent=false,session=crypto.randomUUID(),enabled=true,experiment=configuredExperiment();
 const events=[],feedback=[],once=new Set(),config=window.WC_CONFIG;
 function configuredExperiment(){return window.WC_CONFIG.experimentId;}
 const endpoint=(()=>{try{if(!config.privacyContact?.trim())return null;const u=new URL(config.collectorUrl);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash?u.origin+u.pathname.replace(/\/$/,''):null;}catch{return null;}})();
 async function post(path,payload){
  if(!endpoint)return {saved:false,local:true};
  try{const r=await fetch(endpoint+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();return {saved:true,local:false};}catch{return {saved:false,local:false};}
 }
 function reset(){metricsConsent=false;enabled=true;session=crypto.randomUUID();events.length=0;feedback.length=0;once.clear();}
 async function record(name){
  if(!metricsConsent||!enabled||!WCPilot.EVENTS.includes(name))return;
  if(['journey_started','journey_completed'].includes(name)&&once.has(name))return;once.add(name);
  const e={event_id:crypto.randomUUID(),session_id:session,experiment_id:experiment,name,consent:true,consent_version:'1.0',created_at:new Date().toISOString()};events.push(e);const status=await post('/event',e);e.delivery=status.saved?'received':status.local?'local':'failed';
 }
 async function submitFeedback(value,consent){
  if(!consent)throw Error('피드백 제공에 동의해 주세요.');
  if(!['yes','partly','no'].includes(value.helpful)||!['yes','no','not_yet'].includes(value.acted)||!['immediate','followup'].includes(value.stage)||!['none','unclear','time','cost','fit','other','known','inaccurate'].includes(value.barrier))throw Error('피드백 항목을 확인해 주세요.');
  if(value.session_id&&!WCPilot.UUID.test(value.session_id))throw Error('참여 코드를 확인해 주세요.');
  const f={event_id:crypto.randomUUID(),session_id:value.session_id||session,experiment_id:experiment,helpful:value.helpful,acted:value.acted,barrier:value.barrier,stage:value.stage,consent:true,consent_version:'1.0',created_at:new Date().toISOString()};
  const status=await post('/feedback',f);feedback.push({...f,delivery:status.saved?'received':status.local?'local':'failed'});return status;
 }
 window.WCResearch={setExperiment:id=>{if(!(config.experimentIds||[config.experimentId]).includes(id))throw Error('실험 코드가 유효하지 않습니다.');experiment=id;},record,submitFeedback,reset,id:()=>session,allow:yes=>{metricsConsent=!!yes;},suspend:()=>{enabled=false;},status:()=>({configured:!!endpoint,consent:metricsConsent,enabled}),export:()=>({schema:'wc-pilot-export-1',source:'browser_local',events:events.map(e=>({...e})),feedback:feedback.map(f=>({...f})),orders:[]})};
})();
