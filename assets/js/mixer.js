function get_browser_info() {
    var tem,
        ua = navigator.userAgent,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    return /trident/i.test(M[1])
        ? ((tem = /\brv[ :]+(\d+)/g.exec(ua) || []), { name: "IE", version: tem[1] || "" })
        : "Chrome" === M[1] && ((tem = ua.match(/\bOPR\/(\d+)/)), null != tem)
        ? { name: "Opera", version: tem[1] }
        : ((M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"]), null != (tem = ua.match(/version\/(\d+)/i)) && M.splice(1, 1, tem[1]), { name: M[0], version: M[1] });
}
function closeSupport() {
    $("#nosupport").remove();
}
function run() {
    var jcmix = new Jcmix();
    jcmix.init(),
        $("#panner").on("change", function () {
            jcmix.pan(this);
        });
}
function include(file, callback) {
    if ("undefined" == typeof jQuery) {
        var head = document.getElementsByTagName("head")[0],
            script = document.createElement("script");
        (script.type = "text/javascript"),
            (script.src = file),
            (script.onload = script.onreadystatechange = function () {
                callback && callback(), head.removeChild(script), (script.onload = null);
            }),
            head.appendChild(script);
    } else callback && callback();
}
!(function (f) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = f();
    else if ("function" == typeof define && define.amd) define([], f);
    else {
        var g;
        (g = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this), (g.Recorder = f());
    }
})(function () {
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = "function" == typeof require && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw ((f.code = "MODULE_NOT_FOUND"), f);
                }
                var l = (n[o] = { exports: {} });
                t[o][0].call(
                    l.exports,
                    function (e) {
                        var n = t[o][1][e];
                        return s(n ? n : e);
                    },
                    l,
                    l.exports,
                    e,
                    t,
                    n,
                    r
                );
            }
            return n[o].exports;
        }
        for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
        return s;
    })(
        {
            1: [
                function (require, module, exports) {
                    "use strict";
                    module.exports = require("./recorder").Recorder;
                },
                { "./recorder": 2 },
            ],
            2: [
                function (require, module, exports) {
                    "use strict";
                    function _interopRequireDefault(obj) {
                        return obj && obj.__esModule ? obj : { default: obj };
                    }
                    function _classCallCheck(instance, Constructor) {
                        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
                    }
                    var _createClass = (function () {
                        function defineProperties(target, props) {
                            for (var i = 0; i < props.length; i++) {
                                var descriptor = props[i];
                                (descriptor.enumerable = descriptor.enumerable || !1), (descriptor.configurable = !0), "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
                            }
                        }
                        return function (Constructor, protoProps, staticProps) {
                            return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor;
                        };
                    })();
                    Object.defineProperty(exports, "__esModule", { value: !0 }), (exports.Recorder = void 0);
                    var _inlineWorker = require("inline-worker"),
                        _inlineWorker2 = _interopRequireDefault(_inlineWorker),
                        Recorder = (exports.Recorder = (function () {
                            function Recorder(source, cfg) {
                                var _this = this;
                                _classCallCheck(this, Recorder),
                                    (this.config = { bufferLen: 4096, numChannels: 2, mimeType: "audio/wav" }),
                                    (this.recording = !1),
                                    (this.callbacks = { getBuffer: [], exportWAV: [] }),
                                    Object.assign(this.config, cfg),
                                    (this.context = source.context),
                                    (this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels)),
                                    (this.node.onaudioprocess = function (e) {
                                        if (_this.recording) {
                                            for (var buffer = [], channel = 0; channel < _this.config.numChannels; channel++) buffer.push(e.inputBuffer.getChannelData(channel));
                                            _this.worker.postMessage({ command: "record", buffer: buffer });
                                        }
                                    }),
                                    source.connect(this.node),
                                    this.node.connect(this.context.destination);
                                var self = {};
                                (this.worker = new _inlineWorker2["default"](function () {
                                    function init(config) {
                                        (sampleRate = config.sampleRate), (numChannels = config.numChannels), initBuffers();
                                    }
                                    function record(inputBuffer) {
                                        for (var channel = 0; numChannels > channel; channel++) recBuffers[channel].push(inputBuffer[channel]);
                                        recLength += inputBuffer[0].length;
                                    }
                                    function exportWAV(type) {
                                        for (var buffers = [], channel = 0; numChannels > channel; channel++) buffers.push(mergeBuffers(recBuffers[channel], recLength));
                                        var interleaved = void 0;
                                        interleaved = 2 === numChannels ? interleave(buffers[0], buffers[1]) : buffers[0];
                                        var dataview = encodeWAV(interleaved),
                                            audioBlob = new Blob([dataview], { type: type });
                                        self.postMessage({ command: "exportWAV", data: audioBlob });
                                    }
                                    function getBuffer() {
                                        for (var buffers = [], channel = 0; numChannels > channel; channel++) buffers.push(mergeBuffers(recBuffers[channel], recLength));
                                        self.postMessage({ command: "getBuffer", data: buffers });
                                    }
                                    function clear() {
                                        (recLength = 0), (recBuffers = []), initBuffers();
                                    }
                                    function initBuffers() {
                                        for (var channel = 0; numChannels > channel; channel++) recBuffers[channel] = [];
                                    }
                                    function mergeBuffers(recBuffers, recLength) {
                                        for (var result = new Float32Array(recLength), offset = 0, i = 0; i < recBuffers.length; i++) result.set(recBuffers[i], offset), (offset += recBuffers[i].length);
                                        return result;
                                    }
                                    function interleave(inputL, inputR) {
                                        for (var length = inputL.length + inputR.length, result = new Float32Array(length), index = 0, inputIndex = 0; length > index; )
                                            (result[index++] = inputL[inputIndex]), (result[index++] = inputR[inputIndex]), inputIndex++;
                                        return result;
                                    }
                                    function floatTo16BitPCM(output, offset, input) {
                                        for (var i = 0; i < input.length; i++, offset += 2) {
                                            var s = Math.max(-1, Math.min(1, input[i]));
                                            output.setInt16(offset, 0 > s ? 32768 * s : 32767 * s, !0);
                                        }
                                    }
                                    function writeString(view, offset, string) {
                                        for (var i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
                                    }
                                    function encodeWAV(samples) {
                                        var buffer = new ArrayBuffer(44 + 2 * samples.length),
                                            view = new DataView(buffer);
                                        return (
                                            writeString(view, 0, "RIFF"),
                                            view.setUint32(4, 36 + 2 * samples.length, !0),
                                            writeString(view, 8, "WAVE"),
                                            writeString(view, 12, "fmt "),
                                            view.setUint32(16, 16, !0),
                                            view.setUint16(20, 1, !0),
                                            view.setUint16(22, numChannels, !0),
                                            view.setUint32(24, sampleRate, !0),
                                            view.setUint32(28, 4 * sampleRate, !0),
                                            view.setUint16(32, 2 * numChannels, !0),
                                            view.setUint16(34, 16, !0),
                                            writeString(view, 36, "data"),
                                            view.setUint32(40, 2 * samples.length, !0),
                                            floatTo16BitPCM(view, 44, samples),
                                            view
                                        );
                                    }
                                    var recLength = 0,
                                        recBuffers = [],
                                        sampleRate = void 0,
                                        numChannels = void 0;
                                    self.onmessage = function (e) {
                                        switch (e.data.command) {
                                            case "init":
                                                init(e.data.config);
                                                break;
                                            case "record":
                                                record(e.data.buffer);
                                                break;
                                            case "exportWAV":
                                                exportWAV(e.data.type);
                                                break;
                                            case "getBuffer":
                                                getBuffer();
                                                break;
                                            case "clear":
                                                clear();
                                        }
                                    };
                                }, self)),
                                    this.worker.postMessage({ command: "init", config: { sampleRate: this.context.sampleRate, numChannels: this.config.numChannels } }),
                                    (this.worker.onmessage = function (e) {
                                        var cb = _this.callbacks[e.data.command].pop();
                                        "function" == typeof cb && cb(e.data.data);
                                    });
                            }
                            return (
                                _createClass(
                                    Recorder,
                                    [
                                        {
                                            key: "record",
                                            value: function () {
                                                this.recording = !0;
                                            },
                                        },
                                        {
                                            key: "stop",
                                            value: function () {
                                                this.recording = !1;
                                            },
                                        },
                                        {
                                            key: "clear",
                                            value: function () {
                                                this.worker.postMessage({ command: "clear" });
                                            },
                                        },
                                        {
                                            key: "getBuffer",
                                            value: function (cb) {
                                                if (((cb = cb || this.config.callback), !cb)) throw new Error("Callback not set");
                                                this.callbacks.getBuffer.push(cb), this.worker.postMessage({ command: "getBuffer" });
                                            },
                                        },
                                        {
                                            key: "exportWAV",
                                            value: function (cb, mimeType) {
                                                if (((mimeType = mimeType || this.config.mimeType), (cb = cb || this.config.callback), !cb)) throw new Error("Callback not set");
                                                this.callbacks.exportWAV.push(cb), this.worker.postMessage({ command: "exportWAV", type: mimeType });
                                            },
                                        },
                                    ],
                                    [
                                        {
                                            key: "forceDownload",
                                            value: function (blob, filename) {
                                                var url = (window.URL || window.webkitURL).createObjectURL(blob),
                                                    link = window.document.createElement("a");
                                                (link.href = url), (link.download = filename || "output.wav");
                                                var click = document.createEvent("Event");
                                                click.initEvent("click", !0, !0), link.dispatchEvent(click);
                                            },
                                        },
                                    ]
                                ),
                                Recorder
                            );
                        })());
                    exports["default"] = Recorder;
                },
                { "inline-worker": 3 },
            ],
            3: [
                function (require, module, exports) {
                    "use strict";
                    module.exports = require("./inline-worker");
                },
                { "./inline-worker": 4 },
            ],
            4: [
                function (require, module, exports) {
                    (function (global) {
                        "use strict";
                        var _createClass = (function () {
                                function defineProperties(target, props) {
                                    for (var key in props) {
                                        var prop = props[key];
                                        (prop.configurable = !0), prop.value && (prop.writable = !0);
                                    }
                                    Object.defineProperties(target, props);
                                }
                                return function (Constructor, protoProps, staticProps) {
                                    return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor;
                                };
                            })(),
                            _classCallCheck = function (instance, Constructor) {
                                if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
                            },
                            WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker),
                            InlineWorker = (function () {
                                function InlineWorker(func, self) {
                                    var _this = this;
                                    if ((_classCallCheck(this, InlineWorker), WORKER_ENABLED)) {
                                        var functionBody = func
                                                .toString()
                                                .trim()
                                                .match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1],
                                            url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));
                                        return new global.Worker(url);
                                    }
                                    (this.self = self),
                                        (this.self.postMessage = function (data) {
                                            setTimeout(function () {
                                                _this.onmessage({ data: data });
                                            }, 0);
                                        }),
                                        setTimeout(function () {
                                            func.call(self);
                                        }, 0);
                                }
                                return (
                                    _createClass(InlineWorker, {
                                        postMessage: {
                                            value: function (data) {
                                                var _this = this;
                                                setTimeout(function () {
                                                    _this.self.onmessage({ data: data });
                                                }, 0);
                                            },
                                        },
                                    }),
                                    InlineWorker
                                );
                            })();
                        module.exports = InlineWorker;
                    }.call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}));
                },
                {},
            ],
        },
        {},
        [1]
    )(1);
}),
    !(function (a, b) {
        "object" == typeof module && "object" == typeof module.exports
            ? (module.exports = a.document
                  ? b(a, !0)
                  : function (a) {
                        if (!a.document) throw new Error("jQuery requires a window with a document");
                        return b(a);
                    })
            : b(a);
    })("undefined" != typeof window ? window : this, function (a, b) {
        function r(a) {
            var b = "length" in a && a.length,
                c = m.type(a);
            return "function" === c || m.isWindow(a) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || ("number" == typeof b && b > 0 && b - 1 in a);
        }
        function w(a, b, c) {
            if (m.isFunction(b))
                return m.grep(a, function (a, d) {
                    return !!b.call(a, d, a) !== c;
                });
            if (b.nodeType)
                return m.grep(a, function (a) {
                    return (a === b) !== c;
                });
            if ("string" == typeof b) {
                if (v.test(b)) return m.filter(b, a, c);
                b = m.filter(b, a);
            }
            return m.grep(a, function (a) {
                return m.inArray(a, b) >= 0 !== c;
            });
        }
        function D(a, b) {
            do a = a[b];
            while (a && 1 !== a.nodeType);
            return a;
        }
        function G(a) {
            var b = (F[a] = {});
            return (
                m.each(a.match(E) || [], function (a, c) {
                    b[c] = !0;
                }),
                b
            );
        }
        function I() {
            y.addEventListener ? (y.removeEventListener("DOMContentLoaded", J, !1), a.removeEventListener("load", J, !1)) : (y.detachEvent("onreadystatechange", J), a.detachEvent("onload", J));
        }
        function J() {
            (y.addEventListener || "load" === event.type || "complete" === y.readyState) && (I(), m.ready());
        }
        function O(a, b, c) {
            if (void 0 === c && 1 === a.nodeType) {
                var d = "data-" + b.replace(N, "-$1").toLowerCase();
                if (((c = a.getAttribute(d)), "string" == typeof c)) {
                    try {
                        c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : M.test(c) ? m.parseJSON(c) : c;
                    } catch (e) {}
                    m.data(a, b, c);
                } else c = void 0;
            }
            return c;
        }
        function P(a) {
            var b;
            for (b in a) if (("data" !== b || !m.isEmptyObject(a[b])) && "toJSON" !== b) return !1;
            return !0;
        }
        function Q(a, b, d, e) {
            if (m.acceptData(a)) {
                var f,
                    g,
                    h = m.expando,
                    i = a.nodeType,
                    j = i ? m.cache : a,
                    k = i ? a[h] : a[h] && h;
                if ((k && j[k] && (e || j[k].data)) || void 0 !== d || "string" != typeof b)
                    return (
                        k || (k = i ? (a[h] = c.pop() || m.guid++) : h),
                        j[k] || (j[k] = i ? {} : { toJSON: m.noop }),
                        ("object" == typeof b || "function" == typeof b) && (e ? (j[k] = m.extend(j[k], b)) : (j[k].data = m.extend(j[k].data, b))),
                        (g = j[k]),
                        e || (g.data || (g.data = {}), (g = g.data)),
                        void 0 !== d && (g[m.camelCase(b)] = d),
                        "string" == typeof b ? ((f = g[b]), null == f && (f = g[m.camelCase(b)])) : (f = g),
                        f
                    );
            }
        }
        function R(a, b, c) {
            if (m.acceptData(a)) {
                var d,
                    e,
                    f = a.nodeType,
                    g = f ? m.cache : a,
                    h = f ? a[m.expando] : m.expando;
                if (g[h]) {
                    if (b && (d = c ? g[h] : g[h].data)) {
                        m.isArray(b) ? (b = b.concat(m.map(b, m.camelCase))) : b in d ? (b = [b]) : ((b = m.camelCase(b)), (b = b in d ? [b] : b.split(" "))), (e = b.length);
                        for (; e--; ) delete d[b[e]];
                        if (c ? !P(d) : !m.isEmptyObject(d)) return;
                    }
                    (c || (delete g[h].data, P(g[h]))) && (f ? m.cleanData([a], !0) : k.deleteExpando || g != g.window ? delete g[h] : (g[h] = null));
                }
            }
        }
        function aa() {
            return !0;
        }
        function ba() {
            return !1;
        }
        function ca() {
            try {
                return y.activeElement;
            } catch (a) {}
        }
        function da(a) {
            var b = ea.split("|"),
                c = a.createDocumentFragment();
            if (c.createElement) for (; b.length; ) c.createElement(b.pop());
            return c;
        }
        function ua(a, b) {
            var c,
                d,
                e = 0,
                f = typeof a.getElementsByTagName !== K ? a.getElementsByTagName(b || "*") : typeof a.querySelectorAll !== K ? a.querySelectorAll(b || "*") : void 0;
            if (!f) for (f = [], c = a.childNodes || a; null != (d = c[e]); e++) !b || m.nodeName(d, b) ? f.push(d) : m.merge(f, ua(d, b));
            return void 0 === b || (b && m.nodeName(a, b)) ? m.merge([a], f) : f;
        }
        function va(a) {
            W.test(a.type) && (a.defaultChecked = a.checked);
        }
        function wa(a, b) {
            return m.nodeName(a, "table") && m.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a;
        }
        function xa(a) {
            return (a.type = (null !== m.find.attr(a, "type")) + "/" + a.type), a;
        }
        function ya(a) {
            var b = pa.exec(a.type);
            return b ? (a.type = b[1]) : a.removeAttribute("type"), a;
        }
        function za(a, b) {
            for (var c, d = 0; null != (c = a[d]); d++) m._data(c, "globalEval", !b || m._data(b[d], "globalEval"));
        }
        function Aa(a, b) {
            if (1 === b.nodeType && m.hasData(a)) {
                var c,
                    d,
                    e,
                    f = m._data(a),
                    g = m._data(b, f),
                    h = f.events;
                if (h) {
                    delete g.handle, (g.events = {});
                    for (c in h) for (d = 0, e = h[c].length; e > d; d++) m.event.add(b, c, h[c][d]);
                }
                g.data && (g.data = m.extend({}, g.data));
            }
        }
        function Ba(a, b) {
            var c, d, e;
            if (1 === b.nodeType) {
                if (((c = b.nodeName.toLowerCase()), !k.noCloneEvent && b[m.expando])) {
                    e = m._data(b);
                    for (d in e.events) m.removeEvent(b, d, e.handle);
                    b.removeAttribute(m.expando);
                }
                "script" === c && b.text !== a.text
                    ? ((xa(b).text = a.text), ya(b))
                    : "object" === c
                    ? (b.parentNode && (b.outerHTML = a.outerHTML), k.html5Clone && a.innerHTML && !m.trim(b.innerHTML) && (b.innerHTML = a.innerHTML))
                    : "input" === c && W.test(a.type)
                    ? ((b.defaultChecked = b.checked = a.checked), b.value !== a.value && (b.value = a.value))
                    : "option" === c
                    ? (b.defaultSelected = b.selected = a.defaultSelected)
                    : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue);
            }
        }
        function Ea(b, c) {
            var d,
                e = m(c.createElement(b)).appendTo(c.body),
                f = a.getDefaultComputedStyle && (d = a.getDefaultComputedStyle(e[0])) ? d.display : m.css(e[0], "display");
            return e.detach(), f;
        }
        function Fa(a) {
            var b = y,
                c = Da[a];
            return (
                c ||
                    ((c = Ea(a, b)),
                    ("none" !== c && c) ||
                        ((Ca = (Ca || m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement)), (b = (Ca[0].contentWindow || Ca[0].contentDocument).document), b.write(), b.close(), (c = Ea(a, b)), Ca.detach()),
                    (Da[a] = c)),
                c
            );
        }
        function La(a, b) {
            return {
                get: function () {
                    var c = a();
                    return null != c ? (c ? void delete this.get : (this.get = b).apply(this, arguments)) : void 0;
                },
            };
        }
        function Ua(a, b) {
            if (b in a) return b;
            for (var c = b.charAt(0).toUpperCase() + b.slice(1), d = b, e = Ta.length; e--; ) if (((b = Ta[e] + c), b in a)) return b;
            return d;
        }
        function Va(a, b) {
            for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++)
                (d = a[g]),
                    d.style &&
                        ((f[g] = m._data(d, "olddisplay")),
                        (c = d.style.display),
                        b
                            ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && U(d) && (f[g] = m._data(d, "olddisplay", Fa(d.nodeName))))
                            : ((e = U(d)), ((c && "none" !== c) || !e) && m._data(d, "olddisplay", e ? c : m.css(d, "display"))));
            for (g = 0; h > g; g++) (d = a[g]), d.style && ((b && "none" !== d.style.display && "" !== d.style.display) || (d.style.display = b ? f[g] || "" : "none"));
            return a;
        }
        function Wa(a, b, c) {
            var d = Pa.exec(b);
            return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b;
        }
        function Xa(a, b, c, d, e) {
            for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2)
                "margin" === c && (g += m.css(a, c + T[f], !0, e)),
                    d
                        ? ("content" === c && (g -= m.css(a, "padding" + T[f], !0, e)), "margin" !== c && (g -= m.css(a, "border" + T[f] + "Width", !0, e)))
                        : ((g += m.css(a, "padding" + T[f], !0, e)), "padding" !== c && (g += m.css(a, "border" + T[f] + "Width", !0, e)));
            return g;
        }
        function Ya(a, b, c) {
            var d = !0,
                e = "width" === b ? a.offsetWidth : a.offsetHeight,
                f = Ia(a),
                g = k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, f);
            if (0 >= e || null == e) {
                if (((e = Ja(a, b, f)), (0 > e || null == e) && (e = a.style[b]), Ha.test(e))) return e;
                (d = g && (k.boxSizingReliable() || e === a.style[b])), (e = parseFloat(e) || 0);
            }
            return e + Xa(a, b, c || (g ? "border" : "content"), d, f) + "px";
        }
        function Za(a, b, c, d, e) {
            return new Za.prototype.init(a, b, c, d, e);
        }
        function fb() {
            return (
                setTimeout(function () {
                    $a = void 0;
                }),
                ($a = m.now())
            );
        }
        function gb(a, b) {
            var c,
                d = { height: a },
                e = 0;
            for (b = b ? 1 : 0; 4 > e; e += 2 - b) (c = T[e]), (d["margin" + c] = d["padding" + c] = a);
            return b && (d.opacity = d.width = a), d;
        }
        function hb(a, b, c) {
            for (var d, e = (eb[b] || []).concat(eb["*"]), f = 0, g = e.length; g > f; f++) if ((d = e[f].call(c, b, a))) return d;
        }
        function ib(a, b, c) {
            var d,
                e,
                f,
                g,
                h,
                i,
                j,
                l,
                n = this,
                o = {},
                p = a.style,
                q = a.nodeType && U(a),
                r = m._data(a, "fxshow");
            c.queue ||
                ((h = m._queueHooks(a, "fx")),
                null == h.unqueued &&
                    ((h.unqueued = 0),
                    (i = h.empty.fire),
                    (h.empty.fire = function () {
                        h.unqueued || i();
                    })),
                h.unqueued++,
                n.always(function () {
                    n.always(function () {
                        h.unqueued--, m.queue(a, "fx").length || h.empty.fire();
                    });
                })),
                1 === a.nodeType &&
                    ("height" in b || "width" in b) &&
                    ((c.overflow = [p.overflow, p.overflowX, p.overflowY]),
                    (j = m.css(a, "display")),
                    (l = "none" === j ? m._data(a, "olddisplay") || Fa(a.nodeName) : j),
                    "inline" === l && "none" === m.css(a, "float") && (k.inlineBlockNeedsLayout && "inline" !== Fa(a.nodeName) ? (p.zoom = 1) : (p.display = "inline-block"))),
                c.overflow &&
                    ((p.overflow = "hidden"),
                    k.shrinkWrapBlocks() ||
                        n.always(function () {
                            (p.overflow = c.overflow[0]), (p.overflowX = c.overflow[1]), (p.overflowY = c.overflow[2]);
                        }));
            for (d in b)
                if (((e = b[d]), ab.exec(e))) {
                    if ((delete b[d], (f = f || "toggle" === e), e === (q ? "hide" : "show"))) {
                        if ("show" !== e || !r || void 0 === r[d]) continue;
                        q = !0;
                    }
                    o[d] = (r && r[d]) || m.style(a, d);
                } else j = void 0;
            if (m.isEmptyObject(o)) "inline" === ("none" === j ? Fa(a.nodeName) : j) && (p.display = j);
            else {
                r ? "hidden" in r && (q = r.hidden) : (r = m._data(a, "fxshow", {})),
                    f && (r.hidden = !q),
                    q
                        ? m(a).show()
                        : n.done(function () {
                              m(a).hide();
                          }),
                    n.done(function () {
                        var b;
                        m._removeData(a, "fxshow");
                        for (b in o) m.style(a, b, o[b]);
                    });
                for (d in o) (g = hb(q ? r[d] : 0, d, n)), d in r || ((r[d] = g.start), q && ((g.end = g.start), (g.start = "width" === d || "height" === d ? 1 : 0)));
            }
        }
        function jb(a, b) {
            var c, d, e, f, g;
            for (c in a)
                if (((d = m.camelCase(c)), (e = b[d]), (f = a[c]), m.isArray(f) && ((e = f[1]), (f = a[c] = f[0])), c !== d && ((a[d] = f), delete a[c]), (g = m.cssHooks[d]), g && "expand" in g)) {
                    (f = g.expand(f)), delete a[d];
                    for (c in f) c in a || ((a[c] = f[c]), (b[c] = e));
                } else b[d] = e;
        }
        function kb(a, b, c) {
            var d,
                e,
                f = 0,
                g = db.length,
                h = m.Deferred().always(function () {
                    delete i.elem;
                }),
                i = function () {
                    if (e) return !1;
                    for (var b = $a || fb(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f);
                    return h.notifyWith(a, [j, f, c]), 1 > f && i ? c : (h.resolveWith(a, [j]), !1);
                },
                j = h.promise({
                    elem: a,
                    props: m.extend({}, b),
                    opts: m.extend(!0, { specialEasing: {} }, c),
                    originalProperties: b,
                    originalOptions: c,
                    startTime: $a || fb(),
                    duration: c.duration,
                    tweens: [],
                    createTween: function (b, c) {
                        var d = m.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                        return j.tweens.push(d), d;
                    },
                    stop: function (b) {
                        var c = 0,
                            d = b ? j.tweens.length : 0;
                        if (e) return this;
                        for (e = !0; d > c; c++) j.tweens[c].run(1);
                        return b ? h.resolveWith(a, [j, b]) : h.rejectWith(a, [j, b]), this;
                    },
                }),
                k = j.props;
            for (jb(k, j.opts.specialEasing); g > f; f++) if ((d = db[f].call(j, a, k, j.opts))) return d;
            return (
                m.map(k, hb, j),
                m.isFunction(j.opts.start) && j.opts.start.call(a, j),
                m.fx.timer(m.extend(i, { elem: a, anim: j, queue: j.opts.queue })),
                j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always)
            );
        }
        function Lb(a) {
            return function (b, c) {
                "string" != typeof b && ((c = b), (b = "*"));
                var d,
                    e = 0,
                    f = b.toLowerCase().match(E) || [];
                if (m.isFunction(c)) for (; (d = f[e++]); ) "+" === d.charAt(0) ? ((d = d.slice(1) || "*"), (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c);
            };
        }
        function Mb(a, b, c, d) {
            function g(h) {
                var i;
                return (
                    (e[h] = !0),
                    m.each(a[h] || [], function (a, h) {
                        var j = h(b, c, d);
                        return "string" != typeof j || f || e[j] ? (f ? !(i = j) : void 0) : (b.dataTypes.unshift(j), g(j), !1);
                    }),
                    i
                );
            }
            var e = {},
                f = a === Ib;
            return g(b.dataTypes[0]) || (!e["*"] && g("*"));
        }
        function Nb(a, b) {
            var c,
                d,
                e = m.ajaxSettings.flatOptions || {};
            for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);
            return c && m.extend(!0, a, c), a;
        }
        function Ob(a, b, c) {
            for (var d, e, f, g, h = a.contents, i = a.dataTypes; "*" === i[0]; ) i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader("Content-Type"));
            if (e)
                for (g in h)
                    if (h[g] && h[g].test(e)) {
                        i.unshift(g);
                        break;
                    }
            if (i[0] in c) f = i[0];
            else {
                for (g in c) {
                    if (!i[0] || a.converters[g + " " + i[0]]) {
                        f = g;
                        break;
                    }
                    d || (d = g);
                }
                f = f || d;
            }
            return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0;
        }
        function Pb(a, b, c, d) {
            var e,
                f,
                g,
                h,
                i,
                j = {},
                k = a.dataTypes.slice();
            if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g];
            for (f = k.shift(); f; )
                if ((a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), (i = f), (f = k.shift())))
                    if ("*" === f) f = i;
                    else if ("*" !== i && i !== f) {
                        if (((g = j[i + " " + f] || j["* " + f]), !g))
                            for (e in j)
                                if (((h = e.split(" ")), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]]))) {
                                    g === !0 ? (g = j[e]) : j[e] !== !0 && ((f = h[0]), k.unshift(h[1]));
                                    break;
                                }
                        if (g !== !0)
                            if (g && a["throws"]) b = g(b);
                            else
                                try {
                                    b = g(b);
                                } catch (l) {
                                    return { state: "parsererror", error: g ? l : "No conversion from " + i + " to " + f };
                                }
                    }
            return { state: "success", data: b };
        }
        function Vb(a, b, c, d) {
            var e;
            if (m.isArray(b))
                m.each(b, function (b, e) {
                    c || Rb.test(a) ? d(a, e) : Vb(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d);
                });
            else if (c || "object" !== m.type(b)) d(a, b);
            else for (e in b) Vb(a + "[" + e + "]", b[e], c, d);
        }
        function Zb() {
            try {
                return new a.XMLHttpRequest();
            } catch (b) {}
        }
        function $b() {
            try {
                return new a.ActiveXObject("Microsoft.XMLHTTP");
            } catch (b) {}
        }
        function dc(a) {
            return m.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
        }
        var c = [],
            d = c.slice,
            e = c.concat,
            f = c.push,
            g = c.indexOf,
            h = {},
            i = h.toString,
            j = h.hasOwnProperty,
            k = {},
            l = "1.11.3",
            m = function (a, b) {
                return new m.fn.init(a, b);
            },
            n = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
            o = /^-ms-/,
            p = /-([\da-z])/gi,
            q = function (a, b) {
                return b.toUpperCase();
            };
        (m.fn = m.prototype = {
            jquery: l,
            constructor: m,
            selector: "",
            length: 0,
            toArray: function () {
                return d.call(this);
            },
            get: function (a) {
                return null != a ? (0 > a ? this[a + this.length] : this[a]) : d.call(this);
            },
            pushStack: function (a) {
                var b = m.merge(this.constructor(), a);
                return (b.prevObject = this), (b.context = this.context), b;
            },
            each: function (a, b) {
                return m.each(this, a, b);
            },
            map: function (a) {
                return this.pushStack(
                    m.map(this, function (b, c) {
                        return a.call(b, c, b);
                    })
                );
            },
            slice: function () {
                return this.pushStack(d.apply(this, arguments));
            },
            first: function () {
                return this.eq(0);
            },
            last: function () {
                return this.eq(-1);
            },
            eq: function (a) {
                var b = this.length,
                    c = +a + (0 > a ? b : 0);
                return this.pushStack(c >= 0 && b > c ? [this[c]] : []);
            },
            end: function () {
                return this.prevObject || this.constructor(null);
            },
            push: f,
            sort: c.sort,
            splice: c.splice,
        }),
            (m.extend = m.fn.extend = function () {
                var a,
                    b,
                    c,
                    d,
                    e,
                    f,
                    g = arguments[0] || {},
                    h = 1,
                    i = arguments.length,
                    j = !1;
                for ("boolean" == typeof g && ((j = g), (g = arguments[h] || {}), h++), "object" == typeof g || m.isFunction(g) || (g = {}), h === i && ((g = this), h--); i > h; h++)
                    if (null != (e = arguments[h]))
                        for (d in e)
                            (a = g[d]),
                                (c = e[d]),
                                g !== c &&
                                    (j && c && (m.isPlainObject(c) || (b = m.isArray(c)))
                                        ? (b ? ((b = !1), (f = a && m.isArray(a) ? a : [])) : (f = a && m.isPlainObject(a) ? a : {}), (g[d] = m.extend(j, f, c)))
                                        : void 0 !== c && (g[d] = c));
                return g;
            }),
            m.extend({
                expando: "jQuery" + (l + Math.random()).replace(/\D/g, ""),
                isReady: !0,
                error: function (a) {
                    throw new Error(a);
                },
                noop: function () {},
                isFunction: function (a) {
                    return "function" === m.type(a);
                },
                isArray:
                    Array.isArray ||
                    function (a) {
                        return "array" === m.type(a);
                    },
                isWindow: function (a) {
                    return null != a && a == a.window;
                },
                isNumeric: function (a) {
                    return !m.isArray(a) && a - parseFloat(a) + 1 >= 0;
                },
                isEmptyObject: function (a) {
                    var b;
                    for (b in a) return !1;
                    return !0;
                },
                isPlainObject: function (a) {
                    var b;
                    if (!a || "object" !== m.type(a) || a.nodeType || m.isWindow(a)) return !1;
                    try {
                        if (a.constructor && !j.call(a, "constructor") && !j.call(a.constructor.prototype, "isPrototypeOf")) return !1;
                    } catch (c) {
                        return !1;
                    }
                    if (k.ownLast) for (b in a) return j.call(a, b);
                    for (b in a);
                    return void 0 === b || j.call(a, b);
                },
                type: function (a) {
                    return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? h[i.call(a)] || "object" : typeof a;
                },
                globalEval: function (b) {
                    b &&
                        m.trim(b) &&
                        (
                            a.execScript ||
                            function (b) {
                                a.eval.call(a, b);
                            }
                        )(b);
                },
                camelCase: function (a) {
                    return a.replace(o, "ms-").replace(p, q);
                },
                nodeName: function (a, b) {
                    return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
                },
                each: function (a, b, c) {
                    var d,
                        e = 0,
                        f = a.length,
                        g = r(a);
                    if (c) {
                        if (g) for (; f > e && ((d = b.apply(a[e], c)), d !== !1); e++);
                        else for (e in a) if (((d = b.apply(a[e], c)), d === !1)) break;
                    } else if (g) for (; f > e && ((d = b.call(a[e], e, a[e])), d !== !1); e++);
                    else for (e in a) if (((d = b.call(a[e], e, a[e])), d === !1)) break;
                    return a;
                },
                trim: function (a) {
                    return null == a ? "" : (a + "").replace(n, "");
                },
                makeArray: function (a, b) {
                    var c = b || [];
                    return null != a && (r(Object(a)) ? m.merge(c, "string" == typeof a ? [a] : a) : f.call(c, a)), c;
                },
                inArray: function (a, b, c) {
                    var d;
                    if (b) {
                        if (g) return g.call(b, a, c);
                        for (d = b.length, c = c ? (0 > c ? Math.max(0, d + c) : c) : 0; d > c; c++) if (c in b && b[c] === a) return c;
                    }
                    return -1;
                },
                merge: function (a, b) {
                    for (var c = +b.length, d = 0, e = a.length; c > d; ) a[e++] = b[d++];
                    if (c !== c) for (; void 0 !== b[d]; ) a[e++] = b[d++];
                    return (a.length = e), a;
                },
                grep: function (a, b, c) {
                    for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) (d = !b(a[f], f)), d !== h && e.push(a[f]);
                    return e;
                },
                map: function (a, b, c) {
                    var d,
                        f = 0,
                        g = a.length,
                        h = r(a),
                        i = [];
                    if (h) for (; g > f; f++) (d = b(a[f], f, c)), null != d && i.push(d);
                    else for (f in a) (d = b(a[f], f, c)), null != d && i.push(d);
                    return e.apply([], i);
                },
                guid: 1,
                proxy: function (a, b) {
                    var c, e, f;
                    return (
                        "string" == typeof b && ((f = a[b]), (b = a), (a = f)),
                        m.isFunction(a)
                            ? ((c = d.call(arguments, 2)),
                              (e = function () {
                                  return a.apply(b || this, c.concat(d.call(arguments)));
                              }),
                              (e.guid = a.guid = a.guid || m.guid++),
                              e)
                            : void 0
                    );
                },
                now: function () {
                    return +new Date();
                },
                support: k,
            }),
            m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (a, b) {
                h["[object " + b + "]"] = b.toLowerCase();
            });
        var s = (function (a) {
            function ga(a, b, d, e) {
                var f, h, j, k, l, o, r, s, w, x;
                if (((b ? b.ownerDocument || b : v) !== n && m(b), (b = b || n), (d = d || []), (k = b.nodeType), "string" != typeof a || !a || (1 !== k && 9 !== k && 11 !== k))) return d;
                if (!e && p) {
                    if (11 !== k && (f = _.exec(a)))
                        if ((j = f[1])) {
                            if (9 === k) {
                                if (((h = b.getElementById(j)), !h || !h.parentNode)) return d;
                                if (h.id === j) return d.push(h), d;
                            } else if (b.ownerDocument && (h = b.ownerDocument.getElementById(j)) && t(b, h) && h.id === j) return d.push(h), d;
                        } else {
                            if (f[2]) return H.apply(d, b.getElementsByTagName(a)), d;
                            if ((j = f[3]) && c.getElementsByClassName) return H.apply(d, b.getElementsByClassName(j)), d;
                        }
                    if (c.qsa && (!q || !q.test(a))) {
                        if (((s = r = u), (w = b), (x = 1 !== k && a), 1 === k && "object" !== b.nodeName.toLowerCase())) {
                            for (o = g(a), (r = b.getAttribute("id")) ? (s = r.replace(ba, "\\$&")) : b.setAttribute("id", s), s = "[id='" + s + "'] ", l = o.length; l--; ) o[l] = s + ra(o[l]);
                            (w = (aa.test(a) && pa(b.parentNode)) || b), (x = o.join(","));
                        }
                        if (x)
                            try {
                                return H.apply(d, w.querySelectorAll(x)), d;
                            } catch (y) {
                            } finally {
                                r || b.removeAttribute("id");
                            }
                    }
                }
                return i(a.replace(R, "$1"), b, d, e);
            }
            function ha() {
                function b(c, e) {
                    return a.push(c + " ") > d.cacheLength && delete b[a.shift()], (b[c + " "] = e);
                }
                var a = [];
                return b;
            }
            function ia(a) {
                return (a[u] = !0), a;
            }
            function ja(a) {
                var b = n.createElement("div");
                try {
                    return !!a(b);
                } catch (c) {
                    return !1;
                } finally {
                    b.parentNode && b.parentNode.removeChild(b), (b = null);
                }
            }
            function ka(a, b) {
                for (var c = a.split("|"), e = a.length; e--; ) d.attrHandle[c[e]] = b;
            }
            function la(a, b) {
                var c = b && a,
                    d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || C) - (~a.sourceIndex || C);
                if (d) return d;
                if (c) for (; (c = c.nextSibling); ) if (c === b) return -1;
                return a ? 1 : -1;
            }
            function ma(a) {
                return function (b) {
                    var c = b.nodeName.toLowerCase();
                    return "input" === c && b.type === a;
                };
            }
            function na(a) {
                return function (b) {
                    var c = b.nodeName.toLowerCase();
                    return ("input" === c || "button" === c) && b.type === a;
                };
            }
            function oa(a) {
                return ia(function (b) {
                    return (
                        (b = +b),
                        ia(function (c, d) {
                            for (var e, f = a([], c.length, b), g = f.length; g--; ) c[(e = f[g])] && (c[e] = !(d[e] = c[e]));
                        })
                    );
                });
            }
            function pa(a) {
                return a && "undefined" != typeof a.getElementsByTagName && a;
            }
            function qa() {}
            function ra(a) {
                for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value;
                return d;
            }
            function sa(a, b, c) {
                var d = b.dir,
                    e = c && "parentNode" === d,
                    f = x++;
                return b.first
                    ? function (b, c, f) {
                          for (; (b = b[d]); ) if (1 === b.nodeType || e) return a(b, c, f);
                      }
                    : function (b, c, g) {
                          var h,
                              i,
                              j = [w, f];
                          if (g) {
                              for (; (b = b[d]); ) if ((1 === b.nodeType || e) && a(b, c, g)) return !0;
                          } else
                              for (; (b = b[d]); )
                                  if (1 === b.nodeType || e) {
                                      if (((i = b[u] || (b[u] = {})), (h = i[d]) && h[0] === w && h[1] === f)) return (j[2] = h[2]);
                                      if (((i[d] = j), (j[2] = a(b, c, g)))) return !0;
                                  }
                      };
            }
            function ta(a) {
                return a.length > 1
                    ? function (b, c, d) {
                          for (var e = a.length; e--; ) if (!a[e](b, c, d)) return !1;
                          return !0;
                      }
                    : a[0];
            }
            function ua(a, b, c) {
                for (var d = 0, e = b.length; e > d; d++) ga(a, b[d], c);
                return c;
            }
            function va(a, b, c, d, e) {
                for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h));
                return g;
            }
            function wa(a, b, c, d, e, f) {
                return (
                    d && !d[u] && (d = wa(d)),
                    e && !e[u] && (e = wa(e, f)),
                    ia(function (f, g, h, i) {
                        var j,
                            k,
                            l,
                            m = [],
                            n = [],
                            o = g.length,
                            p = f || ua(b || "*", h.nodeType ? [h] : h, []),
                            q = !a || (!f && b) ? p : va(p, m, a, h, i),
                            r = c ? (e || (f ? a : o || d) ? [] : g) : q;
                        if ((c && c(q, r, h, i), d)) for (j = va(r, n), d(j, [], h, i), k = j.length; k--; ) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l));
                        if (f) {
                            if (e || a) {
                                if (e) {
                                    for (j = [], k = r.length; k--; ) (l = r[k]) && j.push((q[k] = l));
                                    e(null, (r = []), j, i);
                                }
                                for (k = r.length; k--; ) (l = r[k]) && (j = e ? J(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l));
                            }
                        } else (r = va(r === g ? r.splice(o, r.length) : r)), e ? e(null, g, r, i) : H.apply(g, r);
                    })
                );
            }
            function xa(a) {
                for (
                    var b,
                        c,
                        e,
                        f = a.length,
                        g = d.relative[a[0].type],
                        h = g || d.relative[" "],
                        i = g ? 1 : 0,
                        k = sa(
                            function (a) {
                                return a === b;
                            },
                            h,
                            !0
                        ),
                        l = sa(
                            function (a) {
                                return J(b, a) > -1;
                            },
                            h,
                            !0
                        ),
                        m = [
                            function (a, c, d) {
                                var e = (!g && (d || c !== j)) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d));
                                return (b = null), e;
                            },
                        ];
                    f > i;
                    i++
                )
                    if ((c = d.relative[a[i].type])) m = [sa(ta(m), c)];
                    else {
                        if (((c = d.filter[a[i].type].apply(null, a[i].matches)), c[u])) {
                            for (e = ++i; f > e && !d.relative[a[e].type]; e++);
                            return wa(i > 1 && ta(m), i > 1 && ra(a.slice(0, i - 1).concat({ value: " " === a[i - 2].type ? "*" : "" })).replace(R, "$1"), c, e > i && xa(a.slice(i, e)), f > e && xa((a = a.slice(e))), f > e && ra(a));
                        }
                        m.push(c);
                    }
                return ta(m);
            }
            function ya(a, b) {
                var c = b.length > 0,
                    e = a.length > 0,
                    f = function (f, g, h, i, k) {
                        var l,
                            m,
                            o,
                            p = 0,
                            q = "0",
                            r = f && [],
                            s = [],
                            t = j,
                            u = f || (e && d.find.TAG("*", k)),
                            v = (w += null == t ? 1 : Math.random() || 0.1),
                            x = u.length;
                        for (k && (j = g !== n && g); q !== x && null != (l = u[q]); q++) {
                            if (e && l) {
                                for (m = 0; (o = a[m++]); )
                                    if (o(l, g, h)) {
                                        i.push(l);
                                        break;
                                    }
                                k && (w = v);
                            }
                            c && ((l = !o && l) && p--, f && r.push(l));
                        }
                        if (((p += q), c && q !== p)) {
                            for (m = 0; (o = b[m++]); ) o(r, s, g, h);
                            if (f) {
                                if (p > 0) for (; q--; ) r[q] || s[q] || (s[q] = F.call(i));
                                s = va(s);
                            }
                            H.apply(i, s), k && !f && s.length > 0 && p + b.length > 1 && ga.uniqueSort(i);
                        }
                        return k && ((w = v), (j = t)), r;
                    };
                return c ? ia(f) : f;
            }
            var b,
                c,
                d,
                e,
                f,
                g,
                h,
                i,
                j,
                k,
                l,
                m,
                n,
                o,
                p,
                q,
                r,
                s,
                t,
                u = "sizzle" + 1 * new Date(),
                v = a.document,
                w = 0,
                x = 0,
                y = ha(),
                z = ha(),
                A = ha(),
                B = function (a, b) {
                    return a === b && (l = !0), 0;
                },
                C = 1 << 31,
                D = {}.hasOwnProperty,
                E = [],
                F = E.pop,
                G = E.push,
                H = E.push,
                I = E.slice,
                J = function (a, b) {
                    for (var c = 0, d = a.length; d > c; c++) if (a[c] === b) return c;
                    return -1;
                },
                K = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
                L = "[\\x20\\t\\r\\n\\f]",
                M = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
                N = M.replace("w", "w#"),
                O = "\\[" + L + "*(" + M + ")(?:" + L + "*([*^$|!~]?=)" + L + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + N + "))|)" + L + "*\\]",
                P = ":(" + M + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + O + ")*)|.*)\\)|)",
                Q = new RegExp(L + "+", "g"),
                R = new RegExp("^" + L + "+|((?:^|[^\\\\])(?:\\\\.)*)" + L + "+$", "g"),
                S = new RegExp("^" + L + "*," + L + "*"),
                T = new RegExp("^" + L + "*([>+~]|" + L + ")" + L + "*"),
                U = new RegExp("=" + L + "*([^\\]'\"]*?)" + L + "*\\]", "g"),
                V = new RegExp(P),
                W = new RegExp("^" + N + "$"),
                X = {
                    ID: new RegExp("^#(" + M + ")"),
                    CLASS: new RegExp("^\\.(" + M + ")"),
                    TAG: new RegExp("^(" + M.replace("w", "w*") + ")"),
                    ATTR: new RegExp("^" + O),
                    PSEUDO: new RegExp("^" + P),
                    CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + L + "*(even|odd|(([+-]|)(\\d*)n|)" + L + "*(?:([+-]|)" + L + "*(\\d+)|))" + L + "*\\)|)", "i"),
                    bool: new RegExp("^(?:" + K + ")$", "i"),
                    needsContext: new RegExp("^" + L + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + L + "*((?:-\\d)?\\d*)" + L + "*\\)|)(?=[^-]|$)", "i"),
                },
                Y = /^(?:input|select|textarea|button)$/i,
                Z = /^h\d$/i,
                $ = /^[^{]+\{\s*\[native \w/,
                _ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
                aa = /[+~]/,
                ba = /'|\\/g,
                ca = new RegExp("\\\\([\\da-f]{1,6}" + L + "?|(" + L + ")|.)", "ig"),
                da = function (a, b, c) {
                    var d = "0x" + b - 65536;
                    return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode((d >> 10) | 55296, (1023 & d) | 56320);
                },
                ea = function () {
                    m();
                };
            try {
                H.apply((E = I.call(v.childNodes)), v.childNodes), E[v.childNodes.length].nodeType;
            } catch (fa) {
                H = {
                    apply: E.length
                        ? function (a, b) {
                              G.apply(a, I.call(b));
                          }
                        : function (a, b) {
                              for (var c = a.length, d = 0; (a[c++] = b[d++]); );
                              a.length = c - 1;
                          },
                };
            }
            (c = ga.support = {}),
                (f = ga.isXML = function (a) {
                    var b = a && (a.ownerDocument || a).documentElement;
                    return b ? "HTML" !== b.nodeName : !1;
                }),
                (m = ga.setDocument = function (a) {
                    var b,
                        e,
                        g = a ? a.ownerDocument || a : v;
                    return g !== n && 9 === g.nodeType && g.documentElement
                        ? ((n = g),
                          (o = g.documentElement),
                          (e = g.defaultView),
                          e && e !== e.top && (e.addEventListener ? e.addEventListener("unload", ea, !1) : e.attachEvent && e.attachEvent("onunload", ea)),
                          (p = !f(g)),
                          (c.attributes = ja(function (a) {
                              return (a.className = "i"), !a.getAttribute("className");
                          })),
                          (c.getElementsByTagName = ja(function (a) {
                              return a.appendChild(g.createComment("")), !a.getElementsByTagName("*").length;
                          })),
                          (c.getElementsByClassName = $.test(g.getElementsByClassName)),
                          (c.getById = ja(function (a) {
                              return (o.appendChild(a).id = u), !g.getElementsByName || !g.getElementsByName(u).length;
                          })),
                          c.getById
                              ? ((d.find.ID = function (a, b) {
                                    if ("undefined" != typeof b.getElementById && p) {
                                        var c = b.getElementById(a);
                                        return c && c.parentNode ? [c] : [];
                                    }
                                }),
                                (d.filter.ID = function (a) {
                                    var b = a.replace(ca, da);
                                    return function (a) {
                                        return a.getAttribute("id") === b;
                                    };
                                }))
                              : (delete d.find.ID,
                                (d.filter.ID = function (a) {
                                    var b = a.replace(ca, da);
                                    return function (a) {
                                        var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode("id");
                                        return c && c.value === b;
                                    };
                                })),
                          (d.find.TAG = c.getElementsByTagName
                              ? function (a, b) {
                                    return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName(a) : c.qsa ? b.querySelectorAll(a) : void 0;
                                }
                              : function (a, b) {
                                    var c,
                                        d = [],
                                        e = 0,
                                        f = b.getElementsByTagName(a);
                                    if ("*" === a) {
                                        for (; (c = f[e++]); ) 1 === c.nodeType && d.push(c);
                                        return d;
                                    }
                                    return f;
                                }),
                          (d.find.CLASS =
                              c.getElementsByClassName &&
                              function (a, b) {
                                  return p ? b.getElementsByClassName(a) : void 0;
                              }),
                          (r = []),
                          (q = []),
                          (c.qsa = $.test(g.querySelectorAll)) &&
                              (ja(function (a) {
                                  (o.appendChild(a).innerHTML = "<a id='" + u + "'></a><select id='" + u + "-\f]' msallowcapture=''><option selected=''></option></select>"),
                                      a.querySelectorAll("[msallowcapture^='']").length && q.push("[*^$]=" + L + "*(?:''|\"\")"),
                                      a.querySelectorAll("[selected]").length || q.push("\\[" + L + "*(?:value|" + K + ")"),
                                      a.querySelectorAll("[id~=" + u + "-]").length || q.push("~="),
                                      a.querySelectorAll(":checked").length || q.push(":checked"),
                                      a.querySelectorAll("a#" + u + "+*").length || q.push(".#.+[+~]");
                              }),
                              ja(function (a) {
                                  var b = g.createElement("input");
                                  b.setAttribute("type", "hidden"),
                                      a.appendChild(b).setAttribute("name", "D"),
                                      a.querySelectorAll("[name=d]").length && q.push("name" + L + "*[*^$|!~]?="),
                                      a.querySelectorAll(":enabled").length || q.push(":enabled", ":disabled"),
                                      a.querySelectorAll("*,:x"),
                                      q.push(",.*:");
                              })),
                          (c.matchesSelector = $.test((s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector))) &&
                              ja(function (a) {
                                  (c.disconnectedMatch = s.call(a, "div")), s.call(a, "[s!='']:x"), r.push("!=", P);
                              }),
                          (q = q.length && new RegExp(q.join("|"))),
                          (r = r.length && new RegExp(r.join("|"))),
                          (b = $.test(o.compareDocumentPosition)),
                          (t =
                              b || $.test(o.contains)
                                  ? function (a, b) {
                                        var c = 9 === a.nodeType ? a.documentElement : a,
                                            d = b && b.parentNode;
                                        return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)));
                                    }
                                  : function (a, b) {
                                        if (b) for (; (b = b.parentNode); ) if (b === a) return !0;
                                        return !1;
                                    }),
                          (B = b
                              ? function (a, b) {
                                    if (a === b) return (l = !0), 0;
                                    var d = !a.compareDocumentPosition - !b.compareDocumentPosition;
                                    return d
                                        ? d
                                        : ((d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1),
                                          1 & d || (!c.sortDetached && b.compareDocumentPosition(a) === d)
                                              ? a === g || (a.ownerDocument === v && t(v, a))
                                                  ? -1
                                                  : b === g || (b.ownerDocument === v && t(v, b))
                                                  ? 1
                                                  : k
                                                  ? J(k, a) - J(k, b)
                                                  : 0
                                              : 4 & d
                                              ? -1
                                              : 1);
                                }
                              : function (a, b) {
                                    if (a === b) return (l = !0), 0;
                                    var c,
                                        d = 0,
                                        e = a.parentNode,
                                        f = b.parentNode,
                                        h = [a],
                                        i = [b];
                                    if (!e || !f) return a === g ? -1 : b === g ? 1 : e ? -1 : f ? 1 : k ? J(k, a) - J(k, b) : 0;
                                    if (e === f) return la(a, b);
                                    for (c = a; (c = c.parentNode); ) h.unshift(c);
                                    for (c = b; (c = c.parentNode); ) i.unshift(c);
                                    for (; h[d] === i[d]; ) d++;
                                    return d ? la(h[d], i[d]) : h[d] === v ? -1 : i[d] === v ? 1 : 0;
                                }),
                          g)
                        : n;
                }),
                (ga.matches = function (a, b) {
                    return ga(a, null, null, b);
                }),
                (ga.matchesSelector = function (a, b) {
                    if (((a.ownerDocument || a) !== n && m(a), (b = b.replace(U, "='$1']")), !(!c.matchesSelector || !p || (r && r.test(b)) || (q && q.test(b)))))
                        try {
                            var d = s.call(a, b);
                            if (d || c.disconnectedMatch || (a.document && 11 !== a.document.nodeType)) return d;
                        } catch (e) {}
                    return ga(b, n, null, [a]).length > 0;
                }),
                (ga.contains = function (a, b) {
                    return (a.ownerDocument || a) !== n && m(a), t(a, b);
                }),
                (ga.attr = function (a, b) {
                    (a.ownerDocument || a) !== n && m(a);
                    var e = d.attrHandle[b.toLowerCase()],
                        f = e && D.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !p) : void 0;
                    return void 0 !== f ? f : c.attributes || !p ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null;
                }),
                (ga.error = function (a) {
                    throw new Error("Syntax error, unrecognized expression: " + a);
                }),
                (ga.uniqueSort = function (a) {
                    var b,
                        d = [],
                        e = 0,
                        f = 0;
                    if (((l = !c.detectDuplicates), (k = !c.sortStable && a.slice(0)), a.sort(B), l)) {
                        for (; (b = a[f++]); ) b === a[f] && (e = d.push(f));
                        for (; e--; ) a.splice(d[e], 1);
                    }
                    return (k = null), a;
                }),
                (e = ga.getText = function (a) {
                    var b,
                        c = "",
                        d = 0,
                        f = a.nodeType;
                    if (f) {
                        if (1 === f || 9 === f || 11 === f) {
                            if ("string" == typeof a.textContent) return a.textContent;
                            for (a = a.firstChild; a; a = a.nextSibling) c += e(a);
                        } else if (3 === f || 4 === f) return a.nodeValue;
                    } else for (; (b = a[d++]); ) c += e(b);
                    return c;
                }),
                (d = ga.selectors = {
                    cacheLength: 50,
                    createPseudo: ia,
                    match: X,
                    attrHandle: {},
                    find: {},
                    relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } },
                    preFilter: {
                        ATTR: function (a) {
                            return (a[1] = a[1].replace(ca, da)), (a[3] = (a[3] || a[4] || a[5] || "").replace(ca, da)), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4);
                        },
                        CHILD: function (a) {
                            return (
                                (a[1] = a[1].toLowerCase()),
                                "nth" === a[1].slice(0, 3) ? (a[3] || ga.error(a[0]), (a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3]))), (a[5] = +(a[7] + a[8] || "odd" === a[3]))) : a[3] && ga.error(a[0]),
                                a
                            );
                        },
                        PSEUDO: function (a) {
                            var b,
                                c = !a[6] && a[2];
                            return X.CHILD.test(a[0])
                                ? null
                                : (a[3] ? (a[2] = a[4] || a[5] || "") : c && V.test(c) && (b = g(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && ((a[0] = a[0].slice(0, b)), (a[2] = c.slice(0, b))), a.slice(0, 3));
                        },
                    },
                    filter: {
                        TAG: function (a) {
                            var b = a.replace(ca, da).toLowerCase();
                            return "*" === a
                                ? function () {
                                      return !0;
                                  }
                                : function (a) {
                                      return a.nodeName && a.nodeName.toLowerCase() === b;
                                  };
                        },
                        CLASS: function (a) {
                            var b = y[a + " "];
                            return (
                                b ||
                                ((b = new RegExp("(^|" + L + ")" + a + "(" + L + "|$)")) &&
                                    y(a, function (a) {
                                        return b.test(("string" == typeof a.className && a.className) || ("undefined" != typeof a.getAttribute && a.getAttribute("class")) || "");
                                    }))
                            );
                        },
                        ATTR: function (a, b, c) {
                            return function (d) {
                                var e = ga.attr(d, a);
                                return null == e
                                    ? "!=" === b
                                    : b
                                    ? ((e += ""),
                                      "=" === b
                                          ? e === c
                                          : "!=" === b
                                          ? e !== c
                                          : "^=" === b
                                          ? c && 0 === e.indexOf(c)
                                          : "*=" === b
                                          ? c && e.indexOf(c) > -1
                                          : "$=" === b
                                          ? c && e.slice(-c.length) === c
                                          : "~=" === b
                                          ? (" " + e.replace(Q, " ") + " ").indexOf(c) > -1
                                          : "|=" === b
                                          ? e === c || e.slice(0, c.length + 1) === c + "-"
                                          : !1)
                                    : !0;
                            };
                        },
                        CHILD: function (a, b, c, d, e) {
                            var f = "nth" !== a.slice(0, 3),
                                g = "last" !== a.slice(-4),
                                h = "of-type" === b;
                            return 1 === d && 0 === e
                                ? function (a) {
                                      return !!a.parentNode;
                                  }
                                : function (b, c, i) {
                                      var j,
                                          k,
                                          l,
                                          m,
                                          n,
                                          o,
                                          p = f !== g ? "nextSibling" : "previousSibling",
                                          q = b.parentNode,
                                          r = h && b.nodeName.toLowerCase(),
                                          s = !i && !h;
                                      if (q) {
                                          if (f) {
                                              for (; p; ) {
                                                  for (l = b; (l = l[p]); ) if (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) return !1;
                                                  o = p = "only" === a && !o && "nextSibling";
                                              }
                                              return !0;
                                          }
                                          if (((o = [g ? q.firstChild : q.lastChild]), g && s)) {
                                              for (k = q[u] || (q[u] = {}), j = k[a] || [], n = j[0] === w && j[1], m = j[0] === w && j[2], l = n && q.childNodes[n]; (l = (++n && l && l[p]) || (m = n = 0) || o.pop()); )
                                                  if (1 === l.nodeType && ++m && l === b) {
                                                      k[a] = [w, n, m];
                                                      break;
                                                  }
                                          } else if (s && (j = (b[u] || (b[u] = {}))[a]) && j[0] === w) m = j[1];
                                          else for (; (l = (++n && l && l[p]) || (m = n = 0) || o.pop()) && ((h ? l.nodeName.toLowerCase() !== r : 1 !== l.nodeType) || !++m || (s && ((l[u] || (l[u] = {}))[a] = [w, m]), l !== b)); );
                                          return (m -= e), m === d || (m % d === 0 && m / d >= 0);
                                      }
                                  };
                        },
                        PSEUDO: function (a, b) {
                            var c,
                                e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || ga.error("unsupported pseudo: " + a);
                            return e[u]
                                ? e(b)
                                : e.length > 1
                                ? ((c = [a, a, "", b]),
                                  d.setFilters.hasOwnProperty(a.toLowerCase())
                                      ? ia(function (a, c) {
                                            for (var d, f = e(a, b), g = f.length; g--; ) (d = J(a, f[g])), (a[d] = !(c[d] = f[g]));
                                        })
                                      : function (a) {
                                            return e(a, 0, c);
                                        })
                                : e;
                        },
                    },
                    pseudos: {
                        not: ia(function (a) {
                            var b = [],
                                c = [],
                                d = h(a.replace(R, "$1"));
                            return d[u]
                                ? ia(function (a, b, c, e) {
                                      for (var f, g = d(a, null, e, []), h = a.length; h--; ) (f = g[h]) && (a[h] = !(b[h] = f));
                                  })
                                : function (a, e, f) {
                                      return (b[0] = a), d(b, null, f, c), (b[0] = null), !c.pop();
                                  };
                        }),
                        has: ia(function (a) {
                            return function (b) {
                                return ga(a, b).length > 0;
                            };
                        }),
                        contains: ia(function (a) {
                            return (
                                (a = a.replace(ca, da)),
                                function (b) {
                                    return (b.textContent || b.innerText || e(b)).indexOf(a) > -1;
                                }
                            );
                        }),
                        lang: ia(function (a) {
                            return (
                                W.test(a || "") || ga.error("unsupported lang: " + a),
                                (a = a.replace(ca, da).toLowerCase()),
                                function (b) {
                                    var c;
                                    do if ((c = p ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang"))) return (c = c.toLowerCase()), c === a || 0 === c.indexOf(a + "-");
                                    while ((b = b.parentNode) && 1 === b.nodeType);
                                    return !1;
                                }
                            );
                        }),
                        target: function (b) {
                            var c = a.location && a.location.hash;
                            return c && c.slice(1) === b.id;
                        },
                        root: function (a) {
                            return a === o;
                        },
                        focus: function (a) {
                            return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex);
                        },
                        enabled: function (a) {
                            return a.disabled === !1;
                        },
                        disabled: function (a) {
                            return a.disabled === !0;
                        },
                        checked: function (a) {
                            var b = a.nodeName.toLowerCase();
                            return ("input" === b && !!a.checked) || ("option" === b && !!a.selected);
                        },
                        selected: function (a) {
                            return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
                        },
                        empty: function (a) {
                            for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1;
                            return !0;
                        },
                        parent: function (a) {
                            return !d.pseudos.empty(a);
                        },
                        header: function (a) {
                            return Z.test(a.nodeName);
                        },
                        input: function (a) {
                            return Y.test(a.nodeName);
                        },
                        button: function (a) {
                            var b = a.nodeName.toLowerCase();
                            return ("input" === b && "button" === a.type) || "button" === b;
                        },
                        text: function (a) {
                            var b;
                            return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase());
                        },
                        first: oa(function () {
                            return [0];
                        }),
                        last: oa(function (a, b) {
                            return [b - 1];
                        }),
                        eq: oa(function (a, b, c) {
                            return [0 > c ? c + b : c];
                        }),
                        even: oa(function (a, b) {
                            for (var c = 0; b > c; c += 2) a.push(c);
                            return a;
                        }),
                        odd: oa(function (a, b) {
                            for (var c = 1; b > c; c += 2) a.push(c);
                            return a;
                        }),
                        lt: oa(function (a, b, c) {
                            for (var d = 0 > c ? c + b : c; --d >= 0; ) a.push(d);
                            return a;
                        }),
                        gt: oa(function (a, b, c) {
                            for (var d = 0 > c ? c + b : c; ++d < b; ) a.push(d);
                            return a;
                        }),
                    },
                }),
                (d.pseudos.nth = d.pseudos.eq);
            for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = ma(b);
            for (b in { submit: !0, reset: !0 }) d.pseudos[b] = na(b);
            return (
                (qa.prototype = d.filters = d.pseudos),
                (d.setFilters = new qa()),
                (g = ga.tokenize = function (a, b) {
                    var c,
                        e,
                        f,
                        g,
                        h,
                        i,
                        j,
                        k = z[a + " "];
                    if (k) return b ? 0 : k.slice(0);
                    for (h = a, i = [], j = d.preFilter; h; ) {
                        (!c || (e = S.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push((f = []))), (c = !1), (e = T.exec(h)) && ((c = e.shift()), f.push({ value: c, type: e[0].replace(R, " ") }), (h = h.slice(c.length)));
                        for (g in d.filter) !(e = X[g].exec(h)) || (j[g] && !(e = j[g](e))) || ((c = e.shift()), f.push({ value: c, type: g, matches: e }), (h = h.slice(c.length)));
                        if (!c) break;
                    }
                    return b ? h.length : h ? ga.error(a) : z(a, i).slice(0);
                }),
                (h = ga.compile = function (a, b) {
                    var c,
                        d = [],
                        e = [],
                        f = A[a + " "];
                    if (!f) {
                        for (b || (b = g(a)), c = b.length; c--; ) (f = xa(b[c])), f[u] ? d.push(f) : e.push(f);
                        (f = A(a, ya(e, d))), (f.selector = a);
                    }
                    return f;
                }),
                (i = ga.select = function (a, b, e, f) {
                    var i,
                        j,
                        k,
                        l,
                        m,
                        n = "function" == typeof a && a,
                        o = !f && g((a = n.selector || a));
                    if (((e = e || []), 1 === o.length)) {
                        if (((j = o[0] = o[0].slice(0)), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type])) {
                            if (((b = (d.find.ID(k.matches[0].replace(ca, da), b) || [])[0]), !b)) return e;
                            n && (b = b.parentNode), (a = a.slice(j.shift().value.length));
                        }
                        for (i = X.needsContext.test(a) ? 0 : j.length; i-- && ((k = j[i]), !d.relative[(l = k.type)]); )
                            if ((m = d.find[l]) && (f = m(k.matches[0].replace(ca, da), (aa.test(j[0].type) && pa(b.parentNode)) || b))) {
                                if ((j.splice(i, 1), (a = f.length && ra(j)), !a)) return H.apply(e, f), e;
                                break;
                            }
                    }
                    return (n || h(a, o))(f, b, !p, e, (aa.test(a) && pa(b.parentNode)) || b), e;
                }),
                (c.sortStable = u.split("").sort(B).join("") === u),
                (c.detectDuplicates = !!l),
                m(),
                (c.sortDetached = ja(function (a) {
                    return 1 & a.compareDocumentPosition(n.createElement("div"));
                })),
                ja(function (a) {
                    return (a.innerHTML = "<a href='#'></a>"), "#" === a.firstChild.getAttribute("href");
                }) ||
                    ka("type|href|height|width", function (a, b, c) {
                        return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2);
                    }),
                (c.attributes &&
                    ja(function (a) {
                        return (a.innerHTML = "<input/>"), a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value");
                    })) ||
                    ka("value", function (a, b, c) {
                        return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue;
                    }),
                ja(function (a) {
                    return null == a.getAttribute("disabled");
                }) ||
                    ka(K, function (a, b, c) {
                        var d;
                        return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
                    }),
                ga
            );
        })(a);
        (m.find = s), (m.expr = s.selectors), (m.expr[":"] = m.expr.pseudos), (m.unique = s.uniqueSort), (m.text = s.getText), (m.isXMLDoc = s.isXML), (m.contains = s.contains);
        var t = m.expr.match.needsContext,
            u = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
            v = /^.[^:#\[\.,]*$/;
        (m.filter = function (a, b, c) {
            var d = b[0];
            return (
                c && (a = ":not(" + a + ")"),
                1 === b.length && 1 === d.nodeType
                    ? m.find.matchesSelector(d, a)
                        ? [d]
                        : []
                    : m.find.matches(
                          a,
                          m.grep(b, function (a) {
                              return 1 === a.nodeType;
                          })
                      )
            );
        }),
            m.fn.extend({
                find: function (a) {
                    var b,
                        c = [],
                        d = this,
                        e = d.length;
                    if ("string" != typeof a)
                        return this.pushStack(
                            m(a).filter(function () {
                                for (b = 0; e > b; b++) if (m.contains(d[b], this)) return !0;
                            })
                        );
                    for (b = 0; e > b; b++) m.find(a, d[b], c);
                    return (c = this.pushStack(e > 1 ? m.unique(c) : c)), (c.selector = this.selector ? this.selector + " " + a : a), c;
                },
                filter: function (a) {
                    return this.pushStack(w(this, a || [], !1));
                },
                not: function (a) {
                    return this.pushStack(w(this, a || [], !0));
                },
                is: function (a) {
                    return !!w(this, "string" == typeof a && t.test(a) ? m(a) : a || [], !1).length;
                },
            });
        var x,
            y = a.document,
            z = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
            A = (m.fn.init = function (a, b) {
                var c, d;
                if (!a) return this;
                if ("string" == typeof a) {
                    if (((c = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? [null, a, null] : z.exec(a)), !c || (!c[1] && b))) return !b || b.jquery ? (b || x).find(a) : this.constructor(b).find(a);
                    if (c[1]) {
                        if (((b = b instanceof m ? b[0] : b), m.merge(this, m.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : y, !0)), u.test(c[1]) && m.isPlainObject(b)))
                            for (c in b) m.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]);
                        return this;
                    }
                    if (((d = y.getElementById(c[2])), d && d.parentNode)) {
                        if (d.id !== c[2]) return x.find(a);
                        (this.length = 1), (this[0] = d);
                    }
                    return (this.context = y), (this.selector = a), this;
                }
                return a.nodeType
                    ? ((this.context = this[0] = a), (this.length = 1), this)
                    : m.isFunction(a)
                    ? "undefined" != typeof x.ready
                        ? x.ready(a)
                        : a(m)
                    : (void 0 !== a.selector && ((this.selector = a.selector), (this.context = a.context)), m.makeArray(a, this));
            });
        (A.prototype = m.fn), (x = m(y));
        var B = /^(?:parents|prev(?:Until|All))/,
            C = { children: !0, contents: !0, next: !0, prev: !0 };
        m.extend({
            dir: function (a, b, c) {
                for (var d = [], e = a[b]; e && 9 !== e.nodeType && (void 0 === c || 1 !== e.nodeType || !m(e).is(c)); ) 1 === e.nodeType && d.push(e), (e = e[b]);
                return d;
            },
            sibling: function (a, b) {
                for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);
                return c;
            },
        }),
            m.fn.extend({
                has: function (a) {
                    var b,
                        c = m(a, this),
                        d = c.length;
                    return this.filter(function () {
                        for (b = 0; d > b; b++) if (m.contains(this, c[b])) return !0;
                    });
                },
                closest: function (a, b) {
                    for (var c, d = 0, e = this.length, f = [], g = t.test(a) || "string" != typeof a ? m(a, b || this.context) : 0; e > d; d++)
                        for (c = this[d]; c && c !== b; c = c.parentNode)
                            if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && m.find.matchesSelector(c, a))) {
                                f.push(c);
                                break;
                            }
                    return this.pushStack(f.length > 1 ? m.unique(f) : f);
                },
                index: function (a) {
                    return a ? ("string" == typeof a ? m.inArray(this[0], m(a)) : m.inArray(a.jquery ? a[0] : a, this)) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
                },
                add: function (a, b) {
                    return this.pushStack(m.unique(m.merge(this.get(), m(a, b))));
                },
                addBack: function (a) {
                    return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
                },
            }),
            m.each(
                {
                    parent: function (a) {
                        var b = a.parentNode;
                        return b && 11 !== b.nodeType ? b : null;
                    },
                    parents: function (a) {
                        return m.dir(a, "parentNode");
                    },
                    parentsUntil: function (a, b, c) {
                        return m.dir(a, "parentNode", c);
                    },
                    next: function (a) {
                        return D(a, "nextSibling");
                    },
                    prev: function (a) {
                        return D(a, "previousSibling");
                    },
                    nextAll: function (a) {
                        return m.dir(a, "nextSibling");
                    },
                    prevAll: function (a) {
                        return m.dir(a, "previousSibling");
                    },
                    nextUntil: function (a, b, c) {
                        return m.dir(a, "nextSibling", c);
                    },
                    prevUntil: function (a, b, c) {
                        return m.dir(a, "previousSibling", c);
                    },
                    siblings: function (a) {
                        return m.sibling((a.parentNode || {}).firstChild, a);
                    },
                    children: function (a) {
                        return m.sibling(a.firstChild);
                    },
                    contents: function (a) {
                        return m.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : m.merge([], a.childNodes);
                    },
                },
                function (a, b) {
                    m.fn[a] = function (c, d) {
                        var e = m.map(this, b, c);
                        return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = m.filter(d, e)), this.length > 1 && (C[a] || (e = m.unique(e)), B.test(a) && (e = e.reverse())), this.pushStack(e);
                    };
                }
            );
        var E = /\S+/g,
            F = {};
        (m.Callbacks = function (a) {
            a = "string" == typeof a ? F[a] || G(a) : m.extend({}, a);
            var b,
                c,
                d,
                e,
                f,
                g,
                h = [],
                i = !a.once && [],
                j = function (l) {
                    for (c = a.memory && l, d = !0, f = g || 0, g = 0, e = h.length, b = !0; h && e > f; f++)
                        if (h[f].apply(l[0], l[1]) === !1 && a.stopOnFalse) {
                            c = !1;
                            break;
                        }
                    (b = !1), h && (i ? i.length && j(i.shift()) : c ? (h = []) : k.disable());
                },
                k = {
                    add: function () {
                        if (h) {
                            var d = h.length;
                            !(function f(b) {
                                m.each(b, function (b, c) {
                                    var d = m.type(c);
                                    "function" === d ? (a.unique && k.has(c)) || h.push(c) : c && c.length && "string" !== d && f(c);
                                });
                            })(arguments),
                                b ? (e = h.length) : c && ((g = d), j(c));
                        }
                        return this;
                    },
                    remove: function () {
                        return (
                            h &&
                                m.each(arguments, function (a, c) {
                                    for (var d; (d = m.inArray(c, h, d)) > -1; ) h.splice(d, 1), b && (e >= d && e--, f >= d && f--);
                                }),
                            this
                        );
                    },
                    has: function (a) {
                        return a ? m.inArray(a, h) > -1 : !(!h || !h.length);
                    },
                    empty: function () {
                        return (h = []), (e = 0), this;
                    },
                    disable: function () {
                        return (h = i = c = void 0), this;
                    },
                    disabled: function () {
                        return !h;
                    },
                    lock: function () {
                        return (i = void 0), c || k.disable(), this;
                    },
                    locked: function () {
                        return !i;
                    },
                    fireWith: function (a, c) {
                        return !h || (d && !i) || ((c = c || []), (c = [a, c.slice ? c.slice() : c]), b ? i.push(c) : j(c)), this;
                    },
                    fire: function () {
                        return k.fireWith(this, arguments), this;
                    },
                    fired: function () {
                        return !!d;
                    },
                };
            return k;
        }),
            m.extend({
                Deferred: function (a) {
                    var b = [
                            ["resolve", "done", m.Callbacks("once memory"), "resolved"],
                            ["reject", "fail", m.Callbacks("once memory"), "rejected"],
                            ["notify", "progress", m.Callbacks("memory")],
                        ],
                        c = "pending",
                        d = {
                            state: function () {
                                return c;
                            },
                            always: function () {
                                return e.done(arguments).fail(arguments), this;
                            },
                            then: function () {
                                var a = arguments;
                                return m
                                    .Deferred(function (c) {
                                        m.each(b, function (b, f) {
                                            var g = m.isFunction(a[b]) && a[b];
                                            e[f[1]](function () {
                                                var a = g && g.apply(this, arguments);
                                                a && m.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments);
                                            });
                                        }),
                                            (a = null);
                                    })
                                    .promise();
                            },
                            promise: function (a) {
                                return null != a ? m.extend(a, d) : d;
                            },
                        },
                        e = {};
                    return (
                        (d.pipe = d.then),
                        m.each(b, function (a, f) {
                            var g = f[2],
                                h = f[3];
                            (d[f[1]] = g.add),
                                h &&
                                    g.add(
                                        function () {
                                            c = h;
                                        },
                                        b[1 ^ a][2].disable,
                                        b[2][2].lock
                                    ),
                                (e[f[0]] = function () {
                                    return e[f[0] + "With"](this === e ? d : this, arguments), this;
                                }),
                                (e[f[0] + "With"] = g.fireWith);
                        }),
                        d.promise(e),
                        a && a.call(e, e),
                        e
                    );
                },
                when: function (a) {
                    var i,
                        j,
                        k,
                        b = 0,
                        c = d.call(arguments),
                        e = c.length,
                        f = 1 !== e || (a && m.isFunction(a.promise)) ? e : 0,
                        g = 1 === f ? a : m.Deferred(),
                        h = function (a, b, c) {
                            return function (e) {
                                (b[a] = this), (c[a] = arguments.length > 1 ? d.call(arguments) : e), c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c);
                            };
                        };
                    if (e > 1) for (i = new Array(e), j = new Array(e), k = new Array(e); e > b; b++) c[b] && m.isFunction(c[b].promise) ? c[b].promise().done(h(b, k, c)).fail(g.reject).progress(h(b, j, i)) : --f;
                    return f || g.resolveWith(k, c), g.promise();
                },
            });
        var H;
        (m.fn.ready = function (a) {
            return m.ready.promise().done(a), this;
        }),
            m.extend({
                isReady: !1,
                readyWait: 1,
                holdReady: function (a) {
                    a ? m.readyWait++ : m.ready(!0);
                },
                ready: function (a) {
                    if (a === !0 ? !--m.readyWait : !m.isReady) {
                        if (!y.body) return setTimeout(m.ready);
                        (m.isReady = !0), (a !== !0 && --m.readyWait > 0) || (H.resolveWith(y, [m]), m.fn.triggerHandler && (m(y).triggerHandler("ready"), m(y).off("ready")));
                    }
                },
            }),
            (m.ready.promise = function (b) {
                if (!H)
                    if (((H = m.Deferred()), "complete" === y.readyState)) setTimeout(m.ready);
                    else if (y.addEventListener) y.addEventListener("DOMContentLoaded", J, !1), a.addEventListener("load", J, !1);
                    else {
                        y.attachEvent("onreadystatechange", J), a.attachEvent("onload", J);
                        var c = !1;
                        try {
                            c = null == a.frameElement && y.documentElement;
                        } catch (d) {}
                        c &&
                            c.doScroll &&
                            !(function e() {
                                if (!m.isReady) {
                                    try {
                                        c.doScroll("left");
                                    } catch (a) {
                                        return setTimeout(e, 50);
                                    }
                                    I(), m.ready();
                                }
                            })();
                    }
                return H.promise(b);
            });
        var L,
            K = "undefined";
        for (L in m(k)) break;
        (k.ownLast = "0" !== L),
            (k.inlineBlockNeedsLayout = !1),
            m(function () {
                var a, b, c, d;
                (c = y.getElementsByTagName("body")[0]),
                    c &&
                        c.style &&
                        ((b = y.createElement("div")),
                        (d = y.createElement("div")),
                        (d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px"),
                        c.appendChild(d).appendChild(b),
                        typeof b.style.zoom !== K && ((b.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1"), (k.inlineBlockNeedsLayout = a = 3 === b.offsetWidth), a && (c.style.zoom = 1)),
                        c.removeChild(d));
            }),
            (function () {
                var a = y.createElement("div");
                if (null == k.deleteExpando) {
                    k.deleteExpando = !0;
                    try {
                        delete a.test;
                    } catch (b) {
                        k.deleteExpando = !1;
                    }
                }
                a = null;
            })(),
            (m.acceptData = function (a) {
                var b = m.noData[(a.nodeName + " ").toLowerCase()],
                    c = +a.nodeType || 1;
                return 1 !== c && 9 !== c ? !1 : !b || (b !== !0 && a.getAttribute("classid") === b);
            });
        var M = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
            N = /([A-Z])/g;
        m.extend({
            cache: {},
            noData: { "applet ": !0, "embed ": !0, "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" },
            hasData: function (a) {
                return (a = a.nodeType ? m.cache[a[m.expando]] : a[m.expando]), !!a && !P(a);
            },
            data: function (a, b, c) {
                return Q(a, b, c);
            },
            removeData: function (a, b) {
                return R(a, b);
            },
            _data: function (a, b, c) {
                return Q(a, b, c, !0);
            },
            _removeData: function (a, b) {
                return R(a, b, !0);
            },
        }),
            m.fn.extend({
                data: function (a, b) {
                    var c,
                        d,
                        e,
                        f = this[0],
                        g = f && f.attributes;
                    if (void 0 === a) {
                        if (this.length && ((e = m.data(f)), 1 === f.nodeType && !m._data(f, "parsedAttrs"))) {
                            for (c = g.length; c--; ) g[c] && ((d = g[c].name), 0 === d.indexOf("data-") && ((d = m.camelCase(d.slice(5))), O(f, d, e[d])));
                            m._data(f, "parsedAttrs", !0);
                        }
                        return e;
                    }
                    return "object" == typeof a
                        ? this.each(function () {
                              m.data(this, a);
                          })
                        : arguments.length > 1
                        ? this.each(function () {
                              m.data(this, a, b);
                          })
                        : f
                        ? O(f, a, m.data(f, a))
                        : void 0;
                },
                removeData: function (a) {
                    return this.each(function () {
                        m.removeData(this, a);
                    });
                },
            }),
            m.extend({
                queue: function (a, b, c) {
                    var d;
                    return a ? ((b = (b || "fx") + "queue"), (d = m._data(a, b)), c && (!d || m.isArray(c) ? (d = m._data(a, b, m.makeArray(c))) : d.push(c)), d || []) : void 0;
                },
                dequeue: function (a, b) {
                    b = b || "fx";
                    var c = m.queue(a, b),
                        d = c.length,
                        e = c.shift(),
                        f = m._queueHooks(a, b),
                        g = function () {
                            m.dequeue(a, b);
                        };
                    "inprogress" === e && ((e = c.shift()), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire();
                },
                _queueHooks: function (a, b) {
                    var c = b + "queueHooks";
                    return (
                        m._data(a, c) ||
                        m._data(a, c, {
                            empty: m.Callbacks("once memory").add(function () {
                                m._removeData(a, b + "queue"), m._removeData(a, c);
                            }),
                        })
                    );
                },
            }),
            m.fn.extend({
                queue: function (a, b) {
                    var c = 2;
                    return (
                        "string" != typeof a && ((b = a), (a = "fx"), c--),
                        arguments.length < c
                            ? m.queue(this[0], a)
                            : void 0 === b
                            ? this
                            : this.each(function () {
                                  var c = m.queue(this, a, b);
                                  m._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && m.dequeue(this, a);
                              })
                    );
                },
                dequeue: function (a) {
                    return this.each(function () {
                        m.dequeue(this, a);
                    });
                },
                clearQueue: function (a) {
                    return this.queue(a || "fx", []);
                },
                promise: function (a, b) {
                    var c,
                        d = 1,
                        e = m.Deferred(),
                        f = this,
                        g = this.length,
                        h = function () {
                            --d || e.resolveWith(f, [f]);
                        };
                    for ("string" != typeof a && ((b = a), (a = void 0)), a = a || "fx"; g--; ) (c = m._data(f[g], a + "queueHooks")), c && c.empty && (d++, c.empty.add(h));
                    return h(), e.promise(b);
                },
            });
        var S = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
            T = ["Top", "Right", "Bottom", "Left"],
            U = function (a, b) {
                return (a = b || a), "none" === m.css(a, "display") || !m.contains(a.ownerDocument, a);
            },
            V = (m.access = function (a, b, c, d, e, f, g) {
                var h = 0,
                    i = a.length,
                    j = null == c;
                if ("object" === m.type(c)) {
                    e = !0;
                    for (h in c) m.access(a, b, h, c[h], !0, f, g);
                } else if (
                    void 0 !== d &&
                    ((e = !0),
                    m.isFunction(d) || (g = !0),
                    j &&
                        (g
                            ? (b.call(a, d), (b = null))
                            : ((j = b),
                              (b = function (a, b, c) {
                                  return j.call(m(a), c);
                              }))),
                    b)
                )
                    for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));
                return e ? a : j ? b.call(a) : i ? b(a[0], c) : f;
            }),
            W = /^(?:checkbox|radio)$/i;
        !(function () {
            var a = y.createElement("input"),
                b = y.createElement("div"),
                c = y.createDocumentFragment();
            if (
                ((b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
                (k.leadingWhitespace = 3 === b.firstChild.nodeType),
                (k.tbody = !b.getElementsByTagName("tbody").length),
                (k.htmlSerialize = !!b.getElementsByTagName("link").length),
                (k.html5Clone = "<:nav></:nav>" !== y.createElement("nav").cloneNode(!0).outerHTML),
                (a.type = "checkbox"),
                (a.checked = !0),
                c.appendChild(a),
                (k.appendChecked = a.checked),
                (b.innerHTML = "<textarea>x</textarea>"),
                (k.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue),
                c.appendChild(b),
                (b.innerHTML = "<input type='radio' checked='checked' name='t'/>"),
                (k.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked),
                (k.noCloneEvent = !0),
                b.attachEvent &&
                    (b.attachEvent("onclick", function () {
                        k.noCloneEvent = !1;
                    }),
                    b.cloneNode(!0).click()),
                null == k.deleteExpando)
            ) {
                k.deleteExpando = !0;
                try {
                    delete b.test;
                } catch (d) {
                    k.deleteExpando = !1;
                }
            }
        })(),
            (function () {
                var b,
                    c,
                    d = y.createElement("div");
                for (b in { submit: !0, change: !0, focusin: !0 }) (c = "on" + b), (k[b + "Bubbles"] = c in a) || (d.setAttribute(c, "t"), (k[b + "Bubbles"] = d.attributes[c].expando === !1));
                d = null;
            })();
        var X = /^(?:input|select|textarea)$/i,
            Y = /^key/,
            Z = /^(?:mouse|pointer|contextmenu)|click/,
            $ = /^(?:focusinfocus|focusoutblur)$/,
            _ = /^([^.]*)(?:\.(.+)|)$/;
        (m.event = {
            global: {},
            add: function (a, b, c, d, e) {
                var f,
                    g,
                    h,
                    i,
                    j,
                    k,
                    l,
                    n,
                    o,
                    p,
                    q,
                    r = m._data(a);
                if (r) {
                    for (
                        c.handler && ((i = c), (c = i.handler), (e = i.selector)),
                            c.guid || (c.guid = m.guid++),
                            (g = r.events) || (g = r.events = {}),
                            (k = r.handle) ||
                                ((k = r.handle = function (a) {
                                    return typeof m === K || (a && m.event.triggered === a.type) ? void 0 : m.event.dispatch.apply(k.elem, arguments);
                                }),
                                (k.elem = a)),
                            b = (b || "").match(E) || [""],
                            h = b.length;
                        h--;

                    )
                        (f = _.exec(b[h]) || []),
                            (o = q = f[1]),
                            (p = (f[2] || "").split(".").sort()),
                            o &&
                                ((j = m.event.special[o] || {}),
                                (o = (e ? j.delegateType : j.bindType) || o),
                                (j = m.event.special[o] || {}),
                                (l = m.extend({ type: o, origType: q, data: d, handler: c, guid: c.guid, selector: e, needsContext: e && m.expr.match.needsContext.test(e), namespace: p.join(".") }, i)),
                                (n = g[o]) || ((n = g[o] = []), (n.delegateCount = 0), (j.setup && j.setup.call(a, d, p, k) !== !1) || (a.addEventListener ? a.addEventListener(o, k, !1) : a.attachEvent && a.attachEvent("on" + o, k))),
                                j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)),
                                e ? n.splice(n.delegateCount++, 0, l) : n.push(l),
                                (m.event.global[o] = !0));
                    a = null;
                }
            },
            remove: function (a, b, c, d, e) {
                var f,
                    g,
                    h,
                    i,
                    j,
                    k,
                    l,
                    n,
                    o,
                    p,
                    q,
                    r = m.hasData(a) && m._data(a);
                if (r && (k = r.events)) {
                    for (b = (b || "").match(E) || [""], j = b.length; j--; )
                        if (((h = _.exec(b[j]) || []), (o = q = h[1]), (p = (h[2] || "").split(".").sort()), o)) {
                            for (l = m.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, n = k[o] || [], h = h[2] && new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)"), i = f = n.length; f--; )
                                (g = n[f]),
                                    (!e && q !== g.origType) ||
                                        (c && c.guid !== g.guid) ||
                                        (h && !h.test(g.namespace)) ||
                                        (d && d !== g.selector && ("**" !== d || !g.selector)) ||
                                        (n.splice(f, 1), g.selector && n.delegateCount--, l.remove && l.remove.call(a, g));
                            i && !n.length && ((l.teardown && l.teardown.call(a, p, r.handle) !== !1) || m.removeEvent(a, o, r.handle), delete k[o]);
                        } else for (o in k) m.event.remove(a, o + b[j], c, d, !0);
                    m.isEmptyObject(k) && (delete r.handle, m._removeData(a, "events"));
                }
            },
            trigger: function (b, c, d, e) {
                var f,
                    g,
                    h,
                    i,
                    k,
                    l,
                    n,
                    o = [d || y],
                    p = j.call(b, "type") ? b.type : b,
                    q = j.call(b, "namespace") ? b.namespace.split(".") : [];
                if (
                    ((h = l = d = d || y),
                    3 !== d.nodeType &&
                        8 !== d.nodeType &&
                        !$.test(p + m.event.triggered) &&
                        (p.indexOf(".") >= 0 && ((q = p.split(".")), (p = q.shift()), q.sort()),
                        (g = p.indexOf(":") < 0 && "on" + p),
                        (b = b[m.expando] ? b : new m.Event(p, "object" == typeof b && b)),
                        (b.isTrigger = e ? 2 : 3),
                        (b.namespace = q.join(".")),
                        (b.namespace_re = b.namespace ? new RegExp("(^|\\.)" + q.join("\\.(?:.*\\.|)") + "(\\.|$)") : null),
                        (b.result = void 0),
                        b.target || (b.target = d),
                        (c = null == c ? [b] : m.makeArray(c, [b])),
                        (k = m.event.special[p] || {}),
                        e || !k.trigger || k.trigger.apply(d, c) !== !1))
                ) {
                    if (!e && !k.noBubble && !m.isWindow(d)) {
                        for (i = k.delegateType || p, $.test(i + p) || (h = h.parentNode); h; h = h.parentNode) o.push(h), (l = h);
                        l === (d.ownerDocument || y) && o.push(l.defaultView || l.parentWindow || a);
                    }
                    for (n = 0; (h = o[n++]) && !b.isPropagationStopped(); )
                        (b.type = n > 1 ? i : k.bindType || p),
                            (f = (m._data(h, "events") || {})[b.type] && m._data(h, "handle")),
                            f && f.apply(h, c),
                            (f = g && h[g]),
                            f && f.apply && m.acceptData(h) && ((b.result = f.apply(h, c)), b.result === !1 && b.preventDefault());
                    if (((b.type = p), !e && !b.isDefaultPrevented() && (!k._default || k._default.apply(o.pop(), c) === !1) && m.acceptData(d) && g && d[p] && !m.isWindow(d))) {
                        (l = d[g]), l && (d[g] = null), (m.event.triggered = p);
                        try {
                            d[p]();
                        } catch (r) {}
                        (m.event.triggered = void 0), l && (d[g] = l);
                    }
                    return b.result;
                }
            },
            dispatch: function (a) {
                a = m.event.fix(a);
                var b,
                    c,
                    e,
                    f,
                    g,
                    h = [],
                    i = d.call(arguments),
                    j = (m._data(this, "events") || {})[a.type] || [],
                    k = m.event.special[a.type] || {};
                if (((i[0] = a), (a.delegateTarget = this), !k.preDispatch || k.preDispatch.call(this, a) !== !1)) {
                    for (h = m.event.handlers.call(this, a, j), b = 0; (f = h[b++]) && !a.isPropagationStopped(); )
                        for (a.currentTarget = f.elem, g = 0; (e = f.handlers[g++]) && !a.isImmediatePropagationStopped(); )
                            (!a.namespace_re || a.namespace_re.test(e.namespace)) &&
                                ((a.handleObj = e), (a.data = e.data), (c = ((m.event.special[e.origType] || {}).handle || e.handler).apply(f.elem, i)), void 0 !== c && (a.result = c) === !1 && (a.preventDefault(), a.stopPropagation()));
                    return k.postDispatch && k.postDispatch.call(this, a), a.result;
                }
            },
            handlers: function (a, b) {
                var c,
                    d,
                    e,
                    f,
                    g = [],
                    h = b.delegateCount,
                    i = a.target;
                if (h && i.nodeType && (!a.button || "click" !== a.type))
                    for (; i != this; i = i.parentNode || this)
                        if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) {
                            for (e = [], f = 0; h > f; f++) (d = b[f]), (c = d.selector + " "), void 0 === e[c] && (e[c] = d.needsContext ? m(c, this).index(i) >= 0 : m.find(c, this, null, [i]).length), e[c] && e.push(d);
                            e.length && g.push({ elem: i, handlers: e });
                        }
                return h < b.length && g.push({ elem: this, handlers: b.slice(h) }), g;
            },
            fix: function (a) {
                if (a[m.expando]) return a;
                var b,
                    c,
                    d,
                    e = a.type,
                    f = a,
                    g = this.fixHooks[e];
                for (g || (this.fixHooks[e] = g = Z.test(e) ? this.mouseHooks : Y.test(e) ? this.keyHooks : {}), d = g.props ? this.props.concat(g.props) : this.props, a = new m.Event(f), b = d.length; b--; ) (c = d[b]), (a[c] = f[c]);
                return a.target || (a.target = f.srcElement || y), 3 === a.target.nodeType && (a.target = a.target.parentNode), (a.metaKey = !!a.metaKey), g.filter ? g.filter(a, f) : a;
            },
            props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
            fixHooks: {},
            keyHooks: {
                props: "char charCode key keyCode".split(" "),
                filter: function (a, b) {
                    return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a;
                },
            },
            mouseHooks: {
                props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
                filter: function (a, b) {
                    var c,
                        d,
                        e,
                        f = b.button,
                        g = b.fromElement;
                    return (
                        null == a.pageX &&
                            null != b.clientX &&
                            ((d = a.target.ownerDocument || y),
                            (e = d.documentElement),
                            (c = d.body),
                            (a.pageX = b.clientX + ((e && e.scrollLeft) || (c && c.scrollLeft) || 0) - ((e && e.clientLeft) || (c && c.clientLeft) || 0)),
                            (a.pageY = b.clientY + ((e && e.scrollTop) || (c && c.scrollTop) || 0) - ((e && e.clientTop) || (c && c.clientTop) || 0))),
                        !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g),
                        a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0),
                        a
                    );
                },
            },
            special: {
                load: { noBubble: !0 },
                focus: {
                    trigger: function () {
                        if (this !== ca() && this.focus)
                            try {
                                return this.focus(), !1;
                            } catch (a) {}
                    },
                    delegateType: "focusin",
                },
                blur: {
                    trigger: function () {
                        return this === ca() && this.blur ? (this.blur(), !1) : void 0;
                    },
                    delegateType: "focusout",
                },
                click: {
                    trigger: function () {
                        return m.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : void 0;
                    },
                    _default: function (a) {
                        return m.nodeName(a.target, "a");
                    },
                },
                beforeunload: {
                    postDispatch: function (a) {
                        void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result);
                    },
                },
            },
            simulate: function (a, b, c, d) {
                var e = m.extend(new m.Event(), c, { type: a, isSimulated: !0, originalEvent: {} });
                d ? m.event.trigger(e, null, b) : m.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault();
            },
        }),
            (m.removeEvent = y.removeEventListener
                ? function (a, b, c) {
                      a.removeEventListener && a.removeEventListener(b, c, !1);
                  }
                : function (a, b, c) {
                      var d = "on" + b;
                      a.detachEvent && (typeof a[d] === K && (a[d] = null), a.detachEvent(d, c));
                  }),
            (m.Event = function (a, b) {
                return this instanceof m.Event
                    ? (a && a.type ? ((this.originalEvent = a), (this.type = a.type), (this.isDefaultPrevented = a.defaultPrevented || (void 0 === a.defaultPrevented && a.returnValue === !1) ? aa : ba)) : (this.type = a),
                      b && m.extend(this, b),
                      (this.timeStamp = (a && a.timeStamp) || m.now()),
                      void (this[m.expando] = !0))
                    : new m.Event(a, b);
            }),
            (m.Event.prototype = {
                isDefaultPrevented: ba,
                isPropagationStopped: ba,
                isImmediatePropagationStopped: ba,
                preventDefault: function () {
                    var a = this.originalEvent;
                    (this.isDefaultPrevented = aa), a && (a.preventDefault ? a.preventDefault() : (a.returnValue = !1));
                },
                stopPropagation: function () {
                    var a = this.originalEvent;
                    (this.isPropagationStopped = aa), a && (a.stopPropagation && a.stopPropagation(), (a.cancelBubble = !0));
                },
                stopImmediatePropagation: function () {
                    var a = this.originalEvent;
                    (this.isImmediatePropagationStopped = aa), a && a.stopImmediatePropagation && a.stopImmediatePropagation(), this.stopPropagation();
                },
            }),
            m.each({ mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" }, function (a, b) {
                m.event.special[a] = {
                    delegateType: b,
                    bindType: b,
                    handle: function (a) {
                        var c,
                            d = this,
                            e = a.relatedTarget,
                            f = a.handleObj;
                        return (!e || (e !== d && !m.contains(d, e))) && ((a.type = f.origType), (c = f.handler.apply(this, arguments)), (a.type = b)), c;
                    },
                };
            }),
            k.submitBubbles ||
                (m.event.special.submit = {
                    setup: function () {
                        return m.nodeName(this, "form")
                            ? !1
                            : void m.event.add(this, "click._submit keypress._submit", function (a) {
                                  var b = a.target,
                                      c = m.nodeName(b, "input") || m.nodeName(b, "button") ? b.form : void 0;
                                  c &&
                                      !m._data(c, "submitBubbles") &&
                                      (m.event.add(c, "submit._submit", function (a) {
                                          a._submit_bubble = !0;
                                      }),
                                      m._data(c, "submitBubbles", !0));
                              });
                    },
                    postDispatch: function (a) {
                        a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && m.event.simulate("submit", this.parentNode, a, !0));
                    },
                    teardown: function () {
                        return m.nodeName(this, "form") ? !1 : void m.event.remove(this, "._submit");
                    },
                }),
            k.changeBubbles ||
                (m.event.special.change = {
                    setup: function () {
                        return X.test(this.nodeName)
                            ? (("checkbox" === this.type || "radio" === this.type) &&
                                  (m.event.add(this, "propertychange._change", function (a) {
                                      "checked" === a.originalEvent.propertyName && (this._just_changed = !0);
                                  }),
                                  m.event.add(this, "click._change", function (a) {
                                      this._just_changed && !a.isTrigger && (this._just_changed = !1), m.event.simulate("change", this, a, !0);
                                  })),
                              !1)
                            : void m.event.add(this, "beforeactivate._change", function (a) {
                                  var b = a.target;
                                  X.test(b.nodeName) &&
                                      !m._data(b, "changeBubbles") &&
                                      (m.event.add(b, "change._change", function (a) {
                                          !this.parentNode || a.isSimulated || a.isTrigger || m.event.simulate("change", this.parentNode, a, !0);
                                      }),
                                      m._data(b, "changeBubbles", !0));
                              });
                    },
                    handle: function (a) {
                        var b = a.target;
                        return this !== b || a.isSimulated || a.isTrigger || ("radio" !== b.type && "checkbox" !== b.type) ? a.handleObj.handler.apply(this, arguments) : void 0;
                    },
                    teardown: function () {
                        return m.event.remove(this, "._change"), !X.test(this.nodeName);
                    },
                }),
            k.focusinBubbles ||
                m.each({ focus: "focusin", blur: "focusout" }, function (a, b) {
                    var c = function (a) {
                        m.event.simulate(b, a.target, m.event.fix(a), !0);
                    };
                    m.event.special[b] = {
                        setup: function () {
                            var d = this.ownerDocument || this,
                                e = m._data(d, b);
                            e || d.addEventListener(a, c, !0), m._data(d, b, (e || 0) + 1);
                        },
                        teardown: function () {
                            var d = this.ownerDocument || this,
                                e = m._data(d, b) - 1;
                            e ? m._data(d, b, e) : (d.removeEventListener(a, c, !0), m._removeData(d, b));
                        },
                    };
                }),
            m.fn.extend({
                on: function (a, b, c, d, e) {
                    var f, g;
                    if ("object" == typeof a) {
                        "string" != typeof b && ((c = c || b), (b = void 0));
                        for (f in a) this.on(f, b, c, a[f], e);
                        return this;
                    }
                    if ((null == c && null == d ? ((d = b), (c = b = void 0)) : null == d && ("string" == typeof b ? ((d = c), (c = void 0)) : ((d = c), (c = b), (b = void 0))), d === !1)) d = ba;
                    else if (!d) return this;
                    return (
                        1 === e &&
                            ((g = d),
                            (d = function (a) {
                                return m().off(a), g.apply(this, arguments);
                            }),
                            (d.guid = g.guid || (g.guid = m.guid++))),
                        this.each(function () {
                            m.event.add(this, a, d, c, b);
                        })
                    );
                },
                one: function (a, b, c, d) {
                    return this.on(a, b, c, d, 1);
                },
                off: function (a, b, c) {
                    var d, e;
                    if (a && a.preventDefault && a.handleObj) return (d = a.handleObj), m(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;
                    if ("object" == typeof a) {
                        for (e in a) this.off(e, b, a[e]);
                        return this;
                    }
                    return (
                        (b === !1 || "function" == typeof b) && ((c = b), (b = void 0)),
                        c === !1 && (c = ba),
                        this.each(function () {
                            m.event.remove(this, a, c, b);
                        })
                    );
                },
                trigger: function (a, b) {
                    return this.each(function () {
                        m.event.trigger(a, b, this);
                    });
                },
                triggerHandler: function (a, b) {
                    var c = this[0];
                    return c ? m.event.trigger(a, b, c, !0) : void 0;
                },
            });
        var ea = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
            fa = / jQuery\d+="(?:null|\d+)"/g,
            ga = new RegExp("<(?:" + ea + ")[\\s/>]", "i"),
            ha = /^\s+/,
            ia = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
            ja = /<([\w:]+)/,
            ka = /<tbody/i,
            la = /<|&#?\w+;/,
            ma = /<(?:script|style|link)/i,
            na = /checked\s*(?:[^=]|=\s*.checked.)/i,
            oa = /^$|\/(?:java|ecma)script/i,
            pa = /^true\/(.*)/,
            qa = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
            ra = {
                option: [1, "<select multiple='multiple'>", "</select>"],
                legend: [1, "<fieldset>", "</fieldset>"],
                area: [1, "<map>", "</map>"],
                param: [1, "<object>", "</object>"],
                thead: [1, "<table>", "</table>"],
                tr: [2, "<table><tbody>", "</tbody></table>"],
                col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
                td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                _default: k.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"],
            },
            sa = da(y),
            ta = sa.appendChild(y.createElement("div"));
        (ra.optgroup = ra.option),
            (ra.tbody = ra.tfoot = ra.colgroup = ra.caption = ra.thead),
            (ra.th = ra.td),
            m.extend({
                clone: function (a, b, c) {
                    var d,
                        e,
                        f,
                        g,
                        h,
                        i = m.contains(a.ownerDocument, a);
                    if (
                        (k.html5Clone || m.isXMLDoc(a) || !ga.test("<" + a.nodeName + ">") ? (f = a.cloneNode(!0)) : ((ta.innerHTML = a.outerHTML), ta.removeChild((f = ta.firstChild))),
                        !((k.noCloneEvent && k.noCloneChecked) || (1 !== a.nodeType && 11 !== a.nodeType) || m.isXMLDoc(a)))
                    )
                        for (d = ua(f), h = ua(a), g = 0; null != (e = h[g]); ++g) d[g] && Ba(e, d[g]);
                    if (b)
                        if (c) for (h = h || ua(a), d = d || ua(f), g = 0; null != (e = h[g]); g++) Aa(e, d[g]);
                        else Aa(a, f);
                    return (d = ua(f, "script")), d.length > 0 && za(d, !i && ua(a, "script")), (d = h = e = null), f;
                },
                buildFragment: function (a, b, c, d) {
                    for (var e, f, g, h, i, j, l, n = a.length, o = da(b), p = [], q = 0; n > q; q++)
                        if (((f = a[q]), f || 0 === f))
                            if ("object" === m.type(f)) m.merge(p, f.nodeType ? [f] : f);
                            else if (la.test(f)) {
                                for (h = h || o.appendChild(b.createElement("div")), i = (ja.exec(f) || ["", ""])[1].toLowerCase(), l = ra[i] || ra._default, h.innerHTML = l[1] + f.replace(ia, "<$1></$2>") + l[2], e = l[0]; e--; )
                                    h = h.lastChild;
                                if ((!k.leadingWhitespace && ha.test(f) && p.push(b.createTextNode(ha.exec(f)[0])), !k.tbody))
                                    for (f = "table" !== i || ka.test(f) ? ("<table>" !== l[1] || ka.test(f) ? 0 : h) : h.firstChild, e = f && f.childNodes.length; e--; )
                                        m.nodeName((j = f.childNodes[e]), "tbody") && !j.childNodes.length && f.removeChild(j);
                                for (m.merge(p, h.childNodes), h.textContent = ""; h.firstChild; ) h.removeChild(h.firstChild);
                                h = o.lastChild;
                            } else p.push(b.createTextNode(f));
                    for (h && o.removeChild(h), k.appendChecked || m.grep(ua(p, "input"), va), q = 0; (f = p[q++]); )
                        if ((!d || -1 === m.inArray(f, d)) && ((g = m.contains(f.ownerDocument, f)), (h = ua(o.appendChild(f), "script")), g && za(h), c)) for (e = 0; (f = h[e++]); ) oa.test(f.type || "") && c.push(f);
                    return (h = null), o;
                },
                cleanData: function (a, b) {
                    for (var d, e, f, g, h = 0, i = m.expando, j = m.cache, l = k.deleteExpando, n = m.event.special; null != (d = a[h]); h++)
                        if ((b || m.acceptData(d)) && ((f = d[i]), (g = f && j[f]))) {
                            if (g.events) for (e in g.events) n[e] ? m.event.remove(d, e) : m.removeEvent(d, e, g.handle);
                            j[f] && (delete j[f], l ? delete d[i] : typeof d.removeAttribute !== K ? d.removeAttribute(i) : (d[i] = null), c.push(f));
                        }
                },
            }),
            m.fn.extend({
                text: function (a) {
                    return V(
                        this,
                        function (a) {
                            return void 0 === a ? m.text(this) : this.empty().append(((this[0] && this[0].ownerDocument) || y).createTextNode(a));
                        },
                        null,
                        a,
                        arguments.length
                    );
                },
                append: function () {
                    return this.domManip(arguments, function (a) {
                        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                            var b = wa(this, a);
                            b.appendChild(a);
                        }
                    });
                },
                prepend: function () {
                    return this.domManip(arguments, function (a) {
                        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                            var b = wa(this, a);
                            b.insertBefore(a, b.firstChild);
                        }
                    });
                },
                before: function () {
                    return this.domManip(arguments, function (a) {
                        this.parentNode && this.parentNode.insertBefore(a, this);
                    });
                },
                after: function () {
                    return this.domManip(arguments, function (a) {
                        this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
                    });
                },
                remove: function (a, b) {
                    for (var c, d = a ? m.filter(a, this) : this, e = 0; null != (c = d[e]); e++)
                        b || 1 !== c.nodeType || m.cleanData(ua(c)), c.parentNode && (b && m.contains(c.ownerDocument, c) && za(ua(c, "script")), c.parentNode.removeChild(c));
                    return this;
                },
                empty: function () {
                    for (var a, b = 0; null != (a = this[b]); b++) {
                        for (1 === a.nodeType && m.cleanData(ua(a, !1)); a.firstChild; ) a.removeChild(a.firstChild);
                        a.options && m.nodeName(a, "select") && (a.options.length = 0);
                    }
                    return this;
                },
                clone: function (a, b) {
                    return (
                        (a = null == a ? !1 : a),
                        (b = null == b ? a : b),
                        this.map(function () {
                            return m.clone(this, a, b);
                        })
                    );
                },
                html: function (a) {
                    return V(
                        this,
                        function (a) {
                            var b = this[0] || {},
                                c = 0,
                                d = this.length;
                            if (void 0 === a) return 1 === b.nodeType ? b.innerHTML.replace(fa, "") : void 0;
                            if (!("string" != typeof a || ma.test(a) || (!k.htmlSerialize && ga.test(a)) || (!k.leadingWhitespace && ha.test(a)) || ra[(ja.exec(a) || ["", ""])[1].toLowerCase()])) {
                                a = a.replace(ia, "<$1></$2>");
                                try {
                                    for (; d > c; c++) (b = this[c] || {}), 1 === b.nodeType && (m.cleanData(ua(b, !1)), (b.innerHTML = a));
                                    b = 0;
                                } catch (e) {}
                            }
                            b && this.empty().append(a);
                        },
                        null,
                        a,
                        arguments.length
                    );
                },
                replaceWith: function () {
                    var a = arguments[0];
                    return (
                        this.domManip(arguments, function (b) {
                            (a = this.parentNode), m.cleanData(ua(this)), a && a.replaceChild(b, this);
                        }),
                        a && (a.length || a.nodeType) ? this : this.remove()
                    );
                },
                detach: function (a) {
                    return this.remove(a, !0);
                },
                domManip: function (a, b) {
                    a = e.apply([], a);
                    var c,
                        d,
                        f,
                        g,
                        h,
                        i,
                        j = 0,
                        l = this.length,
                        n = this,
                        o = l - 1,
                        p = a[0],
                        q = m.isFunction(p);
                    if (q || (l > 1 && "string" == typeof p && !k.checkClone && na.test(p)))
                        return this.each(function (c) {
                            var d = n.eq(c);
                            q && (a[0] = p.call(this, c, d.html())), d.domManip(a, b);
                        });
                    if (l && ((i = m.buildFragment(a, this[0].ownerDocument, !1, this)), (c = i.firstChild), 1 === i.childNodes.length && (i = c), c)) {
                        for (g = m.map(ua(i, "script"), xa), f = g.length; l > j; j++) (d = i), j !== o && ((d = m.clone(d, !0, !0)), f && m.merge(g, ua(d, "script"))), b.call(this[j], d, j);
                        if (f)
                            for (h = g[g.length - 1].ownerDocument, m.map(g, ya), j = 0; f > j; j++)
                                (d = g[j]), oa.test(d.type || "") && !m._data(d, "globalEval") && m.contains(h, d) && (d.src ? m._evalUrl && m._evalUrl(d.src) : m.globalEval((d.text || d.textContent || d.innerHTML || "").replace(qa, "")));
                        i = c = null;
                    }
                    return this;
                },
            }),
            m.each({ appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" }, function (a, b) {
                m.fn[a] = function (a) {
                    for (var c, d = 0, e = [], g = m(a), h = g.length - 1; h >= d; d++) (c = d === h ? this : this.clone(!0)), m(g[d])[b](c), f.apply(e, c.get());
                    return this.pushStack(e);
                };
            });
        var Ca,
            Da = {};
        !(function () {
            var a;
            k.shrinkWrapBlocks = function () {
                if (null != a) return a;
                a = !1;
                var b, c, d;
                return (
                    (c = y.getElementsByTagName("body")[0]),
                    c && c.style
                        ? ((b = y.createElement("div")),
                          (d = y.createElement("div")),
                          (d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px"),
                          c.appendChild(d).appendChild(b),
                          typeof b.style.zoom !== K &&
                              ((b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1"),
                              (b.appendChild(y.createElement("div")).style.width = "5px"),
                              (a = 3 !== b.offsetWidth)),
                          c.removeChild(d),
                          a)
                        : void 0
                );
            };
        })();
        var Ia,
            Ja,
            Ga = /^margin/,
            Ha = new RegExp("^(" + S + ")(?!px)[a-z%]+$", "i"),
            Ka = /^(top|right|bottom|left)$/;
        a.getComputedStyle
            ? ((Ia = function (b) {
                  return b.ownerDocument.defaultView.opener ? b.ownerDocument.defaultView.getComputedStyle(b, null) : a.getComputedStyle(b, null);
              }),
              (Ja = function (a, b, c) {
                  var d,
                      e,
                      f,
                      g,
                      h = a.style;
                  return (
                      (c = c || Ia(a)),
                      (g = c ? c.getPropertyValue(b) || c[b] : void 0),
                      c &&
                          ("" !== g || m.contains(a.ownerDocument, a) || (g = m.style(a, b)),
                          Ha.test(g) && Ga.test(b) && ((d = h.width), (e = h.minWidth), (f = h.maxWidth), (h.minWidth = h.maxWidth = h.width = g), (g = c.width), (h.width = d), (h.minWidth = e), (h.maxWidth = f))),
                      void 0 === g ? g : g + ""
                  );
              }))
            : y.documentElement.currentStyle &&
              ((Ia = function (a) {
                  return a.currentStyle;
              }),
              (Ja = function (a, b, c) {
                  var d,
                      e,
                      f,
                      g,
                      h = a.style;
                  return (
                      (c = c || Ia(a)),
                      (g = c ? c[b] : void 0),
                      null == g && h && h[b] && (g = h[b]),
                      Ha.test(g) &&
                          !Ka.test(b) &&
                          ((d = h.left), (e = a.runtimeStyle), (f = e && e.left), f && (e.left = a.currentStyle.left), (h.left = "fontSize" === b ? "1em" : g), (g = h.pixelLeft + "px"), (h.left = d), f && (e.left = f)),
                      void 0 === g ? g : g + "" || "auto"
                  );
              })),
            !(function () {
                function i() {
                    var b, c, d, i;
                    (c = y.getElementsByTagName("body")[0]),
                        c &&
                            c.style &&
                            ((b = y.createElement("div")),
                            (d = y.createElement("div")),
                            (d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px"),
                            c.appendChild(d).appendChild(b),
                            (b.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute"),
                            (e = f = !1),
                            (h = !0),
                            a.getComputedStyle &&
                                ((e = "1%" !== (a.getComputedStyle(b, null) || {}).top),
                                (f = "4px" === (a.getComputedStyle(b, null) || { width: "4px" }).width),
                                (i = b.appendChild(y.createElement("div"))),
                                (i.style.cssText = b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0"),
                                (i.style.marginRight = i.style.width = "0"),
                                (b.style.width = "1px"),
                                (h = !parseFloat((a.getComputedStyle(i, null) || {}).marginRight)),
                                b.removeChild(i)),
                            (b.innerHTML = "<table><tr><td></td><td>t</td></tr></table>"),
                            (i = b.getElementsByTagName("td")),
                            (i[0].style.cssText = "margin:0;border:0;padding:0;display:none"),
                            (g = 0 === i[0].offsetHeight),
                            g && ((i[0].style.display = ""), (i[1].style.display = "none"), (g = 0 === i[0].offsetHeight)),
                            c.removeChild(d));
                }
                var b, c, d, e, f, g, h;
                (b = y.createElement("div")),
                    (b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
                    (d = b.getElementsByTagName("a")[0]),
                    (c = d && d.style) &&
                        ((c.cssText = "float:left;opacity:.5"),
                        (k.opacity = "0.5" === c.opacity),
                        (k.cssFloat = !!c.cssFloat),
                        (b.style.backgroundClip = "content-box"),
                        (b.cloneNode(!0).style.backgroundClip = ""),
                        (k.clearCloneStyle = "content-box" === b.style.backgroundClip),
                        (k.boxSizing = "" === c.boxSizing || "" === c.MozBoxSizing || "" === c.WebkitBoxSizing),
                        m.extend(k, {
                            reliableHiddenOffsets: function () {
                                return null == g && i(), g;
                            },
                            boxSizingReliable: function () {
                                return null == f && i(), f;
                            },
                            pixelPosition: function () {
                                return null == e && i(), e;
                            },
                            reliableMarginRight: function () {
                                return null == h && i(), h;
                            },
                        }));
            })(),
            (m.swap = function (a, b, c, d) {
                var e,
                    f,
                    g = {};
                for (f in b) (g[f] = a.style[f]), (a.style[f] = b[f]);
                e = c.apply(a, d || []);
                for (f in b) a.style[f] = g[f];
                return e;
            });
        var Ma = /alpha\([^)]*\)/i,
            Na = /opacity\s*=\s*([^)]*)/,
            Oa = /^(none|table(?!-c[ea]).+)/,
            Pa = new RegExp("^(" + S + ")(.*)$", "i"),
            Qa = new RegExp("^([+-])=(" + S + ")", "i"),
            Ra = { position: "absolute", visibility: "hidden", display: "block" },
            Sa = { letterSpacing: "0", fontWeight: "400" },
            Ta = ["Webkit", "O", "Moz", "ms"];
        m.extend({
            cssHooks: {
                opacity: {
                    get: function (a, b) {
                        if (b) {
                            var c = Ja(a, "opacity");
                            return "" === c ? "1" : c;
                        }
                    },
                },
            },
            cssNumber: { columnCount: !0, fillOpacity: !0, flexGrow: !0, flexShrink: !0, fontWeight: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, widows: !0, zIndex: !0, zoom: !0 },
            cssProps: { float: k.cssFloat ? "cssFloat" : "styleFloat" },
            style: function (a, b, c, d) {
                if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
                    var e,
                        f,
                        g,
                        h = m.camelCase(b),
                        i = a.style;
                    if (((b = m.cssProps[h] || (m.cssProps[h] = Ua(i, h))), (g = m.cssHooks[b] || m.cssHooks[h]), void 0 === c)) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b];
                    if (
                        ((f = typeof c),
                        "string" === f && (e = Qa.exec(c)) && ((c = (e[1] + 1) * e[2] + parseFloat(m.css(a, b))), (f = "number")),
                        null != c && c === c && ("number" !== f || m.cssNumber[h] || (c += "px"), k.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), !(g && "set" in g && void 0 === (c = g.set(a, c, d)))))
                    )
                        try {
                            i[b] = c;
                        } catch (j) {}
                }
            },
            css: function (a, b, c, d) {
                var e,
                    f,
                    g,
                    h = m.camelCase(b);
                return (
                    (b = m.cssProps[h] || (m.cssProps[h] = Ua(a.style, h))),
                    (g = m.cssHooks[b] || m.cssHooks[h]),
                    g && "get" in g && (f = g.get(a, !0, c)),
                    void 0 === f && (f = Ja(a, b, d)),
                    "normal" === f && b in Sa && (f = Sa[b]),
                    "" === c || c ? ((e = parseFloat(f)), c === !0 || m.isNumeric(e) ? e || 0 : f) : f
                );
            },
        }),
            m.each(["height", "width"], function (a, b) {
                m.cssHooks[b] = {
                    get: function (a, c, d) {
                        return c
                            ? Oa.test(m.css(a, "display")) && 0 === a.offsetWidth
                                ? m.swap(a, Ra, function () {
                                      return Ya(a, b, d);
                                  })
                                : Ya(a, b, d)
                            : void 0;
                    },
                    set: function (a, c, d) {
                        var e = d && Ia(a);
                        return Wa(a, c, d ? Xa(a, b, d, k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, e), e) : 0);
                    },
                };
            }),
            k.opacity ||
                (m.cssHooks.opacity = {
                    get: function (a, b) {
                        return Na.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? 0.01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
                    },
                    set: function (a, b) {
                        var c = a.style,
                            d = a.currentStyle,
                            e = m.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "",
                            f = (d && d.filter) || c.filter || "";
                        (c.zoom = 1),
                            ((b >= 1 || "" === b) && "" === m.trim(f.replace(Ma, "")) && c.removeAttribute && (c.removeAttribute("filter"), "" === b || (d && !d.filter))) || (c.filter = Ma.test(f) ? f.replace(Ma, e) : f + " " + e);
                    },
                }),
            (m.cssHooks.marginRight = La(k.reliableMarginRight, function (a, b) {
                return b ? m.swap(a, { display: "inline-block" }, Ja, [a, "marginRight"]) : void 0;
            })),
            m.each({ margin: "", padding: "", border: "Width" }, function (a, b) {
                (m.cssHooks[a + b] = {
                    expand: function (c) {
                        for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; 4 > d; d++) e[a + T[d] + b] = f[d] || f[d - 2] || f[0];
                        return e;
                    },
                }),
                    Ga.test(a) || (m.cssHooks[a + b].set = Wa);
            }),
            m.fn.extend({
                css: function (a, b) {
                    return V(
                        this,
                        function (a, b, c) {
                            var d,
                                e,
                                f = {},
                                g = 0;
                            if (m.isArray(b)) {
                                for (d = Ia(a), e = b.length; e > g; g++) f[b[g]] = m.css(a, b[g], !1, d);
                                return f;
                            }
                            return void 0 !== c ? m.style(a, b, c) : m.css(a, b);
                        },
                        a,
                        b,
                        arguments.length > 1
                    );
                },
                show: function () {
                    return Va(this, !0);
                },
                hide: function () {
                    return Va(this);
                },
                toggle: function (a) {
                    return "boolean" == typeof a
                        ? a
                            ? this.show()
                            : this.hide()
                        : this.each(function () {
                              U(this) ? m(this).show() : m(this).hide();
                          });
                },
            }),
            (m.Tween = Za),
            (Za.prototype = {
                constructor: Za,
                init: function (a, b, c, d, e, f) {
                    (this.elem = a), (this.prop = c), (this.easing = e || "swing"), (this.options = b), (this.start = this.now = this.cur()), (this.end = d), (this.unit = f || (m.cssNumber[c] ? "" : "px"));
                },
                cur: function () {
                    var a = Za.propHooks[this.prop];
                    return a && a.get ? a.get(this) : Za.propHooks._default.get(this);
                },
                run: function (a) {
                    var b,
                        c = Za.propHooks[this.prop];
                    return (
                        this.options.duration ? (this.pos = b = m.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration)) : (this.pos = b = a),
                        (this.now = (this.end - this.start) * b + this.start),
                        this.options.step && this.options.step.call(this.elem, this.now, this),
                        c && c.set ? c.set(this) : Za.propHooks._default.set(this),
                        this
                    );
                },
            }),
            (Za.prototype.init.prototype = Za.prototype),
            (Za.propHooks = {
                _default: {
                    get: function (a) {
                        var b;
                        return null == a.elem[a.prop] || (a.elem.style && null != a.elem.style[a.prop]) ? ((b = m.css(a.elem, a.prop, "")), b && "auto" !== b ? b : 0) : a.elem[a.prop];
                    },
                    set: function (a) {
                        m.fx.step[a.prop] ? m.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[m.cssProps[a.prop]] || m.cssHooks[a.prop]) ? m.style(a.elem, a.prop, a.now + a.unit) : (a.elem[a.prop] = a.now);
                    },
                },
            }),
            (Za.propHooks.scrollTop = Za.propHooks.scrollLeft = {
                set: function (a) {
                    a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
                },
            }),
            (m.easing = {
                linear: function (a) {
                    return a;
                },
                swing: function (a) {
                    return 0.5 - Math.cos(a * Math.PI) / 2;
                },
            }),
            (m.fx = Za.prototype.init),
            (m.fx.step = {});
        var $a,
            _a,
            ab = /^(?:toggle|show|hide)$/,
            bb = new RegExp("^(?:([+-])=|)(" + S + ")([a-z%]*)$", "i"),
            cb = /queueHooks$/,
            db = [ib],
            eb = {
                "*": [
                    function (a, b) {
                        var c = this.createTween(a, b),
                            d = c.cur(),
                            e = bb.exec(b),
                            f = (e && e[3]) || (m.cssNumber[a] ? "" : "px"),
                            g = (m.cssNumber[a] || ("px" !== f && +d)) && bb.exec(m.css(c.elem, a)),
                            h = 1,
                            i = 20;
                        if (g && g[3] !== f) {
                            (f = f || g[3]), (e = e || []), (g = +d || 1);
                            do (h = h || ".5"), (g /= h), m.style(c.elem, a, g + f);
                            while (h !== (h = c.cur() / d) && 1 !== h && --i);
                        }
                        return e && ((g = c.start = +g || +d || 0), (c.unit = f), (c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2])), c;
                    },
                ],
            };
        (m.Animation = m.extend(kb, {
            tweener: function (a, b) {
                m.isFunction(a) ? ((b = a), (a = ["*"])) : (a = a.split(" "));
                for (var c, d = 0, e = a.length; e > d; d++) (c = a[d]), (eb[c] = eb[c] || []), eb[c].unshift(b);
            },
            prefilter: function (a, b) {
                b ? db.unshift(a) : db.push(a);
            },
        })),
            (m.speed = function (a, b, c) {
                var d = a && "object" == typeof a ? m.extend({}, a) : { complete: c || (!c && b) || (m.isFunction(a) && a), duration: a, easing: (c && b) || (b && !m.isFunction(b) && b) };
                return (
                    (d.duration = m.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in m.fx.speeds ? m.fx.speeds[d.duration] : m.fx.speeds._default),
                    (null == d.queue || d.queue === !0) && (d.queue = "fx"),
                    (d.old = d.complete),
                    (d.complete = function () {
                        m.isFunction(d.old) && d.old.call(this), d.queue && m.dequeue(this, d.queue);
                    }),
                    d
                );
            }),
            m.fn.extend({
                fadeTo: function (a, b, c, d) {
                    return this.filter(U).css("opacity", 0).show().end().animate({ opacity: b }, a, c, d);
                },
                animate: function (a, b, c, d) {
                    var e = m.isEmptyObject(a),
                        f = m.speed(b, c, d),
                        g = function () {
                            var b = kb(this, m.extend({}, a), f);
                            (e || m._data(this, "finish")) && b.stop(!0);
                        };
                    return (g.finish = g), e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
                },
                stop: function (a, b, c) {
                    var d = function (a) {
                        var b = a.stop;
                        delete a.stop, b(c);
                    };
                    return (
                        "string" != typeof a && ((c = b), (b = a), (a = void 0)),
                        b && a !== !1 && this.queue(a || "fx", []),
                        this.each(function () {
                            var b = !0,
                                e = null != a && a + "queueHooks",
                                f = m.timers,
                                g = m._data(this);
                            if (e) g[e] && g[e].stop && d(g[e]);
                            else for (e in g) g[e] && g[e].stop && cb.test(e) && d(g[e]);
                            for (e = f.length; e--; ) f[e].elem !== this || (null != a && f[e].queue !== a) || (f[e].anim.stop(c), (b = !1), f.splice(e, 1));
                            (b || !c) && m.dequeue(this, a);
                        })
                    );
                },
                finish: function (a) {
                    return (
                        a !== !1 && (a = a || "fx"),
                        this.each(function () {
                            var b,
                                c = m._data(this),
                                d = c[a + "queue"],
                                e = c[a + "queueHooks"],
                                f = m.timers,
                                g = d ? d.length : 0;
                            for (c.finish = !0, m.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--; ) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));
                            for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);
                            delete c.finish;
                        })
                    );
                },
            }),
            m.each(["toggle", "show", "hide"], function (a, b) {
                var c = m.fn[b];
                m.fn[b] = function (a, d, e) {
                    return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(gb(b, !0), a, d, e);
                };
            }),
            m.each({ slideDown: gb("show"), slideUp: gb("hide"), slideToggle: gb("toggle"), fadeIn: { opacity: "show" }, fadeOut: { opacity: "hide" }, fadeToggle: { opacity: "toggle" } }, function (a, b) {
                m.fn[a] = function (a, c, d) {
                    return this.animate(b, a, c, d);
                };
            }),
            (m.timers = []),
            (m.fx.tick = function () {
                var a,
                    b = m.timers,
                    c = 0;
                for ($a = m.now(); c < b.length; c++) (a = b[c]), a() || b[c] !== a || b.splice(c--, 1);
                b.length || m.fx.stop(), ($a = void 0);
            }),
            (m.fx.timer = function (a) {
                m.timers.push(a), a() ? m.fx.start() : m.timers.pop();
            }),
            (m.fx.interval = 13),
            (m.fx.start = function () {
                _a || (_a = setInterval(m.fx.tick, m.fx.interval));
            }),
            (m.fx.stop = function () {
                clearInterval(_a), (_a = null);
            }),
            (m.fx.speeds = { slow: 600, fast: 200, _default: 400 }),
            (m.fn.delay = function (a, b) {
                return (
                    (a = m.fx ? m.fx.speeds[a] || a : a),
                    (b = b || "fx"),
                    this.queue(b, function (b, c) {
                        var d = setTimeout(b, a);
                        c.stop = function () {
                            clearTimeout(d);
                        };
                    })
                );
            }),
            (function () {
                var a, b, c, d, e;
                (b = y.createElement("div")),
                    b.setAttribute("className", "t"),
                    (b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>"),
                    (d = b.getElementsByTagName("a")[0]),
                    (c = y.createElement("select")),
                    (e = c.appendChild(y.createElement("option"))),
                    (a = b.getElementsByTagName("input")[0]),
                    (d.style.cssText = "top:1px"),
                    (k.getSetAttribute = "t" !== b.className),
                    (k.style = /top/.test(d.getAttribute("style"))),
                    (k.hrefNormalized = "/a" === d.getAttribute("href")),
                    (k.checkOn = !!a.value),
                    (k.optSelected = e.selected),
                    (k.enctype = !!y.createElement("form").enctype),
                    (c.disabled = !0),
                    (k.optDisabled = !e.disabled),
                    (a = y.createElement("input")),
                    a.setAttribute("value", ""),
                    (k.input = "" === a.getAttribute("value")),
                    (a.value = "t"),
                    a.setAttribute("type", "radio"),
                    (k.radioValue = "t" === a.value);
            })();
        var lb = /\r/g;
        m.fn.extend({
            val: function (a) {
                var b,
                    c,
                    d,
                    e = this[0];
                return arguments.length
                    ? ((d = m.isFunction(a)),
                      this.each(function (c) {
                          var e;
                          1 === this.nodeType &&
                              ((e = d ? a.call(this, c, m(this).val()) : a),
                              null == e
                                  ? (e = "")
                                  : "number" == typeof e
                                  ? (e += "")
                                  : m.isArray(e) &&
                                    (e = m.map(e, function (a) {
                                        return null == a ? "" : a + "";
                                    })),
                              (b = m.valHooks[this.type] || m.valHooks[this.nodeName.toLowerCase()]),
                              (b && "set" in b && void 0 !== b.set(this, e, "value")) || (this.value = e));
                      }))
                    : e
                    ? ((b = m.valHooks[e.type] || m.valHooks[e.nodeName.toLowerCase()]), b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : ((c = e.value), "string" == typeof c ? c.replace(lb, "") : null == c ? "" : c))
                    : void 0;
            },
        }),
            m.extend({
                valHooks: {
                    option: {
                        get: function (a) {
                            var b = m.find.attr(a, "value");
                            return null != b ? b : m.trim(m.text(a));
                        },
                    },
                    select: {
                        get: function (a) {
                            for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++)
                                if (((c = d[i]), !((!c.selected && i !== e) || (k.optDisabled ? c.disabled : null !== c.getAttribute("disabled")) || (c.parentNode.disabled && m.nodeName(c.parentNode, "optgroup"))))) {
                                    if (((b = m(c).val()), f)) return b;
                                    g.push(b);
                                }
                            return g;
                        },
                        set: function (a, b) {
                            for (var c, d, e = a.options, f = m.makeArray(b), g = e.length; g--; )
                                if (((d = e[g]), m.inArray(m.valHooks.option.get(d), f) >= 0))
                                    try {
                                        d.selected = c = !0;
                                    } catch (h) {
                                        d.scrollHeight;
                                    }
                                else d.selected = !1;
                            return c || (a.selectedIndex = -1), e;
                        },
                    },
                },
            }),
            m.each(["radio", "checkbox"], function () {
                (m.valHooks[this] = {
                    set: function (a, b) {
                        return m.isArray(b) ? (a.checked = m.inArray(m(a).val(), b) >= 0) : void 0;
                    },
                }),
                    k.checkOn ||
                        (m.valHooks[this].get = function (a) {
                            return null === a.getAttribute("value") ? "on" : a.value;
                        });
            });
        var mb,
            nb,
            ob = m.expr.attrHandle,
            pb = /^(?:checked|selected)$/i,
            qb = k.getSetAttribute,
            rb = k.input;
        m.fn.extend({
            attr: function (a, b) {
                return V(this, m.attr, a, b, arguments.length > 1);
            },
            removeAttr: function (a) {
                return this.each(function () {
                    m.removeAttr(this, a);
                });
            },
        }),
            m.extend({
                attr: function (a, b, c) {
                    var d,
                        e,
                        f = a.nodeType;
                    return a && 3 !== f && 8 !== f && 2 !== f
                        ? typeof a.getAttribute === K
                            ? m.prop(a, b, c)
                            : ((1 === f && m.isXMLDoc(a)) || ((b = b.toLowerCase()), (d = m.attrHooks[b] || (m.expr.match.bool.test(b) ? nb : mb))),
                              void 0 === c
                                  ? d && "get" in d && null !== (e = d.get(a, b))
                                      ? e
                                      : ((e = m.find.attr(a, b)), null == e ? void 0 : e)
                                  : null !== c
                                  ? d && "set" in d && void 0 !== (e = d.set(a, c, b))
                                      ? e
                                      : (a.setAttribute(b, c + ""), c)
                                  : void m.removeAttr(a, b))
                        : void 0;
                },
                removeAttr: function (a, b) {
                    var c,
                        d,
                        e = 0,
                        f = b && b.match(E);
                    if (f && 1 === a.nodeType)
                        for (; (c = f[e++]); ) (d = m.propFix[c] || c), m.expr.match.bool.test(c) ? ((rb && qb) || !pb.test(c) ? (a[d] = !1) : (a[m.camelCase("default-" + c)] = a[d] = !1)) : m.attr(a, c, ""), a.removeAttribute(qb ? c : d);
                },
                attrHooks: {
                    type: {
                        set: function (a, b) {
                            if (!k.radioValue && "radio" === b && m.nodeName(a, "input")) {
                                var c = a.value;
                                return a.setAttribute("type", b), c && (a.value = c), b;
                            }
                        },
                    },
                },
            }),
            (nb = {
                set: function (a, b, c) {
                    return b === !1 ? m.removeAttr(a, c) : (rb && qb) || !pb.test(c) ? a.setAttribute((!qb && m.propFix[c]) || c, c) : (a[m.camelCase("default-" + c)] = a[c] = !0), c;
                },
            }),
            m.each(m.expr.match.bool.source.match(/\w+/g), function (a, b) {
                var c = ob[b] || m.find.attr;
                ob[b] =
                    (rb && qb) || !pb.test(b)
                        ? function (a, b, d) {
                              var e, f;
                              return d || ((f = ob[b]), (ob[b] = e), (e = null != c(a, b, d) ? b.toLowerCase() : null), (ob[b] = f)), e;
                          }
                        : function (a, b, c) {
                              return c ? void 0 : a[m.camelCase("default-" + b)] ? b.toLowerCase() : null;
                          };
            }),
            (rb && qb) ||
                (m.attrHooks.value = {
                    set: function (a, b, c) {
                        return m.nodeName(a, "input") ? void (a.defaultValue = b) : mb && mb.set(a, b, c);
                    },
                }),
            qb ||
                ((mb = {
                    set: function (a, b, c) {
                        var d = a.getAttributeNode(c);
                        return d || a.setAttributeNode((d = a.ownerDocument.createAttribute(c))), (d.value = b += ""), "value" === c || b === a.getAttribute(c) ? b : void 0;
                    },
                }),
                (ob.id = ob.name = ob.coords = function (a, b, c) {
                    var d;
                    return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null;
                }),
                (m.valHooks.button = {
                    get: function (a, b) {
                        var c = a.getAttributeNode(b);
                        return c && c.specified ? c.value : void 0;
                    },
                    set: mb.set,
                }),
                (m.attrHooks.contenteditable = {
                    set: function (a, b, c) {
                        mb.set(a, "" === b ? !1 : b, c);
                    },
                }),
                m.each(["width", "height"], function (a, b) {
                    m.attrHooks[b] = {
                        set: function (a, c) {
                            return "" === c ? (a.setAttribute(b, "auto"), c) : void 0;
                        },
                    };
                })),
            k.style ||
                (m.attrHooks.style = {
                    get: function (a) {
                        return a.style.cssText || void 0;
                    },
                    set: function (a, b) {
                        return (a.style.cssText = b + "");
                    },
                });
        var sb = /^(?:input|select|textarea|button|object)$/i,
            tb = /^(?:a|area)$/i;
        m.fn.extend({
            prop: function (a, b) {
                return V(this, m.prop, a, b, arguments.length > 1);
            },
            removeProp: function (a) {
                return (
                    (a = m.propFix[a] || a),
                    this.each(function () {
                        try {
                            (this[a] = void 0), delete this[a];
                        } catch (b) {}
                    })
                );
            },
        }),
            m.extend({
                propFix: { for: "htmlFor", class: "className" },
                prop: function (a, b, c) {
                    var d,
                        e,
                        f,
                        g = a.nodeType;
                    return a && 3 !== g && 8 !== g && 2 !== g
                        ? ((f = 1 !== g || !m.isXMLDoc(a)),
                          f && ((b = m.propFix[b] || b), (e = m.propHooks[b])),
                          void 0 !== c ? (e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : (a[b] = c)) : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b])
                        : void 0;
                },
                propHooks: {
                    tabIndex: {
                        get: function (a) {
                            var b = m.find.attr(a, "tabindex");
                            return b ? parseInt(b, 10) : sb.test(a.nodeName) || (tb.test(a.nodeName) && a.href) ? 0 : -1;
                        },
                    },
                },
            }),
            k.hrefNormalized ||
                m.each(["href", "src"], function (a, b) {
                    m.propHooks[b] = {
                        get: function (a) {
                            return a.getAttribute(b, 4);
                        },
                    };
                }),
            k.optSelected ||
                (m.propHooks.selected = {
                    get: function (a) {
                        var b = a.parentNode;
                        return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
                    },
                }),
            m.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
                m.propFix[this.toLowerCase()] = this;
            }),
            k.enctype || (m.propFix.enctype = "encoding");
        var ub = /[\t\r\n\f]/g;
        m.fn.extend({
            addClass: function (a) {
                var b,
                    c,
                    d,
                    e,
                    f,
                    g,
                    h = 0,
                    i = this.length,
                    j = "string" == typeof a && a;
                if (m.isFunction(a))
                    return this.each(function (b) {
                        m(this).addClass(a.call(this, b, this.className));
                    });
                if (j)
                    for (b = (a || "").match(E) || []; i > h; h++)
                        if (((c = this[h]), (d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(ub, " ") : " ")))) {
                            for (f = 0; (e = b[f++]); ) d.indexOf(" " + e + " ") < 0 && (d += e + " ");
                            (g = m.trim(d)), c.className !== g && (c.className = g);
                        }
                return this;
            },
            removeClass: function (a) {
                var b,
                    c,
                    d,
                    e,
                    f,
                    g,
                    h = 0,
                    i = this.length,
                    j = 0 === arguments.length || ("string" == typeof a && a);
                if (m.isFunction(a))
                    return this.each(function (b) {
                        m(this).removeClass(a.call(this, b, this.className));
                    });
                if (j)
                    for (b = (a || "").match(E) || []; i > h; h++)
                        if (((c = this[h]), (d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(ub, " ") : "")))) {
                            for (f = 0; (e = b[f++]); ) for (; d.indexOf(" " + e + " ") >= 0; ) d = d.replace(" " + e + " ", " ");
                            (g = a ? m.trim(d) : ""), c.className !== g && (c.className = g);
                        }
                return this;
            },
            toggleClass: function (a, b) {
                var c = typeof a;
                return "boolean" == typeof b && "string" === c
                    ? b
                        ? this.addClass(a)
                        : this.removeClass(a)
                    : this.each(
                          m.isFunction(a)
                              ? function (c) {
                                    m(this).toggleClass(a.call(this, c, this.className, b), b);
                                }
                              : function () {
                                    if ("string" === c) for (var b, d = 0, e = m(this), f = a.match(E) || []; (b = f[d++]); ) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
                                    else (c === K || "boolean" === c) && (this.className && m._data(this, "__className__", this.className), (this.className = this.className || a === !1 ? "" : m._data(this, "__className__") || ""));
                                }
                      );
            },
            hasClass: function (a) {
                for (var b = " " + a + " ", c = 0, d = this.length; d > c; c++) if (1 === this[c].nodeType && (" " + this[c].className + " ").replace(ub, " ").indexOf(b) >= 0) return !0;
                return !1;
            },
        }),
            m.each(
                "blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),
                function (a, b) {
                    m.fn[b] = function (a, c) {
                        return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
                    };
                }
            ),
            m.fn.extend({
                hover: function (a, b) {
                    return this.mouseenter(a).mouseleave(b || a);
                },
                bind: function (a, b, c) {
                    return this.on(a, null, b, c);
                },
                unbind: function (a, b) {
                    return this.off(a, null, b);
                },
                delegate: function (a, b, c, d) {
                    return this.on(b, a, c, d);
                },
                undelegate: function (a, b, c) {
                    return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
                },
            });
        var vb = m.now(),
            wb = /\?/,
            xb = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;
        (m.parseJSON = function (b) {
            if (a.JSON && a.JSON.parse) return a.JSON.parse(b + "");
            var c,
                d = null,
                e = m.trim(b + "");
            return e &&
                !m.trim(
                    e.replace(xb, function (a, b, e, f) {
                        return c && b && (d = 0), 0 === d ? a : ((c = e || b), (d += !f - !e), "");
                    })
                )
                ? Function("return " + e)()
                : m.error("Invalid JSON: " + b);
        }),
            (m.parseXML = function (b) {
                var c, d;
                if (!b || "string" != typeof b) return null;
                try {
                    a.DOMParser ? ((d = new DOMParser()), (c = d.parseFromString(b, "text/xml"))) : ((c = new ActiveXObject("Microsoft.XMLDOM")), (c.async = "false"), c.loadXML(b));
                } catch (e) {
                    c = void 0;
                }
                return (c && c.documentElement && !c.getElementsByTagName("parsererror").length) || m.error("Invalid XML: " + b), c;
            });
        var yb,
            zb,
            Ab = /#.*$/,
            Bb = /([?&])_=[^&]*/,
            Cb = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
            Db = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
            Eb = /^(?:GET|HEAD)$/,
            Fb = /^\/\//,
            Gb = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
            Hb = {},
            Ib = {},
            Jb = "*/".concat("*");
        try {
            zb = location.href;
        } catch (Kb) {
            (zb = y.createElement("a")), (zb.href = ""), (zb = zb.href);
        }
        (yb = Gb.exec(zb.toLowerCase()) || []),
            m.extend({
                active: 0,
                lastModified: {},
                etag: {},
                ajaxSettings: {
                    url: zb,
                    type: "GET",
                    isLocal: Db.test(yb[1]),
                    global: !0,
                    processData: !0,
                    async: !0,
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    accepts: { "*": Jb, text: "text/plain", html: "text/html", xml: "application/xml, text/xml", json: "application/json, text/javascript" },
                    contents: { xml: /xml/, html: /html/, json: /json/ },
                    responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" },
                    converters: { "* text": String, "text html": !0, "text json": m.parseJSON, "text xml": m.parseXML },
                    flatOptions: { url: !0, context: !0 },
                },
                ajaxSetup: function (a, b) {
                    return b ? Nb(Nb(a, m.ajaxSettings), b) : Nb(m.ajaxSettings, a);
                },
                ajaxPrefilter: Lb(Hb),
                ajaxTransport: Lb(Ib),
                ajax: function (a, b) {
                    function x(a, b, c, d) {
                        var j,
                            r,
                            s,
                            u,
                            w,
                            x = b;
                        2 !== t &&
                            ((t = 2),
                            g && clearTimeout(g),
                            (i = void 0),
                            (f = d || ""),
                            (v.readyState = a > 0 ? 4 : 0),
                            (j = (a >= 200 && 300 > a) || 304 === a),
                            c && (u = Ob(k, v, c)),
                            (u = Pb(k, u, v, j)),
                            j
                                ? (k.ifModified && ((w = v.getResponseHeader("Last-Modified")), w && (m.lastModified[e] = w), (w = v.getResponseHeader("etag")), w && (m.etag[e] = w)),
                                  204 === a || "HEAD" === k.type ? (x = "nocontent") : 304 === a ? (x = "notmodified") : ((x = u.state), (r = u.data), (s = u.error), (j = !s)))
                                : ((s = x), (a || !x) && ((x = "error"), 0 > a && (a = 0))),
                            (v.status = a),
                            (v.statusText = (b || x) + ""),
                            j ? o.resolveWith(l, [r, x, v]) : o.rejectWith(l, [v, x, s]),
                            v.statusCode(q),
                            (q = void 0),
                            h && n.trigger(j ? "ajaxSuccess" : "ajaxError", [v, k, j ? r : s]),
                            p.fireWith(l, [v, x]),
                            h && (n.trigger("ajaxComplete", [v, k]), --m.active || m.event.trigger("ajaxStop")));
                    }
                    "object" == typeof a && ((b = a), (a = void 0)), (b = b || {});
                    var c,
                        d,
                        e,
                        f,
                        g,
                        h,
                        i,
                        j,
                        k = m.ajaxSetup({}, b),
                        l = k.context || k,
                        n = k.context && (l.nodeType || l.jquery) ? m(l) : m.event,
                        o = m.Deferred(),
                        p = m.Callbacks("once memory"),
                        q = k.statusCode || {},
                        r = {},
                        s = {},
                        t = 0,
                        u = "canceled",
                        v = {
                            readyState: 0,
                            getResponseHeader: function (a) {
                                var b;
                                if (2 === t) {
                                    if (!j) for (j = {}; (b = Cb.exec(f)); ) j[b[1].toLowerCase()] = b[2];
                                    b = j[a.toLowerCase()];
                                }
                                return null == b ? null : b;
                            },
                            getAllResponseHeaders: function () {
                                return 2 === t ? f : null;
                            },
                            setRequestHeader: function (a, b) {
                                var c = a.toLowerCase();
                                return t || ((a = s[c] = s[c] || a), (r[a] = b)), this;
                            },
                            overrideMimeType: function (a) {
                                return t || (k.mimeType = a), this;
                            },
                            statusCode: function (a) {
                                var b;
                                if (a)
                                    if (2 > t) for (b in a) q[b] = [q[b], a[b]];
                                    else v.always(a[v.status]);
                                return this;
                            },
                            abort: function (a) {
                                var b = a || u;
                                return i && i.abort(b), x(0, b), this;
                            },
                        };
                    if (
                        ((o.promise(v).complete = p.add),
                        (v.success = v.done),
                        (v.error = v.fail),
                        (k.url = ((a || k.url || zb) + "").replace(Ab, "").replace(Fb, yb[1] + "//")),
                        (k.type = b.method || b.type || k.method || k.type),
                        (k.dataTypes = m
                            .trim(k.dataType || "*")
                            .toLowerCase()
                            .match(E) || [""]),
                        null == k.crossDomain &&
                            ((c = Gb.exec(k.url.toLowerCase())), (k.crossDomain = !(!c || (c[1] === yb[1] && c[2] === yb[2] && (c[3] || ("http:" === c[1] ? "80" : "443")) === (yb[3] || ("http:" === yb[1] ? "80" : "443")))))),
                        k.data && k.processData && "string" != typeof k.data && (k.data = m.param(k.data, k.traditional)),
                        Mb(Hb, k, b, v),
                        2 === t)
                    )
                        return v;
                    (h = m.event && k.global),
                        h && 0 === m.active++ && m.event.trigger("ajaxStart"),
                        (k.type = k.type.toUpperCase()),
                        (k.hasContent = !Eb.test(k.type)),
                        (e = k.url),
                        k.hasContent || (k.data && ((e = k.url += (wb.test(e) ? "&" : "?") + k.data), delete k.data), k.cache === !1 && (k.url = Bb.test(e) ? e.replace(Bb, "$1_=" + vb++) : e + (wb.test(e) ? "&" : "?") + "_=" + vb++)),
                        k.ifModified && (m.lastModified[e] && v.setRequestHeader("If-Modified-Since", m.lastModified[e]), m.etag[e] && v.setRequestHeader("If-None-Match", m.etag[e])),
                        ((k.data && k.hasContent && k.contentType !== !1) || b.contentType) && v.setRequestHeader("Content-Type", k.contentType),
                        v.setRequestHeader("Accept", k.dataTypes[0] && k.accepts[k.dataTypes[0]] ? k.accepts[k.dataTypes[0]] + ("*" !== k.dataTypes[0] ? ", " + Jb + "; q=0.01" : "") : k.accepts["*"]);
                    for (d in k.headers) v.setRequestHeader(d, k.headers[d]);
                    if (k.beforeSend && (k.beforeSend.call(l, v, k) === !1 || 2 === t)) return v.abort();
                    u = "abort";
                    for (d in { success: 1, error: 1, complete: 1 }) v[d](k[d]);
                    if ((i = Mb(Ib, k, b, v))) {
                        (v.readyState = 1),
                            h && n.trigger("ajaxSend", [v, k]),
                            k.async &&
                                k.timeout > 0 &&
                                (g = setTimeout(function () {
                                    v.abort("timeout");
                                }, k.timeout));
                        try {
                            (t = 1), i.send(r, x);
                        } catch (w) {
                            if (!(2 > t)) throw w;
                            x(-1, w);
                        }
                    } else x(-1, "No Transport");
                    return v;
                },
                getJSON: function (a, b, c) {
                    return m.get(a, b, c, "json");
                },
                getScript: function (a, b) {
                    return m.get(a, void 0, b, "script");
                },
            }),
            m.each(["get", "post"], function (a, b) {
                m[b] = function (a, c, d, e) {
                    return m.isFunction(c) && ((e = e || d), (d = c), (c = void 0)), m.ajax({ url: a, type: b, dataType: e, data: c, success: d });
                };
            }),
            (m._evalUrl = function (a) {
                return m.ajax({ url: a, type: "GET", dataType: "script", async: !1, global: !1, throws: !0 });
            }),
            m.fn.extend({
                wrapAll: function (a) {
                    if (m.isFunction(a))
                        return this.each(function (b) {
                            m(this).wrapAll(a.call(this, b));
                        });
                    if (this[0]) {
                        var b = m(a, this[0].ownerDocument).eq(0).clone(!0);
                        this[0].parentNode && b.insertBefore(this[0]),
                            b
                                .map(function () {
                                    for (var a = this; a.firstChild && 1 === a.firstChild.nodeType; ) a = a.firstChild;
                                    return a;
                                })
                                .append(this);
                    }
                    return this;
                },
                wrapInner: function (a) {
                    return this.each(
                        m.isFunction(a)
                            ? function (b) {
                                  m(this).wrapInner(a.call(this, b));
                              }
                            : function () {
                                  var b = m(this),
                                      c = b.contents();
                                  c.length ? c.wrapAll(a) : b.append(a);
                              }
                    );
                },
                wrap: function (a) {
                    var b = m.isFunction(a);
                    return this.each(function (c) {
                        m(this).wrapAll(b ? a.call(this, c) : a);
                    });
                },
                unwrap: function () {
                    return this.parent()
                        .each(function () {
                            m.nodeName(this, "body") || m(this).replaceWith(this.childNodes);
                        })
                        .end();
                },
            }),
            (m.expr.filters.hidden = function (a) {
                return (a.offsetWidth <= 0 && a.offsetHeight <= 0) || (!k.reliableHiddenOffsets() && "none" === ((a.style && a.style.display) || m.css(a, "display")));
            }),
            (m.expr.filters.visible = function (a) {
                return !m.expr.filters.hidden(a);
            });
        var Qb = /%20/g,
            Rb = /\[\]$/,
            Sb = /\r?\n/g,
            Tb = /^(?:submit|button|image|reset|file)$/i,
            Ub = /^(?:input|select|textarea|keygen)/i;
        (m.param = function (a, b) {
            var c,
                d = [],
                e = function (a, b) {
                    (b = m.isFunction(b) ? b() : null == b ? "" : b), (d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b));
                };
            if ((void 0 === b && (b = m.ajaxSettings && m.ajaxSettings.traditional), m.isArray(a) || (a.jquery && !m.isPlainObject(a))))
                m.each(a, function () {
                    e(this.name, this.value);
                });
            else for (c in a) Vb(c, a[c], b, e);
            return d.join("&").replace(Qb, "+");
        }),
            m.fn.extend({
                serialize: function () {
                    return m.param(this.serializeArray());
                },
                serializeArray: function () {
                    return this.map(function () {
                        var a = m.prop(this, "elements");
                        return a ? m.makeArray(a) : this;
                    })
                        .filter(function () {
                            var a = this.type;
                            return this.name && !m(this).is(":disabled") && Ub.test(this.nodeName) && !Tb.test(a) && (this.checked || !W.test(a));
                        })
                        .map(function (a, b) {
                            var c = m(this).val();
                            return null == c
                                ? null
                                : m.isArray(c)
                                ? m.map(c, function (a) {
                                      return { name: b.name, value: a.replace(Sb, "\r\n") };
                                  })
                                : { name: b.name, value: c.replace(Sb, "\r\n") };
                        })
                        .get();
                },
            }),
            (m.ajaxSettings.xhr =
                void 0 !== a.ActiveXObject
                    ? function () {
                          return (!this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && Zb()) || $b();
                      }
                    : Zb);
        var Wb = 0,
            Xb = {},
            Yb = m.ajaxSettings.xhr();
        a.attachEvent &&
            a.attachEvent("onunload", function () {
                for (var a in Xb) Xb[a](void 0, !0);
            }),
            (k.cors = !!Yb && "withCredentials" in Yb),
            (Yb = k.ajax = !!Yb),
            Yb &&
                m.ajaxTransport(function (a) {
                    if (!a.crossDomain || k.cors) {
                        var b;
                        return {
                            send: function (c, d) {
                                var e,
                                    f = a.xhr(),
                                    g = ++Wb;
                                if ((f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields)) for (e in a.xhrFields) f[e] = a.xhrFields[e];
                                a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType), a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest");
                                for (e in c) void 0 !== c[e] && f.setRequestHeader(e, c[e] + "");
                                f.send((a.hasContent && a.data) || null),
                                    (b = function (c, e) {
                                        var h, i, j;
                                        if (b && (e || 4 === f.readyState))
                                            if ((delete Xb[g], (b = void 0), (f.onreadystatechange = m.noop), e)) 4 !== f.readyState && f.abort();
                                            else {
                                                (j = {}), (h = f.status), "string" == typeof f.responseText && (j.text = f.responseText);
                                                try {
                                                    i = f.statusText;
                                                } catch (k) {
                                                    i = "";
                                                }
                                                h || !a.isLocal || a.crossDomain ? 1223 === h && (h = 204) : (h = j.text ? 200 : 404);
                                            }
                                        j && d(h, i, j, f.getAllResponseHeaders());
                                    }),
                                    a.async ? (4 === f.readyState ? setTimeout(b) : (f.onreadystatechange = Xb[g] = b)) : b();
                            },
                            abort: function () {
                                b && b(void 0, !0);
                            },
                        };
                    }
                }),
            m.ajaxSetup({
                accepts: { script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" },
                contents: { script: /(?:java|ecma)script/ },
                converters: {
                    "text script": function (a) {
                        return m.globalEval(a), a;
                    },
                },
            }),
            m.ajaxPrefilter("script", function (a) {
                void 0 === a.cache && (a.cache = !1), a.crossDomain && ((a.type = "GET"), (a.global = !1));
            }),
            m.ajaxTransport("script", function (a) {
                if (a.crossDomain) {
                    var b,
                        c = y.head || m("head")[0] || y.documentElement;
                    return {
                        send: function (d, e) {
                            (b = y.createElement("script")),
                                (b.async = !0),
                                a.scriptCharset && (b.charset = a.scriptCharset),
                                (b.src = a.url),
                                (b.onload = b.onreadystatechange = function (a, c) {
                                    (c || !b.readyState || /loaded|complete/.test(b.readyState)) && ((b.onload = b.onreadystatechange = null), b.parentNode && b.parentNode.removeChild(b), (b = null), c || e(200, "success"));
                                }),
                                c.insertBefore(b, c.firstChild);
                        },
                        abort: function () {
                            b && b.onload(void 0, !0);
                        },
                    };
                }
            });
        var _b = [],
            ac = /(=)\?(?=&|$)|\?\?/;
        m.ajaxSetup({
            jsonp: "callback",
            jsonpCallback: function () {
                var a = _b.pop() || m.expando + "_" + vb++;
                return (this[a] = !0), a;
            },
        }),
            m.ajaxPrefilter("json jsonp", function (b, c, d) {
                var e,
                    f,
                    g,
                    h = b.jsonp !== !1 && (ac.test(b.url) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf("application/x-www-form-urlencoded") && ac.test(b.data) && "data");
                return h || "jsonp" === b.dataTypes[0]
                    ? ((e = b.jsonpCallback = m.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback),
                      h ? (b[h] = b[h].replace(ac, "$1" + e)) : b.jsonp !== !1 && (b.url += (wb.test(b.url) ? "&" : "?") + b.jsonp + "=" + e),
                      (b.converters["script json"] = function () {
                          return g || m.error(e + " was not called"), g[0];
                      }),
                      (b.dataTypes[0] = "json"),
                      (f = a[e]),
                      (a[e] = function () {
                          g = arguments;
                      }),
                      d.always(function () {
                          (a[e] = f), b[e] && ((b.jsonpCallback = c.jsonpCallback), _b.push(e)), g && m.isFunction(f) && f(g[0]), (g = f = void 0);
                      }),
                      "script")
                    : void 0;
            }),
            (m.parseHTML = function (a, b, c) {
                if (!a || "string" != typeof a) return null;
                "boolean" == typeof b && ((c = b), (b = !1)), (b = b || y);
                var d = u.exec(a),
                    e = !c && [];
                return d ? [b.createElement(d[1])] : ((d = m.buildFragment([a], b, e)), e && e.length && m(e).remove(), m.merge([], d.childNodes));
            });
        var bc = m.fn.load;
        (m.fn.load = function (a, b, c) {
            if ("string" != typeof a && bc) return bc.apply(this, arguments);
            var d,
                e,
                f,
                g = this,
                h = a.indexOf(" ");
            return (
                h >= 0 && ((d = m.trim(a.slice(h, a.length))), (a = a.slice(0, h))),
                m.isFunction(b) ? ((c = b), (b = void 0)) : b && "object" == typeof b && (f = "POST"),
                g.length > 0 &&
                    m
                        .ajax({ url: a, type: f, dataType: "html", data: b })
                        .done(function (a) {
                            (e = arguments), g.html(d ? m("<div>").append(m.parseHTML(a)).find(d) : a);
                        })
                        .complete(
                            c &&
                                function (a, b) {
                                    g.each(c, e || [a.responseText, b, a]);
                                }
                        ),
                this
            );
        }),
            m.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (a, b) {
                m.fn[b] = function (a) {
                    return this.on(b, a);
                };
            }),
            (m.expr.filters.animated = function (a) {
                return m.grep(m.timers, function (b) {
                    return a === b.elem;
                }).length;
            });
        var cc = a.document.documentElement;
        (m.offset = {
            setOffset: function (a, b, c) {
                var d,
                    e,
                    f,
                    g,
                    h,
                    i,
                    j,
                    k = m.css(a, "position"),
                    l = m(a),
                    n = {};
                "static" === k && (a.style.position = "relative"),
                    (h = l.offset()),
                    (f = m.css(a, "top")),
                    (i = m.css(a, "left")),
                    (j = ("absolute" === k || "fixed" === k) && m.inArray("auto", [f, i]) > -1),
                    j ? ((d = l.position()), (g = d.top), (e = d.left)) : ((g = parseFloat(f) || 0), (e = parseFloat(i) || 0)),
                    m.isFunction(b) && (b = b.call(a, c, h)),
                    null != b.top && (n.top = b.top - h.top + g),
                    null != b.left && (n.left = b.left - h.left + e),
                    "using" in b ? b.using.call(a, n) : l.css(n);
            },
        }),
            m.fn.extend({
                offset: function (a) {
                    if (arguments.length)
                        return void 0 === a
                            ? this
                            : this.each(function (b) {
                                  m.offset.setOffset(this, a, b);
                              });
                    var b,
                        c,
                        d = { top: 0, left: 0 },
                        e = this[0],
                        f = e && e.ownerDocument;
                    return f
                        ? ((b = f.documentElement),
                          m.contains(b, e)
                              ? (typeof e.getBoundingClientRect !== K && (d = e.getBoundingClientRect()),
                                (c = dc(f)),
                                { top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0), left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0) })
                              : d)
                        : void 0;
                },
                position: function () {
                    if (this[0]) {
                        var a,
                            b,
                            c = { top: 0, left: 0 },
                            d = this[0];
                        return (
                            "fixed" === m.css(d, "position")
                                ? (b = d.getBoundingClientRect())
                                : ((a = this.offsetParent()), (b = this.offset()), m.nodeName(a[0], "html") || (c = a.offset()), (c.top += m.css(a[0], "borderTopWidth", !0)), (c.left += m.css(a[0], "borderLeftWidth", !0))),
                            { top: b.top - c.top - m.css(d, "marginTop", !0), left: b.left - c.left - m.css(d, "marginLeft", !0) }
                        );
                    }
                },
                offsetParent: function () {
                    return this.map(function () {
                        for (var a = this.offsetParent || cc; a && !m.nodeName(a, "html") && "static" === m.css(a, "position"); ) a = a.offsetParent;
                        return a || cc;
                    });
                },
            }),
            m.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (a, b) {
                var c = /Y/.test(b);
                m.fn[a] = function (d) {
                    return V(
                        this,
                        function (a, d, e) {
                            var f = dc(a);
                            return void 0 === e ? (f ? (b in f ? f[b] : f.document.documentElement[d]) : a[d]) : void (f ? f.scrollTo(c ? m(f).scrollLeft() : e, c ? e : m(f).scrollTop()) : (a[d] = e));
                        },
                        a,
                        d,
                        arguments.length,
                        null
                    );
                };
            }),
            m.each(["top", "left"], function (a, b) {
                m.cssHooks[b] = La(k.pixelPosition, function (a, c) {
                    return c ? ((c = Ja(a, b)), Ha.test(c) ? m(a).position()[b] + "px" : c) : void 0;
                });
            }),
            m.each({ Height: "height", Width: "width" }, function (a, b) {
                m.each({ padding: "inner" + a, content: b, "": "outer" + a }, function (c, d) {
                    m.fn[d] = function (d, e) {
                        var f = arguments.length && (c || "boolean" != typeof d),
                            g = c || (d === !0 || e === !0 ? "margin" : "border");
                        return V(
                            this,
                            function (b, c, d) {
                                var e;
                                return m.isWindow(b)
                                    ? b.document.documentElement["client" + a]
                                    : 9 === b.nodeType
                                    ? ((e = b.documentElement), Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a]))
                                    : void 0 === d
                                    ? m.css(b, c, g)
                                    : m.style(b, c, d, g);
                            },
                            b,
                            f ? d : void 0,
                            f,
                            null
                        );
                    };
                });
            }),
            (m.fn.size = function () {
                return this.length;
            }),
            (m.fn.andSelf = m.fn.addBack),
            "function" == typeof define &&
                define.amd &&
                define("jquery", [], function () {
                    return m;
                });
        var ec = a.jQuery,
            fc = a.$;
        return (
            (m.noConflict = function (b) {
                return a.$ === m && (a.$ = fc), b && a.jQuery === m && (a.jQuery = ec), m;
            }),
            typeof b === K && (a.jQuery = a.$ = m),
            m
        );
    }),
    (function (i, s, o, g, r, a, m) {
        (i.GoogleAnalyticsObject = r),
            (i[r] =
                i[r] ||
                function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }),
            (i[r].l = 1 * new Date()),
            (a = s.createElement(o)),
            (m = s.getElementsByTagName(o)[0]),
            (a.async = 1),
            (a.src = g),
            m.parentNode.insertBefore(a, m);
    })(window, document, "script", "//www.google-analytics.com/analytics.js", "ga"),
    ga("create", "UA-70371380-1", "auto"),
    ga("send", "pageview"),
    (function (e) {
        "function" == typeof define && define.amd ? define(["jquery"], e) : e(jQuery);
    })(function (e) {
        "use strict";
        var t = {},
            n = Math.max,
            r = Math.min;
        (t.c = {}),
            (t.c.d = e(document)),
            (t.c.t = function (e) {
                return e.originalEvent.touches.length - 1;
            }),
            (t.o = function () {
                var n = this;
                (this.o = null),
                    (this.$ = null),
                    (this.i = null),
                    (this.g = null),
                    (this.v = null),
                    (this.cv = null),
                    (this.x = 0),
                    (this.y = 0),
                    (this.w = 0),
                    (this.h = 0),
                    (this.$c = null),
                    (this.c = null),
                    (this.t = 0),
                    (this.isInit = !1),
                    (this.fgColor = null),
                    (this.pColor = null),
                    (this.dH = null),
                    (this.cH = null),
                    (this.eH = null),
                    (this.rH = null),
                    (this.scale = 1),
                    (this.relative = !1),
                    (this.relativeWidth = !1),
                    (this.relativeHeight = !1),
                    (this.$div = null),
                    (this.run = function () {
                        var t = function (e, t) {
                            var r;
                            for (r in t) n.o[r] = t[r];
                            n._carve().init(), n._configure()._draw();
                        };
                        if (!this.$.data("kontroled")) {
                            if (
                                (this.$.data("kontroled", !0),
                                this.extend(),
                                (this.o = e.extend(
                                    {
                                        min: void 0 !== this.$.data("min") ? this.$.data("min") : 0,
                                        max: void 0 !== this.$.data("max") ? this.$.data("max") : 100,
                                        stopper: !0,
                                        readOnly: this.$.data("readonly") || "readonly" === this.$.attr("readonly"),
                                        cursor: (this.$.data("cursor") === !0 && 30) || this.$.data("cursor") || 0,
                                        thickness: (this.$.data("thickness") && Math.max(Math.min(this.$.data("thickness"), 1), 0.01)) || 0.35,
                                        lineCap: this.$.data("linecap") || "butt",
                                        width: this.$.data("width") || 200,
                                        height: this.$.data("height") || 200,
                                        displayInput: null == this.$.data("displayinput") || this.$.data("displayinput"),
                                        displayPrevious: this.$.data("displayprevious"),
                                        fgColor: this.$.data("fgcolor") || "#87CEEB",
                                        inputColor: this.$.data("inputcolor"),
                                        font: this.$.data("font") || "Arial",
                                        fontWeight: this.$.data("font-weight") || "bold",
                                        inline: !1,
                                        step: this.$.data("step") || 1,
                                        rotation: this.$.data("rotation"),
                                        draw: null,
                                        change: null,
                                        cancel: null,
                                        release: null,
                                        format: function (e) {
                                            return e;
                                        },
                                        parse: function (e) {
                                            return parseFloat(e);
                                        },
                                    },
                                    this.o
                                )),
                                (this.o.flip = "anticlockwise" === this.o.rotation || "acw" === this.o.rotation),
                                this.o.inputColor || (this.o.inputColor = this.o.fgColor),
                                this.$.is("fieldset")
                                    ? ((this.v = {}),
                                      (this.i = this.$.find("input")),
                                      this.i.each(function (t) {
                                          var r = e(this);
                                          (n.i[t] = r),
                                              (n.v[t] = n.o.parse(r.val())),
                                              r.bind("change blur", function () {
                                                  var e = {};
                                                  (e[t] = r.val()), n.val(n._validate(e));
                                              });
                                      }),
                                      this.$.find("legend").remove())
                                    : ((this.i = this.$),
                                      (this.v = this.o.parse(this.$.val())),
                                      "" === this.v && (this.v = this.o.min),
                                      this.$.bind("change blur", function () {
                                          n.val(n._validate(n.o.parse(n.$.val())));
                                      })),
                                !this.o.displayInput && this.$.hide(),
                                (this.$c = e(document.createElement("canvas")).attr({ width: this.o.width, height: this.o.height })),
                                (this.$div = e('<div style="' + (this.o.inline ? "display:inline;z-index:1;" : "") + "width:" + this.o.width + "px;height:" + this.o.height + 'px;"></div>')),
                                this.$.wrap(this.$div).before(this.$c),
                                (this.$div = this.$.parent()),
                                "undefined" != typeof G_vmlCanvasManager && G_vmlCanvasManager.initElement(this.$c[0]),
                                (this.c = this.$c[0].getContext ? this.$c[0].getContext("2d") : null),
                                !this.c)
                            )
                                throw {
                                    name: "CanvasNotSupportedException",
                                    message: "Canvas not supported. Please use excanvas on IE8.0.",
                                    toString: function () {
                                        return this.name + ": " + this.message;
                                    },
                                };
                            return (
                                (this.scale =
                                    (window.devicePixelRatio || 1) /
                                    (this.c.webkitBackingStorePixelRatio || this.c.mozBackingStorePixelRatio || this.c.msBackingStorePixelRatio || this.c.oBackingStorePixelRatio || this.c.backingStorePixelRatio || 1)),
                                (this.relativeWidth = this.o.width % 1 !== 0 && this.o.width.indexOf("%")),
                                (this.relativeHeight = this.o.height % 1 !== 0 && this.o.height.indexOf("%")),
                                (this.relative = this.relativeWidth || this.relativeHeight),
                                this._carve(),
                                this.v instanceof Object ? ((this.cv = {}), this.copy(this.v, this.cv)) : (this.cv = this.v),
                                this.$.bind("configure", t).parent().bind("configure", t),
                                this._listen()._configure()._xy().init(),
                                (this.isInit = !0),
                                this.$.val(this.o.format(this.v)),
                                this._draw(),
                                this
                            );
                        }
                    }),
                    (this._carve = function () {
                        if (this.relative) {
                            var e = this.relativeWidth ? (this.$div.parent().width() * parseInt(this.o.width)) / 100 : this.$div.parent().width(),
                                t = this.relativeHeight ? (this.$div.parent().height() * parseInt(this.o.height)) / 100 : this.$div.parent().height();
                            this.w = this.h = Math.min(e, t);
                        } else (this.w = this.o.width), (this.h = this.o.height);
                        return (
                            this.$div.css({ width: this.w + "px", height: this.h + "px" }),
                            this.$c.attr({ width: this.w, height: this.h }),
                            1 !== this.scale && ((this.$c[0].width = this.$c[0].width * this.scale), (this.$c[0].height = this.$c[0].height * this.scale), this.$c.width(this.w), this.$c.height(this.h)),
                            this
                        );
                    }),
                    (this._draw = function () {
                        var e = !0;
                        (n.g = n.c), n.clear(), n.dH && (e = n.dH()), e !== !1 && n.draw();
                    }),
                    (this._touch = function (e) {
                        var r = function (e) {
                            var t = n.xy2val(e.originalEvent.touches[n.t].pageX, e.originalEvent.touches[n.t].pageY);
                            t != n.cv && ((n.cH && n.cH(t) === !1) || (n.change(n._validate(t)), n._draw()));
                        };
                        return (
                            (this.t = t.c.t(e)),
                            r(e),
                            t.c.d.bind("touchmove.k", r).bind("touchend.k", function () {
                                t.c.d.unbind("touchmove.k touchend.k"), n.val(n.cv);
                            }),
                            this
                        );
                    }),
                    (this._mouse = function (e) {
                        var r = function (e) {
                            var t = n.xy2val(e.pageX, e.pageY);
                            t != n.cv && ((n.cH && n.cH(t) === !1) || (n.change(n._validate(t)), n._draw()));
                        };
                        return (
                            r(e),
                            t.c.d
                                .bind("mousemove.k", r)
                                .bind("keyup.k", function (e) {
                                    if (27 === e.keyCode) {
                                        if ((t.c.d.unbind("mouseup.k mousemove.k keyup.k"), n.eH && n.eH() === !1)) return;
                                        n.cancel();
                                    }
                                })
                                .bind("mouseup.k", function (e) {
                                    t.c.d.unbind("mousemove.k mouseup.k keyup.k"), n.val(n.cv);
                                }),
                            this
                        );
                    }),
                    (this._xy = function () {
                        var e = this.$c.offset();
                        return (this.x = e.left), (this.y = e.top), this;
                    }),
                    (this._listen = function () {
                        return (
                            this.o.readOnly
                                ? this.$.attr("readonly", "readonly")
                                : (this.$c
                                      .bind("mousedown", function (e) {
                                          e.preventDefault(), n._xy()._mouse(e);
                                      })
                                      .bind("touchstart", function (e) {
                                          e.preventDefault(), n._xy()._touch(e);
                                      }),
                                  this.listen()),
                            this.relative &&
                                e(window).resize(function () {
                                    n._carve().init(), n._draw();
                                }),
                            this
                        );
                    }),
                    (this._configure = function () {
                        return (
                            this.o.draw && (this.dH = this.o.draw),
                            this.o.change && (this.cH = this.o.change),
                            this.o.cancel && (this.eH = this.o.cancel),
                            this.o.release && (this.rH = this.o.release),
                            this.o.displayPrevious ? ((this.pColor = this.h2rgba(this.o.fgColor, "0.4")), (this.fgColor = this.h2rgba(this.o.fgColor, "0.6"))) : (this.fgColor = this.o.fgColor),
                            this
                        );
                    }),
                    (this._clear = function () {
                        this.$c[0].width = this.$c[0].width;
                    }),
                    (this._validate = function (e) {
                        var t = ~~((0 > e ? -0.5 : 0.5) + e / this.o.step) * this.o.step;
                        return Math.round(100 * t) / 100;
                    }),
                    (this.listen = function () {}),
                    (this.extend = function () {}),
                    (this.init = function () {}),
                    (this.change = function (e) {}),
                    (this.val = function (e) {}),
                    (this.xy2val = function (e, t) {}),
                    (this.draw = function () {}),
                    (this.clear = function () {
                        this._clear();
                    }),
                    (this.h2rgba = function (e, t) {
                        var n;
                        return (e = e.substring(1, 7)), (n = [parseInt(e.substring(0, 2), 16), parseInt(e.substring(2, 4), 16), parseInt(e.substring(4, 6), 16)]), "rgba(" + n[0] + "," + n[1] + "," + n[2] + "," + t + ")";
                    }),
                    (this.copy = function (e, t) {
                        for (var n in e) t[n] = e[n];
                    });
            }),
            (t.Dial = function () {
                t.o.call(this),
                    (this.startAngle = null),
                    (this.xy = null),
                    (this.radius = null),
                    (this.lineWidth = null),
                    (this.cursorExt = null),
                    (this.w2 = null),
                    (this.PI2 = 2 * Math.PI),
                    (this.extend = function () {
                        this.o = e.extend({ bgColor: this.$.data("bgcolor") || "#EEEEEE", angleOffset: this.$.data("angleoffset") || 0, angleArc: this.$.data("anglearc") || 360, inline: !0 }, this.o);
                    }),
                    (this.val = function (e, t) {
                        return null == e
                            ? this.v
                            : ((e = this.o.parse(e)),
                              void ((t !== !1 && e != this.v && this.rH && this.rH(e) === !1) || ((this.cv = this.o.stopper ? n(r(e, this.o.max), this.o.min) : e), (this.v = this.cv), this.$.val(this.o.format(this.v)), this._draw())));
                    }),
                    (this.xy2val = function (e, t) {
                        var i, s;
                        return (
                            (i = Math.atan2(e - (this.x + this.w2), -(t - this.y - this.w2)) - this.angleOffset),
                            this.o.flip && (i = this.angleArc - i - this.PI2),
                            this.angleArc != this.PI2 && 0 > i && i > -0.5 ? (i = 0) : 0 > i && (i += this.PI2),
                            (s = (i * (this.o.max - this.o.min)) / this.angleArc + this.o.min),
                            this.o.stopper && (s = n(r(s, this.o.max), this.o.min)),
                            s
                        );
                    }),
                    (this.listen = function () {
                        var i,
                            s,
                            u,
                            a,
                            t = this,
                            o = function (e) {
                                e.preventDefault();
                                var o = e.originalEvent,
                                    u = o.detail || o.wheelDeltaX,
                                    a = o.detail || o.wheelDeltaY,
                                    f = t._validate(t.o.parse(t.$.val())) + (u > 0 || a > 0 ? t.o.step : 0 > u || 0 > a ? -t.o.step : 0);
                                (f = n(r(f, t.o.max), t.o.min)),
                                    t.val(f, !1),
                                    t.rH &&
                                        (clearTimeout(i),
                                        (i = setTimeout(function () {
                                            t.rH(f), (i = null);
                                        }, 100)),
                                        s ||
                                            (s = setTimeout(function () {
                                                i && t.rH(f), (s = null);
                                            }, 200)));
                            },
                            f = 1,
                            l = { 37: -t.o.step, 38: t.o.step, 39: t.o.step, 40: -t.o.step };
                        this.$.bind("keydown", function (i) {
                            var s = i.keyCode;
                            if (
                                (s >= 96 && 105 >= s && (s = i.keyCode = s - 48),
                                (u = parseInt(String.fromCharCode(s))),
                                isNaN(u) && (13 !== s && 8 !== s && 9 !== s && 189 !== s && (190 !== s || t.$.val().match(/\./)) && i.preventDefault(), e.inArray(s, [37, 38, 39, 40]) > -1))
                            ) {
                                i.preventDefault();
                                var o = t.o.parse(t.$.val()) + l[s] * f;
                                t.o.stopper && (o = n(r(o, t.o.max), t.o.min)),
                                    t.change(t._validate(o)),
                                    t._draw(),
                                    (a = window.setTimeout(function () {
                                        f *= 2;
                                    }, 30));
                            }
                        }).bind("keyup", function (e) {
                            isNaN(u) ? a && (window.clearTimeout(a), (a = null), (f = 1), t.val(t.$.val())) : (t.$.val() > t.o.max && t.$.val(t.o.max)) || (t.$.val() < t.o.min && t.$.val(t.o.min));
                        }),
                            this.$c.bind("mousewheel DOMMouseScroll", o),
                            this.$.bind("mousewheel DOMMouseScroll", o);
                    }),
                    (this.init = function () {
                        (this.v < this.o.min || this.v > this.o.max) && (this.v = this.o.min),
                            this.$.val(this.v),
                            (this.w2 = this.w / 2),
                            (this.cursorExt = this.o.cursor / 100),
                            (this.xy = this.w2 * this.scale),
                            (this.lineWidth = this.xy * this.o.thickness),
                            (this.lineCap = this.o.lineCap),
                            (this.radius = this.xy - this.lineWidth / 2),
                            this.o.angleOffset && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset),
                            this.o.angleArc && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc),
                            (this.angleOffset = (this.o.angleOffset * Math.PI) / 180),
                            (this.angleArc = (this.o.angleArc * Math.PI) / 180),
                            (this.startAngle = 1.5 * Math.PI + this.angleOffset),
                            (this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc);
                        var e = n(String(Math.abs(this.o.max)).length, String(Math.abs(this.o.min)).length, 2) + 2;
                        (this.o.displayInput &&
                            this.i.css({
                                width: ((this.w / 2 + 4) >> 0) + "px",
                                height: ((this.w / 3) >> 0) + "px",
                                position: "absolute",
                                "vertical-align": "middle",
                                "margin-top": ((this.w / 3) >> 0) + "px",
                                "margin-left": "-" + (((3 * this.w) / 4 + 2) >> 0) + "px",
                                border: 0,
                                background: "none",
                                font: this.o.fontWeight + " " + ((this.w / e) >> 0) + "px " + this.o.font,
                                "text-align": "center",
                                color: this.o.inputColor || this.o.fgColor,
                                padding: "0px",
                                "-webkit-appearance": "none",
                            })) ||
                            this.i.css({ width: "0px", visibility: "hidden" });
                    }),
                    (this.change = function (e) {
                        (this.cv = e), this.$.val(this.o.format(e));
                    }),
                    (this.angle = function (e) {
                        return ((e - this.o.min) * this.angleArc) / (this.o.max - this.o.min);
                    }),
                    (this.arc = function (e) {
                        var t, n;
                        return (
                            (e = this.angle(e)),
                            this.o.flip ? ((t = this.endAngle + 1e-5), (n = t - e - 1e-5)) : ((t = this.startAngle - 1e-5), (n = t + e + 1e-5)),
                            this.o.cursor && (t = n - this.cursorExt) && (n += this.cursorExt),
                            { s: t, e: n, d: this.o.flip && !this.o.cursor }
                        );
                    }),
                    (this.draw = function () {
                        var n,
                            e = this.g,
                            t = this.arc(this.cv),
                            r = 1;
                        (e.lineWidth = this.lineWidth),
                            (e.lineCap = this.lineCap),
                            "none" !== this.o.bgColor && (e.beginPath(), (e.strokeStyle = this.o.bgColor), e.arc(this.xy, this.xy, this.radius, this.endAngle - 1e-5, this.startAngle + 1e-5, !0), e.stroke()),
                            this.o.displayPrevious && ((n = this.arc(this.v)), e.beginPath(), (e.strokeStyle = this.pColor), e.arc(this.xy, this.xy, this.radius, n.s, n.e, n.d), e.stroke(), (r = this.cv == this.v)),
                            e.beginPath(),
                            (e.strokeStyle = r ? this.o.fgColor : this.fgColor),
                            e.arc(this.xy, this.xy, this.radius, t.s, t.e, t.d),
                            e.stroke();
                    }),
                    (this.cancel = function () {
                        this.val(this.v);
                    });
            }),
            (e.fn.dial = e.fn.knob = function (n) {
                return this.each(function () {
                    var r = new t.Dial();
                    (r.o = n), (r.$ = e(this)), r.run();
                }).parent();
            });
    });
var Jcmix = function () {
    (this.JCmix = $("#jcmix")),
        (this.DOMbody = $("body")),
        (this.DOMhead = $("head")),
        (this.DOMdocument = $(document)),
        this.playButton,
        this.startButton,
        this.recordButton,
        this.toggleRecordingsButton,
        this.clearRecordingsButton,
        this.recordinglist,
        this.channelStrip,
        this.timer,
        this.timerProgress,
        this.timerTotal,
        this.transport,
        this.timeline,
        this.progressbar,
        this.percentLoaded,
        this.loader,
        this.mixer,
        (this.meterHeight = 265),
        (this.meterWidth = 10),
        (this.stylesheetURL = "assets/css/jcmix.min.css"),
        (this.recording = !1),
        (this.allowRecord = !1),
        this.title,
        (this.rec = !1),
        (this.loop = 0),
        (this.currentLoopProgress = 0),
        (this.totalLength = 0),
        (this.timelineClickPaused = !1),
        (this.replay = !1),
        (this.replayFrom = !1),
        (this.fingerPosition = 0),
        (this.loading = !0),
        (this.ajaxURL = !1),
        (this.loading = 0),
        (this.playing = []),
        this.context,
        this.bufferLoader,
        (this.javascriptNode = []),
        (this.leftAnalysers = []),
        (this.rightAnalysers = []),
        (this.splitters = []),
        (this.gainNodes = []),
        (this.pannerNodes = []),
        (this.gainValues = []),
        (this.muted = []),
        (this.timelinedrag = !1),
        this.masterGainNodes,
        (this.urlList = []),
        (this.bufferList = []),
        (this.loadCount = 0),
        this.startedAt,
        (this.paused = !0),
        (this.audios = []),
        (this.buffer = []),
        (this.bouncerleft = []),
        (this.bouncerright = []);
};
(Jcmix.prototype = {
    init: function () {
        this.addStylesheet(), this.createLoader(), this.buildTracks(), this.bindMouseandTouch();
    },
    buildTracks: function () {
        var that = this,
            count = 0;
        this.JCmix.children(".track").each(function () {
            count++, that.urlList.push($(this).attr("data-url")), count == that.JCmix.children(".track").length && that.setupAudioContext();
        });
    },
    setupAudioContext: function () {
        if (((window.AudioContext = window.AudioContext || window.webkitAudioContext), window.AudioContext)) (this.context = new AudioContext()), this.load();
        else {
            var head = document.getElementsByTagName("head")[0],
                stylesheet = document.createElement("link");
            (stylesheet.rel = "stylesheet"), (stylesheet.type = "text/css"), (stylesheet.href = "https://fonts.googleapis.com/css?family=Open+Sans"), head.appendChild(stylesheet);
            var nosupport = document.createElement("div");
            (nosupport.id = "nosupport"),
                (nosupport.innerHTML =
                    "You are using a browser that does not support HTML5 Audio. <br><a href='https://www.google.com/chrome/' target='_blank'>Click here to download Google Chrome, and experience a better web.</a><br><br><a href='#' onclick='closeSupport()'>Close This Message</a>"),
                document.body.appendChild(nosupport);
        }
    },
    addStylesheet: function () {
        var stylesheet = document.createElement("link");
        (stylesheet.rel = "stylesheet"), (stylesheet.type = "text/css"), (stylesheet.href = "https://fonts.googleapis.com/css?family=Open+Sans"), this.DOMhead.append(stylesheet);
        var stylesheet = document.createElement("link");
        (stylesheet.rel = "stylesheet"), (stylesheet.type = "text/css"), (stylesheet.href = "https://fonts.googleapis.com/css?family=Share+Tech+Mono"), this.DOMhead.append(stylesheet);
    },
    createLoader: function () {
        var loader = '<div class="loader">';
        (loader += '<div class="loader-inner">'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += '<span></span>'),
            (loader += "</div>"),
            (loader += "<p><strong>0</strong>%</p>"),
            (loader += "</div>"),
            this.JCmix.append(loader),
            (this.percentLoaded = $(".loader p strong")),
            (this.loader = $(".loader"));
    },
    hideLoader: function () {
        var that = this;
        this.loader.fadeOut("slow", function () {
            that.resizeLabels(), that.mixer.fadeTo("slow", 1);
        });
    },
    resizeLabels: function () {
        var height = 0;
        $(".track-label").each(function () {
            $(this).height() > height && $(".track-label").css("height", $(this).height());
        });
    },
    resizePictures: function () {
        var height = 0;
        $(".track-picture").each(function () {
            $(this).height() > height && $(".track-picture").css("height", $(this).height());
        });
    },
    buildFrontEnd: function () {
        this.createMixer(), this.createTransport();
    },
    createTransport: function () {
        "true" == this.JCmix.attr("data-record") && (this.allowRecord = !0);
        var transport = '<div id="transport">';
        (transport += '<a type="button" id="play">'),
            (transport += '<a type="button" id="start">'),
            this.allowRecord && (transport += '<a type="button" id="record">'),
            (transport += "</div>"),
            this.mixer.append(transport),
            (this.transport = $("#transport")),
            (this.playButton = $("#play")),
            (this.startButton = $("#start"));
        var that = this;
        this.playButton.on("click", function (e) {
            e.preventDefault(), "pause" == this.dataset.state ? ((this.dataset.state = "play"), $(this).removeClass("active")) : ((this.dataset.state = "pause"), $(this).addClass("active")), that.togglePlay(this.dataset.state);
            $( ".roll-1" ).toggleClass( "rotate-center" );
        }),
            this.allowRecord &&
                (this.transport.addClass("recording"),
                this.mixer.append('<div id="recordListButtons"><a type="button" id="toggleRecordings" >Hide Recordings<a><a type="button" id="clearRecordings" >Clear Recordings<a></div>'),
                this.mixer.append('<ul id="recordinglist"></ul>'),
                (this.recordButton = $("#record")),
                (this.recordinglist = $("#recordinglist")),
                (this.toggleRecordingsButton = $("#toggleRecordings")),
                (this.clearRecordingsButton = $("#clearRecordings")),
                this.recordButton.on("click", function (e) {
                    return that.paused
                        ? (e.preventDefault(),
                          void ("record" == this.dataset.state ? ((this.dataset.state = "non"), $(this).removeClass("active"), (that.recording = !1)) : ((this.dataset.state = "record"), $(this).addClass("active"), (that.recording = !0))))
                        : !1;
                }),
                this.toggleRecordingsButton.on("click", function (e) {
                    "Hide Recordings" == $(this).html() ? ($(this).html("Show Recordings"), that.recordinglist.slideUp()) : ($(this).html("Hide Recordings"), that.recordinglist.slideDown());
                }),
                this.clearRecordingsButton.on("click", function (e) {
                    that.recordinglist.html("");
                })),
            this.startButton.on("click", function () {
                that.rewindToBeginning();
            });
    },
    createMixer: function () {
        this.title = this.JCmix.attr("data-title");
        var mixer = '<div id="mixer">';
        (mixer += "<div class='marquee'><div><span>" + this.title + "</span><span>" + this.title + "</span></div></div>"),
            (mixer += '<div id="channelstrip"> <div class="cool-heading"></div></div>'),
            (mixer += '<div class="paddingholder">'),
            (mixer += '<div id="timer">'),
            (mixer += '<span class="progress">00:00:000</span>'),
            (mixer += "<span> / </span> "),
            (mixer += '<span class="total"></span>'),
            (mixer += "</div>"),
            (mixer += "</div>"),
            (mixer += '<div class="timelineholder">'),
            (mixer += '<div id="timeline">'),
            (mixer += '<div id="progress" ></div>'),
            (mixer += "</div>"),
            (mixer += "</div>"),
            (mixer += "</div>"),
            this.JCmix.append(mixer),
            (this.mixer = $("#mixer")),
            (this.channelStrip = $("#channelstrip")),
            (this.timer = $("#timer")),
            (this.timerProgress = $("#timer .progress")),
            (this.timerTotal = $("#timer .total")),
            (this.timeline = $("#timeline")),
            (this.progressbar = $("#progress")),
            this.setTransportEventHandlers();
    },
    setTransportEventHandlers: function () {
        var that = this;
        this.DOMdocument.on(TouchMouseEvent.DOWN, function (e) {
            ("timeline" != e.target.id && "progress" != e.target.id) ||
                ((that.timelinedrag = !0),
                (that.fingerPosition = e.pageX - parseFloat(that.JCmix.offset().left)),
                $(this).on(TouchMouseEvent.MOVE, function (e) {
                    (that.fingerPosition = e.pageX - parseFloat(that.JCmix.offset().left)), that.timelineClick(that.fingerPosition, !1);
                }),
                that.DOMdocument.on(TouchMouseEvent.UP, function (e) {
                    $(this).unbind(TouchMouseEvent.MOVE),
                        $(this).unbind(TouchMouseEvent.UP),
                        (that.timelinedrag = !1),
                        null !== e.pageX && (distance = e.pageX - parseFloat(that.JCmix.offset().left)),
                        that.timelineClick(that.fingerPosition, !0);
                }));
        }),
            this.DOMbody.on("change", "input[type=range][data-slider]", function () {
                that.sliderChange($(this).attr("data-slider"), $(this).val());
            }),
            this.DOMbody.on("change", "input[data-mute]", function () {
                that.muteChange($(this).attr("data-mute"), $(this).is(":checked"));
            });
    },
    getHighestVolume: function (array) {
        return Math.max.apply(Math, array);
    },
    getAverageVolume: function (array) {
        for (var average, values = 0, length = array.length, i = 0; length > i; i++) values += array[i];
        return (average = values / length);
    },
    updateLoadingPercent: function () {
        var percent = (100 / this.urlList.length) * this.loadCount;
        this.percentLoaded.html(Math.round(percent));
    },
    loadBuffer: function (url, index) {
        var request = new XMLHttpRequest();
        request.open("GET", url, !0), (request.responseType = "arraybuffer");
        var loader = this;
        (request.onload = function () {
            loader.context.decodeAudioData(
                request.response,
                function (buffer) {
                    return buffer
                        ? ((loader.bufferList[index] = buffer), ++loader.loadCount == loader.urlList.length && loader.finishedLoading(loader.bufferList), void loader.updateLoadingPercent())
                        : void alert("error decoding file data: " + url);
                },
                function (error) {
                    console.error("decodeAudioData error", error);
                }
            );
        }),
            (request.onerror = function () {
                alert("Failed to load audio. Ensure that your audio files are hosted on the same server as your website, or that you allow cross origin resource sharing (CORS) if you are hosting them on a different server.");
            }),
            request.send();
    },
    load: function () {
        for (var i = 0; i < this.urlList.length; ++i) this.loadBuffer(this.urlList[i], i);
    },
    setDefaultValues: function () {
        var that = this,
            count = 0;
        this.JCmix.children(".track").each(function () {
            var mute = $(this).attr("data-start-muted");
            "true" == mute &&
                $("[data-mute=" + count + "]")
                    .prop("checked", !0)
                    .trigger("change");
            var initialVol = $(this).attr("data-initial-volume");
            $("[data-slider=" + count + "]")
                .val(initialVol)
                .trigger("change");
            var initialPan = $(this).attr("data-initial-pan");
            $("[data-panner=" + count + "]")
                .val(initialPan)
                .trigger("change");
            var picture = $(this).attr("data-picture");
            $("[data-picture=" + count + "]").html("<img src='../assets/pictures/" + picture + ".jpg' alt='" + picture + "'></img>");

            var label = $(this).attr("data-label");
            $("[data-label=" + count + "]").html(label), count++, count == that.JCmix.children(".track").length && that.deleteDefaultDivs(), $("[data-label=" + count + "]").html("Master");
        });
    },
    deleteDefaultDivs: function () {
        this.JCmix.children(".track").each(function () {
            $(this).remove();
        });
    },
    finishedLoading: function (bufferList) {
        this.buildFrontEnd(), (this.buffer = []);
        for (var i = 0; i < this.urlList.length; i++) this.buffer.push(bufferList[i]);
        this.createElements(), this.setDefaultValues(), this.setDuration(), this.hideLoader();
    },
    createMeter: function (i) {
        var analyser = this.context.createAnalyser();
        this.leftAnalysers.push(analyser), (this.leftAnalysers[i].smoothingTimeConstant = 0.3), (this.leftAnalysers[i].fftSize = 1024);
        var analyser2 = this.context.createAnalyser();
        this.rightAnalysers.push(analyser2), (this.rightAnalysers[i].smoothingTimeConstant = 0), (this.rightAnalysers[i].fftSize = 1024);
        var splitter = this.context.createChannelSplitter();
        this.splitters.push(splitter),
            i < this.pannerNodes.length - 1 ? this.pannerNodes[i].connect(this.splitters[i]) : this.gainNodes[i].connect(this.splitters[i]),
            this.splitters[i].connect(this.leftAnalysers[i], 0, 0),
            this.splitters[i].connect(this.rightAnalysers[i], 1, 0),
            this.leftAnalysers[i].connect(this.javascriptNode[i]),
            this.javascriptNode[i].connect(this.context.destination),
            i < this.pannerNodes.length - 1 ? this.pannerNodes[i].connect(this.gainNodes[this.gainNodes.length - 1]) : (this.gainNodes[i].connect(this.context.destination), (this.rec = new Recorder(this.gainNodes[i]))),
            this.drawCanvas(this.leftAnalysers[i], this.rightAnalysers[i], this, i);
    },
    sliderChange: function (audio_id, value) {
        this.muted[audio_id] || (this.gainNodes[audio_id].gain.value = value), (this.gainValues[audio_id] = value);
    },
    muteChange: function (audio_id, value) {
        value
            ? ((this.gainValues[audio_id] = this.gainNodes[audio_id].gain.value), (this.gainNodes[audio_id].gain.value = 0), (this.muted[audio_id] = !0))
            : ((this.muted[audio_id] = !1), (this.gainNodes[audio_id].gain.value = this.gainValues[audio_id]));
    },
    pad: function (str, max) {
        return (str = str.toString()), str.length < max ? this.pad("0" + str, max) : str;
    },
    formatTime: function (millis) {
        var mins = (Math.floor(millis / 36e5), Math.floor((millis % 36e5) / 6e4)),
            secs = Math.floor((millis % 6e4) / 1e3);
        mill = Math.floor(millis % 1e3);
        var returns = "<span>" + this.pad(mins, 2) + "</span>:<span>" + this.pad(secs, 2) + "</span>:<span>" + this.pad(mill, 2).substring(2, 0);
        return returns;
    },
    countLoops: function (current) {
        (this.loops = Math.floor(current / this.totalLength)), (this.currentLoopProgress = Date.now() - this.startedAt - this.loops * (1e3 * this.buffer[0].duration));
    },
    updateTimer: function () {
        var current = this.formatTime(this.currentLoopProgress),
            totalLength = this.formatTime(this.totalLength);
        this.timerProgress.html(current), this.timerTotal.html(totalLength), this.updateTimeline();
    },
    updateTimeline: function () {
        if (this.timelinedrag) return !1;
        var current = Date.now() - this.startedAt;
        this.countLoops(current);
        var percent = (100 / this.totalLength) * this.currentLoopProgress,
            left = (this.timeline.width() / 100) * percent;
        this.progressbar.css("left", left);
    },
    drawCanvas: function (leftAnalyser, rightAnalyser, ctx, i) {
        var canvas = $("#c" + i)
            .get()[0]
            .getContext("2d");
        ctx.bouncerleft.push({ average: 0, opacity: 1 }),
            ctx.bouncerright.push({ average: 0, opacity: 1 }),
            (gradient = canvas.createLinearGradient(0, 0, 0, 400)),
            gradient.addColorStop(1, "#24bf87"),
            gradient.addColorStop(0.75, "#24bf87"),
            gradient.addColorStop(0.25, "#24bf87"),
            gradient.addColorStop(0, "#fb5933"),
            (ctx.javascriptNode[i].onaudioprocess = function (event) {
                ctx.updateTimer();
                var array = new Uint8Array(leftAnalyser.frequencyBinCount);
                leftAnalyser.getByteFrequencyData(array);
                var average = ctx.getAverageVolume(array),
                    array2 = new Uint8Array(rightAnalyser.frequencyBinCount);
                rightAnalyser.getByteFrequencyData(array2);
                var average2 = ctx.getAverageVolume(array2);
                return (
                    average > ctx.bouncerleft[i].average
                        ? ((ctx.bouncerleft[i].average = average), (ctx.bouncerleft[i].opacity = 1))
                        : (ctx.bouncerleft[i].opacity > 0.1 ? (ctx.bouncerleft[i].opacity = ctx.bouncerleft[i].opacity - 0.1) : (ctx.bouncerleft[i].opacity = 0), ctx.bouncerleft[i].average--),
                    average2 > ctx.bouncerright[i].average
                        ? ((ctx.bouncerright[i].opacity = 1), (ctx.bouncerright[i].average = average2))
                        : (ctx.bouncerright[i].opacity > 0.1 ? (ctx.bouncerright[i].opacity = ctx.bouncerright[i].opacity - 0.1) : (ctx.bouncerright[i].opacity = 0), ctx.bouncerright[i].average--),
                    canvas.clearRect(0, 0, 60, ctx.meterHeight),
                    (canvas.fillStyle = "#15181b"),
                    canvas.fillRect(0, 0, ctx.meterWidth, ctx.meterHeight + 200),
                    canvas.fillRect(ctx.meterWidth + 5, 0, ctx.meterWidth, ctx.meterHeight + 200),
                    (canvas.fillStyle = gradient),
                    average > 0 && canvas.fillRect(0, ctx.meterHeight - ctx.bouncerleft[i].average * (ctx.meterHeight / 100) - 2, ctx.meterWidth, ctx.bouncerleft[i].opacity),
                    average2 > 0 && canvas.fillRect(ctx.meterWidth + 5, ctx.meterHeight - ctx.bouncerright[i].average * (ctx.meterHeight / 100) - 2, ctx.meterWidth, ctx.bouncerright[i].opacity),
                    canvas.fillRect(0, ctx.meterHeight - average * (ctx.meterHeight / 100), ctx.meterWidth, ctx.meterHeight + 200),
                    canvas.fillRect(ctx.meterWidth + 5, ctx.meterHeight - average2 * (ctx.meterHeight / 100), ctx.meterWidth, ctx.meterHeight + 200),
                    parseFloat(Date.now() - ctx.startedAt) + 50 >= parseFloat(ctx.totalLength) ? ($("#play").removeClass("active"), ctx.stop(), ctx.rewindToBeginning(), !1) : void 0
                );
            });
    },
    panChange: function (audio_id, value) {
        var xDeg = parseInt(value),
            zDeg = xDeg + 90;
        zDeg > 90 && (zDeg = 180 - zDeg);
        var x = Math.sin(xDeg * (Math.PI / 180)),
            z = Math.sin(zDeg * (Math.PI / 180));
        this.pannerNodes[audio_id].setPosition(x, 0, z);
    },
    createGainNode: function (i, master) {
        var gainnode = this.context.createGain(),
            pannernode = this.context.createPanner();
        (pannernode.panningModel = "equalpower"),
            this.gainValues.push(1),
            this.muted.push(!1),
            this.gainNodes.push(gainnode),
            this.pannerNodes.push(pannernode),
            master || (this.audios[i].connect(this.gainNodes[i]), this.gainNodes[i].connect(this.pannerNodes[i])),
            this.DOMbody.find("[data-panner=" + i + "]").trigger("change"),
            $("[data-slider=" + i + "]").trigger("change"),
            $("[data-picture=" + i + "]").trigger("change"),
            $("[data-mute=" + i + "]").trigger("change");
    },
    resetArrays: function () {
        (this.bouncerleft = []),
            (this.bouncerright = []),
            (this.leftAnalysers = []),
            (this.rightAnalysers = []),
            (this.splitters = []),
            (this.audios = []),
            (this.gainNodes = []),
            (this.pannerNodes = []),
            (this.gainValues = []),
            (this.javascriptNode = []),
            (this.muted = []),
            (this.loop = 0);
    },
    createElements: function () {
        this.resetArrays();
        for (var i = 0; i < this.urlList.length; i++) {
            var source1 = this.context.createBufferSource();
            (source1.buffer = this.buffer[i]),
                (source1.loop = !1),
                this.audios.push(source1),
                (this.audios[i].muted = !0),
                (javascriptNode = this.context.createScriptProcessor(2048, 1, 1)),
                this.createGainNode(i, !1),
                this.javascriptNode.push(javascriptNode);
            var channel = this.createChannel(i);
            this.createCanvas(i, channel);
            this.createSlider(i, channel), this.createMute(i, channel), this.createPanner(i, channel), this.createLabel(i, channel), this.createPicture(i, channel);
        }
        (javascriptNode = this.context.createScriptProcessor(2048, 1, 1)), this.createGainNode(i, !0), this.javascriptNode.push(javascriptNode);
        var channel = this.createChannel(i);
        this.createCanvas(i, channel);
        this.createSlider(i, channel), this.createMute(i, channel), this.createLabel(i, channel), this.createPicture(i, channel);
    },
    setDuration: function () {
        for (var i = 0; i < this.audios.length; i++) 1e3 * this.buffer[i].duration > this.totalLength && (this.totalLength = 1e3 * this.buffer[i].duration);
        this.updateTimer();
    },
    play: function () {
        (this.paused = !1), this.createElements(), (this.replay = !1), (this.playing = []);
        for (var i = 0; i < this.audios.length; i++)
            if ((this.createMeter(i), this.currentLoopProgress)) {
                this.startedAt = Date.now() - this.currentLoopProgress;
                var startFrom = this.currentLoopProgress / 1e3;
                this.buffer[i].duration > startFrom && (this.playing.push(i), this.audios[i].start(0, this.currentLoopProgress / 1e3));
            } else this.playing.push(i), (this.startedAt = Date.now()), this.audios[i].start(0);
        this.createMeter(i);
        var that = this;
        $(this.audios).each(function (index) {
            this.onended = function () {
                that.onended(index);
            };
        }),
            this.recording && this.startRecording();
    },
    startRecording: function () {
        this.rec.clear(), this.rec.record();
    },
    onended: function (index) {
        if (this.playing.indexOf(index) > -1) {
            this.javascriptNode[index].disconnect(),
                this.audios[index].disconnect(),
                this.gainNodes[index].disconnect(),
                this.pannerNodes[index].disconnect(),
                this.javascriptNode[index].disconnect(),
                this.leftAnalysers[index].disconnect(),
                this.rightAnalysers[index].disconnect(),
                this.splitters[index].disconnect();
            var number = this.playing.indexOf(index);
            this.playing.splice(number, 1), this.clearCanvas(index);
        }
        if (0 == this.playing.length && this.paused) {
            for (var i = 0; i < this.gainNodes.length; i++) this.gainNodes[i].disconnect(), this.pannerNodes[i].disconnect(), this.clearCanvas(i);
            for (var i = 0; i < this.javascriptNode.length; i++) this.javascriptNode[i].disconnect();
            for (var i = 0; i < this.leftAnalysers.length; i++) this.leftAnalysers[i].disconnect();
            for (var i = 0; i < this.rightAnalysers.length; i++) this.rightAnalysers[i].disconnect();
            for (var i = 0; i < this.splitters.length; i++) this.splitters[i].disconnect();
            if (this.replay) {
                var percent = (100 / this.totalLength) * this.replayFrom,
                    left = (this.timeline.width() / 100) * percent;
                this.progressbar.css("left", left), (this.currentLoopProgress = this.replayFrom), this.play();
            }
        }
        return !0;
    },
    clearCanvas: function (index) {
        var canvas = $("#c" + index)
            .get()[0]
            .getContext("2d");
        canvas.clearRect(0, 0, 60, 400), (canvas.fillStyle = "#15181b"), canvas.fillRect(0, 0, this.meterWidth, this.meterHeight + 200), canvas.fillRect(this.meterWidth + 5, 0, this.meterWidth, this.meterHeight + 200);
    },
    stop: function () {
        this.recording &&
            !this.paused &&
            (this.rec.stop(),
            this.toggleRecordingsButton.show(),
            this.clearRecordingsButton.show(),
            this.rec.exportWAV(function (blob) {
                var url = URL.createObjectURL(blob),
                    li = document.createElement("li"),
                    au = document.createElement("audio"),
                    hf = document.createElement("a"),
                    src = document.createElement("source");
                (au.controls = !0),
                    (src.src = url),
                    (src.type = "audio/wav"),
                    au.appendChild(src),
                    (hf.href = url),
                    (hf.download = that.title + " " + new Date().toISOString() + ".wav"),
                    (hf.innerHTML = hf.download),
                    li.appendChild(au),
                    li.appendChild(hf),
                    that.recordinglist.append(li);
            })),
            (this.paused = !0);
        for (var that = this, i = 0; i < this.audios.length; i++) this.playing.indexOf(i) > -1 && this.audios[i].stop(0), (this.currentLoopProgress = Date.now() - this.startedAt);
    },
    togglePlay: function (state) {
        "pause" == state ? this.play() : this.stop();
    },
    createChannel: function (i) {
        if (0 == $('div[data-channel="' + i + '"]').length) {
            var newdiv = document.createElement("div");
            (newdiv.dataset.channel = i), this.channelStrip.append(newdiv);
        }
        return $('div[data-channel="' + i + '"]');
    },
    createMute: function (i, channel) {
        if (0 == $('input[data-mute="' + i + '"]').length) {
            var mute = document.createElement("div");
            (mute.className = "mute-button"), (mute.innerHTML = "<label><input data-mute='" + i + "' type='checkbox' value='1' ><span></span></label>"), $(channel).append(mute);
        }
        return $('input[data-mute="' + i + '"]');
    },
    createPanner: function (i, channel) {
        var that = this;
        if (0 == $('input[data-panner="' + i + '"]').length) {
            var panner = document.createElement("div");
            (panner.className = "panner-range"),
                (panner.innerHTML = "<input data-panner='" + i + "' value='0' class='dial' type='text'>"),
                $(channel).append(panner),
                $("[data-panner='" + i + "']").knob({
                    min: -90,
                    max: 90,
                    width: 30,
                    height: 30,
                    fgColor: "#24bf87",
                    angleOffset: "-125",
                    bgColor: "#d8dbe3",
                    angleArc: "250",
                    skin: "tron",
                    thickness: "1",
                    displayPrevious: !0,
                    cursor: "30",
                    draw: function () {
                        that.panChange(i, this.v);
                    },
                });
        }
        return $('input[data-panner="' + i + '"]');
    },
    createLabel: function (i, channel) {
        if (0 == $('[data-label="' + i + '"]').length) {
            var label = document.createElement("div");
            (label.className = "track-label"), (label.innerHTML = "<label data-label='" + i + "'></label>"), $(channel).append(label);
        }
        return $('[data-label="' + i + '"]');
    },
    createPicture: function (i, channel) {
        // var picture = $('.track').data('picture');
        if (0 == $('[data-picture="' + i + '"]').length) {
            var picture = document.createElement("div");
            (picture.className = "track-picture"), (picture.innerHTML = "<figure data-picture='" + i + "'>"), $(channel).append(picture);
        }
        return $('[data-picture="' + i + '"]');
    },

    createSlider: function (i, channel) {
        if (0 == $('input[data-slider="' + i + '"]').length) {
            var slider = document.createElement("div");
            slider.className = "slider";
            var input = document.createElement("input");
            (input.type = "range"),
                (input.dataset.slider = i),
                (input.min = 0),
                (input.max = 1.5),
                (input.step = 0.01),
                input.addEventListener("input", function () {
                    this.setAttribute("value", this.value), $(this).trigger("change");
                }),
                $(slider).append(input),
                $(channel).append(slider);
        }
        return $('input[data-slider="' + i + '"]');
    },
    createCanvas: function (i, channel) {
        if (0 == $("#c" + i).length) {
            var mycanvas = document.createElement("canvas");
            (mycanvas.id = "c" + i), (mycanvas.className = "meter"), (mycanvas.width = 2 * this.meterWidth + 5), (mycanvas.height = this.meterHeight), channel.append(mycanvas);
            var canvas = $("#c" + i)
                .get()[0]
                .getContext("2d");
            (canvas.fillStyle = "#15181b"), canvas.fillRect(0, 0, this.meterWidth, this.meterHeight + 200), canvas.fillRect(this.meterWidth + 5, 0, this.meterWidth, this.meterHeight + 200);
        }
        return $("#c" + i)
            .get()[0]
            .getContext("2d");
    },
    rewindToBeginning: function () {
        this.paused && this.playButton.attr("data-state", "play"), this.progressbar.css("left", 0), (this.currentLoopProgress = 0), (this.replayFrom = 0), this.paused || ((this.replay = !0), (this.replayFrom = 0), this.stop());
    },
    timelineClick: function (position, audio) {
        var paused = this.paused,
            percent = (100 / this.timeline.width()) * position;
        if (1 > percent || percent > 99) return !1;
        var pausedAt = (this.totalLength / 100) * percent;
        this.currentLoopProgress = pausedAt;
        var percent = (100 / this.totalLength) * pausedAt,
            left = (this.timeline.width() / 100) * percent;
        this.progressbar.css("left", left);
        !paused && audio && ((this.replay = !0), (this.replayFrom = pausedAt), this.stop());
    },
    bindMouseandTouch: function () {
        TouchMouseEvent = { DOWN: "touchmousedown", UP: "touchmouseup", MOVE: "touchmousemove" };
        var onMouseEvent = function (event) {
                var type;
                switch (event.type) {
                    case "mousedown":
                        type = TouchMouseEvent.DOWN;
                        break;
                    case "mouseup":
                        type = TouchMouseEvent.UP;
                        break;
                    case "mousemove":
                        type = TouchMouseEvent.MOVE;
                        break;
                    default:
                        return;
                }
                var touchMouseEvent = normalizeEvent(type, event, event.pageX, event.pageY);
                $(event.target).trigger(touchMouseEvent);
            },
            onTouchEvent = function (event) {
                var type;
                switch (event.type) {
                    case "touchstart":
                        type = TouchMouseEvent.DOWN;
                        break;
                    case "touchend":
                        type = TouchMouseEvent.UP;
                        break;
                    case "touchmove":
                        type = TouchMouseEvent.MOVE;
                        break;
                    default:
                        return;
                }
                var touchMouseEvent,
                    touch = event.originalEvent.touches[0];
                (touchMouseEvent = type == TouchMouseEvent.UP ? normalizeEvent(type, event, null, null) : normalizeEvent(type, event, touch.pageX, touch.pageY)), $(event.target).trigger(touchMouseEvent);
            },
            normalizeEvent = function (type, original, x, y) {
                return $.Event(type, { pageX: x, pageY: y, originalEvent: original });
            },
            jQueryDocument = $(document);
        "ontouchstart" in window
            ? (jQueryDocument.on("touchstart", onTouchEvent), jQueryDocument.on("touchmove", onTouchEvent), jQueryDocument.on("touchend", onTouchEvent))
            : (jQueryDocument.on("mousedown", onMouseEvent), jQueryDocument.on("mouseup", onMouseEvent), jQueryDocument.on("mousemove", onMouseEvent));
    },
}),
    include("https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js", run);
