import {
    b2Contact, b2ContactImpulse, b2ContactListener,
    b2Fixture, b2Manifold,
    b2ParticleBodyContact, b2ParticleContact, b2ParticleSystem,
    b2Shape
} from '@flyover/box2d';
import * as Debug from 'debug';
import "phaser";
import { GameObjects } from 'phaser';
import { preload as _assets_preload, setUpAudio as _assets_setUpAudio } from '../assets';
import { config, ItemType } from '../config/config';
import {
    BASE_LINE_WIDTH, BULLET_SPEED,
    DEBUG_DISABLE_SPAWNING, DEBUG_PHYSICS,
    PHYSICS_FRAME_SIZE, PHYSICS_MAX_FRAME_CATCHUP, PIXEL_TO_METER,
    PLAYER_MOVE_SPEED,
    SPAWN_DELAY, SPAWN_INTERVAL,
    WORLD_WIDTH, WORLD_HEIGHT,
    CAMERA_WIDTH, CAMERA_HEIGHT,
    WS_URL,
} from '../constants';
// import { Immutable } from '../utils/ImmutableType';
import { Player } from '../gameObjects/Player';
import { IBodyUserData, IFixtureUserData, PhysicsSystem } from '../PhysicsSystem';
import { DistanceMatrix } from '../../utils/DistanceMatrix';
// import { GameObjects } from 'phaser';
import { capitalize, lerpRadians } from '../../utils/utils';
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { AttackHappenedMessage, PlayerState, StateMessage } from '../../model/EventsFromServer';
import { StartMessage } from '../../model/EventsFromClient';

import { Dice } from '../../server-src/Dice'; // FIXME: totally wrong usage


type BaseSound = Phaser.Sound.BaseSound;
type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;
type Graphics = Phaser.GameObjects.Graphics;
type Image = Phaser.GameObjects.Image;
type Text = Phaser.GameObjects.Text;

const Vector2 = Phaser.Math.Vector2;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const verbose = Debug('dice-io:MainScene:verbose');
const log = Debug('dice-io:MainScene:log');
// const warn = Debug('dice-io:MainScene:warn');
// warn.log = console.warn.bind(console);

export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {
    socket: Socket;
    controlsList: Controls[];

    isGameOver: boolean;
    bg: Phaser.GameObjects.TileSprite;

    // timing
    fixedTime: Phaser.Time.Clock;
    fixedElapsedTime: number;
    frameSize = PHYSICS_FRAME_SIZE; // ms
    lastUpdate = -1;
    lastUpdateTick = 0;

    entityList: { [x: number]: Player } = {};

    backgroundUILayer: Container;
    factoryLayer: Container;
    itemLayer: Container;
    tankLayer: Container;
    playerLayer: Container;
    effectsLayer: Container;
    uiLayer: Container;
    physicsDebugLayer: Graphics;
    manualLayer: Container;

    btn_mute: Image;

    mainPlayer?: Player;

    // sfx_shoot: BaseSound;
    // sfx_hit: BaseSound;
    // sfx_navigate: BaseSound;
    // sfx_point: BaseSound;
    // sfx_open: BaseSound;
    // sfx_bgm: BaseSound;

    startButton: HTMLDivElement;
    startForm: HTMLFormElement;

    get mainCamera() { return this.sys.cameras.main; }

    constructor() {
        super({
            key: "MainScene",
        })
    }

    preload() {
        log('preload');
        _assets_preload.call(this);
    }

    initSocket() {
        this.socket = io(WS_URL, {
            reconnectionDelayMax: 10000,
            // auth: {
            //     token: "123"
            // },
            // query: {
            //     "my-key": "my-value"
            // }
        });

        this.socket.on("connect", () => {
            console.log(`Socket connected. id is ${this.socket.id}`);
        });
        this.socket.on("disconnect", () => {
            console.log(`Socket disconnected`);
        });
        this.socket.on('welcome', (playerStateList?: StateMessage) => {
            console.log(`Socket welcome`);
            this.input.keyboard.enabled = true;
            this.input.keyboard.enableGlobalCapture();

            this.startForm.style.display = 'none';

            if (playerStateList) this.handlePlayerStateList(playerStateList);

            this.socket.emit('dash', { dashVector: { x: 10, y: 1 } });
            (window as any).socketT = this.socket;
        });
        this.socket.on("state", (playerStateList: StateMessage) => {
            const entityIdList = playerStateList.state.map(p => p.entityId).join(', ');
            console.log(`Socket state (${playerStateList.state.length}) [${entityIdList}]`);
            this.handlePlayerStateList(playerStateList);
        });
        this.socket.on("fight", (message: AttackHappenedMessage) => {
            const {
                untilTick,
                result,
                playerAId, playerBId,
                diceColorsA, diceColorsB,
                rollsSuitA, rollsSuitB,
                netDamageA, netDamageB,
                transferredIndex,
            } = message;

            const msg = [`fight: \n`,
                `${playerAId}(${rollsSuitA.join('')}, ${netDamageA}dmg)\n`,
                ` vs \n` +
                `${playerBId}(${rollsSuitB.join('')}, ${netDamageB}dmg)\n`,
                `result=${result})`
            ].join('');
            console.log(msg);

            const playerA = this.entityList[playerAId];
            const playerB = this.entityList[playerBId];

            // const msgLabel = this.add.text(0, 0, msg, { align: 'center', color: '#000' });
            // this.effectsLayer.add(msgLabel);
            // msgLabel.setPosition(
            //     (playerA.x + playerB.x) / 2,
            //     (playerA.y + playerB.y) / 2,
            // );
            // msgLabel.setName('score-label');
            // msgLabel.setOrigin(0.5);
            const msgLabel = this.add.container(
                (playerA.x + playerB.x) / 2,
                (playerA.y + playerB.y) / 2,
            );
            this.effectsLayer.add(msgLabel);
            msgLabel.setName('score-label');

            msgLabel.add([
                ...diceColorsA.map((color, i) => {
                    const diceSprite = this.make.image({
                        x: -20, y: 40 * i,
                        key: 'd6',
                    });

                    diceSprite.setScale(0.6);
                    diceSprite.setTint(color);

                    return diceSprite;
                }),
                ...rollsSuitA.filter(suit => suit != ' ').map((suit: string, i) => {
                    const key = {
                        " ": 0, //  =Blank
                        "S": 'sword', // S=Sword
                        "H": 'shield', // H=Shield
                        "M": 'structure_tower', // M=Morale
                        "B": 'book_open', // B=Book
                        "V": 'skull', // V=Venom
                        "F": 'fastForward', // F=Fast
                    }[suit];
                    const diceSprite = this.make.image({
                        x: -20, y: 40 * i,
                        key,
                    });

                    diceSprite.setScale(0.4);
                    diceSprite.setTint(0x444444);

                    return diceSprite;
                }),
                ...diceColorsB.map((color, i) => {
                    const diceSprite = this.make.image({
                        x: 20, y: 40 * i,
                        key: 'd6',
                    });

                    diceSprite.setScale(0.6);
                    diceSprite.setTint(color);

                    return diceSprite;
                }),
                ...rollsSuitB.filter(suit => suit != ' ').map((suit: string, i) => {
                    const key = {
                        " ": 0, //  =Blank
                        "S": 'sword', // S=Sword
                        "H": 'shield', // H=Shield
                        "M": 'structure_tower', // M=Morale
                        "B": 'book_open', // B=Book
                        "V": 'skull', // V=Venom
                        "F": 'fastForward', // F=Fast
                    }[suit];
                    const diceSprite = this.make.image({
                        x: 20, y: 40 * i,
                        key,
                    });

                    diceSprite.setScale(0.4);
                    diceSprite.setTint(0x444444);

                    return diceSprite;
                }),
            ]);


        });

        this.socket.onAny((event, ...args) => {
            if (event == 'state') return;
            console.log(`event ${event}`, ...args);
        });
    }

    create(): void {
        this.initSocket();
        _assets_setUpAudio.call(this);
        log('create');
        this.mainCamera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.fixedTime = new Phaser.Time.Clock(this);
        this.fixedElapsedTime = 0;
        // this.getPhysicsSystem().init(this as b2ContactListener);
        this.isGameOver = false;
        this.bg = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'allSprites_default', 'tileGrass1');
        this.bg.setOrigin(0, 0);
        this.bg.setAlpha(0.7);

        this.backgroundUILayer = this.add.container(0, 0);
        this.factoryLayer = this.add.container(0, 0);
        this.itemLayer = this.add.container(0, 0);
        this.tankLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);
        this.uiLayer = this.add.container(0, 0);
        this.physicsDebugLayer = this.add.graphics({ lineStyle: { color: 0x000000, width: 1, alpha: 1 } });
        this.uiLayer.add(this.physicsDebugLayer);
        this.manualLayer = this.add.container(0, 0);



        // this.fixedTime.addEvent({
        //     delay: SPAWN_DELAY,
        //     callback: () => {
        //         this.sfx_bgm.play();
        //     },
        //     loop: false,
        // });

        this.setUpGUI();
        // this.setUpTutorial();
        this.setUpKeyboard();
        this.input.keyboard.enabled = false;
        this.input.keyboard.disableGlobalCapture();
        log('create complete');
    }

    update(time: number, dt: number) {
        // verbose(`update ${time}`);

        const lastGameTime = this.lastUpdate;
        // log(`update (from ${lastGameTime} to ${gameTime})`);

        if (this.lastUpdate === -1) {
            this.lastUpdate = time;

            // seconds
            this.fixedElapsedTime += this.frameSize;
            this.fixedUpdate(this.fixedElapsedTime, this.frameSize);
        } else {
            let i = 0;
            while (this.lastUpdate + this.frameSize < time && i < PHYSICS_MAX_FRAME_CATCHUP) {
                i++;

                this.fixedElapsedTime += this.frameSize;
                this.fixedUpdate(this.fixedElapsedTime, this.frameSize);
                this.lastUpdate += this.frameSize;
            }
            this.lastUpdate = time;

            // verbose(`update: ${i} fixedUpdate-ticks at ${time.toFixed(3)} (from ${lastGameTime.toFixed(3)} to ${this.lastUpdate.toFixed(3)})`);
        }
    }

    fixedUpdate(fixedTime: number, frameSize: number) {
        const timeStep = 1000 / frameSize;
        // verbose(`fixedUpdate start`);

        this.fixedTime.preUpdate(fixedTime, frameSize);
        this.getPhysicsSystem().update(
            timeStep,
            (DEBUG_PHYSICS ? this.physicsDebugLayer : undefined)
        );
        // this.distanceMatrix.init([this.bluePlayer, this.redPlayer, ...this.blueAi, ...this.redAi, ...this.items]);
        this.updatePlayers(fixedTime, frameSize);
        for (const child of this.effectsLayer.list) {
            if (child.name == 'score-label') {
                (child as any).setAlpha((child as any).alpha - 0.001);
                if ((child as any).alpha <= 0.02) {
                    child.destroy();
                }
            }
        }


        this.fixedTime.update(fixedTime, frameSize);
        this.lateUpdate(fixedTime, frameSize);
        // verbose(`fixedUpdate complete`);
    }

    lateUpdate(fixedTime: number, frameSize: number) {
    }

    setUpKeyboard() {
        this.controlsList = [
            {
                up: this.input.keyboard.addKey(KeyCodes.W),
                down: this.input.keyboard.addKey(KeyCodes.S),
                left: this.input.keyboard.addKey(KeyCodes.A),
                right: this.input.keyboard.addKey(KeyCodes.D),
                action: this.input.keyboard.addKey(KeyCodes.C),
            },
            {
                up: this.input.keyboard.addKey(KeyCodes.UP),
                down: this.input.keyboard.addKey(KeyCodes.DOWN),
                left: this.input.keyboard.addKey(KeyCodes.LEFT),
                right: this.input.keyboard.addKey(KeyCodes.RIGHT),
                action: this.input.keyboard.addKey(KeyCodes.FORWARD_SLASH),
            }
        ];
        this.controlsList[0].action.on('down', (evt: any) => {
        });
        this.controlsList[1].action.on('down', (evt: any) => {
        });
    }

    setUpGUI() {
        this.startForm = document.querySelector('#start .form')!;
        this.startButton = document.querySelector('#start-game')!;
        const submitNameToServer = () => {
            const name = (document.querySelector('input#player-name')! as HTMLInputElement).value;
            this.socket.emit('start', { name } as StartMessage);
        };

        this.startButton.onclick = submitNameToServer;
        this.startForm.onsubmit = (evt) => {
            evt.preventDefault();
            submitNameToServer();
        };


        const clickRect = this.add.graphics();
        clickRect.fillStyle(0xFFFFFF, 0.1);
        clickRect.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.uiLayer.setScrollFactor(0);
        this.uiLayer.add([
            clickRect,
        ]);


        clickRect.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            draggable: false,
            dropZone: false,
            useHandCursor: false,
            cursor: 'pointer',
            pixelPerfect: false,
            alphaTolerance: 1
        })
            .on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: TouchEvent | MouseEvent) => {
                // ...
                // console.log('pointerdown');

            })
            .on('pointerup', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: TouchEvent | MouseEvent) => {
                // ...
                // console.log('pointerup', pointer.x, pointer.y);
                if (this.mainPlayer == null) return;

                const touchWorldPos = this.mainCamera.getWorldPoint(pointer.x, pointer.y);
                // console.log('pointerup', touchWorldPos.x, touchWorldPos.y);
                const dashVector = {
                    x: (touchWorldPos.x - this.mainPlayer.x) * 0.7,
                    y: (touchWorldPos.y - this.mainPlayer.y) * 0.7
                }
                // console.log('pointerup', dashVector);

                this.socket.emit('dash', { dashVector });
            });
    }

    setUpTutorial() {
        let image: Image;
        let text: Text;

        let y = 50;
        for (const [i, [diceName, def]] of Object.entries(Dice.diceDefinitions).entries()) {
            let x = 50;
            const { color, desc, sides } = def;
            text = this.make.text({
                x: x, y: y,
                text: diceName,
                style: { align: 'center', color: '#000' }
            });

            x += 100;

            for (const [j, suit] of sides.split('').entries()) {
                const posX = x + 40 * j;
                const posY = y;
                image = this.make.image({
                    x: posX, y: posY,
                    key: 'd6',
                });

                image.setScale(0.6);
                image.setTint(color);
                this.manualLayer.add(image);


                const key = {
                    " ": 0, //  =Blank
                    "S": 'sword', // S=Sword
                    "H": 'shield', // H=Shield
                    "M": 'structure_tower', // M=Morale
                    "B": 'book_open', // B=Book
                    "V": 'skull', // V=Venom
                    "F": 'fastForward', // F=Fast
                }[suit];

                if (key != ' ') {
                    image = this.make.image({
                        x: posX, y: posY,
                        key,
                    });

                    image.setScale(0.4);
                    image.setTint(0x444444);
                    this.manualLayer.add(image);
                }
            }

            y += 48;
        }
    }

    updatePlayers(fixedTime: number, frameSize: number) {
        for (const player of Object.values(this.entityList)) {

            player.fixedUpdate(fixedTime, frameSize);
        }
    }

    spawnPlayer(playerState: PlayerState) {
        const player = new Player(this);

        this.playerLayer.add(player);
        player.init(playerState).initPhysics();

        return player;
    }

    handlePlayerStateList(playerStateList: StateMessage) {
        const { tick, state } = playerStateList;

        const dt = (tick - this.lastUpdateTick) / 1000;
        for (const playerState of state) {
            const { entityId, isCtrl } = playerState;
            if (!this.entityList[entityId]) {
                const player = this.entityList[entityId] = this.spawnPlayer(playerState);
                if (player.isControlling) {
                    console.log(`Me: ${playerState.entityId}`);
                    this.mainPlayer = player;
                    this.mainCamera.startFollow(player, true, 0.2, 0.2);
                }
            } else {
                this.entityList[entityId].applyState(playerState, dt);

                // if (isCtrl) console.log('handlePlayerStateList', playerState);
            }
        }
        this.lastUpdateTick = tick;
    }


    addToList(gameObject: (GameObjects.Container & { uniqueID: number }), list: (GameObjects.Container & { uniqueID: number })[]) {
        list.push(gameObject);
        // this.instancesByID[gameObject.uniqueID] = gameObject;
        gameObject.on('destroy', () => {
            list.splice(list.indexOf(gameObject), 1);
            // delete this.instancesByID[gameObject.uniqueID];
        });
    }




    getPhysicsSystem() {
        return (this.registry.get('physicsSystem') as PhysicsSystem);
    }
}
