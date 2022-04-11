# Create & connect database, only functional in console
CREATE DATABASE scraping;
\c scraping

# Create tables
CREATE TABLE products(
  id SERIAL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  store VARCHAR NOT NULL,
  available VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  offerprice NUMERIC(7,2) NOT NULL,
  normalprice NUMERIC(7,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY(id)
);

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

CREATE TABLE images(
  id SERIAL,
  product_id INT NOT NULL,
  src VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY(id),
  CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id)
);

# See tables
SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';

# See tables details
select table_name, column_name, data_type from information_schema.columns where table_name = 'products';
select table_name, column_name, data_type from information_schema.columns where table_name = 'images';
select table_name, column_name, data_type from information_schema.columns where table_name = 'specifications';

# Restart sequence of id
ALTER SEQUENCE images_id_seq RESTART;
ALTER SEQUENCE specifications_id_seq RESTART;
ALTER SEQUENCE products_id_seq RESTART;

# Empty tables
DELETE FROM images;
DELETE FROM specifications;
DELETE FROM products;

# Delete tables
DROP TABLE images;
DROP TABLE specifications;
DROP TABLE products;

# Count tables
SELECT count(*) FROM products;
