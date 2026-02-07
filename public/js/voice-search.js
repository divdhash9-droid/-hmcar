// [[ARABIC_HEADER]] هذا الملف (public/js/voice-search.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  function injectStyles() {
    if (document.getElementById('hm-voice-search-style')) return;
    const style = document.createElement('style');
    style.id = 'hm-voice-search-style';
    style.textContent = `
      .hm-voice-wrap{position:relative;display:block}
      .hm-voice-btn{position:absolute;left:10px;top:50%;transform:translateY(-50%);border:1px solid rgba(255,255,255,.22);background:rgba(11,31,58,.65);color:#fff;width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s ease, box-shadow .2s ease}
      .hm-voice-btn:hover{transform:translateY(-50%) scale(1.05);box-shadow:0 10px 20px rgba(0,0,0,.25)}
      .hm-voice-btn.is-listening{animation:pulse-voice 1.2s ease-in-out infinite}
      @keyframes pulse-voice{0%,100%{box-shadow:0 0 0 rgba(255,255,255,.0)}50%{box-shadow:0 0 0 10px rgba(255,255,255,.18)}}
      [dir="rtl"] .hm-voice-btn{left:auto;right:10px}
      [dir="rtl"] .hm-voice-pad{padding-right:56px!important}
      [dir="ltr"] .hm-voice-pad{padding-left:56px!important}
    `;
    document.head.appendChild(style);
  }

  function isSearchField(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    const type = (el.getAttribute('type') || '').toLowerCase();
    const name = (el.getAttribute('name') || '').toLowerCase();
    return type === 'search' || el.dataset.voiceSearch === 'true' || name === 'search' || name === 'q';
  }

  function wrapInput(input) {
    if (input.closest('.hm-voice-wrap')) return;

    const wrap = document.createElement('span');
    wrap.className = 'hm-voice-wrap';

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    input.classList.add('hm-voice-pad');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hm-voice-btn';
    btn.setAttribute('aria-label', 'بحث صوتي');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';

    wrap.appendChild(btn);

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }

      input.value = (finalText + interim).trim();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onstart = () => btn.classList.add('is-listening');
    recognition.onend = () => {
      btn.classList.remove('is-listening');
      finalText = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    recognition.onerror = () => {
      btn.classList.remove('is-listening');
    };

    btn.addEventListener('click', () => {
      try {
        recognition.start();
      } catch (e) {
        // ignore repeated start errors
      }
    });
  }

  function init() {
    injectStyles();
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.filter(isSearchField).forEach(wrapInput);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
