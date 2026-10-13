(function () {
  'use strict';

  // Zoom bloccato: niente pizzico con le dita
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (nome) {
    document.addEventListener(nome, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  var M = window.MENU;

  // ---------- utilita' ----------
  // Se un elemento manca (file mescolati), si usa un "finto" elemento: l'app non si blocca
  var FINTO = {
    style: {}, classList: { toggle: function () {}, add: function () {}, remove: function () {} },
    addEventListener: function () {}, setAttribute: function () {}, removeAttribute: function () {},
    getAttribute: function () { return null; }, focus: function () {}, remove: function () {}
  };
  function $(id) { return document.getElementById(id) || FINTO; }
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
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
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

  // Stagione (per l'immagine del weekend): equinozi e solstizi come nello script originale
  function getStagione(data) {
    var anno = data.getFullYear();
    var primavera = new Date(anno, 2, 20), estate = new Date(anno, 5, 21);
    var autunno = new Date(anno, 8, 22), inverno = new Date(anno, 11, 21);
    if (data >= primavera && data < estate) return 'primavera';
    if (data >= estate && data < autunno) return 'estate';
    if (data >= autunno && data < inverno) return 'autunno';
    return 'inverno';
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
    var eOggi = ymd(d) === ymd(oggi());
    $('data-titolo').textContent = etichetta;
    var santo = (window.SANTI || {})[pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())] || '';
    $('santo-giorno').textContent = santo;                  // santo del giorno (anche a mensa chiusa)
    $('santo-giorno').hidden = !santo;
    $('badge-oggi').hidden = !eOggi;                       // badge OGGI sopra la data
    $('nav-centro-giorno').classList.toggle('e-oggi', eOggi);
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
        ? '<img class="chiuso-img" src="' + esc(c.immagine) + '" alt="Mensa chiusa" onerror="this.remove()">' : '';
      box.innerHTML = '<div class="chiuso-box">' + img + '<div>' + esc(c.testo || 'Mensa chiusa') + '</div></div>';
      return;
    }
    if (st.tipo === 'weekend') {
      $('chip-settimana').textContent = 'Mensa chiusa';
      var icona = M.iconeWeekend[getStagione(d)];
      box.innerHTML = '<div class="chiuso-box"><img class="img-weekend" src="' + esc(icona) + '" alt="Mensa chiusa" onerror="this.remove()">' +
        '<div>Mensa chiusa per il fine settimana</div></div>';
      return;
    }
    if (st.tipo === 'fuori' || !st.menu) {
      $('chip-settimana').textContent = 'Mensa chiusa';
      box.innerHTML = '<div class="chiuso-box"><div>Menù non disponibile per questo giorno</div></div>';
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

  // Nel calendario mensile "oggi" e' evidenziato cosi': se oggi e' sabato o domenica,
  // si evidenzia il primo lunedi successivo; negli altri giorni, il giorno stesso.
  function giornoEvidenziatoMese() {
    var t = oggi(), dow = t.getDay();
    if (dow === 6) return addDays(t, 2);
    if (dow === 0) return addDays(t, 1);
    return t;
  }

  function meseCorrente() {
    var m = primoDelMese(giornoEvidenziatoMese());
    if (m < PRIMO_MESE) return new Date(PRIMO_MESE.getTime());
    if (m > ULTIMO_MESE) return new Date(ULTIMO_MESE.getTime());
    return m;
  }

  function cambiaMese(delta) {
    var nuovo = new Date(meseVisto.getFullYear(), meseVisto.getMonth() + delta, 1);
    if (nuovo >= PRIMO_MESE && nuovo <= ULTIMO_MESE) { meseVisto = nuovo; disegnaMese(false); window.scrollTo(0, 0); }
  }

  var GIORNI_COL = 5;

  function celleMenu(menu) {
    return PORTATE.map(function (p) {
      var v = dividi(menu[p[0]]);
      return '<div>' + esc(v.nome) + (v.infanzia ? ' <span class="infanzia-text">(' + esc(v.infanzia) + ')</span>' : '') + '</div>';
    }).join('');
  }

  function disegnaMese() {
    var anno = meseVisto.getFullYear(), mese = meseVisto.getMonth();
    $('mese-titolo').textContent = NOMI_MESI[mese] + ' ' + anno;
    $('stagione').textContent = titoloStagione(meseVisto);
    $('mese-prec').disabled = meseVisto <= PRIMO_MESE;
    $('mese-succ').disabled = meseVisto >= ULTIMO_MESE;

    var ultimo = new Date(anno, mese + 1, 0).getDate();
    var settimane = [], corrente = {}, haDati = false;
    for (var g = 1; g <= ultimo; g++) {
      var d = new Date(anno, mese, g);
      var dow = d.getDay();
      if (dow === 1 && haDati) { settimane.push(corrente); corrente = {}; haDati = false; }
      if (dow >= 1 && dow <= 5) { corrente[dow] = d; haDati = true; }
      if (g === ultimo && haDati) settimane.push(corrente);
    }

    var todayKey = ymd(giornoEvidenziatoMese());
    var righe = settimane.map(function (sett) {
      var etichetta = '--';
      for (var i = 1; i <= GIORNI_COL; i++) {
        if (sett[i] && !fuoriPeriodo(sett[i])) { etichetta = ROMANI[settimanaCiclo(sett[i]) - 1]; break; }
      }
      var riga = '<tr><td class="week-label-cell">Sett. ' + etichetta + '</td>';
      for (var c = 1; c <= GIORNI_COL; c++) {
        var dd = sett[c];
        if (!dd) { riga += '<td class="empty-cell"></td>'; continue; }
        var k = ymd(dd);
        var st = stato(dd);
        var classe = (k === todayKey) ? ' class="today-active"' : '';
        // etichetta OGGI solo se la cella e' davvero oggi (nel weekend si evidenzia il lunedi, senza scritta)
        var tag = (k === ymd(oggi())) ? '<span class="tag-oggi">OGGI</span>' : '';
        var attr = ' data-giorno="' + k + '"';
        if (st.tipo === 'aperto' && st.menu) {
          riga += '<td' + classe + attr + '><span class="day-number">' + dd.getDate() + '</span>' + tag +
            '<div class="food-container">' + celleMenu(st.menu) + '</div></td>';
        } else {
          riga += '<td' + classe + attr + '><span class="day-number">' + dd.getDate() + '</span>' + tag +
            '<div class="closed-canteen">Mensa chiusa</div>' +
            (st.chiusura ? '<div class="closed-label">' + esc(st.chiusura.etichetta) + '</div>' : '') + '</td>';
        }
      }
      return riga + '</tr>';
    }).join('');
    $('calendar-body').innerHTML = righe;
  }

  function scorriSuOggi() {
    var el = document.querySelector('.calendar-table td.today-active');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center' });
  }

  // ---------- installazione ----------
  var promptInstalla = null;
  try {
  var ua = navigator.userAgent || '';
  var inApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var ICO_CONDIVIDI = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var ICO_AGGIUNGI = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
  var ICO_PUNTINI = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  var ICO_SCARICA = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';

  function passi(lista) {
    return lista.map(function (p, i) {
      return '<li class="guida-passo"><span class="guida-num">' + (i + 1) + '</span>' +
        '<span class="guida-testo">' + p[0] + '</span>' +
        '<span class="guida-icona">' + p[1] + '</span></li>';
    }).join('');
  }

  function apriGuida() {
    var elenco, nota;
    $('guida-avviso').hidden = true;
    if (isIOS) {
      elenco = [
        ['Nella barra in basso della pagina, tocca il <b>pulsante del menu</b> (in basso a sinistra)', ICO_PUNTINI],
        ['Nel menu che si apre, scorri e tocca <b>Condividi</b>', ICO_CONDIVIDI],
        ['Nell\'elenco esteso, scorri e tocca <b>Aggiungi alla schermata Home</b> (icona quadrata con il +)', ICO_AGGIUNGI],
        ['Controlla che <b>Apri come app web</b> sia attivo (verde), poi tocca <b>Aggiungi</b> in alto a destra', ICO_SCARICA]
      ];
      nota = 'Se hai aperto il link da WhatsApp o da un\'altra app, aprilo prima con Safari.';
    } else {
      elenco = [
        ['Tocca i <b>tre puntini</b> in alto a destra del browser', ICO_PUNTINI],
        ['Tocca <b>Installa app</b> (oppure <b>Aggiungi a schermata Home</b>)', ICO_AGGIUNGI],
        ['Tocca <b>Installa</b>. L\'icona è sul tuo telefono!', ICO_SCARICA]
      ];
      nota = 'Funziona meglio con Chrome: se usi un altro browser, apri questo link con Chrome.';
    }
    $('guida-passi').innerHTML = passi(elenco);
    $('guida-nota').textContent = nota;
    $('guida').hidden = false;
    $('guida-chiudi').focus();
  }
  function chiudiGuida() { $('guida').hidden = true; $('btn-scarica').focus(); }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstalla = e; });
  window.addEventListener('appinstalled', function () { $('blocco-scarica').hidden = true; toast('App installata'); });

  $('blocco-scarica').hidden = inApp;
  $('btn-scarica').addEventListener('click', function () {
    if (promptInstalla) {
      // Android / Chrome: finestra di installazione del telefono, un solo tocco
      var richiesta = promptInstalla;
      promptInstalla = null;
      richiesta.prompt();
      richiesta.userChoice.then(function (r) { if (r && r.outcome === 'accepted') $('blocco-scarica').hidden = true; });
    } else {
      apriGuida();
    }
  });
  $('guida-chiudi').addEventListener('click', chiudiGuida);
  $('guida').addEventListener('click', function (e) { if (e.target === $('guida')) chiudiGuida(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('guida').hidden) chiudiGuida(); });
  } catch (errInstalla) { /* il pulsante Scarica e' accessorio: l'app parte comunque */ }

  // ---------- avvisi dalla scuola ----------
  function dataLunga(d) { return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); }

  function periodoAvviso(a) {
    if (a.da && a.a) {
      if (a.da === a.a) return cap(dataLunga(parse(a.da)));
      var d1 = parse(a.da), d2 = parse(a.a);
      var inizio = d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
        ? String(d1.getDate()) : d1.getDate() + ' ' + NOMI_MESI[d1.getMonth()].toLowerCase();
      return 'Dal ' + inizio + ' al ' + d2.getDate() + ' ' + NOMI_MESI[d2.getMonth()].toLowerCase();
    }
    if (a.a) return 'Fino a ' + dataLunga(parse(a.a));
    if (a.da) return 'Dal ' + dataLunga(parse(a.da));
    return '';
  }

  function avvisiAttivi() {
    var k = ymd(oggi());
    return (M.avvisi || []).filter(function (a) {
      return a && a.testo && (!a.da || k >= a.da) && (!a.a || k <= a.a);
    });
  }

  function disegnaAvvisi() {
    var box = $('avvisi');
    var lista = avvisiAttivi();
    box.innerHTML = lista.map(function (a) {
      var per = periodoAvviso(a);
      return '<div class="avviso" role="note">' +
        '<div class="avviso-icona" aria-hidden="true">📢</div>' +
        '<div class="avviso-corpo">' +
        '<div class="avviso-titolo">' + esc(a.titolo || 'Avviso dalla scuola') + '</div>' +
        '<div class="avviso-testo">' + esc(a.testo) + '</div>' +
        (per ? '<div class="avviso-periodo">' + esc(per) + '</div>' : '') +
        '</div></div>';
    }).join('');
  }

  // ---------- stampa del menu in PDF (estivo / invernale) ----------
  var GIORNI_LUNGHI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

  // "settembre-ottobre e maggio-giugno": mesi dell'anno scolastico che usano quel menu
  function periodoMenu(inverno) {
    var mesi = [], d = new Date(INIZIO.getFullYear(), INIZIO.getMonth(), 1);
    while (d <= FINE) {
      if ((M.mesiInvernali.indexOf(d.getMonth() + 1) !== -1) === inverno) mesi.push(d.getMonth());
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    var blocchi = [], cur = null;
    mesi.forEach(function (m) {
      if (cur && (cur[cur.length - 1] + 1) % 12 === m) cur.push(m); else { cur = [m]; blocchi.push(cur); }
    });
    return blocchi.map(function (b) {
      var a = NOMI_MESI[b[0]].toLowerCase(), z = NOMI_MESI[b[b.length - 1]].toLowerCase();
      return b.length === 1 ? a : a + ' – ' + z;
    }).join(' e ');
  }

  function htmlStampa(inverno) {
    var db = inverno ? M.menuInvernale : M.menuEstivo;
    var titolo = 'Menù ' + (inverno ? 'Invernale' : 'Estivo') + ' ' + M.anno;
    var surgelati = false;

    function testata() {
      return '<div class="sm-testata">' +
        '<img class="sm-logo" src="img/barbarigo.png" alt="Barbarigo">' +
        '<div class="sm-titoli"><div class="sm-titolo">' + esc(titolo) + '</div>' +
        '<div class="sm-periodo">In vigore: ' + esc(periodoMenu(inverno)) + '</div></div></div>';
    }

    function tabella(n) {
      var righe = PORTATE.map(function (p) {
        var r = '<tr><th scope="row">' + p[1] + '</th>';
        for (var g = 1; g <= 5; g++) {
          var m = db[n] && db[n][g];
          if (!m) { r += '<td></td>'; continue; }
          if (String(m[p[0]]).indexOf('*') !== -1) surgelati = true;
          var v = dividi(m[p[0]]);
          r += '<td>' + esc(v.nome) + (v.infanzia ? '<span class="sm-inf">' + esc(v.infanzia) + '</span>' : '') + '</td>';
        }
        return r + '</tr>';
      }).join('');
      return '<section class="sm-sett"><table><thead><tr><th class="sm-sett-nome">Settimana ' + ROMANI[n - 1] + '</th>' +
        GIORNI_LUNGHI.map(function (g) { return '<th>' + g + '</th>'; }).join('') +
        '</tr></thead><tbody>' + righe + '</tbody></table></section>';
    }

    var corpo = [1, 2, 3, 4].map(tabella).join('');
    var html = '<div class="sm-pagina">' + testata() + corpo +
      '<div class="sm-nota">' + (surgelati ? '* prodotto surgelato &nbsp;·&nbsp; ' : '') +
      'Le settimane si ripetono a rotazione, secondo il calendario scolastico.</div></div>';
    return { html: html, titolo: titolo };
  }

  var titoloPagina = document.title, timerTitolo;
  function ripristinaTitolo() { clearTimeout(timerTitolo); document.title = titoloPagina; }

  function preparaStampa(inverno) {
    var r = htmlStampa(inverno);
    $('stampa-menu').innerHTML = r.html;
    return r;
  }

  function stampaMenu(inverno) {
    var r = preparaStampa(inverno);
    var imgs = Array.prototype.slice.call(document.querySelectorAll('#stampa-menu img'));
    var attesa = imgs.map(function (im) {
      return im.complete ? Promise.resolve() : new Promise(function (ok) { im.onload = im.onerror = ok; });
    });
    // il nome del file PDF salvato dal telefono/computer e' il titolo della pagina
    document.title = r.titolo.replace(/\//g, '-');
    window.addEventListener('afterprint', ripristinaTitolo, { once: true });
    timerTitolo = setTimeout(ripristinaTitolo, 120000);
    toast('Nella finestra di stampa scegli «Salva come PDF»');
    Promise.race([Promise.all(attesa), new Promise(function (ok) { setTimeout(ok, 1500); })]).then(function () {
      setTimeout(function () { try { window.print(); } catch (e) { ripristinaTitolo(); } }, 350);
    });
  }

  // ---------- collegamenti ----------
  $('tab-oggi').addEventListener('click', function () { mostraScheda('oggi'); });
  $('tab-mese').addEventListener('click', function () {
    // se si sta guardando "oggi", il mese si apre sul giorno evidenziato nel calendario
    meseVisto = primoDelMese(ymd(giorno) === ymd(oggi()) ? giornoEvidenziatoMese() : giorno);
    if (meseVisto < PRIMO_MESE) meseVisto = new Date(PRIMO_MESE.getTime());
    if (meseVisto > ULTIMO_MESE) meseVisto = new Date(ULTIMO_MESE.getTime());
    mostraScheda('mese');
  });

  $('giorno-prec').addEventListener('click', function () { if (ymd(giorno) > M.inizio) vaiAlGiorno(addDays(giorno, -1)); });
  $('giorno-succ').addEventListener('click', function () { if (ymd(giorno) < M.fine) vaiAlGiorno(addDays(giorno, 1)); });
  $('giorno-oggi').addEventListener('click', function () { vaiAlGiorno(oggi()); });
  $('btn-condividi-giorno').addEventListener('click', function () {
    condividi('Menù mensa', testoGiorno(giorno));
  });
  $('tab-condividi').addEventListener('click', function () {
    condividi('Menù Mensa', 'Il menù della mensa, ogni giorno e ogni mese. Aprilo qui:');
  });

  // un tocco sulla scritta "Menù Estivo / Invernale" apre il PDF di quel menù
  $('stagione').addEventListener('click', function () {
    stampaMenu(isInverno(scheda === 'mese' ? meseVisto : giorno));
  });

  $('mese-prec').addEventListener('click', function () { cambiaMese(-1); });
  $('mese-succ').addEventListener('click', function () { cambiaMese(1); });
  $('mese-oggi').addEventListener('click', function () { meseVisto = meseCorrente(); mostraScheda('mese', true); });

  $('calendar-body').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('td[data-giorno]') : null;
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
  disegnaAvvisi();
  // stampa normale (Ctrl+P): di base esce il menu della stagione in corso
  preparaStampa(isInverno(oggi()));
  // se l'app resta aperta per giorni, gli avvisi si aggiornano quando si torna sulla pagina
  document.addEventListener('visibilitychange', function () { if (!document.hidden) disegnaAvvisi(); });
  document.documentElement.setAttribute('data-pronto', '1');

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    var avevaControllo = !!navigator.serviceWorker.controller;
    var ricaricato = false;
    // Quando arriva una versione nuova dell'app, la pagina si ricarica da sola una volta
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (avevaControllo && !ricaricato) { ricaricato = true; location.reload(); }
    });
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
