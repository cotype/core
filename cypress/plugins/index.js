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
  if (process.env.CI) {
    on("after:screenshot", require("./slack"));
  }
};
