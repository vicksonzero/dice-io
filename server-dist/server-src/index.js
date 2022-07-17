"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const https_1 = require("https");
const socket_io_1 = require("socket.io");
const fs_1 = require("fs");
const Game_js_1 = require("./Game.js");
const constants_1 = require("./constants");
require("source-map-support/register");
const Debug = require("debug");
Debug.enable('dice-io:*:log');
const io = (() => {
    if (constants_1.USE_SSL) {
        console.log(`Starting WSS server at ${constants_1.PORT_WSS}`);
        const httpsServer = (0, https_1.createServer)({
            key: (0, fs_1.readFileSync)("~/.ssh/ssl-key.pem"),
            cert: (0, fs_1.readFileSync)("~/.ssh/ssl-cert.crt"),
            requestCert: true,
        });
        return new socket_io_1.Server(httpsServer, {
            serveClient: false,
            // key: fs.readFileSync('./ssl_key.key'),
            // cert: fs.readFileSync('./ssl_cert.crt'),
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
    }
    else {
        console.log(`Starting WS server at ${constants_1.PORT_WS}`);
        return new socket_io_1.Server(constants_1.PORT_WS, {
            serveClient: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            }
        });
    }
})();
let game = new Game_js_1.Game();
game.init();
setInterval(() => game.update(), constants_1.PHYSICS_FRAME_SIZE);
io.on("connection", (socket) => {
    const count = io.engine.clientsCount;
    console.log(`Socket (${count}) connected. id=${socket.id}`);
    const sendState = (isFullState = false) => {
        const playerStateList = game.getViewForPlayer(socket.id, isFullState);
        // console.log(`Socket sendState. (${players?.length})`);
        if (playerStateList && playerStateList.state.length > 0) {
            socket.emit('state', playerStateList);
        }
    };
    const interval = setInterval(() => sendState(true), 1000);
    const interval2 = setInterval(sendState, 50);
    socket.on("start", (data) => {
        const { name } = data;
        console.log(`Socket player start. name=${name}`);
        game.onPlayerConnected(name, socket.id);
        socket.emit('welcome');
        sendState(true);
    });
    socket.on("disconnect", () => {
        console.log(`Socket disconnected. (id=${socket.id})`);
        game.onPlayerDisconnected(socket.id);
        clearInterval(interval);
        clearInterval(interval2);
    });
    socket.on("dash", (data) => {
        const { dashVector } = data;
        // console.log(`Socket dash. (${dashVector.x}, ${dashVector.y})`);
        game.onPlayerDash(socket.id, dashVector);
        sendState();
    });
});
//# sourceMappingURL=index.js.map