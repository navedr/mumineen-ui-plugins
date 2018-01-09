import _ from 'lodash'

import HijriDate from 'hijri_date'

const MIN_CALENDAR_YEAR = 1000
const MAX_CALENDAR_YEAR = 3000

function dayHash(hijriDate, gregorianDate, isFiller) {
  return {
    hijri: {
      year: hijriDate.year,
      month: hijriDate.month,
      date: hijriDate.day
    },
    gregorian: {
      year: gregorianDate.getFullYear(),
      month: gregorianDate.getMonth(),
      date: gregorianDate.getDate()
    },
    ajd: hijriDate.toAJD,
    filler: (isFiller) ? true : undefined
  }
}

class HijriCalendar {
  constructor(year, month, iso8601 = false) {
    this.year = year
    this.month = month
    this.iso8601 = iso8601
  }

  static minYear() {
    return MIN_CALENDAR_YEAR
  }

  static maxYear() {
    return MAX_CALENDAR_YEAR
  }

  // return day of week for the specified date
  dayOfWeek(date) {
    let hijriDate = new HijriDate(this.year, this.month, date)

    return hijriDate.dayOfWeek(this.iso8601)
  }

  // return array of weeks for this month and year
  get weeks() {
    let days = _.concat(this.previousDays, this.days, this.nextDays)

    return _.chunk(days, 7)
  }

  // return array of days from beginning of week until start of this month and year
  get previousDays() {
    let previousMonth = this.previousMonth,
        daysInPreviousMonth = HijriDate.daysInMonth(previousMonth.year, previousMonth.month),
        dayAtStartOfMonth = this.dayOfWeek(1);

    if (this.month === previousMonth.month && this.year === previousMonth.year) {
      return Array(6 - dayAtStartOfMonth).fill(null)
    }

    return _.range(dayAtStartOfMonth).map((day) => {
      let hijriDate = new HijriDate(
        previousMonth.year,
        previousMonth.month,
        daysInPreviousMonth - dayAtStartOfMonth + day + 1
      )
      let gregorianDate = hijriDate.toGregorian

      return dayHash(hijriDate, gregorianDate, true)
    })
  }

  // return array of days of this month and year
  get days() {
    let year = this.year,
        month = this.month

    return _.range(HijriDate.daysInMonth(year, month)).map((day) => {
      let hijriDate = new HijriDate(year, month, day + 1),
          gregorianDate = hijriDate.toGregorian

      return dayHash(hijriDate, gregorianDate)
    })
  }

  // return array of days from end of this month and year until end of the week
  get nextDays() {
    var nextMonth = this.nextMonth,
        daysInMonth = HijriDate.daysInMonth(this.year, this.month),
        dayAtEndOfMonth = this.dayOfWeek(daysInMonth)

    if (this.month === nextMonth.month && this.year === nextMonth.year) {
      return Array(6 - dayAtEndOfMonth).fill(null)
    }

    return _.range(6 - dayAtEndOfMonth).map((day) => {
      let hijriDate = new HijriDate(
        nextMonth.year,
        nextMonth.month,
        day + 1
      )
      let gregorianDate = hijriDate.toGregorian

      return dayHash(hijriDate, gregorianDate, true)
    })
  }

  // return Hijri Calendar object for the previous month
  get previousMonth() {
    let month = this.month - 1,
        year = this.year

    if (month < 0 && year <= MIN_CALENDAR_YEAR) {
      month = this.month
    } else if (month < 0) {
      month = 11
      year = this.year - 1
    }

    return new HijriCalendar(year, month, this.iso8601)
  }

  // return Hijri Calendar object for the next month
  get nextMonth() {
    let month = this.month + 1,
        year = this.year

    if (month > 11 && year >= MAX_CALENDAR_YEAR) {
      month = this.month
    } else if (month > 11) {
      month = 0
      year = this.year + 1
    }

    return new HijriCalendar(year, month, this.iso8601)
  }

  // return Hijri Calendar object for the previous year
  get previousYear() {
    let year = (this.year <= MIN_CALENDAR_YEAR) ? MIN_CALENDAR_YEAR : (this.year - 1)

    return new HijriCalendar(year, this.month, this.iso8601)
  }

  // return Hijri Calendar object for the next year
  get nextYear() {
    let year = (this.year >= MAX_CALENDAR_YEAR) ? MAX_CALENDAR_YEAR : (this.year + 1)

    return new HijriCalendar(year, this.month, this.iso8601)
  }
}

export default HijriCalendar
