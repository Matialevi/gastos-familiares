const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const config = window.APP_CONFIG || {};
const configured = /^https:\/\/.+\.supabase\.co$/.test(config.supabaseUrl || '') && !!config.supabaseAnonKey;
const money = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
const state = {
  demo: true,
  members:[{name:'Matías',value:156800,color:'#ec755d'},{name:'Giselle',value:121400,color:'#f2cf78'},{name:'Iara',value:89300,color:'#6c9e89'},{name:'Milagros',value:61150,color:'#b7c7d4'}],
  movements:[
    {merchant:'Carrefour',meta:'Hoy · Matías · Comida',amount:38500,icon:'▦',date:new Date().toISOString().slice(0,10)},
    {merchant:'Edenor',meta:'Ayer · Giselle · Servicios',amount:24780,icon:'ϟ',date:new Date(Date.now()-864e5).toISOString().slice(0,10)},
    {merchant:'Farmacity',meta:'2 oct · Iara · Salud',amount:12300,icon:'+',date:new Date(Date.now()-5*864e5).toISOString().slice(0,10)},
    {merchant:'YPF',meta:'1 oct · Matías · Transporte',amount:18900,icon:'⌁',date:new Date(Date.now()-12*864e5).toISOString().slice(0,10)}]
};
const rules=[
  {test:/carrefour|coto|jumbo|dia|super|mercado/i,cat:'Comida',sub:'Supermercado'},
  {test:/edenor|edesur|metrogas|aysa|internet|movistar|personal/i,cat:'Servicios',sub:'Servicios del hogar'},
  {test:/flow|cablevision|fibertel/i,cat:'Servicios',sub:'Internet'},
  {test:/farm|doctor|hospital|salud/i,cat:'Salud',sub:'Farmacia'},
  {test:/ypf|shell|axion|uber|cabify|sube/i,cat:'Transporte',sub:'Movilidad'},
  {test:/colegio|escuela|librer/i,cat:'Educación',sub:'Educación'}];

function toast(text){const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600)}
function supabase(path, options={}){return fetch(`${config.supabaseUrl}${path}`,{...options,headers:{apikey:config.supabaseAnonKey,Authorization:`Bearer ${localStorage.getItem('gf_token') || config.supabaseAnonKey}`,'Content-Type':'application/json',...(options.headers||{})}}).then(async r=>{const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.msg||body.message||body.error_description||'No se pudo completar la operación');return body})}
async function loadRemoteData(user){
  const [members,categories,subcategories,providers,expenses]=await Promise.all([
    supabase('/rest/v1/miembros?select=*&activo=eq.true'),supabase('/rest/v1/categorias?select=*&activo=eq.true'),supabase('/rest/v1/subcategorias?select=*&activo=eq.true'),supabase('/rest/v1/proveedores?select=*&activo=eq.true'),supabase('/rest/v1/gastos?select=*&order=fecha.desc,created_at.desc&limit=1000')
  ]);
  state.remote={members,categories,subcategories,providers};
  const current=members.find(m=>m.auth_user_id===user?.id);state.familyId=current?.familia_id;
  $('#category').innerHTML=categories.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  $('#paidBy').innerHTML=members.map(m=>`<option value="${m.id}">${m.nombre}</option>`).join('');
  const month=new Date().toISOString().slice(0,7), currentExpenses=expenses.filter(g=>String(g.fecha).startsWith(month));
  state.members=members.map((m,i)=>({name:m.nombre,value:currentExpenses.filter(g=>g.pagado_por_id===m.id).reduce((s,g)=>s+Number(g.monto),0),color:['#ec755d','#f2cf78','#6c9e89','#b7c7d4'][i%4]}));
  state.movements=expenses.map(g=>({merchant:providers.find(p=>p.id===g.proveedor_id)?.nombre||g.descripcion||'Gasto',meta:`${g.fecha} · ${members.find(m=>m.id===g.pagado_por_id)?.nombre||''} · ${categories.find(c=>c.id===g.categoria_id)?.nombre||''}`,amount:Number(g.monto),icon:'▦',date:g.fecha}));
  return current?.alias||current?.nombre?.split(' ')[0]||user?.email?.split('@')[0]||'Familia';
}
function openApp(name='Mati'){state.demo=!localStorage.getItem('gf_token');state.currentName=name;$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#userName').textContent=name;$('#profileName').textContent=name;$('#profileButton').textContent=name[0].toUpperCase();$('#profileAvatar').textContent=name[0].toUpperCase();render()}
function render(){
  const total=state.members.reduce((a,b)=>a+b.value,0), max=Math.max(1,...state.members.map(m=>m.value));
  const lookup={mati:'matías',gi:'giselle',mili:'milagros'}, key=(state.currentName||'Mati').toLowerCase(), wanted=lookup[key]||key;
  const personal=state.members.find(m=>m.name.toLowerCase().startsWith(wanted))||state.members[0];
  $('#personalTotal').textContent=money(personal?.value||0);$('#monthTotal').textContent=money(total);$('#movementCount').textContent=`${state.movements.length} movimientos cargados`;
  $('#chart').innerHTML=state.members.map(m=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(12,m.value/max*90)}%;background:${m.color}" data-value="${money(m.value)}"></div></div>`).join('');
  $('#legend').innerHTML=state.members.map(m=>`<span><i style="background:${m.color}"></i>${m.name}</span>`).join('');
  $('#movements').innerHTML=state.movements.slice(0,4).map(m=>`<div class="movement"><span class="movement-icon">${m.icon}</span><div><p>${m.merchant}</p><small>${m.meta}</small></div><strong>− ${money(m.amount)}<small>Confirmado</small></strong></div>`).join('');
  renderAllMovements();renderTimeline(document.querySelector('.period-tabs .active')?.dataset.period||'month');
}
function movementMarkup(m){return `<div class="movement"><span class="movement-icon">${m.icon}</span><div><p>${m.merchant}</p><small>${m.meta}</small></div><strong>− ${money(m.amount)}<small>Confirmado</small></strong></div>`}
function renderAllMovements(filter=''){const term=filter.trim().toLowerCase(),items=state.movements.filter(m=>`${m.merchant} ${m.meta}`.toLowerCase().includes(term));$('#allMovements').innerHTML=items.length?items.map(movementMarkup).join(''):'<div class="empty-state">No encontramos movimientos con esa búsqueda.</div>'}
function timelineData(period){const now=new Date(),items=state.movements.map(m=>({...m,d:new Date(`${m.date||new Date().toISOString().slice(0,10)}T12:00:00`)}));if(period==='week'){return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(now.getDate()-6+i);const key=d.toISOString().slice(0,10);return {label:new Intl.DateTimeFormat('es-AR',{weekday:'short'}).format(d),value:items.filter(m=>m.date===key).reduce((s,m)=>s+m.amount,0)}})}if(period==='year'){return Array.from({length:12},(_,i)=>({label:new Intl.DateTimeFormat('es-AR',{month:'short'}).format(new Date(now.getFullYear(),i,1)),value:items.filter(m=>m.d.getFullYear()===now.getFullYear()&&m.d.getMonth()===i).reduce((s,m)=>s+m.amount,0)}))}return Array.from({length:5},(_,i)=>({label:`Sem ${i+1}`,value:items.filter(m=>m.d.getFullYear()===now.getFullYear()&&m.d.getMonth()===now.getMonth()&&Math.min(4,Math.floor((m.d.getDate()-1)/7))===i).reduce((s,m)=>s+m.amount,0)}))}
function renderTimeline(period){const data=timelineData(period),max=Math.max(1,...data.map(d=>d.value)),total=data.reduce((s,d)=>s+d.value,0);$('#summaryTotal').textContent=`Total del período: ${money(total)}`;$('#timelineChart').innerHTML=data.map(d=>`<div class="time-column"><span>${d.value?money(d.value):''}</span><i style="height:${Math.max(d.value?8:2,d.value/max*100)}%"></i><small>${d.label}</small></div>`).join('')}
function showView(id){$$('.app-section').forEach(v=>v.classList.toggle('hidden',v.id!==id));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='summaryView')renderTimeline(document.querySelector('.period-tabs .active')?.dataset.period||'month')}
$('#todayLabel').textContent=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase();
$('#expenseDate').value=new Date().toISOString().slice(0,10);
$('#configHint').textContent=configured?'Conexión segura lista.':'Modo demo disponible · falta config.js para conectar Supabase.';
function showLoginForm(){const intro=$('#loginIntro');intro.classList.add('launching');setTimeout(()=>{$('#loginView').classList.add('form-open');$('#loginPanel').classList.remove('login-panel-hidden');setTimeout(()=>$('#email').focus(),350)},520)}
$('#startLogin').onclick=showLoginForm;
$('#backToIntro').onclick=()=>{$('#loginView').classList.remove('form-open');$('#loginPanel').classList.add('login-panel-hidden');$('#loginIntro').classList.remove('launching')};
$('#showPassword').onclick=()=>{const p=$('#password');p.type=p.type==='password'?'text':'password'};
$('#demoButton').onclick=()=>openApp();
$('#movementSearch').oninput=e=>renderAllMovements(e.target.value);
$$('.period-tabs button').forEach(button=>button.onclick=()=>{$$('.period-tabs button').forEach(b=>b.classList.remove('active'));button.classList.add('active');renderTimeline(button.dataset.period)});
$$('.bottom-nav button').forEach(button=>button.onclick=()=>showView(button.dataset.view));
$('#profileButton').onclick=()=>showView('profileView');
$('#loginForm').onsubmit=async e=>{e.preventDefault();if(!configured)return toast('Falta configurar la URL y la clave pública de Supabase.');const btn=e.submitter;btn.disabled=true;try{const data=await supabase('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});localStorage.setItem('gf_token',data.access_token);localStorage.setItem('gf_refresh',data.refresh_token);const label=await loadRemoteData(data.user);openApp(label)}catch(err){localStorage.removeItem('gf_token');toast(err.message)}finally{btn.disabled=false}};
function toggleModal(show){$('#expenseModal').classList.toggle('hidden',!show);document.body.style.overflow=show?'hidden':'';if(show)setTimeout(()=>$('#amount').focus(),100)}
$('#addExpenseButton').onclick=()=>toggleModal(true);$$('[data-close]').forEach(b=>b.onclick=()=>toggleModal(false));
$('#merchant').addEventListener('input',e=>{const rule=rules.find(r=>r.test.test(e.target.value));$('#suggestion').classList.toggle('hidden',!rule);if(rule){$('#suggestionText').textContent=`${rule.cat} · ${rule.sub}`;const remoteCategory=state.remote?.categories.find(c=>c.nombre===rule.cat);$('#category').value=remoteCategory?.id||rule.cat;$('#subcategory').value=rule.sub}});
$('#editCategory').onclick=()=>{$('#categoryFields').classList.toggle('hidden');$('#category').focus()};
$('#expenseForm').onsubmit=async e=>{e.preventDefault();const amount=Number($('#amount').value.replace(',','.'));if(!amount||amount<=0)return toast('Ingresá un monto válido.');const merchant=$('#merchant').value.trim();const scope=$('input[name="scope"]:checked').value;const category=$('#category').value;const payer=$('#paidBy').value;let categoryName=category,payerName=payer;
  if(configured&&!state.demo){try{const cat=state.remote.categories.find(c=>c.id===category),sub=state.remote.subcategories.find(s=>s.categoria_id===category&&s.nombre.toLowerCase()===$('#subcategory').value.trim().toLowerCase()),provider=state.remote.providers.find(p=>p.nombre_normalizado===merchant.toLowerCase()||p.nombre.toLowerCase()===merchant.toLowerCase());categoryName=cat?.nombre||'';payerName=state.remote.members.find(m=>m.id===payer)?.nombre||'';await supabase('/rest/v1/gastos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({monto:amount,descripcion:merchant,fecha:$('#expenseDate').value,ambito:scope.toLowerCase(),pagado_por_id:payer,categoria_id:category,subcategoria_id:sub?.id||null,proveedor_id:provider?.id||null,origen:'manual',clasificacion:provider||sub?'regla':'manual'})})}catch(err){return toast(`No se guardó: ${err.message}`)}}
  state.movements.unshift({merchant,meta:`Hoy · ${payerName} · ${categoryName}`,amount,icon:'▦',date:$('#expenseDate').value});const member=state.members.find(m=>m.name===payerName);if(member)member.value+=amount;render();toggleModal(false);e.target.reset();$('#expenseDate').value=new Date().toISOString().slice(0,10);$('#suggestion').classList.add('hidden');$('#categoryFields').classList.add('hidden');toast('Gasto guardado correctamente');
};
$('#logoutButton').onclick=()=>{if(state.demo)return location.reload();localStorage.removeItem('gf_token');localStorage.removeItem('gf_refresh');location.reload()};
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
