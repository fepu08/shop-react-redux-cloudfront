import { Product } from "../models/product-model";

export type ProductDTO = Product & { count: number };
