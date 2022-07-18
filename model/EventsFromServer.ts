import { XY } from "@flyover/box2d";


export type StateMessage = {
    tick: number;
    state: Array<PlayerState>
};

export type PlayerState = {
    entityId: number;
    x: number;
    y: number;
    angle: number; // in degrees
    r: number; // radius

    name: string;
    color?: number;
    isHuman?: boolean;
    isCtrl?: boolean; // for the player receiving this state pack, is this Player themselves?
    nextMoveTick?: number;
    nextCanShoot: number;

    diceColors: number[];
    vx: number,
    vy: number,
    vAngle: number,
}


export type AttackHappenedMessage = {
    untilTick: number;
    result: 'A' | 'B' | 'DRAW';
    playerAPos: XY;
    displacementAB: XY;
    playerAId: number;
    playerBId: number;
    diceColorsA: number[],
    diceColorsB: number[],
    rollsSuitA: string[];
    rollsSuitB: string[];
    netDamageA: number;
    netDamageB: number;
    transferredIndex: number;
};



export type DebugInspectReturn = {
    msg: string;
    data?: any;
}