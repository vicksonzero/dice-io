import 'dotenv/config'
import { Server } from "socket.io";
import fs from 'fs';
import { Game } from './Game.js'


const USE_SSL = process.env.USE_SSL === 'true';
const PORT_WSS = process.env.PORT_WSS || 443;
const PORT_WS = process.env.PORT_WS || 80;
const io = (() => {
    if (USE_SSL) {
        console.log(`Starting WSS server at ${PORT_WSS}`);
        return new Server(PORT_WSS, {
            serveClient: false,
            key: fs.readFileSync('./ssl_key.key'),
            cert: fs.readFileSync('./ssl_cert.crt'),
            cors: {
                origin: "https://vicksonzero.itch.io",
                methods: ["GET", "POST"]
            }
        });
    } else {
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


game = new Game();

io.on("connection", (socket) => {
    socket.on("start", (data) => {
        const { name } = data;

        game.spawnPlayer(name, socket);
    });

    socket.on("disconnect", () => {
        game.despawnPlayer(socket);
    })
});