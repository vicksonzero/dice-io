import {
    b2Contact, b2ContactImpulse, b2ContactListener,
    b2Fixture,
    b2Manifold, b2World,
    b2ParticleBodyContact, b2ParticleContact, b2ParticleSystem,
    b2Shape, b2Vec2, XY
} from '@flyover/box2d';
import * as Debug from 'debug';
import { IFixtureUserData, IBodyUserData } from '../client-src/PhysicsSystem';
import { Player } from './Player';
import type { Socket } from 'socket.io';
import { PHYSICS_FRAME_SIZE, PHYSICS_MAX_FRAME_CATCHUP, SPAWN_PADDING, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { StateMessage } from '../model/EventsFromServer';
import { PhysicsSystem } from './PhysicsSystem';
import { Clock } from '../model/PhaserClock';
import { DistanceMatrix } from '../utils/DistanceMatrix'
import { names } from '../model/Names'
import { Dice } from './Dice';


const verbose = Debug('dice-io:Game:verbose');

export class Game implements b2ContactListener {
    public players: Player[] = [];
    sfx_point: any;

    frameSize = PHYSICS_FRAME_SIZE; // ms
    lastUpdate = -1;
    fixedTime: Clock;
    fixedElapsedTime: number;

    physicsSystem: PhysicsSystem = new PhysicsSystem();
    distanceMatrix: DistanceMatrix = new DistanceMatrix();


    constructor() {
        this.fixedTime = new Clock();
        this.fixedElapsedTime = 0;
        this.distanceMatrix.getTransformList = () => this.getTransformList();
    }

    init() {
        this.physicsSystem.init(this as b2ContactListener);
        for (let i = 0; i < 30; i++) {
            const player = this.spawnNpc();
        }
    }

    getPlayerById(socketId: string) {
        return this.players.find(p => p.socketId === socketId);
    }

    isPlayerExists(socketId: string) {
        return this.getPlayerById(socketId) != null;
    }

    spawnNpc() {
        const npc = Player.create(names[~~(Math.random() * names.length)]);
        if (npc) this.players.push(npc);
        npc.createPhysics(this.physicsSystem, () => { });

        this.randomizePlayerPosition(npc);

        const displacement = new b2Vec2(
            WORLD_WIDTH / 2 - npc.x,
            WORLD_HEIGHT / 2 - npc.y
        );
        let tier = 0;
        if (displacement.Length() < 600) tier = 2;
        else if (displacement.Length() < 1200) tier = 1;

        npc.diceList = [
            Dice.getRandomDice(tier)!,
            Dice.getRandomDice(tier)!,
            Dice.getRandomDice(tier)!,
        ];

        console.log('getRandomDice', npc.diceList.map(d=>d.symbol).join(''));
        

        return npc;
    }

    randomizePlayerPosition(player: Player) {
        const padding = SPAWN_PADDING + player.r;
        const x = Math.random() * (WORLD_WIDTH - padding * 2) + padding;
        const y = Math.random() * (WORLD_HEIGHT - padding * 2) + padding;

        console.log(`randomizePlayerPosition(player=${player.entityId}, ${player.socketId || 'ai'})`);

        player.x = x;
        player.y = y;
    }

    onPlayerConnected(name: string, playerId: string) {
        const existingPlayer = this.getPlayerById(playerId);
        if (existingPlayer != null) {
            return existingPlayer;
        }

        const player = Player.create(name, 0, playerId);
        this.players.push(player);
        player.createPhysics(this.physicsSystem, () => {
            console.log('Body created');
        });
        this.randomizePlayerPosition(player);
        this.distanceMatrix.insertTransform(player);

        console.log(`Created player ${player.entityId}`);
        console.log('getRandomDice', player.diceList.map(d=>d.symbol).join(''));
        return player;
    }
    onPlayerDisconnected(playerId: string) {
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

    getViewForPlayer(playerId: string, isFullState = false): StateMessage | null {
        const existingPlayer = this.getPlayerById(playerId);
        if (existingPlayer == null) {
            // console.warn('getViewForPlayer: no player found');
            return null;
        }

        const state = (this.players
            .filter(player => {
                if (!player.b2Body) return false;
                // if (!isWelcome && player.b2Body.m_linearVelocity.Length() < 0.001) return false;
                // if (player.sync.lastUpdated==0) return false;
                if (!isFullState && this.distanceMatrix.getDistanceBetween(existingPlayer, player) > 300) return false;

                return true;
            })
            .map(player => {

                return {
                    entityId: player.entityId,
                    x: player.x,
                    y: player.y,
                    vx: player.vx,
                    vy: player.vy,
                    angle: player.angle, // in degrees
                    vAngle: player.vAngle,
                    r: player.r, // radius

                    name: player.name,
                    color: player.color,
                    isHuman: player.isHuman,
                    isCtrl: (player.socketId === playerId), // for the player receiving this state pack, is this Player themselves?
                    nextMoveTick: player.nextMoveTick,

                    diceColors: player.diceList.map(dice => dice.color),
                };
            })
        );

        return {
            tick: Date.now(),
            state,
        };
    }

    onPlayerDash(playerId: string, dashVector: XY) {
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
        } else {
            let i = 0;
            while (this.lastUpdate + this.frameSize < time && i < PHYSICS_MAX_FRAME_CATCHUP) {
                i++;

                this.fixedElapsedTime += this.frameSize;
                this.fixedUpdate(this.fixedElapsedTime, this.frameSize);
                this.lastUpdate += this.frameSize;
            }
            this.lastUpdate = time;

            // verbose(`update: ${i} fixedUpdate-ticks at ${time.toFixed(3)} (from ${lastGameTime.toFixed(3)} to ${this.lastUpdate.toFixed(3)})`);
        }
    }

    fixedUpdate(fixedTime: number, frameSize: number) {
        const timeStep = 1000 / frameSize;
        verbose(`fixedUpdate start`);

        this.fixedTime.preUpdate(fixedTime, frameSize);
        this.physicsSystem.update(
            timeStep,
            // (DEBUG_PHYSICS ? this.physicsDebugLayer : undefined)
        );
        this.distanceMatrix.init();
        this.updatePlayers();

        this.fixedTime.update(fixedTime, frameSize);
        // this.lateUpdate(fixedTime, frameSize);
        // verbose(`fixedUpdate complete`);
    }

    getTransformList = () => ([...this.players]);

    updatePlayers() {
        const updatePlayer = (player: Player) => {
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
        }).map(player => (
            [
                player.entityId,
                player.x.toFixed(1),
                player.y.toFixed(1),
            ].join(' ')
        ));
        // if (updatedPlayers.length > 0) {
        //     console.log(`updatedPlayers: ${updatedPlayers.join('\n')}`);
        // }
    }


    public BeginContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact: b2Contact<b2Shape, b2Shape> | null = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) { continue; } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const fixtureDataA: IFixtureUserData = contact.GetFixtureA()?.GetUserData();
            const fixtureDataB: IFixtureUserData = contact.GetFixtureB()?.GetUserData();

            const bodyDataA: IBodyUserData = fixtureA.GetBody()?.GetUserData();
            const bodyDataB: IBodyUserData = fixtureB.GetBody()?.GetUserData();

            const gameObjectA = fixtureA.GetBody()?.GetUserData()?.gameObject;
            const gameObjectB = fixtureB.GetBody()?.GetUserData()?.gameObject;
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

            checkPairGameObjectName('tank', 'item', (tankFixture: b2Fixture, itemFixture: b2Fixture) => {
                // log('do contact 3');
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 3');
                continue;
            }

            checkPairGameObjectName('tank', 'bullet', (tankFixture: b2Fixture, bulletFixture: b2Fixture) => {
                // log('do contact 3');
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 3');
                continue;
            }

            checkPairFixtureLabels('player-body', 'bullet-body', (playerFixture: b2Fixture, bulletFixture: b2Fixture) => {
                // log('do contact 4');
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 4');
                continue;
            }

            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }
    public EndContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact: b2Contact<b2Shape, b2Shape> | null = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) { continue; } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const fixtureDataA: IFixtureUserData = contact.GetFixtureA()?.GetUserData();
            const fixtureDataB: IFixtureUserData = contact.GetFixtureB()?.GetUserData();

            const bodyDataA: IBodyUserData = fixtureA.GetBody()?.GetUserData();
            const bodyDataB: IBodyUserData = fixtureB.GetBody()?.GetUserData();

            const gameObjectA = fixtureA.GetBody()?.GetUserData()?.gameObject;
            const gameObjectB = fixtureB.GetBody()?.GetUserData()?.gameObject;
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

    public BeginContactFixtureParticle(system: b2ParticleSystem, contact: b2ParticleBodyContact): void {
        // do nothing
    }
    public EndContactFixtureParticle(system: b2ParticleSystem, contact: b2ParticleBodyContact): void {
        // do nothing
    }
    public BeginContactParticleParticle(system: b2ParticleSystem, contact: b2ParticleContact): void {
        // do nothing
    }
    public EndContactParticleParticle(system: b2ParticleSystem, contact: b2ParticleContact): void {
        // do nothing
    }
    public PreSolve(contact: b2Contact<b2Shape, b2Shape>, oldManifold: b2Manifold): void {
        // do nothing
    }
    public PostSolve(contact: b2Contact<b2Shape, b2Shape>, impulse: b2ContactImpulse): void {
        // do nothing
    }

    private checkPairGameObjectName_(fixtureA: b2Fixture, fixtureB: b2Fixture) {
        const gameObjectA = fixtureA?.GetBody()?.GetUserData()?.gameObject;
        const gameObjectB = fixtureB?.GetBody()?.GetUserData()?.gameObject;

        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: b2Fixture, b: b2Fixture) => void
        ) => {
            if (gameObjectA?.name === nameA && gameObjectB?.name === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            } else if (gameObjectB?.name === nameA && gameObjectA?.name === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        }
    }

    private checkPairFixtureLabels_(fixtureA: b2Fixture, fixtureB: b2Fixture) {
        const fixtureDataA: IFixtureUserData = fixtureA.GetUserData();
        const fixtureDataB: IFixtureUserData = fixtureB.GetUserData();

        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: b2Fixture, b: b2Fixture) => void
        ) => {
            if (fixtureDataA?.fixtureLabel === nameA && fixtureDataB?.fixtureLabel === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            } else if (fixtureDataB?.fixtureLabel === nameA && fixtureDataA?.fixtureLabel === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        }
    }
}

