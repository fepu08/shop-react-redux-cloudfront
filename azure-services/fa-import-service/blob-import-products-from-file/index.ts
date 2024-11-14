import { AzureFunction, Context } from "@azure/functions";
import { moveBlob, parseCSVFromBlob, uploadedContainerName } from "../utils";

const blobTrigger: AzureFunction = async function (
  context: Context,
  blob: any
): Promise<void> {
  try {
    context.log(
      `Processing file: "${context.bindingData.name}" in container: "${uploadedContainerName}"`
    );
    await parseCSVFromBlob(blob, context);
    await moveBlob(context.bindingData.name, context);
  } catch (error) {
    context.log.error("Error processing blob:", error);
    throw error;
  }
};

export default blobTrigger;
