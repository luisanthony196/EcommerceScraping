require('dotenv').config()
const {Pool} = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  dialect:process.env.DB_DIALECT,
  ssl: process.env.DB_SSL ? true : false
})

module.exports = pool
