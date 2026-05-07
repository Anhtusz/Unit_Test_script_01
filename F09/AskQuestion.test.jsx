import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AskQuestion from "../../src/pages/shared/Forum/AskQuestion";

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockRequireAuth = vi.fn();
const mockIsLoggedIn = vi.fn(() => true);
const mockHttp = vi.fn();
const mockAuthHeaders = vi.fn((extra = {}) => extra);

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/forum/new", search: "" }),
}));

vi.mock("../../src/components/Header", () => ({
  default: () => <div data-testid="mock-header" />,
}));

vi.mock("../../src/components/Footer", () => ({
  default: () => <div data-testid="mock-footer" />,
}));

vi.mock("../../src/components/ui/Toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../src/utils/http", () => ({
  http: (...args) => mockHttp(...args),
}));

vi.mock("../../src/pages/shared/Forum/utils/helpers", () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  requireAuth: (...args) => mockRequireAuth(...args),
  authHeaders: (...args) => mockAuthHeaders(...args),
}));

function okResponse(body) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(body),
  };
}

function errorResponse(status, body) {
  return {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function getFields() {
  const [titleInput, tagsInput, contentInput] = screen.getAllByRole("textbox");
  return { titleInput, tagsInput, contentInput };
}

describe("F09 - AskQuestion unit tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockIsLoggedIn.mockReturnValue(true);
    mockHttp.mockResolvedValue(okResponse({ id: "question-001" }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("UT_F09_13 redirects to login when the user is not authenticated", async () => {
    mockIsLoggedIn.mockReturnValue(false);

    render(<AskQuestion />);

    await waitFor(() => {
      expect(mockRequireAuth).toHaveBeenCalledWith(mockNavigate, "/forum/new");
    });
  });

  it("UT_F09_14 does not redirect when the user is authenticated", async () => {
    render(<AskQuestion />);

    await waitFor(() => {
      expect(mockRequireAuth).not.toHaveBeenCalled();
    });
  });

  it("UT_F09_15 disables the submit button initially", () => {
    render(<AskQuestion />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("UT_F09_16 enables submit when title and content reach the minimum length", () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "123456" } });
    fireEvent.change(contentInput, { target: { value: "1234567890" } });

    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("UT_F09_17 keeps submit disabled when title is shorter than 6 characters", () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "12345" } });
    fireEvent.change(contentInput, { target: { value: "1234567890" } });

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("UT_F09_18 keeps submit disabled when content is shorter than 10 characters", () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "123456" } });
    fireEvent.change(contentInput, { target: { value: "123456789" } });

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("UT_F09_19 submits a valid question with normalized tags", async () => {
    render(<AskQuestion />);
    const { titleInput, tagsInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(tagsInput, { target: { value: " react, hooks , api " } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(mockHttp.mock.calls[0][1].body);
    expect(requestBody).toEqual({
      title: "Question title",
      contentJson: JSON.stringify({
        blocks: [{ text: "This is a valid forum question body." }],
      }),
      tags: "react,hooks,api",
    });
  });

  it("UT_F09_20 trims title and content before building the payload", async () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "  Trimmed title  " } });
    fireEvent.change(contentInput, {
      target: { value: "  Trimmed question body.  " },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(mockHttp.mock.calls[0][1].body);
    expect(requestBody.title).toBe("Trimmed title");
    expect(requestBody.contentJson).toBe(
      JSON.stringify({ blocks: [{ text: "Trimmed question body." }] })
    );
  });

  it("UT_F09_21 removes empty tag segments from the payload", async () => {
    render(<AskQuestion />);
    const { titleInput, tagsInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(tagsInput, { target: { value: "react, , hooks,  ,api" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(mockHttp.mock.calls[0][1].body);
    expect(requestBody.tags).toBe("react,hooks,api");
  });

  it("UT_F09_22 sends an empty tags string when the tags input is blank", async () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(mockHttp.mock.calls[0][1].body);
    expect(requestBody.tags).toBe("");
  });

  it("UT_F09_23 does not call the API when the form is invalid", async () => {
    render(<AskQuestion />);
    const { titleInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "short" } });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).not.toHaveBeenCalled();
    });
  });

  it("UT_F09_24 shows submitting state while the request is pending", async () => {
    let resolveRequest;
    mockHttp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Đang tạo/i })).toBeDisabled();
    });

    resolveRequest(okResponse({ id: "question-pending" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
  });

  it("UT_F09_25 prevents duplicate submits while the request is pending", async () => {
    let resolveRequest;
    mockHttp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    resolveRequest(okResponse({ id: "question-once" }));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
  });

  it("UT_F09_26 shows a success toast after creating a question", async () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Thành công",
        })
      );
    });
  });

  it("UT_F09_27 navigates to the question detail page when the response is wrapped", async () => {
    vi.useFakeTimers();
    mockHttp.mockResolvedValue(okResponse({ data: { id: "question-002" } }));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockToast).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/forum/question-002", {
      replace: true,
    });
  });

  it("UT_F09_28 navigates back to the forum list when the response has no id", async () => {
    vi.useFakeTimers();
    mockHttp.mockResolvedValue(okResponse({ data: {} }));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockToast).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/forum", { replace: true });
  });

  it("UT_F09_29 supports a direct response object containing the new id", async () => {
    vi.useFakeTimers();
    mockHttp.mockResolvedValue(okResponse({ id: "question-003" }));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockToast).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/forum/question-003", {
      replace: true,
    });
  });

  it("UT_F09_30 shows backend message in the error toast when the API fails", async () => {
    mockHttp.mockResolvedValue(errorResponse(400, { message: "Invalid question" }));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tạo câu hỏi thất bại",
          description: "Invalid question",
          variant: "destructive",
        })
      );
    });
  });

  it("UT_F09_31 falls back to HTTP status when the error payload has no message", async () => {
    mockHttp.mockResolvedValue(errorResponse(500, {}));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "HTTP 500",
          variant: "destructive",
        })
      );
    });
  });

  it("UT_F09_32 restores the normal submit button text after a failed request", async () => {
    mockHttp.mockResolvedValue(errorResponse(400, { message: "Bad request" }));

    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Đăng câu hỏi/i })).toBeEnabled();
    });
  });

  it("UT_F09_33 passes accept and content-type headers through authHeaders", async () => {
    render(<AskQuestion />);
    const { titleInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockAuthHeaders).toHaveBeenCalledWith({
        "Content-Type": "application/json",
        accept: "*/*",
      });
    });
  });

  it("KF_F09_04 should remove duplicate tags before AskQuestion submits the payload", async () => {
    render(<AskQuestion />);
    const { titleInput, tagsInput, contentInput } = getFields();

    fireEvent.change(titleInput, { target: { value: "Question title" } });
    fireEvent.change(tagsInput, {
      target: { value: "react, hooks, react, api, hooks" },
    });
    fireEvent.change(contentInput, {
      target: { value: "This is a valid forum question body." },
    });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockHttp).toHaveBeenCalledTimes(1);
    });

    const payload = JSON.parse(mockHttp.mock.calls[0][1].body);
    expect(payload.tags).toBe("react,hooks,api");
  });
});
