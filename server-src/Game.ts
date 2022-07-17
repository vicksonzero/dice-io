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
import { AttackHappenedMessage, StateMessage } from '../model/EventsFromServer';
import { PhysicsSystem } from './PhysicsSystem';
import { Clock } from '../model/PhaserClock';
import { DistanceMatrix } from '../utils/DistanceMatrix'
import { names } from '../model/Names'
import { Dice, RollsStats } from './Dice';


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

    emitSocketEvent = (socketId: string, event: string, data: any) => { };
    emitToAll = (event: string, data: any) => { };


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

        console.log('getRandomDice', npc.diceList.map(d => d.symbol).join(''));


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
        console.log('getRandomDice', player.diceList.map(d => d.symbol).join(''));
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

            const bodyA = fixtureA.GetBody();
            const bodyB = fixtureB.GetBody();

            const fixtureDataA: IFixtureUserData = fixtureA?.GetUserData();
            const fixtureDataB: IFixtureUserData = fixtureB?.GetUserData();

            const bodyDataA: IBodyUserData = bodyA?.GetUserData();
            const bodyDataB: IBodyUserData = bodyB?.GetUserData();

            const gameObjectA = bodyA?.GetUserData()?.gameObject;
            const gameObjectB = bodyB?.GetUserData()?.gameObject;


            console.log(`BeginContact ` +
                `${bodyDataA?.label}(${gameObjectA?.uniqueID})'s ${fixtureDataA?.fixtureLabel}` +
                ` vs ` +
                `${bodyDataB?.label}(${gameObjectB?.uniqueID})'s ${fixtureDataB?.fixtureLabel}`
            );

            const checkPairGameObjectName = this.checkPairWithMapper_(fixtureA, fixtureB,
                (fixture) => (fixture?.GetBody()?.GetUserData()?.gameObject.name)
            );
            const checkPairFixtureLabels = this.checkPairWithMapper_(fixtureA, fixtureB,
                (fixture) => (fixture?.GetUserData()?.fixtureLabel)
            );


            checkPairFixtureLabels('player', 'player', (playerFixtureA: b2Fixture, playerFixtureB: b2Fixture) => {
                console.log('do contact');
                const playerA: Player = playerFixtureA.GetBody()?.GetUserData()?.gameObject as Player;
                const playerB: Player = playerFixtureB.GetBody()?.GetUserData()?.gameObject as Player;

                this.fight(playerA, playerB);
            });
            // if (this.someFixturesDied(fixtureA, fixtureB)) continue;

            // checkPairGameObjectName('tank', 'bullet', (tankFixture: b2Fixture, bulletFixture: b2Fixture) => {
            //     // log('do contact 3');
            // });
            // if (this.someFixturesDied(fixtureA, fixtureB)) continue;

            // checkPairFixtureLabels('player-body', 'bullet-body', (playerFixture: b2Fixture, bulletFixture: b2Fixture) => {
            //     // log('do contact 4');
            // });

        }
    }
    public EndContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact: b2Contact<b2Shape, b2Shape> | null = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) { continue; } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const checkPairGameObjectName = this.checkPairWithMapper_(fixtureA, fixtureB,
                (fixture) => (fixture?.GetBody()?.GetUserData()?.gameObject.name)
            );
            const checkPairFixtureLabels = this.checkPairWithMapper_(fixtureA, fixtureB,
                (fixture) => (fixture?.GetUserData()?.fixtureLabel)
            );

            // checkPairFixtureLabels('player-hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankEnd(a, b, contact!);
            // });
            // if (this.someFixturesDied(fixtureA, fixtureB)) continue;

            // checkPairFixtureLabels('player-hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemEnd(a, b, contact!);
            // });
            // if (this.someFixturesDied(fixtureA, fixtureB)) continue;


            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
            // if (this.someFixturesDied(fixtureA, fixtureB)) continue;
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

    private checkPairWithMapper_(fixtureA: b2Fixture, fixtureB: b2Fixture, mappingFunction: (fixture: b2Fixture) => string) {
        const _nameA = mappingFunction(fixtureA);
        const _nameB = mappingFunction(fixtureA);

        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: b2Fixture, b: b2Fixture) => void
        ) => {
            if (_nameA === nameA && _nameB === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            } else if (_nameB === nameA && _nameA === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        }
    }
    private someFixturesDied(fixtureA: b2Fixture, fixtureB: b2Fixture) {
        return fixtureA.GetBody()?.GetUserData()?.gameObject == null ||
            fixtureB.GetBody()?.GetUserData()?.gameObject == null;
    }

    fight(playerA: Player, playerB: Player) {
        const rollsA = playerA.diceList.map(dice => dice.roll());
        const rollsB = playerB.diceList.map(dice => dice.roll());

        const buffsA = playerA.buffs;
        const buffsB = playerB.buffs;

        const suitCountA = RollsStats.create(rollsA).suitCount;
        const suitCountB = RollsStats.create(rollsB).suitCount;

        const netDamageA = suitCountA.S + buffsA.B + buffsB.V - suitCountB.B;
        const netDamageB = suitCountB.S + buffsB.B + buffsA.V - suitCountA.B;

        let result: 'A' | 'B' | 'DRAW' = 'DRAW';

        if (netDamageA > netDamageB) result = 'A';
        else if (netDamageB > netDamageA) result = 'B';
        else if (suitCountA.M > suitCountB.M) result = 'A';
        else if (suitCountB.M > suitCountA.M) result = 'B';

        const message: AttackHappenedMessage = {
            untilTick: Date.now() + 3000,
            result,
            playerAId: playerA.entityId,
            playerBId: playerB.entityId,
            diceColorsA: playerA.diceList.map(dice => dice.color),
            diceColorsB: playerB.diceList.map(dice => dice.color),
            rollsSuitA: rollsA.map(roll => roll.suit),
            rollsSuitB: rollsB.map(roll => roll.suit),
            netDamageA,
            netDamageB,
            transferredIndex: -1,
        };

        if (result != 'DRAW') {
            const winningPlayer = result == 'A' ? playerA : playerB;
            const losingPlayer = result == 'A' ? playerB : playerA;

            if (losingPlayer.diceList.length > 0) {
                message.transferredIndex = this.transferRandomDice(losingPlayer, winningPlayer);
            } else {
                // kill fromPlayer
            }
        }
        console.log([`fight: `,
            `${playerA.entityId}(${message.rollsSuitA.join('')}, ${netDamageA}dmg)`,
            ` vs ` +
            `${playerB.entityId}(${message.rollsSuitB.join('')}, ${netDamageB}dmg)`,
            `, result=${result})`
        ].join(''));

        this.emitToAll('fight', message);
    }

    transferRandomDice(fromPlayer: Player, toPlayer: Player) {
        if (fromPlayer.diceList.length <= 0) return -1;
        const transferredDiceIndex = ~~(Math.random() * fromPlayer.diceList.length)
        const dice = fromPlayer.diceList.splice(transferredDiceIndex, 1)[0];
        toPlayer.diceList.push(dice);
        return transferredDiceIndex;
    }
}

