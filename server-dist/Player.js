import { b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef } from "@flyover/box2d";
export class Player {
    constructor() {
        this.socketId = '';
        this.lastReceivedSnapshot = 0;
        this.nextMoveTick = 0;
        this.name = 'Player';
        this.isHuman = false;
        this.isControlling = false;
        // physics
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.friction = 0;
        this.fixtureDef = null;
        this.bodyDef = null;
        this.body = null;
        this.diceList = [];
    }
    static create(name, socketId) {
        const result = new Player();
        result.name = name;
        if (socketId) {
            result.socketId = socketId;
            result.isHuman = true;
        }
        return result;
    }
    createPhysics(physicsWorld) {
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
    applyDashImpulse(dashVector) {
        if (this.body == null)
            return;
        this.body.ApplyLinearImpulse(dashVector, { x: 0, y: 0 }, true);
    }
}
//# sourceMappingURL=Player.js.map