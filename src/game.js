
import { b2World, b2Vec2 } from 'box2dweb-commonjs';


export class Game {
    constructor() {
        this.players = [];
        this.gravity = new b2Vec2(0, 0);
        this.physics = new b2World(this.gravity, true);
    }

    getPlayerById(socketID) {
        return this.players.find(p => p.socketID === socketID);
    }

    onPlayerConnected(name, socket) {
        const existingPlayer = this.getPlayerById(socket.id);
        if (existingPlayer != null) {

            return existingPlayer;
        }
        const player = new Player(name, socket.id);


        return player;
    }
    onPlayerDisconnected(socket) {
        // TODO: perhaps mark inactive and clean up later?
        const existingPlayer = this.getPlayerById(socket.id);
        if (existingPlayer != null) {
            // TODO: clean up existingPlayer
            this.players.splice(this.players.indexOf(existingPlayer), 1);
            return existingPlayer;
        }
    }

    getViewForPlayer(socket) {

    }
}

export class Player {
    constructor() {
        this.socketID = '';
        this.nextMoveTick = 0;

        this.name = 'Player';
        this.isHuman = false;
        this.isControlling = false;

        // physics
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.friction = 0;

        this.diceList = [];
    }
    static create(name, socketID) {
        this.name = name;

        if (socketID) {
            this.socketID = socketID;
            this.isHuman = true;
        }
    }
}

export class Dice {
    constructor() {
        /**
         * @type {DiceSide[]}
         */
        this.sides = [];
    }

    loadSide(sideIndex) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }

    static create(/** @type {string} */ sides) {
        const result = new Dice();

        result.sides = sides.split('').map(sideType => DiceSide.create(sideType));
        return result;
    }
}

export class DiceSide {
    constructor() {
        this.suit = ''; // S=Sword, H=Shield, L=Love, B=Book
        this.weight = 1;
    }

    static create(/** @type {string} */ suit) {
        const result = new DiceSide();

        result.suit = suit;
        return result;
    }
}