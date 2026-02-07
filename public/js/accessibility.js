// [[ARABIC_HEADER]] هذا الملف (public/js/accessibility.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

(function(){
  function onEscape(e){
    if(e.key !== 'Escape') return;

    // Close bootstrap dropdowns/modals if present
    try{
      const openDropdown = document.querySelector('.dropdown-menu.show');
      if(openDropdown){
        const toggle = openDropdown.parentElement?.querySelector('[data-bs-toggle="dropdown"]');
        if(toggle) toggle.click();
      }
    }catch(_){ }

    try{
      const openModal = document.querySelector('.modal.show');
      if(openModal && window.bootstrap){
        const instance = window.bootstrap.Modal.getInstance(openModal);
        if(instance) instance.hide();
      }
    }catch(_){ }
  }

  function init(){
    document.addEventListener('keydown', onEscape);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
