import { describe, expect, it } from "vitest";
import checkCourseCreate from "../../src/pages/instructor/CreateCourse/Components/FormCreateCourse/CheckCourseCreate";

describe("F10 - checkCourseCreate unit tests", () => {
  const validCourse = {
    title: "React Course",
    categoryId: "cat-001",
    description: "A valid course description",
    price: 100,
    discount: 10,
  };

  const validCourseContent = {
    title: "Module 1",
    lessons: [{ title: "Lesson 1", duration: 30 }],
  };

  it("UT_F10_01 returns error when the course title is empty", () => {
    expect(
      checkCourseCreate({ ...validCourse, title: "   " }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Tiêu đề khóa học không được để trống.",
    });
  });

  it("UT_F10_02 returns error when categoryId is missing", () => {
    expect(
      checkCourseCreate({ ...validCourse, categoryId: "" }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Vui lòng chọn danh mục.",
    });
  });

  it("UT_F10_03 returns error when the description is too short", () => {
    expect(
      checkCourseCreate({ ...validCourse, description: "short" }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Mô tả khóa học phải có ít nhất 10 ký tự.",
    });
  });

  it("UT_F10_04 returns error when price is zero", () => {
    expect(
      checkCourseCreate({ ...validCourse, price: 0 }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Giá phải lớn hơn 0.",
    });
  });

  it("UT_F10_05 accepts numeric string prices greater than zero", () => {
    expect(
      checkCourseCreate({ ...validCourse, price: "199" }, validCourseContent)
    ).toEqual({ ok: true });
  });

  it("UT_F10_06 returns error when discount is negative", () => {
    expect(
      checkCourseCreate({ ...validCourse, discount: -1 }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Giảm giá phải từ 0 đến 100%.",
    });
  });

  it("UT_F10_07 returns error when discount is greater than 100", () => {
    expect(
      checkCourseCreate({ ...validCourse, discount: 101 }, validCourseContent)
    ).toEqual({
      ok: false,
      reason: "Giảm giá phải từ 0 đến 100%.",
    });
  });

  it("UT_F10_08 returns error when the course content title is empty", () => {
    expect(
      checkCourseCreate(validCourse, { ...validCourseContent, title: "   " })
    ).toEqual({
      ok: false,
      reason: "Tên phần nội dung không được bỏ trống.",
    });
  });

  it("UT_F10_09 returns error when no lessons are provided", () => {
    expect(
      checkCourseCreate(validCourse, { ...validCourseContent, lessons: [] })
    ).toEqual({
      ok: false,
      reason: "Khóa học phải có ít nhất 1 bài học.",
    });
  });

  it("UT_F10_10 returns error when a lesson title is missing", () => {
    expect(
      checkCourseCreate(validCourse, {
        ...validCourseContent,
        lessons: [{ title: "   ", duration: 30 }],
      })
    ).toEqual({
      ok: false,
      reason: "Bài học thứ 1 thiếu tiêu đề.",
    });
  });

  it("UT_F10_11 returns error when a lesson duration is missing", () => {
    expect(
      checkCourseCreate(validCourse, {
        ...validCourseContent,
        lessons: [{ title: "Lesson 1" }],
      })
    ).toEqual({
      ok: false,
      reason: "Bài học thứ 1 thiếu thời lượng.",
    });
  });

  it("UT_F10_12 returns error when the lesson duration is not positive", () => {
    expect(
      checkCourseCreate(validCourse, {
        ...validCourseContent,
        lessons: [{ title: "Lesson 1", duration: -1 }],
      })
    ).toEqual({
      ok: false,
      reason: "Thời lượng bài học thứ 1 phải lớn hơn 0.",
    });
  });

  it("UT_F10_13 reports the second invalid lesson using a 1-based index", () => {
    expect(
      checkCourseCreate(validCourse, {
        ...validCourseContent,
        lessons: [
          { title: "Lesson 1", duration: 30 },
          { title: "", duration: 20 },
        ],
      })
    ).toEqual({
      ok: false,
      reason: "Bài học thứ 2 thiếu tiêu đề.",
    });
  });

  it("UT_F10_14 returns success when all course data is valid", () => {
    expect(checkCourseCreate(validCourse, validCourseContent)).toEqual({ ok: true });
  });

  it("KF_F10_03 should return a validation result when courseContent is missing", () => {
    expect(() => checkCourseCreate(validCourse, undefined)).not.toThrow();
    expect(checkCourseCreate(validCourse, undefined)).toEqual({
      ok: false,
      reason: expect.stringMatching(/content/i),
    });
  });

  it("KF_F10_04 should return a validation result when lessons is missing", () => {
    expect(() =>
      checkCourseCreate(validCourse, { title: "Module without lessons" })
    ).not.toThrow();
    expect(
      checkCourseCreate(validCourse, { title: "Module without lessons" })
    ).toEqual({
      ok: false,
      reason: expect.stringMatching(/lesson/i),
    });
  });
});
