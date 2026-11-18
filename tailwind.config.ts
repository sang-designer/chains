import type { Config } from "tailwindcss";
import tilePreset from "./tailwind.tile-preset";

// Design tokens, dark mode, container and animations come from the Tile v2
// preset; this file only adds what the app needs on top.
export default {
  presets: [tilePreset as Config],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Tile v2 components ship pre-built; scan them so their classes are generated.
    "./node_modules/@tile/ui/dist/**/*.{js,cjs}",
  ],
  theme: {
    extend: {
      colors: {
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
  },
} satisfies Config;
