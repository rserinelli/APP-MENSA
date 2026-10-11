// ============================================================================
//  DATI DEL MENU  -  e' l'UNICO file da modificare quando cambia il menu
//  Dopo la modifica ricarica questo file sul sito: i genitori vedranno il
//  nuovo menu alla prossima apertura dell'app (serve la connessione).
// ============================================================================
window.MENU = {

  // ---- Anno scolastico (compare nel titolo: "Menu Estivo 2026/27") ----
  anno: "2026/27",

  // ---- Date: formato AAAA-MM-GG (qui i mesi sono quelli normali: 09 = settembre) ----
  inizio: "2026-09-14",   // primo giorno di mensa (deve essere un lunedi)
  fine:   "2027-06-25",   // ultimo giorno di mensa

  // Settimana del ciclo (1-4) che corrisponde al primo lunedi.
  // Con 2, il 14 settembre 2026 e' la Settimana II.
  settimanaIniziale: 2,

  // ---- Mesi con il menu INVERNALE (tutti gli altri hanno quello ESTIVO) ----
  // 11 = novembre ... 4 = aprile
  mesiInvernali: [11, 12, 1, 2, 3, 4],

  // ---- Chiusure straordinarie (primo e ultimo giorno inclusi) ----
  // "immagine" e' facoltativa (si vede solo con la connessione); "emoji" compare sempre.
  chiusure: [
    {
      da: "2026-12-23", a: "2027-01-06",
      etichetta: "Vacanze di Natale",
      testo: "Mensa chiusa per le vacanze di Natale",
      emoji: "🎄",
      immagine: "https://lacapannadelsilenzio.it/wp-content/uploads/2015/12/nativit%C3%A0-36.jpg"
    },
    {
      da: "2027-03-25", a: "2027-03-30",
      etichetta: "Vacanze di Pasqua",
      testo: "Mensa chiusa per le vacanze di Pasqua",
      emoji: "🐣",
      immagine: "https://www.cercoiltuovolto.it/wp-content/uploads/2022/04/resurreccio%CC%81n-fano.jpeg"
    }
  ],

  // ==========================================================================
  //  COME SCRIVERE I PIATTI
  //  - 4 settimane a rotazione (1, 2, 3, 4), giorni da 1 = lunedi a 5 = venerdi
  //  - Metti * dopo il nome se il prodotto e' surgelato: la nota compare da sola
  //  - Per aggiungere l'alternativa per l'Infanzia scrivi:  Piatto||Infanzia: Altro piatto
  //  - Scrivi gli accenti normalmente (ù, è, à...)
  // ==========================================================================

  // ==========================================================================
  //  MENU INVERNALE (1 novembre - 30 aprile)   <<<  MODIFICA QUI
  // ==========================================================================
  menuInvernale: {
    // ===== SETTIMANA I =====
    1: {
      // LUNEDI
      1: { primo: "Pennette al ragù bianco",
           secondo: "Formaggio Quick||Infanzia: Formaggini",
           contorno: "Insalata di finocchi",
           dessert: "Yogurt",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Chifferi burro e parmigiano",
           secondo: "Frittata con patate",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Pasta in crema di lenticchie",
           secondo: "Bocconcini di pollo al forno",
           contorno: "Spinaci* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Riso al pomodoro",
           secondo: "Polpette in umido",
           contorno: "Carote all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Fusilli con ricotta in bianco",
           secondo: "Bastoncini di pesce* al forno",
           contorno: "Purea di patate",
           dessert: "Budino",
           pane: "Pane" },
    },

    // ===== SETTIMANA II =====
    2: {
      // LUNEDI
      1: { primo: "Pasta con passato di fagioli",
           secondo: "Frittata semplice",
           contorno: "Carote* al vapore",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Pasta al ragù",
           secondo: "Formaggio",
           contorno: "Insalata verde",
           dessert: "Ciambellone",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Pasta al pesto",
           secondo: "Polpette di manzo al forno",
           contorno: "Patate arrosto",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Mezze penne al pomodoro",
           secondo: "Fettina di suino panata",
           contorno: "Bieta* all'olio",
           dessert: "Yogurt",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Risotto con zucca",
           secondo: "Cotoletta di mare",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

    // ===== SETTIMANA III =====
    3: {
      // LUNEDI
      1: { primo: "Minestrina in brodo di carne",
           secondo: "Bocconcini di pollo al forno",
           contorno: "Patate al forno",
           dessert: "Yogurt",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Rigatoni burro e parmigiano",
           secondo: "Polpette al forno",
           contorno: "Piselli* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Passato di fagioli con pasta",
           secondo: "Frittata",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Fusilli al pesto",
           secondo: "Formaggio Quick||Infanzia: Formaggini",
           contorno: "Insalata",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Sedanini al pomodoro",
           secondo: "Filetto di pesce* panato",
           contorno: "Spinaci* all'olio",
           dessert: "Budino",
           pane: "Pane" },
    },

    // ===== SETTIMANA IV =====
    4: {
      // LUNEDI
      1: { primo: "Riso al pomodoro",
           secondo: "Frittata semplice",
           contorno: "Bieta* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Pasta al ragù",
           secondo: "Formaggio",
           contorno: "Insalata di carote e mais",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Napellini burro e parmigiano",
           secondo: "Bocconcini di pollo al forno",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Crema di zucca e legumi con pasta",
           secondo: "Arista al forno",
           contorno: "Purè di patate",
           dessert: "Ciambellone",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Penne al pomodoro",
           secondo: "Bastoncini di salmone* al forno||Infanzia: Bast. Merluzzo*",
           contorno: "Piselli* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

  },

  // ==========================================================================
  //  MENU ESTIVO (14 settembre - 31 ottobre e 1 maggio - 30 giugno)
  // ==========================================================================
  menuEstivo: {
    // ===== SETTIMANA I =====
    1: {
      // LUNEDI
      1: { primo: "Conchiglie al ragù",
           secondo: "Mozzarella",
           contorno: "Insalata e pomodori",
           dessert: "Yogurt",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Riso al pomodoro",
           secondo: "Uova strapazzate",
           contorno: "Bieta* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Pasta olio e parmigiano",
           secondo: "Polpette in umido",
           contorno: "Piselli* all'olio",
           dessert: "Gelato",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Farfalle in salsa aurora",
           secondo: "Arrosto di maiale",
           contorno: "Patate al forno",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Pennette con ricotta",
           secondo: "Bastoncini di pesce* al forno",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

    // ===== SETTIMANA II =====
    2: {
      // LUNEDI
      1: { primo: "Fusilli al pomodoro",
           secondo: "Prosciutto cotto",
           contorno: "Insalata con mais",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Pasta con zucchine",
           secondo: "Mozzarella",
           contorno: "Carote Julienne",
           dessert: "Gelato",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Mezze maniche con ricotta",
           secondo: "Bocconcini di pollo al forno",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Pennette al pomodoro",
           secondo: "Frittata",
           contorno: "Spinaci* all'olio",
           dessert: "Yogurt",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Pasta olio e parmigiano",
           secondo: "Cotoletta di pesce*",
           contorno: "Patate al forno",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

    // ===== SETTIMANA III =====
    3: {
      // LUNEDI
      1: { primo: "Gnocchetti al ragù in bianco",
           secondo: "Frittata",
           contorno: "Carote* al vapore",
           dessert: "Gelato",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Risotto al pomodoro",
           secondo: "Polpette di manzo",
           contorno: "Bieta* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Napellini burro e parmigiano",
           secondo: "Pollo al forno",
           contorno: "Piselli* all'olio",
           dessert: "Yogurt",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Fusilli al pesto",
           secondo: "Mozzarella",
           contorno: "Pomodori",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Fettuccine al pomodoro||Infanzia: Pasta al pomodoro",
           secondo: "Bastoncini di salmone* al forno||Infanzia: Bastoncini di merluzzo*",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

    // ===== SETTIMANA IV =====
    4: {
      // LUNEDI
      1: { primo: "Risotto zafferano",
           secondo: "Formaggio",
           contorno: "Insalata",
           dessert: "Yogurt",
           pane: "Pane" },
      // MARTEDI
      2: { primo: "Pasta al pesto",
           secondo: "Cotoletta panata",
           contorno: "Fagiolini* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // MERCOLEDI
      3: { primo: "Pasta in salsa aurora",
           secondo: "Frittata",
           contorno: "Bieta* all'olio",
           dessert: "Frutta di stagione",
           pane: "Pane" },
      // GIOVEDI
      4: { primo: "Mezze maniche al pomodoro",
           secondo: "Fesa di tacchino",
           contorno: "Carote* al vapore",
           dessert: "Gelato",
           pane: "Pane" },
      // VENERDI
      5: { primo: "Napellini olio e parma",
           secondo: "Nuggets di pesce*",
           contorno: "Patatine stick* al forno",
           dessert: "Frutta di stagione",
           pane: "Pane" },
    },

  },
};
