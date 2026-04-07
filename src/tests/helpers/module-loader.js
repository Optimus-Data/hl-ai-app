const path = require('node:path');

function loadModuleWithMocks(modulePath, mocks = {}) {
  const resolvedModule = require.resolve(modulePath);
  const originals = [];

  for (const [request, exports] of Object.entries(mocks)) {
    const resolvedDependency = require.resolve(request, {
      paths: [path.dirname(resolvedModule)],
    });

    originals.push([resolvedDependency, require.cache[resolvedDependency]]);
    require.cache[resolvedDependency] = {
      id: resolvedDependency,
      filename: resolvedDependency,
      loaded: true,
      exports,
    };
  }

  delete require.cache[resolvedModule];
  const loadedModule = require(resolvedModule);

  return {
    module: loadedModule,
    restore() {
      delete require.cache[resolvedModule];

      for (const [resolvedDependency, originalEntry] of originals) {
        if (originalEntry) {
          require.cache[resolvedDependency] = originalEntry;
        } else {
          delete require.cache[resolvedDependency];
        }
      }
    },
  };
}

module.exports = { loadModuleWithMocks };
