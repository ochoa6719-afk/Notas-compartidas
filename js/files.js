// Archivos adjuntos (Supabase Storage)
async function touch(){
  const {data}=await sb.from('notes').update({files:cur.files,updated_by:me.email,updated_at:now()}).eq('id',cur.id).select().single();
  if(data)cur=data;
}
async function up(fl){
  if(!cur.id&&!await save())return;
  for(const f of fl){
    $('st').textContent='Subiendo '+f.name+'…';
    let name=f.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w.\-]+/g,'_');
    if(cur.files.some(x=>x.name===name))name=Date.now().toString(36)+'_'+name;
    const {error}=await sb.storage.from('archivos').upload(cur.id+'/'+name,f);
    if(error){$('st').textContent='Error al subir '+f.name+': '+error.message;return}
    cur.files=[...cur.files,{name,size:f.size,by:me.email,at:Date.now()}];await touch();
  }
  $('st').textContent='';files();load();
}
async function files(){
  const el=$('fl');if(!el)return;const id=cur.id,fs=cur.files;
  if(!fs.length){el.innerHTML='';return}
  const {data}=await sb.storage.from('archivos').createSignedUrls(fs.map(f=>id+'/'+f.name),3600);
  if(!$('fl')||!cur||cur.id!==id)return;
  el.innerHTML=fs.map((f,i)=>{const ext=(f.name.split('.').pop()||'').toLowerCase(),u=data?.[i]?.signedUrl||'#';
   const th=/^(png|jpe?g|gif|webp|svg|bmp)$/.test(ext)?`<img src="${u}" loading="lazy" data-big="${u}" title="Ver en grande">`:/^(mp4|webm|mov|m4v)$/.test(ext)?`<video src="${u}#t=0.1" preload="metadata" muted></video>`:esc(ext.slice(0,4).toUpperCase()||'DOC');
   return `<div class="f"><div class="th">${th}</div><div class="fi"><div title="${esc(f.name)}">${esc(f.name)}</div><small>${sz(f.size)} · ${esc((f.by||'').split('@')[0])}</small></div><div class="fb"><a href="${u}" target="_blank">Ver</a><a href="${u}&download=${encodeURIComponent(f.name)}">Descargar</a>${cur.deleted_at?'':`<button class="d" data-rm="${i}">✕</button>`}</div></div>`}).join('');
  el.querySelectorAll('img[data-big]').forEach(i=>i.onclick=()=>{$('lbi').src=i.dataset.big;$('lb').style.display='grid'});
  el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{const f=cur.files[+b.dataset.rm];if(!confirm('¿Quitar "'+f.name+'"?'))return;
    await sb.storage.from('archivos').remove([cur.id+'/'+f.name]);cur.files=cur.files.filter(x=>x!==f);await touch();files();load()});
}


// Ver imágenes en grande: clic o Esc para cerrar
const closeLb=()=>{$('lb').style.display='none';$('lbi').removeAttribute('src')};
$('lb').onclick=closeLb;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeLb();$('ov').style.display='none'}});
