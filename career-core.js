(function(root){'use strict';
function summary(data,a){const q=id=>data.questions.find(q=>q.id===id),label=(id,v)=>q(id).options.find(o=>o[0]===v)?.[1]||'';return [data.personas[a.persona]?.label,label('stage',a.stage),`이미 확인한 것: ${(a.known||[]).map(v=>label('known',v)).join(', ')}`,`아직 막힌 점: ${label('blocker',a.blocker)}`,`지켜야 할 조건: ${label('constraint',a.constraint)}`,`오늘 원하는 변화: ${label('goal',a.goal)}`];}
function plan(data,a,advanced=false){if(!data.personas[a.persona]||!data.plans[a.blocker])throw Error('상황과 막힌 지점을 다시 선택해 주세요.');const p=data.plans[a.blocker],known=new Set(a.known||[]);let today=p[a.persona];
if(a.blocker==='direction'&&known.has('criteria'))today='이미 정한 기준 중 서로 충돌하는 두 가지를 고르고, 어느 조건까지 양보할 수 있는지 적어보세요.';
if(a.blocker==='reality'&&known.has('roles'))today='이미 조사한 직무 정보에서 출처가 서로 다르거나 직접 확인하지 못한 주장 한 가지를 고르세요.';
if(a.blocker==='execution'&&a.stage==='acting')today=p[a.persona]+' 새 정보를 더 찾기 전에 기존 자료에서 검증할 가설 하나를 만드세요.';
if(advanced)today='이미 해본 행동에서 예상과 달랐던 점 하나를 골라, 판단이 달라질 조건과 확인 방법을 적으세요.';
const limit={time:'오늘 10분 안에 적을 수 있는 한 항목만 선택하세요.',money:'유료 서비스나 퇴사 결정을 전제로 하지 말고, 추가 지출 없는 확인부터 진행하세요.',care:'돌봄·생활 일정에 실제로 넣을 수 있는 시간 한 구간을 정하세요.',privacy:'회사명·동료명·민감한 사정을 제외하고 익명화한 장면으로 정리하세요.',none:'이번 주에 실행 가능한 범위로 행동 하나를 정하세요.'}[a.constraint];
return {...p,today,limit,summary:summary(data,a),proof:a.evidence==='direct'?'이미 경험한 장면에서 좋았던 조건과 어려웠던 조건을 분리하세요. 한 장면만으로 전체 직무의 적합성을 단정하지 마세요.':p.proof,goal:a.goal==='clarify'?'먼저 “나는 ___를 결정하려는데 ___가 확인되지 않아 막혀 있다”를 완성하세요.':a.goal==='compare'?'선택지 두 개에 같은 기준을 적용하고, 근거가 없는 칸은 미확인으로 남기세요.':'가장 작은 행동 하나와 실행할 시점을 정하세요.'};}
const api={summary,plan};root.MyMapCareer=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
