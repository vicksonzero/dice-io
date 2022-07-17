import 'dotenv/config'
import { createServer } from "https";
import { Server, Socket } from "socket.io"
import { readFileSync } from 'fs'
import { Game } from './Game.js'
import { DashMessage, StartMessage } from '../model/EventsFromClient'
import { USE_SSL, PORT_WSS, PORT_WS, PHYSICS_FRAME_SIZE } from './constants'
import 'source-map-support/register'
import * as Debug from 'debug';

Debug.enable('dice-io:*:log');


const io = (() => {
    if (USE_SSL) {
        console.log(`Starting WSS server at ${PORT_WSS}`);

        const httpsServer = createServer({
            key: readFileSync("~/.ssh/ssl-key.pem"),
            cert: readFileSync("~/.ssh/ssl-cert.crt"),
            requestCert: true,
        });
        return new Server(httpsServer, {
            serveClient: false,
            // key: fs.readFileSync('./ssl_key.key'),
            // cert: fs.readFileSync('./ssl_cert.crt'),
            cors: {
                origin: "*",
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


let game = new Game();

game.init();
setInterval(() => game.update(), PHYSICS_FRAME_SIZE);


io.on("connection", (socket: Socket) => {
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

    socket.on("start", (data: StartMessage) => {
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

    socket.on("dash", (data: DashMessage) => {
        const { dashVector } = data;
        // console.log(`Socket dash. (${dashVector.x}, ${dashVector.y})`);
        game.onPlayerDash(socket.id, dashVector);
        sendState();
    });
});
