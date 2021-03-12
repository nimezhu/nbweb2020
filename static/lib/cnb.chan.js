(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.cnb = global.cnb || {})));
}(this, (function (exports) { 'use strict';

var noop = {
    value: function() {}
};

function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
        _[t] = [];
    }
    return new Dispatch(_);
}

function Dispatch(_) {
    this._ = _;
}

function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "",
            i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {
            type: t,
            name: name
        };
    });
}

Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
            while (++i < n)
                if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
            return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
            if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
            else if (callback == null)
                for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
    },
    copy: function() {
        var copy = {},
            _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
    },
    call: function(type, that) {
        if ((n = arguments.length - 2) > 0)
            for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
};

function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
            return c.value;
        }
    }
}

function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
            type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
            break;
        }
    }
    if (callback != null) type.push({
        name: name,
        value: callback
    });
    return type;
}

var chan = function() {
    var extId = "djcdicpaejhpgncicoglfckiappkoeof";
    var chanId = "cnbChan01";
    var status = {
        connection: "No Connection",
        id: ""
    };
    var dispatch$$1 = dispatch("sendMessage",
        "receiveMessage", "_disconnect");

    dispatch$$1.on("_disconnect.status", function() {
        status.connection = "No Connection";
        status.id = "";
    });

    var onchange = function() {

    };
    var onclose = function() {
        //TODO Add Other Handle
        onchange();
    };
    var agent = function() {};
    agent.connect = function(_) {
        if (typeof _ == "function") {
            connect(chanId, extId, dispatch$$1, status, function(d) {
                onchange();
                _(d);
            }, onclose);
        } else {
            connect(chanId, extId, dispatch$$1, status, function(d) {
                onchange();
            }, onclose);
        }
    };
    agent.disconnect = function(_) {
        dispatch$$1.call("_disconnect", this, {});
    };
    agent.close = function(_) {
        dispatch$$1.call("_disconnect", this, {});
    };
    //V0 API
    // chan.dipsatch()
    // code: sendMessage
    //       receiveMessage  
    // data:  {
    //      code: CodeString,
    //      data: Stringify JSON Object 
    // }
    agent.dispatch = function() {
        return dispatch$$1;
    };
    agent.extId = function(_) {
        return arguments.length ? (extId = _, agent) : extId;
    };
    agent.chanId = function(_) {
        return arguments.length ? (data = _, agen) : data;
    };
    agent.status = function() {
        return status
    };
    //status change callback
    agent.onchange = function(_) {
        return arguments.length ? (onchange = _, agent) : onchange;
    };
    //V1 API
    agent.on = function(m, f) {
        var a = m.split(".");
        var m0 = a[0] || "";
        //check status??
        if (m0 == "sendMessage" || m0 == "receiveMessage") {
            dispatch$$1.on(m, f);
        } else {
            // codebook
            // Add Code Book Wrapper for Receive Message Interface
            // Extend d3 dispatch 
            // user interface:
            // agent.on("code.x",function(data){})
            // translate to
            // agent.on("receiveMessage.code.x",function({"code":code,data:JSON.stringify(data)}))
            dispatch$$1.on("receiveMessage" + "." + a, function(d) {
                if (d.code == m0) {
                    f(JSON.parse(d.data));
                }
            });
        }
    };
    agent.call = function(code, self, data) {
        if (code == "sendMessage" || code == "receiveMessage") {
            dispatch$$1.call(code, self, data);
        } else {
            dispatch$$1.call("sendMessage", self, {
                "code": code,
                data: JSON.stringify(data)
            });
        }
    };
    // Add Share Worker (share worker js)
    return agent
};

function connect(chanId, extId, _dispatch, status, callback, onclose) {
    var chromeExtPort;
    var chromeExtID = extId;
    var hasExtension;
    var channel = chanId;
    var connectChan = function() {
        console.log("connect to channel " + channel);
        try {
            var chan = new BroadcastChannel(channel);
            _dispatch.on("sendMessage.chan", function(d) {
                chan.postMessage(d);
            });
            chan.onmessage = function(e) {
                var d = e.data;
                _dispatch.call("receiveMessage", this, d);

            };
            _dispatch.on("_disconnect", function(d) {
                _dispatch.on("sendMessage.chan", null);
                chan.close();
                onclose();
            });
            status.connection = "Channel";
            status.id = channel;
            callback(status);

        } catch (e) {
            console.log("your browser doesn't support BroadCastChannel");
            status.connection = "No Connection";
            status.id = "";
            callback(status);
        }
    };
    try {
        chrome.runtime.sendMessage(chromeExtID, {
                message: "version"
            },
            function(reply) {
                if (reply) {
                    if (reply.version) {
                        hasExtension = true;
                        connectExt();
                    }
                } else {
                    hasExtension = false;
                    connectChan();
                }
            });
    } catch (e) {
        connectChan();
    }
    var connectExt = function() {
        chromeExtPort = chrome.runtime.connect(
            chromeExtID);
        console.log("connect to extension ", chromeExtID);
        _dispatch.on("sendMessage.apps", function(d) {
            chromeExtPort.postMessage(d); //send message to chromeExt
        });
        chromeExtPort.onMessage.addListener(function(d) {
            _dispatch.call("receiveMessage",
                this, {
                    code: d.code,
                    data: JSON.stringify(
                        d.data)
                });
        });
        chromeExtPort.onDisconnect.addListener(function(e) {
            console.log("disconnect to extension ", chromeExtID);
            _dispatch.on("sendMessage.apps", null);
            onclose();
        });
        _dispatch.on("_disconnect", function(d) {
            console.log("disconnect to extension ", chromeExtID);
            _dispatch.on("sendMessage.apps", null);
            onclose();
            chromeExtPort.disconnect();
        });
        status.connection = "Extension";
        status.id = chromeExtID;
        callback(status);
    };
}

exports.chan = chan;

Object.defineProperty(exports, '__esModule', { value: true });

})));
