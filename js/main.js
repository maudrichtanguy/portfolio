// main.js — Theme toggle (persisted), smooth UX helpers and simple contact handler
(function(){
  const root = document.documentElement;
  // Soulignement dégradé persistant sous les titres après le premier hover
  function persistentUnderlineTitles() {
    document.querySelectorAll('h1:not(#typewriter-h1), h2').forEach(title => {
      title.addEventListener('mouseenter', function() {
        title.classList.add('underline');
      }, { once: true });
    });
  }
  persistentUnderlineTitles();
  // === ANIMATION FADE-IN UP SUR LES CARDS/BLOCS ===
  // Utilise IntersectionObserver pour ajouter la classe .visible quand l'élément entre dans le viewport
  function fadeInOnScroll(selector) {
    const els = document.querySelectorAll(selector);
    if (!('IntersectionObserver' in window)) {
      // Fallback: tout visible
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => observer.observe(el));
  }
  // Applique sur cards, messages, media
  fadeInOnScroll('.card');
  fadeInOnScroll('.message');
  fadeInOnScroll('.media');

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    // update all toggles on the page
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  }

  // init theme: localStorage > prefers-color-scheme > default light
  const stored = localStorage.getItem('theme');
  if(stored){ applyTheme(stored); }
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){ applyTheme('dark'); }

  // bind toggles
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('theme', next);
    });
  });

  // If the page was opened with #footer-contact or the contact link is clicked, open the details panel
  // Animated open/close for <details class="footer-contact"> panels
  function animateOpen(details){
    const panel = details.querySelector('.footer-contact-panel');
    if(!panel) return;
    // prepare
    panel.style.display = 'block';
    panel.style.height = '0px';
    panel.style.opacity = '0';
    // ensure accessible state
    details.open = true;
    // measure and animate to full height
    const target = panel.scrollHeight + 'px';
    requestAnimationFrame(()=>{
      panel.style.transition = 'height 320ms ease, opacity 220ms ease';
      panel.style.height = target;
      panel.style.opacity = '1';
    });
    const onEnd = function(e){
      if(e.propertyName === 'height'){
        panel.style.height = 'auto';
        panel.removeEventListener('transitionend', onEnd);
      }
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function animateClose(details){
    const panel = details.querySelector('.footer-contact-panel');
    if(!panel) return;
    // from current height -> 0
    const current = panel.scrollHeight + 'px';
    panel.style.height = current;
    panel.style.opacity = '1';
    requestAnimationFrame(()=>{
      panel.style.transition = 'height 320ms ease, opacity 220ms ease';
      panel.style.height = '0px';
      panel.style.opacity = '0';
    });
    const onEnd = function(e){
      if(e.propertyName === 'height'){
        details.open = false;
        panel.style.display = '';
        panel.style.height = '';
        panel.removeEventListener('transitionend', onEnd);
      }
    };
    panel.addEventListener('transitionend', onEnd);
  }

  // Attach toggle handlers to all footer-contact details
  document.querySelectorAll('details.footer-contact').forEach(d => {
    // ensure panel exists; guarantee initial closed visual state
    const panel = d.querySelector('.footer-contact-panel');
    if(panel){ panel.style.height = d.open ? 'auto' : '0px'; panel.style.opacity = d.open ? '1' : '0'; }
    d.addEventListener('toggle', ()=>{
      if(d.open) animateOpen(d); else animateClose(d);
    });
  });

  // If the page was opened with #footer-contact or the contact link is clicked, open the details panel using animation
  function openFooterContactIfNeeded(){
    try{
      if(location.hash === '#footer-contact'){
        const d = document.getElementById('footer-contact');
        if(d && d.tagName === 'DETAILS') animateOpen(d);
      }
    }catch(e){/* ignore */}
  }

  // open if hash present on load
  openFooterContactIfNeeded();

  // also open when clicking nav links to #footer-contact
  document.querySelectorAll('a[href="#footer-contact"]').forEach(a => {
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const d = document.getElementById('footer-contact');
      if(d && d.tagName === 'DETAILS'){
        // animate and scroll into view
        animateOpen(d);
        d.scrollIntoView({behavior:'smooth', block:'center'});
        // update the hash without jumping
        history.replaceState(null, '', '#footer-contact');
      }
    });
  });

  // === Carousel Logic for Project Preview ===
  function initCarousel(carouselElem) {
    const wrapper = carouselElem.querySelector('.carousel-wrapper');
    const items = carouselElem.querySelectorAll('.carousel-item');
    const btnPrev = carouselElem.querySelector('.carousel-btn.prev');
    const btnNext = carouselElem.querySelector('.carousel-btn.next');
    if (!wrapper || !items.length || !btnPrev || !btnNext) return;

    let currentIndex = 0;
    const totalItems = items.length;

    function updateCarousel() {
      wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    btnNext.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalItems;
      updateCarousel();
    });

    btnPrev.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalItems) % totalItems;
      updateCarousel();
    });
  }

  // Initialize any carousel on the page
  document.querySelectorAll('.carousel').forEach(initCarousel);

  // === Typewriter Effect ===
  function initTypewriter(element, speed = 80) {
    if (!element) return;

    const text = element.textContent.trim();
    element.textContent = '';
    let i = 0;

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        // Animation finished, remove cursor by adding a class
        element.classList.add('finished-typing');
      }
    }

    type();
  }

  // Start the typewriter effect on the h1
  initTypewriter(document.getElementById('typewriter-h1'));

  // === Custom Weather Widget ===
  function fetchWeather() {
    const widgetContainer = document.getElementById('custom-weather-widget');
    if (!widgetContainer) return;

    const lat = 43.70;
    const lon = 7.27;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;
        const icon = getWeatherIcon(weatherCode);
        widgetContainer.innerHTML = `<span style="font-size: 2rem;">${icon}</span> ${temp}°C`;
      })
      .catch(error => {
        console.error('Error fetching weather:', error);
        widgetContainer.innerHTML = 'N/A';
      });
  }

  function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '🌤️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 80 && code <= 82) return '⛈️';
    if (code >= 95 && code <= 99) return '🌩️';
    return '🤷';
  }

  fetchWeather();

})();