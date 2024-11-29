import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { MissingEnvironmentVariablesError } from "../errors/MissingEnvironmentVariablesError";
import { Context } from "vm";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const uploadedContainerName =
  process.env.AZURE_STORAGE_UPLOADED_CONTAINER_NAME || "";
const parsedContainerName =
  process.env.AZURE_STORAGE_PARSED_CONTAINER_NAME || "";
const connectionString = process.env.AzureWebJobsStorage || "";

function checkStorageEnvVars() {
  const missingEnvVars: string[] = [];

  if (!accountName) {
    missingEnvVars.push("AZURE_STORAGE_ACCOUNT_NAME");
  }
  if (!accountKey) {
    missingEnvVars.push("AZURE_STORAGE_ACCOUNT_KEY");
  }
  if (!uploadedContainerName) {
    missingEnvVars.push("AZURE_STORAGE_UPLOADED_CONTAINER_NAME");
  }
  if (!parsedContainerName) {
    missingEnvVars.push("AZURE_STORAGE_PARSED_CONTAINER_NAME");
  }
  if (!connectionString) {
    missingEnvVars.push("AzureWebJobsStorage");
  }
  if (missingEnvVars.length > 0) {
    throw new MissingEnvironmentVariablesError(
      `The following environment variables are missing: ${missingEnvVars.join(
        ", "
      )}`
    );
  }
}

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

async function moveBlob(fileName: string, context: Context) {
  const uploadedContainerClient = await getUploadedContainerClient();
  const parsedContainerClient = await getParsedContainerClient();

  const uploadedBlobClient = await uploadedContainerClient.getBlockBlobClient(
    fileName
  );

  const parsedBlobClient = parsedContainerClient.getBlockBlobClient(fileName);

  await parsedBlobClient.beginCopyFromURL(uploadedBlobClient.url);
  context.log(`Blob copied to "parsed" container: "${fileName}"`);
  await uploadedBlobClient.delete();
  context.log(`Blob deleted from "uploaded" container: "${fileName}"`);
}

async function removeBlob(fileName: string, context: Context) {
  const uploadedContainerClient = await getUploadedContainerClient();
  const uploadedBlobClient = await uploadedContainerClient.getBlockBlobClient(
    fileName
  );
  await uploadedBlobClient.delete();
  context.log(`Blob deleted from "uploaded" container: "${fileName}"`);
}

async function getContainerClient(
  containerName: string
): Promise<ContainerClient> {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Check if the container already exists
  const exists = await containerClient.exists();
  if (exists) {
    console.log(`Container '${containerName}' already exists.`);
    return containerClient;
  }

  // Create the container if it does not exist
  try {
    await containerClient.create();
    console.log(`Container '${containerName}' created successfully.`);
    return containerClient;
  } catch (error) {
    console.error(
      `Failed to create container '${containerName}':`,
      error.message
    );
    throw error;
  }
}

async function getUploadedContainerClient() {
  return await getContainerClient(uploadedContainerName);
}

async function getParsedContainerClient() {
  return await getContainerClient(parsedContainerName);
}

export {
  accountKey,
  accountName,
  uploadedContainerName,
  parsedContainerName,
  sharedKeyCredential,
  blobServiceClient,
  getUploadedContainerClient,
  getParsedContainerClient,
  moveBlob,
  removeBlob,
  checkStorageEnvVars,
};
