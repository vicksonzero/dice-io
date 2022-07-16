import { b2Contact, b2ContactImpulse, b2ContactListener, b2Fixture, b2Manifold, b2ParticleBodyContact, b2ParticleContact, b2ParticleSystem, b2Shape } from '@flyover/box2d';
import * as Debug from 'debug';
import "phaser";
import { GameObjects } from 'phaser';
import { preload as _assets_preload, setUpAudio as _assets_setUpAudio } from '../assets';
import { config, ItemType } from '../config/config';
import { BASE_LINE_WIDTH, BULLET_SPEED, DEBUG_DISABLE_SPAWNING, DEBUG_PHYSICS, PHYSICS_FRAME_SIZE, PHYSICS_MAX_FRAME_CATCHUP, PIXEL_TO_METER, PLAYER_MOVE_SPEED, SPAWN_DELAY, SPAWN_INTERVAL, TANK_CHASE_ITEM_RANGE, TANK_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
// import { Immutable } from '../utils/ImmutableType';
import { Player } from '../gameObjects/Player';
import { IBodyUserData, IFixtureUserData, PhysicsSystem } from '../PhysicsSystem';
import { DistanceMatrix } from '../utils/DistanceMatrix';
// import { GameObjects } from 'phaser';
import { capitalize, lerpRadians } from '../utils/utils';


type BaseSound = Phaser.Sound.BaseSound;
type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;
type Graphics = Phaser.GameObjects.Graphics;
type Image = Phaser.GameObjects.Image;

const Vector2 = Phaser.Math.Vector2;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const verbose = Debug('dice-io:MainScene:verbose');
const log = Debug('dice-io:MainScene:log');
// const warn = Debug('dice-io:MainScene:warn');
// warn.log = console.warn.bind(console);

export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];

    isGameOver: boolean;
    bg: Phaser.GameObjects.TileSprite;

    fixedTime: Phaser.Time.Clock;
    fixedElapsedTime: number;

    backgroundUILayer: Container;
    factoryLayer: Container;
    itemLayer: Container;
    tankLayer: Container;
    playerLayer: Container;
    effectsLayer: Container;
    uiLayer: Container;
    physicsDebugLayer: Graphics;

    btn_mute: Image;

    redPlayer: Player;

    // sfx_shoot: BaseSound;
    // sfx_hit: BaseSound;
    // sfx_navigate: BaseSound;
    // sfx_point: BaseSound;
    // sfx_open: BaseSound;
    // sfx_bgm: BaseSound;

    frameSize = PHYSICS_FRAME_SIZE; // ms
    lastUpdate = -1;
    distanceMatrix: DistanceMatrix;

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

    create(): void {
        _assets_setUpAudio.call(this);
        log('create');
        this.fixedTime = new Phaser.Time.Clock(this);
        this.fixedElapsedTime = 0;
        // this.getPhysicsSystem().init(this as b2ContactListener);
        this.distanceMatrix = new DistanceMatrix();
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



        // this.fixedTime.addEvent({
        //     delay: SPAWN_DELAY,
        //     callback: () => {
        //         this.sfx_bgm.play();
        //     },
        //     loop: false,
        // });

        this.setUpGUI();
        this.setUpKeyboard();
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
        this.updatePlayers();

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

    }

    updatePlayers() {


    }



    addToList(gameObject: (GameObjects.Container & { uniqueID: number }), list: (GameObjects.Container & { uniqueID: number })[]) {
        list.push(gameObject);
        // this.instancesByID[gameObject.uniqueID] = gameObject;
        gameObject.on('destroy', () => {
            list.splice(list.indexOf(gameObject), 1);
            // delete this.instancesByID[gameObject.uniqueID];
            this.distanceMatrix.removeTransform(gameObject);
        });
    }




    getPhysicsSystem() {
        return (this.registry.get('physicsSystem') as PhysicsSystem);
    }
}
