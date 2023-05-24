"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstMudderCharacter = void 0;
const visit_1 = __importDefault(require("./visit"));
const middleString_1 = __importDefault(require("../utils/middleString"));
/**
 * SetPosition Field
 */
exports.firstMudderCharacter = "0";
function setPosition(obj, model, lastPos = exports.firstMudderCharacter, nextPos, forcePositionSet, stringPath) {
    (0, visit_1.default)(obj, model, {
        position(pos, f, d, path) {
            if ((stringPath && stringPath === path) || !stringPath) {
                if (!pos || forcePositionSet) {
                    return (0, middleString_1.default)(lastPos, nextPos === lastPos ? nextPos + "z" : nextPos);
                }
            }
        }
    });
    return obj;
}
exports.default = setPosition;
//# sourceMappingURL=setPosition.js.map