/* Auto servis „M-Milošević" — main.js (vanilla, bez biblioteka) */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var desktopMQ = window.matchMedia('(min-width: 1024px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* 7. Automatska godina i broj godina iskustva */
  var YEAR = new Date().getFullYear();
  var YEARS = YEAR - 2000;
  $$('[data-year]').forEach(function (el) { el.textContent = YEAR; });
  $$('[data-years]').forEach(function (el) { el.textContent = YEARS; });
  $$('[data-count="years"]').forEach(function (el) { el.setAttribute('data-count', YEARS); el.textContent = YEARS; });

  /* Aktivna stavka menija (header je identičan na svim stranama) */
  var page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link').forEach(function (a) {
    if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });

  /* 1. Sticky header — .scrolled posle 50px */
  var header = $('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 50); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 2. Mobilni hamburger meni */
  var burger = $('.burger');
  var nav = $('#main-nav');
  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    nav.classList.toggle('is-open', open);
    body.classList.toggle('is-locked', open);
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktopMQ.matches) setMenu(false);
    });
  }

  /* 3. Mega-meni „Usluge" — hover na desktopu, klik na mobilnom */
  var megaItem = $('.has-mega');
  var megaToggle = megaItem && $('.nav__toggle', megaItem);
  var megaPanel = megaItem && $('.mega', megaItem);
  var megaTimer;
  function setMega(open) {
    if (!megaItem) return;
    clearTimeout(megaTimer);
    megaItem.classList.toggle('is-open', open);
    megaPanel.classList.toggle('is-open', open);
    megaToggle.setAttribute('aria-expanded', String(open));
  }
  if (megaItem) {
    megaItem.addEventListener('mouseenter', function () { if (desktopMQ.matches) setMega(true); });
    megaItem.addEventListener('mouseleave', function () {
      if (desktopMQ.matches) megaTimer = setTimeout(function () { setMega(false); }, 180);
    });
    megaItem.addEventListener('focusin', function () { if (desktopMQ.matches) setMega(true); });
    megaItem.addEventListener('focusout', function (e) {
      if (desktopMQ.matches && !megaItem.contains(e.relatedTarget)) setMega(false);
    });
    megaToggle.addEventListener('click', function () {
      setMega(megaToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  /* ESC zatvara meni i mega-meni */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (nav && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    if (megaItem && megaItem.classList.contains('is-open')) {
      setMega(false);
      if (desktopMQ.matches) $('.nav__link', megaItem).focus();
    }
  });

  /* Prelazak na desktop — resetuj mobilna stanja */
  var onMQ = function () { setMenu(false); setMega(false); };
  if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onMQ);
  else if (desktopMQ.addListener) desktopMQ.addListener(onMQ);

  /* 4. FAQ harmonika — samo jedno otvoreno pitanje, animirana visina */
  function setFaq(item, open) {
    var btn = $('.faq__q', item);
    var panel = $('.faq__a', item);
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    if (reduceMotion) { panel.style.height = open ? 'auto' : '0px'; return; }
    if (open) {
      panel.style.height = panel.scrollHeight + 'px';
      var done = function (e) {
        if (e.propertyName !== 'height') return;
        if (item.classList.contains('is-open')) panel.style.height = 'auto';
        panel.removeEventListener('transitionend', done);
      };
      panel.addEventListener('transitionend', done);
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      panel.getBoundingClientRect(); // reflow
      panel.style.height = '0px';
    }
  }
  $$('[data-faq]').forEach(function (faq) {
    var items = $$('.faq__item', faq);
    items.forEach(function (item) {
      $('.faq__q', item).addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) { if (other !== item && other.classList.contains('is-open')) setFaq(other, false); });
        setFaq(item, willOpen);
      });
    });
  });

  /* 5. Brojači pri ulasku u ekran */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, dur = 1600;
    var step = function (t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  /* 6. Fade-up animacije */
  var reveals = $$('.reveal');
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    reveals.forEach(function (el) {
      var sibs = $$(':scope > .reveal', el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 80 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCounter(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* 8. „Trenutno radimo / ne radimo" — Europe/Belgrade,
        Pon–Pet 08–14 i 15–18 radimo, 14–15 pauza */
  var statusEls = $$('[data-status]');
  function updateStatus() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Belgrade', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (err) { return; }
    var mins = (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
    var weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(parts.weekday) !== -1;
    var state = 'closed';
    if (weekday && mins >= 480 && mins < 1080) state = (mins >= 840 && mins < 900) ? 'break' : 'open';
    var label = { open: 'Trenutno radimo', 'break': 'Pauza do 15h', closed: 'Trenutno ne radimo' }[state];
    statusEls.forEach(function (el) {
      el.textContent = label;
      el.classList.toggle('is-open', state === 'open');
    });
  }
  if (statusEls.length) { updateStatus(); setInterval(updateStatus, 60000); }
})();
