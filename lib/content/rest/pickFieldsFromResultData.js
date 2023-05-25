import _pick from "lodash/pick";
export default function pickFieldsFromResultData(unpickedData, fields) {
    if (!fields || !Array.isArray(fields) || !fields.length)
        return unpickedData;
    const pickNeededFields = (dataToPick) => _pick(dataToPick, [...fields, "_id"]);
    let pickedData;
    if ("items" in unpickedData) {
        const pickedItems = unpickedData.items.map(item => {
            const data = pickNeededFields(item.data);
            return Object.assign(Object.assign({}, item), { data });
        });
        pickedData = Object.assign(Object.assign({}, unpickedData), { items: pickedItems, _refs: unpickedData._refs });
    }
    else {
        const data = pickNeededFields(unpickedData.data);
        pickedData = Object.assign(Object.assign({}, unpickedData), { data, _refs: unpickedData._refs });
    }
    return pickedData;
}
//# sourceMappingURL=pickFieldsFromResultData.js.map