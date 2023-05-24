"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasType = void 0;
function hasType(model, name) {
    return collectTypes(model).some(type => type.type === name);
}
exports.hasType = hasType;
function collectTypes(model) {
    const types = [];
    Object.values(model.fields).forEach(type => {
        collect(types, type);
    });
    return types;
}
function collect(types, type) {
    types.push(type);
    if (type.type === "object") {
        Object.values(type.fields).forEach(fieldType => {
            collect(types, fieldType);
        });
    }
    if (type.type === "list") {
        collect(types, type.item);
    }
    if (type.type === "union") {
        Object.values(type.types).forEach(typeType => {
            collect(types, typeType);
        });
    }
}
//# sourceMappingURL=introspection.js.map