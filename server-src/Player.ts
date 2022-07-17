import { getPhysicsDefinitions } from '../model/Player';
import { getUniqueID } from '../model/UniqueID';
import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2Vec2, b2World, XY } from "@flyover/box2d";
import { PIXEL_TO_METER } from "./constants.js";
import { Dice } from "./Dice.js";
import { PhysicsSystem } from "./PhysicsSystem.js";

export class Player {
    public entityId: number;
    public socketId = '';
    public nextMoveTick = 0;
    public sync = {
        lastReceived: 0,
        lastUpdated: 0,
    };

    public name = 'Player';
    public color = 0xffffff;
    public isHuman = false;
    public isControlling = false;

    // physics
    public x = 0;
    public y = 0;
    public angle = 0;
    public r = 0;
    public friction = 0;
    public vx = 0;
    public vy = 0;

    public fixtureDef?: b2FixtureDef;
    public bodyDef?: b2BodyDef;
    public b2Body?: b2Body;

    public diceList: Dice[] = [];

    constructor() {
        this.entityId = getUniqueID();
    }
    static create(name: string, socketId?: string) {
        const result = new Player();
        result.name = name;

        if (socketId) {
            result.socketId = socketId;
            result.isHuman = true;
        }

        return result;
    }


    createPhysics(physicsSystem: PhysicsSystem, physicsFinishedCallback?: () => void) {
        const {fixtureDef, bodyDef} = getPhysicsDefinitions(this.r);

        this.fixtureDef = fixtureDef;

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
            physicsFinishedCallback?.();
        });
    }

    applyDashImpulse(dashVector: XY) {
        if (this.b2Body == null) return;

        const pos = this.b2Body.GetPosition();
        const v = new b2Vec2(dashVector.x, dashVector.y);
        v.SelfMul(PIXEL_TO_METER);
        this.b2Body.ApplyLinearImpulse(v, { x: pos.x, y: pos.y }, true);
    }
}