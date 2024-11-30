import { isProductDTO, parseItem } from "../service-bus-import-product";
import { ProductDTO } from "../dto/product-dto";

describe("service-bus-import-product", () => {
  describe("isProductDTO", () => {
    test("invalid", () => {
      const item = { banana: 123 };

      const isValid = isProductDTO(item);

      expect(isValid).toBeFalsy();
    });

    test("if has own property but they are undefined it should return false", () => {
      const item: ProductDTO = {
        title: undefined,
        description: undefined,
        price: undefined,
        count: undefined,
      };

      const isValid = isProductDTO(item);

      expect(isValid).toBeFalsy();
    });

    test.each([
      {
        title: "Some title",
        description: "Some description",
        price: 123,
        count: 123,
      },
      {
        id: "123",
        title: "Some title",
        description: "Some description",
        price: 123,
        count: 123,
      },
      {
        id: "123",
        title: "Some title",
        description: "Some description",
        price: 123,
        count: 123,
        banana: true,
      },
    ])("Valid scenarios: #", (item) => {
      expect(isProductDTO(item)).toBeTruthy();
    });
  });

  describe("parseItem", () => {
    test("Parse item removes additional properties", () => {
      const original = {
        id: "123",
        title: "Some title",
        description: "Some description",
        price: 123,
        count: 123,
        banana: true,
      };

      const parsed = parseItem(original);

      expect(parsed.hasOwnProperty("banana")).toBeFalsy();
    });
  });
});
