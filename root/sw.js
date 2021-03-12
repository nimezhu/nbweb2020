importScripts("cache-polyfill.js")

var CACHE_VERSION = 'v0.9.3';
var CACHE_FILES = [
    "/manifest.json",
    "/lib/jquery.min.js",
    "/lib/jquery-ui.min.js",
    "/lib/jquery.tablednd.js",
    "/lib/bootstrap.min.js",
    "/static/lib/popper.min.js",
    "/lib/d3.v5.min.js",
    "/lib/dat.gui.min.js",
    "/lib/awesomplete.min.js",
    "/local/lib/handsontable.min.js",
    "/local/lib/snow.min.js", //cnb 
    "/static/lib/cnb.js",     //cnb
    "/css/bootstrap.min.css",
    "/css/bootstrap-toggle.min.css",
    "/css/goldenlayout-base.css",
    "/css/jquery-ui.min.css",
    "/static/css/dat-gui-nb-theme.css",
    "/css/awesomplete.min.css",
    "/static/lib/localforage.min.js",
    "/local/lib/onload.js", //cnb
    "/local/style/handsontable.min.css",
    "/local/style/snow.css", //cnb
    "/static/css/robotomono.css",
    "/static/lib/sand.min.js", //cnb
    "/static/css/sand.base.css", //cleanBrush
    "/static/css/sand.light.css",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhGq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhPq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhHq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhIq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhEq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhFq3-OXg.woff2",
    "/static/fonts/robotomono/v6/L0x5DF4xlVMF-BfR8bXMIjhLq38.woff2",
    "/v1/main.html", //cnb
    "/static/image/icon.png",
    "/static/image/extension_install.png", 
    "/css/goldenlayout-light-theme.css",
    "/static/data/cytoband/hg19.cytoBand.txt",
    "/static/data/cytoband/hg38.cytoBand.txt",
    "/static/data/cytoband/mm10.cytoBand.txt",
    "/static/data/cytoband/mm9.cytoBand.txt",
    "/static/data/chromSizes/hg19.chrom.sizes",
    "/static/data/chromSizes/hg38.chrom.sizes",
    "/static/data/chromSizes/mm10.chrom.sizes",
    "/static/data/chromSizes/mm9.chrom.sizes",
    "/static/data/chromSizes/ce6.chrom.sizes",
    "/static/data/chromSizes/ce10.chrom.sizes",
    "/fonts/glyphicons-halflings-regular.woff2",
    "/static/studio/gbrowse.html", 
    "/static/lib/jspdf.min.js",
    "/static/lib/svg2pdf.min.js",
    "/static/studio/css/base.css",
    "/static/studio/lib/main.js"
    
];
const cacheResources = async () => {
  const cache = await caches.open(CACHE_VERSION)
  return cache.addAll(CACHE_FILES)
}

self.addEventListener('install', event =>
  event.waitUntil(cacheResources())
)
const myfetch = async req => {

}
const cachedResource = async req => {
  const cache = await caches.open(CACHE_VERSION)
  return await cache.match(req, {'ignoreSearch': true} ).then(function(response) {
                return response || fetch(req).then(function(response) {
                    return response;
                }).catch(function(e){
                    return "not found";
                });
    })
}

self.addEventListener('fetch', event =>
  event.respondWith(cachedResource(event.request))
)
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(key, i) {
                if (key !== CACHE_VERSION) {
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});

self.addEventListener('message', function(event) {
    console.log("message in service worker",event.data)
    if (event.data.action === 'skipWaiting') {

        try {
        console.log("calling skipWaiting")
        self.skipWaiting();
        } catch(e) {
            console.log(e)
        }   
    }
    if (event.data.command == "version") {
        event.ports[0].postMessage({
            "version":CACHE_VERSION
        })
    }
});


