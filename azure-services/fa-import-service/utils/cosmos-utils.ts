import { CosmosClient } from "@azure/cosmos";
import { Stock } from "../models/stock-model";
import { Product } from "../models/product-model";
import { MissingEnvironmentVariablesError } from "../errors/MissingEnvironmentVariablesError";
import { ProductDTO } from "../dto/product-dto";

const endpoint = process.env.COSMOS_DB_ENDPOINT || "";
const key = process.env.COSMOS_DB_KEY || "";

function checkCosmosEnvVariables() {
  const missingEnvVars: string[] = [];

  if (!endpoint) {
    missingEnvVars.push("COSMOS_DB_ENDPOINT");
  }
  if (!key) {
    missingEnvVars.push("COSMOS_DB_KEY");
  }

  if (missingEnvVars.length > 0) {
    throw new MissingEnvironmentVariablesError(
      `The following environment variables are missing: ${missingEnvVars.join(
        ", "
      )}`
    );
  }
}

const client = new CosmosClient({ endpoint, key });
const database = client.database("products-db");
const productsContainer = database.container("products");
const stocksContainer = database.container("stocks");

async function uploadProductFromCSV(
  product: ProductDTO
): Promise<{ productItem: Product; stockItem: Stock }> {
  const { title, description, price, count } = product;
  try {
    const productItem = await addProduct({ title, description, price });
    const stockItem = await addStock({ id: productItem.id, count });

    return { productItem, stockItem };
  } catch (error) {
    throw new Error(`Failed to add product: ${error.message}`);
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

export { checkCosmosEnvVariables, uploadProductFromCSV };
