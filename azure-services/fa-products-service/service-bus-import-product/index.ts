import { AzureFunction, Context } from "@azure/functions";
import { ProductDTO } from "../dto/product-dto";
import { ProductService } from "../services/product-service";

export const index: AzureFunction = async (
  context: Context,
  myQueueItem: any,
): Promise<void> => {
  context.log(
    "Service Bus queue trigger function processed message:",
    myQueueItem,
  );

  const items = validateQueueItem(myQueueItem, context);
  context.log("Items: ", items);
  if (items.length < 1) {
    context.log("No items to upload");
    return;
  }

  context.log("Uploading items to CosmosDB...");
  for (const item of items) {
    context.log("Item to upload: ", item);
    await ProductService.addProduct(item);
  }
};

export function validateQueueItem(queueItem: any, context: Context) {
  const items = Array.isArray(queueItem) ? queueItem : [queueItem];
  const res: ProductDTO[] = items
    .map((item) => {
      if (!isProductDTO(item)) {
        context.log.error("Item is invalid:", item);
        return null;
      }

      return parseItem(item);
    })
    .filter((parsedItem): parsedItem is ProductDTO => parsedItem !== null);

  return res;
}

export function parseItem(item: any): ProductDTO {
  return {
    title: item.title,
    description: item.description,
    price: item.price,
    count: item.count,
  };
}

export function isProductDTO(item: any): item is ProductDTO {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const example: ProductDTO = {
    title: "Some title",
    description: "Some description",
    price: 123,
    count: 456,
  };

  const requiredKeys: Array<keyof ProductDTO> = Object.keys(example) as Array<
    keyof ProductDTO
  >;

  return requiredKeys.every((key) => {
    return key in item && item[key] !== undefined;
  });
}
