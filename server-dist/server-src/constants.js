"use strict";
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHYSICS_MAX_FRAME_CATCHUP = exports.PHYSICS_ALLOW_SLEEPING = exports.PHYSICS_FRAME_SIZE = exports.DEGREE_TO_RADIAN = exports.RADIAN_TO_DEGREE = exports.PIXEL_TO_METER = exports.METER_TO_PIXEL = exports.SPAWN_PADDING = exports.CAMERA_HEIGHT = exports.CAMERA_WIDTH = exports.WORLD_HEIGHT = exports.WORLD_WIDTH = exports.PORT_WS = exports.PORT_WSS = exports.USE_SSL = void 0;
exports.USE_SSL = process.env.USE_SSL == 'true';
exports.PORT_WSS = parseInt((_a = process.env.PORT_WSS) !== null && _a !== void 0 ? _a : '443', 10);
exports.PORT_WS = parseInt((_b = process.env.PORT_WS) !== null && _b !== void 0 ? _b : '3000', 10);
exports.WORLD_WIDTH = parseInt((_c = process.env.WORLD_WIDTH) !== null && _c !== void 0 ? _c : '2000', 10);
exports.WORLD_HEIGHT = parseInt((_d = process.env.WORLD_HEIGHT) !== null && _d !== void 0 ? _d : '2000', 10);
exports.CAMERA_WIDTH = parseInt((_e = process.env.CAMERA_WIDTH) !== null && _e !== void 0 ? _e : '400', 10);
exports.CAMERA_HEIGHT = parseInt((_f = process.env.CAMERA_HEIGHT) !== null && _f !== void 0 ? _f : '640', 10);
exports.SPAWN_PADDING = parseInt((_g = process.env.SPAWN_PADDING) !== null && _g !== void 0 ? _g : '30', 10);
exports.METER_TO_PIXEL = 20; // pixel per meter
exports.PIXEL_TO_METER = 1 / exports.METER_TO_PIXEL; // meter per pixel
exports.RADIAN_TO_DEGREE = 180 / Math.PI;
exports.DEGREE_TO_RADIAN = 1 / exports.RADIAN_TO_DEGREE;
// physics
exports.PHYSICS_FRAME_SIZE = 16; // ms
exports.PHYSICS_ALLOW_SLEEPING = false; // default false
exports.PHYSICS_MAX_FRAME_CATCHUP = 100; // times, default 10 times (10*16 = 160ms)
//# sourceMappingURL=constants.js.map