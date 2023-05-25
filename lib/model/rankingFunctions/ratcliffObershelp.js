function ratcliffObershelp(s1, s2) {
    const stack = [];
    stack.push(s1);
    stack.push(s2);
    let score = 0;
    while (stack.length) {
        const string1 = stack.pop();
        const string2 = stack.pop();
        let longestSequenceLength = 0;
        let longestSequenceIndex1 = -1;
        let longestSequenceIndex2 = -1;
        for (let i = 0; i < string1.length; i++) {
            for (let j = 0; j < string2.length; j++) {
                let k = 0;
                while (i + k < string1.length &&
                    j + k < string2.length &&
                    string1.charAt(i + k) === string2.charAt(j + k)) {
                    k++;
                }
                if (k > longestSequenceLength) {
                    longestSequenceLength = k;
                    longestSequenceIndex1 = i;
                    longestSequenceIndex2 = j;
                }
            }
        }
        if (longestSequenceLength) {
            score += longestSequenceLength * 2;
            if (longestSequenceIndex1 !== 0 && longestSequenceIndex2 !== 0) {
                stack.push(string1.substring(0, longestSequenceIndex1));
                stack.push(string2.substring(0, longestSequenceIndex2));
            }
            if (longestSequenceIndex1 + longestSequenceLength !== string1.length &&
                longestSequenceIndex2 + longestSequenceLength !== string2.length) {
                stack.push(string1.substring(longestSequenceIndex1 + longestSequenceLength, string1.length));
                stack.push(string2.substring(longestSequenceIndex2 + longestSequenceLength, string2.length));
            }
        }
    }
    return score / (s1.length + s2.length);
}
function notFalse(x) {
    return x !== false;
}
export default function bestMatch(sentences, query, strictMatch = false) {
    return sentences
        .map(text => {
        const score = ratcliffObershelp(query, text.toLowerCase());
        const hasScore = score > 0;
        const matchesStrict = strictMatch
            ? text.search(new RegExp(query, "i")) !== -1
            : true;
        return hasScore && matchesStrict && { score, text };
    })
        .filter(notFalse)
        .sort((a, b) => b.score - a.score)
        .map(s => s.text);
}
//# sourceMappingURL=ratcliffObershelp.js.map