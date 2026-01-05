import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BannerTitle } from '../BannerSlider'

describe('BannerTitle', () => {
  it('não renderiza quando o título é vazio', () => {
    const htmlEmpty = renderToStaticMarkup(<BannerTitle titulo="" />)
    expect(htmlEmpty).toBe('')
  })

  it('não renderiza quando o título é apenas espaços', () => {
    const htmlSpaces = renderToStaticMarkup(<BannerTitle titulo="   " />)
    expect(htmlSpaces).toBe('')
  })

  it('renderiza com a cor branca (#FFFFFF) quando fornecido', () => {
    const html = renderToStaticMarkup(<BannerTitle titulo="Promoções" />)
    expect(html).toContain('<h2')
    expect(html).toContain('text-[#FFFFFF]')
    expect(html).toContain('Promoções')
  })
})

