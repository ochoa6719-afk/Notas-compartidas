// Panel del administrador: permisos por usuario
$('ad').onclick=async()=>{$('ov').style.display='grid';
  const {data}=await sb.from('profiles').select('*').order('created_at');
  $('ub').innerHTML=(data||[]).map(u=>`<tr><td>${esc(u.email)}${u.is_admin?' <small>(admin)</small>':!u.can_personal&&!u.can_trabajo?' 🆕':''}</td>${Object.keys(CATS).map(k=>`<td><input type="checkbox" data-u="${u.id}" data-k="${k}" ${u.is_admin||u['can_'+k]?'checked':''} ${u.is_admin?'disabled':''}></td>`).join('')}</tr>`).join('')};
$('ub').onchange=async e=>{const c=e.target;if(!c.dataset.u)return;
  const {error}=await sb.from('profiles').update({['can_'+c.dataset.k]:c.checked}).eq('id',c.dataset.u);
  if(error){alert(error.message);c.checked=!c.checked}};
$('xc').onclick=()=>$('ov').style.display='none';
