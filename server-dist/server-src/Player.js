"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const Player_1 = require("../model/Player");
const UniqueID_1 = require("../model/UniqueID");
const box2d_1 = require("@flyover/box2d");
const constants_js_1 = require("./constants.js");
class Player {
    constructor() {
        this.socketId = '';
        this.nextMoveTick = 0;
        this.sync = {
            lastReceived: 0,
            lastUpdated: 0,
        };
        this.name = 'Player';
        this.color = 0xffffff;
        this.isHuman = false;
        this.isControlling = false;
        // physics
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.r = 0;
        this.friction = 0;
        this.vx = 0;
        this.vy = 0;
        this.diceList = [];
        this.entityId = (0, UniqueID_1.getUniqueID)();
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
    createPhysics(physicsSystem, physicsFinishedCallback) {
        const { fixtureDef, bodyDef } = (0, Player_1.getPhysicsDefinitions)(this.r);
        this.fixtureDef = fixtureDef;
        this.bodyDef = bodyDef;
        bodyDef.userData = {
            label: 'player',
            gameObject: this,
        };
        physicsSystem.scheduleCreateBody((world) => {
            this.b2Body = world.CreateBody(bodyDef);
            this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
            this.b2Body.SetPositionXY(this.x * constants_js_1.PIXEL_TO_METER, this.y * constants_js_1.PIXEL_TO_METER);
            // this.on('destroy', () => {
            //     physicsSystem.scheduleDestroyBody(this.b2Body);
            //     this.b2Body.m_userData.gameObject = null;
            // });
            physicsFinishedCallback === null || physicsFinishedCallback === void 0 ? void 0 : physicsFinishedCallback();
        });
    }
    applyDashImpulse(dashVector) {
        if (this.b2Body == null)
            return;
        const pos = this.b2Body.GetPosition();
        const v = new box2d_1.b2Vec2(dashVector.x, dashVector.y);
        v.SelfMul(constants_js_1.PIXEL_TO_METER);
        this.b2Body.ApplyLinearImpulse(v, { x: pos.x, y: pos.y }, true);
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map