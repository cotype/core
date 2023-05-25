var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
export default function refsMerger(data, converters) {
    const { _refs } = data, obj1 = __rest(data, ["_refs"]);
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
//# sourceMappingURL=refsMerger.js.map