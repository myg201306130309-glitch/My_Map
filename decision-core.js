(function(root){'use strict';
function number(v){if(v===undefined||v===null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
function cash(v){const keys=['incomeA','incomeB','fixedA','fixedB','extraA','extraB'];const n=keys.map(k=>number(v[k]));if(n.some(x=>x===null))return null;const [ia,ib,fa,fb,ea,eb]=n;return {a:ia-fa-ea,b:ib-fb-eb,change:(ib-fb-eb)-(ia-fa-ea)};}
function hours(v){const keys=['workA','workB','commuteA','commuteB','extraHoursA','extraHoursB'];const n=keys.map(k=>number(v[k]));if(n.some(x=>x===null))return null;const a=n[0]+n[2]+n[4],b=n[1]+n[3]+n[5];if(a>168||b>168)return null;return {a,b,change:b-a};}
function minutes(s){if(!/^\d\d:\d\d$/.test(s||''))return null;const [h,m]=s.split(':').map(Number);return h<24&&m<60?h*60+m:null;}
function gap(arrive,care){const a=minutes(arrive),b=minutes(care);return a===null||b===null?null:Math.max(0,a-b);}
function questions(d,s){const t=d.topics[s.topic],a=s.answers[s.topic]||{},extra=t.followups?.[a[t.questions[0].id]];return extra?[t.questions[0],extra,...t.questions.slice(1)]:t.questions;}
function plan(d,s){const t=d.topics[s.topic];if(!t||!d.personas[s.persona]?.stages[s.stage]?.topics.includes(s.topic))throw Error('선택한 상황에서 사용할 수 없는 경로입니다');const answers=s.answers[s.topic]||{};const first=t.questions[0];const variant=t.variants[answers[first.id]];const actions=variant?[variant,...t.actions.slice(1)]:[...t.actions];
const follow=t.followups?.[answers[first.id]],detail=follow?.options.find(o=>o.id===answers[follow.id])?.label;
if(detail)actions.push('추가 확인 항목: '+follow.title+'에 “'+detail+'”라고 답하셨습니다. 아래 비교표에 이를 뒷받침하는 사실과 확인할 대상을 함께 남기세요.');
if(s.topic==='role'&&answers.support==='2')actions.push('혼자 맡아야 한다면 질문할 담당자·적응 기간·평가 유예를 협의 항목에 넣으세요. 지원이 없다면 맡을 수 있는 업무 범위를 결정 전에 확인하세요.');
if(s.topic==='care'&&answers.backup==='3')actions.push('현재 돌봄 대안이 없으므로, 새 근무시간과 돌봄 시간이 겹치면 해소 조건이 확인될 때까지 그 공백을 미해결로 표시하세요.');
if(s.topic==='loss'&&answers.bridge==='3')actions.push('조정 여유가 거의 없다고 답하셨으므로, 필수 지출 부족을 감당할 수 있다고 가정하지 말고 확정 보상과 시작 시기부터 확인하세요.');
if(s.topic==='stay'&&answers.internal==='2')actions.push('이미 내부 조정을 요청했다면 같은 요청을 반복하기보다 이전 답변·바뀌지 않은 조건을 남기고 외부 선택지와 비교하세요.');
return {...t,actions,reason:questions(d,s).map(q=>({question:q.title,answer:q.options.find(o=>o.id===answers[q.id])?.label||'미확인'}))};}
const api={number,cash,hours,gap,questions,plan};root.MyMapDecision=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
