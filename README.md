# Solid Lazy Plus

This is a drop-in replacement for Solids `lazy` utility specifically to be used in SolidStart projects. Compared to the original, this has the ability to properly register css assets of lazy loaded components during server-side rendering, *in production builds*.

**This is experimental, third-party functionality and hopefully will be integrated into an official solid package, if it proves useful.**

## Vinxi configuration (app.config.ts)

```ts
import { defineConfig } from "@solidjs/start/config";
import lazyPlusPlugin from "solid-lazy-plus/vite";

export default defineConfig({
  vite(options) {
    return {
      plugins: [lazyPlusPlugin({ router: options.router })],
    };
  },
});
```

## Usage

```tsx
import { lazy } from "solid-lazy-plus";

// wrap import
const ComponentA = lazy(() => import("./ComponentA"));

// use in JSX
<ComponentA title={props.title} />;
```
