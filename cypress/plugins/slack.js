const { WebClient } = require("@slack/client");
const fs = require("fs");
const path = require("path");

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const token = process.env.SLACK_TOKEN;
const channels = process.env.SLACK_CHANNEL;

const web = new WebClient(token);

module.exports = ({ path: file, specName }) => {
  const filename = file.split(path.sep).splice(-1)[0];
  return web.files.upload({
    filename,
    file: fs.createReadStream(file),
    channels,
    title: `${specName}: ${filename}`
  });
};
