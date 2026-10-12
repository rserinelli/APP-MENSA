# Menù Mensa – app gratuita per iPhone e Android

È un'app web installabile (PWA): un solo pacchetto funziona su iPhone, Android e computer.
È gratuita, senza pubblicità e non serve passare dagli store.
Mostra il menù **del giorno** (con frecce e scorrimento del dito) e il menù **del mese**.

## 1. Metterla online (una volta sola, gratis)

L'app deve stare su un sito con indirizzo `https://`. Due modi gratuiti:

**Netlify (il più semplice)**
1. Vai su https://app.netlify.com/drop e crea un account gratuito.
2. Trascina dentro la cartella `menu-mensa-app` (decompressa, con dentro `index.html`).
3. Ottieni subito un indirizzo tipo `https://nome-casuale.netlify.app`. Nelle impostazioni del sito puoi cambiare il nome.

**GitHub Pages**
1. Crea un account gratuito su https://github.com e un nuovo repository pubblico.
2. Carica tutti i file della cartella.
3. In Settings → Pages scegli il ramo `main` e la cartella `/ (root)`: dopo qualche minuto trovi l'indirizzo.

(I passaggi dei siti possono cambiare leggermente nel tempo.)

## 2. Condividerla con gli altri genitori

Manda l'indirizzo in chat. Chi lo apre trova in alto un grande pulsante **Scarica l'app**:

- **Android (Chrome):** un tocco sul pulsante e il telefono chiede "Installare l'app?". Si conferma e l'icona compare tra le app.
- **iPhone:** Apple non permette l'installazione con un solo tocco, quindi il pulsante mostra 4 passaggi (menu in basso a sinistra → Condividi → Aggiungi alla schermata Home → controllo di «Apri come app web» e Aggiungi). Il link va aperto con Safari.

Se l'app è già installata, il pulsante non compare più.

Dopo la prima apertura l'app funziona anche senza connessione.
Dentro l'app, il tasto **Condividi l'app** manda il link ad altri genitori e **Condividi il menù** invia il menù del giorno come messaggio.

## 3. Cambiare il menù (invernale in arrivo dalla mensa, nuove chiusure, ecc.)

Tutto sta in **un solo file: `menu-data.js`**, scritto in chiaro.
- Menù invernale: cerca `MENU INVERNALE` e cambia il testo tra le virgolette.
- Menù estivo: cerca `MENU ESTIVO`.
- Anche il PDF stampabile si aggiorna da solo con questi dati.
- Chiusure: blocco `chiusure` (date nel formato `2026-12-23`; qui i mesi sono quelli normali, 12 = dicembre).
- Date di inizio e fine, mesi invernali e settimana di partenza sono in cima al file.

Per pubblicare la modifica ricarica `menu-data.js` sul sito (su Netlify trascina di nuovo la cartella).
I genitori vedono il menù aggiornato alla prossima apertura dell'app con connessione.

## 4. Avvisi dalla scuola (riquadro in alto)
In `menu-data.js`, blocco `avvisi`, scrivi un messaggio con il suo periodo di validità, per esempio:

    avvisi: [
      { da: "2026-10-12", a: "2026-10-15",
        titolo: "Cambio menù",
        testo: "Questo giovedì: secondo formaggini" },
    ],

- L'avviso compare da solo il giorno `da` e sparisce da solo dopo il giorno `a` (estremi inclusi).
- `titolo` è facoltativo (se manca compare "Avviso dalla scuola"). Puoi scrivere più avvisi, separati da una virgola.
- Dopo la modifica ricarica `menu-data.js` sul sito, come per il menù.

## 5. Stampa del menù in PDF
Basta toccare la scritta **Menù Estivo / Menù Invernale** (la fascia azzurra sopra i giorni o sopra il mese, con la piccola icona del foglio).
Si apre la finestra di stampa con il menù completo (4 settimane) su **un solo foglio A4 orizzontale**: scegli **Salva come PDF** oppure la stampante.
Nella vista Giorno e nella vista Mese si apre il menù della stagione che stai guardando. Il file si chiama già "Menù Estivo 2026-27" / "Menù Invernale 2026-27".
(Su iPhone: nell'anteprima di stampa allarga due dita sulla pagina, poi tocca Condividi → Salva su File.)

## Se l'app resta ferma su "Caricamento..."
Di solito succede quando sul sito sono stati caricati solo alcuni file e non tutti. Ricarica **sempre l'intera cartella** (tutti i file e la cartella `icons`).
L'app ora si accorge da sola del problema: dopo pochi secondi compare il pulsante **Ripara e ricarica**.

## Immagini del weekend, di Natale e di Pasqua
Possono essere un link oppure file tuoi: copiali nella cartella `immagini` e in `menu-data.js` scrivi il nome, per esempio `autunno: "immagini/autunno.jpg"`. I file della cartella funzionano anche senza connessione.

## Note
- Chiunque abbia il link può aprire l'app: contiene solo il menù, nessun dato personale.
- Le immagini di Natale e Pasqua vengono da altri siti e si vedono solo online; l'emoji compare sempre.
