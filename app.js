(function () {
  'use strict';
  var M = window.MENU;

  // ---------- utilita' ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function giorniTra(a, b) { return Math.round((b - a) / 86400000); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function oggi() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function memo(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  var INIZIO = parse(M.inizio);
  var FINE = parse(M.fine);
  var ROMANI = ['I', 'II', 'III', 'IV'];
  var GIORNI_BREVI = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  var PORTATE = [
    ['primo', 'Primo piatto', '🍝'],
    ['secondo', 'Secondo piatto', '🍗'],
    ['contorno', 'Contorno', '🥗'],
    ['dessert', 'Dessert', '🍎'],
    ['pane', 'Pane', '🍞']
  ];

  // ---------- regole del menu ----------
  function isInverno(d) { return M.mesiInvernali.indexOf(d.getMonth() + 1) !== -1; }

  function chiusuraDel(d) {
    var k = ymd(d);
    for (var i = 0; i < M.chiusure.length; i++) {
      if (k >= M.chiusure[i].da && k <= M.chiusure[i].a) return M.chiusure[i];
    }
    return null;
  }

  function fuoriPeriodo(d) { var k = ymd(d); return k < M.inizio || k > M.fine; }

  // Numero della settimana del ciclo (1-4)
  function settimanaCiclo(d) {
    var lunedi = addDays(d, -((d.getDay() + 6) % 7));
    var passate = Math.floor(giorniTra(INIZIO, lunedi) / 7);
    return ((((passate + (M.settimanaIniziale - 1)) % 4) + 4) % 4) + 1;
  }

  function titoloStagione(d) {
    return 'Menù ' + (isInverno(d) ? 'Invernale' : 'Estivo') + ' ' + M.anno;
  }

  // Stato di un giorno: { tipo: 'aperto' | 'chiusura' | 'weekend' | 'fuori', ... }
  function stato(d) {
    if (fuoriPeriodo(d)) return { tipo: 'fuori' };
    var c = chiusuraDel(d);
    if (c) return { tipo: 'chiusura', chiusura: c };
    if (d.getDay() === 0 || d.getDay() === 6) return { tipo: 'weekend' };
    var sett = settimanaCiclo(d);
    var db = isInverno(d) ? M.menuInvernale : M.menuEstivo;
    var menu = db[sett] && db[sett][d.getDay()];
    return { tipo: 'aperto', settimana: sett, menu: menu || null };
  }

  // "Piatto||Infanzia: Altro" -> { nome, infanzia }
  function dividi(testo) {
    var p = String(testo).split('||');
    return { nome: p[0].trim(), infanzia: p[1] ? p[1].trim() : '' };
  }

  function haSurgelati(menu) {
    return PORTATE.some(function (p) { return String(menu[p[0]]).indexOf('*') !== -1; });
  }

  // ---------- messaggio breve + condivisione ----------
  var timerToast;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { t.hidden = true; }, 2600);
  }

  function urlApp() { return location.origin + location.pathname; }

  function condividi(titolo, testo) {
    var dati = { title: titolo, text: testo, url: urlApp() };
    if (navigator.share) {
      return navigator.share(dati).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        copia(testo + '\n' + urlApp());
      });
    }
    return copia(testo + '\n' + urlApp());
  }
  function copia(testo) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(testo).then(
        function () { toast('Copiato: ora puoi incollarlo in un messaggio'); },
        function () { toast('Non riesco a condividere da questo browser'); });
    }
    toast('Non riesco a condividere da questo browser');
    return Promise.resolve();
  }

  // ---------- schede (Giorno / Mese) ----------
  var scheda = 'oggi';
  var giorno = null;          // giorno mostrato nella vista giornaliera
  var meseVisto = null;       // primo del mese mostrato nella vista mensile

  function mostraScheda(nome, scorriAOggi) {
    scheda = nome;
    $('vista-oggi').hidden = nome !== 'oggi';
    $('vista-mese').hidden = nome !== 'mese';
    $('tab-oggi').classList.toggle('attiva', nome === 'oggi');
    $('tab-mese').classList.toggle('attiva', nome === 'mese');
    if (nome === 'oggi') { $('tab-oggi').setAttribute('aria-current', 'page'); $('tab-mese').removeAttribute('aria-current'); }
    else { $('tab-mese').setAttribute('aria-current', 'page'); $('tab-oggi').removeAttribute('aria-current'); }
    if (nome === 'oggi') disegnaGiorno(); else disegnaMese(scorriAOggi);
    window.scrollTo(0, 0);
    if (nome === 'mese' && scorriAOggi) scorriSuOggi();
  }

  function dentroPeriodo(d) {
    if (ymd(d) < M.inizio) return new Date(INIZIO.getTime());
    if (ymd(d) > M.fine) return new Date(FINE.getTime());
    return d;
  }

  // ---------- vista giornaliera ----------
  function disegnaGiorno() {
    var d = giorno;
    var st = stato(d);
    var etichetta = cap(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    if (ymd(d) === ymd(oggi())) etichetta += ' (oggi)';
    $('data-titolo').textContent = etichetta;
    $('stagione').textContent = titoloStagione(d);
    $('giorno-prec').disabled = ymd(d) <= M.inizio;
    $('giorno-succ').disabled = ymd(d) >= M.fine;

    var box = $('piatti');
    var nota = $('nota-surgelati');
    nota.hidden = true;

    if (st.tipo === 'chiusura') {
      $('chip-settimana').textContent = 'Mensa chiusa';
      var c = st.chiusura;
      var img = c.immagine
        ? '<img class="chiuso-img" src="' + esc(c.immagine) + '" alt="" onerror="this.remove()">' : '';
      box.innerHTML = '<div class="chiuso-box"><div class="chiuso-emoji" aria-hidden="true">' + esc(c.emoji || '🚫') + '</div>' +
        img + '<div>' + esc(c.testo || 'Mensa chiusa') + '</div></div>';
      return;
    }
    if (st.tipo === 'weekend') {
      $('chip-settimana').textContent = 'Mensa chiusa';
      box.innerHTML = '<div class="chiuso-box"><div class="chiuso-emoji" aria-hidden="true">🌤️</div>' +
        '<div>Mensa chiusa per il fine settimana</div></div>';
      return;
    }
    if (st.tipo === 'fuori' || !st.menu) {
      $('chip-settimana').textContent = 'Mensa chiusa';
      box.innerHTML = '<div class="chiuso-box"><div class="chiuso-emoji" aria-hidden="true">📅</div>' +
        '<div>Menù non disponibile per questo giorno</div></div>';
      return;
    }

    $('chip-settimana').textContent = 'Settimana ' + ROMANI[st.settimana - 1];
    box.innerHTML = PORTATE.map(function (p) {
      var v = dividi(st.menu[p[0]]);
      return '<div class="piatto">' +
        '<div class="piatto-emoji" aria-hidden="true">' + p[2] + '</div>' +
        '<div><div class="piatto-categoria">' + p[1] + '</div>' +
        '<div class="piatto-nome">' + esc(v.nome) +
        (v.infanzia ? '<span class="infanzia">' + esc(v.infanzia) + '</span>' : '') +
        '</div></div></div>';
    }).join('');
    nota.hidden = !haSurgelati(st.menu);
  }

  function testoGiorno(d) {
    var st = stato(d);
    var data = cap(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    if (st.tipo === 'chiusura') return '🍽️ ' + data + '\n' + (st.chiusura.testo || 'Mensa chiusa');
    if (st.tipo !== 'aperto' || !st.menu) return '🍽️ ' + data + '\nMensa chiusa';
    var righe = ['🍽️ Menù di ' + data.toLowerCase() + ' (Settimana ' + ROMANI[st.settimana - 1] + ')'];
    PORTATE.forEach(function (p) {
      var v = dividi(st.menu[p[0]]);
      if (p[0] === 'pane') return;
      righe.push(p[2] + ' ' + v.nome + (v.infanzia ? ' (' + v.infanzia + ')' : ''));
    });
    if (haSurgelati(st.menu)) righe.push('* prodotto surgelato');
    return righe.join('\n');
  }

  function vaiAlGiorno(d) { giorno = dentroPeriodo(d); disegnaGiorno(); }

  // ---------- vista mensile ----------
  var NOMI_MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  var MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

  function primoDelMese(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  var PRIMO_MESE = primoDelMese(INIZIO);
  var ULTIMO_MESE = primoDelMese(FINE);

  function meseCorrente() {
    var m = primoDelMese(oggi());
    if (m < PRIMO_MESE) return new Date(PRIMO_MESE.getTime());
    if (m > ULTIMO_MESE) return new Date(ULTIMO_MESE.getTime());
    return m;
  }

  function cambiaMese(delta) {
    var nuovo = new Date(meseVisto.getFullYear(), meseVisto.getMonth() + delta, 1);
    if (nuovo >= PRIMO_MESE && nuovo <= ULTIMO_MESE) { meseVisto = nuovo; disegnaMese(false); window.scrollTo(0, 0); }
  }

  function cardGiorno(d) {
    var k = ymd(d);
    var st = stato(d);
    var classi = 'giorno-card';
    var corpo;
    if (st.tipo === 'aperto' && st.menu) {
      corpo = PORTATE.map(function (p) {
        var v = dividi(st.menu[p[0]]);
        return '<div' + (p[0] === 'pane' ? ' class="pane"' : '') + '>' + esc(v.nome) +
          (v.infanzia ? '<small>' + esc(v.infanzia) + '</small>' : '') + '</div>';
      }).join('');
    } else {
      classi += ' chiuso';
      corpo = 'Mensa chiusa' + (st.chiusura ? ' &middot; ' + esc(st.chiusura.etichetta) : '');
    }
    if (k === ymd(oggi())) classi += ' oggi';
    return '<button class="' + classi + '" data-giorno="' + k + '">' +
      '<span class="giorno-data"><span class="gg">' + GIORNI_BREVI[d.getDay()] + '</span><span class="nn">' + d.getDate() + '</span></span>' +
      '<span class="giorno-menu">' + corpo + '</span></button>';
  }

  function disegnaMese() {
    var anno = meseVisto.getFullYear(), mese = meseVisto.getMonth();
    $('mese-titolo').textContent = NOMI_MESI[mese] + ' ' + anno;
    $('stagione').textContent = titoloStagione(meseVisto);
    $('mese-prec').disabled = meseVisto <= PRIMO_MESE;
    $('mese-succ').disabled = meseVisto >= ULTIMO_MESE;

    var ultimo = new Date(anno, mese + 1, 0).getDate();
    var settimane = [], corrente = [];
    for (var g = 1; g <= ultimo; g++) {
      var d = new Date(anno, mese, g);
      var dow = d.getDay();
      if (dow === 1 && corrente.length) { settimane.push(corrente); corrente = []; }
      if (dow >= 1 && dow <= 5) corrente.push(d);
    }
    if (corrente.length) settimane.push(corrente);

    var html = settimane.map(function (sett) {
      var primo = sett[0], ultimoG = sett[sett.length - 1];
      var etichetta = 'Fuori periodo';
      for (var i = 0; i < sett.length; i++) {
        if (!fuoriPeriodo(sett[i])) { etichetta = 'Settimana ' + ROMANI[settimanaCiclo(sett[i]) - 1]; break; }
      }
      var intervallo = primo.getDate() + '–' + ultimoG.getDate() + ' ' + MESI_BREVI[mese];
      return '<section class="settimana"><h3 class="sett-titolo"><span>' + etichetta + '</span><small>' + intervallo + '</small></h3>' +
        '<div class="giorni">' + sett.map(cardGiorno).join('') + '</div></section>';
    }).join('');
    $('settimane').innerHTML = html;
  }

  function scorriSuOggi() {
    var el = document.querySelector('.giorno-card.oggi');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  }

  // ---------- installazione ----------
  var promptInstalla = null;
  function mostraInvito(testo, conBottone) {
    if (memo('invito-chiuso') === '1') return;
    $('invito-testo').textContent = testo;
    $('btn-installa').hidden = !conBottone;
    $('invito-installa').hidden = false;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptInstalla = e;
    mostraInvito('Installa l\'app sul telefono per aprirla con un tocco, anche senza connessione.', true);
  });
  window.addEventListener('appinstalled', function () { $('invito-installa').hidden = true; });
  $('btn-installa').addEventListener('click', function () {
    if (!promptInstalla) return;
    promptInstalla.prompt();
    promptInstalla.userChoice.then(function () { promptInstalla = null; $('invito-installa').hidden = true; });
  });
  $('btn-chiudi-invito').addEventListener('click', function () { memo('invito-chiuso', '1'); $('invito-installa').hidden = true; });

  var inApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS && !inApp) {
    mostraInvito('Per installare l\'app su iPhone: tocca il tasto Condividi di Safari e poi "Aggiungi alla schermata Home".', false);
  }

  // ---------- collegamenti ----------
  $('tab-oggi').addEventListener('click', function () { mostraScheda('oggi'); });
  $('tab-mese').addEventListener('click', function () { meseVisto = primoDelMese(giorno); mostraScheda('mese'); });

  $('giorno-prec').addEventListener('click', function () { if (ymd(giorno) > M.inizio) vaiAlGiorno(addDays(giorno, -1)); });
  $('giorno-succ').addEventListener('click', function () { if (ymd(giorno) < M.fine) vaiAlGiorno(addDays(giorno, 1)); });
  $('giorno-oggi').addEventListener('click', function () { vaiAlGiorno(oggi()); });
  $('btn-condividi-giorno').addEventListener('click', function () {
    condividi('Menù mensa', testoGiorno(giorno));
  });
  $('btn-condividi-app').addEventListener('click', function () {
    condividi('Menù Mensa', 'Il menù della mensa, ogni giorno e ogni mese. Aprilo qui:');
  });

  $('mese-prec').addEventListener('click', function () { cambiaMese(-1); });
  $('mese-succ').addEventListener('click', function () { cambiaMese(1); });
  $('mese-oggi').addEventListener('click', function () { meseVisto = meseCorrente(); mostraScheda('mese', true); });

  $('settimane').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.giorno-card') : null;
    if (!b) return;
    giorno = dentroPeriodo(parse(b.getAttribute('data-giorno')));
    mostraScheda('oggi');
  });

  // Scorrimento con il dito sulla vista giornaliera
  var tx = 0, ty = 0;
  var zonaGiorno = $('vista-oggi');
  zonaGiorno.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  zonaGiorno.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      if (dx < 0 && ymd(giorno) < M.fine) vaiAlGiorno(addDays(giorno, 1));
      if (dx > 0 && ymd(giorno) > M.inizio) vaiAlGiorno(addDays(giorno, -1));
    }
  }, { passive: true });

  // ---------- avvio ----------
  giorno = dentroPeriodo(oggi());
  meseVisto = meseCorrente();
  mostraScheda('oggi');

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
