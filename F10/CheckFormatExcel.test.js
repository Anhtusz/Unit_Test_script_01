import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSheetToJson = vi.fn();

vi.mock("xlsx", () => ({
  default: {
    utils: {
      sheet_to_json: (...args) => mockSheetToJson(...args),
    },
  },
  utils: {
    sheet_to_json: (...args) => mockSheetToJson(...args),
  },
}));

import checkFormatExcel from "../../src/pages/instructor/CreateExam/Components/ListQuestion/CheckFormatExcel";

const requiredHeaders = [
  "Index",
  "Content",
  "Image Url",
  "Type",
  "Explanation",
  "Point",
  "Is Required",
  "Order",
  "Choices",
  "Is Correct",
];

describe("F10 - checkFormatExcel unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UT_F10_15 returns missing header error when required columns are absent", () => {
    mockSheetToJson.mockReturnValueOnce([["Index", "Content"]]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Thiếu các cột");
  });

  it("UT_F10_16 lists all missing headers in the error message", () => {
    mockSheetToJson.mockReturnValueOnce([["Index"]]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.reason).toContain("Content");
    expect(result.reason).toContain("Choices");
    expect(result.reason).toContain("Is Correct");
  });

  it("UT_F10_17 returns row format error when question type is invalid", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        {
          Index: 1,
          Content: "Question 1",
          Type: "Essay",
        },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Type không hợp lệ");
  });

  it("UT_F10_18 returns row format error when Index is not numeric", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        {
          Index: "A",
          Content: "Question 1",
          Type: "MultipleChoice",
        },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Index phải là số");
  });

  it("UT_F10_19 returns row format error when a choice row is missing Choices", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        { Index: 1, Content: "Question 1", Type: "MultipleChoice" },
        { "Is Correct": true },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("thiếu Choices");
  });

  it("UT_F10_20 returns row format error when a choice row is missing Is Correct", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        { Index: 1, Content: "Question 1", Type: "MultipleChoice" },
        { Choices: "A" },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("thiếu Is Correct");
  });

  it("UT_F10_21 aggregates multiple row format errors into one message", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        { Index: "A", Content: "Question 1", Type: "Essay" },
        { Choices: "A" },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.reason).toContain("Type không hợp lệ");
    expect(result.reason).toContain("Index phải là số");
    expect(result.reason).toContain("thiếu Is Correct");
  });

  it("UT_F10_22 accepts a valid excel structure with a supported question type", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        {
          Index: 1,
          Content: "Question 1",
          Type: "MultipleChoice",
        },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("");
  });

  it("UT_F10_23 accepts all supported question types", () => {
    mockSheetToJson
      .mockReturnValueOnce([requiredHeaders])
      .mockReturnValueOnce([
        { Index: 1, Content: "Question 1", Type: "MultiSelectChoice" },
        { Index: 2, Content: "Question 2", Type: "MultipleChoice" },
        { Index: 3, Content: "Question 3", Type: "TrueFalse" },
      ]);

    const result = checkFormatExcel({ sheet: {} });

    expect(result.ok).toBe(true);
  });
});
