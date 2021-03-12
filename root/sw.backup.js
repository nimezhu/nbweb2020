importScripts("cache-polyfill.js")

var CACHE_VERSION = 'E0.5.0';
var CACHE_FILES = [
    "/manifest.json",
    "/lib/jquery.min.js",
    "/lib/jquery-ui.min.js",
    "/lib/jquery.tablednd.js",
    "/lib/bootstrap.min.js",
    "/static/lib/popper.min.js",
    "/lib/goldenlayout.min.js",
    "/lib/d3.v5.min.js",
    "/lib/dat.gui.min.js",
    "/lib/awesomplete.min.js",
    "/web/lib/sand.min.js",   //cnb obsoleted , replace by /static/lib/sand.min.js
    "/local/lib/handsontable.min.js",
    "/lib/plotly.min.js",
    "/local/lib/snow.min.js", //cnb 
    "/static/lib/cnb.js",     //cnb
    "/css/bootstrap.min.css",
    "/css/bootstrap-toggle.min.css",
    "/css/goldenlayout-base.css",
    "/css/jquery-ui.min.css",
    "/css/dat-gui-light-theme.css",
    "/css/awesomplete.min.css",
    "/static/lib/3Dmol-nojquery-min.js",
    "/static/lib/localforage.min.js",
    "/local/lib/onload.js", //cnb
    "/static/lib/app.js",   //cnb
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

self.addEventListener('install', function(event) {
    console.log(event)
    console.log("install pwa")
    event.waitUntil(
        caches.open(CACHE_VERSION)
        .then(function(cache) {
            console.log('Opened cache',CACHE_VERSION);
            var k = cache.addAll(CACHE_FILES);
            console.log("Load Cache?",k)
            return k
        })
        .catch(function(e,d){
            console.log("error cache",e,d)
        })
    );
});
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(CACHE_VERSION).then(function(cache) {
            return cache.match(event.request, {'ignoreSearch': true} ).then(function(response) {
                return response || fetch(event.request).then(function(response) {
                    return response;
                }).catch(function(e){
                    return "not found";
                });
            });
        })
    );
});

function requestBackend(event) {
    var url = event.request.clone();
    return fetch(url).then(function(res) {
        //if not a valid response send the error
        if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
        }
        var response = res.clone();

        caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, response);
        });

        return res;
    })
}

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
