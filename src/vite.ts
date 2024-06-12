import babel, { TransformOptions } from "@babel/core";
import type { Plugin } from "vite";
import babelLazyPlus, { AliasMap } from "./babel";

interface Options {
  router: string;
  babelConfig?: TransformOptions;
  include?: RegExp;
}

const lazyAssetsPlugin = (options: Options) => {
  if (options.router !== "server") return;
  let alias: AliasMap;

  return {
    name: "lazy-assets",
    config(config) {
      alias = Array.isArray(config.resolve?.alias)
        ? config.resolve.alias
        : [config.resolve?.alias ?? false].filter(Boolean);
    },

    transform(code, id) {
      const shouldTransform = options.include?.test(id) ?? true;
      if (!shouldTransform) return;

      return babel
        .transformAsync(code, {
          ...options.babelConfig,
          filename: id,
          plugins: [
            [babelLazyPlus, { alias }],
            ...(options.babelConfig?.plugins ?? []),
          ],
        })
        .then((result) => ({ code: result?.code ?? "", map: result?.map }));
    },
  } satisfies Plugin;
};

export default lazyAssetsPlugin;
