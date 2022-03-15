const conexion = require('./connection')

module.exports = {
  async insertProduct(title, link, store, category, offerPrice, normalPrice) {
    let resultados = await conexion.query(`insert into products
      (title, link, store, category, offerPrice, normalPrice)
      values
      ($1, $2, $3, $4, $5, $6)
      RETURNING id`, [title, link, store, category, offerPrice, normalPrice])
    return resultados.rows[0].id
  },

  async insertSpecifications(product_id, specifications) {
    for (const spe of specifications) {
      await conexion.query(`insert into specifications
        (product_id, feature, detail)
        values ($1, $2, $3)`,
        [product_id, spe.caracteristica, spe.detalle])
    }
  },

  async insertImages(product_id, images) {
    for (const src of images) {
      await conexion.query(`insert into images
        (product_id, src)
        values ($1, $2)`,
        [product_id, src])
    }
  }
}
