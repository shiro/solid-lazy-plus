import path from "path";
import { Component } from "solid-js";
import { isServer } from "solid-js/web";
import { useHead } from "@solidjs/meta";
import { lazy as solidLazy } from "solid-js";
import { getManifest } from "vinxi/manifest";
import { ManifestChunk } from "vite";

// TODO: implement these as public APIs in Vinxi?
const getApp = () => (globalThis as any).app;
const getRouter = (name: string) => getApp().getRouter(name);
const getBundlerManifest = (name: string): Record<string, ManifestChunk> =>
  getApp().config.buildManifest[name];
const getBaseUrl = (name: string) => {
  const app = getApp();
  const router = getRouter(name);
  return app.config.server.baseURL ?? "" + router.base;
};

const withoutQuery = (url: string) => url.split("?")[0];

const collectAssets = function <
  T extends () => Promise<{ default: Component<any> }>,
>(fn: T): T {
  if (!isServer) return fn;

  const wrapper: any = async () => {
    const mod = await fn();

    let entryId = (mod as any).id$$;
    if (!entryId) return mod;

    if (import.meta.env.DEV) {
      const moduleGraph = getManifest("client").dev.server.moduleGraph;

      return {
        default: (...args: any[]) => {
          const inlineCSS: [id: string, code: string][] = [];
          const visited: Set<String> = new Set();

          const traverse = function (id: string) {
            const chunk = moduleGraph.idToModuleMap.get(id);
            if (!chunk?.file || !chunk?.id) return;

            if (visited.has(id)) return;
            visited.add(id);

            const imports = [...chunk.clientImportedModules.values()];

            for (const importedChunk of imports) {
              if (!importedChunk.file) continue;
              traverse(importedChunk.file);
            }

            if (
              [".css", ".scss"].some((x) => withoutQuery(chunk.url).endsWith(x))
            ) {
              if (!chunk.transformResult?.code) return;

              const start = 'const __vite__css = "';
              const end = '"\n__vite__updateStyle';
              let code = chunk.transformResult.code;

              code = code
                .substring(
                  code.indexOf(start) + start.length,
                  code.indexOf(end),
                )
                .replaceAll("\\n", "\n")
                .replaceAll('\\"', '"')
                .replaceAll("\\\\", "\\");

              inlineCSS.push([chunk.id, code]);
            }
          };

          traverse(entryId);

          for (const [id, code] of inlineCSS) {
            useHead({
              id: "",
              tag: "style",
              props: {
                type: "text/css",
                ["data-vite-dev-id"]: id,
                ["data-imported-from"]: entryId,
                children: code,
              },
              setting: { close: true },
            });
          }

          return mod.default.apply(mod, args as any);
        },
      };
    } else {
      entryId = path.relative(process.cwd(), entryId);
      const preloadCSSUrls: string[] = [];
      const preloadOtherUrls: string[] = [];
      const visited: Set<String> = new Set();

      const router = "client";
      const assets = getBundlerManifest(router);
      if (!assets[entryId]) return mod;

      const traverse = function (id: string) {
        const chunk = assets[id];
        if (!chunk) return;

        if (visited.has(id)) return;
        visited.add(id);

        for (const id of chunk.imports || []) {
          traverse(id);
        }
        for (const url of chunk.css || []) {
          if (preloadCSSUrls.includes(url)) continue;
          preloadCSSUrls.push(url);
        }
        for (const url of chunk.assets || []) {
          if (preloadOtherUrls.includes(url)) continue;
          preloadOtherUrls.push(url);
        }
      };
      traverse(entryId);

      const base = getBaseUrl(router);

      return {
        default: (...args: any[]) => {
          for (const url of [...preloadCSSUrls, ...preloadOtherUrls]) {
            const href = base + "/" + url;
            const ext = href.slice(href.lastIndexOf(".") + 1);

            if (ext == "css")
              useHead({
                id: "",
                tag: "link",
                props: {
                  rel: "stylesheet",
                  href,
                },
              });
            if (["woff", "woff2"].some((x) => ext == x)) {
              useHead({
                id: "",
                tag: "link",
                props: {
                  href,
                  rel: "preload",
                  as: "font",
                  type: `font/${ext}`,
                  crossorigin: "",
                },
              });
            }
          }

          return mod.default.apply(mod, args as any);
        },
      };
    }
  };

  return wrapper;
};

export const lazy = <T extends Component<any>>(
  fn: () => Promise<{ default: T }>,
) => solidLazy(collectAssets(fn));
