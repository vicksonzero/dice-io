import { XY } from "@flyover/box2d";


export type StateMessage = Array<PlayerState>;

export type PlayerState = {
    entityId: number;
    x: number;
    y: number;
    angle: number; // in degrees
    r: number; // radius

    name?: string;
    color?: number;
    isHuman?: boolean;
    isCtrl?: boolean; // for the player receiving this state pack, is this Player themselves?
    nextMoveTick?: number;

    diceCount: number;
    vx: number,
    vy: number,
}

export type AttackHappenedMessage = {
    untilTick: number;
    attackerSocketId: string;
    defenderSocketId: string;
    attackerRolls: number[];
    defenderRolls: number[];
    attackerWins: boolean;
};