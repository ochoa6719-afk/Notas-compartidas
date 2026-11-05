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
  if(filter!=='all'&&!cats().includes(filter))filter='all';
  if(cur&&cur.id){const n=notes.find(x=>x.id===cur.id);
    if(!n){cur=null;draw()}else if(!dirty&&n.updated_at!==cur.updated_at){cur=n;draw()}}
  tabs();list();
}
function tabs(){const c=cats();$('tabs').innerHTML=c.length>1?['all',...c].map(k=>`<button class="tb ${filter===k?'on':''}" data-k="${k}">${k==='all'?'Todas':CATS[k]}</button>`).join(''):''}
$('tabs').onclick=e=>{const b=e.target.closest('[data-k]');if(b){filter=b.dataset.k;tabs();list()}};
function list(){
  const q=$('q').value.toLowerCase().trim();
  const a=notes.filter(n=>(filter==='all'||n.category===filter)&&(!q||(n.title+n.code+n.body).toLowerCase().includes(q)));
  $('list').innerHTML=a.map(n=>`<div class="it ${cur&&cur.id===n.id?'on':''}" data-id="${n.id}"><b>${esc(n.title)}</b><small><span class="chip">${CATS[n.category]}</span>${n.files.length?'📎'+n.files.length+' · ':''}${esc((n.updated_by||'').split('@')[0])} · ${when(n.updated_at)}</small></div>`).join('')||(pend?'':'<div class="meta" style="padding:12px">Aún no hay notas.</div>');
}
$('list').onclick=e=>{const i=e.target.closest('.it');if(!i)return;cur=notes.find(n=>n.id===i.dataset.id);dirty=false;document.body.classList.add('ver');draw();list()};
$('q').oninput=list;
$('nuevo').onclick=()=>{if(!cats().length)return;cur={id:null,title:'',code:'',body:'',files:[],category:filter!=='all'?filter:cats()[0]};dirty=false;document.body.classList.add('ver');draw();$('t')?.focus()};


function draw(){
  if(!cur){if(!pend)$('main').innerHTML='<div class="empty"><div><div style="font-size:48px">📒</div>Selecciona una nota o crea una nueva</div></div>';return}
  $('main').innerHTML=`<div class="ed">
   <button class="back" id="bk">← Notas</button>
   <input id="t" placeholder="Título" value="${esc(cur.title)}">
   <label>Apartado</label><select id="ct">${cats().map(k=>`<option value="${k}" ${cur.category===k?'selected':''}>${CATS[k]}</option>`).join('')}</select>
   <label>Código</label><div class="row"><input id="c" class="code" style="flex:1" placeholder="Código del formato" value="${esc(cur.code)}"><button id="cp">Copiar</button></div>
   <label>Información</label><textarea id="b" placeholder="Escribe aquí la información…">${esc(cur.body)}</textarea>
   <label>Archivos</label>
   <div class="drop" id="dz">📎 Arrastra archivos aquí o haz clic para adjuntar<br><small>Fotos, videos, documentos — cualquier tipo</small></div>
   <input type="file" id="fi" multiple hidden><div id="st" class="meta"></div><div class="files" id="fl"></div>
   <div class="row" style="margin-top:22px">${cur.id?'<button class="d" id="del">Eliminar nota</button>':''}<span class="sp"></span><button class="p" id="ok">Guardar</button></div>
   <div class="meta">${cur.id?`Creada por ${esc(cur.created_by||'—')} · ${when(cur.created_at)}<br>Última edición: ${esc(cur.updated_by||'—')} · ${when(cur.updated_at)}`:''}</div></div>`;
  ['t','c','b','ct'].forEach(i=>$(i).oninput=()=>dirty=true);
  $('bk').onclick=()=>document.body.classList.remove('ver');
  $('cp').onclick=()=>{navigator.clipboard?.writeText($('c').value);$('cp').textContent='¡Copiado!';setTimeout(()=>$('cp').textContent='Copiar',1200)};
  $('ok').onclick=async()=>{if(await save()){$('ok').textContent='✓ Guardado';setTimeout(()=>$('ok')&&($('ok').textContent='Guardar'),1200)}};
  if($('del'))$('del').onclick=async()=>{if(!confirm('¿Eliminar esta nota y sus archivos para todos?'))return;
    if(cur.files.length)await sb.storage.from('archivos').remove(cur.files.map(f=>cur.id+'/'+f.name));
    await sb.from('notes').delete().eq('id',cur.id);cur=null;dirty=false;document.body.classList.remove('ver');draw();load()};
  const dz=$('dz');dz.onclick=()=>$('fi').click();$('fi').onchange=e=>{up([...e.target.files]);e.target.value=''};
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');up([...e.dataTransfer.files])};
  files();
}
async function save(){
  const row={title:$('t').value.trim()||'Sin título',code:$('c').value,body:$('b').value,category:$('ct').value,updated_by:me.email,updated_at:now()};
  const q=cur.id?sb.from('notes').update(row).eq('id',cur.id):sb.from('notes').insert({...row,created_by:me.email});
  const {data,error}=await q.select().single();
  if(error){alert('No se pudo guardar: '+error.message);return null}
  dirty=false;cur=data;await load();return data;
}
