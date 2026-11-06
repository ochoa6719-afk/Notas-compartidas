// Lista de notas, pestañas, búsqueda y editor
async function load(){
  if(!me)return;
  const {data:p}=await sb.from('profiles').select('*').eq('id',me.id).single();if(p)me=p;
  $('ad').style.display=me.is_admin?'':'none';
  const was=pend;pend=!cats().length;
  if(pend){notes=[];cur=null;tabs();list();document.body.classList.add('ver');
    $('main').innerHTML='<div class="empty"><div><div style="font-size:48px">⏳</div><b>Tu cuenta está pendiente de aprobación</b><br>El administrador debe darte acceso. Esta pantalla se actualiza sola.</div></div>';return}
  if(was){document.body.classList.remove('ver');draw()}
  const {data}=await sb.from('notes').select('*').order('updated_at',{ascending:false});if(!data)return;
  notes=data;
  if(filter!=='all'&&filter!=='trash'&&!cats().includes(filter))filter='all';
  if(cur&&cur.id){const n=notes.find(x=>x.id===cur.id);
    if(!n){cur=null;draw()}else if(!dirty&&n.updated_at!==cur.updated_at){cur=n;draw()}}
  tabs();list();
}
function tabs(){const c=cats();if(!c.length){$('tabs').innerHTML='';return}
  const base=c.length>1?['all',...c]:['all'],t=notes.filter(n=>n.deleted_at).length;
  $('tabs').innerHTML=[...base,'trash'].map(k=>`<button class="tb ${filter===k?'on':''}" data-k="${k}">${k==='all'?(c.length>1?'Todas':'Notas'):k==='trash'?'🗑 Papelera'+(t?' ('+t+')':''):CATS[k]}</button>`).join('')}
$('tabs').onclick=e=>{const b=e.target.closest('[data-k]');if(b){filter=b.dataset.k;tabs();list()}};
function list(){
  const q=$('q').value.toLowerCase().trim(),tr=filter==='trash';
  const a=notes.filter(n=>!!n.deleted_at===tr&&(tr||filter==='all'||n.category===filter)&&(!q||(n.title+n.code+n.body).toLowerCase().includes(q)));
  $('list').innerHTML=a.map(n=>`<div class="it ${cur&&cur.id===n.id?'on':''}" data-id="${n.id}"><b>${esc(n.title)}</b><small><span class="chip">${CATS[n.category]}</span>${tr?'🗑 '+esc((n.deleted_by||'').split('@')[0])+' · '+when(n.deleted_at):(n.files.length?'📎'+n.files.length+' · ':'')+esc((n.updated_by||'').split('@')[0])+' · '+when(n.updated_at)}</small></div>`).join('')||(pend?'':`<div class="meta" style="padding:12px">${tr?'La papelera está vacía.':'Aún no hay notas.'}</div>`);
}
$('list').onclick=e=>{const i=e.target.closest('.it');if(!i)return;if(cur&&cur.id===i.dataset.id)return;if(dirty&&!confirm('Tienes cambios sin guardar. ¿Cambiar de nota sin guardar?'))return;cur=notes.find(n=>n.id===i.dataset.id);dirty=false;document.body.classList.add('ver');draw();list()};
$('q').oninput=list;
$('nuevo').onclick=()=>{if(!cats().length)return;if(dirty&&!confirm('Tienes cambios sin guardar. ¿Crear otra nota sin guardar?'))return;if(filter==='trash'){filter='all';tabs();list()}cur={id:null,title:'',code:'',body:'',files:[],category:filter!=='all'?filter:cats()[0]};dirty=false;document.body.classList.add('ver');draw();$('t')?.focus()};


function draw(){
  if(!cur){if(!pend)$('main').innerHTML='<div class="empty"><div><div style="font-size:48px">📒</div>Selecciona una nota o crea una nueva</div></div>';return}
  const tr=!!cur.deleted_at,dis=tr?'disabled':'';
  $('main').innerHTML=`<div class="ed">
   <div class="row"><span class="sp"></span><button id="cl" title="Cerrar esta nota">✕ Cerrar nota</button></div>
   ${tr?`<div class="banner">🗑 Esta nota está en la papelera (enviada por ${esc(cur.deleted_by||'—')} · ${when(cur.deleted_at)}). Restáurala para poder editarla.</div>`:''}
   <input id="t" placeholder="Título" value="${esc(cur.title)}" ${dis}>
   <div class="grid2">
    <div><label>Apartado</label><select id="ct" ${dis}>${cats().map(k=>`<option value="${k}" ${cur.category===k?'selected':''}>${CATS[k]}</option>`).join('')}</select></div>
    <div><label>Código</label><div class="row"><input id="c" class="code" style="flex:1" placeholder="Código del formato" value="${esc(cur.code)}" ${dis}><button id="cp">Copiar</button></div></div>
   </div>
   <div class="row" style="align-items:flex-end"><label style="flex:1">Información</label><button id="cb" style="padding:4px 10px;font-size:12px;margin-bottom:6px">Copiar</button></div><textarea id="b" placeholder="Escribe aquí la información…" ${dis}>${esc(cur.body)}</textarea>
   <label>Archivos</label>
   ${tr?'':'<div class="drop" id="dz">📎 Arrastra archivos aquí o haz clic para adjuntar<br><small>Fotos, videos, documentos — cualquier tipo</small></div><input type="file" id="fi" multiple hidden>'}
   <div id="st" class="meta"></div><div class="files" id="fl"></div>
   <div class="row" style="margin-top:22px">
    ${tr?'<button class="p" id="rs">↩ Restaurar nota</button>'+(me.is_admin?'<button class="d" id="pd">Eliminar definitivamente</button>':''):(cur.id?'<button class="d" id="del">Enviar a la papelera</button>':'')}
    <span class="sp"></span>${tr?'':'<button class="p" id="ok">Guardar</button>'}</div>
   <div class="meta">${cur.id?`Creada por ${esc(cur.created_by||'—')} · ${when(cur.created_at)}<br>Última edición: ${esc(cur.updated_by||'—')} · ${when(cur.updated_at)}`:''}</div></div>`;
  ['t','c','b','ct'].forEach(i=>$(i).oninput=()=>dirty=true);
  $('cl').onclick=()=>{if(dirty&&!confirm('Tienes cambios sin guardar. ¿Cerrar la nota sin guardar?'))return;cur=null;dirty=false;document.body.classList.remove('ver');draw();list()};
  $('cp').onclick=()=>{navigator.clipboard?.writeText($('c').value);$('cp').textContent='¡Copiado!';setTimeout(()=>$('cp').textContent='Copiar',1200)};
  $('cb').onclick=()=>{navigator.clipboard?.writeText($('b').value);$('cb').textContent='¡Copiado!';setTimeout(()=>$('cb')&&($('cb').textContent='Copiar'),1200)};
  if($('ok'))$('ok').onclick=async()=>{if(await save()){$('ok').textContent='✓ Guardado';setTimeout(()=>$('ok')&&($('ok').textContent='Guardar'),1200)}};
  if($('del'))$('del').onclick=async()=>{if(!confirm('¿Enviar esta nota a la papelera? Podrás restaurarla después.'))return;
    const {error}=await sb.from('notes').update({deleted_at:now(),deleted_by:me.email,updated_by:me.email,updated_at:now()}).eq('id',cur.id);
    if(error)return alert('No se pudo: '+error.message);cur=null;dirty=false;document.body.classList.remove('ver');draw();load()};
  if($('rs'))$('rs').onclick=async()=>{
    const {data,error}=await sb.from('notes').update({deleted_at:null,deleted_by:null,updated_by:me.email,updated_at:now()}).eq('id',cur.id).select().single();
    if(error)return alert('No se pudo: '+error.message);cur=data;filter='all';await load();draw()};
  if($('pd'))$('pd').onclick=async()=>{if(!confirm('¿Eliminar DEFINITIVAMENTE esta nota y sus archivos? No se puede deshacer.'))return;
    if(cur.files.length)await sb.storage.from('archivos').remove(cur.files.map(f=>cur.id+'/'+f.name));
    const {error}=await sb.from('notes').delete().eq('id',cur.id);
    if(error)return alert('No se pudo: '+error.message);cur=null;document.body.classList.remove('ver');draw();load()};
  const dz=$('dz');if(dz){dz.onclick=()=>$('fi').click();$('fi').onchange=e=>{up([...e.target.files]);e.target.value=''};
    dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');
    dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');up([...e.dataTransfer.files])}}
  files();
}
async function save(){
  const row={title:$('t').value.trim()||'Sin título',code:$('c').value,body:$('b').value,category:$('ct').value,updated_by:me.email,updated_at:now()};
  const q=cur.id?sb.from('notes').update(row).eq('id',cur.id):sb.from('notes').insert({...row,created_by:me.email});
  const {data,error}=await q.select().single();
  if(error){alert('No se pudo guardar: '+error.message);return null}
  dirty=false;cur=data;await load();return data;
}

// Aviso al cerrar/recargar la pestaña con cambios sin guardar
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
// Atajos: Ctrl+S guarda, Ctrl+K busca
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey))return;const k=e.key.toLowerCase();
  if(k==='s'){e.preventDefault();if($('ok'))$('ok').click()}
  else if(k==='k'){e.preventDefault();if(!me)return;document.body.classList.remove('ver');$('q').focus();$('q').select()}
});
