const cyParcel = require("@xiphe/cypress-parcel-preprocessor");

const RETRY = Symbol("RETRY");
const MAX_RETRIES = 10;

function wait(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

async function justFrigginPreprocessPlease(ev) {
  try {
    return await cyParcel(ev);
  } catch (err) {
    switch (ev[RETRY]) {
      case undefined:
        ev[RETRY] = 1;
        break;
      case MAX_RETRIES:
        throw err;
      default:
        await wait(ev[RETRY]);
        ev[RETRY] += 1;
    }
    console.log(
      `Parcel threw an ERROR: Retrying(${ev[RETRY]} of ${MAX_RETRIES})...`
    );
  }
  return justFrigginPreprocessPlease(ev);
}

module.exports = (on, config) => {
  on("file:preprocessor", justFrigginPreprocessPlease);
};
