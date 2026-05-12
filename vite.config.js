import { defineConfig } from "vite";

// Use relative URLs so CSS/JS work on GitHub Pages project sites
// (e.g. https://user.github.io/repo-name/) where the app is not at domain root.
export default defineConfig({
  root: ".",
  publicDir: "public",
  base: "./",
});
