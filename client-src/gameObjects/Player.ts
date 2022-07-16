import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2Fixture, b2FixtureDef, b2World } from '@flyover/box2d';
import * as Debug from 'debug';
import { PIXEL_TO_METER } from '../constants';
import { IBodyUserData, IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../utils/UniqueID';
import { capitalize } from '../utils/utils';
import { config } from '../config/config';


const log = Debug('dice-io:Player:log');
// const warn = Debug('dice-io:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type GameObject = Phaser.GameObjects.GameObject;
type Container = Phaser.GameObjects.Container;
type Text = Phaser.GameObjects.Text;

export class Player extends Phaser.GameObjects.Container {

    scene: MainScene;
    uniqueID: number;

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this
            .setName('player')
            ;

    }
    init(x: number, y: number): this {
        this.setPosition(x, y);
        return this;
    }

    initPhysics(physicsFinishedCallback: () => void): this {

        return this;
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }

}
