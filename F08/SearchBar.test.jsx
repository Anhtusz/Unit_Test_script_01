import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchBar from "../../src/pages/shared/Blog/components/SearchBar";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("F08 - Blog SearchBar unit tests", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("UT_F08_31 renders the search controls", () => {
    render(<SearchBar />);

    expect(screen.getByText(/Tìm kiếm bài viết/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("VD: react performance, UX, ielts speaking...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tìm kiếm/i })).toBeInTheDocument();
  });

  it("UT_F08_32 navigates to the search page with the trimmed keyword", () => {
    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("VD: react performance, UX, ielts speaking..."),
      { target: { value: "  react performance  " } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Tìm kiếm/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/blog/search?q=react%20performance");
  });

  it("UT_F08_33 does not navigate when the trimmed keyword is empty", () => {
    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("VD: react performance, UX, ielts speaking..."),
      { target: { value: "   " } }
    );
    fireEvent.submit(screen.getByRole("button", { name: /Tìm kiếm/i }).closest("form"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("UT_F08_34 submits when the form is submitted with Enter", () => {
    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("VD: react performance, UX, ielts speaking..."),
      { target: { value: "vite tips" } }
    );
    fireEvent.submit(screen.getByRole("button", { name: /Tìm kiếm/i }).closest("form"));

    expect(mockNavigate).toHaveBeenCalledWith("/blog/search?q=vite%20tips");
  });

  it("UT_F08_35 encodes reserved characters in the query string", () => {
    render(<SearchBar />);

    fireEvent.change(
      screen.getByPlaceholderText("VD: react performance, UX, ielts speaking..."),
      { target: { value: "c# & .net" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Tìm kiếm/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/blog/search?q=c%23%20%26%20.net");
  });
});
