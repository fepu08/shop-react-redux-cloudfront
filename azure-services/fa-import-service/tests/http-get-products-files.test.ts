import { Context, HttpRequest } from "@azure/functions";
import httpTrigger from "../http-get-import-products-files/index";
import {
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { checkStorageEnvVars, getUploadedContainerClient } from "../utils";
import {MissingEnvironmentVariablesError} from "../errors/MissingEnvironmentVariablesError";

jest.mock("@azure/cosmos", () => {
  const itemsMock = {
    create: jest.fn(),
  };
  const containerMock = jest.fn(() => ({
    items: itemsMock,
  }));
  const databaseMock = jest.fn(() => ({
    container: containerMock,
  }));
  const cosmosClientMock = jest.fn(() => ({
    database: databaseMock,
  }));

  return {
    CosmosClient: cosmosClientMock,
    __mocks__: {
      itemsMock,
      containerMock,
      databaseMock,
      cosmosClientMock,
    },
  };
});

jest.mock("@azure/storage-blob");
jest.mock("../utils");

describe("httpTrigger Function Tests", () => {
  let context: Context;
  let req: HttpRequest;

  beforeEach(() => {
    context = {
      log: jest.fn(),
      res: undefined,
    } as unknown as Context;

    req = {
      query: {},
    } as unknown as HttpRequest;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("Should return 400 if 'name' query parameter is missing", async () => {
    await httpTrigger(context, req);
    expect(context.res).toEqual({
      status: 400,
      body: "Query parameter 'name' is required.",
    });
  });

  test("Should return 500 if environment variables are missing", async () => {
    req.query.name = "testfile.txt";

    (checkStorageEnvVars as jest.Mock).mockImplementation(() => {
      throw new MissingEnvironmentVariablesError(
          "The following environment variables are missing: AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_STORAGE_UPLOADED_CONTAINER_NAME, AZURE_STORAGE_PARSED_CONTAINER_NAME, AzureWebJobsStorage"
      );
    });

    await httpTrigger(context, req);

    expect(context.res).toEqual({
      status: 500,
      body: "The following environment variables are missing: AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_STORAGE_UPLOADED_CONTAINER_NAME, AZURE_STORAGE_PARSED_CONTAINER_NAME, AzureWebJobsStorage",
    });
  });

  test("Should return 500 if error thrown other than MissingEnvironmentVariablesError", async () => {
    req.query.name = "testfile.txt";

    (getUploadedContainerClient as jest.Mock).mockImplementation(() => {
      throw new Error("Something happened")
    });

    await httpTrigger(context, req);

    expect(context.res).toEqual({
      status: 500,
      body: "Failed to generate SAS token.",
    });
  });

  test("Should return 200 and a valid SAS URL", async () => {
    req.query.name = "testfile.txt";
    const mockBlobUrl = "https://mockstorage.blob.core.windows.net/container/testfile.txt";
    const mockSASToken = "mock-sas-token";

    (checkStorageEnvVars as jest.Mock).mockImplementation(() => {});
    (getUploadedContainerClient as jest.Mock).mockResolvedValue({
      getBlockBlobClient: jest.fn().mockReturnValue({
        url: mockBlobUrl,
      }),
    });
    (generateBlobSASQueryParameters as jest.Mock).mockReturnValue({
      toString: () => mockSASToken,
    });

    await httpTrigger(context, req);

    expect(context.res).toEqual({
      status: 200,
      body: { sasUrl: `${mockBlobUrl}?${mockSASToken}` },
    });
    expect(context.log).toHaveBeenCalledWith("Get request with query parameter name: ", "testfile.txt");
    expect(context.log).toHaveBeenCalledWith("Generating blob SAS query parameters...");
  });
});
