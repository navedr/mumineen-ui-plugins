import ArabicNumerals from 'arabic_numerals'

describe('ArabicNumerals', () => {
  describe('fromInteger', () => {
    it('expects to convert 7 into the equivalent UTF-8 Arabic numeral string', () => {
      let number = 7
      let arabic_numeral = "\u0667"

      expect(ArabicNumerals.fromInteger(number)).toEqual(arabic_numeral)
    })

    it('expects to convert 21 into the equivalent UTF-8 Arabic numeral string', () => {
      let number = 21
      let arabic_numeral = "\u0662\u0661"

      expect(ArabicNumerals.fromInteger(number)).toEqual(arabic_numeral)
    });

    it('expects to convert Pi into the UTF-8 Arabic numeral string for 3', () => {
      let number = Math.PI
      let arabic_numeral = "\u0663"

      expect(ArabicNumerals.fromInteger(number)).toEqual(arabic_numeral)
    })
  })
})
