var _a, _b;
import 'dotenv/config';
import { Server } from "socket.io";
import { Game } from './Game';
const USE_SSL = process.env.USE_SSL === 'true';
const PORT_WSS = parseInt((_a = process.env.PORT_WSS) !== null && _a !== void 0 ? _a : '443', 10);
const PORT_WS = parseInt((_b = process.env.PORT_WS) !== null && _b !== void 0 ? _b : '80', 10);
const io = (() => {
    if (USE_SSL) {
        console.log(`Starting WSS server at ${PORT_WSS}`);
        return new Server(PORT_WSS, {
            serveClient: false,
            // key: fs.readFileSync('./ssl_key.key'),
            // cert: fs.readFileSync('./ssl_cert.crt'),
            cors: {
                origin: "https://vicksonzero.itch.io",
                methods: ["GET", "POST"]
            }
        });
    }
    else {
        console.log(`Starting WS server at ${PORT_WS}`);
        return new Server(PORT_WS, {
            serveClient: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            }
        });
    }
})();
let game = new Game();
io.on("connection", (socket) => {
    socket.on("start", (data) => {
        const { name } = data;
        game.onPlayerConnected(name, socket);
    });
    socket.on("disconnect", () => {
        game.onPlayerDisconnected(socket);
    });
    socket.on("dash", (data) => {
        const { dashVector } = data;
        game.onPlayerDash(socket, dashVector);
    });
});
//# sourceMappingURL=index.js.map