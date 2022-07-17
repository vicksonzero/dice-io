"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsSystem = void 0;
const box2d_1 = require("@flyover/box2d");
const Debug = require("debug");
const constants_1 = require("./constants");
const verbose = Debug('dice-io:PhysicsSystem:verbose');
const log = Debug('dice-io:PhysicsSystem:log');
class PhysicsSystem {
    constructor(gravity = { x: 0, y: 0 }) {
        this.gravity = gravity;
        this.scheduledCreateBodyList = [];
        this.scheduledDestroyBodyList = [];
        this.world = new box2d_1.b2World(gravity);
    }
    init(contactListener) {
        this.world.SetAllowSleeping(constants_1.PHYSICS_ALLOW_SLEEPING);
        this.world.SetContactListener(contactListener);
    }
    readStateFromGame() {
        const verboseLogs = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData(); // TODO: make an interface for user data
            const gameObject = userData.gameObject || null;
            const label = userData.label || '(no label)';
            const name = gameObject.name || '(no name)';
            if (!gameObject) {
                continue;
            }
            verboseLogs.push(`Body ${label} ${name}`);
            body.SetPosition({
                x: gameObject.x * constants_1.PIXEL_TO_METER,
                y: gameObject.y * constants_1.PIXEL_TO_METER,
            });
            body.SetAngle(gameObject.rotation);
        }
        verbose('readStateFromGame\n' + verboseLogs.join('\n'));
    }
    writeStateIntoGame() {
        const verboseLogs = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            const gameObject = userData.gameObject || null;
            const label = (userData === null || userData === void 0 ? void 0 : userData.label) || '(no label)';
            const name = (gameObject === null || gameObject === void 0 ? void 0 : gameObject.name) || '(no name)';
            if (!gameObject) {
                continue;
            }
            verboseLogs.push(`${name}'s body ${label}`);
            const pos = body.GetPosition();
            const rot = body.GetAngle(); // radians
            gameObject.x = pos.x * constants_1.METER_TO_PIXEL;
            gameObject.y = pos.y * constants_1.METER_TO_PIXEL;
            gameObject.setRotation(rot);
        }
        verbose('writeStateIntoGame\n' + verboseLogs.join('\n'));
    }
    update(timeStep, graphics) {
        this.destroyScheduledBodies('before Step');
        this.readStateFromGame();
        if (graphics) {
            this.debugDraw(graphics);
        }
        // verbose('Begin updateToFrame');
        this.updateOneFrame(timeStep);
        this.destroyScheduledBodies('after Step');
        // verbose('End updateToFrame');
        this.createScheduledBodies();
        this.writeStateIntoGame();
    }
    updateOneFrame(timeStep) {
        const velocityIterations = 10; //how strongly to correct velocity
        const positionIterations = 10; //how strongly to correct position
        this.world.Step(timeStep, velocityIterations, positionIterations);
    }
    scheduleCreateBody(callback) {
        this.scheduledCreateBodyList.push(callback);
    }
    createScheduledBodies() {
        const len = this.scheduledCreateBodyList.length;
        if (len > 0) {
            // log(`createScheduledBodies: ${len} callbacks`);
        }
        this.scheduledCreateBodyList.forEach((callback) => {
            callback(this.world);
        });
        this.scheduledCreateBodyList = [];
    }
    scheduleDestroyBody(body) {
        this.scheduledDestroyBodyList.push(body);
    }
    destroyScheduledBodies(debugString) {
        const len = this.scheduledCreateBodyList.length;
        if (len > 0) {
            // log(`destroyScheduledBodies(${debugString}): ${len} callbacks`);
        }
        this.scheduledDestroyBodyList.forEach((body) => {
            this.world.DestroyBody(body);
        });
        this.scheduledDestroyBodyList = [];
    }
    debugDraw(graphics) {
        // see node_modules/@flyover/box2d/Box2D/Dynamics/b2World.js DrawDebugData() 
        // for more example of drawing debug data onto screen
        graphics.clear();
        this.drawBodies(graphics);
        this.drawJoints(graphics);
    }
    drawBodies(graphics) {
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const pos = body.GetPosition();
            const angle = body.GetAngle(); // radian
            for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
                const shape = fixture.GetShape();
                const type = shape.GetType();
                const isSensor = fixture.IsSensor();
                const fixtureLabel = fixture.GetUserData().fixtureLabel;
                let color = 0xff8080;
                if (!body.IsActive()) {
                    color = 0x80804c;
                }
                else if (body.GetType() === box2d_1.b2BodyType.b2_staticBody) {
                    color = 0x80e580;
                }
                else if (body.GetType() === box2d_1.b2BodyType.b2_kinematicBody) {
                    color = 0x8080e5;
                }
                else if (!body.IsAwake()) {
                    color = 0x999999;
                }
                else {
                    color = 0xe6b2b2; // 0xf29999;
                }
                const alpha = isSensor ? 0 : 0.5;
                graphics.lineStyle(2, color, 1);
                graphics.fillStyle(color, alpha);
                switch (type) {
                    case box2d_1.b2ShapeType.e_circleShape:
                        {
                            const circleShape = shape;
                            const p = circleShape.m_p;
                            const r = circleShape.m_radius;
                            graphics.strokeCircle((pos.x + p.x) * constants_1.METER_TO_PIXEL, (pos.y + p.y) * constants_1.METER_TO_PIXEL, r * constants_1.METER_TO_PIXEL);
                            graphics.fillCircle((pos.x + p.x) * constants_1.METER_TO_PIXEL, (pos.y + p.y) * constants_1.METER_TO_PIXEL, r * constants_1.METER_TO_PIXEL);
                            graphics.lineBetween((pos.x + p.x) * constants_1.METER_TO_PIXEL, (pos.y + p.y) * constants_1.METER_TO_PIXEL, (pos.x + p.x + Math.cos(angle) * r) * constants_1.METER_TO_PIXEL, (pos.y + p.y + Math.sin(angle) * r) * constants_1.METER_TO_PIXEL);
                        }
                        break;
                    case box2d_1.b2ShapeType.e_polygonShape:
                        {
                            const polygonShape = shape;
                            const vertices = polygonShape.m_vertices;
                            graphics.beginPath();
                            vertices.forEach((v, i) => {
                                if (i === 0) {
                                    graphics.moveTo((pos.x + v.x) * constants_1.METER_TO_PIXEL, (pos.y + v.y) * constants_1.METER_TO_PIXEL);
                                }
                                else {
                                    graphics.lineTo((pos.x + v.x) * constants_1.METER_TO_PIXEL, (pos.y + v.y) * constants_1.METER_TO_PIXEL);
                                }
                            });
                            graphics.closePath();
                            graphics.strokePath();
                            graphics.fillPath();
                        }
                        break;
                }
            }
        }
    }
    drawJoints(graphics) {
        var _a;
        for (let joint = this.world.GetJointList(); joint; joint = joint.GetNext()) {
            const color = 0x81cccc;
            graphics.lineStyle(2, color, 1);
            const type = joint.GetType();
            const label = ((_a = joint.GetUserData()) === null || _a === void 0 ? void 0 : _a.label) || '';
            const bodyA = joint.GetBodyA();
            const bodyB = joint.GetBodyB();
            const xf1 = bodyA.m_xf;
            const xf2 = bodyB.m_xf;
            const x1 = xf1.p;
            const x2 = xf2.p;
            const p1 = joint.GetAnchorA({ x: 0, y: 0 });
            const p2 = joint.GetAnchorB({ x: 0, y: 0 });
            switch (type) {
                case box2d_1.b2JointType.e_distanceJoint:
                    {
                        graphics.lineBetween((p1.x) * constants_1.METER_TO_PIXEL, (p1.y) * constants_1.METER_TO_PIXEL, (p2.x) * constants_1.METER_TO_PIXEL, (p2.y) * constants_1.METER_TO_PIXEL);
                    }
                    break;
                default:
                    {
                        graphics.lineBetween((x1.x) * constants_1.METER_TO_PIXEL, (x1.y) * constants_1.METER_TO_PIXEL, (p1.x) * constants_1.METER_TO_PIXEL, (p1.y) * constants_1.METER_TO_PIXEL);
                        graphics.lineBetween((p1.x) * constants_1.METER_TO_PIXEL, (p1.y) * constants_1.METER_TO_PIXEL, (p2.x) * constants_1.METER_TO_PIXEL, (p2.y) * constants_1.METER_TO_PIXEL);
                        graphics.lineBetween((x2.x) * constants_1.METER_TO_PIXEL, (x2.y) * constants_1.METER_TO_PIXEL, (p2.x) * constants_1.METER_TO_PIXEL, (p2.y) * constants_1.METER_TO_PIXEL);
                    }
            }
        }
    }
}
exports.PhysicsSystem = PhysicsSystem;
//# sourceMappingURL=PhysicsSystem.js.map