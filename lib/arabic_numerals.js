import _ from 'lodash'

const utf8Codes = [
  '\u0660', '\u0661', '\u0662', '\u0663', '\u0664',
  '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'
]

class ArabicNumerals {
  static fromInteger(x) {
    let digits = Math.floor(x).toString()

    return _.split(digits, '').map((digit) => {
      let value = parseInt(digit, 10)

      return utf8Codes[value]
    }).join('')
  }
}

export default ArabicNumerals
