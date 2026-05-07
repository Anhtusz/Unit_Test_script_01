import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BlogEditor from "../../src/pages/shared/BlogEditor/BlogEditor";

const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({}));
const mockToast = vi.fn();
const mockRequireAuth = vi.fn();
const mockIsLoggedIn = vi.fn(() => true);
const mockCreatePost = vi.fn();
const mockUpdatePost = vi.fn();
const mockFetchPostById = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock("../../src/components/Header", () => ({
  default: () => <div data-testid="mock-header" />,
}));

vi.mock("../../src/components/Footer", () => ({
  default: () => <div data-testid="mock-footer" />,
}));

vi.mock("../../src/components/ui/Toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../src/utils/auth", () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  requireAuth: (...args) => mockRequireAuth(...args),
}));

vi.mock("../../src/api/posts.api", () => ({
  fetchPostById: (...args) => mockFetchPostById(...args),
  createPost: (...args) => mockCreatePost(...args),
  updatePost: (...args) => mockUpdatePost(...args),
}));

vi.mock("../../src/pages/shared/BlogEditor/Components/EditorHero", () => ({
  default: ({ onSave, saving, canSubmit, title }) => (
    <div>
      <div data-testid="hero-title">{title || ""}</div>
      <button onClick={onSave} disabled={saving || !canSubmit}>
        Save From Hero
      </button>
    </div>
  ),
}));

vi.mock("../../src/pages/shared/BlogEditor/Components/EditorForm", () => ({
  default: ({
    title,
    setTitle,
    tags,
    setTags,
    thumbnailUrl,
    setThumbnailUrl,
    content,
    setContent,
    isPublished,
    setIsPublished,
    onSave,
    loading,
    error,
    canSubmit,
    saving,
  }) => (
    <div>
      {loading ? <div>Loading editor</div> : null}
      {error ? <div>{error}</div> : null}
      <input
        aria-label="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        aria-label="tags-input"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <input
        aria-label="thumbnail-input"
        value={thumbnailUrl}
        onChange={(e) => setThumbnailUrl(e.target.value)}
      />
      <textarea
        aria-label="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <label>
        Published
        <input
          aria-label="publish-input"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
      </label>
      <button onClick={onSave} disabled={saving || !canSubmit}>
        Save From Form
      </button>
    </div>
  ),
}));

function renderWithQueryClient(component) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
}

describe("F08 - BlogEditor unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoggedIn.mockReturnValue(true);
    mockUseParams.mockReturnValue({});
    mockCreatePost.mockResolvedValue({ id: "post-created-001" });
    mockUpdatePost.mockResolvedValue({ ok: true });
    mockFetchPostById.mockResolvedValue(null);
  });

  it("UT_F08_45 redirects to login when the user is not authenticated", async () => {
    mockIsLoggedIn.mockReturnValue(false);

    renderWithQueryClient(<BlogEditor mode="create" />);

    await waitFor(() => {
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  it("UT_F08_46 does not submit createPost when the form is invalid", async () => {
    renderWithQueryClient(<BlogEditor mode="create" />);

    expect(screen.getByText("Save From Form")).toBeDisabled();
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockCreatePost).not.toHaveBeenCalled();
    });
  });

  it("UT_F08_47 creates a post successfully in create mode", async () => {
    renderWithQueryClient(<BlogEditor mode="create" />);

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "Blog Test Title" },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Blog body content" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
    });

    expect(mockCreatePost.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: "Blog Test Title",
        contentJson: JSON.stringify({
          blocks: [{ text: "Blog body content" }],
        }),
        thumbnailUrl: null,
        tags: "",
        isPublished: true,
      })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/blog/post-created-001", {
        replace: true,
      });
    });
  });

  it("UT_F08_48 trims fields and uses hero save button in create mode", async () => {
    renderWithQueryClient(<BlogEditor mode="create" />);

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "  Trimmed title  " },
    });
    fireEvent.change(screen.getByLabelText("tags-input"), {
      target: { value: "  react,testing  " },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "  Trimmed body  " },
    });
    fireEvent.click(screen.getByText("Save From Hero"));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
    });

    expect(mockCreatePost.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: "Trimmed title",
        tags: "react,testing",
        contentJson: JSON.stringify({
          blocks: [{ text: "Trimmed body" }],
        }),
      })
    );
  });

  it("UT_F08_49 navigates using result.data.id when create response is wrapped", async () => {
    mockCreatePost.mockResolvedValue({ data: { id: "post-created-002" } });

    renderWithQueryClient(<BlogEditor mode="create" />);

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "Another title" },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Another content body" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/blog/post-created-002", {
        replace: true,
      });
    });
  });

  it("UT_F08_50 shows a destructive toast when createPost fails", async () => {
    mockCreatePost.mockRejectedValue(new Error("Cannot create post"));

    renderWithQueryClient(<BlogEditor mode="create" />);

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "Title" },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Content" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Cannot create post",
          variant: "destructive",
        })
      );
    });
  });

  it("UT_F08_51 shows loading state while fetching an existing post in edit mode", async () => {
    mockUseParams.mockReturnValue({ id: "post-123" });
    mockFetchPostById.mockImplementation(
      () => new Promise(() => {})
    );

    renderWithQueryClient(<BlogEditor mode="edit" />);

    expect(screen.getByText("Loading editor")).toBeInTheDocument();
  });

  it("UT_F08_52 loads an existing post and updates it successfully in edit mode", async () => {
    mockUseParams.mockReturnValue({ id: "post-123" });
    mockFetchPostById.mockResolvedValue({
      id: "post-123",
      title: "Old title",
      tags: "react",
      thumbnailUrl: "https://img.test/cover.jpg",
      isPublished: true,
      contentJson: JSON.stringify({
        blocks: [{ text: "Old content" }],
      }),
    });

    renderWithQueryClient(<BlogEditor mode="edit" />);

    await waitFor(() => {
      expect(screen.getByLabelText("title-input")).toHaveValue("Old title");
      expect(screen.getByLabelText("content-input")).toHaveValue("Old content");
      expect(screen.getByTestId("hero-title")).toHaveTextContent("Old title");
    });

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "Updated title" },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Updated content" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdatePost.mock.calls[0]).toEqual([
      "post-123",
      expect.objectContaining({
        title: "Updated title",
        contentJson: JSON.stringify({
          blocks: [{ text: "Updated content" }],
        }),
      }),
    ]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/blog/my", {
        replace: true,
      });
    });
  });

  it("UT_F08_53 falls back to empty content when contentJson is invalid", async () => {
    mockUseParams.mockReturnValue({ id: "post-456" });
    mockFetchPostById.mockResolvedValue({
      id: "post-456",
      title: "Invalid content",
      tags: "broken",
      contentJson: "{invalid-json",
    });

    renderWithQueryClient(<BlogEditor mode="edit" />);

    await waitFor(() => {
      expect(screen.getByLabelText("title-input")).toHaveValue("Invalid content");
      expect(screen.getByLabelText("content-input")).toHaveValue("");
    });
  });

  it("UT_F08_54 surfaces fetch errors from edit mode", async () => {
    mockUseParams.mockReturnValue({ id: "post-789" });
    mockFetchPostById.mockRejectedValue(new Error("Load failed"));

    renderWithQueryClient(<BlogEditor mode="edit" />);

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });
  });

  it("UT_F08_55 shows a destructive toast when updatePost fails", async () => {
    mockUseParams.mockReturnValue({ id: "post-999" });
    mockFetchPostById.mockResolvedValue({
      id: "post-999",
      title: "Need update",
      contentJson: JSON.stringify({ blocks: [{ text: "Body" }] }),
    });
    mockUpdatePost.mockRejectedValue(new Error("Cannot update post"));

    renderWithQueryClient(<BlogEditor mode="edit" />);

    await waitFor(() => {
      expect(screen.getByLabelText("title-input")).toHaveValue("Need update");
    });

    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Changed body" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lỗi",
          description: "Cannot update post",
          variant: "destructive",
        })
      );
    });
  });

  it("KF_F08_01 should not navigate to /blog/undefined when create API returns no id", async () => {
    mockCreatePost.mockResolvedValue({});

    renderWithQueryClient(<BlogEditor mode="create" />);

    fireEvent.change(screen.getByLabelText("title-input"), {
      target: { value: "Post without returned id" },
    });
    fireEvent.change(screen.getByLabelText("content-input"), {
      target: { value: "Valid content for a post without returned id" },
    });
    fireEvent.click(screen.getByText("Save From Form"));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith("/blog/undefined", {
        replace: true,
      });
    });
  });
});
