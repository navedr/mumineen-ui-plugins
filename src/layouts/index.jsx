import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

import Header from './header'
import Footer from './footer'

const metaTags = [
  {
    name: 'author',
    content: 'Murtaza Gulamali'
  },
  {
    name: 'description',
    content: 'A Hijri calendar for Dawoodi Bohra Shia Muslims who follow the 53rd Dai al-Mutlaq, His Holiness Syedna Aale Qadr Mufaddal Saifuddin (TUS).'
  },
]

const linkTags = [
  {
    rel: 'canonical',
    href: 'http://www.mumineencalendar.com'
  },
  {
    rel: 'shortcut icon',
    href: 'favicon.ico'
  }
]

const TemplateWrapper = ({ children }) => (
  <div>
    <Helmet
      title="Mumineen Calendar"
      meta={ metaTags }
      link={ linkTags }
    />
    <Header />

    { children() }

    <Footer />
  </div>
)

TemplateWrapper.propTypes = {
  children: PropTypes.func,
}

export default TemplateWrapper
