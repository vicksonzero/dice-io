"use strict";
/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2022 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFastValue = void 0;
/**
 * Finds the key within the top level of the {@link source} object, or returns {@link defaultValue}
 *
 * @function Phaser.Utils.Objects.GetFastValue
 * @since 3.0.0
 *
 * @param {object} source - The object to search
 * @param {string} key - The key for the property on source. Must exist at the top level of the source object (no periods)
 * @param {*} [defaultValue] - The default value to use if the key does not exist.
 *
 * @return {*} The value if found; otherwise, defaultValue (null if none provided)
 */
const GetFastValue = (source, key, defaultValue) => {
    var t = typeof (source);
    if (!source || t === 'number' || t === 'string') {
        return defaultValue;
    }
    else if (source.hasOwnProperty(key) && source[key] !== undefined) {
        return source[key];
    }
    else {
        return defaultValue;
    }
};
exports.GetFastValue = GetFastValue;
//# sourceMappingURL=PhaserUtils.js.map