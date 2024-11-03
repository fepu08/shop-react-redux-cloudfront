import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ProductService } from "../services/product-service";
import { ProductDTO } from "../dto/product-dto";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  try {
    context.log(`Incoming request: ${JSON.stringify(req)}`);
    const res: ProductDTO[] = await ProductService.getProducts();
    context.res = {
      // status: 200, /* Defaults to 200 */
      headers: {
        "Content-Type": "application/json",
      },
      body: res,
    };
  } catch (error) {
    context.res = {
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        message: error.message || "server error",
      },
      status: 500,
    };
  }
};

export default httpTrigger;
