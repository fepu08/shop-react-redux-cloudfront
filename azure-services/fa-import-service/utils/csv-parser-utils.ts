import { Context } from "@azure/functions";
import * as csv from "csv-parser";

async function parseCSVFromBlob(blob: Buffer, context: Context) {
  return new Promise<void>((resolve, reject) => {
    const csvStream = csv()
      .on("data", (data) => {
        context.log(`Parsed Record: ${JSON.stringify(data)}`);
      })
      .on("end", () => {
        context.log("CSV parsing completed.");
        resolve();
      })
      .on("error", (error) => {
        context.log.error("Error parsing CSV:", error);
        reject(error);
      });

    csvStream.write(blob);
    csvStream.end();
  });
}

export { parseCSVFromBlob };
