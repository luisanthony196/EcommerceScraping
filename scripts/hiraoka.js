const { save, prom, writeLogs } = require('../helpers/functions.js')

module.exports = async (page, website) => {
  const {shortUrl, categoryList} = website
  
  let results = new Map()
  let fails = []
  let success = []

  // Iteracion para recorrer la paginacion
  for (const cat of categoryList) {
    results.set(cat.name, [])
    console.log(`${shortUrl}/${cat.url}`)
    await prom(page, `${shortUrl}/${cat.url}`, '#toolbar-amount > span')
    let pages = await page.evaluate(() => {
      let total = document
        .querySelector('#toolbar-amount > span')
        .innerText
      return Math.ceil(total/20)
    })
    if (pages > 1) {pages = 1}
    // console.log(total, Math.ceil(total/20))

    for (let index = 1; index <= pages; index++) {
      let link = `${shortUrl}/${cat.url}=${index}`

      await prom(page, link, '.product > .product-item-info > a')

      const grid_products = await page.evaluate((productListTag) => {
        const productList = document.querySelectorAll(productListTag)
        const productData = []

        for (const product of productList) {
          productData.push(product.href)
        }

        return productData
      }, '.product > .product-item-info > a')

      results.set(cat.name, results.get(cat.name).concat(grid_products))
    }
    
  }
  // Iteracion para recorrer el arreglo de productos
  for (const cat of categoryList) {
    const productLinks = results.get(cat.name)
    for (let index = 0; index < productLinks.length; index++) {
      console.log(productLinks[index])
      try {
        await prom(page, productLinks[index], '.product.media .fotorama__stage > div.fotorama__stage__shaft > div')

        const product = await page.evaluate(() => {
          let title = document
            .querySelector('.product-info-main > .product > h1 > span')
            .innerText
          let available = document
            .querySelector('.conteo-cart')
            .innerText
          let allPrices = document
            .querySelectorAll('.product-info-main > .product-info-price > .price-box .price-container > .price-wrapper')
          let offerPrice = allPrices[0].getAttribute('data-price-amount')
          let normalPrice = null
          if (allPrices[1] != null)
            normalPrice = allPrices[1].getAttribute('data-price-amount')
          let specifications_list = document
            .querySelectorAll('.hiraoka-product-details-datasheet > div > table > tbody > tr')
          let specifications = []
          for (const specification of specifications_list) {
            let caracteristica = specification.children[0].innerHTML.trim()
            if (caracteristica == 'Precio') continue
            let detalle = specification.children[1].innerHTML
            specifications.push({caracteristica, detalle})
          }
          let images_list = document
            .querySelectorAll('.product.media .fotorama__stage > .fotorama__stage__shaft > div > img')
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
