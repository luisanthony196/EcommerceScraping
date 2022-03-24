const fs = require('fs')
const path = require('path')
const {insert} = require('../database/controller')

module.exports = async (page, website) => {
  const {shortUrl, categoryList} = website
  
  let results = []
  let fails = []
  let success = []

  // Iteracion para recorrer la paginacion
  for (const cat of categoryList) {
    await prom(`${shortUrl}/${cat}`, '#toolbar-amount > span')
    let pages = await page.evaluate(() => {
      let total = document
        .querySelector('#toolbar-amount > span')
        .innerText
      return Math.ceil(total/20)
    })
    if (pages > 2) {pages = 2}
    // console.log(total, Math.ceil(total/20))

    for (let index = 1; index <= pages; index++) {
      let link = `${shortUrl}/${cat}?p=${index}`

      await prom(link, ".product > .product-item-info > a")

      const grid_products = await page.evaluate((productListTag) => {
        const productList = document.querySelectorAll(productListTag)
        const productData = []

        for (const product of productList) {
          productData.push(product.href)
        }

        return productData
      }, ".product > .product-item-info > a")

      results = results.concat(grid_products)
    }
    
  }

  // Eliminamos elementos repetidos
  let productLinks = [...new Set(results)]
  console.log(productLinks.length)

  // Iteracion para recorrer el arreglo de productos
  for (let index = 0; index < productLinks.length; index++) {
    console.log(productLinks[index])
    try {
      await prom(productLinks[index], '.product.media .fotorama__stage > div.fotorama__stage__shaft > div')
      // await prom(productLinks[index], '.product.media .fotorama__stage > .fotorama__stage__shaft > .fotorama__active > img')
      // await prom(productLinks[index], '.product-info-main > .product-info-price > .price-box .price-container > .price-wrapper')

      let category = productLinks[index].match(/([A-z-]+)(\/[A-z0-9-.]+)$/)[1]

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
          caracteristica = specification.children[0].innerHTML.trim()
          if (caracteristica == 'Precio') continue
          detalle = specification.children[1].innerHTML
          // caracteristica = specification.children[0].innerHTML
          // detalle = specification.innerHTML.match(/\:\s(.+)/)[1]
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
      product['category'] = category
      await save(productLinks[index], product)
      success.push(productLinks[index])
      console.log(index, product)
    } catch (error) {
      fails.push(productLinks[index])
      console.log(error)
    }
  }

  // Function que guarda los datos en la db
  async function save(link, product) {
      const product_id = await insert
        .insertProduct(
          product.title,
          link,
          website.scriptName,
          product.available,
          product.category,
          parseFloat(product.offerPrice),
          parseFloat(product.normalPrice))
        .catch(err => (
            console.log('Error insertando producto =>', err)
          ))
      insert.insertSpecifications(product_id, product.specifications)
        .catch(err => (
            console.log('Error insertando especificaciones =>', err)
          ))
      insert.insertImages(product_id, product.images)
        .catch(err => (
            console.log('Error insertando images =>', err)
          ))
  }

  async function prom(link, tag) {
    await Promise.all([
      page.waitForNavigation(),
      page.goto(link),
      page.waitForSelector(tag)
    ])
  }

  fs.writeFileSync(
    path.join(__dirname, '..', 'register', `${website.scriptName}.json`),
    JSON.stringify({success, fails}, null, 4),
    'utf8'
  )

}
