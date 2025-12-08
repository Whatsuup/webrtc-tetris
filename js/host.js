import { TetrisAPI } from './tetris.js';

const log = msg => document.getElementById('log').innerHTML += msg + '<br>';

// PeerJS erstellen
const peer = new Peer();
peer.on('open', id => {
    log("Peer-ID: " + id);

    // QR-Code für die Peer-ID generieren
    const protocol = "https://"
    const domain = window.location.hostname;
    const tag = "/webrtc-game/p2p-tetris/controller.html?id="
    const controller_url = protocol + domain + tag + id;
    QRCode.toDataURL(controller_url).then(url => {
        const img = document.createElement('img');
        img.src = url;
        document.getElementById('qrcode').appendChild(img);
    });
});

// Verbindung vom Controller akzeptieren
peer.on('connection', conn => {
    log("✅ Controller verbunden");

    conn.on('data', msg => {
        log("📩 " + msg);

        // Befehle an TetrisAPI weiterleiten
        if (window.TetrisAPI[msg]) window.TetrisAPI[msg]();
    });
});