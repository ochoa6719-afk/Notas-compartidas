// Ayudas, constantes y estado compartido
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sz=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const when=t=>new Date(t).toLocaleString('es',{dateStyle:'medium',timeStyle:'short'});
const CATS={personal:'Personal',trabajo:'Trabajo'};
let me=null,notes=[],cur=null,dirty=false,filter='all',timer=null,pend=false;
const cats=()=>me?Object.keys(CATS).filter(k=>me.is_admin||me['can_'+k]):[];
const now=()=>new Date().toISOString();

// Tema claro/oscuro (se recuerda en este navegador)
const aplicaTema=t=>{if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme};
try{aplicaTema(localStorage.getItem('tema'))}catch(e){}
$('th').onclick=()=>{
  const ef=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),n=ef==='dark'?'light':'dark';
  aplicaTema(n);try{localStorage.setItem('tema',n)}catch(e){}};
