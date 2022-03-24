const conexion = require('./connection')

const insert = {
  async insertProduct(title, link, store, available, category, offerPrice, normalPrice) {
    let resultados = await conexion.query(`insert into products
      (title, link, store, available, category, offerPrice, normalPrice)
      values
      ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`, [title, link, store, available, category, offerPrice, normalPrice])
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

const reset = {
  async emptyTables() {
    // await conexion.query('DELETE FROM "images";')
    // await conexion.query('DELETE FROM "specifications";')
    // await conexion.query('DELETE FROM "products";')
    await conexion.query('DROP TABLE IF EXISTS "specifications";')
    await conexion.query('DROP TABLE IF EXISTS "images";')
    await conexion.query('DROP TABLE IF EXISTS "products";')
  },
  async createTables() {
    await conexion.query(`
      CREATE TABLE products(
        id SERIAL,
        title VARCHAR NOT NULL,
        store VARCHAR NOT NULL,
        link VARCHAR NOT NULL,
        available VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        offerprice NUMERIC(7,2) NOT NULL,
        normalprice NUMERIC(7,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY(id)
      );
      `)

    await conexion.query(`
      CREATE TABLE specifications(
        id SERIAL,
        product_id INT NOT NULL,
        feature VARCHAR,
        detail VARCHAR,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY(id),
        CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id)
      );
      `)

    await conexion.query(`
      CREATE TABLE images(
        id SERIAL,
        product_id INT NOT NULL,
        src VARCHAR NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY(id),
        CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id)
      );
      `)
  }
}

module.exports = {insert, reset}
