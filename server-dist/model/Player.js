"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhysicsDefinitions = void 0;
const box2d_1 = require("@flyover/box2d");
const getPhysicsDefinitions = (radius) => {
    // body shape definition. can have many
    const fixtureDef = new box2d_1.b2FixtureDef();
    // doesn't participate in collisions? need to check
    fixtureDef.isSensor = true;
    // mass per volume
    fixtureDef.density = 1;
    // friction against other solids?
    fixtureDef.friction = 1.1;
    // bounciness
    fixtureDef.restitution = 0;
    fixtureDef.shape = new box2d_1.b2CircleShape();
    // fixture shape
    fixtureDef.shape.m_radius = radius;
    // body def defines the body (well...)
    const bodyDef = new box2d_1.b2BodyDef();
    // dynamic(moving), static(walls) or kinematic(moving walls)
    bodyDef.type = box2d_1.b2BodyType.b2_dynamicBody;
    // sleeping disables physics when not moving.
    // troublesome to wake it back though
    bodyDef.allowSleep = false;
    return {
        fixtureDef,
        bodyDef,
    };
};
exports.getPhysicsDefinitions = getPhysicsDefinitions;
//# sourceMappingURL=Player.js.map