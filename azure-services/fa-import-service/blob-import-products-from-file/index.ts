import { AzureFunction, Context } from "@azure/functions";
import {
  checkCosmosEnvVariables,
  moveBlob,
  parseCSVFromBlob,
  removeBlob,
  uploadedContainerName,
  uploadProductFromCSV,
} from "../utils";
import { ProductDTO } from "../dto/product-dto";

const blobTrigger: AzureFunction = async function (
  context: Context,
  blob: any
): Promise<void> {
  try {
    context.log("Checking environment variables");
    checkCosmosEnvVariables();

    context.log(
      `Processing file: "${context.bindingData.name}" in container: "${uploadedContainerName}"`
    );

    const productDTOValidatorModel: Record<string, string> = {
      title: "string",
      description: "string",
      price: "number",
      count: "number",
    };
    const parsed = (await parseCSVFromBlob(blob, context, {
      validatorModel: productDTOValidatorModel,
    })) as ProductDTO[];
    context.log("parsed", parsed);

    context.log("Uploading parsed items to CosmosDB...");
    for (let i = 0; i < parsed.length; i++) {
      uploadProductFromCSV(parsed[i]);
    }

    await moveBlob(context.bindingData.name, context);
  } catch (error) {
    context.log.error("Error processing blob:", error);
    try {
      await removeBlob(context.bindingData.name, context);
    } catch (error) {
      context.log.error("Cannot remove blob:", context.bindingData.name);
      context.log.error("Error processing blob:", error);
    }
  }
};

export default blobTrigger;
