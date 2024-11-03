import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ProductService } from "../services/product-service";
import { ProductDTO } from "../dto/product-dto";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  context.log(`Incoming request: ${JSON.stringify(req)}`);
  const productId: string = context.bindingData.productId.toString();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (productId.toLocaleLowerCase() === "total") {
    context.log("Get total number of products");
    const num = await ProductService.getTotalProducts();
    context.res = {
      headers,
      body: num,
    };
    return;
  }

  context.log(`Get product with ID: ${productId}`);
  const product: ProductDTO | null =
    await ProductService.getProductById(productId);

  if (product) {
    context.res = {
      // status: 200, /* Defaults to 200 */
      headers,
      body: product,
    };
  } else {
    context.res = {
      status: 404,
      headers,
      body: { message: "Product not found" },
    };
  }
};

export default httpTrigger;
