import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow temporary Cloudflare quick-tunnel URLs for testing on a phone.
    allowedHosts: [".trycloudflare.com"],
  },
});
