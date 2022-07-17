import 'dotenv/config'
import { Server, Socket } from "socket.io"
import * as fs from 'fs'
import { Game } from './Game.js'
import { DashMessage, StartMessage } from '../model/EventsFromClient'
import { USE_SSL, PORT_WSS, PORT_WS, PHYSICS_FRAME_SIZE } from './constants'
import * as Debug from 'debug';

Debug.enable('dice-io:*:log');

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

    const sendState = () => {
        const players = game.getViewForPlayer(socket.id);
        // console.log(`Socket sendState. (${players?.length})`);
        if (players && players.length > 0) {
            socket.emit('state', players);
        }
    };

    const interval = setInterval(sendState, 1000);

    socket.on("start", (data: StartMessage) => {
        const { name } = data;
        console.log(`Socket player start. name=${name}`);

        game.onPlayerConnected(name, socket.id);

        // const players = game.getViewForPlayer(socket);
        // if (players && players.length > 0) {
        //     socket.emit('welcome', players);
        //     return;
        // }
        socket.emit('welcome');
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected. (id=${socket.id})`);
        game.onPlayerDisconnected(socket.id);
        clearInterval(interval);
    });

    socket.on("dash", (data: DashMessage) => {
        const { dashVector } = data;
        console.log(`Socket dash. (${dashVector.x}, ${dashVector.y})`);
        game.onPlayerDash(socket.id, dashVector);
    });
});