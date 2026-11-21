(function(root){
 'use strict';
 const safeURL=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password?u:null;}catch{return null;}};
 const toolFor=id=>['workload','worktalk','evidence'].includes(id)?'workload':['boundary','pause','family','talk'].includes(id)?'boundary':['career','values','feedback','selfworth','skill','goal'].includes(id)?'decision':null;
 function number(x,name,max=10000){if(String(x).trim()==='')throw Error(name+'을 입력해 주세요.');const v=Number(x);if(!Number.isFinite(v)||v<0||v>max)throw Error(name+'은 0~'+max+' 사이의 수로 입력해 주세요.');return v;}
 const clean=x=>String(x??'').trim().slice(0,1000);
 function workload(input){
  const capacity=number(input.capacity,'가용 시간',168),rows=input.rows.map(r=>({task:clean(r.task),hours:number(r.hours,'예상 시간',168),deadline:clean(r.deadline),priority:clean(r.priority)}));
  if(rows.some(r=>!r.task||!r.deadline))throw Error('업무 이름과 마감을 모두 입력해 주세요.');
  const total=rows.reduce((s,r)=>s+r.hours,0),gap=Math.max(0,total-capacity),hours=n=>Math.round(n*10)/10;
  return {total,gap,text:['업무량·마감 협의표',...rows.map(r=>`${r.task} · ${r.hours}시간 · 마감 ${r.deadline} · ${r.priority}`),`이번 주 가용 시간: ${capacity}시간 / 예상 업무: ${hours(total)}시간`,gap?`현재 추정으로 ${hours(gap)}시간이 초과합니다. 업무 범위·마감·분담 중 조정할 항목을 확인하세요.`:'입력한 시간 안에는 들어옵니다. 누락 업무·중간 방해·여유 시간은 별도로 확인하세요.',`협의 문장: “현재 진행 중인 업무는 ${rows.map(r=>r.task).join(', ')}입니다. 예상 소요는 ${hours(total)}시간이고 가용 시간은 ${capacity}시간입니다. 어떤 업무를 우선하고, 무엇의 범위나 마감을 조정할지 확인하고 싶습니다.”`,'다음 확인: 합의한 업무·마감·보류 항목을 다시 적어두세요. 기록은 회사의 자료 보관 규정에 맞춰 관리하세요.'].join('\n\n')};
 }
 function boundary(input){const request=clean(input.request),limit=clean(input.limit),alternative=clean(input.alternative),when=clean(input.when);
  if(!request||!limit)throw Error('받은 요청과 가능한 범위를 입력해 주세요.');
  const scripts={pause:`“${request}에 대해서는 지금 바로 답하기 어렵습니다. ${when||'가능 여부를 확인한 뒤'} 말씀드리겠습니다.”`,decline:`“요청하신 ${request}는 ${limit} 때문에 이번에는 맡기 어렵습니다.”`,partial:`“${request} 전체는 어렵지만, 제가 가능한 범위는 ${limit}입니다.”`,renegotiate:`“앞서 ${request}를 맡겠다고 말씀드렸지만, 다시 확인하니 ${limit}라는 제약이 있습니다. 범위나 기한을 다시 협의하고 싶습니다.”`};
  if(!scripts[input.mode])throw Error('문장의 목적을 선택해 주세요.');
  return {text:['거절·보류·수락 수정 문장',scripts[input.mode],alternative?`선택적 대안: “대신 ${alternative}는 가능합니다.”`:'대안은 의무가 아닙니다. 가능하지 않은 도움을 약속하지 않아도 됩니다.','내 기준: 상대를 설득하는 긴 설명보다 가능한 범위와 다음 답변 시점을 명확히 합니다.','실행 전: 실제 보복·위협이 우려된다면 직접 전달을 미루고 안전한 지원 경로부터 확인하세요.'].join('\n\n')};
 }
 function decision(input){
  const options=input.options.map(clean);if(options.length!==3||options.some(x=>!x))throw Error('비교할 선택지 세 가지를 입력해 주세요.');
  if(input.criteria?.length!==3||input.weights?.length!==3||input.scores?.length!==3||input.scores.some(row=>row.length!==3))throw Error('비교 기준과 점수는 각각 세 가지여야 합니다.');
  const criteria=input.criteria.map(clean);if(criteria.some(x=>!x))throw Error('중요한 기준 세 가지를 입력해 주세요.');
  const weights=input.weights.map(x=>number(x,'중요도',5));if(weights.every(x=>x===0))throw Error('중요도를 한 가지 이상 1 이상으로 정해 주세요.');
  const scores=options.map((_,i)=>input.scores[i].map(x=>{if(x==='')return null;return number(x,'점수',5);}));
  const complete=scores.every(row=>row.every(x=>x!==null));
  const totals=scores.map(row=>row.reduce((sum,v,i)=>sum+(v??0)*weights[i],0));
  const text=['직무·환경 선택 비교표',`중요한 기준: ${criteria.map((c,i)=>`${c}(중요도 ${weights[i]})`).join(', ')}`,...options.map((o,i)=>`${o}: ${criteria.map((c,k)=>`${c} ${scores[i][k]===null?'미확인':scores[i][k]+'/5'}`).join(' / ')}`),complete?`가중 합계: ${options.map((o,i)=>`${o} ${totals[i]}점`).join(' / ')}. 본인이 넣은 점수를 정리한 값이며, 퇴사·이직의 정답이나 성공 확률이 아닙니다.`:'미확인 항목이 있어 합계 순위는 제시하지 않습니다. 확인해야 할 사실을 먼저 알아보세요.',`작은 검증 행동: ${clean(input.next)||'가장 중요한 미확인 조건 하나를 담당자·현직자·공식 자료에서 확인합니다.'}`,'결정 전: 생활비·준비 기간·안전·가족 조건 등 점수 밖의 필수 조건을 함께 확인하세요.'];
  return {text:text.join('\n\n'),complete,totals};
 }
 function offersFor(offers,context,now=new Date()){
  if(context.urgent||!context.workEligible)return [];
  return offers.filter(o=>{
   const price=typeof o.priceKRW==='number'&&Number.isFinite(o.priceKRW)&&o.priceKRW>=0;
   if(o.status!=='active'||o.verification!=='checked'||!price||!safeURL(o.url)||!o.name||!o.provider||!o.deliverable||!o.duration||!o.refundTerms||!o.eligibility)return false;
   const valid=new Date(o.validUntil);if(!Number.isFinite(valid.valueOf())||valid<now)return false;
   if(o.partnership!=='contracted'||!o.contractRef||!['code_reconcile','partner_callback'].includes(o.attribution))return false;
   if(!o.resultTypes?.includes(context.resultId)||o.format!==context.prefs.format)return false;
   if(context.prefs.cost!=='paid'&&o.priceKRW!==0)return false;
   if(context.budget!==null&&context.budget!==undefined&&o.priceKRW>context.budget)return false;
   if(context.prefs.attempt===o.format&&context.prefs.barrier&&context.prefs.barrier!=='continue')return false;
   if(context.prefs.barrier==='cost'&&o.priceKRW>0)return false;
   if(context.prefs.access==='online'&&o.delivery!=='online')return false;
   if(context.prefs.access==='local')return false; // 실제 지역 입력·검증 전 지역 적합 추천 금지
   if(context.prefs.access==='time'&&!o.flexible)return false;
   if(context.prefs.access==='privacy'&&!o.privacyVerified)return false;
   return /^[a-z0-9_]{1,32}$/.test(o.id);
  }).sort((a,b)=>a.priceKRW-b.priceKRW).slice(0,3);
 }
 const EVENTS=['journey_started','journey_completed','tool_opened','tool_generated','plan_downloaded','offer_opened'];
 const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 function metrics(events,feedback=[],orders=[],costs={}){
  const validDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
  const unique=[...new Map(events.filter(e=>EVENTS.includes(e.name)&&UUID.test(e.event_id)&&UUID.test(e.session_id)&&e.consent===true).map(e=>[e.event_id,e])).values()];
  const starters=new Set(unique.filter(e=>e.name==='journey_started').map(e=>e.session_id));
  const sessions=name=>new Set(unique.filter(e=>e.name===name&&starters.has(e.session_id)).map(e=>e.session_id));
  const completed=sessions('journey_completed');
  const fb=[...new Map(feedback.filter(f=>completed.has(f.session_id)&&f.consent===true&&['immediate','followup'].includes(f.stage)&&['yes','partly','no'].includes(f.helpful)&&validDate(f.received_at||f.created_at)).sort((a,b)=>Date.parse(a.received_at||a.created_at)-Date.parse(b.received_at||b.created_at)).map(f=>[f.session_id+':'+f.stage,f])).values()];
  const immediate=fb.filter(f=>f.stage==='immediate'),followup=fb.filter(f=>f.stage==='followup');
  const latest=new Map();for(const o of orders){if(!o.order_id||!validDate(o.updated_at))continue;const old=latest.get(o.order_id);if(!old||Date.parse(o.updated_at)>=Date.parse(old.updated_at))latest.set(o.order_id,o);}
  const amount=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
  const confirmed=[...latest.values()].filter(o=>o.verified===true&&['settled','refunded'].includes(o.status)&&starters.has(o.session_id)&&amount(o.commission_krw)&&amount(o.refund_krw)&&o.refund_krw<=o.commission_krw&&(o.status!=='refunded'||o.refund_krw===o.commission_krw));
  const net=confirmed.reduce((sum,o)=>sum+o.commission_krw-o.refund_krw,0);
  const costKnown=amount(costs.acquisition)&&amount(costs.variable);
  return {starts:starters.size,completed:completed.size,tools:sessions('tool_generated').size,offerClicks:sessions('offer_opened').size,known:immediate.filter(f=>f.barrier==='known').length,inaccurate:immediate.filter(f=>f.barrier==='inaccurate').length,fit:immediate.filter(f=>f.barrier==='fit').length,feedback:immediate.length,helpful:immediate.filter(f=>f.helpful==='yes').length,followup:followup.length,acted:followup.filter(f=>f.acted==='yes').length,orders:confirmed.filter(o=>o.status==='settled'&&o.commission_krw>o.refund_krw).length,net,contribution:costKnown?net-costs.acquisition-costs.variable:null,reportedLaborHours:amount(costs.hours)?costs.hours:null,ignoredOrders:latest.size-confirmed.length};
 }
 const api={workload,boundary,decision,offersFor,toolFor,metrics,EVENTS,UUID,safeURL};root.WCPilot=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
