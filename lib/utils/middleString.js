"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastMudderCharacter = exports.firstMudderCharacter = void 0;
const mudder_1 = __importDefault(require("mudder"));
exports.firstMudderCharacter = "0";
exports.lastMudderCharacter = "z";
const lastDigit = mudder_1.default.base62.stringToNumber(exports.lastMudderCharacter);
exports.default = (prevString = exports.firstMudderCharacter, nextString) => {
    if (nextString) {
        return mudder_1.default.base62.mudder(prevString, nextString)[0];
    }
    else {
        const digits = mudder_1.default.base62.stringToDigits(prevString);
        let increased = false;
        const newDigits = digits.reduce((acc, digit) => {
            if (!increased) {
                if (digit < lastDigit) {
                    increased = true;
                    digit++;
                }
                acc.push(digit);
            }
            return acc;
        }, []);
        if (!increased) {
            newDigits.push(0);
        }
        return mudder_1.default.base62.digitsToString(newDigits);
    }
};
//# sourceMappingURL=middleString.js.map