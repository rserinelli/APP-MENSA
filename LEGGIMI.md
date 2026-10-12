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
- **iPhone:** Apple non permette l'installazione con un solo tocco, quindi il pulsante mostra 3 passaggi illustrati (Condividi → Aggiungi alla schermata Home → Aggiungi). Il link va aperto con Safari.

Se l'app è già installata, il pulsante non compare più.

Dopo la prima apertura l'app funziona anche senza connessione.
Dentro l'app, il tasto **Condividi l'app** manda il link ad altri genitori e **Condividi il menù** invia il menù del giorno come messaggio.

## 3. Cambiare il menù (invernale in arrivo dalla mensa, nuove chiusure, ecc.)

Tutto sta in **un solo file: `menu-data.js`**, scritto in chiaro.
- Menù invernale: cerca `MENU INVERNALE` e cambia il testo tra le virgolette.
- Menù estivo: cerca `MENU ESTIVO`.
- Chiusure: blocco `chiusure` (date nel formato `2026-12-23`; qui i mesi sono quelli normali, 12 = dicembre).
- Date di inizio e fine, mesi invernali e settimana di partenza sono in cima al file.

Per pubblicare la modifica ricarica `menu-data.js` sul sito (su Netlify trascina di nuovo la cartella).
I genitori vedono il menù aggiornato alla prossima apertura dell'app con connessione.

## Se l'app resta ferma su "Caricamento..."
Di solito succede quando sul sito sono stati caricati solo alcuni file e non tutti. Ricarica **sempre l'intera cartella** (tutti i file e la cartella `icons`).
L'app ora si accorge da sola del problema: dopo pochi secondi compare il pulsante **Ripara e ricarica**.

## Immagini del weekend, di Natale e di Pasqua
Possono essere un link oppure file tuoi: copiali nella cartella `immagini` e in `menu-data.js` scrivi il nome, per esempio `autunno: "immagini/autunno.jpg"`. I file della cartella funzionano anche senza connessione.

## Note
- Chiunque abbia il link può aprire l'app: contiene solo il menù, nessun dato personale.
- Le immagini di Natale e Pasqua vengono da altri siti e si vedono solo online; l'emoji compare sempre.
