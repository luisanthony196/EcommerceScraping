const fs = require('fs')
const path = require('path')
const {insert} = require('../database/controller')

module.exports = async (page, website) => {
  const {shortUrl, pages, selectors} = website
  
  let results = []
  let fails = []
  let success = []

  // Iteracion para recorrer la paginacion
  for (let index = 1; index <= pages; index++) {
    let link = `${shortUrl}${index}`

    await prom(link, selectors.productListTag)

    const grid_products = await page.evaluate((productListTag) => {
      const productList = document.querySelectorAll(productListTag)
      const productData = []

      for (const product of productList) {
        productData.push(product.href)
      }

      return productData
    }, selectors.productListTag)

    results = results.concat(grid_products)
  }

  // Eliminamos elementos repetidos
  let productLinks = [...new Set(results)]
  console.log(productLinks.length)

  // Iteracion para recorrer el arreglo de productos
  for (let index = 0; index < productLinks.length; index++) {
    console.log(productLinks[index])
    try {
      await prom(productLinks[index], '.prices > ol > li.prices-0 > div > span')

      const product = await page.evaluate(() => {
        let title = document
          .querySelector('.product-name')
          .innerText
        let available = document
          .querySelector('.stock-quantity')
          .innerText
        let category = document
          .querySelector('#breadcrumb > ol > li:last-child > a')
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
        return {title, available, category, offerPrice, normalPrice, specifications, images}
      })

      // Save data in database
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
