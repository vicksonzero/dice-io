import { getPhysicsDefinitions } from '../model/Player';
import { getUniqueID } from '../model/UniqueID';
import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2Vec2, b2World, XY } from "@flyover/box2d";
import { PIXEL_TO_METER } from "./constants.js";
import { Dice } from "./Dice.js";
import { IFixtureUserData, PhysicsSystem } from "./PhysicsSystem.js";
import * as Debug from 'debug';

const verbose = Debug('dice-io:Player:verbose');
const log = Debug('dice-io:Player:log');



export class Player {
    public entityId: number;
    public socketId = '';
    public nextMoveTick = 0;
    public sync = {
        lastReceived: 0,
        lastUpdated: 0,
    };
    public deleteAfterTick?: number;

    public nextCanShoot = 0;
    public buffs = {
        B: 0, // in next fight, deal x more damage
        V: 0, // in next fight, take x more damage
    };

    public name = 'Player';
    public color = 0xffffff;
    public isHuman = false;
    public isControlling = false;

    // physics
    public x = 0;
    public y = 0;
    public angle = 0;
    public r = 20;
    public friction = 0;
    public vx = 0;
    public vy = 0;
    public vAngle = 0;

    public fixtureDef?: b2FixtureDef;
    public bodyDef?: b2BodyDef;
    public b2Body?: b2Body;

    public diceList: Dice[] = [];

    constructor() {
        this.entityId = getUniqueID();
    }
    static create(name: string, tier = 0, socketId?: string) {
        const result = new Player();
        result.name = name;

        if (socketId) {
            result.socketId = socketId;
            result.isHuman = true;
        }

        result.diceList = [
            Dice.getRandomDice(tier)!,
            Dice.getRandomDice(tier)!,
            Dice.getRandomDice(tier)!,
        ];

        return result;
    }


    createPhysics(physicsSystem: PhysicsSystem, physicsFinishedCallback?: () => void) {
        const { fixtureDef, bodyDef } = getPhysicsDefinitions(this.r * PIXEL_TO_METER);

        this.fixtureDef = fixtureDef;

        fixtureDef.userData = {
            fixtureLabel: 'player',
        } as IFixtureUserData;

        this.bodyDef = bodyDef;
        bodyDef.userData = {
            label: 'player',
            gameObject: this,
        };


        physicsSystem.scheduleCreateBody((world: b2World) => {
            this.b2Body = world.CreateBody(bodyDef);
            this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
            this.b2Body.SetPositionXY(this.x * PIXEL_TO_METER, this.y * PIXEL_TO_METER);

            // this.on('destroy', () => {
            //     physicsSystem.scheduleDestroyBody(this.b2Body);
            //     this.b2Body.m_userData.gameObject = null;
            // });
            log('Body created');
            physicsFinishedCallback?.();
        });
    }

    destroyPhysics(physicsSystem: PhysicsSystem) {
        if (!this.b2Body) return;
        log('destroyPhysics', this.entityId);

        physicsSystem.scheduleDestroyBody(this.b2Body);
        this.b2Body.m_userData.gameObject = null;
    }

    canShoot() {
        return Date.now() >= this.nextCanShoot;
    }

    applyDashImpulse(dashVector: XY) {
        if (this.b2Body == null) return;

        const pos = this.b2Body.GetPosition();
        const v = new b2Vec2(dashVector.x, dashVector.y);
        v.SelfMul(PIXEL_TO_METER);

        const angularFlick = 0.7;
        this.b2Body.ApplyLinearImpulse(
            v,
            {
                x: pos.x + (Math.random() * this.r * PIXEL_TO_METER * 2 - this.r * PIXEL_TO_METER) * angularFlick,
                y: pos.y + (Math.random() * this.r * PIXEL_TO_METER * 2 - this.r * PIXEL_TO_METER) * angularFlick,
            },
            true
        );
        // this.b2Body.ApplyAngularImpulse(dashVector.x * 1, true);
    }

    dashAwayFrom(other: Player, force: number) {
        if (this.b2Body == null) return;
        const awayVector = new b2Vec2(
            this.x - other.x,
            this.y - other.y
        );
        awayVector.SelfNormalize().SelfMul(force * PIXEL_TO_METER);
        const pos = this.b2Body.GetPosition();
        this.b2Body.ApplyLinearImpulse(
            awayVector,
            {
                x: pos.x,
                y: pos.y,
            },
            true
        );
    }
}