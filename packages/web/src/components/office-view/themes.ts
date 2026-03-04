export interface RoomTheme {
  floor1: number;
  floor2: number;
  wall: number;
  accent: number;
}

interface DepartmentThemeSet {
  light: RoomTheme;
  dark: RoomTheme;
}

export const DEPARTMENT_THEMES: Record<string, DepartmentThemeSet> = {
  dev: {
    light: { floor1: 0xe8f0fe, floor2: 0xd2e3fc, wall: 0x4285f4, accent: 0x1967d2 },
    dark: { floor1: 0x1a2744, floor2: 0x1e3a5f, wall: 0x2b5797, accent: 0x4285f4 },
  },
  design: {
    light: { floor1: 0xfce8e6, floor2: 0xf8d0cc, wall: 0xea4335, accent: 0xc5221f },
    dark: { floor1: 0x3c1f1c, floor2: 0x4a2522, wall: 0x973029, accent: 0xea4335 },
  },
  planning: {
    light: { floor1: 0xfef7e0, floor2: 0xfceab5, wall: 0xfbbc04, accent: 0xf29900 },
    dark: { floor1: 0x3a3018, floor2: 0x4a3d1e, wall: 0x9a7b04, accent: 0xfbbc04 },
  },
  operations: {
    light: { floor1: 0xe6f4ea, floor2: 0xceead6, wall: 0x34a853, accent: 0x1e8e3e },
    dark: { floor1: 0x1a3322, floor2: 0x224430, wall: 0x2d7a43, accent: 0x34a853 },
  },
  qa: {
    light: { floor1: 0xf3e8fd, floor2: 0xe8d0f8, wall: 0xa142f4, accent: 0x8430ce },
    dark: { floor1: 0x2d1a44, floor2: 0x3b2255, wall: 0x7030a0, accent: 0xa142f4 },
  },
};

export const PROVIDER_COLORS = {
  claude: 0xd97706,
  copilot: 0x16a34a,
  other: 0x6b7280,
} as const;
