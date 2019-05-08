export default function withContext(
  cb: (context: Mocha.ITestCallbackContext) => any
) {
  return function() {
    return cb(this);
  };
}
