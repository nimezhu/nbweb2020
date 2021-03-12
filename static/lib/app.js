(function() {
    let newWorker;
    // The click event on the notification
    document.getElementById('reload').addEventListener('click', function() {
        console.log("reload clicked")
        newWorker.postMessage({
            action: 'skipWaiting'
        });
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', reg.scope);
            if (reg.waiting && reg.active) {
                newWorker = reg.waiting
                let notification = document.getElementById('notify');
                notification.className = 'show'
            } else {
            reg.addEventListener('updatefound', () => {
                newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    switch (newWorker.state) {
                        case 'installed':
                            if (navigator.serviceWorker.controller) {
                                let notification = document.getElementById('notify');
                                notification.className = 'show';
                            }
                            break;
                    }
                });
            })     
            }   
        }).catch(function(err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
            });


        let refreshing;
        // The event listener that is fired when the service worker updates
        // Here we reload the page
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });

        if (navigator.serviceWorker.controller) {
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                        if (event.data.version) {
                            document.getElementById("version").innerHTML = event.data.version
                        }
                }
                navigator.serviceWorker.controller.postMessage({
                    "command": "version",
                }, [messageChannel.port2]);
        } else {
                console.log("No ServiceWorker");
        }

    }
})()
