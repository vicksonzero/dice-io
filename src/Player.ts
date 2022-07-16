import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2World } from "@flyover/box2d";
import { Dice } from "./Dice";

export class Player {
    public socketID = '';
    public lastReceivedSnapshot = 0;
    public nextMoveTick = 0;

    public name = 'Player';
    public isHuman = false;
    public isControlling = false;

    // physics
    public x = 0;
    public y = 0;
    public r = 0;
    public friction = 0;

    public fixtureDef: b2FixtureDef | null = null;
    public bodyDef: b2BodyDef | null = null;
    public body: b2Body | null = null;

    public diceList: Dice[] = [];

    constructor() {
    }
    static create(name: string, socketID: string) {
        const result = new Player();
        result.name = name;

        if (socketID) {
            result.socketID = socketID;
            result.isHuman = true;
        }

        return result;
    }


    createPhysics(physicsWorld: b2World) {
        // body shape definition. can have many
        const fixtureDef = new b2FixtureDef();

        // doesn't participate in collisions? need to check
        fixtureDef.isSensor = true;

        // mass per volume
        fixtureDef.density = 1;

        // friction against other solids?
        fixtureDef.friction = 1.1;

        // bounciness
        fixtureDef.restitution = 0;

        fixtureDef.shape = new b2CircleShape();

        // fixture shape
        fixtureDef.shape.m_radius = this.r;

        this.fixtureDef = fixtureDef;

        // body def defines the body (well...)
        const bodyDef = new b2BodyDef();

        // dynamic(moving), static(walls) or kinematic(moving walls)
        bodyDef.type = b2BodyType.b2_dynamicBody;

        // not let rotation
        bodyDef.fixedRotation = true;

        this.bodyDef = bodyDef;

        // body: container for physics calculations
        const body = physicsWorld.CreateBody(this.bodyDef);

        // linking fixture. can have many fixtures
        body.CreateFixture(this.fixtureDef);

        // sleeping disables physics when not moving.
        // troublesome to wake it back though
        body.SetSleepingAllowed(false);

        this.body = body;
    }
}