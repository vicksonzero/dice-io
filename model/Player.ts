import { b2FixtureDef, b2CircleShape, b2BodyDef, b2BodyType } from "@flyover/box2d";

export const getPhysicsDefinitions = (radius: number) => {

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
    fixtureDef.shape.m_radius = radius;

    // body def defines the body (well...)
    const bodyDef = new b2BodyDef();

    // dynamic(moving), static(walls) or kinematic(moving walls)
    bodyDef.type = b2BodyType.b2_dynamicBody;


    bodyDef.linearDamping = 0.005;
    bodyDef.angularDamping = 0.0005;

    // sleeping disables physics when not moving.
    // troublesome to wake it back though
    bodyDef.allowSleep = false;

    return {
        fixtureDef,
        bodyDef,
    };
}