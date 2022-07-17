import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2Fixture, b2FixtureDef, b2World } from '@flyover/box2d';
import * as Debug from 'debug';
import { PIXEL_TO_METER } from '../constants';
import { IBodyUserData, IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../../model/UniqueID';
import { capitalize } from '../utils/utils';
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
    bodySprite: Image;

    fixtureDef?: b2FixtureDef;
    bodyDef?: b2BodyDef;
    b2Body?: b2Body;

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this
            .setName('player')
            ;
        this.createSprite();
    }
    createSprite() {
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'character',
            }, false),
            this.debugText = this.scene.make.text({
                x: 0, y: 0,
                text: '',
                style: { align: 'left' }
            }),
        ]);
        this.bodySprite.setTint(this.tint);
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

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }

    applyState(state: PlayerState) {
        const {
            x, y,
            vx, vy,
            angle, r,
            name, color,
            diceCount,
            isHuman, isCtrl } = state;

        this.setPosition(x, y); // TODO: lerp instead of set
        this.setAngle(angle); // TODO: lerp instead of set

        if (color) {
            this.tint = color;
            this.bodySprite.setTint(this.tint);
        }

        this.isControlling = (isCtrl == null ? this.isControlling : isCtrl);
        this.setName(`Player ${name} ${this.isControlling ? '(Me)' : ''}`);
        this.b2Body?.SetLinearVelocity({ x: vx, y: vy });
    }
}
