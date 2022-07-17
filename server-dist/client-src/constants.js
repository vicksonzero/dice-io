"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_URL = exports.PHYSICS_MAX_FRAME_CATCHUP = exports.PHYSICS_ALLOW_SLEEPING = exports.PHYSICS_FRAME_SIZE = exports.AUDIO_START_MUTED = exports.DEBUG_PHYSICS = exports.DEBUG_DISABLE_SPAWNING = exports.ITEM_LIFESPAN_WARNING = exports.ITEM_LIFESPAN = exports.BULLET_SPEED = exports.TANK_CHASE_ITEM_RANGE = exports.TANK_SPEED = exports.PLAYER_MOVE_SPEED = exports.SPAWN_DELAY = exports.SPAWN_INTERVAL = exports.SMOOTH_CAP = exports.SMOOTH_FACTOR = exports.PIXEL_TO_METER = exports.METER_TO_PIXEL = exports.BASE_LINE_WIDTH = exports.CAMERA_HEIGHT = exports.CAMERA_WIDTH = exports.WORLD_HEIGHT = exports.WORLD_WIDTH = void 0;
// measurements
exports.WORLD_WIDTH = 2000; // px
exports.WORLD_HEIGHT = 2000; // px
exports.CAMERA_WIDTH = 400; // px
exports.CAMERA_HEIGHT = 640; // px
exports.BASE_LINE_WIDTH = 100; // px
exports.METER_TO_PIXEL = 20; // pixel per meter
exports.PIXEL_TO_METER = 1 / exports.METER_TO_PIXEL; // meter per pixel
exports.SMOOTH_FACTOR = 0.1;
exports.SMOOTH_CAP = 10;
// game rules
exports.SPAWN_INTERVAL = 10000; // ms
exports.SPAWN_DELAY = 5000; // ms
exports.PLAYER_MOVE_SPEED = 0.7; // px per second
exports.TANK_SPEED = 0.2; // px per second
exports.TANK_CHASE_ITEM_RANGE = 150; // px
exports.BULLET_SPEED = 0.06; // px per second
exports.ITEM_LIFESPAN = 20 * 1000; // ms
exports.ITEM_LIFESPAN_WARNING = 17 * 1000; // ms
// debug
exports.DEBUG_DISABLE_SPAWNING = false; // default false
exports.DEBUG_PHYSICS = false; // default false, draws the physics bodies and constraints
exports.AUDIO_START_MUTED = true; // default false
// physics
exports.PHYSICS_FRAME_SIZE = 16; // ms
exports.PHYSICS_ALLOW_SLEEPING = false; // default false
exports.PHYSICS_MAX_FRAME_CATCHUP = 10; // times, default 10 times (10*16 = 160ms)
exports.WS_URL = process.env.NODE_ENV == 'production'
    ? "wss://gmtk2022.dickson.md"
    : 'ws://localhost:3000';
//# sourceMappingURL=constants.js.map