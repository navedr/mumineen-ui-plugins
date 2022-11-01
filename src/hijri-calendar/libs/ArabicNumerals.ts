const utf8Codes = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];

export class ArabicNumerals {
    public static fromInteger(x) {
        return Math.floor(x)
            .toString()
            .split("")
            .map(function (digit) {
                return parseInt(digit, 10);
            })
            .map(function (digit) {
                return utf8Codes[digit];
            })
            .join("")
            .toString();
    }
}
