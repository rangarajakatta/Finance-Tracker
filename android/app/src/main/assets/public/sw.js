/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "58540de0e264a6589fc088c8551ed67a"
  }, {
    "url": "pwa-512x512.png",
    "revision": "06a1db4ca3cae7c08881ff123c344cd8"
  }, {
    "url": "pwa-192x192.png",
    "revision": "845bca9c136efa9920d7d677c82710a1"
  }, {
    "url": "index.html",
    "revision": "fa1f83440527a5e368cf0d4330825f0f"
  }, {
    "url": "icon.svg",
    "revision": "4291371edadc03d370a8ef1323f519ca"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "843f470ee4c732f7627d693c3704a7ce"
  }, {
    "url": "assets/web-KrouBDEz.js",
    "revision": null
  }, {
    "url": "assets/web-DPiyl4Sy.js",
    "revision": null
  }, {
    "url": "assets/index-D0AjiFSX.js",
    "revision": null
  }, {
    "url": "assets/index-BGc8o6-0.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "843f470ee4c732f7627d693c3704a7ce"
  }, {
    "url": "icon.svg",
    "revision": "4291371edadc03d370a8ef1323f519ca"
  }, {
    "url": "pwa-192x192.png",
    "revision": "845bca9c136efa9920d7d677c82710a1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "06a1db4ca3cae7c08881ff123c344cd8"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "58540de0e264a6589fc088c8551ed67a"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d226621f2704126bc2993adaa7058632"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
