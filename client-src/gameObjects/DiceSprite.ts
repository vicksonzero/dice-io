import * as Debug from 'debug';
import { MainScene } from '../scenes/MainScene';


const log = Debug('dice-io:DiceSprite:log');
// const warn = Debug('dice-io:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type GameObject = Phaser.GameObjects.GameObject;
type Container = Phaser.GameObjects.Container;
type Text = Phaser.GameObjects.Text;
type Graphics = Phaser.GameObjects.Graphics;

export class DiceSprite extends Phaser.GameObjects.Container {
    // entity
    scene: MainScene;

    playerEntityId: number;
    diceSlotId: number;

    // player info
    diceColor: number;
    suit: string;
    suitColor: number = 0x444444;

    // sprites
    debugText: Text;

    // debug
    _debugShowEntityId = false;
    diceSprite: Phaser.GameObjects.Image;
    suitSprite: Phaser.GameObjects.Image;

    constructor(scene: MainScene, diceColor: number, suit: string, playerEntityId: number, diceSlotId: number) {
        super(scene, 0, 0, []);
        this.playerEntityId = playerEntityId;
        this.diceSlotId = diceSlotId;
        this.diceColor = diceColor;
        this.suit = suit;
        this.setName('player');
        this.createSprite();
    }
    createSprite() {
        this.add([
            this.diceSprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'd6',
            }, false),
            this.suitSprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'd6',
            }, false),
        ]);
        this.suitSprite.setScale(0.7);
        this.updateDice(this.diceColor, this.suit, this.suitColor);
    }

    updateDice(diceColor: number, suit: string, suitColor: number = 0x444444) {
        this.diceColor = diceColor;
        this.suit = suit;
        this.suitColor = suitColor;
        this.diceSprite.setTint(this.diceColor);
        this.suitSprite.setTint(this.suitColor);

        const key = {
            " ": '', //  =Blank
            "S": 'sword', // S=Sword
            "H": 'shield', // H=Shield
            "M": 'structure_tower', // M=Morale
            "B": 'book_open', // B=Book
            "V": 'skull', // V=Venom
            "F": 'fastForward', // F=Fast
        }[this.suit];
        if (key == null) throw new Error(`key ${key} is an unknown dice suit`);
        this.suitSprite.setTexture(key);
        this.suitSprite.setVisible(this.suit != ' ');

    }

    init(): this {

        return this;
    }

    initPhysics(physicsFinishedCallback?: () => void): this {
        // const { fixtureDef, bodyDef } = getPhysicsDefinitions(this.r * PIXEL_TO_METER);

        // this.fixtureDef = fixtureDef;

        // this.bodyDef = bodyDef;
        // bodyDef.userData = {
        //     label: 'player',
        //     gameObject: this,
        // };

        // this.scene.getPhysicsSystem().scheduleCreateBody((world: b2World) => {
        //     // this.b2Body = world.CreateBody(bodyDef);
        //     // this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
        //     // this.b2Body.SetPositionXY(this.x * PIXEL_TO_METER, this.y * PIXEL_TO_METER);

        //     // this.on('destroy', () => {
        //     //     physicsSystem.scheduleDestroyBody(this.b2Body);
        //     //     this.b2Body.m_userData.gameObject = null;
        //     // });
        //     physicsFinishedCallback?.();
        // });

        return this;
    }

    fixedUpdate(time: number, dt: number) {
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }
}
