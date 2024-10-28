import { faker } from "@faker-js/faker";

/**
 * @returns {import('./models').Product} Fake product
 */
function createRandomProduct() {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
  };
}

/**
 * @param {string} product_id
 * @returns {import('./models').Stock} Fake stock
 */
function createRandomStock(product_id) {
  return {
    product_id,
    count: faker.number.int({ min: 1, max: 1000 }),
  };
}

/**
 *
 * @param {number} count
 * @returns {{products: import('./models').Product, stocks: import('./models').Stock}}
 */
export function generateMockData(count) {
  const products = faker.helpers.multiple(createRandomProduct, {
    count,
  });

  const stocks = [];

  products.forEach((product) => {
    stocks.push(createRandomStock(product.id));
  });
  return { products, stocks };
}
