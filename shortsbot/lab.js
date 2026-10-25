'use strict';
(function(){
 const data=window.SHORTSBOT_DATA,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>n===null||n===undefined?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
 const platform=p=>p==='youtube'?'YouTube':'Instagram';
 const key='shortsbot.audience.experiments.v1';
 const validStatuses=['planejado','em_observacao','avaliado','arquivado'];
 let experiments=[];
 function validExperiment(x){return Boolean(x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=100&&typeof x.title==='string'&&x.title.length>0&&x.title.length<=200&&validStatuses.includes(x.status)&&['youtube','instagram'].includes(x.platform)&&['views','likes','shares','saves','watch_seconds'].includes(x.metric)&&['gancho','duracao','tema'].includes(x.variable)&&Array.isArray(x.evidence_ids)&&x.evidence_ids.length<=20&&x.evidence_ids.every(id=>typeof id==='string'&&id.length<100)&&[24,72,168].includes(x.hours)&&(!x.target_id||(typeof x.target_id==='string'&&x.target_id.length<100))&&(!x.baseline||(typeof x.baseline.at==='string'&&Number.isFinite(new Date(x.baseline.at).getTime())&&Number.isFinite(x.baseline.value))));}
 try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))experiments=saved.filter(validExperiment);}catch{ }
 function save(){try{localStorage.setItem(key,JSON.stringify(experiments));$('storage-notice').textContent='Plano salvo neste navegador. Exporte para levar a outro dispositivo.';}catch{$('storage-notice').textContent='O navegador não permitiu salvar. Exporte o plano para preservá-lo.';}}
 function download(name,value,type='application/json'){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function safeId(){return typeof crypto.randomUUID==='function'?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);}
 function createExperiment(idea){
  if(experiments.some(e=>e.idea_id===idea.id&&e.status!=='arquivado')){toast('Essa pauta já está no laboratório.');return;}
  experiments.unshift({id:safeId(),idea_id:idea.id,title:idea.title,category:idea.category,hypothesis:idea.hypothesis,
   evidence_ids:idea.evidence_ids,variable:'gancho',platform:'instagram',metric:'shares',hours:24,status:'planejado',created_at:new Date().toISOString(),target_id:null,baseline:null});
  save();renderExperiments();toast('Experimento criado. Selecione a publicação do teste quando ela existir.');
 }
 function toast(text){$('lab-message').textContent=text;}
 $('history-count').textContent=data.coverage.historical_snapshots;
 $('notice').innerHTML=`<b>Histórico real: ${data.coverage.historical_snapshots} coletas.</b> Crescimento mede diferenças entre coletas; recomendações são hipóteses revisáveis. Não há publicação de vídeo nem alteração de pauta por botões desta página.`;
 const growthRows=data.videos.filter(r=>r.growth&&!r.growth.counter_correction).sort((a,b)=>b.growth.views_per_hour-a.growth.views_per_hour);
 $('growth-cards').innerHTML=growthRows.slice(0,4).map(r=>`<article class="mini"><div class="eyebrow">${platform(r.platform)}</div><h3>${esc(r.title)}</h3><strong>+${fmt(r.growth.views_delta)} views</strong><span class="muted"> em ${fmt(r.growth.hours*60)} min · ${fmt(r.growth.views_per_hour)}/h nesta janela</span><small>${esc(r.age_group)} de idade · observação, sem previsão de alcance.</small></article>`).join('')||'<p class="empty">O crescimento aparece após duas coletas separadas por pelo menos 10 minutos.</p>';
 function trend(p){
  const points=data.timeline.filter(t=>typeof t[p]?.views==='number');
  if(points.length<2){$('trend').innerHTML='<p class="muted">Histórico insuficiente para desenhar uma curva.</p>';return;}
  const vals=points.map(t=>t[p].views),lo=Math.min(...vals),hi=Math.max(...vals),range=Math.max(1,hi-lo);
  const times=points.map(t=>new Date(t.at).getTime()),span=Math.max(1,times.at(-1)-times[0]);
  const xy=points.map((t,i)=>[30+(times[i]-times[0])/span*620,120-(vals[i]-lo)/range*90]);
  const names=points.map(t=>new Date(t.at).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}));
  $('trend').innerHTML=`<svg role="img" aria-label="Contadores acumulados da amostra ${platform(p)} entre ${esc(names[0])} e ${esc(names.at(-1))}" viewBox="0 0 680 160"><path d="M30 125H650" fill="none" stroke="#344052"/><polyline points="${xy.map(v=>v.join(',')).join(' ')}" fill="none" stroke="#95edc2" stroke-width="3"/>${xy.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#95edc2"/><text x="${x}" y="${y-11}" text-anchor="${i===0?'start':i===xy.length-1?'end':'middle'}" fill="#dae7f3" font-size="12">${fmt(vals[i])}</text>`).join('')}<text x="30" y="150" fill="#a0afc2" font-size="12">${esc(names[0])}</text><text x="650" y="150" fill="#a0afc2" text-anchor="end" font-size="12">${esc(names.at(-1))} BRT</text></svg><p class="table-foot">${points.length} pontos reais · total da amostra em cada coleta. Mudanças na quantidade de publicações também alteram este total; use o crescimento por vídeo para comparar.</p>`;
 }
 $('trend-platform').onchange=()=>trend($('trend-platform').value);trend('instagram');
 $('ideas').innerHTML=data.ideas.map((idea,i)=>`<article class="idea"><div class="eyebrow">${esc(idea.category)} · investigar</div><h3>${esc(idea.title)}</h3><p>${esc(idea.angle)}</p><details><summary>Ver evidência e hipótese</summary><p>${esc(idea.why)}</p><p>${esc(idea.hypothesis)}</p><small>${esc(idea.confidence)}</small></details><div class="idea-actions"><button data-plan="${i}" class="primary">Criar experimento</button><button data-brief="${i}" class="secondary">Copiar briefing</button><button data-hook="${i}" class="secondary">Revisar gancho</button></div></article>`).join('')||'<p class="empty">Aguardando dados para propor pautas relacionadas.</p>';
 for(const b of $('ideas').querySelectorAll('[data-plan]'))b.onclick=()=>createExperiment(data.ideas[+b.dataset.plan]);
 for(const b of $('ideas').querySelectorAll('[data-brief]'))b.onclick=async()=>{const idea=data.ideas[+b.dataset.brief];try{await navigator.clipboard.writeText(idea.brief);toast('Briefing copiado. Continua sendo rascunho, sem autorização de upload.');}catch{download('briefing-short.txt',idea.brief,'text/plain');toast('Briefing baixado para revisão.');}};
 for(const b of $('ideas').querySelectorAll('[data-hook]'))b.onclick=()=>{$('hook-input').value=data.ideas[+b.dataset.hook].title;checkHook();$('hooks').scrollIntoView({behavior:'smooth'});};
 function checkHook(){
  const text=$('hook-input').value.trim(),words=text?text.split(/\s+/).length:0;
  const object=/\b(carro|vidro|pneu|lata|embalagem|café|cafe|panela|fogão|fogao|geladeira|fone|tecido|lente|espuma|robô|robo|câmera|camera|objeto)\b/i.test(text);
  const risky=/\b(garantid|milagre|nunca|sempre|100%|ninguém|ninguem|viraliz)/i.test(text);
  const checks=[['Curto para abrir o vídeo',words>0&&words<=12,`${words} palavras; referência editorial de até 12.`],['Objeto ou ação concreta',object,'Heurística por palavras; revise se o objeto ficou claro.'],['Promessa investigável',/\?|\b(como|por que|o que)\b/i.test(text),'Uma pergunta clara precisa receber resposta no roteiro.'],['Sem promessa absoluta',Boolean(text)&&!risky,'Evite certeza universal ou promessa de viralização.']];
  $('hook-checks').innerHTML=checks.map(([label,ok,note])=>`<div><b class="${ok?'pass':'pending'}">${ok?'✓':'○'} ${label}</b><small>${esc(note)}</small></div>`).join('');
 }
 $('hook-input').oninput=checkHook;checkHook();
 function current(row,metric){if(!row)return null;if(metric==='watch_seconds'&&!row.watch_ratio_valid)return null;return typeof row[metric]==='number'?row[metric]:null;}
 function observation(experiment){
  const row=data.videos.find(r=>r.platform===experiment.platform&&r.id===experiment.target_id);
  if(!experiment.baseline||!row)return 'Selecione a publicação do teste e inicie a observação.';
  const at=new Date(row.observed_at),baseline=experiment.baseline,elapsed=(at-new Date(baseline.at))/3600000;
  const value=current(row,experiment.metric);
  if(value===null)return 'Métrica indisponível nesta coleta; resultado inconclusivo.';
  if(elapsed<=0)return 'Aguardando coleta posterior ao início do experimento.';
  const delta=value-baseline.value;
  return `${fmt(delta)} de variação em ${fmt(elapsed)}h no contador selecionado. ${elapsed<experiment.hours?'Janela ainda incompleta.':'Janela observada; registre interpretação com cautela.'} Não prova causalidade.`;
 }
 function renderExperiments(){
  const visible=experiments.filter(e=>e.status!=='arquivado');
  $('experiment-count').textContent=`${visible.length} ${visible.length===1?'teste':'testes'} no plano`;
  $('experiments').innerHTML=visible.map(e=>`<article class="experiment" data-experiment="${esc(e.id)}"><div class="eyebrow">${esc(e.status.replaceAll('_',' '))} · ${esc(e.category||'Tema livre')}</div><h3>${esc(e.title)}</h3><p>${esc(e.hypothesis||'Registrar a hipótese antes de publicar.')}</p><div class="experiment-fields"><label>Plataforma<select data-field="platform" ${e.baseline?'disabled':''}><option value="instagram" ${e.platform==='instagram'?'selected':''}>Instagram</option><option value="youtube" ${e.platform==='youtube'?'selected':''}>YouTube</option></select></label><label>Uma variável<select data-field="variable" ${e.baseline?'disabled':''}><option value="gancho" ${e.variable==='gancho'?'selected':''}>Gancho inicial</option><option value="duracao" ${e.variable==='duracao'?'selected':''}>Duração</option><option value="tema" ${e.variable==='tema'?'selected':''}>Recorte do tema</option></select></label><label>Métrica<select data-field="metric" ${e.baseline?'disabled':''}>${[['views','Visualizações'],['likes','Curtidas'],['shares','Compartilhamentos'],['saves','Salvamentos'],['watch_seconds','Média assistida (s)']].map(([v,l])=>`<option value="${v}" ${e.metric===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Janela<select data-field="hours" ${e.baseline?'disabled':''}>${[24,72,168].map(h=>`<option value="${h}" ${e.hours===h?'selected':''}>${h} horas</option>`).join('')}</select></label></div><label>Publicação do novo teste<select data-field="target_id" ${e.baseline?'disabled':''}><option value="">Escolher quando publicada</option>${data.videos.filter(r=>r.platform===e.platform&&!e.evidence_ids.includes(r.id)).map(r=>`<option value="${esc(r.id)}" ${e.target_id===r.id?'selected':''}>${esc(r.title)}</option>`).join('')}</select></label><p class="experiment-observation">${esc(observation(e))}</p><div class="idea-actions">${!e.baseline?'<button class="primary" data-action="start">Iniciar observação</button>':'<button class="secondary" data-action="finish">Registrar avaliação</button>'}<button class="secondary" data-action="archive">Arquivar</button></div></article>`).join('')||'<p class="empty">Crie um experimento a partir de uma oportunidade de pauta. Nada será publicado por esta página.</p>';
  for(const card of $('experiments').querySelectorAll('[data-experiment]')){
   const e=experiments.find(x=>x.id===card.dataset.experiment);
   for(const select of card.querySelectorAll('select'))select.onchange=()=>{const field=select.dataset.field;e[field]=field==='hours'?+select.value:select.value;if(field==='platform'){e.target_id=null;e.metric='views';}save();renderExperiments();};
   for(const button of card.querySelectorAll('[data-action]'))button.onclick=()=>{
    if(button.dataset.action==='archive'){e.status='arquivado';save();renderExperiments();return;}
    if(button.dataset.action==='finish'){const note=window.prompt('O que observou? Registre evidência e limitações; resultado sem comparação pode ser inconclusivo.','Inconclusivo: ' + observation(e));if(note===null)return;e.status='avaliado';e.result_note=note.slice(0,2000);e.evaluated_at=new Date().toISOString();save();renderExperiments();toast('Avaliação salva no plano deste navegador.');return;}
    const row=data.videos.find(r=>r.platform===e.platform&&r.id===e.target_id),value=current(row,e.metric);
    if(!row||value===null){toast('Selecione uma publicação com a métrica disponível.');return;}
    e.baseline={at:row.observed_at,value,views:row.views};e.status='em_observacao';save();renderExperiments();toast('Baseline registrado. Recarregue uma coleta posterior para observar a variação.');
   };
  }
 }
 $('export-plan').onclick=()=>download('shortsbot-plano-de-testes.json',{schema_version:1,exported_at:new Date().toISOString(),experiments});
 $('import-plan').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>1000000){toast('Plano maior que o limite de 1 MB.');return;}try{const parsed=JSON.parse(await file.text());if(parsed.schema_version!==1||!Array.isArray(parsed.experiments)||parsed.experiments.length>100||!parsed.experiments.every(validExperiment))throw Error();const known=new Set(experiments.map(x=>x.id));experiments.push(...parsed.experiments.filter(x=>!known.has(x.id)));save();renderExperiments();toast('Plano importado como dados; nenhum comando ou publicação executado.');}catch{toast('Arquivo de plano inválido. Nada foi importado.');}e.target.value='';};
 $('weekly-review').onclick=()=>{const lines=['# ShortsBot — revisão de audiência',`Coleta: ${data.collected_at}`,`Snapshots: ${data.coverage.historical_snapshots}`,'','## Recomendações',...data.recommendations.flatMap(r=>[`### ${r.title} (${r.platform})`,r.evidence,`Confiança: ${r.confidence}`,`Próximo teste: ${r.action}`,'']),'## Experimentos',...experiments.filter(e=>e.status!=='arquivado').map(e=>`- ${e.title}: ${e.status}; variável ${e.variable}; ${e.metric}; ${e.hours}h. ${observation(e)}`),'','Dados observacionais. Sem garantia de viralização.'];download('shortsbot-revisao.md',lines.join('\n'),'text/markdown');};
 const comments=data.comment_insights;
 $('comment-summary').textContent=`${comments.texts_analyzed} textos efetivamente retornados e analisados; ${comments.api_comment_count} comentários nos contadores. ${comments.coverage_status==='not_yet_proven'?'Cobertura textual ainda não confirmada.':''}`;
 $('comment-groups').innerHTML=comments.groups.map(g=>`<div class="mini"><b>${esc(g.label)}</b><strong>${fmt(g.count)}</strong></div>`).join('')||'<p class="muted">Ainda não há textos retornados para extrair pedidos ou dúvidas. O painel não inventa uma opinião do público.</p>';
 $('quality-alerts').innerHTML=data.videos.flatMap(r=>r.flags.map(flag=>({r,flag}))).map(({r,flag})=>`<li><b>${platform(r.platform)} · ${esc(r.title)}</b><br>${esc(flag)}</li>`).join('')||'<li>Nenhum alerta nesta coleta.</li>';
 renderExperiments();
 function activeNav(){for(const link of document.querySelectorAll('nav a'))link.classList.toggle('active',link.getAttribute('href')===(location.hash||'#overview'));}
 window.addEventListener('hashchange',activeNav);activeNav();
 window.ShortsbotsLab={validExperiment,current};
})();
