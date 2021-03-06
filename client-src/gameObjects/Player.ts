import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2Fixture, b2FixtureDef, b2World } from '@flyover/box2d';
import * as Debug from 'debug';
import { PIXEL_TO_METER, SMOOTH_CAP, SMOOTH_FACTOR } from '../constants';
import { IBodyUserData, IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../../model/UniqueID';
import { config } from '../config/config';
import { PlayerState } from '../../model/EventsFromServer';
import { getPhysicsDefinitions } from '../../model/Player';
import { DiceSprite } from './DiceSprite';


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
    nextCanShoot: number = 0;

    // sprites
    debugText: Text;
    nameTag: Text;
    debugRemoteDot: Graphics;
    debugExtrapolatedDot: Graphics;
    bodySprite: Image;
    diceContainer: Container;

    fixtureDef?: b2FixtureDef;
    bodyDef?: b2BodyDef;
    b2Body?: b2Body;

    // debug
    _debugShowEntityId = false;

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
            this.diceContainer = this.scene.make.container({
                x: 0, y: 0,
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
        const { entityId, x, y, angle, r, name, color, diceList, nextCanShoot, isHuman, isCtrl: isControlling } = state;
        this.entityId = entityId;
        this.setPosition(x, y);
        this.r = r;
        if (color) {
            this.tint = color;
            this.bodySprite.setTint(this.tint);
        }

        this.isControlling = (isControlling == null ? this.isControlling : isControlling);
        this.setName(`Player ${name} ${this.isControlling ? '(Me)' : ''}`);

        this.diceContainer.setVisible(Date.now() >= nextCanShoot);
        this.bodySprite.setAngle(angle);
        return this;
    }

    initPhysics(physicsFinishedCallback?: () => void): this {
        const { fixtureDef, bodyDef } = getPhysicsDefinitions(this.r * PIXEL_TO_METER);

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
        this.bodySprite.setAngle(
            (this.bodySprite.angle * (1 - SMOOTH_FACTOR)) + ((angle + vAngle * dt) * SMOOTH_FACTOR)
        ); // TODO: lerp instead of set

        this.b2Body?.SetLinearVelocity({ x: vx, y: vy });


        this.diceContainer.setAngle(this.diceContainer.angle + 1);

        for (const diceSprite of this.diceContainer.list) {
            (diceSprite as Image).setAngle((diceSprite as Image).angle - 2);
        }


        this.debugText.setText(this.isControlling ? `(${x.toFixed(1)}, ${y.toFixed(1)})` : '');
        this.debugRemoteDot.setPosition(x - this.x, y - this.y);
        // console.log(smoothX, );

        this.debugExtrapolatedDot.setPosition(smoothX - this.x, smoothY - this.y);
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }

    applyState(state: PlayerState, dt: number, isSmooth = true) {
        const {
            x, y,
            vx, vy,
            angle, vAngle,
            r,
            name, color,
            diceList,
            isHuman, isCtrl,
            nextCanShoot,
        } = state;


        this.syncData = {
            dt,
            x, y,
            vx, vy,
            angle, vAngle,
        };

        if (!isSmooth) {
            this.x = x;
            this.y = y;
        } else {
            const referenceSpeed = Math.max(Math.abs(vx), Math.abs(vy));
            const smoothFactor = Math.min(1, SMOOTH_FACTOR * (referenceSpeed < 1 ? 2 : 1));
            const smoothX = (this.x * (1 - smoothFactor)) + ((x + vx * dt) * smoothFactor);
            const smoothY = (this.y * (1 - smoothFactor)) + ((y + vy * dt) * smoothFactor);
            this.setPosition(
                this.x + Math.max(-SMOOTH_CAP, Math.min(smoothX - this.x, SMOOTH_CAP)),
                this.y + Math.max(-SMOOTH_CAP, Math.min(smoothY - this.y, SMOOTH_CAP)),
            ); // TODO: lerp instead of set

            this.debugRemoteDot.setPosition(x - this.x, y - this.y);
            this.debugExtrapolatedDot.setPosition(smoothX - this.x, smoothY - this.y);
        }
        this.bodySprite.setAngle(
            (this.bodySprite.angle * (1 - SMOOTH_FACTOR)) + ((angle + vAngle * dt) * SMOOTH_FACTOR)
        ); // TODO: lerp instead of set

        if (color) {
            this.tint = color;
            this.bodySprite.setTint(this.tint);
        }

        this.isControlling = (isCtrl == null ? this.isControlling : isCtrl);
        this.setName(name);

        this.diceContainer.setVisible(Date.now() >= nextCanShoot);

        const entityIdStr = this._debugShowEntityId ? ` (${this.entityId})` : ``;
        this.nameTag.setText(`${name}${entityIdStr}`);
        this.b2Body?.SetLinearVelocity({ x: vx, y: vy });

        // console.log(diceColors);

        if (isSmooth) {
            diceList.forEach((diceState, i) => {
                const { diceData, diceEnabled, sideId } = diceState;
                let diceSprite: DiceSprite = this.diceContainer.list[i] as DiceSprite;
                if (diceSprite == null) {
                    this.diceContainer.add([
                        diceSprite = new DiceSprite(this.scene, diceData, -1, this.entityId, i)
                    ]);
                    diceSprite.setScale(0.3);
                }

                (diceSprite
                    .setDiceData(diceData)
                    .setDiceEnabled(diceEnabled)
                    .updateDice()
                );
            });
        }

        const increment = 2 * Math.PI / diceList.length;
        const radius = 32;
        // if (isSmooth) console.log(`reflow ${this.name}, ${diceList.length}`);

        this.diceContainer.list.forEach((diceSprite, i) => {
            if (i >= diceList.length) {
                (diceSprite as DiceSprite).setVisible(false);
                return;
            }
            (diceSprite as DiceSprite).setVisible(true);

            (diceSprite as DiceSprite).setPosition(
                Math.cos(increment * i) * radius,
                Math.sin(increment * i) * radius,
            );
        });

        this.debugText.setText(this.isControlling
            ? `(${x.toFixed(1)}, ${y.toFixed(1)})`
            : ''
        );
    }

    getSlotGameObjectById(slotId: number) {
        return this.diceContainer.list[slotId] as DiceSprite|null;
    }
}
