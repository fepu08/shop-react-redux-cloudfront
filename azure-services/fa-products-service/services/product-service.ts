import { Context } from "vm";
import { ProductDTO } from "../dto/product-dto";
import { Product } from "../models/product";
import {
  fetchAllProducts,
  fetchAllStocks,
  fetchProductById,
  fetchStockById,
  addProduct,
  addStock,
  getTotalProducts,
} from "../utils";

export class ProductService {
  static async getProducts(): Promise<ProductDTO[]> {
    const products = await fetchAllProducts();
    const stocks = await fetchAllStocks();

    return products.map((product) => {
      const count = stocks.find((item) => item.id === product.id).count;
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count,
      } as ProductDTO;
    });
  }

  static async getProductById(id: string): Promise<ProductDTO | null> {
    const product = await fetchProductById(id);
    if (!product) return null;
    const stock = await fetchStockById(id);

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stock.count,
    } as ProductDTO;
  }

  static async addProduct(product: ProductDTO): Promise<ProductDTO> {
    const prod = await addProduct({
      title: product.title,
      description: product.description,
      price: product.price,
    });

    const stock = await addStock({ id: prod.id, count: product.count });

    return {
      id: prod.id,
      title: prod.title,
      description: prod.description,
      price: prod.price,
      count: stock.count,
    } as ProductDTO;
  }

  static async modifyProductCount(id: string): Promise<Product | null> {
    return null;
  }

  static async deleteProduct(id: string): Promise<Product | null> {
    return null;
  }

  static async getTotalProducts(): Promise<number> {
    return getTotalProducts();
  }
}
