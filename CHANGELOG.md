# solid-lazy-plus

## 0.1.0

### Minor Changes

- f6fddc2: Changed the internal way how dynamically loaded module ids are tracked.

  Instead of exporting the id in all modules, it will now be appended to the actual dynamic import statements, and only in jsx/tsx modules. E.g. an import like `import("./lazyForm")` will be transformed to `import("./lazyForm").then(m => ({ ...m, id$: "[id]" }))`. This should result in a smaller build output and faster build times.

### Patch Changes

- 50520c5: `lazy` will now just return the original module and skip assets registration, if the module cannot be found in the prod manifest.

## 0.0.6

### Patch Changes

- 2ef64ed: Added repository url to pkg.

## 0.0.5

### Patch Changes

- 25c1dd7: Filled the README with actual content.

## 0.0.4

### Patch Changes

- e5a6f48: Added the `exports` field to package.json.

## 0.0.3

### Patch Changes

- 3254593: Opened up the peerDependency ranges to reduce duplicates.

## 0.0.2

### Patch Changes

- db6aa6a: Made sure that all files are included in the npm release.

## 0.0.1

### Patch Changes

- 931fafe: Implemented the first version.
