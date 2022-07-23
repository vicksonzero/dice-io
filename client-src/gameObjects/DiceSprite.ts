import * as Debug from 'debug';
import { DiceData, DiceSide, DiceType, Suit } from '../../model/Dice';
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

    isTransferred = false;
    playerEntityId: number;
    diceSlotId: number;

    diceData: DiceData = {
        icon: Suit._,
        type: DiceType.DICE,
        sides: '_',
        color: 0xb1c6c7,
        disabledColor: 0x4a5959,
        desc: 'Blank Dice',
    }
    // state
    diceEnabled = true;
    sideId = -1; // 0-5, -1 = use icon

    // sprites
    debugText: Text;

    // debug
    _debugShowEntityId = false;
    diceSprite: Phaser.GameObjects.Image | null;
    diceGraphics: Phaser.GameObjects.Graphics | null;
    suitSprite: Phaser.GameObjects.Image;

    constructor(scene: MainScene, diceData: DiceData, sideId: number, playerEntityId: number, diceSlotId: number) {
        super(scene, 0, 0, []);
        this.playerEntityId = playerEntityId;
        this.diceSlotId = diceSlotId;
        this.diceData = diceData;
        this.sideId = sideId;
        this.setName('player');
        this.createSprite();
    }
    createSprite() {
        this.add([
            this.diceSprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'd6',
            }, false),
            // this.diceGraphics = this.scene.make.graphics({
            //     x: 0, y: 0,
            // }),
            this.suitSprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'd6',
            }, false),
        ]);
        this.suitSprite.setScale(0.7);
        this.updateDice();
    }

    setDiceEnabled(val: boolean): this {
        this.diceEnabled = val;
        this.updateDice();
        return this;
    }

    setDiceData(diceData: DiceData): this {
        this.diceData = {
            ...this.diceData,
            ...diceData,
        };
        return this;
    }

    updateDice() {
        const color = (this.diceEnabled
            ? this.diceData.color
            : this.diceData.disabledColor
        );
        this.diceSprite?.setTint(color);
        this.diceGraphics?.clear();
        this.diceGraphics?.fillStyle(color, 1);

        const iconSize = 48;
        if (this.diceData.type === DiceType.DICE) {
            this.diceGraphics?.fillRoundedRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 6);
            this.diceSprite?.setTexture('d6');
        } else if (this.diceData.type === DiceType.BUFF) {
            this.diceGraphics?.fillCircle(0, 0, iconSize / 2);
            this.diceSprite?.setTexture('d2');
        }
        
        this.suitSprite.setTint(DiceSide.suitColor[this.diceData.type]);

        const suit = (this.diceData.type === DiceType.DICE && this.sideId >= 0
            ? this.diceData.sides[this.sideId] as Suit
            : this.diceData.icon
        );
        const key = DiceSide.spriteKey[suit];
        if (key == null) throw new Error(`key ${key} is an unknown dice suit`);
        this.suitSprite.setTexture(key);
        this.suitSprite.setVisible(suit != '_');

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
