import { Context } from "@azure/functions";
import { parseCSVFromBlob } from "../utils/csv-parser-utils";

describe("parseCSVFromBlob", () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      log: Object.assign(jest.fn(), {
        info: console.log,
        warn: console.warn,
        error: console.error,
      }),
    } as unknown as Context;
  });

  it("should parse valid CSV data correctly", async () => {
    const csvData = "name;age;isStudent\nAlice;25;true\nBob;30;false";

    const validatorModel = {
      name: "string",
      age: "number",
      isStudent: "boolean",
    };

    const result = await parseCSVFromBlob(Buffer.from(csvData), mockContext, {
      validatorModel,
    });
    console.log("asd", result);

    expect(result).toEqual([
      { name: "Alice", age: "25", isStudent: "true" },
      { name: "Bob", age: "30", isStudent: "false" },
    ]);
  });

  it("should handle invalid headers", async () => {
    const csvData = "name;gender;isStudent\nAlice;F;true";

    const validatorModel = {
      name: "string",
      age: "number",
      isStudent: "boolean",
    };

    expect(
      async () =>
        await parseCSVFromBlob(Buffer.from(csvData), mockContext, {
          validatorModel,
        })
    ).rejects.toThrow(
      "Invalid headers detected. Expected: name, age, isStudent, Found: name, gender, isStudent"
    );
  });

  it.skip("should skip rows with invalid data types", async () => {
    const csvData = `name;age;isStudent
Alice;twenty-five;true
Bob;30;false`;

    const validatorModel = {
      name: "string",
      age: "number",
      isStudent: "boolean",
    };

    const result = await parseCSVFromBlob(Buffer.from(csvData), mockContext, {
      validatorModel,
    });

    expect(result).toEqual([{ name: "Bob", age: "30", isStudent: "false" }]);
    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Invalid type for key")
    );
    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Invalid row skipped")
    );
  });

  it.skip("should handle empty CSV data gracefully", async () => {
    const csvData = ``;

    const result = await parseCSVFromBlob(Buffer.from(csvData), mockContext);

    expect(result).toEqual([]);
    expect(mockContext.log.info).toHaveBeenCalledWith(
      "CSV parsing completed successfully."
    );
  });

  it.skip("should handle errors during parsing", async () => {
    const csvData = `name;age;isStudent
Alice;25;true`;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    jest.spyOn(require("csv-parser"), "default").mockImplementation(() => {
      throw new Error("Mocked parsing error");
    });

    await expect(
      parseCSVFromBlob(Buffer.from(csvData), mockContext)
    ).rejects.toThrow("Mocked parsing error");

    expect(mockContext.log.error).toHaveBeenCalledWith(
      "Error while parsing CSV:",
      "Mocked parsing error"
    );
  });
});
