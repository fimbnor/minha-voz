import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'firebase/auth';

const ui=id=>document.getElementById(id);
let auth,user=null,enabled=false,status='loading';
const errorMessage=e=>({
 'auth/invalid-credential':'E-mail ou senha inválidos.',
 'auth/email-already-in-use':'Este e-mail já está cadastrado.',
 'auth/weak-password':'Escolha uma senha mais forte.',
 'auth/unauthorized-domain':'Este domínio ainda não foi autorizado no Firebase.',
 'auth/operation-not-allowed':'Este método de entrada ainda não foi ativado no Firebase.',
 'auth/popup-closed-by-user':'A janela de entrada foi fechada.',
 'permission-denied':'Acesso negado. Confira as regras de segurança do Firebase.'
}[e.code]||'Não foi possível concluir. Confira sua conexão e tente novamente.');
function showError(e){console.error(e);ui('auth-status').textContent=errorMessage(e);}
function requireUser(){if(!user)throw Error('Entre na sua conta para usar o Gemini.');return user;}
window.minhaVozCloud={
 isEnabled:()=>enabled,
 status:()=>status,
 currentUser:()=>user,
 showLogin(){ui('auth-status').textContent='';ui('auth-dialog').showModal();},
 async token(){return requireUser().getIdToken();}
};
async function start(){
 try{
  const r=await fetch('/api/firebase-config',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível verificar a configuração da conta.');
  const config=await r.json();if(!config.enabled){status='local';return;}
  const app=initializeApp(config.firebase);auth=getAuth(app);enabled=true;
  ui('account-button').hidden=false;
  onAuthStateChanged(auth,current=>{user=current;status='ready';ui('account-button').textContent=current?'Minha conta':'Entrar';ui('auth-logged-in').hidden=!current;ui('auth-logged-out').hidden=!!current;ui('account-email').textContent=current?.email||'';document.dispatchEvent(new CustomEvent('minhavoz-auth-changed'));},error=>{status='error';console.error('Não foi possível verificar a conta',error);});
  ui('account-button').onclick=()=>window.minhaVozCloud.showLogin();ui('auth-close').onclick=()=>ui('auth-dialog').close();
  ui('auth-google').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());ui('auth-dialog').close();}catch(e){showError(e);}};
  ui('auth-form').onsubmit=async e=>{e.preventDefault();try{const email=ui('auth-email').value,password=ui('auth-password').value;if(e.submitter?.value==='register')await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);ui('auth-dialog').close();}catch(err){showError(err);}};
  ui('auth-reset').onclick=async()=>{try{if(!ui('auth-email').value){ui('auth-status').textContent='Digite seu e-mail para recuperar a senha.';return;}await sendPasswordResetEmail(auth,ui('auth-email').value);ui('auth-status').textContent='Se o endereço estiver cadastrado, verifique seu e-mail.';}catch(e){showError(e);}};
  ui('auth-signout').onclick=async()=>{await signOut(auth);ui('auth-dialog').close();};
 }catch(e){status='error';console.error('Firebase indisponível',e);}
}
start();
