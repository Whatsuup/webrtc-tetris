const log = msg => document.getElementById('log').innerHTML += msg + '<br>';

// URL-Parameter auslesen
const params = new URLSearchParams(window.location.search);
const targetId = params.get('id'); // ?id=<PeerID>

let conn;
const peer = new Peer();

peer.on('open', myId => {
    log("✅ Controller Peer-ID: " + myId);

    if (targetId) {
        // Auto-Verbindung über URL-ID
        conn = peer.connect(targetId);
        conn.on('open', () => {
            document.getElementById('status').textContent = "✅ Verbunden mit " + targetId + "!";
            document.getElementById('controls').style.display = "block";
        });
    } else {
        // Fallback: manuelle Eingabe
        document.getElementById("connect").onclick = () => {
            const id = document.getElementById("peerid").value.trim();
            if (!id) return alert("Bitte Peer-ID eingeben!");
            conn = peer.connect(id);
            conn.on('open', () => {
                document.getElementById('status').textContent = "✅ Verbunden mit " + id + "!";
                document.getElementById('controls').style.display = "block";
            });
        };
    }
});

// Buttons senden Befehle
document.querySelectorAll("#controls button").forEach(btn => {
    btn.onclick = () => {
        if (conn && conn.open) conn.send(btn.dataset.cmd);
        else alert("Nicht verbunden!");
    };
});

// Optional: Tastatursteuerung
window.addEventListener('keydown', e => {
    if (!conn || !conn.open) return;
    switch (e.code) {
        case 'ArrowLeft': conn.send('left'); break;
        case 'ArrowRight': conn.send('right'); break;
        case 'ArrowUp': conn.send('rotate'); break;
        case 'ArrowDown': conn.send('softDrop'); break;
        case 'Space': conn.send('hardDrop'); break;
    }
});