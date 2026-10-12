import type { NextConfig } from "next";

const cfg: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  cacheComponents: true,
};

export default cfg;
