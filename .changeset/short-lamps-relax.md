---
"solid-lazy-plus": minor
---

Changed the internal way how dynamically loaded module ids are tracked.

Instead of exporting the id in all modules, it will now be appended to the actual dynamic import statements, and only in jsx/tsx modules. E.g. an import like `import("./lazyForm")` will be transformed to `import("./lazyForm").then(m => ({ ...m, id$$: "[id]" }))`. This should result in a smaller build output and faster build times.
