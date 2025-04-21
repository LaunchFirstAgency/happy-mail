import { toCamelCase, toSnakeCase, camelizeKeys, snakeizeKeys } from "../case-converter";

describe("toCamelCase", () => {
  it("converts basic snake_case to camelCase", () => {
    expect(toCamelCase("hello_world")).toBe("helloWorld");
    expect(toCamelCase("first_name")).toBe("firstName");
    expect(toCamelCase("user_id")).toBe("userId");
  });

  it("handles multiple underscores", () => {
    expect(toCamelCase("very_long_variable_name")).toBe("veryLongVariableName");
    expect(toCamelCase("multiple___underscores")).toBe("multipleUnderscores");
  });

  it("handles edge cases", () => {
    expect(toCamelCase("")).toBe("");
    expect(toCamelCase("already_camelCase")).toBe("alreadyCamelCase");
    expect(toCamelCase("_leading_underscore")).toBe("leadingUnderscore");
    expect(toCamelCase("trailing_underscore_")).toBe("trailingUnderscore");
  });

  it("preserves numbers and special characters", () => {
    expect(toCamelCase("user123_name")).toBe("user123Name");
    //expect(toCamelCase("test_1_2_3")).toBe("test1_2_3");
    expect(toCamelCase("special_$_chars")).toBe("special$Chars");
  });
});

describe("toSnakeCase", () => {
  it("converts basic camelCase to snake_case", () => {
    expect(toSnakeCase("helloWorld")).toBe("hello_world");
    expect(toSnakeCase("firstName")).toBe("first_name");
    expect(toSnakeCase("userId")).toBe("user_id");
  });

  it("handles consecutive capital letters", () => {
    expect(toSnakeCase("myXMLParser")).toBe("my_x_m_l_parser");
    expect(toSnakeCase("parseJSON")).toBe("parse_j_s_o_n");
  });

  it("handles edge cases", () => {
    expect(toSnakeCase("")).toBe("");
    expect(toSnakeCase("alreadysnakecase")).toBe("alreadysnakecase");
    expect(toSnakeCase("ALLCAPS")).toBe("_a_l_l_c_a_p_s");
  });

  it("preserves numbers and special characters", () => {
    expect(toSnakeCase("user123Name")).toBe("user123_name");
    expect(toSnakeCase("test123")).toBe("test123");
    expect(toSnakeCase("special$Chars")).toBe("special$_chars");
  });
});

describe("camelizeKeys", () => {
  it("converts simple object keys from snake_case to camelCase", () => {
    const input = {
      first_name: "John",
      last_name: "Doe",
      user_id: 123,
    };
    const expected = {
      firstName: "John",
      lastName: "Doe",
      userId: 123,
    };
    expect(camelizeKeys(input)).toEqual(expected);
  });

  it("handles nested objects", () => {
    const input = {
      user_data: {
        first_name: "John",
        address_info: {
          street_name: "Main St",
          house_number: 42,
        },
      },
    };
    const expected = {
      userData: {
        firstName: "John",
        addressInfo: {
          streetName: "Main St",
          houseNumber: 42,
        },
      },
    };
    expect(camelizeKeys(input)).toEqual(expected);
  });

  it("handles arrays and nested arrays", () => {
    const input = {
      user_list: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Smith" },
      ],
      nested_arrays: [[{ test_key: "value" }]],
    };
    const expected = {
      userList: [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" },
      ],
      nestedArrays: [[{ testKey: "value" }]],
    };
    expect(camelizeKeys(input)).toEqual(expected);
  });

  it("handles edge cases", () => {
    expect(camelizeKeys({})).toEqual({});
    expect(camelizeKeys([])).toEqual([]);
    expect(camelizeKeys([1, 2, 3])).toEqual([1, 2, 3]);
    expect(camelizeKeys({ _: "underscore" })).toEqual({ "": "underscore" });
  });
});

describe("snakeizeKeys", () => {
  it("converts simple object keys from camelCase to snake_case", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      userId: 123,
    };
    const expected = {
      first_name: "John",
      last_name: "Doe",
      user_id: 123,
    };
    expect(snakeizeKeys(input)).toEqual(expected);
  });

  it("handles nested objects", () => {
    const input = {
      userData: {
        firstName: "John",
        addressInfo: {
          streetName: "Main St",
          houseNumber: 42,
        },
      },
    };
    const expected = {
      user_data: {
        first_name: "John",
        address_info: {
          street_name: "Main St",
          house_number: 42,
        },
      },
    };
    expect(snakeizeKeys(input)).toEqual(expected);
  });

  it("handles arrays and nested arrays", () => {
    const input = {
      userList: [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" },
      ],
      nestedArrays: [[{ testKey: "value" }]],
    };
    const expected = {
      user_list: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Smith" },
      ],
      nested_arrays: [[{ test_key: "value" }]],
    };
    expect(snakeizeKeys(input)).toEqual(expected);
  });

  it("handles edge cases", () => {
    expect(snakeizeKeys({})).toEqual({});
    expect(snakeizeKeys([])).toEqual([]);
    expect(snakeizeKeys([1, 2, 3])).toEqual([1, 2, 3]);
    expect(snakeizeKeys({ "": "empty" })).toEqual({ "": "empty" });
  });
});
