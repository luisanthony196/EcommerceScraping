# Create & connect database
CREATE DATABASE scraping;
\c scraping

# Create tables
CREATE TABLE products(
  id SERIAL,
  title VARCHAR NOT NULL,
  store VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  offerprice NUMERIC(7,2) NOT NULL,
  normalprice NUMERIC(7,2),
  PRIMARY KEY(id)
);

CREATE TABLE specifications(
  id SERIAL,
  product_id INT NOT NULL,
  feature VARCHAR,
  detail VARCHAR,
  PRIMARY KEY(id),
  CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE images(
  id SERIAL,
  product_id INT NOT NULL,
  src VARCHAR NOT NULL,
  PRIMARY KEY(id),
  CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id)
);

# See tables details
\d products
\d images
\d specifications

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
