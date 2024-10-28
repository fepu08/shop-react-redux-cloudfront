import "dotenv/config";
import { generateMockData } from "./generate_fake_data.mjs";
import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = "products-db";
const productsContainerId = "products";
const stockContainerId = "stocks";

if (!endpoint || !key) {
  throw new Error("Missing CosmosDB Config");
}

const client = new CosmosClient({ endpoint, key });

async function seedDatabase() {
  const { products, stocks } = generateMockData(100);

  try {
    // Create or get database
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });

    // Create or get products container
    const { container: productContainer } =
      await database.containers.createIfNotExists({ id: productsContainerId });

    // Create or get stocks container
    const { container: stockContainer } =
      await database.containers.createIfNotExists({ id: stockContainerId });

    // Insert products
    for (const product of products) {
      await productContainer.items.create(product);
    }

    console.log(`Inserted ${products.length} products into Cosmos DB.`);

    for (const stock of stocks) {
      await stockContainer.items.create(stock);
    }

    console.log(`Inserted ${stocks.length} stock records into Cosmos DB.`);
  } catch (err) {
    console.log("Failed");
    console.log(err);
  }
}

// Run the seeding function
seedDatabase()
  .then(() => console.log("Database seeding complete."))
  .catch((error) => console.error("Error seeding database:", error));
