import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Header } from "../components/Header";
import type { Agent } from "../types";

afterEach(cleanup);

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "a1",
    name: "Agent-1",
    provider: "claude",
    status: "idle",
    current_task: null,
    department_id: null,
    sprite_number: 0,
    updated_at: Date.now(),
    ...overrides,
  };
}

describe("Header", () => {
  it("renders the title", () => {
    render(<Header agents={[]} theme="light" onToggleTheme={() => {}} />);
    expect(screen.getByText("Pixel Art Office")).toBeTruthy();
  });

  it("counts agent statuses correctly", () => {
    const agents: Agent[] = [
      makeAgent({ id: "1", status: "working" }),
      makeAgent({ id: "2", status: "working" }),
      makeAgent({ id: "3", status: "idle" }),
      makeAgent({ id: "4", status: "offline" }),
    ];
    render(<Header agents={agents} theme="light" onToggleTheme={() => {}} />);
    expect(screen.getByText(/working.*2/i)).toBeTruthy();
    expect(screen.getByText(/idle.*1/i)).toBeTruthy();
    expect(screen.getByText(/offline.*1/i)).toBeTruthy();
  });

  it("shows zero counts when no agents", () => {
    render(<Header agents={[]} theme="light" onToggleTheme={() => {}} />);
    expect(screen.getByText(/working.*0/i)).toBeTruthy();
    expect(screen.getByText(/idle.*0/i)).toBeTruthy();
    expect(screen.getByText(/offline.*0/i)).toBeTruthy();
  });
});
