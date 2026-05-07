import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBaseFetch = vi.fn();

vi.mock("../../src/api/baseApi", () => ({
  baseFetch: (...args) => mockBaseFetch(...args),
}));

import {
  createFullExam,
  fetchAllExamsForCourse,
  fetchExamById,
  fetchExamResults,
  fetchExamsByLesson,
  fetchSubmissionExamByAttemmptId,
  fetchUserSubmissionBySubmissionexamId,
  submitExamAPI,
} from "../../src/api/exams.api";

describe("F10 - exams.api unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("UT_F10_38 filters empty params in fetchAllExamsForCourse", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success", data: [] });

    await fetchAllExamsForCourse("course-001", {
      keyword: "",
      status: "published",
      page: 1,
      pageSize: undefined,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/exams/get-all?courseId=course-001&status=published&page=1",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("UT_F10_39 keeps numeric zero and boolean false values in fetchAllExamsForCourse", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success", data: [] });

    await fetchAllExamsForCourse("course-002", {
      page: 0,
      includeDraft: false,
    });

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/exams/get-all?courseId=course-002&page=0&includeDraft=false",
      expect.any(Object)
    );
  });

  it("UT_F10_40 sends the correct create exam payload", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success", id: "exam-001" });
    const examPayload = { title: "Midterm", duration: 45 };

    await createFullExam(examPayload);

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/exams/create-full-exam",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(examPayload),
      })
    );
  });

  it("UT_F10_41 throws the backend message when createFullExam fails", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Create exam failed",
    });

    await expect(createFullExam({ title: "Broken" })).rejects.toThrow(
      "Create exam failed"
    );
  });

  it("UT_F10_42 sends the submit exam payload correctly", async () => {
    mockBaseFetch.mockResolvedValue({ status: "success" });
    const submittedAnswers = [{ questionId: "q-1", choiceId: "c-1" }];

    await submitExamAPI("attempt-001", submittedAnswers);

    expect(mockBaseFetch).toHaveBeenCalledWith(
      "/api/submit/attempt-001/submit-exam",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(submittedAnswers),
      })
    );
  });

  it("UT_F10_43 throws the backend message when submitExamAPI fails", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Submit failed",
    });

    await expect(submitExamAPI("attempt-002", [])).rejects.toThrow("Submit failed");
  });

  it("UT_F10_44 returns data from fetchExamsByLesson on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: [{ id: "exam-002" }],
    });

    await expect(fetchExamsByLesson("lesson-001")).resolves.toEqual({
      status: "success",
      data: [{ id: "exam-002" }],
    });
  });

  it("UT_F10_45 throws the backend message when fetchExamsByLesson fails", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Fetch lesson exams failed",
    });

    await expect(fetchExamsByLesson("lesson-002")).rejects.toThrow(
      "Fetch lesson exams failed"
    );
  });

  it("UT_F10_46 returns data from fetchExamById on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: { id: "exam-003" },
    });

    await expect(fetchExamById("exam-003")).resolves.toEqual({
      status: "success",
      data: { id: "exam-003" },
    });
  });

  it("UT_F10_47 throws the backend message when fetchExamById fails", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "error",
      message: "Fetch exam failed",
    });

    await expect(fetchExamById("exam-004")).rejects.toThrow("Fetch exam failed");
  });

  it("UT_F10_48 returns exam history from fetchExamResults on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: [{ attemptId: "attempt-003" }],
    });

    await expect(fetchExamResults("exam-005")).resolves.toEqual({
      status: "success",
      data: [{ attemptId: "attempt-003" }],
    });
  });

  it("UT_F10_49 returns submission detail from fetchSubmissionExamByAttemmptId on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: { submissionId: "submission-001" },
    });

    await expect(fetchSubmissionExamByAttemmptId("attempt-004")).resolves.toEqual({
      status: "success",
      data: { submissionId: "submission-001" },
    });
  });

  it("UT_F10_50 returns user submission result from fetchUserSubmissionBySubmissionexamId on success", async () => {
    mockBaseFetch.mockResolvedValue({
      status: "success",
      data: { score: 9 },
    });

    await expect(
      fetchUserSubmissionBySubmissionexamId("submission-exam-001")
    ).resolves.toEqual({
      status: "success",
      data: { score: 9 },
    });
  });

  it("KF_F10_01 should convert a 403 lesson response into the expected not-enrolled error", async () => {
    mockBaseFetch.mockResolvedValue({
      status: 403,
      message: "Forbidden",
    });

    await expect(fetchExamsByLesson("lesson-403")).rejects.toThrow(
      "You are not enrolled in this course"
    );
  });

  it("KF_F10_02 should convert a 401 exam detail response into the expected not-enrolled error", async () => {
    mockBaseFetch.mockResolvedValue({
      status: 401,
      message: "Unauthorized",
    });

    await expect(fetchExamById("exam-401")).rejects.toThrow(
      "You are not enrolled in this course"
    );
  });
});
