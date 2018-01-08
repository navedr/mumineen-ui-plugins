import _ from 'lodash'

// month names
const MONTH_NAMES = {
  en: {
    long: [
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
      "Zilhaj al-Haraam"
    ],
    short: [
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
      "Zilhaj"
    ]
  }
}

// Hijri year remainders for determining Kabisa years
const KABISA_YEAR_REMAINDERS = [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29]

// number of days in a Hijri year per month
const DAYS_IN_YEAR = [30, 59, 89, 118, 148, 177, 207, 236, 266, 295, 325]

// number of days in 30-years per Hijri year
const DAYS_IN_30_YEARS = [
  354,  708, 1063, 1417, 1771, 2126, 2480, 2834,  3189,  3543,
  3898, 4252, 4606, 4961, 5315, 5669, 6024, 6378,  6732,  7087,
  7441, 7796, 8150, 8504, 8859, 9213, 9567, 9922, 10276, 10631
]

class HijriDate {
  constructor(year, month, day) {
    this.year = year
    this.month = month
    this.day = day
  }

  static monthName(month) {
    return MONTH_NAMES.en.long[month]
  }

  static shortMonthName(month) {
    return MONTH_NAMES.en.short[month]
  }

  // is the specified Gregorian Date object a Julian date?
  static isJulian(date) {
    if (date.getFullYear() < 1582) {
      return true
    } else if (date.getFullYear() === 1582) {
      if (date.getMonth() < 9) {
        return true
      } else if (date.getMonth() === 9) {
        if (date.getDate() < 5) {
          return true
        }
      }
    }
    return false
  }

  // return Astronomical Julian Date corresponding to the specified Gregorian Date object
  static gregorianToAJD(date) {
    let a, b
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
            + date.getHours()/24
            + date.getMinutes()/1440
            + date.getSeconds()/86400
            + date.getMilliseconds()/86400000

    if (month < 3) {
      year--
      month += 12
    }

    if (HijriDate.isJulian(date)) {
      b = 0
    } else {
      a = Math.floor(year / 100)
      b = 2 - a + Math.floor(a / 4)
    }

    return Math.floor(365.25*(year + 4716)) + Math.floor(30.6001*(month + 1)) + day + b - 1524.5
  }

  // return Gregorian Date object corresponding to the specified Astronomical Julian Date
  static ajdToGregorian(ajd) {
    let a, b, c, d, e, f, z, alpha,
        year, month, day, hours, minutes, seconds, milliseconds

    z = Math.floor(ajd + 0.5)
    f = (ajd + 0.5 - z)

    if (z < 2299161) {
      a = z
    } else {
      alpha = Math.floor((z - 1867216.25) / 36524.25)
      a = z + 1 + alpha - Math.floor(0.25*alpha)
    }

    b = a + 1524
    c = Math.floor((b - 122.1) / 365.25)
    d = Math.floor(365.25*c)
    e = Math.floor((b - d) / 30.6001)

    month = (e < 14) ? (e - 2) : (e - 14)
    year = (month < 2) ? (c - 4715) : (c - 4716)
    day = b - d - Math.floor(30.6001*e) + f

    hours = (day - Math.floor(day))*24
    minutes = (hours - Math.floor(hours))*60
    seconds = (minutes - Math.floor(minutes))*60
    milliseconds = (seconds - Math.floor(seconds))*1000

    return new Date(year, month, day, hours, minutes, seconds, milliseconds)
  }

  // is the specified Hijri year a Kabisa year?
  static isKabisa(year) {
    return _.some(KABISA_YEAR_REMAINDERS, (remainder) => {
      return year % 30 == remainder
    })
  }

  // return number of days in the specified Hijri year and month
  static daysInMonth(year, month) {
    let kabisa_month = (month === 11) && HijriDate.isKabisa(year),
        even_month = month % 2 === 0

    return (kabisa_month || even_month) ? 30 : 29
  }

  // return day of Hijri year corresponding to this Hijri Date object
  get dayOfYear() {
    return (this.month > 0) ? (DAYS_IN_YEAR[this.month - 1] + this.day) : this.day
  }

  // return Hijri Date object corresponding to specified Astronomical Julian Date
  static fromAJD(ajd) {
    let year, month, date,
        index,
        left = Math.floor(ajd - 1948083.5),
        y30 = Math.floor(left / 10631.0)

    left -= y30*10631
    index = _.findIndex(DAYS_IN_30_YEARS, (days) => { return days > left })
    year = Math.round(y30*30.0 + index)

    if (index > 0) {
      left -= DAYS_IN_30_YEARS[index - 1]
    }
    index = _.findIndex(DAYS_IN_YEAR, (days) => { return days > left })
    month = Math.round(index)

    date = (index > 0) ? Math.round(left - DAYS_IN_YEAR[index - 1]) : Math.round(left)

    return new HijriDate(year, month, date)
  }

  // return Astronomical Julian Date corresponding to this Hijri Date object
  get toAJD() {
    let y30 = Math.floor(this.year / 30.0),
        ajd = 1948083.5 + y30*10631 + this.dayOfYear

    if (this.year % 30 !== 0) {
      ajd += DAYS_IN_30_YEARS[this.year - y30*30 - 1]
    }

    return ajd
  }

  // return Hijri Date object corresponding to the specified Gregorian date object
  static fromGregorian(date) {
    return HijriDate.fromAJD(HijriDate.gregorianToAJD(date))
  }

  // return Gregorian date object corresponding to this Hijri Date object
  get toGregorian() {
    return HijriDate.ajdToGregorian(this.toAJD)
  }
}

export default HijriDate
