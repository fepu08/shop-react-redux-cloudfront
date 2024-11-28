import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  uploadedContainerName,
  sharedKeyCredential,
  checkStorageEnvVars,
  getUploadedContainerClient,
} from "../utils";
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { MissingEnvironmentVariablesError } from "../errors/MissingEnvironmentVariablesError";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const fileName = req.query.name;
    if (!fileName) {
      context.res = {
        status: 400,
        body: "Query parameter 'name' is required.",
      };
      return;
    }

    checkStorageEnvVars();

    // Generate SAS token for the specified blob (file)
    const blobClient = (await getUploadedContainerClient()).getBlockBlobClient(
      fileName
    );

    const sasExpiryDate = new Date();
    sasExpiryDate.setMinutes(sasExpiryDate.getMinutes() + 30);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: uploadedContainerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("w"),
        expiresOn: sasExpiryDate,
      },
      sharedKeyCredential
    ).toString();

    // Construct the SAS URL with the generated token
    const sasUrl = `${blobClient.url}?${sasToken}`;

    context.res = {
      status: 200,
      body: { sasUrl },
    };
  } catch (error) {
    context.log("Error generating SAS token:", error);
    if (error instanceof MissingEnvironmentVariablesError) {
      context.log(`Missing Credentials`);
      context.res = {
        status: 500,
        body: error.message,
      };
      return;
    }
    context.res = {
      status: 500,
      body: "Failed to generate SAS token.",
    };
  }
};

export default httpTrigger;
