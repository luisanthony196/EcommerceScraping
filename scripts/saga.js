const { save, prom, writeLogs } = require('../helpers/functions.js')

module.exports = async (page, website) => {
  const {shortUrl, categoryList} = website
  
  const results = new Map()
  let fails = []
  let success = []

  // Iteracion para recorrer la paginacion
  for (const cat of categoryList) {
    results.set(cat.name, [])
    await prom(page, `${shortUrl}/${cat.url}`, '#testId-searchResults-actionBar-bottom .pagination > ol > li:last-child')
    let pages = await page.evaluate(() => {
      let total = document
        .querySelector('#testId-searchResults-actionBar-bottom .pagination > ol > li:last-child')
        .innerText
      return Math.ceil(total/48)
    })
    if (pages > 1) {pages = 1}
    // console.log(total, Math.ceil(total/20))

    for (let index = 1; index <= pages; index++) {
      let link = `${shortUrl}/${cat.url}?page=${index}`

      await prom(page, link, '.search-results--products > div > .pod > div > div > a')

      const grid_products = await page.evaluate((productListTag) => {
        const productList = document.querySelectorAll(productListTag)
        const productData = []

        for (const product of productList) {
          productData.push(product.href)
        }

        return productData
      }, '.search-results--products > div > .pod > div > div > a')

      results.set(cat.name, results.get(cat.name).concat(grid_products))
    }
    
  }
  // Iteracion para recorrer el arreglo de productos
  for (const cat of categoryList) {
    const productLinks = results.get(cat.name)
    for (let index = 0; index < productLinks.length; index++) {
      try {
        await prom(page, productLinks[index], '.prices > ol > li.prices-0 > div > span')

        const product = await page.evaluate(() => {
          let title = document
            .querySelector('.product-name')
            .innerText
          let available = document
            .querySelector('.stock-quantity')
            .innerText
          let offerPrice = document
            .querySelector('.prices > ol > li.prices-0 > div > span')
            .innerText.match(/([\d.,]+)/)[1].replace(',', '')
          let normalPrice = document
            .querySelector('.prices > ol > li.prices-1 > div > span')
          if (normalPrice != null)
            normalPrice = normalPrice
              .innerHTML.match(/([\d.,]+)/)[1].replace(',', '')
          let specifications_list = document
            .querySelectorAll('.specification > .container > .bodyContainer > table > tbody > tr')
          let specifications = []
          for (const specification of specifications_list) {
            let caracteristica = specification.children[0].innerHTML
            let detalle = specification.children[1].innerHTML
            specifications.push({caracteristica, detalle})
          }
          let images_list = document
            .querySelectorAll('.pdp-image-section .image-slider > div > div > img')
          let images = []
          for (const image of images_list) {
            images.push(image.src)
          }
          return {title, available, offerPrice, normalPrice, specifications, images}
        })
        // Save data in database
        product['category'] = cat.name
        product['store'] = website.scriptName
        await save(productLinks[index], product)
        success.push(productLinks[index])
        console.log(index, product)
      } catch (error) {
        fails.push(productLinks[index])
        console.log(error)
      }
    }
  }

  writeLogs(website.scriptName, success, fails)

}
