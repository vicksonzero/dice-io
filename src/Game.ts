import {
    b2Contact, b2ContactImpulse, b2ContactListener,
    b2Fixture,
    b2Manifold, b2World,
    b2ParticleBodyContact, b2ParticleContact, b2ParticleSystem,
    b2Shape, b2Vec2
} from '@flyover/box2d';
import { IFixtureUserData, IBodyUserData } from '../client-src/PhysicsSystem';
import { Player } from './Player';
import type { Socket } from 'socket.io';



export class Game {
    public players: Player[] = [];
    public gravity: b2Vec2 = new b2Vec2(0, 0);
    public physics: b2World;
    sfx_point: any;

    constructor() {
        this.physics = new b2World(this.gravity);
    }

    getPlayerById(socketID: string) {
        return this.players.find(p => p.socketID === socketID);
    }

    onPlayerConnected(name: string, socket: Socket) {
        const existingPlayer = this.getPlayerById(socket.id);
        if (existingPlayer != null) {

            return existingPlayer;
        }
        const player = Player.create(name, socket.id);


        return player;
    }
    onPlayerDisconnected(socket: Socket) {
        // TODO: perhaps mark inactive and clean up later?
        const existingPlayer = this.getPlayerById(socket.id);
        if (existingPlayer != null) {
            // TODO: clean up existingPlayer
            this.players.splice(this.players.indexOf(existingPlayer), 1);
            return existingPlayer;
        }
    }

    getViewForPlayer(socket: Socket) {
        const existingPlayer = this.getPlayerById(socket.id);
        if (existingPlayer != null) {
            return this.players;
        }
        return null;
    }

    onPlayerMove(socket: Socket, moveVector: b2Vec2) {

    }

    update() {

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

