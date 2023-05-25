import visit from "./visit";
import middleString from "../utils/middleString";
/**
 * SetPosition Field
 */
export const firstMudderCharacter = "0";
export default function setPosition(obj, model, lastPos = firstMudderCharacter, nextPos, forcePositionSet, stringPath) {
    visit(obj, model, {
        position(pos, f, d, path) {
            if ((stringPath && stringPath === path) || !stringPath) {
                if (!pos || forcePositionSet) {
                    return middleString(lastPos, nextPos === lastPos ? nextPos + "z" : nextPos);
                }
            }
        }
    });
    return obj;
}
//# sourceMappingURL=setPosition.js.map