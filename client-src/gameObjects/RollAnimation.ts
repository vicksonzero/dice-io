import { b2Vec2 } from '@flyover/box2d';
import * as Debug from 'debug';
import { DiceData, DiceSide, DiceType, RollsStats, Suit } from '../../model/Dice';
import { AttackHappenedMessage } from '../../model/EventsFromServer';
import { MainScene } from '../scenes/MainScene';
import { DiceSprite } from './DiceSprite';


const log = Debug('dice-io:DiceSprite:log');
// const warn = Debug('dice-io:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type GameObject = Phaser.GameObjects.GameObject;
type Container = Phaser.GameObjects.Container;
type Text = Phaser.GameObjects.Text;
type Graphics = Phaser.GameObjects.Graphics;

export class RollAnimation extends Phaser.GameObjects.Container {
    // entity
    scene: MainScene;

    attackMessage: AttackHappenedMessage;

    // sprites
    debugText: Text;

    // debug
    _debugShowEntityId = false;
    diceSprite: Phaser.GameObjects.Image | null;
    diceGraphics: Phaser.GameObjects.Graphics | null;
    suitSprite: Phaser.GameObjects.Image;

    constructor(scene: MainScene, attackMessage: AttackHappenedMessage) {
        super(scene, 0, 0, []);
        this.attackMessage = attackMessage;
        this.setName('roll-animation');
    }

    updateDice() {
        const {
            untilTick,
            result,
            playerAPos, displacementAB,
            playerAId, playerBId,
            netDamageA, netDamageB,
            rollsA, rollsB,
            transferredIndex,
        } = this.attackMessage;

        const playerA = this.scene.entityList[playerAId];
        const playerB = this.scene.entityList[playerBId];

        debugger;
        const sortedRollsA = rollsA.map((roll, i) => [
            i,
            Object.values(Suit).indexOf(RollsStats.getRollSuit(roll)),
        ]);
        sortedRollsA.sort(([_, a], [_2, b]) => (a - b));
        const sortedRollsB = rollsB.map((roll, i) => [
            i,
            Object.values(Suit).indexOf(RollsStats.getRollSuit(roll)),
        ]);
        sortedRollsB.sort(([_, a], [_2, b]) => (a - b));

        this.add([
            // this.scene.make.image({
            //     x: 0, y: 0,
            //     key: 'd6',
            // }).setScale(0.2).setTint(0),

            ...rollsA.map((roll, i) => {
                const { sideId, diceData } = roll;
                const { color } = diceData;
                const sortedIndex = sortedRollsA.findIndex(([index]) => index === i);
                const isTransferred = (result == 'B' && transferredIndex == i);
                const ownerId = isTransferred ? playerBId : playerAId;
                // const suit = RollsStats.getRollSuit(roll);
                const diceSprite = new DiceSprite(this.scene, diceData, sideId, ownerId, 0);
                diceSprite.isTransferred = isTransferred;
                diceSprite.setPosition(
                    40 * sortedIndex - ((rollsA.length - 1) * 40 / 2),
                    -20
                );

                diceSprite.setRotation(-this.rotation);
                diceSprite.setScale(0);
                diceSprite.setVisible(false);

                console.log('hi');
                this.scene.fixedTime.addEvent({
                    delay: 50,
                    callback: () => {
                        diceSprite.setVisible(true);
                        const pos = this.getLocalPoint(playerA.x, playerA.y);
                        this.scene.add.tween({
                            targets: diceSprite,
                            x: { from: pos.x, to: diceSprite.x },
                            y: { from: pos.y, to: diceSprite.y },
                            scale: { from: 0.3, to: 0.6 },
                            ease: 'Cubic', // 'Cubic', 'Elastic', 'Bounce', 'Back'
                            duration: 500,
                            repeat: 0, // -1: infinity
                            yoyo: false
                        });
                    },
                });

                return diceSprite;
            }),
            ...rollsB.map((roll, i) => {
                const { sideId, diceData } = roll;
                const { color } = diceData;
                const sortedIndex = sortedRollsB.findIndex(([index]) => index === i);
                const isTransferred = (result == 'A' && transferredIndex == i);
                const ownerId = isTransferred ? playerAId : playerBId;
                // const suit = RollsStats.getRollSuit(roll);
                const diceSprite = new DiceSprite(this.scene, diceData, sideId, ownerId, 0);
                diceSprite.setPosition(
                    40 * sortedIndex - ((rollsB.length - 1) * 40 / 2),
                    20
                );

                diceSprite.setRotation(-this.rotation);
                diceSprite.setScale(0);
                diceSprite.setVisible(false);

                this.scene.fixedTime.addEvent({
                    delay: 50,
                    callback: () => {
                        diceSprite.setVisible(true);
                        const pos = this.getLocalPoint(playerB.x, playerB.y);
                        this.scene.add.tween({
                            targets: diceSprite,
                            x: { from: pos.x, to: diceSprite.x },
                            y: { from: pos.y, to: diceSprite.y },
                            scale: { from: 0.3, to: 0.6 },
                            ease: 'Cubic', // 'Cubic', 'Elastic', 'Bounce', 'Back'
                            duration: 500,
                            repeat: 0, // -1: infinity
                            yoyo: false
                        });
                    },
                });

                return diceSprite;
            }),
        ]);

    }

    init(): this {

        return this;
    }

    update(time: number, dt: number) {
        const timeTillEnd = this.attackMessage.untilTick - Date.now();
        if (timeTillEnd > 2000) {
            // entry animation still playing, do nothing
        } else if (timeTillEnd > 0) {
        } else {
            this.destroy();
            return;
        }

        for (const dice of this.list) {
            if (dice instanceof DiceSprite) {
                const isTransferred = dice.isTransferred;
                const animationLength = dice.isTransferred ? 1000 : 2000;

                if (timeTillEnd > animationLength) {
                    continue;
                }
                const ownerPlayer = this.scene.entityList[dice.playerEntityId];
                if (!!ownerPlayer && ownerPlayer.active) {
                    const pos = this.getLocalPoint(ownerPlayer.x, ownerPlayer.y);
                    const dir = new b2Vec2(
                        pos.x - dice.x,
                        pos.y - dice.y
                    );
                    const dist = dir.Length();
                    const speed = dist / (timeTillEnd / 100);
                    dir.SelfNormalize().SelfMul(speed);
                    dice.x += dir.x;
                    dice.y += dir.y;
                    dice.setScale((timeTillEnd / animationLength) * 0.3 + 0.3);
                    dice.setAlpha((timeTillEnd / animationLength) * 0.9 + 0.1);
                }
                // dice.setVisible(!dice.visible);
            }
        }
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }
}
