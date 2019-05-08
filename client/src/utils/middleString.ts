import mudder from "mudder";

export const firstMudderCharacter = "0";
export const lastMudderCharacter = "z";
const lastDigit = mudder.base62.stringToNumber(lastMudderCharacter);

export default (
  prevString: string = firstMudderCharacter,
  nextString?: string
): string => {
  if (nextString) {
    return mudder.base62.mudder(prevString, nextString)[0];
  } else {
    const digits = mudder.base62.stringToDigits(prevString);
    let increased = false;
    const newDigits: number[] = digits.reduce<number[]>((acc, digit) => {
      if (!increased) {
        if (digit < lastDigit) {
          increased = true;
          digit++;
        }
        acc.push(digit);
      }
      return acc;
    }, []);
    if (!increased) {
      newDigits.push(0);
    }

    return mudder.base62.digitsToString(newDigits);
  }
};
