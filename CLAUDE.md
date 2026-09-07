# Contesto progetto — Bliss Agency Technical Assignment

## Cos'è questo progetto

Challenge tecnica per un colloquio da Web Developer presso Bliss Agency (agenzia di
marketing/brand a Roma). Deadline: venerdì 11 settembre, colloquio lo stesso giorno.

**Nome ufficiale**: Website Audit Collector & Analyzer

**Obiettivo**: una web app dove l'utente inserisce l'URL di un sito pubblico, l'app
raccoglie dati dalla homepage + fino a 4 pagine interne, li normalizza, li analizza,
calcola uno score e mostra tutto in una dashboard.

## Requisiti della traccia (riassunti, vedi anche traccia originale se presente nel repo)

**Stack richiesto**: TypeScript, React/Next.js, backend Node.js (API routes, Express o
NestJS, libero). Qualsiasi libreria di chart.

**Data collection**, per ogni pagina crawlata: URL, status/fetch result, title, meta
description, H1, numero H2, testi CTA possibili, conteggio immagini, immagini senza alt,
link interni/esterni, word count stimato, load time (della request server-side, non è
una metrica frontend — va specificato nel README).

Deve gestire redirect, pagine fallite, timeout in modo pulito. Deve supportare anche
l'import di un JSON di esempio, per testare la dashboard senza dover scrapare davvero
(sito che blocca, timeout, ecc.) — includere un file JSON di esempio nel repo.

**Analisi**: rilevare issue come title/meta/H1 mancanti, CTA debole o assente, pagine
lente, errori HTTP, immagini senza alt, contenuto scarso, troppi link esterni, title
duplicati/simili. Severity levels definiti da noi (critical vs warning), motivati nel
README. **Cos'è una CTA e cosa la rende debole è una definizione nostra, non standard —
è una delle parti valutate.**

**Scoring**: score 0-100 complessivo + score per pagina, con pesi definiti da noi e
motivati nel README (non basta che esistano, va spiegato il perché).

**Dashboard**: design "very important part of assignment" — non è un dettaglio
estetico opzionale. Deve mostrare: score complessivo, pagine totali/riuscite/fallite,
critical issues, warnings, load time medio, pagine con title/meta/H1 mancanti, immagini
senza alt totali, CTA rilevate. Più charts (es. distribuzione issue per tipo, score per
pagina, load time per pagina, elementi mancanti per pagina, distribuzione status code).
Sezione issue list chiara. Vista raw data normalizzata in JSON.

**README obbligatorio**, deve includere: come installare/avviare, stack usato, approccio
di scraping, limiti di crawl e gestione timeout, assunzioni fatte, regole di scoring,
come sono state selezionate le pagine interne, definizione di CTA e severity levels,
perché i pesi sono quelli, **se e come sono stati usati strumenti AI**, limiti noti,
cosa miglioreresti con più tempo.

## Uso di AI — importantissimo, non aggirabile

La traccia dice esplicitamente: preferiscono che scriva tutto da solo, ma l'uso di AI
**non squalifica**, a patto che nel README sia dichiarato onestamente: quali strumenti,
per quali parti, cosa è stato modificato rispetto all'output generato.

Questo significa, in pratica lavorando con Claude Code su questo progetto:

- Tieni traccia mentale (o in un file di note a parte) di cosa Claude ha generato
  direttamente vs cosa è stato scritto/modificato a mano, così il README finale sia
  vero e verificabile, non ricostruito a posteriori.
- Non riscrivere la voce del README sull'uso di AI in modo da minimizzare: deve
  rispecchiare quello che è successo davvero.

## Chi sono io (contesto per calibrare l'aiuto)

Frontend & Creative Technologist, ~3 anni di esperienza. Punti di forza: canvas/WebGL
(PixiJS, Three.js/R3F), esperienza iGaming (performance-critical), rendering e UX.
Punti deboli dichiarati: backend e algoritmi, in particolare **non ho esperienza diretta
con Node/Express** (vengo da Laravel/Flask — pattern trasferibili ma sintassi non fresca
in mano), **WordPress/Elementor non è il mio terreno**. Attualmente faccio poca pratica
di scrittura manuale di codice a lavoro, quindi anche su cose che conosco potrei essere
più lento del solito a ripartire — non è un problema di competenza, è ruggine.

### Cosa affrontare in autonomia (con aiuto solo se bloccato)
- Definizioni concettuali: cos'è una CTA debole, i severity levels, la logica di
  scoring e i pesi — devono restare mio ragionamento, li dovrò argomentare a voce
  al colloquio.
- Dashboard/UI/charts — è il mio terreno forte, Claude Code può dare struttura di
  partenza ma il tocco finale (layout, gerarchia visiva, dettagli) meglio se mio.
- README — lo scrivo io, anche se la struttura può essere suggerita.

### Dove appoggiarmi di più a Claude Code
- Scaffolding iniziale (cartelle, config, package.json).
- Scraping/fetch lato server, gestione redirect/timeout/errori (Node puro, mio punto
  debole dichiarato).
- Sintassi Express/API routes, boilerplate meccanico.
- Debug quando sono bloccato, anche su parti "mie" concettualmente.

## Filosofia di codice — vincolo di stile, non negoziabile

**Niente overengineering.** Questo è un assignment di pochi giorni per una challenge di
colloquio, non un prodotto enterprise. Voglio un compromesso tra codice ben scritto e
organizzato, e pragmatismo:

- Semplice prima che "elegante". Niente pattern astratti, niente layer di indirezione
  che non servono a questa scala (no dependency injection frameworks, no repository
  pattern per due chiamate fetch, no state management library se bastano gli hook di
  React).
- Struttura chiara e piatta: cartelle che si capiscono a colpo d'occhio, non una
  gerarchia profonda "per principio".
- Facile da modificare ed estendere in poco tempo — se aggiungere una nuova issue di
  analisi richiede toccare 5 file, la struttura è sbagliata.
- Codice che io possa rileggere e spiegare a voce senza sforzo. Se non riesco a
  spiegare perché una cosa è scritta così, va semplificata.
- Va bene duplicare due righe piuttosto che creare un'astrazione prematura per
  "DRY a tutti i costi".
- TypeScript usato per chiarezza (interfacce sui dati), non per ingegneria dei tipi
  spinta (no generics acrobatici, no utility types complessi se non servono davvero).

In sintesi: pragmatico, leggibile, onesto — non impressionare con complessità, ma con
chiarezza di pensiero applicata a poco codice ben fatto.
