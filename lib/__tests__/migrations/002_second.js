"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const content_migrations_test_1 = require("../content_migrations.test");
function default_1(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.addField(content_migrations_test_1.initialModel.name, "newField", (data, meta) => {
            if (meta.published) {
                return content_migrations_test_1.publishedData.newField;
            }
            else if (meta.latest) {
                return content_migrations_test_1.draftsData.newField;
            }
            return "";
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=002_second.js.map