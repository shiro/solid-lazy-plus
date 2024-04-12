import { relative } from "path";
import type { Plugin } from "vite";

const lazyAssetsPlugin = ({ router }: { router: string }): any => {
  if (router !== "server") return;
  const cwd = process.cwd();
  return {
    name: "lazy-assets",
    renderDynamicImport(opts) {
      if (!opts.moduleId.match(/(ts|js)x$/)) return;
      if (!opts.targetModuleId?.match(/(ts|js)x?$/)) return;
      const moduleId = relative(cwd, opts.targetModuleId);
      return {
        left: "import(",
        right: `).then(m => ({ ...m, id$$: "${moduleId}" }))`,
      };
    },
  } satisfies Plugin;
};

export default lazyAssetsPlugin;
