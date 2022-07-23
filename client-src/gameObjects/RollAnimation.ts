import { b2Vec2 } from '@flyover/box2d';
import * as Debug from 'debug';
import { DiceData, DiceSide, DiceState, DiceType, RollsStats, Suit } from '../../model/Dice';
import { AttackHappenedMessage } from '../../model/EventsFromServer';
import { MainScene } from '../scenes/MainScene';
import { DiceSprite } from './DiceSprite';
import { Player } from './Player';


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


    tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
    tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();

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


        const createDiceWithAnimation = (
            roll: DiceState, i: number,
            _rollsMe: DiceState[], _rollsThem: DiceState[],
            _playerMe: Player, _playerThem: Player,
            _sortedRollsMe: number[][],
            isLose: boolean,
            y: number
        ) => {
            const { sideId, diceData } = roll;
            const sortedIndex = _sortedRollsMe.findIndex(([index]) => index === i);
            const isTransferred = (isLose && transferredIndex == i);
            const ownerId = isTransferred ? _playerThem.entityId : _playerMe.entityId;
            const slotId = (isTransferred
                ? _rollsThem.length
                : (i - (isLose && i > transferredIndex ? 1 : 0))
            );
            const diceSprite = new DiceSprite(this.scene, diceData, sideId, ownerId, slotId);
            diceSprite.isTransferred = isTransferred;
            diceSprite.setPosition(
                40 * sortedIndex - ((_rollsMe.length - 1) * 40 / 2),
                y
            );

            diceSprite.setRotation(-this.rotation);
            diceSprite.setScale(0);
            diceSprite.setVisible(false);

            this.scene.fixedTime.addEvent({
                delay: 50,
                callback: () => {
                    diceSprite.setVisible(true);
                    const pos = this.getLocalPoint(_playerMe.x, _playerMe.y);
                    this.scene.add.tween({
                        targets: diceSprite,
                        x: { from: pos.x, to: diceSprite.x },
                        y: { from: pos.y, to: diceSprite.y },
                        scale: { from: 0.3, to: 0.6 },
                        ease: 'Cubic', // 'Cubic', 'Elastic', 'Bounce', 'Back'
                        duration: 500,
                        repeat: 0, // -1: infinity
                        yoyo: false,
                    });
                },
            });

            return diceSprite;
        }

        this.add([
            // this.scene.make.image({
            //     x: 0, y: 0,
            //     key: 'd6',
            // }).setScale(0.2).setTint(0),

            ...rollsA.map((roll, i) => createDiceWithAnimation(
                roll, i,
                rollsA, rollsB,
                playerA, playerB,
                sortedRollsA,
                result == 'B',
                -20
            )),
            ...rollsB.map((roll, i) => createDiceWithAnimation(
                roll, i,
                rollsB, rollsA,
                playerB, playerA,
                sortedRollsB,
                result == 'A',
                20
            )),
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

        console.log(`ownerPlayer.diceContainer.length`);
        for (const dice of this.list) {
            if (dice instanceof DiceSprite) {
                const begin = dice.isTransferred ? 1000 : 2000;
                const end = dice.isTransferred ? 0 : 1000;
                const animationLength = begin - end;

                if (timeTillEnd > begin) {
                    continue;
                }
                const ownerPlayer = this.scene.entityList[dice.playerEntityId];
                if (!!ownerPlayer && ownerPlayer.active) {
                    console.log(ownerPlayer.diceContainer.length);

                    const slotGameObject = ownerPlayer.getSlotGameObjectById(dice.diceSlotId);
                    if (slotGameObject == null) {
                        dice.setVisible(false);
                        continue;
                    }
                    slotGameObject.getWorldTransformMatrix(this.tempMatrix, this.tempParentMatrix);
                    var globalPos = this.tempMatrix;

                    const pos = this.getLocalPoint(globalPos.tx, globalPos.ty);
                    const dir = new b2Vec2(
                        pos.x - dice.x,
                        pos.y - dice.y
                    );
                    const dist = dir.Length();
                    const speed = dist / Math.max(1, (timeTillEnd - end) / 100);
                    dir.SelfNormalize().SelfMul(speed);
                    dice.x += dir.x;
                    dice.y += dir.y;
                    dice.setScale(Math.max(0, (timeTillEnd - end) / animationLength) * 0.3 + 0.3);
                    // dice.setAlpha((timeTillEnd / animationLength) * 0.9 + 0.1);
                }
                // dice.setVisible(!dice.visible);
            }
        }
    }

    lateUpdate() {
        // this.hpBar.setPosition(this.x, this.y);
    }
}
