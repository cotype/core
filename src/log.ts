import chalk from "chalk";

function logo(background: string = "#FB249D", color: string = "#ffffff") {
  if (!chalk.supportsColor) {
    return "{ cotype:";
  }
  return (
    chalk.hex(background)("▐") +
    chalk.bgHex(background)(chalk.hex(color)(chalk.bold("{"))) +
    chalk.hex(background)("▊")
  );
}

export default {
  debug(...args: any[]) {
    console.debug(logo("#777777"), ...args);
  },
  log(...args: any[]) {
    // tslint:disable-next-line:no-console
    console.log(logo("#555555"), ...args);
  },
  warn(...args: any[]) {
    console.warn(logo("#f9a022"), ...args);
  },
  error(...args: any[]) {
    console.warn(logo("#f94622"), ...args);
  },
  info(...args: any[]) {
    console.debug(logo(), ...args);
  },
  color(background: string = "#FB249D", color: string = "#ffffff") {
    // tslint:disable-next-line:no-console
    return (...args: any[]) => console.log(logo(background, color), ...args);
  },
  logo
};
