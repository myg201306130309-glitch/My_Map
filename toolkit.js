(function(){
 'use strict';const drafts={};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function download(name,text,type='text/plain;charset=utf-8'){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 function field(form,label,key,value='',type='text',onchange=()=>{}){const l=el('label',label),i=el(type==='textarea'?'textarea':'input');if(type!=='textarea')i.type=type;i.name=key;i.value=value;i.maxLength=500;if(type==='number'){i.min='0';i.max='168';i.step='0.5';}i.addEventListener('input',()=>onchange(i.value));l.append(i);form.append(l);return i;}
 function select(form,label,key,options,value,onchange=()=>{}){const l=el('label',label),s=el('select');s.name=key;for(const [val,t] of options){const o=el('option',t);o.value=val;s.append(o);}s.value=value;s.onchange=()=>onchange(s.value);l.append(s);form.append(l);return s;}
 function render(type,parent,context={}){
  const titles={workload:'업무량·마감 협의표',boundary:'거절·보류 문장 만들기',decision:'직무·환경 선택 비교표'};
  const descriptions={workload:'한 주에 가능한 시간과 실제 업무를 함께 놓고, 조정이 필요한 부분을 확인합니다.',boundary:'가능한 범위와 원하는 답변을 구체적인 말로 바꿉니다.',decision:'현재 자리 유지, 역할 조정, 새로운 직무 탐색을 본인에게 중요한 기준으로 비교합니다.'};
  const box=el('section',undefined,'panel');box.append(el('span','무료 · 입력 내용은 외부로 보내지 않습니다','badge'),el('h2',titles[type]),el('p',descriptions[type],'muted'),el('p','회사명·동료 이름·기밀 자료는 입력하지 마세요. 업무는 간단한 별칭으로 적어도 충분합니다.','fine'));
  const form=el('form');form.noValidate=true;box.append(form);let d=drafts[type];
  if(!d)d=drafts[type]=type==='workload'?{capacity:'',rows:[{task:'',hours:'',deadline:'',priority:'우선순위 협의 필요'},{task:'',hours:'',deadline:'',priority:'우선순위 협의 필요'},{task:'',hours:'',deadline:'',priority:'우선순위 협의 필요'}]}:type==='boundary'?{request:'',limit:'',alternative:'',when:'',mode:'pause'}:{options:['현재 역할 유지','내부 역할·환경 조정','다른 직무 탐색'],criteria:['생활 안정성','업무 적합성','회복 가능한 시간'],weights:['3','3','3'],scores:[['','',''],['','',''],['','','']],next:''};
  if(type==='workload'){
   field(form,'이번 주 실제 가용 시간(시간)','capacity',d.capacity,'number',v=>d.capacity=v);
   d.rows.forEach((r,k)=>{const row=el('div',undefined,'task-row');field(row,`업무 ${k+1}`,`task${k}`,r.task,'text',v=>r.task=v);field(row,`업무 ${k+1} 예상 시간`,`hours${k}`,r.hours,'number',v=>r.hours=v);field(row,`업무 ${k+1} 마감`,`deadline${k}`,r.deadline,'text',v=>r.deadline=v);select(row,`업무 ${k+1} 우선순위`,`priority${k}`,['우선순위 협의 필요','기한 고정','범위 조정 가능','분담 가능'].map(x=>[x,x]),r.priority,v=>r.priority=v);form.append(row);});
  }else if(type==='boundary'){
   select(form,'어떤 답변을 준비하시나요?','mode',[['pause','즉답 보류'],['decline','이번 요청 거절'],['partial','가능한 부분만 수락'],['renegotiate','이미 한 수락 수정']],d.mode,v=>d.mode=v);
   field(form,'받은 요청','request',d.request,'text',v=>d.request=v);field(form,'나의 제약 또는 가능한 범위','limit',d.limit,'text',v=>d.limit=v);field(form,'답변할 시점(선택)','when',d.when,'text',v=>d.when=v);field(form,'가능한 대안(선택)','alternative',d.alternative,'text',v=>d.alternative=v);
  }else{
   d.options.forEach((v,i)=>field(form,`선택지 ${i+1}`,`option${i}`,v,'text',x=>d.options[i]=x));const wrap=el('div',undefined,'table-wrap'),table=el('table');const head=el('tr');['비교 기준','중요도 0~5','선택지 1 점수','선택지 2 점수','선택지 3 점수'].forEach(x=>head.append(el('th',x)));table.append(head);
   d.criteria.forEach((c,k)=>{const row=el('tr');const td=el('td');field(td,`기준 ${k+1}`,`criterion${k}`,c,'text',v=>d.criteria[k]=v);row.append(td);const wt=el('td');select(wt,`기준 ${k+1} 중요도`,`weight${k}`,[0,1,2,3,4,5].map(x=>[String(x),String(x)]),d.weights[k],v=>d.weights[k]=v);row.append(wt);d.options.forEach((_,i)=>{const cell=el('td');select(cell,`선택지 ${i+1} 기준 ${k+1}`,`score${i}_${k}`,[['','미확인'],...[0,1,2,3,4,5].map(x=>[String(x),String(x)])],d.scores[i][k],v=>d.scores[i][k]=v);row.append(cell);});table.append(row);});wrap.append(table);form.append(wrap);field(form,'다음에 확인할 작은 행동(선택)','next',d.next,'textarea',v=>d.next=v);
  }
  const submit=el('button','내 실행표 만들기','primary');submit.type='submit';const error=el('p','','error');error.setAttribute('role','status');form.append(submit,error);const result=el('div');box.append(result);
  form.onsubmit=e=>{e.preventDefault();try{const value=WCPilot[type](d);error.textContent='';result.replaceChildren(el('h3','작성된 실행표'),el('div',value.text,'output'));const actions=el('div',undefined,'actions');const copy=el('button','문장 복사');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(value.text);error.className='success';error.textContent='복사했습니다.';}catch{error.textContent='자동 복사가 제한되어 있습니다. 실행표를 내려받아 주세요.';}};
   const down=el('button','실행표 내려받기');down.type='button';down.onclick=()=>{download('MyMap-'+type+'.txt',value.text+'\n\n선택적 후속 의견 참여 코드: '+WCResearch.id()+'\n7일 뒤 실제로 해봤는지, 도움이 됐는지 사이트의 이용 후 의견에서 남겨주세요. 자동 알림은 보내지 않습니다.');if(context.track)WCResearch.record('plan_downloaded');};actions.append(copy,down);result.append(actions);if(context.track)WCResearch.record('tool_generated');}catch(err){error.className='error';error.textContent=err.message;}};
  parent.append(box);
 }
 window.WCTools={render,download,clear:()=>{Object.keys(drafts).forEach(k=>delete drafts[k]);}};
})();
