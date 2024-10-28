import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { products } from "../mock/products";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
  const productId: string = context.bindingData.productId.toString();
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  context.log(`Get product with ID: ${productId}`);
  const product = products.find((p) => p.id === productId);

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
