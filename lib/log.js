"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
function highlight(text, background = "#555555", color = "#ffffff") {
    if (!chalk_1.default.supportsColor) {
        return text;
    }
    return chalk_1.default.bgHex(background)(chalk_1.default.hex(color)(chalk_1.default.bold(text.toString())));
}
function logo(background = "#FB249D", color = "#ffffff") {
    if (!chalk_1.default.supportsColor) {
        return "[cotype]";
    }
    return highlight(" { ", background, color);
}
exports.default = {
    debug(...args) {
        console.debug(logo("#777777"), ...args);
    },
    log(...args) {
        // tslint:disable-next-line:no-console
        console.log(logo("#555555"), ...args);
    },
    warn(...args) {
        console.warn(logo("#f9a022"), ...args);
    },
    error(...args) {
        console.warn(logo("#f94622"), ...args);
    },
    info(...args) {
        console.debug(logo(), ...args);
    },
    color(background = "#FB249D", color = "#ffffff") {
        // tslint:disable-next-line:no-console
        return (...args) => console.log(logo(background, color), ...args);
    },
    highlight,
    logo
};
//# sourceMappingURL=log.js.map