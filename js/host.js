//
// Alexander Albers
// usvan@student.kit.edu
//

import { TetrisAPI } from './tetris.js';
import Peer from "https://cdn.jsdelivr.net/npm/peerjs@1.4.7/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/+esm";

const log = msg => console.log(msg);

// Create new Peer using the peerjs lib.
const peer = new Peer();
peer.on('open', id => {
    log("Host: Peer-ID " + id);

    // QR-Code generation for visual/easy connection with host.
    // URL will be generated and transferred into an QR-Code with the QRCode library.
    //
    // THIS DOES NOT WORK FOR LOCAL TESTING!
    // Running this script locally, results in domain = localhost which can't be accessed from another device.
    // In this case manual connect to the controller.html and type the peer id as requested from the same device.
    const protocol = "https://";
    let domain = window.location.hostname;
    const path = "/webrtc-tetris/controller.html";
    const param = "?id=";
    const controller_url = protocol + domain + path + param + id;
    QRCode.toDataURL(controller_url).then(url => {
        const img = document.createElement('img');
        img.src = url;
        document.getElementById('qrcode').appendChild(img);
    });
    let url = "http://" + domain + ":" + window.location.port + path;
    document.getElementById('link').href = url + param + id;
    document.getElementById('link').textContent = url;
    document.getElementById('peer_id').textContent = peer.id;
});

// Connection initiation.
peer.on('connection', conn => {
    // At the start of a connection all connection related info will be hidden and the game starts.
    log("Controller connected");
    document.body.classList.add("connected");
    document.body.classList.remove("gameover");
    window.TetrisAPI.start();

    // All connection related data passes through this function.
    conn.on('data', msg => {
        log("Client message: " + msg);

        // If a restart is sent, the gameover overlay will be removed.
        if (msg === "restart") document.body.classList.remove("gameover");

        // Send command delivered by client message to tetris module.
        if (window.TetrisAPI[msg]) window.TetrisAPI[msg]();

        // If a game is over, the gameover overlay will be enabled.
        const state = window.TetrisAPI.getState();
        if (state.gameOver) document.body.classList.add("gameover");
    });
});