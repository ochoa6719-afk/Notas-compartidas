// Panel del administrador: usuarios, actividad y respaldo
const stamp=()=>new Date().toISOString().slice(0,10);
function pane(p){
  ['pu','pa','pb'].forEach(k=>$(k).style.display=k===p?'':'none');
  document.querySelectorAll('#atabs .tb').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  if(p==='pu')users();if(p==='pa')activity();
}
$('ad').onclick=()=>{$('ov').style.display='grid';pane('pu')};
$('atabs').onclick=e=>{const b=e.target.closest('[data-p]');if(b)pane(b.dataset.p)};
$('xc').onclick=()=>$('ov').style.display='none';

async function users(){
  const {data}=await sb.from('profiles').select('*').order('created_at');
  $('ub').innerHTML=(data||[]).map(u=>`<tr><td>${esc(u.email)}${u.is_admin?' <small>(admin)</small>':!u.can_personal&&!u.can_trabajo?' 🆕':''}</td>${Object.keys(CATS).map(k=>`<td><input type="checkbox" data-u="${u.id}" data-k="${k}" ${u.is_admin||u['can_'+k]?'checked':''} ${u.is_admin?'disabled':''}></td>`).join('')}</tr>`).join('');
}
$('ub').onchange=async e=>{const c=e.target;if(!c.dataset.u)return;
  const {error}=await sb.from('profiles').update({['can_'+c.dataset.k]:c.checked}).eq('id',c.dataset.u);
  if(error){alert(error.message);c.checked=!c.checked}};

async function getAct(n){const {data}=await sb.from('activity').select('*').order('created_at',{ascending:false}).limit(n);return data||[]}
async function activity(){
  $('ab').innerHTML='<tr><td colspan="3">Cargando…</td></tr>';
  const a=await getAct(200);
  $('ab').innerHTML=a.map(x=>`<tr><td>${when(x.created_at)}</td><td>${esc((x.user_email||'').split('@')[0])}</td><td>${esc(x.action)} <b>${esc(x.note_title)}</b> <span class="chip">${CATS[x.category]||esc(x.category)}</span></td></tr>`).join('')||'<tr><td colspan="3">Aún no hay actividad.</td></tr>';
}

// Respaldo (incluye las notas en papelera; los archivos adjuntos solo se listan por nombre)
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
$('bj').onclick=async()=>{$('bm').textContent='Preparando…';
  dl(new Blob([JSON.stringify({exportado:now(),notas:notes,actividad:await getAct(1000)},null,2)],{type:'application/json'}),'notas-respaldo-'+stamp()+'.json');$('bm').textContent='Listo ✓'};
$('bx').onclick=async()=>{
  if(!window.XLSX)return alert('No se pudo cargar la librería de Excel. Usa el respaldo JSON.');
  $('bm').textContent='Preparando…';
  const N=notes.map(n=>({Apartado:CATS[n.category],Título:n.title,Código:n.code,Información:(n.body||'').slice(0,32000),Archivos:n.files.map(f=>f.name).join(', '),'Creada por':n.created_by,Creada:when(n.created_at),'Editada por':n.updated_by,Editada:when(n.updated_at),Estado:n.deleted_at?'En papelera':'Activa'}));
  const A=(await getAct(1000)).map(a=>({Fecha:when(a.created_at),Usuario:a.user_email,Acción:a.action,Nota:a.note_title,Apartado:CATS[a.category]||a.category}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(N),'Notas');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(A),'Actividad');
  XLSX.writeFile(wb,'notas-respaldo-'+stamp()+'.xlsx');$('bm').textContent='Listo ✓'};
