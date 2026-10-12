// Generatore di QR code (modalita' byte, correzione errori M, versioni 1-40).
// Nessuna libreria esterna: funziona anche senza connessione.
// Uso: var m = QR.crea("https://...");  ->  m.size (lato in moduli), m.modulo(riga, colonna) -> true/false
(function (root) {
  'use strict';

  // ---- tabelle per livello M: [codewords ECC per blocco, blocchi gruppo 1, byte per blocco g1, blocchi gruppo 2, byte per blocco g2]
  var TAB_M = [
    null,
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
    [30, 1, 50, 4, 51], [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41], [24, 5, 41, 5, 42],
    [28, 7, 45, 3, 46], [28, 10, 46, 1, 47], [26, 9, 43, 4, 44], [26, 3, 44, 11, 45], [26, 3, 41, 13, 42],
    [26, 17, 42, 0, 0], [28, 17, 46, 0, 0], [28, 4, 47, 14, 48], [28, 6, 45, 14, 46], [28, 8, 47, 13, 48],
    [28, 19, 46, 4, 47], [28, 22, 45, 3, 46], [28, 3, 45, 23, 46], [28, 21, 45, 7, 46], [28, 19, 47, 10, 48],
    [28, 2, 46, 29, 47], [28, 10, 46, 23, 47], [28, 14, 46, 21, 47], [28, 14, 46, 23, 47], [28, 12, 47, 26, 48],
    [28, 6, 47, 34, 48], [28, 29, 46, 14, 47], [28, 13, 46, 32, 47], [28, 40, 47, 7, 48], [28, 18, 47, 31, 48]
  ];

  // ---- aritmetica di Galois GF(256)
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1; if (x & 256) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function polinomioGeneratore(n) {
    var p = [1];
    for (var i = 0; i < n; i++) {
      var q = new Array(p.length + 1);
      for (var k = 0; k < q.length; k++) q[k] = 0;
      for (var j = 0; j < p.length; j++) {
        q[j] ^= p[j];
        q[j + 1] ^= gmul(p[j], EXP[i]);
      }
      p = q;
    }
    return p; // grado n, coefficiente direttore 1 in posizione 0
  }

  function resto(dati, nEcc) {
    var gen = polinomioGeneratore(nEcc);
    var r = new Array(nEcc);
    for (var i = 0; i < nEcc; i++) r[i] = 0;
    for (var d = 0; d < dati.length; d++) {
      var f = dati[d] ^ r[0];
      r.shift(); r.push(0);
      if (f !== 0) for (var k = 0; k < nEcc; k++) r[k] ^= gmul(gen[k + 1], f);
    }
    return r;
  }

  function capacitaDati(v) { var t = TAB_M[v]; return t[1] * t[2] + t[3] * t[4]; }

  function utf8(s) {
    var out = [];
    var e = unescape(encodeURIComponent(s));
    for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i));
    return out;
  }

  function codewordsDati(byte, v) {
    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4);                                   // modo byte
    put(byte.length, v < 10 ? 8 : 16);           // lunghezza
    byte.forEach(function (b) { put(b, 8); });
    var cap = capacitaDati(v) * 8;
    for (var t = 0; t < 4 && bits.length < cap; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = [];
    for (var i = 0; i < bits.length; i += 8) {
      var x = 0; for (var j = 0; j < 8; j++) x = (x << 1) | bits[i + j];
      cw.push(x);
    }
    var pad = [0xec, 0x11], pi = 0;
    while (cw.length < capacitaDati(v)) cw.push(pad[pi++ % 2]);
    return cw;
  }

  function intreccia(cw, v) {
    var t = TAB_M[v], nEcc = t[0];
    var blocchi = [], pos = 0, i;
    for (i = 0; i < t[1] + t[3]; i++) {
      var len = i < t[1] ? t[2] : t[4];
      blocchi.push(cw.slice(pos, pos + len)); pos += len;
    }
    var ecc = blocchi.map(function (b) { return resto(b, nEcc); });
    var out = [], max = t[4] > t[2] ? t[4] : t[2];
    for (i = 0; i < max; i++) blocchi.forEach(function (b) { if (i < b.length) out.push(b[i]); });
    for (i = 0; i < nEcc; i++) ecc.forEach(function (e) { out.push(e[i]); });
    return out;
  }

  function posAllineamento(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2;
    var size = 17 + 4 * v;
    var step = (v === 32) ? 26 : Math.ceil((size - 13) / (2 * n - 2)) * 2;
    var r = [6];
    for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }

  function bitFormato(mask) {
    var data = (0 << 3) | mask;                  // livello M = 00
    var r = data;
    for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    return ((data << 10) | r) ^ 0x5412;
  }
  function bitVersione(v) {
    var r = v;
    for (var i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    return (v << 12) | r;
  }

  function costruisci(cwFinali, v, mask) {
    var size = 17 + 4 * v, i, j;
    var m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(r, c, val) { if (r >= 0 && r < size && c >= 0 && c < size) { m[r][c] = val; fn[r][c] = true; } }

    function finder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var on = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) || (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
                 (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        set(r0 + dr, c0 + dc, on);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    var ap = posAllineamento(v);
    ap.forEach(function (r) { ap.forEach(function (c) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) return;
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++)
        set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }); });

    for (i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    set(size - 8, 8, true); // modulo scuro fisso

    // formato (riservo le aree, poi scrivo)
    var f = bitFormato(mask);
    function bf(k) { return ((f >>> k) & 1) === 1; }
    for (i = 0; i <= 5; i++) set(i, 8, bf(i));
    set(7, 8, bf(6)); set(8, 8, bf(7)); set(8, 7, bf(8));
    for (i = 9; i < 15; i++) set(8, 14 - i, bf(i));
    for (i = 0; i < 8; i++) set(8, size - 1 - i, bf(i));
    for (i = 8; i < 15; i++) set(size - 15 + i, 8, bf(i));
    set(size - 8, 8, true);

    if (v >= 7) {
      var vb = bitVersione(v);
      for (i = 0; i < 18; i++) {
        var bit = ((vb >>> i) & 1) === 1, a = size - 11 + (i % 3), b = Math.floor(i / 3);
        set(a, b, bit); set(b, a, bit);
      }
    }

    // dati a zig-zag
    var bits = [];
    cwFinali.forEach(function (c) { for (var k = 7; k >= 0; k--) bits.push((c >>> k) & 1); });
    var idx = 0, su = true;
    for (var col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5;
      for (var n = 0; n < size; n++) {
        var r = su ? size - 1 - n : n;
        for (j = 0; j < 2; j++) {
          var c = col - j;
          if (fn[r][c]) continue;
          var val = idx < bits.length ? bits[idx] === 1 : false; idx++;
          var inv;
          switch (mask) {
            case 0: inv = (r + c) % 2 === 0; break;
            case 1: inv = r % 2 === 0; break;
            case 2: inv = c % 3 === 0; break;
            case 3: inv = (r + c) % 3 === 0; break;
            case 4: inv = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
            case 5: inv = (r * c) % 2 + (r * c) % 3 === 0; break;
            case 6: inv = ((r * c) % 2 + (r * c) % 3) % 2 === 0; break;
            default: inv = ((r + c) % 2 + (r * c) % 3) % 2 === 0;
          }
          m[r][c] = inv ? !val : val;
        }
      }
      su = !su;
    }
    return m;
  }

  function penalita(m) {
    var n = m.length, p = 0, i, j, k;
    for (i = 0; i < n; i++) {
      var runR = 1, runC = 1;
      for (j = 1; j < n; j++) {
        if (m[i][j] === m[i][j - 1]) { runR++; if (runR === 5) p += 3; else if (runR > 5) p++; } else runR = 1;
        if (m[j][i] === m[j - 1][i]) { runC++; if (runC === 5) p += 3; else if (runC > 5) p++; } else runC = 1;
      }
    }
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++)
      if (m[i][j] === m[i][j + 1] && m[i][j] === m[i + 1][j] && m[i][j] === m[i + 1][j + 1]) p += 3;
    var pat = [true, false, true, true, true, false, true];
    function cerca(get) {
      var cnt = 0;
      for (var a = 0; a < n; a++) for (var b = 0; b + 6 < n; b++) {
        var ok = true;
        for (k = 0; k < 7; k++) if (get(a, b + k) !== pat[k]) { ok = false; break; }
        if (!ok) continue;
        var l = true, r = true;
        for (k = 1; k <= 4; k++) { if (b - k >= 0 && get(a, b - k)) l = false; if (b + 6 + k < n && get(a, b + 6 + k)) r = false; }
        if ((b - 4 >= 0 && l) || (b + 10 < n && r)) cnt++;
      }
      return cnt;
    }
    p += 40 * (cerca(function (a, b) { return m[a][b]; }) + cerca(function (a, b) { return m[b][a]; }));
    var scuri = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) scuri++;
    p += 10 * Math.floor(Math.abs(scuri * 20 - n * n * 10) / (n * n));
    return p;
  }

  function crea(testo) {
    var byte = utf8(testo), v;
    for (v = 1; v <= 40; v++) {
      var ccBits = v < 10 ? 8 : 16;
      if (4 + ccBits + byte.length * 8 <= capacitaDati(v) * 8) break;
    }
    if (v > 40) throw new Error('Testo troppo lungo per il QR');
    var cw = intreccia(codewordsDati(byte, v), v);
    var migliore = null, pMin = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var m = costruisci(cw, v, mask), p = penalita(m);
      if (p < pMin) { pMin = p; migliore = m; }
    }
    return {
      size: migliore.length,
      versione: v,
      modulo: function (r, c) { return migliore[r][c]; }
    };
  }

  root.QR = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
