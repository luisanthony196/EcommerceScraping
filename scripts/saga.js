const fs = require('fs')
const path = require('path')
const controller = require('../database/controller')

module.exports = async (page, website) => {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (['stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const {shortUrl, pages, selectors} = website
  
  let results = []
  let fails = []

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
  let info = []

  for (let index = 0; index < productLinks.length; index++) {
    console.log(productLinks[index])
    try {
      await prom(productLinks[index], '.prices > ol > li.prices-0 > div > span')

      const product = await page.evaluate(() => {
        let title = document
          .querySelector('.product-name')
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
          caracteristica = specification.children[0].innerHTML
          detalle = specification.children[1].innerHTML
          // caracteristica = specification.children[0].innerHTML
          // detalle = specification.innerHTML.match(/\:\s(.+)/)[1]
          specifications.push({caracteristica, detalle})
        }
        let images_list = document
          .querySelectorAll('.pdp-image-section .image-slider > div > div > img')
        let images = []
        for (const image of images_list) {
          images.push(image.src)
        }
        return {title, category, offerPrice, normalPrice, specifications, images}
      })

      // Save data in database
      await save(productLinks[index], product)
      console.log(index, product)
      info.push(product)
    } catch (error) {
      fails.push(productLinks[index])
      console.log(error)
    }
  }

  // Function que guarda los datos en la db
  async function save(link, product) {
      const product_id = await controller
        .insertProduct(
          product.title,
          link,
          product.category,
          parseFloat(product.offerPrice),
          parseFloat(product.normalPrice))
        .catch(err => (
            console.log('Error insertando producto =>', err)
          ))
      controller.insertSpecifications(product_id, product.specifications)
        .catch(err => (
            console.log('Error insertando especificaciones =>', err)
          ))
      controller.insertImages(product_id, product.images)
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
    path.join(__dirname, '..', 'fails', `${website.scriptName}.json`),
    JSON.stringify(fails, null, 4),
    'utf8'
  )

}
