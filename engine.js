(function(root){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 class Journey {
  constructor(data,common,providers){this.data=data;this.common=common;this.providers=providers;this.history=[];this.state=null;}
  start(category,node){if(!this.data[category])throw Error('카테고리가 없습니다');this.history=[];this.state={category,node:node||this.data[category].entry,answers:[],prefs:{},pending:null,mode:'question',cross:null};}
  save(){this.history.push(copy(this.state));}
  back(){if(!this.history.length)return false;this.state=this.history.pop();return true;}
  question(){return this.state.mode==='common'?this.common.questions[this.state.node]:this.data[this.state.category].questions[this.state.node];}
  choose(index){
   const s=this.state,q=this.question();if(!q)throw Error('질문이 없습니다');
   if(s.mode==='common'){
    const o=q.options[index];if(!o)throw Error('선택지가 없습니다');this.save();s.prefs[q.field]=o[0];
    const next={M1:o[0]==='none'?'M3':'M2',M2:'M3',M3:'M4',M4:'M5',M5:null}[s.node];
    if(next)s.node=next;else s.mode='result';return;
   }
   if(s.mode!=='question')throw Error('질문 단계가 아닙니다');
   const o=q.options[index];if(!o)throw Error('선택지가 없습니다');this.save();
   s.answers.push({category:s.category,node:s.node,question:q.text,answer:o.label,option:o.id});
   if(o.cross){s.cross=copy(o.cross);s.mode='cross';return;}
   if(o.next){s.node=o.next;return;}
   this.finish(o.result);
  }
  confirmCross(){const s=this.state;if(s.mode!=='cross')return;const d=s.cross;
   if(!this.data[d.category]?.questions[d.node])throw Error('연결 질문이 없습니다');
   this.save();s.category=d.category;s.node=d.node;s.mode='question';s.cross=null;s.prefs={};s.pending=null;
  }
  finish(key){const s=this.state;const r=this.data[s.category].solutions[key];if(!r)throw Error('결과가 없습니다: '+key);s.pending=key;s.mode=r.urgent?'result':'common';s.node=r.urgent?s.node:'M1';}
  safety(key){this.save();this.finish(key);}
  changeFormat(){if(!this.state.pending||this.result().urgent)return;this.save();this.state.mode='common';this.state.node='M3';}
  result(){return this.data[this.state.category].solutions[this.state.pending];}
  recommendation(){
   const s=this.state,r=this.result(),p=s.prefs;
   let providers=[];const exclusions=[];
   if(r.urgent)return {providers,exclusions:['보호·평가 경로에는 상업 링크를 표시하지 않습니다.']};
   const minor=s.category==='C18'||s.answers.some(a=>a.category==='C14'&&a.node==='START'&&a.answer==='학교');
   for(const [id,v] of Object.entries(this.providers)){
    if(!(r.provider_tags||[]).includes(v.tag))continue;
    let reason='';
    if(v.status!=='official_scope_checked')reason='제공 범위 확인 전';
    else if(minor&&!v.minor_ok)reason='청소년 적합성 미확인';
    else if(p.cost!=='paid'&&v.cost!=='free')reason='무료만 선택: 비용 발생 가능 후보 제외';
    else if(v.format!==p.format)reason='선택한 도움 형식과 다름';
    else if(p.attempt===v.format&&p.barrier&&p.barrier!=='continue')reason='이미 맞지 않았던 형식의 재추천 제외';
    else if(p.barrier==='cost'&&v.cost!=='free')reason='이전 비용 부담을 반영해 유료 후보 제외';
    else if(p.access==='local')reason='사용 지역·현장 제공 조건 미확인';
    else if(p.access==='online'&&!v.online)reason='온라인 제공 조건 미확인';
    else if(p.access==='time'&&!v.flexible)reason='유연한 일정 제공 미확인';
    else if(p.access==='privacy'&&!v.privacy_verified)reason='익명성·자료 보관 조건 미확인';
    else if(s.budget&&v.cost!=='free')reason='입력 예산 이내의 실제 상품 가격 미확인';
    if(reason)exclusions.push(v.name+': '+reason);else providers.push({id,...v});
   }
   return {providers:providers.slice(0,3),exclusions};
  }
  summary(){return this.state.answers.map(a=>({...a}));}
  personalized(){
   const s=this.state,r=this.result(),last=s.answers.at(-1),text=s.answers.map(a=>a.answer).join(' / ');
   let today=r.today,why=r.reason;
   if(r.id==='delivery'){
    if(/요리할 시간|준비 시간이/.test(text)){why='요리 시간을 확보하기 어렵다고 하셔서 식사 준비 시간을 줄이는 방법을 제안합니다.';today='먼저 식사를 받을 수 있는 시간과 보관 공간을 확인하세요. 그다음 알레르기·1회 예산에 맞춰 직접 준비와 배송을 비교하세요.';}
    else {why='매번 메뉴를 고르는 부담을 줄이고 싶다고 하셔서 선택 횟수를 줄이는 식사 지원을 제안합니다.';today='선호하는 메뉴와 피하고 싶은 재료를 먼저 적으세요. 그다음 주간 선택 수·보관 조건·배송 총비용을 비교하세요.';}
   }
   if(r.id==='routine'&&/잊어버/.test(text)){why='실행을 잊는 장면이 있어 눈에 보이는 시작 단서를 먼저 정합니다.';today='이미 매일 하는 행동 뒤에 작은 과제를 붙이고 필요한 물건을 보이는 곳에 놓아보세요.';}
   if(r.id==='routine'&&/빠지면 포기/.test(text)){why='하루 빠진 뒤 전체를 포기하는 흐름을 바꾸기 위해 재시작 규칙을 제안합니다.';today='“하루 빠지면 다음 가능한 날 최소 행동 하나만 한다”를 적고 연속 기록 압박은 줄이세요.';}
   if(r.id==='feedback'&&/기준/.test(text)){today='작업물 한 개와 판단 기준을 묻는 질문을 준비하세요. “이 결과에서 필수 조건과 개선할 한 가지는 무엇인가요?”라고 물어보세요.';}
   if(r.id==='blog'&&/가사·돌봄/.test(text)){why='돌봄 중 나누어 쓰는 시간과 글쓰기 선호를 반영했습니다. 살림 주제로 한정하지 않습니다.';today='이전 경력이나 관심 분야에서 설명할 질문 하나를 골라 짧은 메모로 나누어 작성해보세요.';}
   if(r.id==='talk'&&/연락/.test(text))today='각자 편한 연락 빈도와 답이 늦을 때의 기대를 적고, 부담 없는 연락 방식 하나를 제안하세요.';
   if(r.id==='worktalk'&&/모호/.test(text))today='목적·완료 조건·마감의 세 항목으로 지시를 요약하고 맞게 이해했는지 확인하세요.';
   if(r.id==='worktalk'&&/과도|업무량/.test(text))today='현재 업무의 예상 시간과 마감을 적고, 새 업무를 넣으려면 무엇을 미룰지 선택을 요청하세요.';
   if(last)why+=' “'+last.question+'”에서 “'+last.answer+'” 항목을 선택하신 점도 반영했습니다.';
   if(s.prefs.attempt==='feedback')why+=' 기존 전문 도움은 중단하지 않고 이 결과를 다음 상담·피드백에서 논의할 자료로 사용하세요.';
   return {today,why};
  }
 }
 function salary(amount,years,rate){if(!Number.isFinite(amount)||amount<=0||amount>1e8||!Number.isInteger(years)||years<1||years>50)throw Error('연봉과 기간을 확인하세요');return amount*Math.pow(1+rate,years);}
 root.MNEngine={Journey,salary};if(typeof module!=='undefined')module.exports=root.MNEngine;
})(typeof window==='undefined'?globalThis:window);
