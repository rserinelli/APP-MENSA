(function () {
  'use strict';

  var MM = 2480 / 210;                 // pixel per millimetro (A4 a 300 dpi)
  var BLU = '#1c4587', BLU_SCURO = '#14315f', AZZURRO = '#78c5f1', CREMA = '#fff4d4';
  var INCHIOSTRO = '#16284a', TENUE = '#5a6a8a', ORO = '#e0a52a';
  var TESTO = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var SCRITTA = '"Patrick Hand", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
  var TITOLI = '"Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif';

  var canvas = document.getElementById('locandina');
  var ctx = canvas.getContext('2d');
  var campo = document.getElementById('campo-url');
  var avvisoUrl = document.getElementById('avviso-url');
  var msg = document.getElementById('msg');
  var logo = null;

  // ---------- indirizzo dell'app ----------
  function urlIniziale() {
    var m = window.MENU || {};
    if (m.urlApp) return m.urlApp;
    var q = /[?&]url=([^&]+)/.exec(location.search);
    if (q) { try { return decodeURIComponent(q[1]); } catch (e) { /* ignora */ } }
    try { var salvato = localStorage.getItem('urlLocandina'); if (salvato) return salvato; } catch (e) { /* ignora */ }
    if (location.protocol === 'file:') return '';
    return location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  }

  function urlSospetto(u) {
    return !u || /^(file:|http:\/\/(localhost|127\.|192\.168\.|10\.))/i.test(u) || !/^https?:\/\//i.test(u);
  }

  // ---------- disegno ----------
  function rettangolo(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function testo(t, x, y, mm, peso, colore, allinea, famiglia, spaziatura) {
    ctx.font = (peso || '400') + ' ' + mm + 'px ' + (famiglia || TESTO);
    ctx.fillStyle = colore;
    ctx.textAlign = allinea || 'left';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spaziatura || 0) + 'px';
    ctx.fillText(t, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  // Va a capo da solo; restituisce il numero di righe scritte. Il grassetto si indica con *...*
  function paragrafo(t, x, y, larghezza, mm, interlinea, colore) {
    var parole = t.split(' '), righe = [], cur = '';
    function misura(s) {
      ctx.font = '600 ' + mm + 'px ' + TESTO;
      return ctx.measureText(s.replace(/\*/g, '')).width;
    }
    parole.forEach(function (p) {
      var prova = cur ? cur + ' ' + p : p;
      if (misura(prova) > larghezza && cur) { righe.push(cur); cur = p; } else cur = prova;
    });
    if (cur) righe.push(cur);

    var grassetto = false;                      // lo stato passa da una riga alla successiva
    righe.forEach(function (r, i) {
      var xx = x;
      r.split('*').forEach(function (pz, k) {
        if (k > 0) grassetto = !grassetto;
        ctx.font = (grassetto ? '800' : '500') + ' ' + mm + 'px ' + TESTO;
        ctx.fillStyle = grassetto ? BLU : colore;
        ctx.textAlign = 'left';
        ctx.fillText(pz, xx, y + i * interlinea);
        xx += ctx.measureText(pz).width;
      });
    });
    return righe.length;
  }

  // Icone disegnate sulla griglia 24x24 (le stesse dell'app)
  function icona(nome, cx, cy, mm, colore) {
    ctx.save();
    ctx.translate(cx - mm / 2, cy - mm / 2);
    ctx.scale(mm / 24, mm / 24);
    ctx.strokeStyle = colore; ctx.fillStyle = colore;
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function p(d) { ctx.stroke(new Path2D(d)); }
    if (nome === 'condividi') { p('M12 15V3'); p('M7 8l5-5 5 5'); p('M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7'); }
    if (nome === 'aggiungi') { rettangolo(3, 3, 18, 18, 4); ctx.stroke(); p('M12 8v8'); p('M8 12h8'); }
    if (nome === 'scarica') { p('M12 3v12'); p('M7 11l5 5 5-5'); p('M5 20h14'); }
    if (nome === 'puntini') { [5, 12, 19].forEach(function (y) { ctx.beginPath(); ctx.arc(12, y, 2.1, 0, 7); ctx.fill(); }); }
    if (nome === 'ok') { p('M5 12.5l4.5 4.5L19 7.5'); }
    ctx.restore();
  }

  function disegnaQR(testoQR, x, y, lato) {
    var qr = QR.crea(testoQR);
    var n = qr.size, mod = lato / n;
    ctx.fillStyle = '#0b1c3d';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (qr.modulo(r, c)) ctx.fillRect(x + c * mod, y + r * mod, mod + 0.04, mod + 0.04);
    }
  }

  function passo(x, y, w, n, riga, nomeIcona, colore) {
    // numero
    ctx.fillStyle = colore;
    ctx.beginPath(); ctx.arc(x + 5.5, y + 5.5, 4.8, 0, Math.PI * 2); ctx.fill();
    testo(String(n), x + 5.5, y + 8, 6.2, '800', '#fff', 'center');
    // testo
    paragrafo(riga, x + 13, y + 4.6, w - 13 - 14, 4.1, 5.1, INCHIOSTRO);
    // icona
    ctx.fillStyle = '#fff';
    rettangolo(x + w - 11.5, y + 0.5, 11.5, 11.5, 2.4); ctx.fill();
    ctx.strokeStyle = '#d6e0ef'; ctx.lineWidth = 0.4; ctx.stroke();
    icona(nomeIcona, x + w - 5.75, y + 6.25, 6.8, colore);
  }

  function colonna(x, y, w, h, titolo, sotto, colore, passi) {
    ctx.fillStyle = '#eaf5fd';
    rettangolo(x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = colore; ctx.lineWidth = 0.7; ctx.stroke();
    // etichetta
    ctx.fillStyle = colore;
    rettangolo(x, y, w, 13, 4); ctx.fill();
    ctx.fillRect(x, y + 8, w, 5);
    testo(titolo, x + w / 2, y + 7.6, 6.4, '800', '#fff', 'center');
    testo(sotto, x + w / 2, y + 11.4, 3.2, '600', 'rgba(255,255,255,.88)', 'center');
    passi.forEach(function (p, i) {
      passo(x + 4, y + 18 + i * 20, w - 8, i + 1, p[0], p[1], colore);
    });
  }

  function disegna(url) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(MM, MM);

    // sfondo
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 210, 297);
    ctx.fillStyle = CREMA; rettangolo(8, 8, 194, 281, 6); ctx.fill();

    // testata blu con logo
    ctx.fillStyle = BLU; rettangolo(8, 8, 194, 35, 6); ctx.fill();
    var oro = ctx.createLinearGradient(0, 11, 0, 19);
    oro.addColorStop(0, '#fff1b8'); oro.addColorStop(.4, '#e8c25a'); oro.addColorStop(.6, '#b9811c'); oro.addColorStop(1, '#f0cf6e');
    testo('MENÙ MENSA', 105 + 1.1, 18, 6, '700', oro, 'center', TITOLI, 2.2);
    if (logo && logo.complete && logo.naturalWidth) {
      var lw = 76, lh = lw * logo.naturalHeight / logo.naturalWidth;
      ctx.drawImage(logo, 105 - lw / 2, 19.5, lw, lh);
    }

    // titolo
    testo('Il menù della mensa', 105, 58, 12.5, '400', BLU, 'center', SCRITTA);
    testo('sempre sul tuo telefono', 105, 70, 12.5, '400', BLU, 'center', SCRITTA);
    testo('App gratuita  ·  senza pubblicità  ·  funziona anche senza internet', 105, 79, 3.9, '600', TENUE, 'center');

    // QR
    ctx.save();
    ctx.shadowColor = 'rgba(20,49,95,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 1.2;
    ctx.fillStyle = '#fff'; rettangolo(50, 84, 110, 82, 6); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = BLU; ctx.lineWidth = 1.2; rettangolo(50, 84, 110, 82, 6); ctx.stroke();
    var okQR = true;
    try { disegnaQR(url || ' ', 74, 88.5, 62); } catch (e) { okQR = false; }
    if (!okQR) testo('Indirizzo troppo lungo', 105, 120, 5, '700', '#b91c1c', 'center');
    testo('Inquadra il QR con la fotocamera', 105, 160, 5.2, '800', BLU, 'center');

    // indirizzo scritto sotto il QR
    var u = (url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
    var corpo = 4.6;
    ctx.font = '700 ' + corpo + 'px ' + TESTO;
    while (ctx.measureText(u).width > 176 && corpo > 2.6) { corpo -= 0.2; ctx.font = '700 ' + corpo + 'px ' + TESTO; }
    testo(u || 'indirizzo dell\'app', 105, 174, corpo, '700', INCHIOSTRO, 'center');
    testo('Non riesci a inquadrarlo? Scrivi questo indirizzo nel browser.', 105, 179.5, 3.3, '500', TENUE, 'center');

    // 3 passaggi
    testo('Mettila sul telefono in 3 passaggi', 105, 191, 6.2, '800', BLU, 'center');
    colonna(14, 195, 89, 81, 'iPhone', 'apri il link con Safari', BLU, [
      ['Tocca il tasto *Condividi* di Safari (il quadrato con la freccia in su)', 'condividi'],
      ['Scorri e tocca *Aggiungi alla schermata Home*', 'aggiungi'],
      ['Tocca *Aggiungi* in alto a destra. Fatto!', 'ok']
    ]);
    colonna(107, 195, 89, 81, 'Android', 'apri il link con Chrome', '#0b7a43', [
      ['Tocca i *tre puntini* in alto a destra del browser', 'puntini'],
      ['Tocca *Installa app* (o *Aggiungi a schermata Home*)', 'scarica'],
      ['Tocca *Installa*. Fatto!', 'ok']
    ]);

    // piede
    ctx.fillStyle = BLU; rettangolo(8, 281, 194, 8, 4); ctx.fill();
    testo('Menù del giorno · menù del mese · avvisi dalla scuola', 105, 286.2, 3.6, '600', '#fff', 'center');
  }

  // ---------- azioni ----------
  var url = urlIniziale();
  var timerRidisegna;

  function aggiorna() {
    var u = campo.value.trim();
    avvisoUrl.hidden = !urlSospetto(u);
    disegna(u);
    try { if (u && !(window.MENU && window.MENU.urlApp)) localStorage.setItem('urlLocandina', u); } catch (e) { /* ignora */ }
  }

  function dire(t) { msg.textContent = t; }

  campo.value = url;
  campo.addEventListener('input', function () { clearTimeout(timerRidisegna); timerRidisegna = setTimeout(aggiorna, 250); });

  document.getElementById('btn-stampa').addEventListener('click', function () {
    aggiorna();
    dire('Nella finestra di stampa scegli «Salva come PDF» oppure la stampante.');
    setTimeout(function () { window.print(); }, 200);
  });

  document.getElementById('btn-invia').addEventListener('click', function () {
    aggiorna();
    canvas.toBlob(function (blob) {
      if (!blob) { dire('Non riesco a creare l\'immagine.'); return; }
      var file;
      try { file = new File([blob], 'Locandina-Menu-Mensa.png', { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Menù Mensa', text: 'Il menù della mensa sul telefono: inquadra il QR.' })
          .catch(function (e) { if (!e || e.name !== 'AbortError') dire('Non riesco a condividere da questo browser.'); });
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'Locandina-Menu-Mensa.png';
        document.body.appendChild(a); a.click(); a.remove();
        dire('Immagine scaricata: ora puoi mandarla nei gruppi.');
      }
    }, 'image/png');
  });

  // ---------- avvio: prima subito, poi di nuovo quando logo e font sono pronti ----------
  aggiorna();
  logo = new Image();
  logo.onload = aggiorna;
  logo.src = 'img/barbarigo.png';
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('40px "Patrick Hand"'), document.fonts.load('700 40px "Cinzel"')]).then(aggiorna, function () {});
  }
})();
