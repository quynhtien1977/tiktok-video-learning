import { config } from "@remotion/eslint-config-flat";

export default [
  { ignores: [".agents/**", "out/**", "capcut/**", "node_modules/**"] },
  ...(Array.isArray(config) ? config : [config]),
];
