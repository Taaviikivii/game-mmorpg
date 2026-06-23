const API =
     "https://game-mmorpg-production.up.railway.app"

async function register() {

    let username =
        document.getElementById("username").value;

    let password =
        document.getElementById("password").value;

    let response = await fetch(
        `${API}/register?username=${username}&password=${password}`,
        {
            method: "POST"
        }
    );

    let data = await response.json();

    document.getElementById("status").innerText =
        JSON.stringify(data);
}

async function login() {

    let username =
        document.getElementById("username").value;

    let password =
        document.getElementById("password").value;

    let response = await fetch(
        `${API}/login?username=${username}&password=${password}`,
        {
            method: "POST"
        }
    );

    let data = await response.json();

    if (data.success) {

        document.body.innerHTML = `
        <div id="game-container">

            <canvas id="game"
                width="900"
                height="600">
            </canvas>

            <div id="chat">

                <div id="messages"></div>

                <input
                    id="chatInput"
                    placeholder="Type message..."
                >

                <button id="sendBtn">
                    Send
                </button>

            </div>

        </div>
        `;

        startGame(
            data.player,
            data.x,
            data.y
        );
    }
    else {

        document.getElementById("status").innerText =
            JSON.stringify(data);
    }
}

function startGame(
    username,
    x,
    y
) {

    window.addEventListener(
    "keydown",
    e => {

        if (
            e.code === "Space" &&
            socket.readyState === WebSocket.OPEN
        ) {

            socket.send(
                JSON.stringify({
                    type: "attack"
                })
            );
        }
    }
);

    const canvas =
        document.getElementById("game");

    const ctx =
        canvas.getContext("2d");

    const messagesDiv =
        document.getElementById("messages");

    const chatInput =
        document.getElementById("chatInput");

    const sendBtn =
        document.getElementById("sendBtn");

    const player = {
        x: x,
        y: y,
        attackTimer: 0

    };

    const keys = {};

    let worldPlayers = {};

        const socket =
            new WebSocket(
              `wss://game-mmorpg-production.up.railway.app/ws/${username}`
);

socket.onmessage = event => {

        let data =
            JSON.parse(event.data);
        console.log("WS DATA:", data);
        if (data.type === "chat") {

            messagesDiv.innerHTML +=
                `<div><b>${data.player}</b>: ${data.message}</div>`;

            messagesDiv.scrollTop =
                messagesDiv.scrollHeight;

            return;
        }

        if (data.type === "players") {

            worldPlayers =
                data.players;
        }
    };

    sendBtn.onclick = () => {

        if (
            chatInput.value.trim() === ""
        ) return;
        
        player.attackTimer = 15;

        socket.send(
            JSON.stringify({    
                type: "chat",
                message: chatInput.value
            })
        );

        chatInput.value = "";
    };

    window.addEventListener(
        "keydown",
        e => keys[e.key.toLowerCase()] = true
    );

    window.addEventListener(
        "keyup",
        e => keys[e.key.toLowerCase()] = false
    );

    function update() {

        let moved = false;

        if (keys["w"]) {
            player.y -= 3;
            moved = true;
        }

        if (keys["s"]) {
            player.y += 3;
            moved = true;
        }

        if (keys["a"]) {
            player.x -= 3;
            moved = true;
        }

        if (keys["d"]) {
            player.x += 3;
            moved = true;
        }

        if (player.attackTimer > 0) {
            player.attackTimer--;
        }   

        if (
            moved &&
            socket.readyState === WebSocket.OPEN
        ) {

            socket.send(
                JSON.stringify({
                    type: "move",
                    x: player.x,
                    y: player.y
                })
            );
        }
    }

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let name in worldPlayers) {

        let p = worldPlayers[name];

        ctx.fillStyle = "blue";

        ctx.fillRect(
            p.x,
            p.y,
            30,
            30
        );

        ctx.fillStyle = "red";

        ctx.fillRect(
            p.x,
            p.y - 15,
            30,
            5
        );

        ctx.fillStyle = "lime";

        ctx.fillRect(
            p.x,
            p.y - 15,
            (p.health / 100) * 30,
            5
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            `${name} (${p.health})`,
            p.x,
            p.y - 20
        );
    }

    if (player.attackTimer > 0) {

    ctx.strokeStyle = "red";

    ctx.beginPath();

    ctx.arc(
        player.x + 15,
        player.y + 15,
        50,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}
}

    function loop() {

        update();
        draw();

        requestAnimationFrame(loop);

        const player = {
    x: x,
    y: y,
    attackTimer: 0
};
    }

    loop();
}
