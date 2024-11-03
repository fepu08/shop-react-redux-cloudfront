import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ProductService } from "../services/product-service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  try {
    context.log(`Incoming request: ${JSON.stringify(req)}`);
    const headers = {
      "Content-Type": "application/json",
    };
    // Validate the request body
    const { title, description, price, count } = req.body;

    if (!title || !description || typeof price !== "number") {
      context.res = {
        status: 400,
        headers,
        body: {
          msg: "Please provide a valid title, description, and price for the product.",
        },
      };
      return;
    }

    const createdProduct = await ProductService.addProduct({
      title,
      description,
      price,
      count: count ?? 0,
    });

    // Return success response
    context.res = {
      status: 201,
      headers,
      body: createdProduct,
    };
  } catch (error) {
    // Handle errors
    context.log("Error adding product:", error.message);
    context.res = {
      status: 500,
      body: "An error occurred while adding the product.",
    };
  }
};

export default httpTrigger;
