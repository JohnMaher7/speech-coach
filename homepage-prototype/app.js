'use strict';
// A self-contained marketing prototype. No recordings, accounts or payments leave this page.
const feedback = {
  pace: {label:'YOUR PACE',heading:'A strong pace.\nA little more breathing room.',value:'148',unit:'words / minute',chart:'Pace across your speech',key:'Words per minute',insight:'YOUR NEXT STEP · 00:34',text:'You speed up as you reach your main point. Try a short pause before “here’s what matters” to give your audience a moment to catch up.',points:[83,73,79,58,68,62,47,28,18,36,59,68,48,67,58,72,57,70,57,61,42,64,57,76,62,72,61,75,69,79,70],highlight:126,dot:[160,18],alt:'Illustrative pacing chart with a faster section highlighted at 34 seconds.'},
  fillers: {label:'YOUR FILLER WORDS',heading:'Keep the thought.\nLose the extra words.',value:'12',unit:'filler words',chart:'Filler words across your speech',key:'Filler moments',insight:'YOUR NEXT STEP · 00:34',text:'“Sort of” and “I guess” cluster around your key point. Try replacing them with a brief silence. Your idea is strong enough to stand on its own.',points:[100,100,100,50,100,100,76,28,42,100,100,100,68,100,100,100,62,100,100,100,100,50,100,100,100,72,100,100,62,100,100],highlight:126,dot:[140,28],alt:'Illustrative chart of filler words with a cluster highlighted around 34 seconds.'},
  variety: {label:'YOUR VOCAL VARIETY',heading:'Let your voice\nshare the excitement.',value:'3 / 5',unit:'sample rubric score',chart:'Pitch across your speech',key:'Relative pitch',insight:'YOUR NEXT STEP · 01:12',text:'Your pitch stays steady through the middle section. Choose one word in each key sentence to emphasise. Try “This changes everything” with the emphasis on “changes”.',points:[72,44,81,52,31,65,83,53,74,48,70,66,63,65,62,64,63,65,64,62,67,65,60,70,44,68,33,51,71,49,65],highlight:253,dot:[300,64],alt:'Illustrative pitch chart with a flat middle section highlighted around one minute twelve seconds.'},
  structure: {label:'YOUR STRUCTURE',heading:'A clear beginning.\nGive the ending a job.',value:'4 / 5',unit:'sample rubric score',chart:'Emphasis across your speech',key:'Illustrative emphasis',insight:'YOUR NEXT STEP · 02:18',text:'Your opening gives the audience a clear reason to listen. Bring that idea back in your closing sentence, then ask for one specific action they can take.',points:[90,73,42,32,38,54,67,74,72,57,43,36,48,65,72,79,65,51,33,44,58,64,76,82,91,95,95,94,96,100,100],highlight:530,dot:[560,96],alt:'Illustrative emphasis chart highlighting the closing section at two minutes eighteen seconds.'}
};
const tabs = [...document.querySelectorAll('[data-metric]')];
function selectMetric(tab, moveFocus=false){
  const data=feedback[tab.dataset.metric];
  tabs.forEach(t=>{const selected=t===tab;t.classList.toggle('active',selected);t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1});
  document.getElementById('feedback-panel').setAttribute('aria-labelledby',tab.id);
  document.querySelector('.chart-wrap').hidden=tab.dataset.metric==='structure';
  document.getElementById('structure-overview').hidden=tab.dataset.metric!=='structure';
  const fields={'metric-label':data.label,'metric-value':data.value,'metric-unit':data.unit,'chart-title':data.chart,'chart-key':data.key,'insight-label':data.insight,'insight-text':data.text};
  for(const [id,value] of Object.entries(fields))document.getElementById(id).textContent=value;
  const heading=document.getElementById('metric-heading');heading.replaceChildren();
  data.heading.split('\n').forEach((line,i)=>{if(i)heading.append(document.createElement('br'));heading.append(document.createTextNode(line))});
  const path=data.points.map((y,i)=>`${i?'L':'M'}${i*20} ${y}`).join(' ');
  document.getElementById('chart-line').setAttribute('d',path);
  document.getElementById('chart-area').setAttribute('d',`${path}V130H0Z`);
  document.getElementById('chart-highlight').setAttribute('x',data.highlight);
  document.getElementById('chart-dot').setAttribute('cx',data.dot[0]);
  document.getElementById('chart-dot').setAttribute('cy',data.dot[1]);
  document.querySelector('.speech-chart').setAttribute('aria-label',data.alt);
  if(moveFocus)tab.focus();
}
tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>selectMetric(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%tabs.length;
    if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectMetric(tabs[next],true)}
  });
});
let billing='monthly';
document.querySelectorAll('[data-billing]').forEach(button=>button.addEventListener('click',()=>{
  billing=button.dataset.billing;
  document.querySelectorAll('[data-billing]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
  document.getElementById('plan-amount').textContent=billing==='yearly'?'€5.83':'€12.99';
  document.getElementById('plan-billing').textContent=billing==='yearly'?'€70 billed yearly after your 7-day free trial.':'Billed monthly after your 7-day free trial.';
}));
const menuButton=document.querySelector('.menu-toggle');
const menu=document.getElementById('mobile-menu');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu')}
menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu')});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus()}});
document.addEventListener('click',event=>{if(!menu.hidden&&!event.target.closest('.site-header'))closeMenu()});
window.matchMedia('(min-width:761px)').addEventListener('change',event=>{if(event.matches)closeMenu()});
const dialog=document.getElementById('trial-dialog');
document.querySelector('[data-open-trial]').addEventListener('click',event=>{
  event.preventDefault();
  document.getElementById('trial-plan').textContent=billing==='yearly'?'Yearly · €70/year (€5.83/month)':'Monthly · €12.99/month';
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
document.getElementById('dialog-sample').addEventListener('click',()=>{dialog.close();document.getElementById('your-report').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});tabs.find(t=>t.getAttribute('aria-selected')==='true').focus({preventScroll:true})});
