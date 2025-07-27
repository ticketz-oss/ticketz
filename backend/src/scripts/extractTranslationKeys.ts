import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "tsconfig.json"
});

const keys = new Set<string>();

const sourceFiles = project.getSourceFiles("src/**/*.{ts,tsx}");

sourceFiles.forEach(file => {
  file.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.CallExpression) {
      const callExpr = node.asKind(SyntaxKind.CallExpression);
      if (!callExpr) return;

      const identifier = callExpr.getExpression().getText();

      if (identifier === "_t") {
        const args = callExpr.getArguments();
        if (
          args.length >= 1 &&
          args[0].getKind() === SyntaxKind.StringLiteral
        ) {
          const key = args[0].getText().slice(1, -1); // remove quotes
          keys.add(key);
        }
      }
    }
  });
});

const output = `export function getAllTranslationKeys(): string[] {
  return [${[...keys].map(k => `\n    "${k}"`).join(",")}\n  ];
}
`;

fs.mkdirSync("src/generated", { recursive: true });
fs.writeFileSync("src/generated/translationKeys.ts", output);

console.log("✔ translationKeys.ts generated with", keys.size, "keys.");
