import HijriDate from 'hijri_date'

describe('HijriDate', () => {
  describe('isJulian', () => {
    it('expects 31st December 1581AD to be a Julian day', () => {
      let date = new Date(1581, 11, 31)

      expect(HijriDate.isJulian(date)).toBeTruthy()
    })

    it('expects 4th October 1582AD to be a Julian day', () => {
      let date = new Date(1582, 9, 4)

      expect(HijriDate.isJulian(date)).toBeTruthy()
    })

    it('expects 5th October 1582AD not to be a Julian day', () => {
      let date = new Date(1582, 9, 5)

      expect(HijriDate.isJulian(date)).toBeFalsy()
    })

    it('expects 1st January 1583AD not to be a Julian day', () => {
      let date = new Date(1583, 0, 1)

      expect(HijriDate.isJulian(date)).toBeFalsy()
    })
  })

  describe('gregorianToAJD', () => {
    it('expects 25th March 2011 to be AJD 2455645.5', () => {
      let date = new Date(2011, 2, 25)
      let ajd = 2455645.5

      expect(HijriDate.gregorianToAJD(date)).toBe(ajd)
    })
  })

  describe('ajdToGregorian', () => {
    it('expects AJD 2455645.5 to be 25th March 2011', () => {
      let date = new Date(2011, 2, 25)
      let ajd = 2455645.5

      expect(HijriDate.ajdToGregorian(ajd)).toEqual(date)
    })
  })

  describe('isKabisa', () => {
    it('expects 1434H to be a Kabisa year', () => {
      let kabisaYear = 1434

      expect(HijriDate.isKabisa(kabisaYear)).toBeTruthy()
    })

    it('expects 1432H not to be a Kabisa year', () => {
      let nonKabisaYear = 1432

      expect(HijriDate.isKabisa(nonKabisaYear)).toBeFalsy()
    })
  })

  describe('daysInMonth', () => {
    it('expects Ramazaan 1432H to contain 30 days', () => {
      let year = 1432
      let month = 8
      let numberOfDays = 30

      expect(HijriDate.daysInMonth(year, month)).toBe(numberOfDays)
    })

    it('expects Zilhaj 1432H to contain 29 days', () => {
      let year = 1432
      let month = 11
      let numberOfDays = 29

      expect(HijriDate.daysInMonth(year, month)).toBe(numberOfDays)
    })

    it('expects Zilhaj 1434H to contain 30 days', () => {
      let year = 1434
      let month = 11
      let numberOfDays = 30

      expect(HijriDate.daysInMonth(year, month)).toBe(numberOfDays)
    })
  })

  describe('dayOfYear', () => {
    it('expects 10th Moharram 1432H to be the 10th day of the year', () => {
      let date = new HijriDate(1432, 0, 10)
      let dayOfYear = 10

      expect(date.dayOfYear).toBe(dayOfYear)
    })

    it('expects 10th Ramazaan 1432H to be the 246th day of the year', () => {
      let date = new HijriDate(1432, 8, 10)
      let dayOfYear = 246

      expect(date.dayOfYear).toBe(dayOfYear)
    })

    it('expects 30th Zilhaj 1434H to be the 355th day of the year', () => {
      let date = new HijriDate(1434, 11, 30)
      let dayOfYear = 355

      expect(date.dayOfYear).toBe(dayOfYear)
    })
  })

  describe('fromAJD', () => {
    it('expects AJD 2455645.5 to be 20th Rabi al-Aakhar 1432H', () => {
      let date = new HijriDate(1432, 3, 20)
      let ajd = 2455645.5

      expect(HijriDate.fromAJD(ajd)).toEqual(date)
    })
  })

  describe('toAJD', () => {
    it('expects 20th Rabi al-Aakhar 1432H to be AJD 2455645.5', () => {
      let date = new HijriDate(1432, 3, 20)
      let ajd = 2455645.5

      expect(date.toAJD).toEqual(ajd)
    })
  })

  describe('fromGregorian', () => {
    it('expects 25th March 2011 to be 20th Rabi al-Aakhar 1432H', () => {
      let gregorianDate = new Date(2011, 2, 25)
      let hijriDate = new HijriDate(1432, 3, 20)

      expect(HijriDate.fromGregorian(gregorianDate)).toEqual(hijriDate)
    })
  })

  describe('toGregorian', () => {
    it('expects 20th Rabi al-Aakhar 1432H to be 25th March 2011', () => {
      let gregorianDate = new Date(2011, 2, 25)
      let hijriDate = new HijriDate(1432, 3, 20)

      expect(hijriDate.toGregorian).toEqual(gregorianDate)
    })
  })
})
