import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'firebase/auth';
import {getFirestore,doc,collection,getDoc,getDocs,setDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
import {getStorage,ref,uploadBytes,getBytes,deleteObject} from 'firebase/storage';

const ui=id=>document.getElementById(id);
let auth,db,storage,user=null,enabled=false,status='loading';
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
function requireUser(){if(!user)throw Error('Entre na sua conta para usar projetos na nuvem.');return user;}
function projectRef(uid,id){return doc(db,'users',uid,'projects',id);}
function blobPath(uid,id,revision){return `users/${uid}/projects/${id}/${revision}.json`;}
window.minhaVozCloud={
 isEnabled:()=>enabled,
 status:()=>status,
 currentUser:()=>user,
 showLogin(){ui('auth-status').textContent='';ui('auth-dialog').showModal();},
 async token(){return requireUser().getIdToken();},
 async save(project){
  const uid=requireUser().uid,id=project.id,revision=crypto.randomUUID(),path=blobPath(uid,id,revision);
  const prior=await getDoc(projectRef(uid,id));
  const bytes=new TextEncoder().encode(JSON.stringify(project));
  if(bytes.length>40*1024*1024)throw Error('O projeto ultrapassa o limite de 40 MB.');
  await uploadBytes(ref(storage,path),bytes,{contentType:'application/json'});
  try{await setDoc(projectRef(uid,id),{title:project.title,updatedAt:serverTimestamp(),path,version:1});}
  catch(e){await deleteObject(ref(storage,path)).catch(()=>{});throw e;}
  if(prior.exists()&&prior.data().path!==path)await deleteObject(ref(storage,prior.data().path)).catch(()=>{});
 },
 async list(){const uid=requireUser().uid,s=await getDocs(collection(db,'users',uid,'projects'));return s.docs.map(d=>({id:d.id,...d.data(),updatedAt:d.data().updatedAt?.toMillis()||0}));},
 async load(meta){const uid=requireUser().uid;const expected=`users/${uid}/projects/${meta.id}/`;if(!meta.path.startsWith(expected))throw Error('Caminho do projeto inválido.');return JSON.parse(new TextDecoder().decode(await getBytes(ref(storage,meta.path),40*1024*1024)));},
 async remove(meta){const uid=requireUser().uid;await deleteDoc(projectRef(uid,meta.id));await deleteObject(ref(storage,meta.path)).catch(()=>{});}
};
async function start(){
 try{
  const r=await fetch('/api/firebase-config',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível verificar a configuração da conta.');
  const config=await r.json();if(!config.enabled){status='local';return;}
  const app=initializeApp(config.firebase);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);enabled=true;status='ready';
  ui('account-button').hidden=false;
  onAuthStateChanged(auth,current=>{user=current;ui('account-button').textContent=current?'Minha conta':'Entrar';ui('auth-logged-in').hidden=!current;ui('auth-logged-out').hidden=!!current;ui('account-email').textContent=current?.email||'';document.dispatchEvent(new CustomEvent('minhavoz-auth-changed'));});
  ui('account-button').onclick=()=>window.minhaVozCloud.showLogin();ui('auth-close').onclick=()=>ui('auth-dialog').close();
  ui('auth-google').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());ui('auth-dialog').close();}catch(e){showError(e);}};
  ui('auth-form').onsubmit=async e=>{e.preventDefault();try{const email=ui('auth-email').value,password=ui('auth-password').value;if(e.submitter?.value==='register')await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);ui('auth-dialog').close();}catch(err){showError(err);}};
  ui('auth-reset').onclick=async()=>{try{if(!ui('auth-email').value){ui('auth-status').textContent='Digite seu e-mail para recuperar a senha.';return;}await sendPasswordResetEmail(auth,ui('auth-email').value);ui('auth-status').textContent='Se o endereço estiver cadastrado, verifique seu e-mail.';}catch(e){showError(e);}};
  ui('auth-signout').onclick=async()=>{await signOut(auth);ui('auth-dialog').close();};
 }catch(e){status='error';console.error('Firebase indisponível',e);}
}
start();
