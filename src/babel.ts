import type * as BabelCoreNamespace from "@babel/core";
import { PluginObj } from "@babel/core";
import path from "path";
import type { AliasOptions } from "vite";

export type AliasMap = Exclude<AliasOptions, { [find: string]: string }>;
type Babel = typeof BabelCoreNamespace;

interface Options {
  alias?: AliasMap;
}

export default (babel: Babel, options: Options): PluginObj => {
  const { alias } = options;
  const t = babel.types;

  let exclude = false;
  let isImported = false;
  let baseDir!: string;

  return {
    visitor: {
      Program(p, state) {
        const f = state.file.opts.filename!;
        exclude = !f?.endsWith(".tsx");
        baseDir = path.dirname(f);
      },
      ImportDeclaration(p) {
        if (exclude) return;

        const importSrc = p.node.source.value;

        const isRegister = importSrc == "solid-lazy-plus";
        if (isRegister) isImported = true;
      },
      CallExpression(p) {
        if (
          !isImported ||
          p.node.callee.type != "Identifier" ||
          p.node.callee.name != "lazy" ||
          p.node.arguments[0]?.type != "ArrowFunctionExpression" ||
          p.node.arguments[0]?.body.type != "CallExpression" ||
          p.node.arguments[0]?.body.arguments[0].type != "StringLiteral"
        )
          return;

        let importFilepath = p.node.arguments[0]?.body.arguments[0].value;

        // resolve all aliases
        for (const { find, replacement } of alias ?? []) {
          importFilepath = importFilepath.replace(find, replacement);
        }

        // to absolute filepath with extension
        importFilepath = path.resolve(baseDir, importFilepath) + ".tsx";

        p.node.arguments[0].body = t.callExpression(
          t.memberExpression(p.node.arguments[0]?.body, t.identifier("then")),
          [
            t.arrowFunctionExpression(
              [t.identifier("m")],
              t.objectExpression([
                t.spreadElement(t.identifier("m")),
                t.objectProperty(
                  t.identifier("id$$"),
                  t.stringLiteral(importFilepath),
                ),
              ]),
            ),
          ],
        );
      },
    },
  };
};
