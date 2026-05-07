import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchBar from "../../src/pages/shared/Forum/components/SearchBar";

describe("F09 - Forum SearchBar unit tests", () => {
  it("UT_F09_07 renders the forum search controls", () => {
    render(<SearchBar onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tìm kiếm/i })).toBeInTheDocument();
  });

  it("UT_F09_08 passes trimmed input to the submit handler", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i), {
      target: { value: "  react hooks  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tìm kiếm/i }));

    expect(onSubmit).toHaveBeenCalledWith("react hooks");
  });

  it("UT_F09_09 submits an empty string when the input contains only spaces", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i), {
      target: { value: "   " },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Tìm kiếm/i }).closest("form"));

    expect(onSubmit).toHaveBeenCalledWith("");
  });

  it("UT_F09_10 submits when the form is submitted directly", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i), {
      target: { value: "forum ranking" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Tìm kiếm/i }).closest("form"));

    expect(onSubmit).toHaveBeenCalledWith("forum ranking");
  });

  it("UT_F09_11 does not crash when onSubmit is omitted", () => {
    render(<SearchBar />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i), {
      target: { value: "safe callback" },
    });

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: /Tìm kiếm/i }));
    }).not.toThrow();
  });

  it("UT_F09_12 toggles button background on hover", () => {
    render(<SearchBar onSubmit={vi.fn()} />);

    const button = screen.getByRole("button", { name: /Tìm kiếm/i });

    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ background: "#1d4ed8" });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ background: "#2563eb" });
  });

  it("KF_F09_01 should ignore a blank query instead of submitting an empty string", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm câu hỏi theo tag/i), {
      target: { value: "    " },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Tìm kiếm/i }).closest("form"));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
