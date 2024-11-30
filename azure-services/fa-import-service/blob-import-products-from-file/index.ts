import { AzureFunction, Context } from "@azure/functions";
import {
  moveBlob,
  parseCSVFromBlob,
  removeBlob,
  uploadedContainerName,
} from "../utils";
import { ProductDTO } from "../dto/product-dto";
import { ServiceBusClient } from "@azure/service-bus";

const blobTrigger: AzureFunction = async function (
  context: Context,
  blob: any
): Promise<void> {
  context.log("Invoked");
  const serviceBusConnectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
  const queueName = process.env.SERVICE_BUS_QUEUE_NAME;

  if (!serviceBusConnectionString || !queueName) {
    context.log.error(
      "Service Bus connection string or topic name not found in environment variables."
    );
    return;
  }

  const serviceBusClient = new ServiceBusClient(serviceBusConnectionString);
  const sender = serviceBusClient.createSender(queueName);

  try {
    context.log(
      `Processing file: "${context.bindingData.name}" in container: "${uploadedContainerName}"`
    );

    const productDTOValidatorModel: Record<string, string> = {
      title: "string",
      description: "string",
      price: "number",
      count: "number",
    };
    const parsedProducts = (await parseCSVFromBlob(blob, context, {
      validatorModel: productDTOValidatorModel,
    })) as ProductDTO[];

    context.log("Sending parsed items to Service Bus topic...");

    await sender.sendMessages({
      body: parsedProducts,
      contentType: "application/json",
    });

    context.log("All products sent to Service Bus topic successfully.");

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
