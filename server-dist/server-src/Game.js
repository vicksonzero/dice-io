"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const Debug = require("debug");
const Player_1 = require("./Player");
const constants_1 = require("./constants");
const PhysicsSystem_1 = require("./PhysicsSystem");
const PhaserClock_1 = require("../model/PhaserClock");
const verbose = Debug('dice-io:Game:verbose');
class Game {
    constructor() {
        this.players = [];
        this.frameSize = constants_1.PHYSICS_FRAME_SIZE; // ms
        this.lastUpdate = -1;
        this.physicsSystem = new PhysicsSystem_1.PhysicsSystem();
        this.fixedTime = new PhaserClock_1.Clock();
        this.fixedElapsedTime = 0;
    }
    init() {
        this.physicsSystem.init(this);
        for (let i = 0; i < 30; i++) {
            const player = this.spawnNpc();
            this.randomizePlayerPosition(player);
        }
    }
    getPlayerById(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }
    isPlayerExists(socketId) {
        return this.getPlayerById(socketId) != null;
    }
    spawnNpc() {
        const player = Player_1.Player.create('npc');
        if (player)
            this.players.push(player);
        player.createPhysics(this.physicsSystem, () => {
        });
        return player;
    }
    randomizePlayerPosition(player) {
        const padding = constants_1.SPAWN_PADDING + player.r;
        const x = Math.random() * (constants_1.WORLD_WIDTH - padding * 2) + padding;
        const y = Math.random() * (constants_1.WORLD_HEIGHT - padding * 2) + padding;
        console.log(`randomizePlayerPosition(player=${player.entityId}, ${player.socketId || 'ai'})`);
        player.x = x;
        player.y = y;
    }
    onPlayerConnected(name, playerId) {
        const existingPlayer = this.getPlayerById(playerId);
        if (existingPlayer != null) {
            return existingPlayer;
        }
        const player = Player_1.Player.create(name, playerId);
        this.players.push(player);
        player.createPhysics(this.physicsSystem, () => {
            console.log('Body created');
        });
        this.randomizePlayerPosition(player);
        console.log(`Created player ${player.entityId}`);
        return player;
    }
    onPlayerDisconnected(playerId) {
        // TODO: perhaps mark inactive and clean up later?
        const existingPlayer = this.getPlayerById(playerId);
        if (existingPlayer == null) {
            console.warn('onPlayerDisconnected: no player found');
            return;
        }
        // TODO: clean up existingPlayer
        this.players.splice(this.players.indexOf(existingPlayer), 1);
        console.log(`Deleted player ${existingPlayer.entityId}`);
        return existingPlayer;
    }
    getViewForPlayer(playerId) {
        const existingPlayer = this.getPlayerById(playerId);
        if (existingPlayer == null) {
            // console.warn('getViewForPlayer: no player found');
            return null;
        }
        return (this.players
            .filter(player => {
            if (!player.b2Body)
                return false;
            // if (player.b2Body.m_linearVelocity.Length() < 0.01) return false;
            // if (player.sync.lastUpdated==0) return false;
            return true;
        })
            .map(player => {
            return {
                entityId: player.entityId,
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy,
                angle: player.r,
                r: player.r,
                name: player.name,
                color: player.color,
                isHuman: player.isHuman,
                isCtrl: (player.socketId === playerId),
                nextMoveTick: player.nextMoveTick,
                diceCount: player.diceList.length,
            };
        }));
    }
    onPlayerDash(playerId, dashVector) {
        const player = this.getPlayerById(playerId);
        if (player == null) {
            console.warn('onPlayerDash: no player found');
            return;
        }
        player.applyDashImpulse(dashVector);
    }
    update() {
        const time = Date.now();
        // verbose(`update ${time}`);
        const lastGameTime = this.lastUpdate;
        // log(`update (from ${lastGameTime} to ${gameTime})`);
        if (this.lastUpdate === -1) {
            this.lastUpdate = time;
            // seconds
            this.fixedElapsedTime += this.frameSize;
            this.fixedUpdate(this.fixedElapsedTime, this.frameSize);
        }
        else {
            let i = 0;
            while (this.lastUpdate + this.frameSize < time && i < constants_1.PHYSICS_MAX_FRAME_CATCHUP) {
                i++;
                this.fixedElapsedTime += this.frameSize;
                this.fixedUpdate(this.fixedElapsedTime, this.frameSize);
                this.lastUpdate += this.frameSize;
            }
            this.lastUpdate = time;
            // verbose(`update: ${i} fixedUpdate-ticks at ${time.toFixed(3)} (from ${lastGameTime.toFixed(3)} to ${this.lastUpdate.toFixed(3)})`);
        }
    }
    fixedUpdate(fixedTime, frameSize) {
        const timeStep = 1000 / frameSize;
        verbose(`fixedUpdate start`);
        this.fixedTime.preUpdate(fixedTime, frameSize);
        this.physicsSystem.update(timeStep);
        // this.distanceMatrix.init([this.bluePlayer, this.redPlayer, ...this.blueAi, ...this.redAi, ...this.items]);
        this.updatePlayers();
        this.fixedTime.update(fixedTime, frameSize);
        // this.lateUpdate(fixedTime, frameSize);
        // verbose(`fixedUpdate complete`);
    }
    updatePlayers() {
        const updatePlayer = (player) => {
            let xx = 0;
            let yy = 0;
            // player.doCollision();
            // player.tank?.repair();
            // player.moveInDirection(xx, yy);
            // player.updateAim();
        };
        for (const player of this.players) {
            updatePlayer(player);
        }
        const updatedPlayers = this.players.filter(player => {
            return (player.sync.lastUpdated > 0);
        }).map(player => [player.entityId, player.x].join(' '));
        if (updatedPlayers.length > 0) {
            console.log(`updatedPlayers: ${updatedPlayers.join('\n')}`);
        }
    }
    BeginContact(pContact) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        for (let contact = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) {
                continue;
            } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();
            const fixtureDataA = (_a = contact.GetFixtureA()) === null || _a === void 0 ? void 0 : _a.GetUserData();
            const fixtureDataB = (_b = contact.GetFixtureB()) === null || _b === void 0 ? void 0 : _b.GetUserData();
            const bodyDataA = (_c = fixtureA.GetBody()) === null || _c === void 0 ? void 0 : _c.GetUserData();
            const bodyDataB = (_d = fixtureB.GetBody()) === null || _d === void 0 ? void 0 : _d.GetUserData();
            const gameObjectA = (_f = (_e = fixtureA.GetBody()) === null || _e === void 0 ? void 0 : _e.GetUserData()) === null || _f === void 0 ? void 0 : _f.gameObject;
            const gameObjectB = (_h = (_g = fixtureB.GetBody()) === null || _g === void 0 ? void 0 : _g.GetUserData()) === null || _h === void 0 ? void 0 : _h.gameObject;
            // log(`BeginContact ` +
            //     `${bodyDataA?.label}(${gameObjectA?.uniqueID})'s ${fixtureDataA?.fixtureLabel}` +
            //     ` vs ` +
            //     `${bodyDataB?.label}(${gameObjectB?.uniqueID})'s ${fixtureDataB?.fixtureLabel}`
            // );
            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);
            // checkPairFixtureLabels('player-hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
            //     log('do contact 1');
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankStart(a, b, contact!);
            // });
            // if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
            //     log('gone 1');
            //     continue;
            // }
            // checkPairFixtureLabels('player-hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
            //     log('do contact 2');
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemStart(a, b, contact!);
            // });
            // if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
            //     log('gone 2');
            //     continue;
            // }
            checkPairGameObjectName('tank', 'item', (tankFixture, itemFixture) => {
                // log('do contact 3');
            });
            if (((_k = (_j = fixtureA.GetBody()) === null || _j === void 0 ? void 0 : _j.GetUserData()) === null || _k === void 0 ? void 0 : _k.gameObject) == null || ((_m = (_l = fixtureB.GetBody()) === null || _l === void 0 ? void 0 : _l.GetUserData()) === null || _m === void 0 ? void 0 : _m.gameObject) == null) {
                // log('gone 3');
                continue;
            }
            checkPairGameObjectName('tank', 'bullet', (tankFixture, bulletFixture) => {
                // log('do contact 3');
            });
            if (((_p = (_o = fixtureA.GetBody()) === null || _o === void 0 ? void 0 : _o.GetUserData()) === null || _p === void 0 ? void 0 : _p.gameObject) == null || ((_r = (_q = fixtureB.GetBody()) === null || _q === void 0 ? void 0 : _q.GetUserData()) === null || _r === void 0 ? void 0 : _r.gameObject) == null) {
                // log('gone 3');
                continue;
            }
            checkPairFixtureLabels('player-body', 'bullet-body', (playerFixture, bulletFixture) => {
                // log('do contact 4');
            });
            if (((_t = (_s = fixtureA.GetBody()) === null || _s === void 0 ? void 0 : _s.GetUserData()) === null || _t === void 0 ? void 0 : _t.gameObject) == null || ((_v = (_u = fixtureB.GetBody()) === null || _u === void 0 ? void 0 : _u.GetUserData()) === null || _v === void 0 ? void 0 : _v.gameObject) == null) {
                // log('gone 4');
                continue;
            }
            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }
    EndContact(pContact) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        for (let contact = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) {
                continue;
            } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();
            const fixtureDataA = (_a = contact.GetFixtureA()) === null || _a === void 0 ? void 0 : _a.GetUserData();
            const fixtureDataB = (_b = contact.GetFixtureB()) === null || _b === void 0 ? void 0 : _b.GetUserData();
            const bodyDataA = (_c = fixtureA.GetBody()) === null || _c === void 0 ? void 0 : _c.GetUserData();
            const bodyDataB = (_d = fixtureB.GetBody()) === null || _d === void 0 ? void 0 : _d.GetUserData();
            const gameObjectA = (_f = (_e = fixtureA.GetBody()) === null || _e === void 0 ? void 0 : _e.GetUserData()) === null || _f === void 0 ? void 0 : _f.gameObject;
            const gameObjectB = (_h = (_g = fixtureB.GetBody()) === null || _g === void 0 ? void 0 : _g.GetUserData()) === null || _h === void 0 ? void 0 : _h.gameObject;
            // log(`EndContact ` +
            //     `${bodyDataA?.label}(${gameObjectA?.uniqueID})'s ${fixtureDataA?.fixtureLabel}` +
            //     ` vs ` +
            //     `${bodyDataB?.label}(${gameObjectB?.uniqueID})'s ${fixtureDataB?.fixtureLabel}`
            // );
            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);
            // checkPairFixtureLabels('player-hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankEnd(a, b, contact!);
            // });
            // checkPairFixtureLabels('player-hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemEnd(a, b, contact!);
            // });
            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }
    BeginContactFixtureParticle(system, contact) {
        // do nothing
    }
    EndContactFixtureParticle(system, contact) {
        // do nothing
    }
    BeginContactParticleParticle(system, contact) {
        // do nothing
    }
    EndContactParticleParticle(system, contact) {
        // do nothing
    }
    PreSolve(contact, oldManifold) {
        // do nothing
    }
    PostSolve(contact, impulse) {
        // do nothing
    }
    checkPairGameObjectName_(fixtureA, fixtureB) {
        var _a, _b, _c, _d;
        const gameObjectA = (_b = (_a = fixtureA === null || fixtureA === void 0 ? void 0 : fixtureA.GetBody()) === null || _a === void 0 ? void 0 : _a.GetUserData()) === null || _b === void 0 ? void 0 : _b.gameObject;
        const gameObjectB = (_d = (_c = fixtureB === null || fixtureB === void 0 ? void 0 : fixtureB.GetBody()) === null || _c === void 0 ? void 0 : _c.GetUserData()) === null || _d === void 0 ? void 0 : _d.gameObject;
        return (nameA, nameB, matchFoundCallback) => {
            if ((gameObjectA === null || gameObjectA === void 0 ? void 0 : gameObjectA.name) === nameA && (gameObjectB === null || gameObjectB === void 0 ? void 0 : gameObjectB.name) === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            }
            else if ((gameObjectB === null || gameObjectB === void 0 ? void 0 : gameObjectB.name) === nameA && (gameObjectA === null || gameObjectA === void 0 ? void 0 : gameObjectA.name) === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        };
    }
    checkPairFixtureLabels_(fixtureA, fixtureB) {
        const fixtureDataA = fixtureA.GetUserData();
        const fixtureDataB = fixtureB.GetUserData();
        return (nameA, nameB, matchFoundCallback) => {
            if ((fixtureDataA === null || fixtureDataA === void 0 ? void 0 : fixtureDataA.fixtureLabel) === nameA && (fixtureDataB === null || fixtureDataB === void 0 ? void 0 : fixtureDataB.fixtureLabel) === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            }
            else if ((fixtureDataB === null || fixtureDataB === void 0 ? void 0 : fixtureDataB.fixtureLabel) === nameA && (fixtureDataA === null || fixtureDataA === void 0 ? void 0 : fixtureDataA.fixtureLabel) === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        };
    }
}
exports.Game = Game;
//# sourceMappingURL=Game.js.map