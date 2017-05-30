##Compilazione e Avvio su Windows
- Installa NodeJs https://nodejs.org/dist/v7.5.0/node-v7.5.0-x64.msi
- Da linea di comando installa browserify, babel e babili
- 'npm install -g --save-dev browserify'
- 'npm install -g --save-dev babel-cli'
- 'npm install -g --save-dev babili'
- Installa le dipendenze: 'npm install'
- Avvia windows.bat
- La dashboard è accessibile su 127.0.0.1:3000
- Per inviare le richieste simulando il server si può usare HTTP Requester per Firefox https://addons.mozilla.org/it/firefox/addon/httprequester/
- Per avviarlo è necessaria una richiesta POST all'indirizzo 127.0.0.1:3000/start (Simula il server centrale che avvia il gioco)

Le librerie esterne utilizzate sono:

- jquery
- express
- socket.io
- raphael
- jquery-mousewheel
- deep-diff

Per sviluppo, avvio e unit test:

- browserify
- babel-cli
- babili
- jsdom
- mocha
- mocha-jsdom
- chai