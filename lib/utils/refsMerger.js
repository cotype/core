"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function refsMerger(data, converters) {
    const { _refs, ...obj1 } = data;
    if (!_refs)
        return;
    const walk = (obj2) => {
        if (!obj2)
            return;
        if (typeof obj2 !== "object")
            return;
        if (Array.isArray(obj2)) {
            obj2.forEach(walk);
            return;
        }
        Object.keys(obj2).forEach(key => {
            const value = obj2[key];
            if (key === "_ref") {
                const id = obj2._id;
                const refs = _refs[value];
                if (!refs || !id)
                    return;
                const type = obj2[`_${value}`];
                const lookup = type ? refs[type] : refs;
                if (!lookup)
                    return;
                const ref = lookup[id];
                if (ref) {
                    walk(ref);
                    if (value in converters) {
                        converters[value](ref);
                    }
                    Object.assign(obj2, ref);
                }
            }
            walk(value);
        });
    };
    walk(obj1);
    return obj1;
}
exports.default = refsMerger;
//# sourceMappingURL=refsMerger.js.map