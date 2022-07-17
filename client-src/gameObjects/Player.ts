import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2Fixture, b2FixtureDef, b2World } from '@flyover/box2d';
import * as Debug from 'debug';
import { PIXEL_TO_METER, SMOOTH_CAP, SMOOTH_FACTOR } from '../constants';
import { IBodyUserData, IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../../model/UniqueID';
import { config } from '../config/config';
import { PlayerState } from '../../model/EventsFromServer';
import { getPhysicsDefinitions } from '../../model/Player';


const log = Debug('dice-io:Player:log');
// const warn = Debug('dice-io:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type GameObject = Phaser.GameObjects.GameObject;
type Container = Phaser.GameObjects.Container;
type Text = Phaser.GameObjects.Text;
type Graphics = Phaser.GameObjects.Graphics;

export class Player extends Phaser.GameObjects.Container {
    // entity
    scene: MainScene;
    uniqueID: number;
    entityId: number;

    // player info
    tint: number;
    isControlling: boolean;
    r: number; // radius

    // sprites
    debugText: Text;
    nameTag: Text;
    debugRemoteDot: Graphics;
    debugExtrapolatedDot: Graphics;
    bodySprite: Image;

    fixtureDef?: b2FixtureDef;
    bodyDef?: b2BodyDef;
    b2Body?: b2Body;

    syncData = {
        dt: 0,
        x: 0, y: 0,
        vx: 0, vy: 0,
        angle: 0, vAngle: 0,
    };

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this.setName('player');
        this.createSprite();
    }
    createSprite() {
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'character',
            }, false),
            this.nameTag = this.scene.make.text({
                x: 0, y: -32,
                text: '',
                style: { align: 'center', color: '#000000' },
            }),
            this.debugText = this.scene.make.text({
                x: 32, y: -32,
                text: '',
                style: { align: 'left', color: '#000000' },
            }),
            this.debugRemoteDot = this.scene.make.graphics({
                x: 0, y: 0,
                fillStyle: {
                    color: 0xff8800,
                    alpha: 0.2
                },
            }),
            this.debugExtrapolatedDot = this.scene.make.graphics({
                x: 0, y: 0,
                lineStyle: {
                    width: 1,
                    color: 0xff00AA,
                    alpha: 0.2
                },
            }),
        ]);
        this.bodySprite.setTint(this.tint);

        this.nameTag.setOrigin(0.5, 1);

        this.debugRemoteDot.fillCircle(0, 0, 2);
        this.debugExtrapolatedDot.strokeCircle(0, 0, 4);
        this.debugRemoteDot.setVisible(false);
        this.debugExtrapolatedDot.setVisible(false);
    }

    init(state: PlayerState): this {
        const { entityId, x, y, angle, r, name, color, diceCount, isHuman, isCtrl: isControlling } = state;
        this.entityId = entityId;
        this.setPosition(x, y);
        this.r = r;
        if (color) {
            this.tint = color;
            this.bodySprite.setTint(this.tint);
        }

        this.isControlling = (isControlling == null ? this.isControlling : isControlling);
        this.setName(`Player ${name} ${this.isControlling ? '(Me)' : ''}`);

        this.setAngle(angle);
        return this;
    }

    initPhysics(physicsFinishedCallback?: () => void): this {
        const { fixtureDef, bodyDef } = getPhysicsDefinitions(this.r);

        this.fixtureDef = fixtureDef;

        this.bodyDef = bodyDef;
        bodyDef.userData = {
            label: 'player',
            gameObject: this,
        };

        this.scene.getPhysicsSystem().scheduleCreateBody((world: b2World) => {
            this.b2Body = world.CreateBody(bodyDef);
            this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
            this.b2Body.SetPositionXY(this.x * PIXEL_TO_METER, this.y * PIXEL_TO_METER);

            // this.on('destroy', () => {
            //     physicsSystem.scheduleDestroyBody(this.b2Body);
            //     this.b2Body.m_userData.gameObject = null;
            // });
            physicsFinishedCallback?.();
        });

        return this;
    }

    fixedUpdate(time: number, dt: number) {
        const {
            x, y,
            vx, vy,
            angle, vAngle,
        } = this.syncData;

        const referenceSpeed = Math.max(Math.abs(vx), Math.abs(vy));
        const smoothFactor = Math.min(1, SMOOTH_FACTOR * (referenceSpeed < 1 ? 2 : 1));
        const smoothX = (this.x * (1 - smoothFactor)) + ((x + vx * dt) * smoothFactor);
        const smoothY = (this.y * (1 - smoothFactor)) + ((y + vy * dt) * smoothFactor);

        const smoothCap = 1000;// SMOOTH_CAP;
        this.setPosition(
            this.x + Math.max(-smoothCap, Math.min(smoothX - this.x, smoothCap)),
            this.y + Math.max(-smoothCap, Math.min(smoothY - this.y, smoothCap)),
        ); // TODO: lerp instead of set
        this.setAngle(
            (this.angle * (1 - SMOOTH_FACTOR)) + ((angle + vAngle * dt) * SMOOTH_FACTOR)
        ); // TODO: lerp instead of set

        this.b2Body?.SetLinearVelocity({ x: vx, y: vy });


        this.debugText.setText(this.isControlling ? `(${x.toFixed(1)}, ${y.toFixed(1)})` : '');
        this.debugRemoteDot.setPosition(x - this.x, y - this.y);
        // console.log(smoothX, );

        this.debugExtrapolatedDot.setPosition(smoothX - this.x, smoothY - this.y);
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }

    applyState(state: PlayerState, dt: number) {
        const {
            x, y,
            vx, vy,
            angle, vAngle,
            r,
            name, color,
            diceCount,
            isHuman, isCtrl,
        } = state;


        this.syncData = {
            dt,
            x, y,
            vx, vy,
            angle, vAngle,
        };

        const referenceSpeed = Math.max(Math.abs(vx), Math.abs(vy));
        const smoothFactor = Math.min(1, SMOOTH_FACTOR * (referenceSpeed < 1 ? 2 : 1));
        const smoothX = (this.x * (1 - smoothFactor)) + ((x + vx * dt) * smoothFactor);
        const smoothY = (this.y * (1 - smoothFactor)) + ((y + vy * dt) * smoothFactor);
        this.setPosition(
            this.x + Math.max(-SMOOTH_CAP, Math.min(smoothX - this.x, SMOOTH_CAP)),
            this.y + Math.max(-SMOOTH_CAP, Math.min(smoothY - this.y, SMOOTH_CAP)),
        ); // TODO: lerp instead of set
        this.setAngle(
            (this.angle * (1 - SMOOTH_FACTOR)) + ((angle + vAngle * dt) * SMOOTH_FACTOR)
        ); // TODO: lerp instead of set

        if (color) {
            this.tint = color;
            this.bodySprite.setTint(this.tint);
        }

        this.isControlling = (isCtrl == null ? this.isControlling : isCtrl);
        this.setName(name);
        this.nameTag.setText(name);
        this.b2Body?.SetLinearVelocity({ x: vx, y: vy });


        this.debugText.setText(this.isControlling ? `(${x.toFixed(1)}, ${y.toFixed(1)})` : '');
        this.debugRemoteDot.setPosition(x - this.x, y - this.y);
        // console.log(smoothX, );

        this.debugExtrapolatedDot.setPosition(smoothX - this.x, smoothY - this.y);
    }
}
