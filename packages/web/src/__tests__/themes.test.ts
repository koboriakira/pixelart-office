import { describe, it, expect } from "vitest";
import {
  DEPARTMENT_THEMES,
  PROVIDER_COLORS,
  type RoomTheme,
} from "../components/office-view/themes";

describe("DEPARTMENT_THEMES", () => {
  const departments = ["dev", "design", "planning", "operations", "qa"] as const;

  it("has themes for all 5 departments", () => {
    for (const dept of departments) {
      expect(DEPARTMENT_THEMES[dept]).toBeDefined();
    }
  });

  it("each department has light and dark variants", () => {
    for (const dept of departments) {
      expect(DEPARTMENT_THEMES[dept].light).toBeDefined();
      expect(DEPARTMENT_THEMES[dept].dark).toBeDefined();
    }
  });

  it("each theme has required color properties as numbers", () => {
    const keys: (keyof RoomTheme)[] = ["floor1", "floor2", "wall", "accent"];
    for (const dept of departments) {
      for (const variant of ["light", "dark"] as const) {
        for (const key of keys) {
          const value = DEPARTMENT_THEMES[dept][variant][key];
          expect(typeof value).toBe("number");
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(0xffffff);
        }
      }
    }
  });
});

describe("PROVIDER_COLORS", () => {
  it("has Claude color", () => {
    expect(PROVIDER_COLORS.claude).toBe(0xd97706);
  });

  it("has Copilot color", () => {
    expect(PROVIDER_COLORS.copilot).toBe(0x16a34a);
  });

  it("has Other color", () => {
    expect(PROVIDER_COLORS.other).toBe(0x6b7280);
  });
});
