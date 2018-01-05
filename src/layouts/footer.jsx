import React, { Component } from 'react'
import Link from 'gatsby-link'

class Footer extends Component {
  render() {
    const today = new Date()

    return (
      <footer>
        <p>
          &copy; { today.getFullYear() }, <Link to="https://gulamali.net/">Murtaza Gulamali</Link>.
          I made this. Some rights reserved.
        </p>
      </footer>
    )
  }
}

export default Footer
