'use strict';
function syncChoiceTiles(){
 $$('[data-choice-group]').forEach(group=>{
  const value=group.dataset.choiceGroup==='format'?state.format:state.backgroundMode;
  group.querySelectorAll('[data-choice]').forEach(b=>{const selected=b.dataset.choice===value;b.setAttribute('aria-checked',String(selected));b.tabIndex=selected?0:-1;});
 });
}
$$('[data-choice-group]').forEach(group=>{
 const buttons=[...group.querySelectorAll('[data-choice]')];
 function select(button){const input=$('#'+group.dataset.choiceGroup);input.value=button.dataset.choice;input.onchange?.({target:input});syncChoiceTiles();}
 buttons.forEach((button,index)=>{
  button.onclick=()=>select(button);
  button.addEventListener('keydown',event=>{
   const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
   let next;if(direction)next=(index+direction+buttons.length)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
   event.preventDefault();select(buttons[next]);buttons[next].focus();
  });
 });
});
$('#ai-consent').addEventListener('change',()=>{if($('#ai-consent').checked){$('#ai-consent-panel').classList.remove('consent-required');$('#ai-consent-alert').hidden=true;$('#ai-consent').removeAttribute('aria-invalid');}});
$('#font-style').onchange=async e=>{
 const page=activePage(),font=e.target.value;state.font=font;renderPreview();
 if(CARD_FONTS[font])try{await document.fonts.load(cardFont(font,32));if(activePage()===page&&state.font===font)renderPreview();}catch{toast('Não foi possível carregar esta fonte. Tente novamente.');}
};
document.fonts.ready.then(()=>{if($('#editor').open)renderPreview();});
syncChoiceTiles();
