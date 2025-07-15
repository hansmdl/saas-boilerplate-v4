import { nextJs } from "../../packages/config/src/eslint-preset.js";

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
const eslintConfig = [
  ...nextJs,
  // You can add app-specific rules here
];

export default eslintConfig;
