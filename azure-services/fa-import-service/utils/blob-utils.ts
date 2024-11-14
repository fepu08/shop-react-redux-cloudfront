import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { MissingEnvironmentVariablesError } from "../errors/MissingEnvironmentVariablesError";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_UPLOADED_CONTAINER_NAME;

const missingEnvVars: string[] = [];

if (!accountName) {
  missingEnvVars.push("accountName");
}

if (!accountKey) {
  missingEnvVars.push("accountKey");
}

if (!containerName) {
  missingEnvVars.push("containerName");
}

if (missingEnvVars.length > 0) {
  throw new MissingEnvironmentVariablesError(
    `The following environment variables are missing: ${JSON.stringify(
      missingEnvVars
    )}`
  );
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

export {
  accountKey,
  accountName,
  containerName,
  sharedKeyCredential,
  blobServiceClient,
};
