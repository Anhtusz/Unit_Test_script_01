import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBaseFetch = vi.fn();

vi.mock("../../src/api/baseApi", () => ({
  baseFetch: (...args) => mockBaseFetch(...args),
}));

import {
  createCourseAPI,
  fetchCourseDataAPI,
  fetchCourseDetail,
  fetchCourses,
  fetchInstructorCourses,
  requestPublishCourse,
  updateFullCourse,
} from "../../src/api/courses.api";

describe("F10 - courses.api unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("UT_F10_24 builds the correct query string in fetchCourses", async () => {
    mockBaseFetch.mockResolvedValue({ data: [] });

    await fetchCourses({
      keyword: "react",
      category: "frontend",
      page: 2,
      pageSize: 8,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/search?keyword=react&category=frontend&page=2&pageSize=8"
    );
  });

  it("UT_F10_25 calls the base search endpoint when fetchCourses has no filters", async () => {
    mockBaseFetch.mockResolvedValue({ data: [] });

    await fetchCourses();

    expect(mockBaseFetch).toHaveBeenCalledWith("/api/courses/search");
  });

  it("UT_F10_26 includes only provided fetchCourses filters", async () => {
    mockBaseFetch.mockResolvedValue({ data: [] });

    await fetchCourses({
      keyword: "javascript",
      pageSize: 12,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/search?keyword=javascript&pageSize=12"
    );
  });

  it("UT_F10_27 returns data from fetchCourseDataAPI on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: { id: "course-001" },
    });

    await expect(fetchCourseDataAPI("course-001")).resolves.toEqual({
      id: "course-001",
    });
  });

  it("UT_F10_28 throws the backend message when fetchCourseDataAPI returns error status", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Load failed",
    });

    await expect(fetchCourseDataAPI("course-002")).rejects.toThrow("Load failed");
  });

  it("UT_F10_29 sends GET request with auth headers in fetchCourseDetail", async () => {
    localStorage.setItem("app_access_token", "token-course");
    mockBaseFetch.mockResolvedValue({ id: "course-003" });

    await fetchCourseDetail("course-003");

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/course-003",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-course",
        }),
      })
    );
  });

  it("UT_F10_30 sends the correct payload in createCourseAPI", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success", id: "course-004" });
    const coursePayload = { title: "React Course", price: 100 };

    await createCourseAPI(coursePayload);

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/create-full-course",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(coursePayload),
      })
    );
  });

  it("UT_F10_31 throws the backend message in createCourseAPI when response status is error", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Create failed",
    });

    await expect(createCourseAPI({ title: "Bad Course" })).rejects.toThrow(
      "Create failed"
    );
  });

  it("UT_F10_32 builds the correct query string in fetchInstructorCourses", async () => {
    localStorage.setItem("app_access_token", "token-instructor");
    mockBaseFetch.mockResolvedValue({ data: [] });

    await fetchInstructorCourses({
      keyword: "react",
      status: "draft",
      sort: "latest",
      page: 3,
      pageSize: 10,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/instructor?keyword=react&status=draft&sort=latest&page=3&pageSize=10",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-instructor",
        }),
      })
    );
  });

  it("UT_F10_33 omits empty optional filters in fetchInstructorCourses", async () => {
    mockBaseFetch.mockResolvedValue({ data: [] });

    await fetchInstructorCourses({
      keyword: "",
      status: "published",
      page: 1,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/instructor?status=published&page=1",
      expect.any(Object)
    );
  });

  it("UT_F10_34 returns response on successful updateFullCourse", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      id: "course-005",
    });

    await expect(
      updateFullCourse("course-005", { title: "Updated title" })
    ).resolves.toEqual({
      status: "success",
      id: "course-005",
    });
  });

  it("UT_F10_35 throws the backend error in updateFullCourse when response status is error", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Update failed",
    });

    await expect(
      updateFullCourse("course-006", { title: "Updated title" })
    ).rejects.toThrow("Update failed");
  });

  it("UT_F10_36 calls the publish request endpoint correctly", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success" });

    await requestPublishCourse("course-007");

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/courses/course-007/request-publish",
      expect.objectContaining({
        method: "PATCH",
      })
    );
  });

  it("UT_F10_37 throws the backend error in requestPublishCourse when response status is error", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Publish failed",
    });

    await expect(requestPublishCourse("course-008")).rejects.toThrow(
      "Publish failed"
    );
  });
});
