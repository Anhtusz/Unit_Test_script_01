import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHttp = vi.fn();
const mockAuthHeaders = vi.fn((extra = {}) => extra);

vi.mock("../../src/utils/http", () => ({
  http: (...args) => mockHttp(...args),
}));

vi.mock("../../src/pages/shared/Forum/utils/helpers", () => ({
  authHeaders: (...args) => mockAuthHeaders(...args),
}));

import {
  deleteAnswerApi,
  updateAnswerApi,
} from "../../src/api/dicussion.api";

describe("F09 - dicussion.api unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UT_F09_01 sends trimmed content in updateAnswerApi", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await updateAnswerApi("discussion-001", "  updated answer  ");

    expect(mockHttp).toHaveBeenCalledWith(
      "http://localhost:5102/api/Discussion/discussion-001",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ content: "updated answer" }),
      })
    );
  });

  it("UT_F09_02 preserves internal spaces after trimming answer content", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await updateAnswerApi("discussion-002", "  line one   line two  ");

    expect(mockHttp).toHaveBeenCalledWith(
      "http://localhost:5102/api/Discussion/discussion-002",
      expect.objectContaining({
        body: JSON.stringify({ content: "line one   line two" }),
      })
    );
  });

  it("UT_F09_03 sends an empty content string when answer content contains only spaces", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await updateAnswerApi("discussion-003", "    ");

    expect(mockHttp).toHaveBeenCalledWith(
      "http://localhost:5102/api/Discussion/discussion-003",
      expect.objectContaining({
        body: JSON.stringify({ content: "" }),
      })
    );
  });

  it("UT_F09_04 passes JSON content type through authHeaders for updates", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await updateAnswerApi("discussion-004", "answer");

    expect(mockAuthHeaders).toHaveBeenCalledWith({
      "Content-Type": "application/json",
    });
  });

  it("UT_F09_05 sends the correct delete request in deleteAnswerApi", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await deleteAnswerApi("discussion-005");

    expect(mockHttp).toHaveBeenCalledWith(
      "http://localhost:5102/api/Discussion/discussion-005",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("UT_F09_06 calls authHeaders without extra headers for deleteAnswerApi", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await deleteAnswerApi("discussion-006");

    expect(mockAuthHeaders).toHaveBeenCalledWith();
  });

  it("KF_F09_02 should reject blank content before updateAnswerApi calls the backend", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await expect(updateAnswerApi("discussion-blank", "   ")).rejects.toThrow(
      /content/i
    );
    expect(mockHttp).not.toHaveBeenCalled();
  });

  it("KF_F09_03 should reject an empty discussion id before deleteAnswerApi calls the backend", async () => {
    mockHttp.mockResolvedValue({ ok: true });

    await expect(deleteAnswerApi("")).rejects.toThrow(/discussion/i);
    expect(mockHttp).not.toHaveBeenCalled();
  });
});
