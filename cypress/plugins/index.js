const cyParcel = require("cypress-parcel-preprocessor");

module.exports = (on, config) => {
  on("file:preprocessor", async ev => {
    try {
      return await cyParcel(ev);
    } catch (err) {
      console.log("ERROR. Retrying ...");
    }
    return cyParcel(ev);
  });
};
