import { ESLint } from "eslint";

const linter = new ESLint({ cwd: process.cwd() });
const results = await linter.lintFiles(["."]);
const formatter = await linter.loadFormatter("stylish");
const output = formatter.format(results);
console.log(output || "No problems found.");

const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
process.exitCode = errorCount > 0 ? 1 : 0;
