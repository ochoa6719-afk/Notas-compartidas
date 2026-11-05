// Registro, ingreso y cierre de sesión
async function auth(mode){
  const email=$('em').value.trim(),password=$('pw').value;$('msg').textContent='';
  if(!email||!password)return $('msg').textContent='Escribe correo y contraseña.';
  const {data,error}=mode==='in'?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});
  if(error)return $('msg').textContent=error.message;
  if(mode==='up'&&!data.session)$('msg').textContent='Cuenta creada. Confirma tu correo y luego pulsa Ingresar.';
}
$('in').onclick=()=>auth('in');$('up').onclick=()=>auth('up');
$('pw').onkeydown=e=>{if(e.key==='Enter')auth('in')};
$('out').onclick=()=>sb.auth.signOut();
sb.auth.onAuthStateChange((_e,s)=>setTimeout(()=>s?start(s.user):stop(),0));
async function start(u){
  if(me&&me.id===u.id)return;
  const {data}=await sb.from('profiles').select('*').eq('id',u.id).single();
  if(!data)return $('msg').textContent='No se encontró tu perfil. Revisa que ejecutaste supabase.sql.';
  me=data;$('lg').style.display='none';$('app').style.display='grid';
  $('me').textContent=me.email;$('me').title=me.email;
  cur=null;filter='all';await load();draw();clearInterval(timer);timer=setInterval(load,5000);
}
function stop(){clearInterval(timer);me=null;cur=null;notes=[];$('app').style.display='none';$('lg').style.display='grid';$('pw').value=''}

