import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPost,
  fetchDeletedPosts,
  fetchPostById,
  fetchPosts,
  fetchPostsByMember,
  hardDeletePost,
  restorePost,
  searchPosts,
  softDeletePost,
  updatePost,
} from "../../src/api/posts.api";

function jsonResponse({ ok = true, status = 200, body }) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("F08 - posts.api unit tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it("UT_F08_01 normalizes fetchPosts response when API returns a raw array", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: [{ id: "post-001", title: "Post 1" }],
      })
    );

    await expect(fetchPosts()).resolves.toEqual({
      data: [{ id: "post-001", title: "Post 1" }],
    });
  });

  it("UT_F08_02 normalizes fetchPosts response when API returns wrapped data", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: { data: [{ id: "post-002", title: "Wrapped Post" }] },
      })
    );

    await expect(fetchPosts()).resolves.toEqual({
      data: [{ id: "post-002", title: "Wrapped Post" }],
    });
  });

  it("UT_F08_03 returns an empty list when fetchPosts payload has no data field", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { message: "empty" } }));

    await expect(fetchPosts()).resolves.toEqual({ data: [] });
  });

  it("UT_F08_04 throws an HTTP status error when fetchPosts fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: false, status: 503, body: {} }));

    await expect(fetchPosts()).rejects.toThrow("HTTP 503");
  });

  it("UT_F08_05 returns post detail for a valid post id", async () => {
    const detailPayload = {
      id: "post-003",
      title: "Detail Post",
      contentJson: "{}",
    };
    global.fetch.mockResolvedValue(jsonResponse({ body: detailPayload }));

    await expect(fetchPostById("post-003")).resolves.toEqual(detailPayload);
  });

  it("UT_F08_06 throws an HTTP status error when fetchPostById fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: false, status: 404, body: {} }));

    await expect(fetchPostById("missing-post")).rejects.toThrow("HTTP 404");
  });

  it("UT_F08_07 sends auth header and normalizes fetchPostsByMember raw array response", async () => {
    localStorage.setItem("app_access_token", "token-member");
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: [{ id: "post-004", title: "Mine" }],
      })
    );

    await expect(fetchPostsByMember("member-001")).resolves.toEqual({
      data: [{ id: "post-004", title: "Mine" }],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/member/member-001",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "*/*",
          Authorization: "Bearer token-member",
        }),
      })
    );
  });

  it("UT_F08_08 normalizes fetchPostsByMember wrapped response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: { data: [{ id: "post-005", title: "Wrapped member post" }] },
      })
    );

    await expect(fetchPostsByMember("member-002")).resolves.toEqual({
      data: [{ id: "post-005", title: "Wrapped member post" }],
    });
  });

  it("UT_F08_09 throws an HTTP status error when fetchPostsByMember fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: false, status: 401, body: {} }));

    await expect(fetchPostsByMember("member-003")).rejects.toThrow("HTTP 401");
  });

  it("UT_F08_10 encodes the search keyword correctly", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { data: [] } }));

    await searchPosts("react performance");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/search?tag=react%20performance",
      expect.objectContaining({ headers: { accept: "*/*" } })
    );
  });

  it("UT_F08_11 normalizes searchPosts raw array response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: [{ id: "post-006", tags: "react" }],
      })
    );

    await expect(searchPosts("react")).resolves.toEqual({
      data: [{ id: "post-006", tags: "react" }],
    });
  });

  it("UT_F08_12 normalizes searchPosts wrapped data response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: { data: [{ id: "post-007", tags: "ux" }] },
      })
    );

    await expect(searchPosts("ux")).resolves.toEqual({
      data: [{ id: "post-007", tags: "ux" }],
    });
  });

  it("UT_F08_13 throws an HTTP status error when searchPosts fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: false, status: 500, body: {} }));

    await expect(searchPosts("broken")).rejects.toThrow("HTTP 500");
  });

  it("UT_F08_14 sends createPost payload with authorization header", async () => {
    localStorage.setItem("app_access_token", "token-001");
    global.fetch.mockResolvedValue(jsonResponse({ body: { id: "post-008" } }));

    const newPostPayload = {
      title: "New Post",
      tags: "react",
      contentJson: "{}",
    };

    await createPost(newPostPayload);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: "Bearer token-001",
        }),
        body: JSON.stringify(newPostPayload),
      })
    );
  });

  it("UT_F08_15 sends createPost without Authorization header when no token exists", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { id: "post-009" } }));

    await createPost({ title: "Public Post" });

    const [, request] = global.fetch.mock.calls[0];
    expect(request.headers.Authorization).toBeUndefined();
  });

  it("UT_F08_16 throws backend message when createPost fails", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 400,
        body: { message: "Create failed" },
      })
    );

    await expect(createPost({ title: "Bad Post" })).rejects.toThrow("Create failed");
  });

  it("UT_F08_17 falls back to HTTP status when createPost error payload has no message", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 422,
        body: {},
      })
    );

    await expect(createPost({ title: "Bad Post" })).rejects.toThrow("HTTP 422");
  });

  it("UT_F08_18 returns backend payload on updatePost success", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { ok: true } }));

    await expect(updatePost("post-010", { title: "Updated" })).resolves.toEqual({
      ok: true,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/post-010",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ title: "Updated" }),
      })
    );
  });

  it("UT_F08_19 throws backend message when updatePost fails", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 400,
        body: { message: "Update failed" },
      })
    );

    await expect(updatePost("post-011", { title: "Updated" })).rejects.toThrow(
      "Update failed"
    );
  });

  it("UT_F08_20 falls back to HTTP status when updatePost error payload has no message", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 500,
        body: {},
      })
    );

    await expect(updatePost("post-012", { title: "Updated" })).rejects.toThrow(
      "HTTP 500"
    );
  });

  it("UT_F08_21 sends DELETE request to soft delete endpoint", async () => {
    localStorage.setItem("app_access_token", "token-soft");
    global.fetch.mockResolvedValue(jsonResponse({ body: { ok: true } }));

    await expect(softDeletePost("post-013")).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/deletesoft/post-013",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          accept: "*/*",
          Authorization: "Bearer token-soft",
        }),
      })
    );
  });

  it("UT_F08_22 throws backend message when softDeletePost fails", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 400,
        body: { message: "Soft delete failed" },
      })
    );

    await expect(softDeletePost("post-014")).rejects.toThrow("Soft delete failed");
  });

  it("UT_F08_23 sends DELETE request to hard delete endpoint", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { removed: true } }));

    await expect(hardDeletePost("post-015")).resolves.toEqual({ removed: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/deletehard/post-015",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("UT_F08_24 throws backend message when hardDeletePost fails", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 403,
        body: { message: "Hard delete denied" },
      })
    );

    await expect(hardDeletePost("post-016")).rejects.toThrow("Hard delete denied");
  });

  it("UT_F08_25 sends PATCH request to restore endpoint", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { restored: true } }));

    await expect(restorePost("post-017")).resolves.toEqual({ restored: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5102/api/Posts/restore/post-017",
      expect.objectContaining({
        method: "PATCH",
      })
    );
  });

  it("UT_F08_26 falls back to HTTP status when restorePost error payload has no message", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 409,
        body: {},
      })
    );

    await expect(restorePost("post-018")).rejects.toThrow("HTTP 409");
  });

  it("UT_F08_27 normalizes fetchDeletedPosts raw array response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: [{ id: "post-019", isDeleted: true }],
      })
    );

    await expect(fetchDeletedPosts()).resolves.toEqual({
      data: [{ id: "post-019", isDeleted: true }],
    });
  });

  it("UT_F08_28 normalizes fetchDeletedPosts wrapped response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        body: { data: [{ id: "post-020", isDeleted: true }] },
      })
    );

    await expect(fetchDeletedPosts()).resolves.toEqual({
      data: [{ id: "post-020", isDeleted: true }],
    });
  });

  it("UT_F08_29 returns an empty list when fetchDeletedPosts payload has no data field", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ body: { meta: 1 } }));

    await expect(fetchDeletedPosts()).resolves.toEqual({ data: [] });
  });

  it("UT_F08_30 throws an HTTP status error when fetchDeletedPosts fails", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: false, status: 500, body: {} }));

    await expect(fetchDeletedPosts()).rejects.toThrow("HTTP 500");
  });

  it("KF_F08_02 should fall back to HTTP 500 when createPost receives a non-JSON error body", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("Unexpected end of JSON input")),
    });

    await expect(createPost({ title: "Broken error body" })).rejects.toThrow(
      "HTTP 500"
    );
  });

  it("KF_F08_03 should fall back to HTTP 502 when updatePost receives a non-JSON error body", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error("Unexpected end of JSON input")),
    });

    await expect(updatePost("post-500", { title: "Broken update" })).rejects.toThrow(
      "HTTP 502"
    );
  });

  it("KF_F08_04 should fall back to HTTP 503 when softDeletePost receives a non-JSON error body", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockRejectedValue(new Error("Unexpected end of JSON input")),
    });

    await expect(softDeletePost("post-delete")).rejects.toThrow("HTTP 503");
  });
});
