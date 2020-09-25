import visit from "./visit";
import { Model } from "../../typings";

const isi18nModel = (model: Model): boolean => {
  let isi18n = false;
  visit({}, model, {
    i18n() {
      isi18n = true;
    }
  });
  return isi18n;
};

export default isi18nModel;
