// Hijri year remainders for determining Kabisa years
const KABISA_YEAR_REMAINDERS = [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29];
// number of days in a Hijri year per month
const DAYS_IN_YEAR = [30, 59, 89, 118, 148, 177, 207, 236, 266, 295, 325];
// number of days in 30-years per Hijri year
const DAYS_IN_30_YEARS = [
    354, 708, 1063, 1417, 1771, 2126, 2480, 2834, 3189, 3543, 3898, 4252, 4606, 4961, 5315, 5669, 6024, 6378, 6732,
    7087, 7441, 7796, 8150, 8504, 8859, 9213, 9567, 9922, 10276, 10631,
];
const MONTH_NAMES = {
    long: {
        en: [
            "Moharram al-Haraam",
            "Safar al-Muzaffar",
            "Rabi al-Awwal",
            "Rabi al-Aakhar",
            "Jumada al-Ula",
            "Jumada al-Ukhra",
            "Rajab al-Asab",
            "Shabaan al-Karim",
            "Ramadaan al-Moazzam",
            "Shawwal al-Mukarram",
            "Zilqadah al-Haraam",
            "Zilhaj al-Haraam",
        ],
    },
    short: {
        en: [
            "Moharram",
            "Safar",
            "Rabi I",
            "Rabi II",
            "Jumada I",
            "Jumada II",
            "Rajab",
            "Shabaan",
            "Ramadaan",
            "Shawwal",
            "Zilqadah",
            "Zilhaj",
        ],
    },
};

export class HijriDate {
    constructor(private year, private month, private day) {}

    public getYear() {
        return this.year;
    }

    public getMonth() {
        return this.month;
    }

    public getDate() {
        return this.day;
    }

    public static getMonthName(month) {
        return MONTH_NAMES.long.en[month];
    }

    public getShortMonthName(month) {
        return MONTH_NAMES.short.en[month];
    }

    // is the specified Gregorian Date object a Julian date?
    public static isJulian(date) {
        if (date.getFullYear() < 1582) {
            return true;
        } else if (date.getFullYear() === 1582) {
            if (date.getMonth() < 9) {
                return true;
            } else if (date.getMonth() === 9) {
                if (date.getDate() < 5) {
                    return true;
                }
            }
        }
        return false;
    }

    // return Astronomical Julian Date corresponding to the specified Gregorian Date object
    public static gregorianToAJD(date) {
        var a,
            b,
            year = date.getFullYear(),
            month = date.getMonth() + 1,
            day =
                date.getDate() +
                date.getHours() / 24 +
                date.getMinutes() / 1440 +
                date.getSeconds() / 86400 +
                date.getMilliseconds() / 86400000;
        if (month < 3) {
            year--;
            month += 12;
        }
        if (HijriDate.isJulian(date)) {
            b = 0;
        } else {
            a = Math.floor(year / 100);
            b = 2 - a + Math.floor(a / 4);
        }
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    }

    // return Gregorian Date object corresponding to the specified Astronomical Julian Date
    public ajdToGregorian(ajd) {
        var a, b, c, d, e, f, z, alpha, year, month, day, hrs, min, sec, msc;
        z = Math.floor(ajd + 0.5);
        f = ajd + 0.5 - z;
        if (z < 2299161) {
            a = z;
        } else {
            alpha = Math.floor((z - 1867216.25) / 36524.25);
            a = z + 1 + alpha - Math.floor(0.25 * alpha);
        }
        b = a + 1524;
        c = Math.floor((b - 122.1) / 365.25);
        d = Math.floor(365.25 * c);
        e = Math.floor((b - d) / 30.6001);

        day = b - d - Math.floor(30.6001 * e) + f;
        hrs = (day - Math.floor(day)) * 24;
        min = (hrs - Math.floor(hrs)) * 60;
        sec = (min - Math.floor(min)) * 60;
        msc = (sec - Math.floor(sec)) * 1000;
        month = e < 14 ? e - 2 : e - 14;
        year = month < 2 ? c - 4715 : c - 4716;
        return new Date(year, month, day, hrs, min, sec, msc);
    }

    // is the specified Hijri year a Kabisa year?
    public static isKabisa(year) {
        for (var i in KABISA_YEAR_REMAINDERS) {
            if (year % 30 === KABISA_YEAR_REMAINDERS[i]) {
                return true;
            }
        }
        return false;
    }

    // return number of days in the specified Hijri year and month
    public static daysInMonth(year, month) {
        return (month === 11 && HijriDate.isKabisa(year)) || month % 2 === 0 ? 30 : 29;
    }

    // return day of Hijri year corresponding to this Hijri Date object
    public dayOfYear() {
        return this.month === 0 ? this.day : DAYS_IN_YEAR[this.month - 1] + this.day;
    }

    // return Hijri Date object corresponding to specified Astronomical Julian Date
    public static fromAJD(ajd) {
        var year,
            month,
            date,
            i = 0,
            left = Math.floor(ajd - 1948083.5),
            y30 = Math.floor(left / 10631.0);

        left -= y30 * 10631;
        while (left > DAYS_IN_30_YEARS[i]) {
            i += 1;
        }

        year = Math.round(y30 * 30.0 + i);
        if (i > 0) {
            left -= DAYS_IN_30_YEARS[i - 1];
        }
        i = 0;
        while (left > DAYS_IN_YEAR[i]) {
            i += 1;
        }
        month = Math.round(i);
        date = i > 0 ? Math.round(left - DAYS_IN_YEAR[i - 1]) : Math.round(left);

        return new HijriDate(year, month, date);
    }

    // return Astronomical Julian Date corresponding to this Hijri Date object
    public toAJD() {
        var y30 = Math.floor(this.year / 30.0),
            ajd = 1948083.5 + y30 * 10631 + this.dayOfYear();
        if (this.year % 30 !== 0) {
            ajd += DAYS_IN_30_YEARS[this.year - y30 * 30 - 1];
        }
        return ajd;
    }

    // return Hijri Date object corresponding to the specified Gregorian date object
    public static fromGregorian(date) {
        return HijriDate.fromAJD(HijriDate.gregorianToAJD(date));
    }

    // return Gregorian date object corresponding to this Hijri Date object
    public toGregorian() {
        return this.ajdToGregorian(this.toAJD());
    }
}
