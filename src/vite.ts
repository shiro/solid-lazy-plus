import { relative, join } from "path";
import MagicString from "magic-string";
import type { Plugin } from "vite";

const lazyAssetsPlugin = ({ router }: { router: string }): any => {
  if (router !== "server") return;
  const modulesAbs = join(process.cwd(), "node_modules");
  return {
    name: "lazy-assets",
    transform(src, id) {
      if (id.startsWith(modulesAbs)) return;
      if (!id.match(/(t|j)sx$/)) return;

      const localId = relative(process.cwd(), id);

      const s = new MagicString(src);
      s.append(`export const id$$ = "${localId}";\n`);

      const code = s.toString();
      const map = s.generateMap();

      return {
        code,
        map,
      };
    },
  } satisfies Plugin;
};

export default lazyAssetsPlugin;
