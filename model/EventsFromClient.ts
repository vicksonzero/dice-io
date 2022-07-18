import { XY } from "@flyover/box2d";

export type StartMessage = {
    name: string;
}

export type DashMessage = {
    dashVector: XY;
}


export type DebugInspectMessage = {
    cmd: string;
}
