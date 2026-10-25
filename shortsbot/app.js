'use strict';
const data=window.SHORTSBOT_DATA;
const $=id=>document.getElementById(id);
const fmt=n=>n===null||n===undefined?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const platformName=p=>p==='youtube'?'YouTube':'Instagram';
const sum=(p,k)=>data.videos.filter(r=>r.platform===p).reduce((s,r)=>s+(typeof r[k]==='number'?r[k]:0),0);
$('updated').textContent=new Date(data.collected_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' BRT';
$('metrics').innerHTML=[['youtube','YouTube · views',sum('youtube','views'),`${data.coverage.youtube_videos} vídeos · contadores atuais`],['instagram','Instagram · views',sum('instagram','views'),`${data.coverage.instagram_reels} Reels · contadores atuais`],['instagram','Compartilhamentos · IG',sum('instagram','shares'),'Acumulados na amostra · sem dados YT'],['instagram','Salvamentos · IG',sum('instagram','saves'),'Zero real, quando retornado pela API']].map(([p,l,v,n])=>`<div class="card"><div class="tag ${p}">${esc(l)}</div><div class="value">${fmt(v)}</div><div class="small">${esc(n)}</div></div>`).join('');
$('coverage').textContent=`${data.coverage.youtube_videos} vídeos no YouTube e ${data.coverage.instagram_reels} Reels no Instagram nesta coleta.`;
$('analytics-status').textContent=data.coverage.youtube_analytics_status==='ok'?`${data.coverage.youtube_analytics_rows} linhas no período consultado. ${data.coverage.youtube_analytics_rows?'Dados por período disponíveis nos detalhes; não misturados com contadores acumulados.':'Retenção e compartilhamentos YT permanecem sem dados.'}`:'A consulta detalhada está indisponível; os últimos contadores coletados continuam identificados pela data.';
if($('learning-status'))$('learning-status').textContent=data.coverage.queue_feedback_enabled?`Feedback limitado habilitado: ${data.coverage.eligible_feedback_categories} categorias com amostra elegível. Bônus máximo de 2 pontos; sem amostra, bônus zero.`:'Recomendações em observação. Feedback automático da fila ainda desligado.';
if($('comments-status'))$('comments-status').textContent=data.comment_insights?.texts_analyzed?`${data.comment_insights.texts_analyzed} textos na amostra privada; apenas classificação agregada aparece na página.`:'Nenhum texto retornado na amostra. A cobertura textual continua em validação, mesmo quando o contador de comentários é maior que zero.';
function renderChart(platform){
 const rows=data.videos.filter(r=>r.platform===platform&&typeof r.views==='number').sort((a,b)=>b.views-a.views).slice(0,5);
 const max=Math.max(1,...rows.map(r=>r.views));
 $('bars').innerHTML=rows.map(r=>`<div class="bar-row"><div class="bar-label"><span title="${esc(r.title)}">${esc(r.title)}</span><b>${fmt(r.views)}</b></div><div class="track"><div class="fill" style="width:${r.views/max*100}%"></div></div></div>`).join('');
 for(const [id,p]of [['chart-yt','youtube'],['chart-ig','instagram']]){ $(id).classList.toggle('active',p===platform);$(id).setAttribute('aria-pressed',String(p===platform)); }
}
$('chart-yt').onclick=()=>renderChart('youtube');$('chart-ig').onclick=()=>renderChart('instagram');renderChart('youtube');
$('recs').innerHTML=data.recommendations.map(r=>`<article class="rec"><span class="eyebrow">${esc(r.platform==='ambos'?'Ambas as plataformas':platformName(r.platform))}</span><h3>${esc(r.title)}</h3><span class="pill">${esc(r.confidence)}</span><p style="margin-top:15px">${esc(r.evidence)}</p><p class="action">${esc(r.action)}</p><small>${esc(r.reason)}</small></article>`).join('');
for(const c of [...new Set(data.videos.map(r=>r.category))].sort()){$('category').add(new Option(c,c));}
function renderTable(){
 const search=$('search').value.toLocaleLowerCase('pt-BR'),p=$('platform').value,c=$('category').value,sort=$('sort').value;
 const rows=data.videos.filter(r=>(p==='all'||r.platform===p)&&(c==='all'||r.category===c)&&r.title.toLocaleLowerCase('pt-BR').includes(search));
 rows.sort((a,b)=>sort==='published_at'?new Date(b.published_at)-new Date(a.published_at):(b[sort]??-1)-(a[sort]??-1));
 $('rows').innerHTML=rows.map(r=>`<tr><td>${esc(r.title)}<small><span class="${r.platform}">${platformName(r.platform)}</span> · ${esc(r.category)} · ${new Date(r.published_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}</small></td><td>${fmt(r.views)}</td><td>${fmt(r.likes)}</td><td>${fmt(r.comments)}</td><td>${fmt(r.shares)}</td><td>${fmt(r.saves)}</td><td>${r.watch_seconds===null?'—':fmt(r.watch_seconds)+' s'}${r.flags.some(f=>f.startsWith('Tempo médio'))?' ⚠':''}</td><td><button class="details" data-id="${esc(r.id)}">Abrir</button></td></tr>`).join('');
 $('empty').hidden=rows.length>0;$('count').textContent=`${rows.length} publicações · ${data.videos.length} na amostra`;
 for(const b of $('rows').querySelectorAll('button'))b.onclick=()=>showDetail(b.dataset.id);
}
for(const id of ['search','platform','category','sort'])$(id).addEventListener(id==='search'?'input':'change',renderTable);renderTable();
function showDetail(id){
 const r=data.videos.find(v=>v.id===id);
 const safeLink=r.url&&/^https:\/\/(www\.)?(youtube\.com|instagram\.com)\//.test(r.url);
 $('detail-body').innerHTML=`<div class="eyebrow">${platformName(r.platform)} · ${esc(r.category)}</div><h2 style="margin-top:12px">${esc(r.title)}</h2><p class="muted">Publicado em ${new Date(r.published_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} BRT · idade ${fmt(r.age_hours)}h</p><div class="detail-grid">${[['Visualizações',r.views],['Contas alcançadas',r.reach],['Curtidas',r.likes],['Comentários (contador)',r.comments],['Compartilhamentos',r.shares],['Salvamentos',r.saves],['Média assistida (s)',r.watch_seconds],['Duração do vídeo (s)',r.duration],['Curtidas / views (%)',r.like_rate],['Compartilhamentos / alcance (%)',r.share_rate]].map(([l,v])=>`<div><small>${l}</small><b>${fmt(v)}</b></div>`).join('')}</div>${r.growth?`<p>Crescimento observado: <b>${fmt(r.growth.views_delta)} views em ${fmt(r.growth.hours*60)} min</b> (${fmt(r.growth.views_per_hour)} por hora nesta janela).</p>`:'<p class="muted">Sem janela de crescimento disponível para este vídeo.</p>'}${r.comparison?`<p class="muted">Faixa ${esc(r.comparison.group)} · ${r.comparison.peers} publicações na mesma plataforma/faixa · mediana ${fmt(r.comparison.median_views)} views. ${r.comparison.status==='exploratory'?'Amostra ainda exploratória.':'Comparação observacional por faixa de idade.'}</p>`:''}${(r.diagnosis||[]).map(d=>`<p><b>${esc(d.label)}</b><br><span class="muted">${esc(d.action)}</span></p>`).join('')}${r.flags.map(f=>`<p class="warning">⚠ ${esc(f)}</p>`).join('')}${r.period_metrics?`<details><summary>Relatório YouTube por período</summary><p>${esc(r.analytics_period.start)} a ${esc(r.analytics_period.end)}</p><div class="detail-grid">${Object.entries(r.period_metrics).filter(([k])=>k!=='video').map(([k,v])=>`<div><small>${esc(k)}</small><b>${fmt(v)}</b></div>`).join('')}</div></details>`:''}<p class="muted">Contadores acumulados até ${esc(r.observed_at||data.collected_at)}. Textos dos comentários não são exportados.</p>${safeLink?`<p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Ver publicação original ↗</a></p>`:''}`;
 $('detail').showModal();
}
$('close').onclick=()=>$('detail').close();
$('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').close();});
$('download').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shortsbot-insights-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
