---
"solid-lazy-plus": patch
---

`lazy` will now just return the original module and skip assets registration, if the module cannot be found in the prod manifest.
