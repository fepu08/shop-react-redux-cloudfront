import { Product } from "../models/product";

export type ProductDTO = Product & { count: number };
