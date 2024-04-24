import { Component, createUniqueId } from "solid-js";
import { isServer } from "solid-js/web";
import { useHead } from "@solidjs/meta";
import { lazy as solidLazy } from "solid-js";

// TODO: implement these as public APIs in Vinxi?
const getApp = () => (globalThis as any).app;
const getRouter = (name: string) => getApp().getRouter(name);
const getBundlerManifest = (name: string) =>
  getApp().config.buildManifest[name];
const getBaseUrl = (name: string) => {
  const app = getApp();
  const router = getRouter(name);
  return app.config.server.baseURL ?? "" + router.base;
};

// TODO: implement this in @solidjs/start?
const collectAssets = function <
  T extends () => Promise<{ default: Component<any> }>,
>(fn: T): T {
  // Vite handles lazy assets already properly during dev
  if (import.meta.env.DEV || !isServer) {
    return fn;
  }

  const wrapper: any = async () => {
    const mod = await fn();

    const id = (mod as any).id$$;
    if (!id) return mod;

    const router = "client";
    const assets = getBundlerManifest(router);
    if (!assets[id]) return mod;

    const preloadUrls: string[] = [];
    const traverse = function (id: string) {
      const chunk = assets[id];
      if (!chunk) return;
      for (const url of chunk.css || []) {
        if (preloadUrls.includes(url)) continue;
        preloadUrls.push(url);
      }
      for (const url of chunk.assets || []) {
        if (preloadUrls.includes(url)) continue;
        preloadUrls.push(url);
      }
      for (const id of chunk.imports || []) {
        traverse(id);
      }
    };
    traverse(id);

    const base = getBaseUrl(router);

    return {
      default: (...args: any[]) => {
        for (const url of preloadUrls) {
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
          if (["woff", "woff2"].some((x) => ext == x))
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

        return mod.default(args);
      },
    };
  };

  return wrapper;
};

export const lazy = <T extends Component<any>>(
  fn: () => Promise<{ default: T }>,
) => solidLazy(collectAssets(fn));
