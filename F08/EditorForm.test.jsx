import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EditorForm from "../../src/pages/shared/BlogEditor/Components/EditorForm";

describe("F08 - EditorForm unit tests", () => {
  const baseProps = {
    mode: "create",
    postId: undefined,
    title: "",
    setTitle: vi.fn(),
    tags: "",
    setTags: vi.fn(),
    thumbnailUrl: "",
    setThumbnailUrl: vi.fn(),
    content: "",
    setContent: vi.fn(),
    isPublished: true,
    setIsPublished: vi.fn(),
    canSubmit: false,
    saving: false,
    onSave: vi.fn(),
    loading: false,
    error: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm(overrideProps = {}) {
    return render(
      <MemoryRouter>
        <EditorForm {...baseProps} {...overrideProps} />
      </MemoryRouter>
    );
  }

  it("UT_F08_36 shows a loading state when the form data is still loading", () => {
    renderForm({ loading: true });

    expect(screen.getByText(/Đang tải dữ liệu/i)).toBeInTheDocument();
  });

  it("UT_F08_37 auto selects a default thumbnail when the thumbnail is empty", () => {
    const setThumbnailUrl = vi.fn();
    renderForm({ setThumbnailUrl });

    expect(setThumbnailUrl).toHaveBeenCalledTimes(1);
    expect(setThumbnailUrl.mock.calls[0][0]).toMatch(/^https?:\/\//);
  });

  it("UT_F08_38 does not auto select a thumbnail when one already exists", () => {
    const setThumbnailUrl = vi.fn();
    renderForm({
      thumbnailUrl: "https://img.test/existing.jpg",
      setThumbnailUrl,
    });

    expect(setThumbnailUrl).not.toHaveBeenCalled();
  });

  it("UT_F08_39 shows the error message and disables save when canSubmit is false", () => {
    renderForm({ error: "Cannot save post", canSubmit: false });

    expect(screen.getByText("Cannot save post")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xuất bản/i })).toBeDisabled();
  });

  it("UT_F08_40 calls title, tag, content setters and save handler correctly", () => {
    const setTitle = vi.fn();
    const setTags = vi.fn();
    const setContent = vi.fn();
    const onSave = vi.fn();

    renderForm({
      title: "Old Title",
      tags: "react",
      content: "Old Content",
      setTitle,
      setTags,
      setContent,
      canSubmit: true,
      onSave,
    });

    fireEvent.change(screen.getByPlaceholderText(/Tiêu đề bài viết/i), {
      target: { value: "New Title" },
    });
    fireEvent.change(screen.getByPlaceholderText("react, performance, ux…"), {
      target: { value: "react, testing" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Nội dung \(sẽ lưu vào contentJson.blocks\[0\].text\)/i),
      {
        target: { value: "New Content" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /Xuất bản/i }));

    expect(setTitle).toHaveBeenCalledWith("New Title");
    expect(setTags).toHaveBeenCalledWith("react, testing");
    expect(setContent).toHaveBeenCalledWith("New Content");
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("UT_F08_41 toggles the publish checkbox", () => {
    const setIsPublished = vi.fn();
    renderForm({
      isPublished: true,
      setIsPublished,
    });

    fireEvent.click(screen.getByRole("checkbox"));

    expect(setIsPublished).toHaveBeenCalledWith(false);
  });

  it("UT_F08_42 renders post id and edit button label in edit mode", () => {
    renderForm({
      mode: "edit",
      postId: "post-123",
      canSubmit: true,
    });

    expect(screen.getByText(/ID:/i)).toBeInTheDocument();
    expect(screen.getByText("post-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lưu thay đổi/i })).toBeInTheDocument();
  });

  it("UT_F08_43 shows saving state and disables the action button while saving", () => {
    renderForm({
      mode: "edit",
      canSubmit: true,
      saving: true,
    });

    expect(screen.getByRole("button", { name: /Đang lưu/i })).toBeDisabled();
  });

  it("UT_F08_44 renders a cancel link back to /blog/my", () => {
    renderForm();

    expect(screen.getByRole("link", { name: /Hủy/i })).toHaveAttribute(
      "href",
      "/blog/my"
    );
  });
});
