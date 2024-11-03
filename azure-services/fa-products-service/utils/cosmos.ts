import { CosmosClient } from "@azure/cosmos";
import { Stock } from "../models/stock";
import { Product } from "../models/product";

const endpoint = process.env.COSMOS_DB_ENDPOINT as string;
const key = process.env.COSMOS_DB_KEY as string;

if (!endpoint || !key) {
  throw new Error("Missing CosmosDB endpoint in environment variables.");
}

const client = new CosmosClient({ endpoint, key });
const database = client.database("products-db");
const productsContainer = database.container("products");
const stocksContainer = database.container("stocks");

async function fetchAllProducts(): Promise<Product[]> {
  const { resources } = await productsContainer.items
    .readAll<Product>()
    .fetchAll();
  return resources;
}

async function fetchAllStocks(): Promise<Stock[]> {
  const { resources } = await stocksContainer.items.readAll<Stock>().fetchAll();
  return resources;
}

async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const { resource } = await productsContainer.item(id, id).read<Product>();
    return resource ?? null;
  } catch (error: any) {
    if (error.code === 404) {
      // Item not found
      return null;
    } else {
      // Rethrow other errors
      throw error;
    }
  }
}

async function fetchStockById(id: string): Promise<Stock | null> {
  try {
    const { resource } = await stocksContainer.item(id, id).read<Stock>();
    return resource ?? null;
  } catch (error: any) {
    if (error.code === 404) {
      // Item not found
      return null;
    } else {
      // Rethrow other errors
      throw error;
    }
  }
}

async function addProduct(product: Product): Promise<Product> {
  try {
    const { resource } = await productsContainer.items.create<Product>(product);
    return resource;
  } catch (error) {
    throw new Error(`Failed to add product: ${error.message}`);
  }
}

async function modifyStockQuantity(
  product_id: string,
  count: number,
): Promise<Stock | null> {
  try {
    // Fetch the existing stock entry by product_id
    const { resource } = await stocksContainer
      .item(product_id, product_id)
      .read<Stock>();

    if (!resource) {
      const error = new Error(`Stock with product_id ${product_id} not found`);
      Object.defineProperty(error, "code", { value: 404 });
      throw error;
    }

    // Update the quantity in the stock resource
    resource.count = count;

    // Upsert the modified stock back into the container
    const { resource: updatedResource } =
      await stocksContainer.items.upsert<Stock>(resource);
    return updatedResource;
  } catch (error: any) {
    if (error.code === 404) {
      // Handle not found error
      return null;
    } else {
      // Rethrow other errors
      throw new Error(`Failed to modify stock: ${error.message}`);
    }
  }
}

async function addStock(stock: Stock): Promise<Stock> {
  try {
    if (!stock.id) {
      //FIXME: return correct error
      throw new Error("Missing id");
    }
    const { resource } = await stocksContainer.items.create<Stock>(stock);
    return resource;
  } catch (error) {
    throw new Error(`Failed to add stock: ${error.message}`);
  }
}

async function getTotalProducts(): Promise<number> {
  try {
    const query = {
      query: "SELECT VALUE SUM(c.count) FROM c",
    };

    const { resources } = await stocksContainer.items.query(query).fetchAll();
    return resources[0] || 0;
  } catch (error) {
    throw new Error(`Failed to add stock: ${error.message}`);
  }
}

export {
  fetchAllProducts,
  fetchAllStocks,
  fetchProductById,
  fetchStockById,
  addProduct,
  addStock,
  modifyStockQuantity,
  getTotalProducts,
};
