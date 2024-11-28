import { Context } from "@azure/functions";
import { Readable } from "stream";
import * as csvParser from "csv-parser";

async function parseCSVFromBlob(
  blob: Buffer,
  context: Context,
  options?: { validatorModel?: Record<string, string> }
) {
  context.log("Parsing blob...");

  return new Promise((resolve, reject) => {
    const parsedRecords: any[] = [];
    const readableStream = Readable.from(blob);

    const validateType = (value: any, expectedType: string): boolean => {
      switch (expectedType) {
        case "string":
          return typeof value === "string";
        case "number":
          return !isNaN(Number(value));
        case "boolean":
          return value === "true" || value === "false";
        default:
          return true; // Accept all types if no specific validation is provided
      }
    };

    readableStream
      .pipe(
        csvParser({
          separator: ";",
          mapHeaders: ({ header }) =>
            header.charAt(0).toLowerCase() + header.slice(1),
        })
      )
      .on("headers", (headers) => {
        if (options?.validatorModel) {
          const expectedHeaders = Object.keys(options.validatorModel);
          const actualHeaders = headers;
          const hasInvalidHeaders = !expectedHeaders.every((header) =>
            actualHeaders.includes(header)
          );

          if (hasInvalidHeaders) {
            const validationError = new Error(
              `Invalid headers detected. Expected: ${expectedHeaders.join(
                ", "
              )}, Found: ${actualHeaders.join(", ")}`
            );
            context.log.error(validationError.message);
            //readableStream.destroy(validationError);
            reject(validationError);
            return;
          }
        }
      })
      .on("data", (data) => {
        if (options?.validatorModel) {
          const isValidRow = Object.keys(options.validatorModel).every(
            (key) => {
              if (!data.hasOwnProperty(key)) {
                context.log.warn(
                  `Missing key "${key}" in row: ${JSON.stringify(data)}`
                );
                return false; // Missing required key
              }

              const expectedType = options.validatorModel[key];
              const value = data[key];
              const isValidType = validateType(value, expectedType);

              if (!isValidType) {
                context.log.warn(
                  `Invalid type for key "${key}". Expected: ${expectedType}, Found: ${typeof value} (${value})`
                );
                return false; // Type mismatch
              }

              return true;
            }
          );

          if (!isValidRow) {
            context.log.warn(`Invalid row skipped: ${JSON.stringify(data)}`);
            return; // Skip invalid rows
          }
        }

        context.log("Processing row:", data);
        parsedRecords.push(data);
      })
      .on("end", () => {
        context.log("CSV parsing completed successfully.");
        resolve(parsedRecords);
      })
      .on("error", (error) => {
        context.log.error("Error while parsing CSV:", error.message);
        reject(error);
      });
  });
}

export { parseCSVFromBlob };
