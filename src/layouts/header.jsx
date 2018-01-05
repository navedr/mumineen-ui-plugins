import React, { Component } from 'react'

import logo from '../../source/assets/images/he.png'

class Header extends Component {
  render() {
    return (
      <header>
        <img src={ logo } alt="Mumineen Calendar" class="logo" />
        <h1>Mumineen Calendar</h1>
        <p>A Hijri calendar for Dawoodi Bohra Muslims</p>
      </header>
    )
  }
}

export default Header
