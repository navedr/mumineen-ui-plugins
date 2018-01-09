import HijriCalendar from 'hijri_calendar'
import HijriDate from 'hijri_date'

describe('HijriCalendar', () => {
  describe('weeks', () => {
    it('expects to return an array', () => {
      let calendar = new HijriCalendar(1432, 3)
      let weeks = calendar.weeks

      expect(Array.isArray(weeks)).toBeTruthy()
    })

    it('expects the array to contain 5 or 6 weeks', () => {
      let calendar = new HijriCalendar(1432, 3)
      let weeks = calendar.weeks

      expect(weeks.length).toBeGreaterThan(4)
      expect(weeks.length).toBeLessThan(7)
    })

    it('expects each week in the array to be an array', () => {
      let calendar = new HijriCalendar(1432, 3)
      let weeks = calendar.weeks

      weeks.forEach(function (week) {
        expect(Array.isArray(week)).toBeTruthy()
      })
    })

    it('expects each week in the array to contain 7 days', () => {
      let calendar = new HijriCalendar(1432, 3)
      let weeks = calendar.weeks

      weeks.forEach(function (week) {
        expect(week.length).toBe(7)
      })
    })
  })

  describe('previousDays', () => {
    describe('when the first day of the week is Sunday', () => {
      describe('when the month begins on a Sunday', () => {
        it('expects to return an empty array', () => {
          let calendar = new HijriCalendar(1432, 3)
          let previousDays = calendar.previousDays

          expect(previousDays).toEqual([])
        })
      })

      describe('when the month does not begin on a Sunday', () => {
        it('expects to return an array of days from the previous month', () => {
          let calendar = new HijriCalendar(1432, 5)
          let previousDays = calendar.previousDays
          let previousMonth = 4

          previousDays.forEach((day) => {
            expect(day.hijri.month).toBe(previousMonth)
          })
        })

        it('expects to return an array of days beginning on Sunday', () => {
          let calendar = new HijriCalendar(1432, 5)
          let previousDays = calendar.previousDays
          let previousMonth = calendar.previousMonth
          let firstDay = previousMonth.dayOfWeek(previousDays[0].hijri.date)

          expect(firstDay).toBe(0)
        })

        it('expects to return an array of days ending the day before this month begins', () => {
          let calendar = new HijriCalendar(1432, 5)
          let previousDays = calendar.previousDays
          let previousMonth = calendar.previousMonth
          let lastDay = previousMonth.dayOfWeek(previousDays[previousDays.length - 1].hijri.date)

          expect(lastDay).toBe(calendar.dayOfWeek(1) - 1)
        })
      })
    })

    describe('when the first day of the week is Monday', () => {
      describe('when the month begins on a Monday', () => {
        it('expects to return an empty array', () => {
          let calendar = new HijriCalendar(1432, 4, true)
          let previousDays = calendar.previousDays

          expect(previousDays).toEqual([])
        })
      })

      describe('when the month does not begin on a Monday', () => {
        it('expects to return an array of days from the previous month', () => {
          let calendar = new HijriCalendar(1432, 5, true)
          let previousDays = calendar.previousDays
          let previousMonth = 4

          previousDays.forEach(function (day) {
            expect(day.hijri.month).toBe(previousMonth)
          })
        })

        it('expects to return an array of days beginning on Monday', () => {
          let calendar = new HijriCalendar(1432, 5, true)
          let previousDays = calendar.previousDays
          let previousMonth = calendar.previousMonth
          let firstDay = previousMonth.dayOfWeek(previousDays[0].hijri.date)

          expect(firstDay).toBe(0)
        })

        it('expects to return an array of days ending the day before this month begins', () => {
          let calendar = new HijriCalendar(1432, 5, true)
          let previousDays = calendar.previousDays
          let previousMonth = calendar.previousMonth
          let lastDay = previousMonth.dayOfWeek(previousDays[previousDays.length - 1].hijri.date)

          expect(lastDay).toBe(calendar.dayOfWeek(1) - 1)
        })
      })
    })

    describe('when the month is 0 and the year is MIN_CALENDAR_YEAR', () => {
      it('expects to return an array of NULL values or an empty array', () => {
        let calendar = new HijriCalendar(HijriCalendar.minYear(), 0)
        let previousDays = calendar.previousDays

        if (previousDays.length > 0) {
          previousDays.forEach((day) => {
            expect(day).toBeNull()
          })
        } else {
          expect(previousDays).toEqual([])
        }
      })

      it('expects to return an array with enough values to complete the week', () => {
        let calendar = new HijriCalendar(HijriCalendar.minYear(), 0)
        let previousDays = calendar.previousDays
        let firstDay = calendar.dayOfWeek(1) + 1

        expect(previousDays.length + firstDay).toBe(7)
      })
    })

    describe('irrespective of the first day of the week, month or year', () => {
      it('expects each day to have a "filler" attribute', () => {
        let calendar = new HijriCalendar(1432, 11)
        let previousDays = calendar.previousDays

        if (previousDays.length > 0) {
          previousDays.forEach((day) => {
            expect(day.filler).toBeDefined()
          })
        } else {
          expect(previousDays).toEqual([])
        }
      })
    })
  })

  describe('days', () => {
    it('expects to return an array of days for this month and year', () => {
      let calendar = new HijriCalendar(1432, 4)
      let days = calendar.days

      expect(Array.isArray(days)).toBeTruthy()
    })

    it('expects each day object to contain specific data', () => {
      let calendar = new HijriCalendar(1432, 4)
      let days = calendar.days

      days.forEach((day) => {
        expect(day.hijri.year).toBeDefined()
        expect(day.hijri.month).toBeDefined()
        expect(day.hijri.date).toBeDefined()
        expect(day.gregorian.year).toBeDefined()
        expect(day.gregorian.month).toBeDefined()
        expect(day.gregorian.date).toBeDefined()
        expect(day.ajd).toBeDefined()
      })
    })

    it('expects the first day in the array to correspond to the first day of the month', () => {
      let calendar = new HijriCalendar(1432, 4)
      let days = calendar.days

      expect(days[0].hijri.date).toBe(1)
    })

    it('expects the last day in the array to correspond to the last day of the month', () => {
      let calendar = new HijriCalendar(1432, 4)
      let days = calendar.days

      expect(days[days.length - 1].hijri.date).toBe(days.length)
    })
  })

  describe('nextDays', () => {
    describe('when the first day of the week is Sunday', () => {
      describe('when the month ends on a Saturday', () => {
        it('expects to return an empty array', () => {
          let calendar = new HijriCalendar(1432, 2)
          let nextDays = calendar.nextDays

          expect(nextDays).toEqual([])
        })
      })

      describe('when the month does not end on a Saturday', () => {
        it('expects to return an array of days from the next month', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = 6

          nextDays.forEach(function (day) {
            expect(day.hijri.month).toBe(nextMonth)
          })
        })

        it('expects to return an array of days ending on Saturday', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = calendar.nextMonth
          let lastDay = nextMonth.dayOfWeek(nextDays[nextDays.length - 1].hijri.date)

          expect(lastDay).toBe(6)
        })

        it('expects to return an array of days beginning the day after this month ends', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = calendar.nextMonth
          let firstDay = nextMonth.dayOfWeek(nextDays[0].hijri.date)

          expect(firstDay).toBe(calendar.dayOfWeek(29) + 1)
        })
      })
    })

    describe('when the first day of the week is Monday', () => {
      describe('when the month ends on a Sunday', () => {
        it('expects to return an empty array', () => {
          let calendar = new HijriCalendar(1432, 3, true)
          let nextDays = calendar.nextDays

          expect(nextDays).toEqual([])
        })
      })

      describe('when the month does not end on a Sunday', () => {
        it('expects to return an array of days from the next month', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = 6

          nextDays.forEach(function (day) {
            expect(day.hijri.month).toBe(nextMonth)
          })
        })

        it('expects to return an array of days ending on Sunday', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = calendar.nextMonth
          let lastDay = nextMonth.dayOfWeek(nextDays[nextDays.length - 1].hijri.date)

          expect(lastDay).toBe(6)
        })

        it('expects to return an array of days beginning the day after this month ends', () => {
          let calendar = new HijriCalendar(1432, 5)
          let nextDays = calendar.nextDays
          let nextMonth = calendar.nextMonth
          let firstDay = nextMonth.dayOfWeek(nextDays[0].hijri.date)

          expect(firstDay).toBe(calendar.dayOfWeek(29) + 1)
        })
      })
    })

    describe('when the month is 11 and the year is MAX_CALENDAR_YEAR', () => {
      it('expects to return an array of NULL values or an empty array', () => {
        let calendar = new HijriCalendar(HijriCalendar.maxYear(), 11)
        let nextDays = calendar.nextDays

        if (nextDays.length > 0) {
          nextDays.forEach(function (day) {
            expect(day).toBeNull()
          })
        } else {
          expect(nextDays).toEqual([])
        }
      })

      it('expects to return an array with enough values to complete the week', () => {
        let calendar = new HijriCalendar(HijriCalendar.maxYear(), 11)
        let nextDays = calendar.nextDays
        let daysInMonth = HijriDate.daysInMonth(calendar.year, calendar.month)
        let lastDay = calendar.dayOfWeek(daysInMonth) + 1

        expect(lastDay + nextDays.length).toBe(7)
      })
    })

    describe('irrespective of the first day of the week, month or year', () => {
      it('expects each day to have a "filler" attribute', () => {
        let calendar = new HijriCalendar(1432, 11)
        let nextDays = calendar.nextDays

        if (nextDays.length > 0) {
          nextDays.forEach(function (day) {
            expect(day.filler).toBeDefined()
          })
        } else {
          expect(nextDays).toEqual([])
        }
      })
    })
  })

  describe('previousMonth', () => {
    describe('when the month is greater than 0', () => {
      it('expects to subtract 1 from the month', () => {
        let calendar = new HijriCalendar(1432, 3)
        let previousMonth = calendar.previousMonth

        expect(previousMonth.month).toBe(2)
      })
    })

    describe('when the month is 0', () => {
      it('expects to set the month to 11', () => {
        let calendar = new HijriCalendar(1432, 0)
        let previousMonth = calendar.previousMonth

        expect(previousMonth.month).toBe(11)
      })

      it('expects to subtract 1 from the year', () => {
        let calendar = new HijriCalendar(1432, 0)
        let previousMonth = calendar.previousMonth

        expect(previousMonth.year).toBe(1431)
      })
    })

    describe('when the month is 0 and the year is MIN_CALENDAR_YEAR', () => {
      it('expects the month to stay the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.minYear(), 0)
        let previousMonth = calendar.previousMonth

        expect(previousMonth.month).toBe(0)
      })

      it('expects the year to stay the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.minYear(), 0)
        let previousMonth = calendar.previousMonth

        expect(previousMonth.year).toBe(HijriCalendar.minYear())
      })
    })
  })

  describe('nextMonth', () => {
    describe('when the month is less than 11', () => {
      it('expects to add 1 to the month', () => {
        let calendar = new HijriCalendar(1432, 3)
        let nextMonth = calendar.nextMonth

        expect(nextMonth.month).toBe(4)
      })
    })

    describe('when the month is 11', () => {
      it('expects to set the month to 0', () => {
        let calendar = new HijriCalendar(1432, 11)
        let nextMonth = calendar.nextMonth

        expect(nextMonth.month).toBe(0)
      })

      it('expects to add 1 to the year', () => {
        let calendar = new HijriCalendar(1432, 11)
        let nextMonth = calendar.nextMonth

        expect(nextMonth.year).toBe(1433)
      })
    })

    describe('when the month is 11 and the year is MAX_CALENDAR_YEAR', () => {
      it('expects the month to stay the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.maxYear(), 11)
        let nextMonth = calendar.nextMonth

        expect(nextMonth.month).toBe(11)
      })

      it('expects the year to stay the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.maxYear(), 11)
        let nextMonth = calendar.nextMonth

        expect(nextMonth.year).toBe(HijriCalendar.maxYear())
      })
    })
  })

  describe('previousYear', () => {
    describe('when the year is greater than MIN_CALENDAR_YEAR', () => {
      it('expects to subtract 1 from the year', () => {
        let calendar = new HijriCalendar(1432, 3)
        let previousYear = calendar.previousYear
        let year = 1431

        expect(previousYear.year).toEqual(year)
      })
    })

    describe('when the year is MIN_CALENDAR_YEAR', () => {
      it('expects the year to remain the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.minYear(), 3)
        let previousYear = calendar.previousYear
        let year = calendar.year

        expect(previousYear.year).toEqual(year)
      })
    })
  })

  describe('nextYear', () => {
    describe('when the year is less than MAX_CALENDAR_YEAR', () => {
      it('expects to add 1 to the year', () => {
        let calendar = new HijriCalendar(1432, 3)
        let nextYear = calendar.nextYear
        let year = 1433

        expect(nextYear.year).toEqual(year)
      })
    })

    describe('when the year is MAX_CALENDAR_YEAR', () => {
      it('expects the year to remain the same', () => {
        let calendar = new HijriCalendar(HijriCalendar.maxYear(), 3)
        let nextYear = calendar.nextYear
        let year = calendar.year

        expect(nextYear.year).toEqual(year)
      })
    })
  })
})
