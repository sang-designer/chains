import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // @tile/ui imports these at the top of its bundle even though they are
    // optional peers (only SqlEditor and DataTable use them). This app uses
    // neither, so resolve them to an empty module instead of installing them.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@monaco-editor/react": false,
      "monaco-editor": false,
      "apache-arrow": false,
    };
    return config;
  },
};

export default nextConfig;
