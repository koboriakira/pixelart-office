import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeToggle } from "../components/ThemeToggle";

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("renders a toggle button", () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="light" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows Dark label for light theme", () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />);
    expect(screen.getByRole("button").textContent).toContain("Dark");
  });

  it("shows Light label for dark theme", () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />);
    expect(screen.getByRole("button").textContent).toContain("Light");
  });
});
