import type { Theme } from "../hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: "none",
        border: "1px solid currentColor",
        color: "inherit",
        padding: "4px 12px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
