import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { MissingEnvironmentVariablesError } from "../errors/MissingEnvironmentVariablesError";
import { Context } from "vm";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const uploadedContainerName = process.env.AZURE_STORAGE_UPLOADED_CONTAINER_NAME;
const parsedContainerName = process.env.AZURE_STORAGE_PARSED_CONTAINER_NAME;
const azureWebJobsStorage = process.env.AzureWebJobsStorage;
const connectionString = process.env.AzureWebJobsStorage;

const missingEnvVars: string[] = [];

if (!accountName) {
  missingEnvVars.push("accountName");
}
if (!accountKey) {
  missingEnvVars.push("accountKey");
}
if (!uploadedContainerName) {
  missingEnvVars.push("containerName");
}
if (!parsedContainerName) {
  missingEnvVars.push("parsedContainerName");
}
if (!azureWebJobsStorage) {
  missingEnvVars.push("azureWebJobsStorage");
}
if (!connectionString) {
  missingEnvVars.push("connectionString");
}
if (missingEnvVars.length > 0) {
  throw new MissingEnvironmentVariablesError(
    `The following environment variables are missing: ${JSON.stringify(
      missingEnvVars
    )}`
  );
}

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const uploadedContainerClient = blobServiceClient.getContainerClient(
  uploadedContainerName
);
const parsedContainerClient =
  blobServiceClient.getContainerClient(parsedContainerName);

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

async function moveBlob(fileName: string, context: Context) {
  const uploadedBlobClient =
    uploadedContainerClient.getBlockBlobClient(fileName);
  const parsedBlobClient = parsedContainerClient.getBlockBlobClient(fileName);

  await parsedBlobClient.beginCopyFromURL(uploadedBlobClient.url);
  context.log(`Blob copied to "parsed" container: "${fileName}"`);
  await uploadedBlobClient.delete();
  context.log(`Blob deleted from "uploaded" container: "${fileName}"`);
}

export {
  accountKey,
  accountName,
  uploadedContainerName,
  parsedContainerName,
  sharedKeyCredential,
  blobServiceClient,
  uploadedContainerClient,
  parsedContainerClient,
  moveBlob,
};
