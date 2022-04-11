const {insert} = require('../database/controller')
const fs = require('fs')
const path = require('path')

const save = async (link, product) => {
  const product_id = await insert
    .insertProduct(
      product.title,
      link,
      product.store,
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

const prom = async (page, link, tag) => {
  await Promise.all([
    page.waitForNavigation(),
    page.goto(link),
    page.waitForSelector(tag)
  ])
}

const writeLogs = (name, success, fails) => {
  fs.writeFileSync(
    path.join(__dirname, '..', 'register', `${name}.json`),
    JSON.stringify({success, fails}, null, 4),
    'utf8'
  )
}

module.exports = {save, prom, writeLogs}
