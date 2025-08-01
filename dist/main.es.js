var _a;
function noop$1() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function empty() {
  return text("");
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data)
    return;
  text2.data = data;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}
const outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    props,
    update: noop$1,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready2 = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready2)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready2 = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop$1;
  }
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop$1;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
const FileExtToMimeTypes = {
  "3g2": "video/3gpp2",
  "3gp": "video/3gpp",
  "3gpp": "audio/3gpp",
  aac: "audio/x-aac",
  adp: "audio/adpcm",
  aif: "audio/x-aiff",
  aifc: "audio/x-aiff",
  aiff: "audio/x-aiff",
  amr: "audio/amr",
  asf: "video/x-ms-asf",
  asx: "video/x-ms-asf",
  au: "audio/basic",
  avi: "video/x-msvideo",
  caf: "audio/x-caf",
  dra: "audio/vnd.dra",
  dts: "audio/vnd.dts",
  dtshd: "audio/vnd.dts.hd",
  dvb: "video/vnd.dvb.file",
  eol: "audio/vnd.digital-winds",
  f4v: "video/x-f4v",
  flac: "audio/x-flac",
  fli: "video/x-fli",
  flv: "video/x-flv",
  fvt: "video/vnd.fvt",
  h261: "video/h261",
  h263: "video/h263",
  h264: "video/h264",
  jpgm: "video/jpm",
  jpgv: "video/jpeg",
  kar: "audio/midi",
  lvp: "audio/vnd.lucent.voice",
  m1v: "video/mpeg",
  m2a: "audio/mpeg",
  m2v: "video/mpeg",
  m3a: "audio/mpeg",
  m3u: "audio/x-mpegurl",
  m4a: "audio/mp4",
  m4s: "video/iso.segment",
  m4u: "video/vnd.mpegurl",
  m4v: "video/x-m4v",
  mid: "audio/midi",
  midi: "audio/midi",
  mj2: "video/mj2",
  mjp2: "video/mj2",
  mk3d: "video/x-matroska",
  mka: "audio/x-matroska",
  mks: "video/x-matroska",
  mkv: "video/x-matroska",
  mng: "video/x-mng",
  mov: "video/quicktime",
  movie: "video/x-sgi-movie",
  mp2: "audio/mpeg",
  mp2a: "audio/mpeg",
  mp3: "audio/mp3",
  mp4: "video/mp4",
  mp4a: "audio/mp4",
  mp4v: "video/mp4",
  mpe: "video/mpeg",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  mpg4: "video/mp4",
  mpga: "audio/mpeg",
  mxmf: "audio/mobile-xmf",
  mxu: "video/vnd.mpegurl",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  ogv: "video/ogg",
  opus: "audio/ogg",
  pya: "audio/vnd.ms-playready.media.pya",
  pyv: "video/vnd.ms-playready.media.pyv",
  qt: "video/quicktime",
  ra: "audio/x-pn-realaudio",
  ram: "audio/x-pn-realaudio",
  rip: "audio/vnd.rip",
  rmi: "audio/midi",
  rmp: "audio/x-pn-realaudio-plugin",
  s3m: "audio/s3m",
  sil: "audio/silk",
  smv: "video/x-smv",
  snd: "audio/basic",
  spx: "audio/ogg",
  ts: "video/mp2t",
  uva: "audio/vnd.dece.audio",
  uvh: "video/vnd.dece.hd",
  uvm: "video/vnd.dece.mobile",
  uvp: "video/vnd.dece.pd",
  uvs: "video/vnd.dece.sd",
  uvu: "video/vnd.uvvu.mp4",
  uvv: "video/vnd.dece.video",
  uvva: "audio/vnd.dece.audio",
  uvvh: "video/vnd.dece.hd",
  uvvm: "video/vnd.dece.mobile",
  uvvp: "video/vnd.dece.pd",
  uvvs: "video/vnd.dece.sd",
  uvvu: "video/vnd.uvvu.mp4",
  uvvv: "video/vnd.dece.video",
  viv: "video/vnd.vivo",
  vob: "video/x-ms-vob",
  wav: "audio/wav",
  wax: "audio/x-ms-wax",
  weba: "audio/webm",
  webm: "video/webm",
  wm: "video/x-ms-wm",
  wma: "audio/x-ms-wma",
  wmv: "video/x-ms-wmv",
  wmx: "video/x-ms-wmx",
  wvx: "video/x-ms-wvx",
  xm: "audio/xm",
  m3u8: "application/vnd.apple.mpegurl"
};
const hlsTypes = ["application/x-mpegurl", "application/vnd.apple.mpegurl"];
function guessTypeFromSrc(src) {
  if (!src)
    return void 0;
  const i = src.lastIndexOf(".");
  if (!~i)
    return void 0;
  const ext = src.slice(i + 1);
  return FileExtToMimeTypes[ext];
}
async function safePlay(player) {
  try {
    await player.play();
    return true;
  } catch (err) {
    player.muted = true;
    await player.play();
    console.debug(err);
    return false;
  }
}
function importScript(src) {
  const script = document.createElement("script");
  return new Promise((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = reject;
    script.src = src;
    document.head.appendChild(script);
  });
}
async function loadHLS() {
  const fakeHls = {
    loadSource(_src) {
    },
    attachMedia(_el) {
    }
  };
  let hlsClass = window.Hls;
  if (hlsClass === null || hlsClass === false) {
    return fakeHls;
  } else if (hlsClass === void 0) {
    await importScript("https://cdn.jsdelivr.net/npm/hls.js");
    hlsClass = window.Hls;
  }
  if (typeof hlsClass === "function") {
    try {
      return new hlsClass();
    } catch (err) {
      console.debug(err);
      return fakeHls;
    }
  } else {
    return fakeHls;
  }
}
function cannotPlayHLSNatively(playerEl) {
  return "canPlayType" in playerEl && !playerEl.canPlayType("application/vnd.apple.mpegurl");
}
function clamp$1(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
function first(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray[0] : maybeArray;
}
function _defineProperty$1(e, t, i) {
  return (t = _toPropertyKey(t)) in e ? Object.defineProperty(e, t, { value: i, enumerable: true, configurable: true, writable: true }) : e[t] = i, e;
}
function _toPrimitive(e, t) {
  if ("object" != typeof e || null === e)
    return e;
  var i = e[Symbol.toPrimitive];
  if (void 0 !== i) {
    var s = i.call(e, t || "default");
    if ("object" != typeof s)
      return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === t ? String : Number)(e);
}
function _toPropertyKey(e) {
  var t = _toPrimitive(e, "string");
  return "symbol" == typeof t ? t : String(t);
}
function _classCallCheck(e, t) {
  if (!(e instanceof t))
    throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, t) {
  for (var i = 0; i < t.length; i++) {
    var s = t[i];
    s.enumerable = s.enumerable || false, s.configurable = true, "value" in s && (s.writable = true), Object.defineProperty(e, s.key, s);
  }
}
function _createClass(e, t, i) {
  return t && _defineProperties(e.prototype, t), i && _defineProperties(e, i), e;
}
function _defineProperty(e, t, i) {
  return t in e ? Object.defineProperty(e, t, { value: i, enumerable: true, configurable: true, writable: true }) : e[t] = i, e;
}
function ownKeys(e, t) {
  var i = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(e);
    t && (s = s.filter(function(t2) {
      return Object.getOwnPropertyDescriptor(e, t2).enumerable;
    })), i.push.apply(i, s);
  }
  return i;
}
function _objectSpread2(e) {
  for (var t = 1; t < arguments.length; t++) {
    var i = null != arguments[t] ? arguments[t] : {};
    t % 2 ? ownKeys(Object(i), true).forEach(function(t2) {
      _defineProperty(e, t2, i[t2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i)) : ownKeys(Object(i)).forEach(function(t2) {
      Object.defineProperty(e, t2, Object.getOwnPropertyDescriptor(i, t2));
    });
  }
  return e;
}
var defaults$1 = { addCSS: true, thumbWidth: 15, watch: true };
function matches$1(e, t) {
  return function() {
    return Array.from(document.querySelectorAll(t)).includes(this);
  }.call(e, t);
}
function trigger(e, t) {
  if (e && t) {
    var i = new Event(t, { bubbles: true });
    e.dispatchEvent(i);
  }
}
var getConstructor$1 = function(e) {
  return null != e ? e.constructor : null;
}, instanceOf$1 = function(e, t) {
  return !!(e && t && e instanceof t);
}, isNullOrUndefined$1 = function(e) {
  return null == e;
}, isObject$1 = function(e) {
  return getConstructor$1(e) === Object;
}, isNumber$1 = function(e) {
  return getConstructor$1(e) === Number && !Number.isNaN(e);
}, isString$1 = function(e) {
  return getConstructor$1(e) === String;
}, isBoolean$1 = function(e) {
  return getConstructor$1(e) === Boolean;
}, isFunction$1 = function(e) {
  return getConstructor$1(e) === Function;
}, isArray$1 = function(e) {
  return Array.isArray(e);
}, isNodeList$1 = function(e) {
  return instanceOf$1(e, NodeList);
}, isElement$1 = function(e) {
  return instanceOf$1(e, Element);
}, isEvent$1 = function(e) {
  return instanceOf$1(e, Event);
}, isEmpty$1 = function(e) {
  return isNullOrUndefined$1(e) || (isString$1(e) || isArray$1(e) || isNodeList$1(e)) && !e.length || isObject$1(e) && !Object.keys(e).length;
}, is$1 = { nullOrUndefined: isNullOrUndefined$1, object: isObject$1, number: isNumber$1, string: isString$1, boolean: isBoolean$1, function: isFunction$1, array: isArray$1, nodeList: isNodeList$1, element: isElement$1, event: isEvent$1, empty: isEmpty$1 };
function getDecimalPlaces(e) {
  var t = "".concat(e).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  return t ? Math.max(0, (t[1] ? t[1].length : 0) - (t[2] ? +t[2] : 0)) : 0;
}
function round(e, t) {
  if (1 > t) {
    var i = getDecimalPlaces(t);
    return parseFloat(e.toFixed(i));
  }
  return Math.round(e / t) * t;
}
var RangeTouch = function() {
  function e(t, i) {
    _classCallCheck(this, e), is$1.element(t) ? this.element = t : is$1.string(t) && (this.element = document.querySelector(t)), is$1.element(this.element) && is$1.empty(this.element.rangeTouch) && (this.config = _objectSpread2({}, defaults$1, {}, i), this.init());
  }
  return _createClass(e, [{ key: "init", value: function() {
    e.enabled && (this.config.addCSS && (this.element.style.userSelect = "none", this.element.style.webKitUserSelect = "none", this.element.style.touchAction = "manipulation"), this.listeners(true), this.element.rangeTouch = this);
  } }, { key: "destroy", value: function() {
    e.enabled && (this.config.addCSS && (this.element.style.userSelect = "", this.element.style.webKitUserSelect = "", this.element.style.touchAction = ""), this.listeners(false), this.element.rangeTouch = null);
  } }, { key: "listeners", value: function(e2) {
    var t = this, i = e2 ? "addEventListener" : "removeEventListener";
    ["touchstart", "touchmove", "touchend"].forEach(function(e3) {
      t.element[i](e3, function(e4) {
        return t.set(e4);
      }, false);
    });
  } }, { key: "get", value: function(t) {
    if (!e.enabled || !is$1.event(t))
      return null;
    var i, s = t.target, n = t.changedTouches[0], r = parseFloat(s.getAttribute("min")) || 0, a = parseFloat(s.getAttribute("max")) || 100, o = parseFloat(s.getAttribute("step")) || 1, l = s.getBoundingClientRect(), c = 100 / l.width * (this.config.thumbWidth / 2) / 100;
    return 0 > (i = 100 / l.width * (n.clientX - l.left)) ? i = 0 : 100 < i && (i = 100), 50 > i ? i -= (100 - 2 * i) * c : 50 < i && (i += 2 * (i - 50) * c), r + round(i / 100 * (a - r), o);
  } }, { key: "set", value: function(t) {
    e.enabled && is$1.event(t) && !t.target.disabled && (t.preventDefault(), t.target.value = this.get(t), trigger(t.target, "touchend" === t.type ? "change" : "input"));
  } }], [{ key: "setup", value: function(t) {
    var i = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {}, s = null;
    if (is$1.empty(t) || is$1.string(t) ? s = Array.from(document.querySelectorAll(is$1.string(t) ? t : 'input[type="range"]')) : is$1.element(t) ? s = [t] : is$1.nodeList(t) ? s = Array.from(t) : is$1.array(t) && (s = t.filter(is$1.element)), is$1.empty(s))
      return null;
    var n = _objectSpread2({}, defaults$1, {}, i);
    if (is$1.string(t) && n.watch) {
      var r = new MutationObserver(function(i2) {
        Array.from(i2).forEach(function(i3) {
          Array.from(i3.addedNodes).forEach(function(i4) {
            is$1.element(i4) && matches$1(i4, t) && new e(i4, n);
          });
        });
      });
      r.observe(document.body, { childList: true, subtree: true });
    }
    return s.map(function(t2) {
      return new e(t2, i);
    });
  } }, { key: "enabled", get: function() {
    return "ontouchstart" in document.documentElement;
  } }]), e;
}();
const getConstructor = (e) => null != e ? e.constructor : null, instanceOf = (e, t) => Boolean(e && t && e instanceof t), isNullOrUndefined = (e) => null == e, isObject = (e) => getConstructor(e) === Object, isNumber = (e) => getConstructor(e) === Number && !Number.isNaN(e), isString = (e) => getConstructor(e) === String, isBoolean = (e) => getConstructor(e) === Boolean, isFunction = (e) => "function" == typeof e, isArray = (e) => Array.isArray(e), isWeakMap = (e) => instanceOf(e, WeakMap), isNodeList = (e) => instanceOf(e, NodeList), isTextNode = (e) => getConstructor(e) === Text, isEvent = (e) => instanceOf(e, Event), isKeyboardEvent = (e) => instanceOf(e, KeyboardEvent), isCue = (e) => instanceOf(e, window.TextTrackCue) || instanceOf(e, window.VTTCue), isTrack = (e) => instanceOf(e, TextTrack) || !isNullOrUndefined(e) && isString(e.kind), isPromise = (e) => instanceOf(e, Promise) && isFunction(e.then), isElement = (e) => null !== e && "object" == typeof e && 1 === e.nodeType && "object" == typeof e.style && "object" == typeof e.ownerDocument, isEmpty = (e) => isNullOrUndefined(e) || (isString(e) || isArray(e) || isNodeList(e)) && !e.length || isObject(e) && !Object.keys(e).length, isUrl = (e) => {
  if (instanceOf(e, window.URL))
    return true;
  if (!isString(e))
    return false;
  let t = e;
  e.startsWith("http://") && e.startsWith("https://") || (t = `http://${e}`);
  try {
    return !isEmpty(new URL(t).hostname);
  } catch (e2) {
    return false;
  }
};
var is = { nullOrUndefined: isNullOrUndefined, object: isObject, number: isNumber, string: isString, boolean: isBoolean, function: isFunction, array: isArray, weakMap: isWeakMap, nodeList: isNodeList, element: isElement, textNode: isTextNode, event: isEvent, keyboardEvent: isKeyboardEvent, cue: isCue, track: isTrack, promise: isPromise, url: isUrl, empty: isEmpty };
const transitionEndEvent = (() => {
  const e = document.createElement("span"), t = { WebkitTransition: "webkitTransitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd otransitionend", transition: "transitionend" }, i = Object.keys(t).find((t2) => void 0 !== e.style[t2]);
  return !!is.string(i) && t[i];
})();
function repaint(e, t) {
  setTimeout(() => {
    try {
      e.hidden = true, e.offsetHeight, e.hidden = false;
    } catch (e2) {
    }
  }, t);
}
const isIE = Boolean(window.document.documentMode), isEdge = /Edge/g.test(navigator.userAgent), isWebKit = "WebkitAppearance" in document.documentElement.style && !/Edge/g.test(navigator.userAgent), isIPhone = /iPhone|iPod/gi.test(navigator.userAgent) && navigator.maxTouchPoints > 1, isIPadOS = "MacIntel" === navigator.platform && navigator.maxTouchPoints > 1, isIos = /iPad|iPhone|iPod/gi.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
var browser = { isIE, isEdge, isWebKit, isIPhone, isIPadOS, isIos };
function cloneDeep(e) {
  return JSON.parse(JSON.stringify(e));
}
function getDeep(e, t) {
  return t.split(".").reduce((e2, t2) => e2 && e2[t2], e);
}
function extend(e = {}, ...t) {
  if (!t.length)
    return e;
  const i = t.shift();
  return is.object(i) ? (Object.keys(i).forEach((t2) => {
    is.object(i[t2]) ? (Object.keys(e).includes(t2) || Object.assign(e, { [t2]: {} }), extend(e[t2], i[t2])) : Object.assign(e, { [t2]: i[t2] });
  }), extend(e, ...t)) : e;
}
function wrap(e, t) {
  const i = e.length ? e : [e];
  Array.from(i).reverse().forEach((e2, i2) => {
    const s = i2 > 0 ? t.cloneNode(true) : t, n = e2.parentNode, r = e2.nextSibling;
    s.appendChild(e2), r ? n.insertBefore(s, r) : n.appendChild(s);
  });
}
function setAttributes(e, t) {
  is.element(e) && !is.empty(t) && Object.entries(t).filter(([, e2]) => !is.nullOrUndefined(e2)).forEach(([t2, i]) => e.setAttribute(t2, i));
}
function createElement(e, t, i) {
  const s = document.createElement(e);
  return is.object(t) && setAttributes(s, t), is.string(i) && (s.innerText = i), s;
}
function insertAfter(e, t) {
  is.element(e) && is.element(t) && t.parentNode.insertBefore(e, t.nextSibling);
}
function insertElement(e, t, i, s) {
  is.element(t) && t.appendChild(createElement(e, i, s));
}
function removeElement(e) {
  is.nodeList(e) || is.array(e) ? Array.from(e).forEach(removeElement) : is.element(e) && is.element(e.parentNode) && e.parentNode.removeChild(e);
}
function emptyElement(e) {
  if (!is.element(e))
    return;
  let { length: t } = e.childNodes;
  for (; t > 0; )
    e.removeChild(e.lastChild), t -= 1;
}
function replaceElement(e, t) {
  return is.element(t) && is.element(t.parentNode) && is.element(e) ? (t.parentNode.replaceChild(e, t), e) : null;
}
function getAttributesFromSelector(e, t) {
  if (!is.string(e) || is.empty(e))
    return {};
  const i = {}, s = extend({}, t);
  return e.split(",").forEach((e2) => {
    const t2 = e2.trim(), n = t2.replace(".", ""), r = t2.replace(/[[\]]/g, "").split("="), [a] = r, o = r.length > 1 ? r[1].replace(/["']/g, "") : "";
    switch (t2.charAt(0)) {
      case ".":
        is.string(s.class) ? i.class = `${s.class} ${n}` : i.class = n;
        break;
      case "#":
        i.id = t2.replace("#", "");
        break;
      case "[":
        i[a] = o;
    }
  }), extend(s, i);
}
function toggleHidden(e, t) {
  if (!is.element(e))
    return;
  let i = t;
  is.boolean(i) || (i = !e.hidden), e.hidden = i;
}
function toggleClass(e, t, i) {
  if (is.nodeList(e))
    return Array.from(e).map((e2) => toggleClass(e2, t, i));
  if (is.element(e)) {
    let s = "toggle";
    return void 0 !== i && (s = i ? "add" : "remove"), e.classList[s](t), e.classList.contains(t);
  }
  return false;
}
function hasClass(e, t) {
  return is.element(e) && e.classList.contains(t);
}
function matches(e, t) {
  const { prototype: i } = Element;
  return (i.matches || i.webkitMatchesSelector || i.mozMatchesSelector || i.msMatchesSelector || function() {
    return Array.from(document.querySelectorAll(t)).includes(this);
  }).call(e, t);
}
function closest$1(e, t) {
  const { prototype: i } = Element;
  return (i.closest || function() {
    let e2 = this;
    do {
      if (matches.matches(e2, t))
        return e2;
      e2 = e2.parentElement || e2.parentNode;
    } while (null !== e2 && 1 === e2.nodeType);
    return null;
  }).call(e, t);
}
function getElements(e) {
  return this.elements.container.querySelectorAll(e);
}
function getElement(e) {
  return this.elements.container.querySelector(e);
}
function setFocus(e = null, t = false) {
  is.element(e) && e.focus({ preventScroll: true, focusVisible: t });
}
const defaultCodecs = { "audio/ogg": "vorbis", "audio/wav": "1", "video/webm": "vp8, vorbis", "video/mp4": "avc1.42E01E, mp4a.40.2", "video/ogg": "theora" }, support = { audio: "canPlayType" in document.createElement("audio"), video: "canPlayType" in document.createElement("video"), check(e, t) {
  const i = support[e] || "html5" !== t;
  return { api: i, ui: i && support.rangeInput };
}, pip: !(browser.isIPhone || !is.function(createElement("video").webkitSetPresentationMode) && (!document.pictureInPictureEnabled || createElement("video").disablePictureInPicture)), airplay: is.function(window.WebKitPlaybackTargetAvailabilityEvent), playsinline: "playsInline" in document.createElement("video"), mime(e) {
  if (is.empty(e))
    return false;
  const [t] = e.split("/");
  let i = e;
  if (!this.isHTML5 || t !== this.type)
    return false;
  Object.keys(defaultCodecs).includes(i) && (i += `; codecs="${defaultCodecs[e]}"`);
  try {
    return Boolean(i && this.media.canPlayType(i).replace(/no/, ""));
  } catch (e2) {
    return false;
  }
}, textTracks: "textTracks" in document.createElement("video"), rangeInput: (() => {
  const e = document.createElement("input");
  return e.type = "range", "range" === e.type;
})(), touch: "ontouchstart" in document.documentElement, transitions: false !== transitionEndEvent, reducedMotion: "matchMedia" in window && window.matchMedia("(prefers-reduced-motion)").matches }, supportsPassiveListeners = (() => {
  let e = false;
  try {
    const t = Object.defineProperty({}, "passive", { get: () => (e = true, null) });
    window.addEventListener("test", null, t), window.removeEventListener("test", null, t);
  } catch (e2) {
  }
  return e;
})();
function toggleListener(e, t, i, s = false, n = true, r = false) {
  if (!e || !("addEventListener" in e) || is.empty(t) || !is.function(i))
    return;
  const a = t.split(" ");
  let o = r;
  supportsPassiveListeners && (o = { passive: n, capture: r }), a.forEach((t2) => {
    this && this.eventListeners && s && this.eventListeners.push({ element: e, type: t2, callback: i, options: o }), e[s ? "addEventListener" : "removeEventListener"](t2, i, o);
  });
}
function on(e, t = "", i, s = true, n = false) {
  toggleListener.call(this, e, t, i, true, s, n);
}
function off(e, t = "", i, s = true, n = false) {
  toggleListener.call(this, e, t, i, false, s, n);
}
function once(e, t = "", i, s = true, n = false) {
  const r = (...a) => {
    off(e, t, r, s, n), i.apply(this, a);
  };
  toggleListener.call(this, e, t, r, true, s, n);
}
function triggerEvent(e, t = "", i = false, s = {}) {
  if (!is.element(e) || is.empty(t))
    return;
  const n = new CustomEvent(t, { bubbles: i, detail: { ...s, plyr: this } });
  e.dispatchEvent(n);
}
function unbindListeners() {
  this && this.eventListeners && (this.eventListeners.forEach((e) => {
    const { element: t, type: i, callback: s, options: n } = e;
    t.removeEventListener(i, s, n);
  }), this.eventListeners = []);
}
function ready() {
  return new Promise((e) => this.ready ? setTimeout(e, 0) : on.call(this, this.elements.container, "ready", e)).then(() => {
  });
}
function silencePromise(e) {
  is.promise(e) && e.then(null, () => {
  });
}
function dedupe(e) {
  return is.array(e) ? e.filter((t, i) => e.indexOf(t) === i) : e;
}
function closest(e, t) {
  return is.array(e) && e.length ? e.reduce((e2, i) => Math.abs(i - t) < Math.abs(e2 - t) ? i : e2) : null;
}
function supportsCSS(e) {
  return !(!window || !window.CSS) && window.CSS.supports(e);
}
const standardRatios = [[1, 1], [4, 3], [3, 4], [5, 4], [4, 5], [3, 2], [2, 3], [16, 10], [10, 16], [16, 9], [9, 16], [21, 9], [9, 21], [32, 9], [9, 32]].reduce((e, [t, i]) => ({ ...e, [t / i]: [t, i] }), {});
function validateAspectRatio(e) {
  if (!(is.array(e) || is.string(e) && e.includes(":")))
    return false;
  return (is.array(e) ? e : e.split(":")).map(Number).every(is.number);
}
function reduceAspectRatio(e) {
  if (!is.array(e) || !e.every(is.number))
    return null;
  const [t, i] = e, s = (e2, t2) => 0 === t2 ? e2 : s(t2, e2 % t2), n = s(t, i);
  return [t / n, i / n];
}
function getAspectRatio(e) {
  const t = (e2) => validateAspectRatio(e2) ? e2.split(":").map(Number) : null;
  let i = t(e);
  if (null === i && (i = t(this.config.ratio)), null === i && !is.empty(this.embed) && is.array(this.embed.ratio) && ({ ratio: i } = this.embed), null === i && this.isHTML5) {
    const { videoWidth: e2, videoHeight: t2 } = this.media;
    i = [e2, t2];
  }
  return reduceAspectRatio(i);
}
function setAspectRatio(e) {
  if (!this.isVideo)
    return {};
  const { wrapper: t } = this.elements, i = getAspectRatio.call(this, e);
  if (!is.array(i))
    return {};
  const [s, n] = reduceAspectRatio(i), r = 100 / s * n;
  if (supportsCSS(`aspect-ratio: ${s}/${n}`) ? t.style.aspectRatio = `${s}/${n}` : t.style.paddingBottom = `${r}%`, this.isVimeo && !this.config.vimeo.premium && this.supported.ui) {
    const e2 = 100 / this.media.offsetWidth * parseInt(window.getComputedStyle(this.media).paddingBottom, 10), i2 = (e2 - r) / (e2 / 50);
    this.fullscreen.active ? t.style.paddingBottom = null : this.media.style.transform = `translateY(-${i2}%)`;
  } else
    this.isHTML5 && t.classList.add(this.config.classNames.videoFixedRatio);
  return { padding: r, ratio: i };
}
function roundAspectRatio(e, t, i = 0.05) {
  const s = e / t, n = closest(Object.keys(standardRatios), s);
  return Math.abs(n - s) <= i ? standardRatios[n] : [e, t];
}
function getViewportSize() {
  return [Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0), Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)];
}
const html5 = { getSources() {
  if (!this.isHTML5)
    return [];
  return Array.from(this.media.querySelectorAll("source")).filter((e) => {
    const t = e.getAttribute("type");
    return !!is.empty(t) || support.mime.call(this, t);
  });
}, getQualityOptions() {
  return this.config.quality.forced ? this.config.quality.options : html5.getSources.call(this).map((e) => Number(e.getAttribute("size"))).filter(Boolean);
}, setup() {
  if (!this.isHTML5)
    return;
  const e = this;
  e.options.speed = e.config.speed.options, is.empty(this.config.ratio) || setAspectRatio.call(e), Object.defineProperty(e.media, "quality", { get() {
    const t = html5.getSources.call(e).find((t2) => t2.getAttribute("src") === e.source);
    return t && Number(t.getAttribute("size"));
  }, set(t) {
    if (e.quality !== t) {
      if (e.config.quality.forced && is.function(e.config.quality.onChange))
        e.config.quality.onChange(t);
      else {
        const i = html5.getSources.call(e).find((e2) => Number(e2.getAttribute("size")) === t);
        if (!i)
          return;
        const { currentTime: s, paused: n, preload: r, readyState: a, playbackRate: o } = e.media;
        e.media.src = i.getAttribute("src"), ("none" !== r || a) && (e.once("loadedmetadata", () => {
          e.speed = o, e.currentTime = s, n || silencePromise(e.play());
        }), e.media.load());
      }
      triggerEvent.call(e, e.media, "qualitychange", false, { quality: t });
    }
  } });
}, cancelRequests() {
  this.isHTML5 && (removeElement(html5.getSources.call(this)), this.media.setAttribute("src", this.config.blankVideo), this.media.load(), this.debug.log("Cancelled network requests"));
} };
function generateId(e) {
  return `${e}-${Math.floor(1e4 * Math.random())}`;
}
function format(e, ...t) {
  return is.empty(e) ? e : e.toString().replace(/{(\d+)}/g, (e2, i) => t[i].toString());
}
function getPercentage(e, t) {
  return 0 === e || 0 === t || Number.isNaN(e) || Number.isNaN(t) ? 0 : (e / t * 100).toFixed(2);
}
const replaceAll = (e = "", t = "", i = "") => e.replace(new RegExp(t.toString().replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1"), "g"), i.toString()), toTitleCase = (e = "") => e.toString().replace(/\w\S*/g, (e2) => e2.charAt(0).toUpperCase() + e2.slice(1).toLowerCase());
function toPascalCase(e = "") {
  let t = e.toString();
  return t = replaceAll(t, "-", " "), t = replaceAll(t, "_", " "), t = toTitleCase(t), replaceAll(t, " ", "");
}
function toCamelCase(e = "") {
  let t = e.toString();
  return t = toPascalCase(t), t.charAt(0).toLowerCase() + t.slice(1);
}
function stripHTML(e) {
  const t = document.createDocumentFragment(), i = document.createElement("div");
  return t.appendChild(i), i.innerHTML = e, t.firstChild.innerText;
}
function getHTML(e) {
  const t = document.createElement("div");
  return t.appendChild(e), t.innerHTML;
}
const resources = { pip: "PIP", airplay: "AirPlay", html5: "HTML5", vimeo: "Vimeo", youtube: "YouTube" }, i18n = { get(e = "", t = {}) {
  if (is.empty(e) || is.empty(t))
    return "";
  let i = getDeep(t.i18n, e);
  if (is.empty(i))
    return Object.keys(resources).includes(e) ? resources[e] : "";
  const s = { "{seektime}": t.seekTime, "{title}": t.title };
  return Object.entries(s).forEach(([e2, t2]) => {
    i = replaceAll(i, e2, t2);
  }), i;
} };
class Storage {
  constructor(e) {
    _defineProperty$1(this, "get", (e2) => {
      if (!Storage.supported || !this.enabled)
        return null;
      const t = window.localStorage.getItem(this.key);
      if (is.empty(t))
        return null;
      const i = JSON.parse(t);
      return is.string(e2) && e2.length ? i[e2] : i;
    }), _defineProperty$1(this, "set", (e2) => {
      if (!Storage.supported || !this.enabled)
        return;
      if (!is.object(e2))
        return;
      let t = this.get();
      is.empty(t) && (t = {}), extend(t, e2);
      try {
        window.localStorage.setItem(this.key, JSON.stringify(t));
      } catch (e3) {
      }
    }), this.enabled = e.config.storage.enabled, this.key = e.config.storage.key;
  }
  static get supported() {
    try {
      if (!("localStorage" in window))
        return false;
      const e = "___test";
      return window.localStorage.setItem(e, e), window.localStorage.removeItem(e), true;
    } catch (e) {
      return false;
    }
  }
}
function fetch(e, t = "text") {
  return new Promise((i, s) => {
    try {
      const s2 = new XMLHttpRequest();
      if (!("withCredentials" in s2))
        return;
      s2.addEventListener("load", () => {
        if ("text" === t)
          try {
            i(JSON.parse(s2.responseText));
          } catch (e2) {
            i(s2.responseText);
          }
        else
          i(s2.response);
      }), s2.addEventListener("error", () => {
        throw new Error(s2.status);
      }), s2.open("GET", e, true), s2.responseType = t, s2.send();
    } catch (e2) {
      s(e2);
    }
  });
}
function loadSprite(e, t) {
  if (!is.string(e))
    return;
  const i = "cache", s = is.string(t);
  let n = false;
  const r = () => null !== document.getElementById(t), a = (e2, t2) => {
    e2.innerHTML = t2, s && r() || document.body.insertAdjacentElement("afterbegin", e2);
  };
  if (!s || !r()) {
    const r2 = Storage.supported, o = document.createElement("div");
    if (o.setAttribute("hidden", ""), s && o.setAttribute("id", t), r2) {
      const e2 = window.localStorage.getItem(`${i}-${t}`);
      if (n = null !== e2, n) {
        const t2 = JSON.parse(e2);
        a(o, t2.content);
      }
    }
    fetch(e).then((e2) => {
      if (!is.empty(e2)) {
        if (r2)
          try {
            window.localStorage.setItem(`${i}-${t}`, JSON.stringify({ content: e2 }));
          } catch (e3) {
          }
        a(o, e2);
      }
    }).catch(() => {
    });
  }
}
const getHours = (e) => Math.trunc(e / 60 / 60 % 60, 10), getMinutes = (e) => Math.trunc(e / 60 % 60, 10), getSeconds = (e) => Math.trunc(e % 60, 10);
function formatTime(e = 0, t = false, i = false) {
  if (!is.number(e))
    return formatTime(void 0, t, i);
  const s = (e2) => `0${e2}`.slice(-2);
  let n = getHours(e);
  const r = getMinutes(e), a = getSeconds(e);
  return n = t || n > 0 ? `${n}:` : "", `${i && e > 0 ? "-" : ""}${n}${s(r)}:${s(a)}`;
}
const controls = { getIconUrl() {
  const e = new URL(this.config.iconUrl, window.location), t = window.location.host ? window.location.host : window.top.location.host, i = e.host !== t || browser.isIE && !window.svg4everybody;
  return { url: this.config.iconUrl, cors: i };
}, findElements() {
  try {
    return this.elements.controls = getElement.call(this, this.config.selectors.controls.wrapper), this.elements.buttons = { play: getElements.call(this, this.config.selectors.buttons.play), pause: getElement.call(this, this.config.selectors.buttons.pause), restart: getElement.call(this, this.config.selectors.buttons.restart), rewind: getElement.call(this, this.config.selectors.buttons.rewind), fastForward: getElement.call(this, this.config.selectors.buttons.fastForward), mute: getElement.call(this, this.config.selectors.buttons.mute), pip: getElement.call(this, this.config.selectors.buttons.pip), airplay: getElement.call(this, this.config.selectors.buttons.airplay), settings: getElement.call(this, this.config.selectors.buttons.settings), captions: getElement.call(this, this.config.selectors.buttons.captions), fullscreen: getElement.call(this, this.config.selectors.buttons.fullscreen) }, this.elements.progress = getElement.call(this, this.config.selectors.progress), this.elements.inputs = { seek: getElement.call(this, this.config.selectors.inputs.seek), volume: getElement.call(this, this.config.selectors.inputs.volume) }, this.elements.display = { buffer: getElement.call(this, this.config.selectors.display.buffer), currentTime: getElement.call(this, this.config.selectors.display.currentTime), duration: getElement.call(this, this.config.selectors.display.duration) }, is.element(this.elements.progress) && (this.elements.display.seekTooltip = this.elements.progress.querySelector(`.${this.config.classNames.tooltip}`)), true;
  } catch (e) {
    return this.debug.warn("It looks like there is a problem with your custom controls HTML", e), this.toggleNativeControls(true), false;
  }
}, createIcon(e, t) {
  const i = "http://www.w3.org/2000/svg", s = controls.getIconUrl.call(this), n = `${s.cors ? "" : s.url}#${this.config.iconPrefix}`, r = document.createElementNS(i, "svg");
  setAttributes(r, extend(t, { "aria-hidden": "true", focusable: "false" }));
  const a = document.createElementNS(i, "use"), o = `${n}-${e}`;
  return "href" in a && a.setAttributeNS("http://www.w3.org/1999/xlink", "href", o), a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", o), r.appendChild(a), r;
}, createLabel(e, t = {}) {
  const i = i18n.get(e, this.config);
  return createElement("span", { ...t, class: [t.class, this.config.classNames.hidden].filter(Boolean).join(" ") }, i);
}, createBadge(e) {
  if (is.empty(e))
    return null;
  const t = createElement("span", { class: this.config.classNames.menu.value });
  return t.appendChild(createElement("span", { class: this.config.classNames.menu.badge }, e)), t;
}, createButton(e, t) {
  const i = extend({}, t);
  let s = toCamelCase(e);
  const n = { element: "button", toggle: false, label: null, icon: null, labelPressed: null, iconPressed: null };
  switch (["element", "icon", "label"].forEach((e2) => {
    Object.keys(i).includes(e2) && (n[e2] = i[e2], delete i[e2]);
  }), "button" !== n.element || Object.keys(i).includes("type") || (i.type = "button"), Object.keys(i).includes("class") ? i.class.split(" ").some((e2) => e2 === this.config.classNames.control) || extend(i, { class: `${i.class} ${this.config.classNames.control}` }) : i.class = this.config.classNames.control, e) {
    case "play":
      n.toggle = true, n.label = "play", n.labelPressed = "pause", n.icon = "play", n.iconPressed = "pause";
      break;
    case "mute":
      n.toggle = true, n.label = "mute", n.labelPressed = "unmute", n.icon = "volume", n.iconPressed = "muted";
      break;
    case "captions":
      n.toggle = true, n.label = "enableCaptions", n.labelPressed = "disableCaptions", n.icon = "captions-off", n.iconPressed = "captions-on";
      break;
    case "fullscreen":
      n.toggle = true, n.label = "enterFullscreen", n.labelPressed = "exitFullscreen", n.icon = "enter-fullscreen", n.iconPressed = "exit-fullscreen";
      break;
    case "play-large":
      i.class += ` ${this.config.classNames.control}--overlaid`, s = "play", n.label = "play", n.icon = "play";
      break;
    default:
      is.empty(n.label) && (n.label = s), is.empty(n.icon) && (n.icon = e);
  }
  const r = createElement(n.element);
  return n.toggle ? (r.appendChild(controls.createIcon.call(this, n.iconPressed, { class: "icon--pressed" })), r.appendChild(controls.createIcon.call(this, n.icon, { class: "icon--not-pressed" })), r.appendChild(controls.createLabel.call(this, n.labelPressed, { class: "label--pressed" })), r.appendChild(controls.createLabel.call(this, n.label, { class: "label--not-pressed" }))) : (r.appendChild(controls.createIcon.call(this, n.icon)), r.appendChild(controls.createLabel.call(this, n.label))), extend(i, getAttributesFromSelector(this.config.selectors.buttons[s], i)), setAttributes(r, i), "play" === s ? (is.array(this.elements.buttons[s]) || (this.elements.buttons[s] = []), this.elements.buttons[s].push(r)) : this.elements.buttons[s] = r, r;
}, createRange(e, t) {
  const i = createElement("input", extend(getAttributesFromSelector(this.config.selectors.inputs[e]), { type: "range", min: 0, max: 100, step: 0.01, value: 0, autocomplete: "off", role: "slider", "aria-label": i18n.get(e, this.config), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": 0 }, t));
  return this.elements.inputs[e] = i, controls.updateRangeFill.call(this, i), RangeTouch.setup(i), i;
}, createProgress(e, t) {
  const i = createElement("progress", extend(getAttributesFromSelector(this.config.selectors.display[e]), { min: 0, max: 100, value: 0, role: "progressbar", "aria-hidden": true }, t));
  if ("volume" !== e) {
    i.appendChild(createElement("span", null, "0"));
    const t2 = { played: "played", buffer: "buffered" }[e], s = t2 ? i18n.get(t2, this.config) : "";
    i.innerText = `% ${s.toLowerCase()}`;
  }
  return this.elements.display[e] = i, i;
}, createTime(e, t) {
  const i = getAttributesFromSelector(this.config.selectors.display[e], t), s = createElement("div", extend(i, { class: `${i.class ? i.class : ""} ${this.config.classNames.display.time} `.trim(), "aria-label": i18n.get(e, this.config), role: "timer" }), "00:00");
  return this.elements.display[e] = s, s;
}, bindMenuItemShortcuts(e, t) {
  on.call(this, e, "keydown keyup", (i) => {
    if (![" ", "ArrowUp", "ArrowDown", "ArrowRight"].includes(i.key))
      return;
    if (i.preventDefault(), i.stopPropagation(), "keydown" === i.type)
      return;
    const s = matches(e, '[role="menuitemradio"]');
    if (!s && [" ", "ArrowRight"].includes(i.key))
      controls.showMenuPanel.call(this, t, true);
    else {
      let t2;
      " " !== i.key && ("ArrowDown" === i.key || s && "ArrowRight" === i.key ? (t2 = e.nextElementSibling, is.element(t2) || (t2 = e.parentNode.firstElementChild)) : (t2 = e.previousElementSibling, is.element(t2) || (t2 = e.parentNode.lastElementChild)), setFocus.call(this, t2, true));
    }
  }, false), on.call(this, e, "keyup", (e2) => {
    "Return" === e2.key && controls.focusFirstMenuItem.call(this, null, true);
  });
}, createMenuItem({ value: e, list: t, type: i, title: s, badge: n = null, checked: r = false }) {
  const a = getAttributesFromSelector(this.config.selectors.inputs[i]), o = createElement("button", extend(a, { type: "button", role: "menuitemradio", class: `${this.config.classNames.control} ${a.class ? a.class : ""}`.trim(), "aria-checked": r, value: e })), l = createElement("span");
  l.innerHTML = s, is.element(n) && l.appendChild(n), o.appendChild(l), Object.defineProperty(o, "checked", { enumerable: true, get: () => "true" === o.getAttribute("aria-checked"), set(e2) {
    e2 && Array.from(o.parentNode.children).filter((e3) => matches(e3, '[role="menuitemradio"]')).forEach((e3) => e3.setAttribute("aria-checked", "false")), o.setAttribute("aria-checked", e2 ? "true" : "false");
  } }), this.listeners.bind(o, "click keyup", (t2) => {
    if (!is.keyboardEvent(t2) || " " === t2.key) {
      switch (t2.preventDefault(), t2.stopPropagation(), o.checked = true, i) {
        case "language":
          this.currentTrack = Number(e);
          break;
        case "quality":
          this.quality = e;
          break;
        case "speed":
          this.speed = parseFloat(e);
      }
      controls.showMenuPanel.call(this, "home", is.keyboardEvent(t2));
    }
  }, i, false), controls.bindMenuItemShortcuts.call(this, o, i), t.appendChild(o);
}, formatTime(e = 0, t = false) {
  if (!is.number(e))
    return e;
  return formatTime(e, getHours(this.duration) > 0, t);
}, updateTimeDisplay(e = null, t = 0, i = false) {
  is.element(e) && is.number(t) && (e.innerText = controls.formatTime(t, i));
}, updateVolume() {
  this.supported.ui && (is.element(this.elements.inputs.volume) && controls.setRange.call(this, this.elements.inputs.volume, this.muted ? 0 : this.volume), is.element(this.elements.buttons.mute) && (this.elements.buttons.mute.pressed = this.muted || 0 === this.volume));
}, setRange(e, t = 0) {
  is.element(e) && (e.value = t, controls.updateRangeFill.call(this, e));
}, updateProgress(e) {
  if (!this.supported.ui || !is.event(e))
    return;
  let t = 0;
  const i = (e2, t2) => {
    const i2 = is.number(t2) ? t2 : 0, s = is.element(e2) ? e2 : this.elements.display.buffer;
    if (is.element(s)) {
      s.value = i2;
      const e3 = s.getElementsByTagName("span")[0];
      is.element(e3) && (e3.childNodes[0].nodeValue = i2);
    }
  };
  if (e)
    switch (e.type) {
      case "timeupdate":
      case "seeking":
      case "seeked":
        t = getPercentage(this.currentTime, this.duration), "timeupdate" === e.type && controls.setRange.call(this, this.elements.inputs.seek, t);
        break;
      case "playing":
      case "progress":
        i(this.elements.display.buffer, 100 * this.buffered);
    }
}, updateRangeFill(e) {
  const t = is.event(e) ? e.target : e;
  if (is.element(t) && "range" === t.getAttribute("type")) {
    if (matches(t, this.config.selectors.inputs.seek)) {
      t.setAttribute("aria-valuenow", this.currentTime);
      const e2 = controls.formatTime(this.currentTime), i = controls.formatTime(this.duration), s = i18n.get("seekLabel", this.config);
      t.setAttribute("aria-valuetext", s.replace("{currentTime}", e2).replace("{duration}", i));
    } else if (matches(t, this.config.selectors.inputs.volume)) {
      const e2 = 100 * t.value;
      t.setAttribute("aria-valuenow", e2), t.setAttribute("aria-valuetext", `${e2.toFixed(1)}%`);
    } else
      t.setAttribute("aria-valuenow", t.value);
    (browser.isWebKit || browser.isIPadOS) && t.style.setProperty("--value", t.value / t.max * 100 + "%");
  }
}, updateSeekTooltip(e) {
  var t, i;
  if (!this.config.tooltips.seek || !is.element(this.elements.inputs.seek) || !is.element(this.elements.display.seekTooltip) || 0 === this.duration)
    return;
  const s = this.elements.display.seekTooltip, n = `${this.config.classNames.tooltip}--visible`, r = (e2) => toggleClass(s, n, e2);
  if (this.touch)
    return void r(false);
  let a = 0;
  const o = this.elements.progress.getBoundingClientRect();
  if (is.event(e))
    a = 100 / o.width * (e.pageX - o.left);
  else {
    if (!hasClass(s, n))
      return;
    a = parseFloat(s.style.left, 10);
  }
  a < 0 ? a = 0 : a > 100 && (a = 100);
  const l = this.duration / 100 * a;
  s.innerText = controls.formatTime(l);
  const c = null === (t = this.config.markers) || void 0 === t || null === (i = t.points) || void 0 === i ? void 0 : i.find(({ time: e2 }) => e2 === Math.round(l));
  c && s.insertAdjacentHTML("afterbegin", `${c.label}<br>`), s.style.left = `${a}%`, is.event(e) && ["mouseenter", "mouseleave"].includes(e.type) && r("mouseenter" === e.type);
}, timeUpdate(e) {
  const t = !is.element(this.elements.display.duration) && this.config.invertTime;
  controls.updateTimeDisplay.call(this, this.elements.display.currentTime, t ? this.duration - this.currentTime : this.currentTime, t), e && "timeupdate" === e.type && this.media.seeking || controls.updateProgress.call(this, e);
}, durationUpdate() {
  if (!this.supported.ui || !this.config.invertTime && this.currentTime)
    return;
  if (this.duration >= 2 ** 32)
    return toggleHidden(this.elements.display.currentTime, true), void toggleHidden(this.elements.progress, true);
  is.element(this.elements.inputs.seek) && this.elements.inputs.seek.setAttribute("aria-valuemax", this.duration);
  const e = is.element(this.elements.display.duration);
  !e && this.config.displayDuration && this.paused && controls.updateTimeDisplay.call(this, this.elements.display.currentTime, this.duration), e && controls.updateTimeDisplay.call(this, this.elements.display.duration, this.duration), this.config.markers.enabled && controls.setMarkers.call(this), controls.updateSeekTooltip.call(this);
}, toggleMenuButton(e, t) {
  toggleHidden(this.elements.settings.buttons[e], !t);
}, updateSetting(e, t, i) {
  const s = this.elements.settings.panels[e];
  let n = null, r = t;
  if ("captions" === e)
    n = this.currentTrack;
  else {
    if (n = is.empty(i) ? this[e] : i, is.empty(n) && (n = this.config[e].default), !is.empty(this.options[e]) && !this.options[e].includes(n))
      return void this.debug.warn(`Unsupported value of '${n}' for ${e}`);
    if (!this.config[e].options.includes(n))
      return void this.debug.warn(`Disabled value of '${n}' for ${e}`);
  }
  if (is.element(r) || (r = s && s.querySelector('[role="menu"]')), !is.element(r))
    return;
  this.elements.settings.buttons[e].querySelector(`.${this.config.classNames.menu.value}`).innerHTML = controls.getLabel.call(this, e, n);
  const a = r && r.querySelector(`[value="${n}"]`);
  is.element(a) && (a.checked = true);
}, getLabel(e, t) {
  switch (e) {
    case "speed":
      return 1 === t ? i18n.get("normal", this.config) : `${t}&times;`;
    case "quality":
      if (is.number(t)) {
        const e2 = i18n.get(`qualityLabel.${t}`, this.config);
        return e2.length ? e2 : `${t}p`;
      }
      return toTitleCase(t);
    case "captions":
      return captions.getLabel.call(this);
    default:
      return null;
  }
}, setQualityMenu(e) {
  if (!is.element(this.elements.settings.panels.quality))
    return;
  const t = "quality", i = this.elements.settings.panels.quality.querySelector('[role="menu"]');
  is.array(e) && (this.options.quality = dedupe(e).filter((e2) => this.config.quality.options.includes(e2)));
  const s = !is.empty(this.options.quality) && this.options.quality.length > 1;
  if (controls.toggleMenuButton.call(this, t, s), emptyElement(i), controls.checkMenu.call(this), !s)
    return;
  const n = (e2) => {
    const t2 = i18n.get(`qualityBadge.${e2}`, this.config);
    return t2.length ? controls.createBadge.call(this, t2) : null;
  };
  this.options.quality.sort((e2, t2) => {
    const i2 = this.config.quality.options;
    return i2.indexOf(e2) > i2.indexOf(t2) ? 1 : -1;
  }).forEach((e2) => {
    controls.createMenuItem.call(this, { value: e2, list: i, type: t, title: controls.getLabel.call(this, "quality", e2), badge: n(e2) });
  }), controls.updateSetting.call(this, t, i);
}, setCaptionsMenu() {
  if (!is.element(this.elements.settings.panels.captions))
    return;
  const e = "captions", t = this.elements.settings.panels.captions.querySelector('[role="menu"]'), i = captions.getTracks.call(this), s = Boolean(i.length);
  if (controls.toggleMenuButton.call(this, e, s), emptyElement(t), controls.checkMenu.call(this), !s)
    return;
  const n = i.map((e2, i2) => ({ value: i2, checked: this.captions.toggled && this.currentTrack === i2, title: captions.getLabel.call(this, e2), badge: e2.language && controls.createBadge.call(this, e2.language.toUpperCase()), list: t, type: "language" }));
  n.unshift({ value: -1, checked: !this.captions.toggled, title: i18n.get("disabled", this.config), list: t, type: "language" }), n.forEach(controls.createMenuItem.bind(this)), controls.updateSetting.call(this, e, t);
}, setSpeedMenu() {
  if (!is.element(this.elements.settings.panels.speed))
    return;
  const e = "speed", t = this.elements.settings.panels.speed.querySelector('[role="menu"]');
  this.options.speed = this.options.speed.filter((e2) => e2 >= this.minimumSpeed && e2 <= this.maximumSpeed);
  const i = !is.empty(this.options.speed) && this.options.speed.length > 1;
  controls.toggleMenuButton.call(this, e, i), emptyElement(t), controls.checkMenu.call(this), i && (this.options.speed.forEach((i2) => {
    controls.createMenuItem.call(this, { value: i2, list: t, type: e, title: controls.getLabel.call(this, "speed", i2) });
  }), controls.updateSetting.call(this, e, t));
}, checkMenu() {
  const { buttons: e } = this.elements.settings, t = !is.empty(e) && Object.values(e).some((e2) => !e2.hidden);
  toggleHidden(this.elements.settings.menu, !t);
}, focusFirstMenuItem(e, t = false) {
  if (this.elements.settings.popup.hidden)
    return;
  let i = e;
  is.element(i) || (i = Object.values(this.elements.settings.panels).find((e2) => !e2.hidden));
  const s = i.querySelector('[role^="menuitem"]');
  setFocus.call(this, s, t);
}, toggleMenu(e) {
  const { popup: t } = this.elements.settings, i = this.elements.buttons.settings;
  if (!is.element(t) || !is.element(i))
    return;
  const { hidden: s } = t;
  let n = s;
  if (is.boolean(e))
    n = e;
  else if (is.keyboardEvent(e) && "Escape" === e.key)
    n = false;
  else if (is.event(e)) {
    const s2 = is.function(e.composedPath) ? e.composedPath()[0] : e.target, r = t.contains(s2);
    if (r || !r && e.target !== i && n)
      return;
  }
  i.setAttribute("aria-expanded", n), toggleHidden(t, !n), toggleClass(this.elements.container, this.config.classNames.menu.open, n), n && is.keyboardEvent(e) ? controls.focusFirstMenuItem.call(this, null, true) : n || s || setFocus.call(this, i, is.keyboardEvent(e));
}, getMenuSize(e) {
  const t = e.cloneNode(true);
  t.style.position = "absolute", t.style.opacity = 0, t.removeAttribute("hidden"), e.parentNode.appendChild(t);
  const i = t.scrollWidth, s = t.scrollHeight;
  return removeElement(t), { width: i, height: s };
}, showMenuPanel(e = "", t = false) {
  const i = this.elements.container.querySelector(`#plyr-settings-${this.id}-${e}`);
  if (!is.element(i))
    return;
  const s = i.parentNode, n = Array.from(s.children).find((e2) => !e2.hidden);
  if (support.transitions && !support.reducedMotion) {
    s.style.width = `${n.scrollWidth}px`, s.style.height = `${n.scrollHeight}px`;
    const e2 = controls.getMenuSize.call(this, i), t2 = (e3) => {
      e3.target === s && ["width", "height"].includes(e3.propertyName) && (s.style.width = "", s.style.height = "", off.call(this, s, transitionEndEvent, t2));
    };
    on.call(this, s, transitionEndEvent, t2), s.style.width = `${e2.width}px`, s.style.height = `${e2.height}px`;
  }
  toggleHidden(n, true), toggleHidden(i, false), controls.focusFirstMenuItem.call(this, i, t);
}, setDownloadUrl() {
  const e = this.elements.buttons.download;
  is.element(e) && e.setAttribute("href", this.download);
}, create(e) {
  const { bindMenuItemShortcuts: t, createButton: i, createProgress: s, createRange: n, createTime: r, setQualityMenu: a, setSpeedMenu: o, showMenuPanel: l } = controls;
  this.elements.controls = null, is.array(this.config.controls) && this.config.controls.includes("play-large") && this.elements.container.appendChild(i.call(this, "play-large"));
  const c = createElement("div", getAttributesFromSelector(this.config.selectors.controls.wrapper));
  this.elements.controls = c;
  const u = { class: "plyr__controls__item" };
  return dedupe(is.array(this.config.controls) ? this.config.controls : []).forEach((a2) => {
    if ("restart" === a2 && c.appendChild(i.call(this, "restart", u)), "rewind" === a2 && c.appendChild(i.call(this, "rewind", u)), "play" === a2 && c.appendChild(i.call(this, "play", u)), "fast-forward" === a2 && c.appendChild(i.call(this, "fast-forward", u)), "progress" === a2) {
      const t2 = createElement("div", { class: `${u.class} plyr__progress__container` }), i2 = createElement("div", getAttributesFromSelector(this.config.selectors.progress));
      if (i2.appendChild(n.call(this, "seek", { id: `plyr-seek-${e.id}` })), i2.appendChild(s.call(this, "buffer")), this.config.tooltips.seek) {
        const e2 = createElement("span", { class: this.config.classNames.tooltip }, "00:00");
        i2.appendChild(e2), this.elements.display.seekTooltip = e2;
      }
      this.elements.progress = i2, t2.appendChild(this.elements.progress), c.appendChild(t2);
    }
    if ("current-time" === a2 && c.appendChild(r.call(this, "currentTime", u)), "duration" === a2 && c.appendChild(r.call(this, "duration", u)), "mute" === a2 || "volume" === a2) {
      let { volume: t2 } = this.elements;
      if (is.element(t2) && c.contains(t2) || (t2 = createElement("div", extend({}, u, { class: `${u.class} plyr__volume`.trim() })), this.elements.volume = t2, c.appendChild(t2)), "mute" === a2 && t2.appendChild(i.call(this, "mute")), "volume" === a2 && !browser.isIos && !browser.isIPadOS) {
        const i2 = { max: 1, step: 0.05, value: this.config.volume };
        t2.appendChild(n.call(this, "volume", extend(i2, { id: `plyr-volume-${e.id}` })));
      }
    }
    if ("captions" === a2 && c.appendChild(i.call(this, "captions", u)), "settings" === a2 && !is.empty(this.config.settings)) {
      const s2 = createElement("div", extend({}, u, { class: `${u.class} plyr__menu`.trim(), hidden: "" }));
      s2.appendChild(i.call(this, "settings", { "aria-haspopup": true, "aria-controls": `plyr-settings-${e.id}`, "aria-expanded": false }));
      const n2 = createElement("div", { class: "plyr__menu__container", id: `plyr-settings-${e.id}`, hidden: "" }), r2 = createElement("div"), a3 = createElement("div", { id: `plyr-settings-${e.id}-home` }), o2 = createElement("div", { role: "menu" });
      a3.appendChild(o2), r2.appendChild(a3), this.elements.settings.panels.home = a3, this.config.settings.forEach((i2) => {
        const s3 = createElement("button", extend(getAttributesFromSelector(this.config.selectors.buttons.settings), { type: "button", class: `${this.config.classNames.control} ${this.config.classNames.control}--forward`, role: "menuitem", "aria-haspopup": true, hidden: "" }));
        t.call(this, s3, i2), on.call(this, s3, "click", () => {
          l.call(this, i2, false);
        });
        const n3 = createElement("span", null, i18n.get(i2, this.config)), a4 = createElement("span", { class: this.config.classNames.menu.value });
        a4.innerHTML = e[i2], n3.appendChild(a4), s3.appendChild(n3), o2.appendChild(s3);
        const c2 = createElement("div", { id: `plyr-settings-${e.id}-${i2}`, hidden: "" }), u2 = createElement("button", { type: "button", class: `${this.config.classNames.control} ${this.config.classNames.control}--back` });
        u2.appendChild(createElement("span", { "aria-hidden": true }, i18n.get(i2, this.config))), u2.appendChild(createElement("span", { class: this.config.classNames.hidden }, i18n.get("menuBack", this.config))), on.call(this, c2, "keydown", (e2) => {
          "ArrowLeft" === e2.key && (e2.preventDefault(), e2.stopPropagation(), l.call(this, "home", true));
        }, false), on.call(this, u2, "click", () => {
          l.call(this, "home", false);
        }), c2.appendChild(u2), c2.appendChild(createElement("div", { role: "menu" })), r2.appendChild(c2), this.elements.settings.buttons[i2] = s3, this.elements.settings.panels[i2] = c2;
      }), n2.appendChild(r2), s2.appendChild(n2), c.appendChild(s2), this.elements.settings.popup = n2, this.elements.settings.menu = s2;
    }
    if ("pip" === a2 && support.pip && c.appendChild(i.call(this, "pip", u)), "airplay" === a2 && support.airplay && c.appendChild(i.call(this, "airplay", u)), "download" === a2) {
      const e2 = extend({}, u, { element: "a", href: this.download, target: "_blank" });
      this.isHTML5 && (e2.download = "");
      const { download: t2 } = this.config.urls;
      !is.url(t2) && this.isEmbed && extend(e2, { icon: `logo-${this.provider}`, label: this.provider }), c.appendChild(i.call(this, "download", e2));
    }
    "fullscreen" === a2 && c.appendChild(i.call(this, "fullscreen", u));
  }), this.isHTML5 && a.call(this, html5.getQualityOptions.call(this)), o.call(this), c;
}, inject() {
  if (this.config.loadSprite) {
    const e2 = controls.getIconUrl.call(this);
    e2.cors && loadSprite(e2.url, "sprite-plyr");
  }
  this.id = Math.floor(1e4 * Math.random());
  let e = null;
  this.elements.controls = null;
  const t = { id: this.id, seektime: this.config.seekTime, title: this.config.title };
  let i = true;
  is.function(this.config.controls) && (this.config.controls = this.config.controls.call(this, t)), this.config.controls || (this.config.controls = []), is.element(this.config.controls) || is.string(this.config.controls) ? e = this.config.controls : (e = controls.create.call(this, { id: this.id, seektime: this.config.seekTime, speed: this.speed, quality: this.quality, captions: captions.getLabel.call(this) }), i = false);
  let s;
  i && is.string(this.config.controls) && (e = ((e2) => {
    let i2 = e2;
    return Object.entries(t).forEach(([e3, t2]) => {
      i2 = replaceAll(i2, `{${e3}}`, t2);
    }), i2;
  })(e)), is.string(this.config.selectors.controls.container) && (s = document.querySelector(this.config.selectors.controls.container)), is.element(s) || (s = this.elements.container);
  if (s[is.element(e) ? "insertAdjacentElement" : "insertAdjacentHTML"]("afterbegin", e), is.element(this.elements.controls) || controls.findElements.call(this), !is.empty(this.elements.buttons)) {
    const e2 = (e3) => {
      const t2 = this.config.classNames.controlPressed;
      e3.setAttribute("aria-pressed", "false"), Object.defineProperty(e3, "pressed", { configurable: true, enumerable: true, get: () => hasClass(e3, t2), set(i2 = false) {
        toggleClass(e3, t2, i2), e3.setAttribute("aria-pressed", i2 ? "true" : "false");
      } });
    };
    Object.values(this.elements.buttons).filter(Boolean).forEach((t2) => {
      is.array(t2) || is.nodeList(t2) ? Array.from(t2).filter(Boolean).forEach(e2) : e2(t2);
    });
  }
  if (browser.isEdge && repaint(s), this.config.tooltips.controls) {
    const { classNames: e2, selectors: t2 } = this.config, i2 = `${t2.controls.wrapper} ${t2.labels} .${e2.hidden}`, s2 = getElements.call(this, i2);
    Array.from(s2).forEach((e3) => {
      toggleClass(e3, this.config.classNames.hidden, false), toggleClass(e3, this.config.classNames.tooltip, true);
    });
  }
}, setMediaMetadata() {
  try {
    "mediaSession" in navigator && (navigator.mediaSession.metadata = new window.MediaMetadata({ title: this.config.mediaMetadata.title, artist: this.config.mediaMetadata.artist, album: this.config.mediaMetadata.album, artwork: this.config.mediaMetadata.artwork }));
  } catch (e) {
  }
}, setMarkers() {
  var e, t;
  if (!this.duration || this.elements.markers)
    return;
  const i = null === (e = this.config.markers) || void 0 === e || null === (t = e.points) || void 0 === t ? void 0 : t.filter(({ time: e2 }) => e2 > 0 && e2 < this.duration);
  if (null == i || !i.length)
    return;
  const s = document.createDocumentFragment(), n = document.createDocumentFragment();
  let r = null;
  const a = `${this.config.classNames.tooltip}--visible`, o = (e2) => toggleClass(r, a, e2);
  i.forEach((e2) => {
    const t2 = createElement("span", { class: this.config.classNames.marker }, ""), i2 = e2.time / this.duration * 100 + "%";
    r && (t2.addEventListener("mouseenter", () => {
      e2.label || (r.style.left = i2, r.innerHTML = e2.label, o(true));
    }), t2.addEventListener("mouseleave", () => {
      o(false);
    })), t2.addEventListener("click", () => {
      this.currentTime = e2.time;
    }), t2.style.left = i2, n.appendChild(t2);
  }), s.appendChild(n), this.config.tooltips.seek || (r = createElement("span", { class: this.config.classNames.tooltip }, ""), s.appendChild(r)), this.elements.markers = { points: n, tip: r }, this.elements.progress.appendChild(s);
} };
function parseUrl(e, t = true) {
  let i = e;
  if (t) {
    const e2 = document.createElement("a");
    e2.href = i, i = e2.href;
  }
  try {
    return new URL(i);
  } catch (e2) {
    return null;
  }
}
function buildUrlParams(e) {
  const t = new URLSearchParams();
  return is.object(e) && Object.entries(e).forEach(([e2, i]) => {
    t.set(e2, i);
  }), t;
}
const captions = { setup() {
  if (!this.supported.ui)
    return;
  if (!this.isVideo || this.isYouTube || this.isHTML5 && !support.textTracks)
    return void (is.array(this.config.controls) && this.config.controls.includes("settings") && this.config.settings.includes("captions") && controls.setCaptionsMenu.call(this));
  if (is.element(this.elements.captions) || (this.elements.captions = createElement("div", getAttributesFromSelector(this.config.selectors.captions)), this.elements.captions.setAttribute("dir", "auto"), insertAfter(this.elements.captions, this.elements.wrapper)), browser.isIE && window.URL) {
    const e2 = this.media.querySelectorAll("track");
    Array.from(e2).forEach((e3) => {
      const t2 = e3.getAttribute("src"), i2 = parseUrl(t2);
      null !== i2 && i2.hostname !== window.location.href.hostname && ["http:", "https:"].includes(i2.protocol) && fetch(t2, "blob").then((t3) => {
        e3.setAttribute("src", window.URL.createObjectURL(t3));
      }).catch(() => {
        removeElement(e3);
      });
    });
  }
  const e = dedupe((navigator.languages || [navigator.language || navigator.userLanguage || "en"]).map((e2) => e2.split("-")[0]));
  let t = (this.storage.get("language") || this.config.captions.language || "auto").toLowerCase();
  "auto" === t && ([t] = e);
  let i = this.storage.get("captions");
  if (is.boolean(i) || ({ active: i } = this.config.captions), Object.assign(this.captions, { toggled: false, active: i, language: t, languages: e }), this.isHTML5) {
    const e2 = this.config.captions.update ? "addtrack removetrack" : "removetrack";
    on.call(this, this.media.textTracks, e2, captions.update.bind(this));
  }
  setTimeout(captions.update.bind(this), 0);
}, update() {
  const e = captions.getTracks.call(this, true), { active: t, language: i, meta: s, currentTrackNode: n } = this.captions, r = Boolean(e.find((e2) => e2.language === i));
  this.isHTML5 && this.isVideo && e.filter((e2) => !s.get(e2)).forEach((e2) => {
    this.debug.log("Track added", e2), s.set(e2, { default: "showing" === e2.mode }), "showing" === e2.mode && (e2.mode = "hidden"), on.call(this, e2, "cuechange", () => captions.updateCues.call(this));
  }), (r && this.language !== i || !e.includes(n)) && (captions.setLanguage.call(this, i), captions.toggle.call(this, t && r)), this.elements && toggleClass(this.elements.container, this.config.classNames.captions.enabled, !is.empty(e)), is.array(this.config.controls) && this.config.controls.includes("settings") && this.config.settings.includes("captions") && controls.setCaptionsMenu.call(this);
}, toggle(e, t = true) {
  if (!this.supported.ui)
    return;
  const { toggled: i } = this.captions, s = this.config.classNames.captions.active, n = is.nullOrUndefined(e) ? !i : e;
  if (n !== i) {
    if (t || (this.captions.active = n, this.storage.set({ captions: n })), !this.language && n && !t) {
      const e2 = captions.getTracks.call(this), t2 = captions.findTrack.call(this, [this.captions.language, ...this.captions.languages], true);
      return this.captions.language = t2.language, void captions.set.call(this, e2.indexOf(t2));
    }
    this.elements.buttons.captions && (this.elements.buttons.captions.pressed = n), toggleClass(this.elements.container, s, n), this.captions.toggled = n, controls.updateSetting.call(this, "captions"), triggerEvent.call(this, this.media, n ? "captionsenabled" : "captionsdisabled");
  }
  setTimeout(() => {
    n && this.captions.toggled && (this.captions.currentTrackNode.mode = "hidden");
  });
}, set(e, t = true) {
  const i = captions.getTracks.call(this);
  if (-1 !== e)
    if (is.number(e))
      if (e in i) {
        if (this.captions.currentTrack !== e) {
          this.captions.currentTrack = e;
          const s = i[e], { language: n } = s || {};
          this.captions.currentTrackNode = s, controls.updateSetting.call(this, "captions"), t || (this.captions.language = n, this.storage.set({ language: n })), this.isVimeo && this.embed.enableTextTrack(n), triggerEvent.call(this, this.media, "languagechange");
        }
        captions.toggle.call(this, true, t), this.isHTML5 && this.isVideo && captions.updateCues.call(this);
      } else
        this.debug.warn("Track not found", e);
    else
      this.debug.warn("Invalid caption argument", e);
  else
    captions.toggle.call(this, false, t);
}, setLanguage(e, t = true) {
  if (!is.string(e))
    return void this.debug.warn("Invalid language argument", e);
  const i = e.toLowerCase();
  this.captions.language = i;
  const s = captions.getTracks.call(this), n = captions.findTrack.call(this, [i]);
  captions.set.call(this, s.indexOf(n), t);
}, getTracks(e = false) {
  return Array.from((this.media || {}).textTracks || []).filter((t) => !this.isHTML5 || e || this.captions.meta.has(t)).filter((e2) => ["captions", "subtitles"].includes(e2.kind));
}, findTrack(e, t = false) {
  const i = captions.getTracks.call(this), s = (e2) => Number((this.captions.meta.get(e2) || {}).default), n = Array.from(i).sort((e2, t2) => s(t2) - s(e2));
  let r;
  return e.every((e2) => (r = n.find((t2) => t2.language === e2), !r)), r || (t ? n[0] : void 0);
}, getCurrentTrack() {
  return captions.getTracks.call(this)[this.currentTrack];
}, getLabel(e) {
  let t = e;
  return !is.track(t) && support.textTracks && this.captions.toggled && (t = captions.getCurrentTrack.call(this)), is.track(t) ? is.empty(t.label) ? is.empty(t.language) ? i18n.get("enabled", this.config) : e.language.toUpperCase() : t.label : i18n.get("disabled", this.config);
}, updateCues(e) {
  if (!this.supported.ui)
    return;
  if (!is.element(this.elements.captions))
    return void this.debug.warn("No captions element to render to");
  if (!is.nullOrUndefined(e) && !Array.isArray(e))
    return void this.debug.warn("updateCues: Invalid input", e);
  let t = e;
  if (!t) {
    const e2 = captions.getCurrentTrack.call(this);
    t = Array.from((e2 || {}).activeCues || []).map((e3) => e3.getCueAsHTML()).map(getHTML);
  }
  const i = t.map((e2) => e2.trim()).join("\n");
  if (i !== this.elements.captions.innerHTML) {
    emptyElement(this.elements.captions);
    const e2 = createElement("span", getAttributesFromSelector(this.config.selectors.caption));
    e2.innerHTML = i, this.elements.captions.appendChild(e2), triggerEvent.call(this, this.media, "cuechange");
  }
} }, defaults = { enabled: true, title: "", debug: false, autoplay: false, autopause: true, playsinline: true, seekTime: 10, volume: 1, muted: false, duration: null, displayDuration: true, invertTime: true, toggleInvert: true, ratio: null, clickToPlay: true, hideControls: true, resetOnEnd: false, disableContextMenu: true, loadSprite: true, iconPrefix: "plyr", iconUrl: "https://cdn.plyr.io/3.7.8/plyr.svg", blankVideo: "https://cdn.plyr.io/static/blank.mp4", quality: { default: 576, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240], forced: false, onChange: null }, loop: { active: false }, speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4] }, keyboard: { focused: true, global: false }, tooltips: { controls: false, seek: true }, captions: { active: false, language: "auto", update: false }, fullscreen: { enabled: true, fallback: true, iosNative: false }, storage: { enabled: true, key: "plyr" }, controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "captions", "settings", "pip", "airplay", "fullscreen"], settings: ["captions", "quality", "speed"], i18n: { restart: "Restart", rewind: "Rewind {seektime}s", play: "Play", pause: "Pause", fastForward: "Forward {seektime}s", seek: "Seek", seekLabel: "{currentTime} of {duration}", played: "Played", buffered: "Buffered", currentTime: "Current time", duration: "Duration", volume: "Volume", mute: "Mute", unmute: "Unmute", enableCaptions: "Enable captions", disableCaptions: "Disable captions", download: "Download", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", frameTitle: "Player for {title}", captions: "Captions", settings: "Settings", pip: "PIP", menuBack: "Go back to previous menu", speed: "Speed", normal: "Normal", quality: "Quality", loop: "Loop", start: "Start", end: "End", all: "All", reset: "Reset", disabled: "Disabled", enabled: "Enabled", advertisement: "Ad", qualityBadge: { 2160: "4K", 1440: "HD", 1080: "HD", 720: "HD", 576: "SD", 480: "SD" } }, urls: { download: null, vimeo: { sdk: "https://player.vimeo.com/api/player.js", iframe: "https://player.vimeo.com/video/{0}?{1}", api: "https://vimeo.com/api/oembed.json?url={0}" }, youtube: { sdk: "https://www.youtube.com/iframe_api", api: "https://noembed.com/embed?url=https://www.youtube.com/watch?v={0}" }, googleIMA: { sdk: "https://imasdk.googleapis.com/js/sdkloader/ima3.js" } }, listeners: { seek: null, play: null, pause: null, restart: null, rewind: null, fastForward: null, mute: null, volume: null, captions: null, download: null, fullscreen: null, pip: null, airplay: null, speed: null, quality: null, loop: null, language: null }, events: ["ended", "progress", "stalled", "playing", "waiting", "canplay", "canplaythrough", "loadstart", "loadeddata", "loadedmetadata", "timeupdate", "volumechange", "play", "pause", "error", "seeking", "seeked", "emptied", "ratechange", "cuechange", "download", "enterfullscreen", "exitfullscreen", "captionsenabled", "captionsdisabled", "languagechange", "controlshidden", "controlsshown", "ready", "statechange", "qualitychange", "adsloaded", "adscontentpause", "adscontentresume", "adstarted", "adsmidpoint", "adscomplete", "adsallcomplete", "adsimpression", "adsclick"], selectors: { editable: "input, textarea, select, [contenteditable]", container: ".plyr", controls: { container: null, wrapper: ".plyr__controls" }, labels: "[data-plyr]", buttons: { play: '[data-plyr="play"]', pause: '[data-plyr="pause"]', restart: '[data-plyr="restart"]', rewind: '[data-plyr="rewind"]', fastForward: '[data-plyr="fast-forward"]', mute: '[data-plyr="mute"]', captions: '[data-plyr="captions"]', download: '[data-plyr="download"]', fullscreen: '[data-plyr="fullscreen"]', pip: '[data-plyr="pip"]', airplay: '[data-plyr="airplay"]', settings: '[data-plyr="settings"]', loop: '[data-plyr="loop"]' }, inputs: { seek: '[data-plyr="seek"]', volume: '[data-plyr="volume"]', speed: '[data-plyr="speed"]', language: '[data-plyr="language"]', quality: '[data-plyr="quality"]' }, display: { currentTime: ".plyr__time--current", duration: ".plyr__time--duration", buffer: ".plyr__progress__buffer", loop: ".plyr__progress__loop", volume: ".plyr__volume--display" }, progress: ".plyr__progress", captions: ".plyr__captions", caption: ".plyr__caption" }, classNames: { type: "plyr--{0}", provider: "plyr--{0}", video: "plyr__video-wrapper", embed: "plyr__video-embed", videoFixedRatio: "plyr__video-wrapper--fixed-ratio", embedContainer: "plyr__video-embed__container", poster: "plyr__poster", posterEnabled: "plyr__poster-enabled", ads: "plyr__ads", control: "plyr__control", controlPressed: "plyr__control--pressed", playing: "plyr--playing", paused: "plyr--paused", stopped: "plyr--stopped", loading: "plyr--loading", hover: "plyr--hover", tooltip: "plyr__tooltip", cues: "plyr__cues", marker: "plyr__progress__marker", hidden: "plyr__sr-only", hideControls: "plyr--hide-controls", isTouch: "plyr--is-touch", uiSupported: "plyr--full-ui", noTransition: "plyr--no-transition", display: { time: "plyr__time" }, menu: { value: "plyr__menu__value", badge: "plyr__badge", open: "plyr--menu-open" }, captions: { enabled: "plyr--captions-enabled", active: "plyr--captions-active" }, fullscreen: { enabled: "plyr--fullscreen-enabled", fallback: "plyr--fullscreen-fallback" }, pip: { supported: "plyr--pip-supported", active: "plyr--pip-active" }, airplay: { supported: "plyr--airplay-supported", active: "plyr--airplay-active" }, previewThumbnails: { thumbContainer: "plyr__preview-thumb", thumbContainerShown: "plyr__preview-thumb--is-shown", imageContainer: "plyr__preview-thumb__image-container", timeContainer: "plyr__preview-thumb__time-container", scrubbingContainer: "plyr__preview-scrubbing", scrubbingContainerShown: "plyr__preview-scrubbing--is-shown" } }, attributes: { embed: { provider: "data-plyr-provider", id: "data-plyr-embed-id", hash: "data-plyr-embed-hash" } }, ads: { enabled: false, publisherId: "", tagUrl: "" }, previewThumbnails: { enabled: false, src: "" }, vimeo: { byline: false, portrait: false, title: false, speed: true, transparent: false, customControls: true, referrerPolicy: null, premium: false }, youtube: { rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1, customControls: true, noCookie: false }, mediaMetadata: { title: "", artist: "", album: "", artwork: [] }, markers: { enabled: false, points: [] } }, pip = { active: "picture-in-picture", inactive: "inline" }, providers = { html5: "html5", youtube: "youtube", vimeo: "vimeo" }, types = { audio: "audio", video: "video" };
function getProviderByUrl(e) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(e) ? providers.youtube : /^https?:\/\/player.vimeo.com\/video\/\d{0,9}(?=\b|\/)/.test(e) ? providers.vimeo : null;
}
const noop = () => {
};
class Console {
  constructor(e = false) {
    this.enabled = window.console && e, this.enabled && this.log("Debugging enabled");
  }
  get log() {
    return this.enabled ? Function.prototype.bind.call(console.log, console) : noop;
  }
  get warn() {
    return this.enabled ? Function.prototype.bind.call(console.warn, console) : noop;
  }
  get error() {
    return this.enabled ? Function.prototype.bind.call(console.error, console) : noop;
  }
}
class Fullscreen {
  constructor(e) {
    _defineProperty$1(this, "onChange", () => {
      if (!this.supported)
        return;
      const e2 = this.player.elements.buttons.fullscreen;
      is.element(e2) && (e2.pressed = this.active);
      const t = this.target === this.player.media ? this.target : this.player.elements.container;
      triggerEvent.call(this.player, t, this.active ? "enterfullscreen" : "exitfullscreen", true);
    }), _defineProperty$1(this, "toggleFallback", (e2 = false) => {
      var _a2, _b;
      if (e2 ? this.scrollPosition = { x: (_a2 = window.scrollX) != null ? _a2 : 0, y: (_b = window.scrollY) != null ? _b : 0 } : window.scrollTo(this.scrollPosition.x, this.scrollPosition.y), document.body.style.overflow = e2 ? "hidden" : "", toggleClass(this.target, this.player.config.classNames.fullscreen.fallback, e2), browser.isIos) {
        let t = document.head.querySelector('meta[name="viewport"]');
        const i = "viewport-fit=cover";
        t || (t = document.createElement("meta"), t.setAttribute("name", "viewport"));
        const s = is.string(t.content) && t.content.includes(i);
        e2 ? (this.cleanupViewport = !s, s || (t.content += `,${i}`)) : this.cleanupViewport && (t.content = t.content.split(",").filter((e3) => e3.trim() !== i).join(","));
      }
      this.onChange();
    }), _defineProperty$1(this, "trapFocus", (e2) => {
      if (browser.isIos || browser.isIPadOS || !this.active || "Tab" !== e2.key)
        return;
      const t = document.activeElement, i = getElements.call(this.player, "a[href], button:not(:disabled), input:not(:disabled), [tabindex]"), [s] = i, n = i[i.length - 1];
      t !== n || e2.shiftKey ? t === s && e2.shiftKey && (n.focus(), e2.preventDefault()) : (s.focus(), e2.preventDefault());
    }), _defineProperty$1(this, "update", () => {
      if (this.supported) {
        let e2;
        e2 = this.forceFallback ? "Fallback (forced)" : Fullscreen.nativeSupported ? "Native" : "Fallback", this.player.debug.log(`${e2} fullscreen enabled`);
      } else
        this.player.debug.log("Fullscreen not supported and fallback disabled");
      toggleClass(this.player.elements.container, this.player.config.classNames.fullscreen.enabled, this.supported);
    }), _defineProperty$1(this, "enter", () => {
      this.supported && (browser.isIos && this.player.config.fullscreen.iosNative ? this.player.isVimeo ? this.player.embed.requestFullscreen() : this.target.webkitEnterFullscreen() : !Fullscreen.nativeSupported || this.forceFallback ? this.toggleFallback(true) : this.prefix ? is.empty(this.prefix) || this.target[`${this.prefix}Request${this.property}`]() : this.target.requestFullscreen({ navigationUI: "hide" }));
    }), _defineProperty$1(this, "exit", () => {
      if (this.supported)
        if (browser.isIos && this.player.config.fullscreen.iosNative)
          this.player.isVimeo ? this.player.embed.exitFullscreen() : this.target.webkitEnterFullscreen(), silencePromise(this.player.play());
        else if (!Fullscreen.nativeSupported || this.forceFallback)
          this.toggleFallback(false);
        else if (this.prefix) {
          if (!is.empty(this.prefix)) {
            const e2 = "moz" === this.prefix ? "Cancel" : "Exit";
            document[`${this.prefix}${e2}${this.property}`]();
          }
        } else
          (document.cancelFullScreen || document.exitFullscreen).call(document);
    }), _defineProperty$1(this, "toggle", () => {
      this.active ? this.exit() : this.enter();
    }), this.player = e, this.prefix = Fullscreen.prefix, this.property = Fullscreen.property, this.scrollPosition = { x: 0, y: 0 }, this.forceFallback = "force" === e.config.fullscreen.fallback, this.player.elements.fullscreen = e.config.fullscreen.container && closest$1(this.player.elements.container, e.config.fullscreen.container), on.call(this.player, document, "ms" === this.prefix ? "MSFullscreenChange" : `${this.prefix}fullscreenchange`, () => {
      this.onChange();
    }), on.call(this.player, this.player.elements.container, "dblclick", (e2) => {
      is.element(this.player.elements.controls) && this.player.elements.controls.contains(e2.target) || this.player.listeners.proxy(e2, this.toggle, "fullscreen");
    }), on.call(this, this.player.elements.container, "keydown", (e2) => this.trapFocus(e2)), this.update();
  }
  static get nativeSupported() {
    return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
  }
  get useNative() {
    return Fullscreen.nativeSupported && !this.forceFallback;
  }
  static get prefix() {
    if (is.function(document.exitFullscreen))
      return "";
    let e = "";
    return ["webkit", "moz", "ms"].some((t) => !(!is.function(document[`${t}ExitFullscreen`]) && !is.function(document[`${t}CancelFullScreen`])) && (e = t, true)), e;
  }
  static get property() {
    return "moz" === this.prefix ? "FullScreen" : "Fullscreen";
  }
  get supported() {
    return [this.player.config.fullscreen.enabled, this.player.isVideo, Fullscreen.nativeSupported || this.player.config.fullscreen.fallback, !this.player.isYouTube || Fullscreen.nativeSupported || !browser.isIos || this.player.config.playsinline && !this.player.config.fullscreen.iosNative].every(Boolean);
  }
  get active() {
    if (!this.supported)
      return false;
    if (!Fullscreen.nativeSupported || this.forceFallback)
      return hasClass(this.target, this.player.config.classNames.fullscreen.fallback);
    const e = this.prefix ? this.target.getRootNode()[`${this.prefix}${this.property}Element`] : this.target.getRootNode().fullscreenElement;
    return e && e.shadowRoot ? e === this.target.getRootNode().host : e === this.target;
  }
  get target() {
    var _a2;
    return browser.isIos && this.player.config.fullscreen.iosNative ? this.player.media : (_a2 = this.player.elements.fullscreen) != null ? _a2 : this.player.elements.container;
  }
}
function loadImage(e, t = 1) {
  return new Promise((i, s) => {
    const n = new Image(), r = () => {
      delete n.onload, delete n.onerror, (n.naturalWidth >= t ? i : s)(n);
    };
    Object.assign(n, { onload: r, onerror: r, src: e });
  });
}
const ui = { addStyleHook() {
  toggleClass(this.elements.container, this.config.selectors.container.replace(".", ""), true), toggleClass(this.elements.container, this.config.classNames.uiSupported, this.supported.ui);
}, toggleNativeControls(e = false) {
  e && this.isHTML5 ? this.media.setAttribute("controls", "") : this.media.removeAttribute("controls");
}, build() {
  if (this.listeners.media(), !this.supported.ui)
    return this.debug.warn(`Basic support only for ${this.provider} ${this.type}`), void ui.toggleNativeControls.call(this, true);
  is.element(this.elements.controls) || (controls.inject.call(this), this.listeners.controls()), ui.toggleNativeControls.call(this), this.isHTML5 && captions.setup.call(this), this.volume = null, this.muted = null, this.loop = null, this.quality = null, this.speed = null, controls.updateVolume.call(this), controls.timeUpdate.call(this), controls.durationUpdate.call(this), ui.checkPlaying.call(this), toggleClass(this.elements.container, this.config.classNames.pip.supported, support.pip && this.isHTML5 && this.isVideo), toggleClass(this.elements.container, this.config.classNames.airplay.supported, support.airplay && this.isHTML5), toggleClass(this.elements.container, this.config.classNames.isTouch, this.touch), this.ready = true, setTimeout(() => {
    triggerEvent.call(this, this.media, "ready");
  }, 0), ui.setTitle.call(this), this.poster && ui.setPoster.call(this, this.poster, false).catch(() => {
  }), this.config.duration && controls.durationUpdate.call(this), this.config.mediaMetadata && controls.setMediaMetadata.call(this);
}, setTitle() {
  let e = i18n.get("play", this.config);
  if (is.string(this.config.title) && !is.empty(this.config.title) && (e += `, ${this.config.title}`), Array.from(this.elements.buttons.play || []).forEach((t) => {
    t.setAttribute("aria-label", e);
  }), this.isEmbed) {
    const e2 = getElement.call(this, "iframe");
    if (!is.element(e2))
      return;
    const t = is.empty(this.config.title) ? "video" : this.config.title, i = i18n.get("frameTitle", this.config);
    e2.setAttribute("title", i.replace("{title}", t));
  }
}, togglePoster(e) {
  toggleClass(this.elements.container, this.config.classNames.posterEnabled, e);
}, setPoster(e, t = true) {
  return t && this.poster ? Promise.reject(new Error("Poster already set")) : (this.media.setAttribute("data-poster", e), this.elements.poster.removeAttribute("hidden"), ready.call(this).then(() => loadImage(e)).catch((t2) => {
    throw e === this.poster && ui.togglePoster.call(this, false), t2;
  }).then(() => {
    if (e !== this.poster)
      throw new Error("setPoster cancelled by later call to setPoster");
  }).then(() => (Object.assign(this.elements.poster.style, { backgroundImage: `url('${e}')`, backgroundSize: "" }), ui.togglePoster.call(this, true), e)));
}, checkPlaying(e) {
  toggleClass(this.elements.container, this.config.classNames.playing, this.playing), toggleClass(this.elements.container, this.config.classNames.paused, this.paused), toggleClass(this.elements.container, this.config.classNames.stopped, this.stopped), Array.from(this.elements.buttons.play || []).forEach((e2) => {
    Object.assign(e2, { pressed: this.playing }), e2.setAttribute("aria-label", i18n.get(this.playing ? "pause" : "play", this.config));
  }), is.event(e) && "timeupdate" === e.type || ui.toggleControls.call(this);
}, checkLoading(e) {
  this.loading = ["stalled", "waiting"].includes(e.type), clearTimeout(this.timers.loading), this.timers.loading = setTimeout(() => {
    toggleClass(this.elements.container, this.config.classNames.loading, this.loading), ui.toggleControls.call(this);
  }, this.loading ? 250 : 0);
}, toggleControls(e) {
  const { controls: t } = this.elements;
  if (t && this.config.hideControls) {
    const i = this.touch && this.lastSeekTime + 2e3 > Date.now();
    this.toggleControls(Boolean(e || this.loading || this.paused || t.pressed || t.hover || i));
  }
}, migrateStyles() {
  Object.values({ ...this.media.style }).filter((e) => !is.empty(e) && is.string(e) && e.startsWith("--plyr")).forEach((e) => {
    this.elements.container.style.setProperty(e, this.media.style.getPropertyValue(e)), this.media.style.removeProperty(e);
  }), is.empty(this.media.style) && this.media.removeAttribute("style");
} };
class Listeners {
  constructor(e) {
    _defineProperty$1(this, "firstTouch", () => {
      const { player: e2 } = this, { elements: t } = e2;
      e2.touch = true, toggleClass(t.container, e2.config.classNames.isTouch, true);
    }), _defineProperty$1(this, "global", (e2 = true) => {
      const { player: t } = this;
      t.config.keyboard.global && toggleListener.call(t, window, "keydown keyup", this.handleKey, e2, false), toggleListener.call(t, document.body, "click", this.toggleMenu, e2), once.call(t, document.body, "touchstart", this.firstTouch);
    }), _defineProperty$1(this, "container", () => {
      const { player: e2 } = this, { config: t, elements: i, timers: s } = e2;
      !t.keyboard.global && t.keyboard.focused && on.call(e2, i.container, "keydown keyup", this.handleKey, false), on.call(e2, i.container, "mousemove mouseleave touchstart touchmove enterfullscreen exitfullscreen", (t2) => {
        const { controls: n2 } = i;
        n2 && "enterfullscreen" === t2.type && (n2.pressed = false, n2.hover = false);
        let r2 = 0;
        ["touchstart", "touchmove", "mousemove"].includes(t2.type) && (ui.toggleControls.call(e2, true), r2 = e2.touch ? 3e3 : 2e3), clearTimeout(s.controls), s.controls = setTimeout(() => ui.toggleControls.call(e2, false), r2);
      });
      const n = () => {
        if (!e2.isVimeo || e2.config.vimeo.premium)
          return;
        const t2 = i.wrapper, { active: s2 } = e2.fullscreen, [n2, r2] = getAspectRatio.call(e2), a = supportsCSS(`aspect-ratio: ${n2} / ${r2}`);
        if (!s2)
          return void (a ? (t2.style.width = null, t2.style.height = null) : (t2.style.maxWidth = null, t2.style.margin = null));
        const [o, l] = getViewportSize(), c = o / l > n2 / r2;
        a ? (t2.style.width = c ? "auto" : "100%", t2.style.height = c ? "100%" : "auto") : (t2.style.maxWidth = c ? l / r2 * n2 + "px" : null, t2.style.margin = c ? "0 auto" : null);
      }, r = () => {
        clearTimeout(s.resized), s.resized = setTimeout(n, 50);
      };
      on.call(e2, i.container, "enterfullscreen exitfullscreen", (t2) => {
        const { target: s2 } = e2.fullscreen;
        if (s2 !== i.container)
          return;
        if (!e2.isEmbed && is.empty(e2.config.ratio))
          return;
        n();
        ("enterfullscreen" === t2.type ? on : off).call(e2, window, "resize", r);
      });
    }), _defineProperty$1(this, "media", () => {
      const { player: e2 } = this, { elements: t } = e2;
      if (on.call(e2, e2.media, "timeupdate seeking seeked", (t2) => controls.timeUpdate.call(e2, t2)), on.call(e2, e2.media, "durationchange loadeddata loadedmetadata", (t2) => controls.durationUpdate.call(e2, t2)), on.call(e2, e2.media, "ended", () => {
        e2.isHTML5 && e2.isVideo && e2.config.resetOnEnd && (e2.restart(), e2.pause());
      }), on.call(e2, e2.media, "progress playing seeking seeked", (t2) => controls.updateProgress.call(e2, t2)), on.call(e2, e2.media, "volumechange", (t2) => controls.updateVolume.call(e2, t2)), on.call(e2, e2.media, "playing play pause ended emptied timeupdate", (t2) => ui.checkPlaying.call(e2, t2)), on.call(e2, e2.media, "waiting canplay seeked playing", (t2) => ui.checkLoading.call(e2, t2)), e2.supported.ui && e2.config.clickToPlay && !e2.isAudio) {
        const i2 = getElement.call(e2, `.${e2.config.classNames.video}`);
        if (!is.element(i2))
          return;
        on.call(e2, t.container, "click", (s) => {
          ([t.container, i2].includes(s.target) || i2.contains(s.target)) && (e2.touch && e2.config.hideControls || (e2.ended ? (this.proxy(s, e2.restart, "restart"), this.proxy(s, () => {
            silencePromise(e2.play());
          }, "play")) : this.proxy(s, () => {
            silencePromise(e2.togglePlay());
          }, "play")));
        });
      }
      e2.supported.ui && e2.config.disableContextMenu && on.call(e2, t.wrapper, "contextmenu", (e3) => {
        e3.preventDefault();
      }, false), on.call(e2, e2.media, "volumechange", () => {
        e2.storage.set({ volume: e2.volume, muted: e2.muted });
      }), on.call(e2, e2.media, "ratechange", () => {
        controls.updateSetting.call(e2, "speed"), e2.storage.set({ speed: e2.speed });
      }), on.call(e2, e2.media, "qualitychange", (t2) => {
        controls.updateSetting.call(e2, "quality", null, t2.detail.quality);
      }), on.call(e2, e2.media, "ready qualitychange", () => {
        controls.setDownloadUrl.call(e2);
      });
      const i = e2.config.events.concat(["keyup", "keydown"]).join(" ");
      on.call(e2, e2.media, i, (i2) => {
        let { detail: s = {} } = i2;
        "error" === i2.type && (s = e2.media.error), triggerEvent.call(e2, t.container, i2.type, true, s);
      });
    }), _defineProperty$1(this, "proxy", (e2, t, i) => {
      const { player: s } = this, n = s.config.listeners[i];
      let r = true;
      is.function(n) && (r = n.call(s, e2)), false !== r && is.function(t) && t.call(s, e2);
    }), _defineProperty$1(this, "bind", (e2, t, i, s, n = true) => {
      const { player: r } = this, a = r.config.listeners[s], o = is.function(a);
      on.call(r, e2, t, (e3) => this.proxy(e3, i, s), n && !o);
    }), _defineProperty$1(this, "controls", () => {
      const { player: e2 } = this, { elements: t } = e2, i = browser.isIE ? "change" : "input";
      if (t.buttons.play && Array.from(t.buttons.play).forEach((t2) => {
        this.bind(t2, "click", () => {
          silencePromise(e2.togglePlay());
        }, "play");
      }), this.bind(t.buttons.restart, "click", e2.restart, "restart"), this.bind(t.buttons.rewind, "click", () => {
        e2.lastSeekTime = Date.now(), e2.rewind();
      }, "rewind"), this.bind(t.buttons.fastForward, "click", () => {
        e2.lastSeekTime = Date.now(), e2.forward();
      }, "fastForward"), this.bind(t.buttons.mute, "click", () => {
        e2.muted = !e2.muted;
      }, "mute"), this.bind(t.buttons.captions, "click", () => e2.toggleCaptions()), this.bind(t.buttons.download, "click", () => {
        triggerEvent.call(e2, e2.media, "download");
      }, "download"), this.bind(t.buttons.fullscreen, "click", () => {
        e2.fullscreen.toggle();
      }, "fullscreen"), this.bind(t.buttons.pip, "click", () => {
        e2.pip = "toggle";
      }, "pip"), this.bind(t.buttons.airplay, "click", e2.airplay, "airplay"), this.bind(t.buttons.settings, "click", (t2) => {
        t2.stopPropagation(), t2.preventDefault(), controls.toggleMenu.call(e2, t2);
      }, null, false), this.bind(t.buttons.settings, "keyup", (t2) => {
        [" ", "Enter"].includes(t2.key) && ("Enter" !== t2.key ? (t2.preventDefault(), t2.stopPropagation(), controls.toggleMenu.call(e2, t2)) : controls.focusFirstMenuItem.call(e2, null, true));
      }, null, false), this.bind(t.settings.menu, "keydown", (t2) => {
        "Escape" === t2.key && controls.toggleMenu.call(e2, t2);
      }), this.bind(t.inputs.seek, "mousedown mousemove", (e3) => {
        const i2 = t.progress.getBoundingClientRect(), s = 100 / i2.width * (e3.pageX - i2.left);
        e3.currentTarget.setAttribute("seek-value", s);
      }), this.bind(t.inputs.seek, "mousedown mouseup keydown keyup touchstart touchend", (t2) => {
        const i2 = t2.currentTarget, s = "play-on-seeked";
        if (is.keyboardEvent(t2) && !["ArrowLeft", "ArrowRight"].includes(t2.key))
          return;
        e2.lastSeekTime = Date.now();
        const n = i2.hasAttribute(s), r = ["mouseup", "touchend", "keyup"].includes(t2.type);
        n && r ? (i2.removeAttribute(s), silencePromise(e2.play())) : !r && e2.playing && (i2.setAttribute(s, ""), e2.pause());
      }), browser.isIos) {
        const t2 = getElements.call(e2, 'input[type="range"]');
        Array.from(t2).forEach((e3) => this.bind(e3, i, (e4) => repaint(e4.target)));
      }
      this.bind(t.inputs.seek, i, (t2) => {
        const i2 = t2.currentTarget;
        let s = i2.getAttribute("seek-value");
        is.empty(s) && (s = i2.value), i2.removeAttribute("seek-value"), e2.currentTime = s / i2.max * e2.duration;
      }, "seek"), this.bind(t.progress, "mouseenter mouseleave mousemove", (t2) => controls.updateSeekTooltip.call(e2, t2)), this.bind(t.progress, "mousemove touchmove", (t2) => {
        const { previewThumbnails: i2 } = e2;
        i2 && i2.loaded && i2.startMove(t2);
      }), this.bind(t.progress, "mouseleave touchend click", () => {
        const { previewThumbnails: t2 } = e2;
        t2 && t2.loaded && t2.endMove(false, true);
      }), this.bind(t.progress, "mousedown touchstart", (t2) => {
        const { previewThumbnails: i2 } = e2;
        i2 && i2.loaded && i2.startScrubbing(t2);
      }), this.bind(t.progress, "mouseup touchend", (t2) => {
        const { previewThumbnails: i2 } = e2;
        i2 && i2.loaded && i2.endScrubbing(t2);
      }), browser.isWebKit && Array.from(getElements.call(e2, 'input[type="range"]')).forEach((t2) => {
        this.bind(t2, "input", (t3) => controls.updateRangeFill.call(e2, t3.target));
      }), e2.config.toggleInvert && !is.element(t.display.duration) && this.bind(t.display.currentTime, "click", () => {
        0 !== e2.currentTime && (e2.config.invertTime = !e2.config.invertTime, controls.timeUpdate.call(e2));
      }), this.bind(t.inputs.volume, i, (t2) => {
        e2.volume = t2.target.value;
      }, "volume"), this.bind(t.controls, "mouseenter mouseleave", (i2) => {
        t.controls.hover = !e2.touch && "mouseenter" === i2.type;
      }), t.fullscreen && Array.from(t.fullscreen.children).filter((e3) => !e3.contains(t.container)).forEach((i2) => {
        this.bind(i2, "mouseenter mouseleave", (i3) => {
          t.controls && (t.controls.hover = !e2.touch && "mouseenter" === i3.type);
        });
      }), this.bind(t.controls, "mousedown mouseup touchstart touchend touchcancel", (e3) => {
        t.controls.pressed = ["mousedown", "touchstart"].includes(e3.type);
      }), this.bind(t.controls, "focusin", () => {
        const { config: i2, timers: s } = e2;
        toggleClass(t.controls, i2.classNames.noTransition, true), ui.toggleControls.call(e2, true), setTimeout(() => {
          toggleClass(t.controls, i2.classNames.noTransition, false);
        }, 0);
        const n = this.touch ? 3e3 : 4e3;
        clearTimeout(s.controls), s.controls = setTimeout(() => ui.toggleControls.call(e2, false), n);
      }), this.bind(t.inputs.volume, "wheel", (t2) => {
        const i2 = t2.webkitDirectionInvertedFromDevice, [s, n] = [t2.deltaX, -t2.deltaY].map((e3) => i2 ? -e3 : e3), r = Math.sign(Math.abs(s) > Math.abs(n) ? s : n);
        e2.increaseVolume(r / 50);
        const { volume: a } = e2.media;
        (1 === r && a < 1 || -1 === r && a > 0) && t2.preventDefault();
      }, "volume", false);
    }), this.player = e, this.lastKey = null, this.focusTimer = null, this.lastKeyDown = null, this.handleKey = this.handleKey.bind(this), this.toggleMenu = this.toggleMenu.bind(this), this.firstTouch = this.firstTouch.bind(this);
  }
  handleKey(e) {
    const { player: t } = this, { elements: i } = t, { key: s, type: n, altKey: r, ctrlKey: a, metaKey: o, shiftKey: l } = e, c = "keydown" === n, u = c && s === this.lastKey;
    if (r || a || o || l)
      return;
    if (!s)
      return;
    if (c) {
      const n2 = document.activeElement;
      if (is.element(n2)) {
        const { editable: s2 } = t.config.selectors, { seek: r2 } = i.inputs;
        if (n2 !== r2 && matches(n2, s2))
          return;
        if (" " === e.key && matches(n2, 'button, [role^="menuitem"]'))
          return;
      }
      switch ([" ", "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "c", "f", "k", "l", "m"].includes(s) && (e.preventDefault(), e.stopPropagation()), s) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          u || (d = parseInt(s, 10), t.currentTime = t.duration / 10 * d);
          break;
        case " ":
        case "k":
          u || silencePromise(t.togglePlay());
          break;
        case "ArrowUp":
          t.increaseVolume(0.1);
          break;
        case "ArrowDown":
          t.decreaseVolume(0.1);
          break;
        case "m":
          u || (t.muted = !t.muted);
          break;
        case "ArrowRight":
          t.forward();
          break;
        case "ArrowLeft":
          t.rewind();
          break;
        case "f":
          t.fullscreen.toggle();
          break;
        case "c":
          u || t.toggleCaptions();
          break;
        case "l":
          t.loop = !t.loop;
      }
      "Escape" === s && !t.fullscreen.usingNative && t.fullscreen.active && t.fullscreen.toggle(), this.lastKey = s;
    } else
      this.lastKey = null;
    var d;
  }
  toggleMenu(e) {
    controls.toggleMenu.call(this.player, e);
  }
}
function createCommonjsModule(e, t) {
  return e(t = { exports: {} }, t.exports), t.exports;
}
var loadjs_umd = createCommonjsModule(function(e, t) {
  e.exports = function() {
    var e2 = function() {
    }, t2 = {}, i = {}, s = {};
    function n(e3, t3) {
      e3 = e3.push ? e3 : [e3];
      var n2, r2, a2, o2 = [], l2 = e3.length, c2 = l2;
      for (n2 = function(e4, i2) {
        i2.length && o2.push(e4), --c2 || t3(o2);
      }; l2--; )
        r2 = e3[l2], (a2 = i[r2]) ? n2(r2, a2) : (s[r2] = s[r2] || []).push(n2);
    }
    function r(e3, t3) {
      if (e3) {
        var n2 = s[e3];
        if (i[e3] = t3, n2)
          for (; n2.length; )
            n2[0](e3, t3), n2.splice(0, 1);
      }
    }
    function a(t3, i2) {
      t3.call && (t3 = { success: t3 }), i2.length ? (t3.error || e2)(i2) : (t3.success || e2)(t3);
    }
    function o(t3, i2, s2, n2) {
      var r2, a2, l2 = document, c2 = s2.async, u = (s2.numRetries || 0) + 1, d = s2.before || e2, h = t3.replace(/[\?|#].*$/, ""), m = t3.replace(/^(css|img)!/, "");
      n2 = n2 || 0, /(^css!|\.css$)/.test(h) ? ((a2 = l2.createElement("link")).rel = "stylesheet", a2.href = m, (r2 = "hideFocus" in a2) && a2.relList && (r2 = 0, a2.rel = "preload", a2.as = "style")) : /(^img!|\.(png|gif|jpg|svg|webp)$)/.test(h) ? (a2 = l2.createElement("img")).src = m : ((a2 = l2.createElement("script")).src = t3, a2.async = void 0 === c2 || c2), a2.onload = a2.onerror = a2.onbeforeload = function(e3) {
        var l3 = e3.type[0];
        if (r2)
          try {
            a2.sheet.cssText.length || (l3 = "e");
          } catch (e4) {
            18 != e4.code && (l3 = "e");
          }
        if ("e" == l3) {
          if ((n2 += 1) < u)
            return o(t3, i2, s2, n2);
        } else if ("preload" == a2.rel && "style" == a2.as)
          return a2.rel = "stylesheet";
        i2(t3, l3, e3.defaultPrevented);
      }, false !== d(t3, a2) && l2.head.appendChild(a2);
    }
    function l(e3, t3, i2) {
      var s2, n2, r2 = (e3 = e3.push ? e3 : [e3]).length, a2 = r2, l2 = [];
      for (s2 = function(e4, i3, s3) {
        if ("e" == i3 && l2.push(e4), "b" == i3) {
          if (!s3)
            return;
          l2.push(e4);
        }
        --r2 || t3(l2);
      }, n2 = 0; n2 < a2; n2++)
        o(e3[n2], s2, i2);
    }
    function c(e3, i2, s2) {
      var n2, o2;
      if (i2 && i2.trim && (n2 = i2), o2 = (n2 ? s2 : i2) || {}, n2) {
        if (n2 in t2)
          throw "LoadJS";
        t2[n2] = true;
      }
      function c2(t3, i3) {
        l(e3, function(e4) {
          a(o2, e4), t3 && a({ success: t3, error: i3 }, e4), r(n2, e4);
        }, o2);
      }
      if (o2.returnPromise)
        return new Promise(c2);
      c2();
    }
    return c.ready = function(e3, t3) {
      return n(e3, function(e4) {
        a(t3, e4);
      }), c;
    }, c.done = function(e3) {
      r(e3, []);
    }, c.reset = function() {
      t2 = {}, i = {}, s = {};
    }, c.isDefined = function(e3) {
      return e3 in t2;
    }, c;
  }();
});
function loadScript(e) {
  return new Promise((t, i) => {
    loadjs_umd(e, { success: t, error: i });
  });
}
function parseId$1(e) {
  if (is.empty(e))
    return null;
  if (is.number(Number(e)))
    return e;
  return e.match(/^.*(vimeo.com\/|video\/)(\d+).*/) ? RegExp.$2 : e;
}
function parseHash(e) {
  const t = e.match(/^.*(vimeo.com\/|video\/)(\d+)(\?.*&*h=|\/)+([\d,a-f]+)/);
  return t && 5 === t.length ? t[4] : null;
}
function assurePlaybackState$1(e) {
  e && !this.embed.hasPlayed && (this.embed.hasPlayed = true), this.media.paused === e && (this.media.paused = !e, triggerEvent.call(this, this.media, e ? "play" : "pause"));
}
const vimeo = { setup() {
  const e = this;
  toggleClass(e.elements.wrapper, e.config.classNames.embed, true), e.options.speed = e.config.speed.options, setAspectRatio.call(e), is.object(window.Vimeo) ? vimeo.ready.call(e) : loadScript(e.config.urls.vimeo.sdk).then(() => {
    vimeo.ready.call(e);
  }).catch((t) => {
    e.debug.warn("Vimeo SDK (player.js) failed to load", t);
  });
}, ready() {
  const e = this, t = e.config.vimeo, { premium: i, referrerPolicy: s, ...n } = t;
  let r = e.media.getAttribute("src"), a = "";
  is.empty(r) ? (r = e.media.getAttribute(e.config.attributes.embed.id), a = e.media.getAttribute(e.config.attributes.embed.hash)) : a = parseHash(r);
  const o = a ? { h: a } : {};
  i && Object.assign(n, { controls: false, sidedock: false });
  const l = buildUrlParams({ loop: e.config.loop.active, autoplay: e.autoplay, muted: e.muted, gesture: "media", playsinline: e.config.playsinline, ...o, ...n }), c = parseId$1(r), u = createElement("iframe"), d = format(e.config.urls.vimeo.iframe, c, l);
  if (u.setAttribute("src", d), u.setAttribute("allowfullscreen", ""), u.setAttribute("allow", ["autoplay", "fullscreen", "picture-in-picture", "encrypted-media", "accelerometer", "gyroscope"].join("; ")), is.empty(s) || u.setAttribute("referrerPolicy", s), i || !t.customControls)
    u.setAttribute("data-poster", e.poster), e.media = replaceElement(u, e.media);
  else {
    const t2 = createElement("div", { class: e.config.classNames.embedContainer, "data-poster": e.poster });
    t2.appendChild(u), e.media = replaceElement(t2, e.media);
  }
  t.customControls || fetch(format(e.config.urls.vimeo.api, d)).then((t2) => {
    !is.empty(t2) && t2.thumbnail_url && ui.setPoster.call(e, t2.thumbnail_url).catch(() => {
    });
  }), e.embed = new window.Vimeo.Player(u, { autopause: e.config.autopause, muted: e.muted }), e.media.paused = true, e.media.currentTime = 0, e.supported.ui && e.embed.disableTextTrack(), e.media.play = () => (assurePlaybackState$1.call(e, true), e.embed.play()), e.media.pause = () => (assurePlaybackState$1.call(e, false), e.embed.pause()), e.media.stop = () => {
    e.pause(), e.currentTime = 0;
  };
  let { currentTime: h } = e.media;
  Object.defineProperty(e.media, "currentTime", { get: () => h, set(t2) {
    const { embed: i2, media: s2, paused: n2, volume: r2 } = e, a2 = n2 && !i2.hasPlayed;
    s2.seeking = true, triggerEvent.call(e, s2, "seeking"), Promise.resolve(a2 && i2.setVolume(0)).then(() => i2.setCurrentTime(t2)).then(() => a2 && i2.pause()).then(() => a2 && i2.setVolume(r2)).catch(() => {
    });
  } });
  let m = e.config.speed.selected;
  Object.defineProperty(e.media, "playbackRate", { get: () => m, set(t2) {
    e.embed.setPlaybackRate(t2).then(() => {
      m = t2, triggerEvent.call(e, e.media, "ratechange");
    }).catch(() => {
      e.options.speed = [1];
    });
  } });
  let { volume: p } = e.config;
  Object.defineProperty(e.media, "volume", { get: () => p, set(t2) {
    e.embed.setVolume(t2).then(() => {
      p = t2, triggerEvent.call(e, e.media, "volumechange");
    });
  } });
  let { muted: g } = e.config;
  Object.defineProperty(e.media, "muted", { get: () => g, set(t2) {
    const i2 = !!is.boolean(t2) && t2;
    e.embed.setMuted(!!i2 || e.config.muted).then(() => {
      g = i2, triggerEvent.call(e, e.media, "volumechange");
    });
  } });
  let f, { loop: y } = e.config;
  Object.defineProperty(e.media, "loop", { get: () => y, set(t2) {
    const i2 = is.boolean(t2) ? t2 : e.config.loop.active;
    e.embed.setLoop(i2).then(() => {
      y = i2;
    });
  } }), e.embed.getVideoUrl().then((t2) => {
    f = t2, controls.setDownloadUrl.call(e);
  }).catch((e2) => {
    this.debug.warn(e2);
  }), Object.defineProperty(e.media, "currentSrc", { get: () => f }), Object.defineProperty(e.media, "ended", { get: () => e.currentTime === e.duration }), Promise.all([e.embed.getVideoWidth(), e.embed.getVideoHeight()]).then((t2) => {
    const [i2, s2] = t2;
    e.embed.ratio = roundAspectRatio(i2, s2), setAspectRatio.call(this);
  }), e.embed.setAutopause(e.config.autopause).then((t2) => {
    e.config.autopause = t2;
  }), e.embed.getVideoTitle().then((t2) => {
    e.config.title = t2, ui.setTitle.call(this);
  }), e.embed.getCurrentTime().then((t2) => {
    h = t2, triggerEvent.call(e, e.media, "timeupdate");
  }), e.embed.getDuration().then((t2) => {
    e.media.duration = t2, triggerEvent.call(e, e.media, "durationchange");
  }), e.embed.getTextTracks().then((t2) => {
    e.media.textTracks = t2, captions.setup.call(e);
  }), e.embed.on("cuechange", ({ cues: t2 = [] }) => {
    const i2 = t2.map((e2) => stripHTML(e2.text));
    captions.updateCues.call(e, i2);
  }), e.embed.on("loaded", () => {
    if (e.embed.getPaused().then((t2) => {
      assurePlaybackState$1.call(e, !t2), t2 || triggerEvent.call(e, e.media, "playing");
    }), is.element(e.embed.element) && e.supported.ui) {
      e.embed.element.setAttribute("tabindex", -1);
    }
  }), e.embed.on("bufferstart", () => {
    triggerEvent.call(e, e.media, "waiting");
  }), e.embed.on("bufferend", () => {
    triggerEvent.call(e, e.media, "playing");
  }), e.embed.on("play", () => {
    assurePlaybackState$1.call(e, true), triggerEvent.call(e, e.media, "playing");
  }), e.embed.on("pause", () => {
    assurePlaybackState$1.call(e, false);
  }), e.embed.on("timeupdate", (t2) => {
    e.media.seeking = false, h = t2.seconds, triggerEvent.call(e, e.media, "timeupdate");
  }), e.embed.on("progress", (t2) => {
    e.media.buffered = t2.percent, triggerEvent.call(e, e.media, "progress"), 1 === parseInt(t2.percent, 10) && triggerEvent.call(e, e.media, "canplaythrough"), e.embed.getDuration().then((t3) => {
      t3 !== e.media.duration && (e.media.duration = t3, triggerEvent.call(e, e.media, "durationchange"));
    });
  }), e.embed.on("seeked", () => {
    e.media.seeking = false, triggerEvent.call(e, e.media, "seeked");
  }), e.embed.on("ended", () => {
    e.media.paused = true, triggerEvent.call(e, e.media, "ended");
  }), e.embed.on("error", (t2) => {
    e.media.error = t2, triggerEvent.call(e, e.media, "error");
  }), t.customControls && setTimeout(() => ui.build.call(e), 0);
} };
function parseId(e) {
  if (is.empty(e))
    return null;
  return e.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) ? RegExp.$2 : e;
}
function assurePlaybackState(e) {
  e && !this.embed.hasPlayed && (this.embed.hasPlayed = true), this.media.paused === e && (this.media.paused = !e, triggerEvent.call(this, this.media, e ? "play" : "pause"));
}
function getHost(e) {
  return e.noCookie ? "https://www.youtube-nocookie.com" : "http:" === window.location.protocol ? "http://www.youtube.com" : void 0;
}
const youtube = { setup() {
  if (toggleClass(this.elements.wrapper, this.config.classNames.embed, true), is.object(window.YT) && is.function(window.YT.Player))
    youtube.ready.call(this);
  else {
    const e = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      is.function(e) && e(), youtube.ready.call(this);
    }, loadScript(this.config.urls.youtube.sdk).catch((e2) => {
      this.debug.warn("YouTube API failed to load", e2);
    });
  }
}, getTitle(e) {
  fetch(format(this.config.urls.youtube.api, e)).then((e2) => {
    if (is.object(e2)) {
      const { title: t, height: i, width: s } = e2;
      this.config.title = t, ui.setTitle.call(this), this.embed.ratio = roundAspectRatio(s, i);
    }
    setAspectRatio.call(this);
  }).catch(() => {
    setAspectRatio.call(this);
  });
}, ready() {
  const e = this, t = e.config.youtube, i = e.media && e.media.getAttribute("id");
  if (!is.empty(i) && i.startsWith("youtube-"))
    return;
  let s = e.media.getAttribute("src");
  is.empty(s) && (s = e.media.getAttribute(this.config.attributes.embed.id));
  const n = parseId(s), r = createElement("div", { id: generateId(e.provider), "data-poster": t.customControls ? e.poster : void 0 });
  if (e.media = replaceElement(r, e.media), t.customControls) {
    const t2 = (e2) => `https://i.ytimg.com/vi/${n}/${e2}default.jpg`;
    loadImage(t2("maxres"), 121).catch(() => loadImage(t2("sd"), 121)).catch(() => loadImage(t2("hq"))).then((t3) => ui.setPoster.call(e, t3.src)).then((t3) => {
      t3.includes("maxres") || (e.elements.poster.style.backgroundSize = "cover");
    }).catch(() => {
    });
  }
  e.embed = new window.YT.Player(e.media, { videoId: n, host: getHost(t), playerVars: extend({}, { autoplay: e.config.autoplay ? 1 : 0, hl: e.config.hl, controls: e.supported.ui && t.customControls ? 0 : 1, disablekb: 1, playsinline: e.config.playsinline && !e.config.fullscreen.iosNative ? 1 : 0, cc_load_policy: e.captions.active ? 1 : 0, cc_lang_pref: e.config.captions.language, widget_referrer: window ? window.location.href : null }, t), events: { onError(t2) {
    if (!e.media.error) {
      const i2 = t2.data, s2 = { 2: "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.", 5: "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.", 100: "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.", 101: "The owner of the requested video does not allow it to be played in embedded players.", 150: "The owner of the requested video does not allow it to be played in embedded players." }[i2] || "An unknown error occurred";
      e.media.error = { code: i2, message: s2 }, triggerEvent.call(e, e.media, "error");
    }
  }, onPlaybackRateChange(t2) {
    const i2 = t2.target;
    e.media.playbackRate = i2.getPlaybackRate(), triggerEvent.call(e, e.media, "ratechange");
  }, onReady(i2) {
    if (is.function(e.media.play))
      return;
    const s2 = i2.target;
    youtube.getTitle.call(e, n), e.media.play = () => {
      assurePlaybackState.call(e, true), s2.playVideo();
    }, e.media.pause = () => {
      assurePlaybackState.call(e, false), s2.pauseVideo();
    }, e.media.stop = () => {
      s2.stopVideo();
    }, e.media.duration = s2.getDuration(), e.media.paused = true, e.media.currentTime = 0, Object.defineProperty(e.media, "currentTime", { get: () => Number(s2.getCurrentTime()), set(t2) {
      e.paused && !e.embed.hasPlayed && e.embed.mute(), e.media.seeking = true, triggerEvent.call(e, e.media, "seeking"), s2.seekTo(t2);
    } }), Object.defineProperty(e.media, "playbackRate", { get: () => s2.getPlaybackRate(), set(e2) {
      s2.setPlaybackRate(e2);
    } });
    let { volume: r2 } = e.config;
    Object.defineProperty(e.media, "volume", { get: () => r2, set(t2) {
      r2 = t2, s2.setVolume(100 * r2), triggerEvent.call(e, e.media, "volumechange");
    } });
    let { muted: a } = e.config;
    Object.defineProperty(e.media, "muted", { get: () => a, set(t2) {
      const i3 = is.boolean(t2) ? t2 : a;
      a = i3, s2[i3 ? "mute" : "unMute"](), s2.setVolume(100 * r2), triggerEvent.call(e, e.media, "volumechange");
    } }), Object.defineProperty(e.media, "currentSrc", { get: () => s2.getVideoUrl() }), Object.defineProperty(e.media, "ended", { get: () => e.currentTime === e.duration });
    const o = s2.getAvailablePlaybackRates();
    e.options.speed = o.filter((t2) => e.config.speed.options.includes(t2)), e.supported.ui && t.customControls && e.media.setAttribute("tabindex", -1), triggerEvent.call(e, e.media, "timeupdate"), triggerEvent.call(e, e.media, "durationchange"), clearInterval(e.timers.buffering), e.timers.buffering = setInterval(() => {
      e.media.buffered = s2.getVideoLoadedFraction(), (null === e.media.lastBuffered || e.media.lastBuffered < e.media.buffered) && triggerEvent.call(e, e.media, "progress"), e.media.lastBuffered = e.media.buffered, 1 === e.media.buffered && (clearInterval(e.timers.buffering), triggerEvent.call(e, e.media, "canplaythrough"));
    }, 200), t.customControls && setTimeout(() => ui.build.call(e), 50);
  }, onStateChange(i2) {
    const s2 = i2.target;
    clearInterval(e.timers.playing);
    switch (e.media.seeking && [1, 2].includes(i2.data) && (e.media.seeking = false, triggerEvent.call(e, e.media, "seeked")), i2.data) {
      case -1:
        triggerEvent.call(e, e.media, "timeupdate"), e.media.buffered = s2.getVideoLoadedFraction(), triggerEvent.call(e, e.media, "progress");
        break;
      case 0:
        assurePlaybackState.call(e, false), e.media.loop ? (s2.stopVideo(), s2.playVideo()) : triggerEvent.call(e, e.media, "ended");
        break;
      case 1:
        t.customControls && !e.config.autoplay && e.media.paused && !e.embed.hasPlayed ? e.media.pause() : (assurePlaybackState.call(e, true), triggerEvent.call(e, e.media, "playing"), e.timers.playing = setInterval(() => {
          triggerEvent.call(e, e.media, "timeupdate");
        }, 50), e.media.duration !== s2.getDuration() && (e.media.duration = s2.getDuration(), triggerEvent.call(e, e.media, "durationchange")));
        break;
      case 2:
        e.muted || e.embed.unMute(), assurePlaybackState.call(e, false);
        break;
      case 3:
        triggerEvent.call(e, e.media, "waiting");
    }
    triggerEvent.call(e, e.elements.container, "statechange", false, { code: i2.data });
  } } });
} }, media = { setup() {
  this.media ? (toggleClass(this.elements.container, this.config.classNames.type.replace("{0}", this.type), true), toggleClass(this.elements.container, this.config.classNames.provider.replace("{0}", this.provider), true), this.isEmbed && toggleClass(this.elements.container, this.config.classNames.type.replace("{0}", "video"), true), this.isVideo && (this.elements.wrapper = createElement("div", { class: this.config.classNames.video }), wrap(this.media, this.elements.wrapper), this.elements.poster = createElement("div", { class: this.config.classNames.poster }), this.elements.wrapper.appendChild(this.elements.poster)), this.isHTML5 ? html5.setup.call(this) : this.isYouTube ? youtube.setup.call(this) : this.isVimeo && vimeo.setup.call(this)) : this.debug.warn("No media element found!");
} };
class Ads {
  constructor(e) {
    _defineProperty$1(this, "load", () => {
      this.enabled && (is.object(window.google) && is.object(window.google.ima) ? this.ready() : loadScript(this.player.config.urls.googleIMA.sdk).then(() => {
        this.ready();
      }).catch(() => {
        this.trigger("error", new Error("Google IMA SDK failed to load"));
      }));
    }), _defineProperty$1(this, "ready", () => {
      var e2;
      this.enabled || ((e2 = this).manager && e2.manager.destroy(), e2.elements.displayContainer && e2.elements.displayContainer.destroy(), e2.elements.container.remove()), this.startSafetyTimer(12e3, "ready()"), this.managerPromise.then(() => {
        this.clearSafetyTimer("onAdsManagerLoaded()");
      }), this.listeners(), this.setupIMA();
    }), _defineProperty$1(this, "setupIMA", () => {
      this.elements.container = createElement("div", { class: this.player.config.classNames.ads }), this.player.elements.container.appendChild(this.elements.container), google.ima.settings.setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.ENABLED), google.ima.settings.setLocale(this.player.config.ads.language), google.ima.settings.setDisableCustomPlaybackForIOS10Plus(this.player.config.playsinline), this.elements.displayContainer = new google.ima.AdDisplayContainer(this.elements.container, this.player.media), this.loader = new google.ima.AdsLoader(this.elements.displayContainer), this.loader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (e2) => this.onAdsManagerLoaded(e2), false), this.loader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (e2) => this.onAdError(e2), false), this.requestAds();
    }), _defineProperty$1(this, "requestAds", () => {
      const { container: e2 } = this.player.elements;
      try {
        const t = new google.ima.AdsRequest();
        t.adTagUrl = this.tagUrl, t.linearAdSlotWidth = e2.offsetWidth, t.linearAdSlotHeight = e2.offsetHeight, t.nonLinearAdSlotWidth = e2.offsetWidth, t.nonLinearAdSlotHeight = e2.offsetHeight, t.forceNonLinearFullSlot = false, t.setAdWillPlayMuted(!this.player.muted), this.loader.requestAds(t);
      } catch (e3) {
        this.onAdError(e3);
      }
    }), _defineProperty$1(this, "pollCountdown", (e2 = false) => {
      if (!e2)
        return clearInterval(this.countdownTimer), void this.elements.container.removeAttribute("data-badge-text");
      this.countdownTimer = setInterval(() => {
        const e3 = formatTime(Math.max(this.manager.getRemainingTime(), 0)), t = `${i18n.get("advertisement", this.player.config)} - ${e3}`;
        this.elements.container.setAttribute("data-badge-text", t);
      }, 100);
    }), _defineProperty$1(this, "onAdsManagerLoaded", (e2) => {
      if (!this.enabled)
        return;
      const t = new google.ima.AdsRenderingSettings();
      t.restoreCustomPlaybackStateOnAdBreakComplete = true, t.enablePreloading = true, this.manager = e2.getAdsManager(this.player, t), this.cuePoints = this.manager.getCuePoints(), this.manager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (e3) => this.onAdError(e3)), Object.keys(google.ima.AdEvent.Type).forEach((e3) => {
        this.manager.addEventListener(google.ima.AdEvent.Type[e3], (e4) => this.onAdEvent(e4));
      }), this.trigger("loaded");
    }), _defineProperty$1(this, "addCuePoints", () => {
      is.empty(this.cuePoints) || this.cuePoints.forEach((e2) => {
        if (0 !== e2 && -1 !== e2 && e2 < this.player.duration) {
          const t = this.player.elements.progress;
          if (is.element(t)) {
            const i = 100 / this.player.duration * e2, s = createElement("span", { class: this.player.config.classNames.cues });
            s.style.left = `${i.toString()}%`, t.appendChild(s);
          }
        }
      });
    }), _defineProperty$1(this, "onAdEvent", (e2) => {
      const { container: t } = this.player.elements, i = e2.getAd(), s = e2.getAdData();
      switch (((e3) => {
        triggerEvent.call(this.player, this.player.media, `ads${e3.replace(/_/g, "").toLowerCase()}`);
      })(e2.type), e2.type) {
        case google.ima.AdEvent.Type.LOADED:
          this.trigger("loaded"), this.pollCountdown(true), i.isLinear() || (i.width = t.offsetWidth, i.height = t.offsetHeight);
          break;
        case google.ima.AdEvent.Type.STARTED:
          this.manager.setVolume(this.player.volume);
          break;
        case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
          this.player.ended ? this.loadAds() : this.loader.contentComplete();
          break;
        case google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED:
          this.pauseContent();
          break;
        case google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED:
          this.pollCountdown(), this.resumeContent();
          break;
        case google.ima.AdEvent.Type.LOG:
          s.adError && this.player.debug.warn(`Non-fatal ad error: ${s.adError.getMessage()}`);
      }
    }), _defineProperty$1(this, "onAdError", (e2) => {
      this.cancel(), this.player.debug.warn("Ads error", e2);
    }), _defineProperty$1(this, "listeners", () => {
      const { container: e2 } = this.player.elements;
      let t;
      this.player.on("canplay", () => {
        this.addCuePoints();
      }), this.player.on("ended", () => {
        this.loader.contentComplete();
      }), this.player.on("timeupdate", () => {
        t = this.player.currentTime;
      }), this.player.on("seeked", () => {
        const e3 = this.player.currentTime;
        is.empty(this.cuePoints) || this.cuePoints.forEach((i, s) => {
          t < i && i < e3 && (this.manager.discardAdBreak(), this.cuePoints.splice(s, 1));
        });
      }), window.addEventListener("resize", () => {
        this.manager && this.manager.resize(e2.offsetWidth, e2.offsetHeight, google.ima.ViewMode.NORMAL);
      });
    }), _defineProperty$1(this, "play", () => {
      const { container: e2 } = this.player.elements;
      this.managerPromise || this.resumeContent(), this.managerPromise.then(() => {
        this.manager.setVolume(this.player.volume), this.elements.displayContainer.initialize();
        try {
          this.initialized || (this.manager.init(e2.offsetWidth, e2.offsetHeight, google.ima.ViewMode.NORMAL), this.manager.start()), this.initialized = true;
        } catch (e3) {
          this.onAdError(e3);
        }
      }).catch(() => {
      });
    }), _defineProperty$1(this, "resumeContent", () => {
      this.elements.container.style.zIndex = "", this.playing = false, silencePromise(this.player.media.play());
    }), _defineProperty$1(this, "pauseContent", () => {
      this.elements.container.style.zIndex = 3, this.playing = true, this.player.media.pause();
    }), _defineProperty$1(this, "cancel", () => {
      this.initialized && this.resumeContent(), this.trigger("error"), this.loadAds();
    }), _defineProperty$1(this, "loadAds", () => {
      this.managerPromise.then(() => {
        this.manager && this.manager.destroy(), this.managerPromise = new Promise((e2) => {
          this.on("loaded", e2), this.player.debug.log(this.manager);
        }), this.initialized = false, this.requestAds();
      }).catch(() => {
      });
    }), _defineProperty$1(this, "trigger", (e2, ...t) => {
      const i = this.events[e2];
      is.array(i) && i.forEach((e3) => {
        is.function(e3) && e3.apply(this, t);
      });
    }), _defineProperty$1(this, "on", (e2, t) => (is.array(this.events[e2]) || (this.events[e2] = []), this.events[e2].push(t), this)), _defineProperty$1(this, "startSafetyTimer", (e2, t) => {
      this.player.debug.log(`Safety timer invoked from: ${t}`), this.safetyTimer = setTimeout(() => {
        this.cancel(), this.clearSafetyTimer("startSafetyTimer()");
      }, e2);
    }), _defineProperty$1(this, "clearSafetyTimer", (e2) => {
      is.nullOrUndefined(this.safetyTimer) || (this.player.debug.log(`Safety timer cleared from: ${e2}`), clearTimeout(this.safetyTimer), this.safetyTimer = null);
    }), this.player = e, this.config = e.config.ads, this.playing = false, this.initialized = false, this.elements = { container: null, displayContainer: null }, this.manager = null, this.loader = null, this.cuePoints = null, this.events = {}, this.safetyTimer = null, this.countdownTimer = null, this.managerPromise = new Promise((e2, t) => {
      this.on("loaded", e2), this.on("error", t);
    }), this.load();
  }
  get enabled() {
    const { config: e } = this;
    return this.player.isHTML5 && this.player.isVideo && e.enabled && (!is.empty(e.publisherId) || is.url(e.tagUrl));
  }
  get tagUrl() {
    const { config: e } = this;
    if (is.url(e.tagUrl))
      return e.tagUrl;
    return `https://go.aniview.com/api/adserver6/vast/?${buildUrlParams({ AV_PUBLISHERID: "58c25bb0073ef448b1087ad6", AV_CHANNELID: "5a0458dc28a06145e4519d21", AV_URL: window.location.hostname, cb: Date.now(), AV_WIDTH: 640, AV_HEIGHT: 480, AV_CDIM2: e.publisherId })}`;
  }
}
function clamp(e = 0, t = 0, i = 255) {
  return Math.min(Math.max(e, t), i);
}
const parseVtt = (e) => {
  const t = [];
  return e.split(/\r\n\r\n|\n\n|\r\r/).forEach((e2) => {
    const i = {};
    e2.split(/\r\n|\n|\r/).forEach((e3) => {
      if (is.number(i.startTime)) {
        if (!is.empty(e3.trim()) && is.empty(i.text)) {
          const t2 = e3.trim().split("#xywh=");
          [i.text] = t2, t2[1] && ([i.x, i.y, i.w, i.h] = t2[1].split(","));
        }
      } else {
        const t2 = e3.match(/([0-9]{2})?:?([0-9]{2}):([0-9]{2}).([0-9]{2,3})( ?--> ?)([0-9]{2})?:?([0-9]{2}):([0-9]{2}).([0-9]{2,3})/);
        t2 && (i.startTime = 60 * Number(t2[1] || 0) * 60 + 60 * Number(t2[2]) + Number(t2[3]) + Number(`0.${t2[4]}`), i.endTime = 60 * Number(t2[6] || 0) * 60 + 60 * Number(t2[7]) + Number(t2[8]) + Number(`0.${t2[9]}`));
      }
    }), i.text && t.push(i);
  }), t;
}, fitRatio = (e, t) => {
  const i = {};
  return e > t.width / t.height ? (i.width = t.width, i.height = 1 / e * t.width) : (i.height = t.height, i.width = e * t.height), i;
};
class PreviewThumbnails {
  constructor(e) {
    _defineProperty$1(this, "load", () => {
      this.player.elements.display.seekTooltip && (this.player.elements.display.seekTooltip.hidden = this.enabled), this.enabled && this.getThumbnails().then(() => {
        this.enabled && (this.render(), this.determineContainerAutoSizing(), this.listeners(), this.loaded = true);
      });
    }), _defineProperty$1(this, "getThumbnails", () => new Promise((e2) => {
      const { src: t } = this.player.config.previewThumbnails;
      if (is.empty(t))
        throw new Error("Missing previewThumbnails.src config attribute");
      const i = () => {
        this.thumbnails.sort((e3, t2) => e3.height - t2.height), this.player.debug.log("Preview thumbnails", this.thumbnails), e2();
      };
      if (is.function(t))
        t((e3) => {
          this.thumbnails = e3, i();
        });
      else {
        const e3 = (is.string(t) ? [t] : t).map((e4) => this.getThumbnail(e4));
        Promise.all(e3).then(i);
      }
    })), _defineProperty$1(this, "getThumbnail", (e2) => new Promise((t) => {
      fetch(e2).then((i) => {
        const s = { frames: parseVtt(i), height: null, urlPrefix: "" };
        s.frames[0].text.startsWith("/") || s.frames[0].text.startsWith("http://") || s.frames[0].text.startsWith("https://") || (s.urlPrefix = e2.substring(0, e2.lastIndexOf("/") + 1));
        const n = new Image();
        n.onload = () => {
          s.height = n.naturalHeight, s.width = n.naturalWidth, this.thumbnails.push(s), t();
        }, n.src = s.urlPrefix + s.frames[0].text;
      });
    })), _defineProperty$1(this, "startMove", (e2) => {
      if (this.loaded && is.event(e2) && ["touchmove", "mousemove"].includes(e2.type) && this.player.media.duration) {
        if ("touchmove" === e2.type)
          this.seekTime = this.player.media.duration * (this.player.elements.inputs.seek.value / 100);
        else {
          var t, i;
          const s = this.player.elements.progress.getBoundingClientRect(), n = 100 / s.width * (e2.pageX - s.left);
          this.seekTime = this.player.media.duration * (n / 100), this.seekTime < 0 && (this.seekTime = 0), this.seekTime > this.player.media.duration - 1 && (this.seekTime = this.player.media.duration - 1), this.mousePosX = e2.pageX, this.elements.thumb.time.innerText = formatTime(this.seekTime);
          const r = null === (t = this.player.config.markers) || void 0 === t || null === (i = t.points) || void 0 === i ? void 0 : i.find(({ time: e3 }) => e3 === Math.round(this.seekTime));
          r && this.elements.thumb.time.insertAdjacentHTML("afterbegin", `${r.label}<br>`);
        }
        this.showImageAtCurrentTime();
      }
    }), _defineProperty$1(this, "endMove", () => {
      this.toggleThumbContainer(false, true);
    }), _defineProperty$1(this, "startScrubbing", (e2) => {
      (is.nullOrUndefined(e2.button) || false === e2.button || 0 === e2.button) && (this.mouseDown = true, this.player.media.duration && (this.toggleScrubbingContainer(true), this.toggleThumbContainer(false, true), this.showImageAtCurrentTime()));
    }), _defineProperty$1(this, "endScrubbing", () => {
      this.mouseDown = false, Math.ceil(this.lastTime) === Math.ceil(this.player.media.currentTime) ? this.toggleScrubbingContainer(false) : once.call(this.player, this.player.media, "timeupdate", () => {
        this.mouseDown || this.toggleScrubbingContainer(false);
      });
    }), _defineProperty$1(this, "listeners", () => {
      this.player.on("play", () => {
        this.toggleThumbContainer(false, true);
      }), this.player.on("seeked", () => {
        this.toggleThumbContainer(false);
      }), this.player.on("timeupdate", () => {
        this.lastTime = this.player.media.currentTime;
      });
    }), _defineProperty$1(this, "render", () => {
      this.elements.thumb.container = createElement("div", { class: this.player.config.classNames.previewThumbnails.thumbContainer }), this.elements.thumb.imageContainer = createElement("div", { class: this.player.config.classNames.previewThumbnails.imageContainer }), this.elements.thumb.container.appendChild(this.elements.thumb.imageContainer);
      const e2 = createElement("div", { class: this.player.config.classNames.previewThumbnails.timeContainer });
      this.elements.thumb.time = createElement("span", {}, "00:00"), e2.appendChild(this.elements.thumb.time), this.elements.thumb.imageContainer.appendChild(e2), is.element(this.player.elements.progress) && this.player.elements.progress.appendChild(this.elements.thumb.container), this.elements.scrubbing.container = createElement("div", { class: this.player.config.classNames.previewThumbnails.scrubbingContainer }), this.player.elements.wrapper.appendChild(this.elements.scrubbing.container);
    }), _defineProperty$1(this, "destroy", () => {
      this.elements.thumb.container && this.elements.thumb.container.remove(), this.elements.scrubbing.container && this.elements.scrubbing.container.remove();
    }), _defineProperty$1(this, "showImageAtCurrentTime", () => {
      this.mouseDown ? this.setScrubbingContainerSize() : this.setThumbContainerSizeAndPos();
      const e2 = this.thumbnails[0].frames.findIndex((e3) => this.seekTime >= e3.startTime && this.seekTime <= e3.endTime), t = e2 >= 0;
      let i = 0;
      this.mouseDown || this.toggleThumbContainer(t), t && (this.thumbnails.forEach((t2, s) => {
        this.loadedImages.includes(t2.frames[e2].text) && (i = s);
      }), e2 !== this.showingThumb && (this.showingThumb = e2, this.loadImage(i)));
    }), _defineProperty$1(this, "loadImage", (e2 = 0) => {
      const t = this.showingThumb, i = this.thumbnails[e2], { urlPrefix: s } = i, n = i.frames[t], r = i.frames[t].text, a = s + r;
      if (this.currentImageElement && this.currentImageElement.dataset.filename === r)
        this.showImage(this.currentImageElement, n, e2, t, r, false), this.currentImageElement.dataset.index = t, this.removeOldImages(this.currentImageElement);
      else {
        this.loadingImage && this.usingSprites && (this.loadingImage.onload = null);
        const i2 = new Image();
        i2.src = a, i2.dataset.index = t, i2.dataset.filename = r, this.showingThumbFilename = r, this.player.debug.log(`Loading image: ${a}`), i2.onload = () => this.showImage(i2, n, e2, t, r, true), this.loadingImage = i2, this.removeOldImages(i2);
      }
    }), _defineProperty$1(this, "showImage", (e2, t, i, s, n, r = true) => {
      this.player.debug.log(`Showing thumb: ${n}. num: ${s}. qual: ${i}. newimg: ${r}`), this.setImageSizeAndOffset(e2, t), r && (this.currentImageContainer.appendChild(e2), this.currentImageElement = e2, this.loadedImages.includes(n) || this.loadedImages.push(n)), this.preloadNearby(s, true).then(this.preloadNearby(s, false)).then(this.getHigherQuality(i, e2, t, n));
    }), _defineProperty$1(this, "removeOldImages", (e2) => {
      Array.from(this.currentImageContainer.children).forEach((t) => {
        if ("img" !== t.tagName.toLowerCase())
          return;
        const i = this.usingSprites ? 500 : 1e3;
        if (t.dataset.index !== e2.dataset.index && !t.dataset.deleting) {
          t.dataset.deleting = true;
          const { currentImageContainer: e3 } = this;
          setTimeout(() => {
            e3.removeChild(t), this.player.debug.log(`Removing thumb: ${t.dataset.filename}`);
          }, i);
        }
      });
    }), _defineProperty$1(this, "preloadNearby", (e2, t = true) => new Promise((i) => {
      setTimeout(() => {
        const s = this.thumbnails[0].frames[e2].text;
        if (this.showingThumbFilename === s) {
          let n;
          n = t ? this.thumbnails[0].frames.slice(e2) : this.thumbnails[0].frames.slice(0, e2).reverse();
          let r = false;
          n.forEach((e3) => {
            const t2 = e3.text;
            if (t2 !== s && !this.loadedImages.includes(t2)) {
              r = true, this.player.debug.log(`Preloading thumb filename: ${t2}`);
              const { urlPrefix: e4 } = this.thumbnails[0], s2 = e4 + t2, n2 = new Image();
              n2.src = s2, n2.onload = () => {
                this.player.debug.log(`Preloaded thumb filename: ${t2}`), this.loadedImages.includes(t2) || this.loadedImages.push(t2), i();
              };
            }
          }), r || i();
        }
      }, 300);
    })), _defineProperty$1(this, "getHigherQuality", (e2, t, i, s) => {
      if (e2 < this.thumbnails.length - 1) {
        let n = t.naturalHeight;
        this.usingSprites && (n = i.h), n < this.thumbContainerHeight && setTimeout(() => {
          this.showingThumbFilename === s && (this.player.debug.log(`Showing higher quality thumb for: ${s}`), this.loadImage(e2 + 1));
        }, 300);
      }
    }), _defineProperty$1(this, "toggleThumbContainer", (e2 = false, t = false) => {
      const i = this.player.config.classNames.previewThumbnails.thumbContainerShown;
      this.elements.thumb.container.classList.toggle(i, e2), !e2 && t && (this.showingThumb = null, this.showingThumbFilename = null);
    }), _defineProperty$1(this, "toggleScrubbingContainer", (e2 = false) => {
      const t = this.player.config.classNames.previewThumbnails.scrubbingContainerShown;
      this.elements.scrubbing.container.classList.toggle(t, e2), e2 || (this.showingThumb = null, this.showingThumbFilename = null);
    }), _defineProperty$1(this, "determineContainerAutoSizing", () => {
      (this.elements.thumb.imageContainer.clientHeight > 20 || this.elements.thumb.imageContainer.clientWidth > 20) && (this.sizeSpecifiedInCSS = true);
    }), _defineProperty$1(this, "setThumbContainerSizeAndPos", () => {
      const { imageContainer: e2 } = this.elements.thumb;
      if (this.sizeSpecifiedInCSS) {
        if (e2.clientHeight > 20 && e2.clientWidth < 20) {
          const t = Math.floor(e2.clientHeight * this.thumbAspectRatio);
          e2.style.width = `${t}px`;
        } else if (e2.clientHeight < 20 && e2.clientWidth > 20) {
          const t = Math.floor(e2.clientWidth / this.thumbAspectRatio);
          e2.style.height = `${t}px`;
        }
      } else {
        const t = Math.floor(this.thumbContainerHeight * this.thumbAspectRatio);
        e2.style.height = `${this.thumbContainerHeight}px`, e2.style.width = `${t}px`;
      }
      this.setThumbContainerPos();
    }), _defineProperty$1(this, "setThumbContainerPos", () => {
      const e2 = this.player.elements.progress.getBoundingClientRect(), t = this.player.elements.container.getBoundingClientRect(), { container: i } = this.elements.thumb, s = t.left - e2.left + 10, n = t.right - e2.left - i.clientWidth - 10, r = this.mousePosX - e2.left - i.clientWidth / 2, a = clamp(r, s, n);
      i.style.left = `${a}px`, i.style.setProperty("--preview-arrow-offset", r - a + "px");
    }), _defineProperty$1(this, "setScrubbingContainerSize", () => {
      const { width: e2, height: t } = fitRatio(this.thumbAspectRatio, { width: this.player.media.clientWidth, height: this.player.media.clientHeight });
      this.elements.scrubbing.container.style.width = `${e2}px`, this.elements.scrubbing.container.style.height = `${t}px`;
    }), _defineProperty$1(this, "setImageSizeAndOffset", (e2, t) => {
      if (!this.usingSprites)
        return;
      const i = this.thumbContainerHeight / t.h;
      e2.style.height = e2.naturalHeight * i + "px", e2.style.width = e2.naturalWidth * i + "px", e2.style.left = `-${t.x * i}px`, e2.style.top = `-${t.y * i}px`;
    }), this.player = e, this.thumbnails = [], this.loaded = false, this.lastMouseMoveTime = Date.now(), this.mouseDown = false, this.loadedImages = [], this.elements = { thumb: {}, scrubbing: {} }, this.load();
  }
  get enabled() {
    return this.player.isHTML5 && this.player.isVideo && this.player.config.previewThumbnails.enabled;
  }
  get currentImageContainer() {
    return this.mouseDown ? this.elements.scrubbing.container : this.elements.thumb.imageContainer;
  }
  get usingSprites() {
    return Object.keys(this.thumbnails[0].frames[0]).includes("w");
  }
  get thumbAspectRatio() {
    return this.usingSprites ? this.thumbnails[0].frames[0].w / this.thumbnails[0].frames[0].h : this.thumbnails[0].width / this.thumbnails[0].height;
  }
  get thumbContainerHeight() {
    if (this.mouseDown) {
      const { height: e } = fitRatio(this.thumbAspectRatio, { width: this.player.media.clientWidth, height: this.player.media.clientHeight });
      return e;
    }
    return this.sizeSpecifiedInCSS ? this.elements.thumb.imageContainer.clientHeight : Math.floor(this.player.media.clientWidth / this.thumbAspectRatio / 4);
  }
  get currentImageElement() {
    return this.mouseDown ? this.currentScrubbingImageElement : this.currentThumbnailImageElement;
  }
  set currentImageElement(e) {
    this.mouseDown ? this.currentScrubbingImageElement = e : this.currentThumbnailImageElement = e;
  }
}
const source = { insertElements(e, t) {
  is.string(t) ? insertElement(e, this.media, { src: t }) : is.array(t) && t.forEach((t2) => {
    insertElement(e, this.media, t2);
  });
}, change(e) {
  getDeep(e, "sources.length") ? (html5.cancelRequests.call(this), this.destroy.call(this, () => {
    this.options.quality = [], removeElement(this.media), this.media = null, is.element(this.elements.container) && this.elements.container.removeAttribute("class");
    const { sources: t, type: i } = e, [{ provider: s = providers.html5, src: n }] = t, r = "html5" === s ? i : "div", a = "html5" === s ? {} : { src: n };
    Object.assign(this, { provider: s, type: i, supported: support.check(i, s, this.config.playsinline), media: createElement(r, a) }), this.elements.container.appendChild(this.media), is.boolean(e.autoplay) && (this.config.autoplay = e.autoplay), this.isHTML5 && (this.config.crossorigin && this.media.setAttribute("crossorigin", ""), this.config.autoplay && this.media.setAttribute("autoplay", ""), is.empty(e.poster) || (this.poster = e.poster), this.config.loop.active && this.media.setAttribute("loop", ""), this.config.muted && this.media.setAttribute("muted", ""), this.config.playsinline && this.media.setAttribute("playsinline", "")), ui.addStyleHook.call(this), this.isHTML5 && source.insertElements.call(this, "source", t), this.config.title = e.title, media.setup.call(this), this.isHTML5 && Object.keys(e).includes("tracks") && source.insertElements.call(this, "track", e.tracks), (this.isHTML5 || this.isEmbed && !this.supported.ui) && ui.build.call(this), this.isHTML5 && this.media.load(), is.empty(e.previewThumbnails) || (Object.assign(this.config.previewThumbnails, e.previewThumbnails), this.previewThumbnails && this.previewThumbnails.loaded && (this.previewThumbnails.destroy(), this.previewThumbnails = null), this.config.previewThumbnails.enabled && (this.previewThumbnails = new PreviewThumbnails(this))), this.fullscreen.update();
  }, true)) : this.debug.warn("Invalid source format");
} };
class Plyr$1 {
  constructor(e, t) {
    if (_defineProperty$1(this, "play", () => is.function(this.media.play) ? (this.ads && this.ads.enabled && this.ads.managerPromise.then(() => this.ads.play()).catch(() => silencePromise(this.media.play())), this.media.play()) : null), _defineProperty$1(this, "pause", () => this.playing && is.function(this.media.pause) ? this.media.pause() : null), _defineProperty$1(this, "togglePlay", (e2) => (is.boolean(e2) ? e2 : !this.playing) ? this.play() : this.pause()), _defineProperty$1(this, "stop", () => {
      this.isHTML5 ? (this.pause(), this.restart()) : is.function(this.media.stop) && this.media.stop();
    }), _defineProperty$1(this, "restart", () => {
      this.currentTime = 0;
    }), _defineProperty$1(this, "rewind", (e2) => {
      this.currentTime -= is.number(e2) ? e2 : this.config.seekTime;
    }), _defineProperty$1(this, "forward", (e2) => {
      this.currentTime += is.number(e2) ? e2 : this.config.seekTime;
    }), _defineProperty$1(this, "increaseVolume", (e2) => {
      const t2 = this.media.muted ? 0 : this.volume;
      this.volume = t2 + (is.number(e2) ? e2 : 0);
    }), _defineProperty$1(this, "decreaseVolume", (e2) => {
      this.increaseVolume(-e2);
    }), _defineProperty$1(this, "airplay", () => {
      support.airplay && this.media.webkitShowPlaybackTargetPicker();
    }), _defineProperty$1(this, "toggleControls", (e2) => {
      if (this.supported.ui && !this.isAudio) {
        const t2 = hasClass(this.elements.container, this.config.classNames.hideControls), i2 = void 0 === e2 ? void 0 : !e2, s2 = toggleClass(this.elements.container, this.config.classNames.hideControls, i2);
        if (s2 && is.array(this.config.controls) && this.config.controls.includes("settings") && !is.empty(this.config.settings) && controls.toggleMenu.call(this, false), s2 !== t2) {
          const e3 = s2 ? "controlshidden" : "controlsshown";
          triggerEvent.call(this, this.media, e3);
        }
        return !s2;
      }
      return false;
    }), _defineProperty$1(this, "on", (e2, t2) => {
      on.call(this, this.elements.container, e2, t2);
    }), _defineProperty$1(this, "once", (e2, t2) => {
      once.call(this, this.elements.container, e2, t2);
    }), _defineProperty$1(this, "off", (e2, t2) => {
      off(this.elements.container, e2, t2);
    }), _defineProperty$1(this, "destroy", (e2, t2 = false) => {
      if (!this.ready)
        return;
      const i2 = () => {
        document.body.style.overflow = "", this.embed = null, t2 ? (Object.keys(this.elements).length && (removeElement(this.elements.buttons.play), removeElement(this.elements.captions), removeElement(this.elements.controls), removeElement(this.elements.wrapper), this.elements.buttons.play = null, this.elements.captions = null, this.elements.controls = null, this.elements.wrapper = null), is.function(e2) && e2()) : (unbindListeners.call(this), html5.cancelRequests.call(this), replaceElement(this.elements.original, this.elements.container), triggerEvent.call(this, this.elements.original, "destroyed", true), is.function(e2) && e2.call(this.elements.original), this.ready = false, setTimeout(() => {
          this.elements = null, this.media = null;
        }, 200));
      };
      this.stop(), clearTimeout(this.timers.loading), clearTimeout(this.timers.controls), clearTimeout(this.timers.resized), this.isHTML5 ? (ui.toggleNativeControls.call(this, true), i2()) : this.isYouTube ? (clearInterval(this.timers.buffering), clearInterval(this.timers.playing), null !== this.embed && is.function(this.embed.destroy) && this.embed.destroy(), i2()) : this.isVimeo && (null !== this.embed && this.embed.unload().then(i2), setTimeout(i2, 200));
    }), _defineProperty$1(this, "supports", (e2) => support.mime.call(this, e2)), this.timers = {}, this.ready = false, this.loading = false, this.failed = false, this.touch = support.touch, this.media = e, is.string(this.media) && (this.media = document.querySelectorAll(this.media)), (window.jQuery && this.media instanceof jQuery || is.nodeList(this.media) || is.array(this.media)) && (this.media = this.media[0]), this.config = extend({}, defaults, Plyr$1.defaults, t || {}, (() => {
      try {
        return JSON.parse(this.media.getAttribute("data-plyr-config"));
      } catch (e2) {
        return {};
      }
    })()), this.elements = { container: null, fullscreen: null, captions: null, buttons: {}, display: {}, progress: {}, inputs: {}, settings: { popup: null, menu: null, panels: {}, buttons: {} } }, this.captions = { active: null, currentTrack: -1, meta: /* @__PURE__ */ new WeakMap() }, this.fullscreen = { active: false }, this.options = { speed: [], quality: [] }, this.debug = new Console(this.config.debug), this.debug.log("Config", this.config), this.debug.log("Support", support), is.nullOrUndefined(this.media) || !is.element(this.media))
      return void this.debug.error("Setup failed: no suitable element passed");
    if (this.media.plyr)
      return void this.debug.warn("Target already setup");
    if (!this.config.enabled)
      return void this.debug.error("Setup failed: disabled by config");
    if (!support.check().api)
      return void this.debug.error("Setup failed: no support");
    const i = this.media.cloneNode(true);
    i.autoplay = false, this.elements.original = i;
    const s = this.media.tagName.toLowerCase();
    let n = null, r = null;
    switch (s) {
      case "div":
        if (n = this.media.querySelector("iframe"), is.element(n)) {
          if (r = parseUrl(n.getAttribute("src")), this.provider = getProviderByUrl(r.toString()), this.elements.container = this.media, this.media = n, this.elements.container.className = "", r.search.length) {
            const e2 = ["1", "true"];
            e2.includes(r.searchParams.get("autoplay")) && (this.config.autoplay = true), e2.includes(r.searchParams.get("loop")) && (this.config.loop.active = true), this.isYouTube ? (this.config.playsinline = e2.includes(r.searchParams.get("playsinline")), this.config.youtube.hl = r.searchParams.get("hl")) : this.config.playsinline = true;
          }
        } else
          this.provider = this.media.getAttribute(this.config.attributes.embed.provider), this.media.removeAttribute(this.config.attributes.embed.provider);
        if (is.empty(this.provider) || !Object.values(providers).includes(this.provider))
          return void this.debug.error("Setup failed: Invalid provider");
        this.type = types.video;
        break;
      case "video":
      case "audio":
        this.type = s, this.provider = providers.html5, this.media.hasAttribute("crossorigin") && (this.config.crossorigin = true), this.media.hasAttribute("autoplay") && (this.config.autoplay = true), (this.media.hasAttribute("playsinline") || this.media.hasAttribute("webkit-playsinline")) && (this.config.playsinline = true), this.media.hasAttribute("muted") && (this.config.muted = true), this.media.hasAttribute("loop") && (this.config.loop.active = true);
        break;
      default:
        return void this.debug.error("Setup failed: unsupported type");
    }
    this.supported = support.check(this.type, this.provider), this.supported.api ? (this.eventListeners = [], this.listeners = new Listeners(this), this.storage = new Storage(this), this.media.plyr = this, is.element(this.elements.container) || (this.elements.container = createElement("div"), wrap(this.media, this.elements.container)), ui.migrateStyles.call(this), ui.addStyleHook.call(this), media.setup.call(this), this.config.debug && on.call(this, this.elements.container, this.config.events.join(" "), (e2) => {
      this.debug.log(`event: ${e2.type}`);
    }), this.fullscreen = new Fullscreen(this), (this.isHTML5 || this.isEmbed && !this.supported.ui) && ui.build.call(this), this.listeners.container(), this.listeners.global(), this.config.ads.enabled && (this.ads = new Ads(this)), this.isHTML5 && this.config.autoplay && this.once("canplay", () => silencePromise(this.play())), this.lastSeekTime = 0, this.config.previewThumbnails.enabled && (this.previewThumbnails = new PreviewThumbnails(this))) : this.debug.error("Setup failed: no support");
  }
  get isHTML5() {
    return this.provider === providers.html5;
  }
  get isEmbed() {
    return this.isYouTube || this.isVimeo;
  }
  get isYouTube() {
    return this.provider === providers.youtube;
  }
  get isVimeo() {
    return this.provider === providers.vimeo;
  }
  get isVideo() {
    return this.type === types.video;
  }
  get isAudio() {
    return this.type === types.audio;
  }
  get playing() {
    return Boolean(this.ready && !this.paused && !this.ended);
  }
  get paused() {
    return Boolean(this.media.paused);
  }
  get stopped() {
    return Boolean(this.paused && 0 === this.currentTime);
  }
  get ended() {
    return Boolean(this.media.ended);
  }
  set currentTime(e) {
    if (!this.duration)
      return;
    const t = is.number(e) && e > 0;
    this.media.currentTime = t ? Math.min(e, this.duration) : 0, this.debug.log(`Seeking to ${this.currentTime} seconds`);
  }
  get currentTime() {
    return Number(this.media.currentTime);
  }
  get buffered() {
    const { buffered: e } = this.media;
    return is.number(e) ? e : e && e.length && this.duration > 0 ? e.end(0) / this.duration : 0;
  }
  get seeking() {
    return Boolean(this.media.seeking);
  }
  get duration() {
    const e = parseFloat(this.config.duration), t = (this.media || {}).duration, i = is.number(t) && t !== 1 / 0 ? t : 0;
    return e || i;
  }
  set volume(e) {
    let t = e;
    is.string(t) && (t = Number(t)), is.number(t) || (t = this.storage.get("volume")), is.number(t) || ({ volume: t } = this.config), t > 1 && (t = 1), t < 0 && (t = 0), this.config.volume = t, this.media.volume = t, !is.empty(e) && this.muted && t > 0 && (this.muted = false);
  }
  get volume() {
    return Number(this.media.volume);
  }
  set muted(e) {
    let t = e;
    is.boolean(t) || (t = this.storage.get("muted")), is.boolean(t) || (t = this.config.muted), this.config.muted = t, this.media.muted = t;
  }
  get muted() {
    return Boolean(this.media.muted);
  }
  get hasAudio() {
    return !this.isHTML5 || (!!this.isAudio || (Boolean(this.media.mozHasAudio) || Boolean(this.media.webkitAudioDecodedByteCount) || Boolean(this.media.audioTracks && this.media.audioTracks.length)));
  }
  set speed(e) {
    let t = null;
    is.number(e) && (t = e), is.number(t) || (t = this.storage.get("speed")), is.number(t) || (t = this.config.speed.selected);
    const { minimumSpeed: i, maximumSpeed: s } = this;
    t = clamp(t, i, s), this.config.speed.selected = t, setTimeout(() => {
      this.media && (this.media.playbackRate = t);
    }, 0);
  }
  get speed() {
    return Number(this.media.playbackRate);
  }
  get minimumSpeed() {
    return this.isYouTube ? Math.min(...this.options.speed) : this.isVimeo ? 0.5 : 0.0625;
  }
  get maximumSpeed() {
    return this.isYouTube ? Math.max(...this.options.speed) : this.isVimeo ? 2 : 16;
  }
  set quality(e) {
    const t = this.config.quality, i = this.options.quality;
    if (!i.length)
      return;
    let s = [!is.empty(e) && Number(e), this.storage.get("quality"), t.selected, t.default].find(is.number), n = true;
    if (!i.includes(s)) {
      const e2 = closest(i, s);
      this.debug.warn(`Unsupported quality option: ${s}, using ${e2} instead`), s = e2, n = false;
    }
    t.selected = s, this.media.quality = s, n && this.storage.set({ quality: s });
  }
  get quality() {
    return this.media.quality;
  }
  set loop(e) {
    const t = is.boolean(e) ? e : this.config.loop.active;
    this.config.loop.active = t, this.media.loop = t;
  }
  get loop() {
    return Boolean(this.media.loop);
  }
  set source(e) {
    source.change.call(this, e);
  }
  get source() {
    return this.media.currentSrc;
  }
  get download() {
    const { download: e } = this.config.urls;
    return is.url(e) ? e : this.source;
  }
  set download(e) {
    is.url(e) && (this.config.urls.download = e, controls.setDownloadUrl.call(this));
  }
  set poster(e) {
    this.isVideo ? ui.setPoster.call(this, e, false).catch(() => {
    }) : this.debug.warn("Poster can only be set for video");
  }
  get poster() {
    return this.isVideo ? this.media.getAttribute("poster") || this.media.getAttribute("data-poster") : null;
  }
  get ratio() {
    if (!this.isVideo)
      return null;
    const e = reduceAspectRatio(getAspectRatio.call(this));
    return is.array(e) ? e.join(":") : e;
  }
  set ratio(e) {
    this.isVideo ? is.string(e) && validateAspectRatio(e) ? (this.config.ratio = reduceAspectRatio(e), setAspectRatio.call(this)) : this.debug.error(`Invalid aspect ratio specified (${e})`) : this.debug.warn("Aspect ratio can only be set for video");
  }
  set autoplay(e) {
    this.config.autoplay = is.boolean(e) ? e : this.config.autoplay;
  }
  get autoplay() {
    return Boolean(this.config.autoplay);
  }
  toggleCaptions(e) {
    captions.toggle.call(this, e, false);
  }
  set currentTrack(e) {
    captions.set.call(this, e, false), captions.setup.call(this);
  }
  get currentTrack() {
    const { toggled: e, currentTrack: t } = this.captions;
    return e ? t : -1;
  }
  set language(e) {
    captions.setLanguage.call(this, e, false);
  }
  get language() {
    return (captions.getCurrentTrack.call(this) || {}).language;
  }
  set pip(e) {
    if (!support.pip)
      return;
    const t = is.boolean(e) ? e : !this.pip;
    is.function(this.media.webkitSetPresentationMode) && this.media.webkitSetPresentationMode(t ? pip.active : pip.inactive), is.function(this.media.requestPictureInPicture) && (!this.pip && t ? this.media.requestPictureInPicture() : this.pip && !t && document.exitPictureInPicture());
  }
  get pip() {
    return support.pip ? is.empty(this.media.webkitPresentationMode) ? this.media === document.pictureInPictureElement : this.media.webkitPresentationMode === pip.active : null;
  }
  setPreviewThumbnails(e) {
    this.previewThumbnails && this.previewThumbnails.loaded && (this.previewThumbnails.destroy(), this.previewThumbnails = null), Object.assign(this.config.previewThumbnails, e), this.config.previewThumbnails.enabled && (this.previewThumbnails = new PreviewThumbnails(this));
  }
  static supported(e, t) {
    return support.check(e, t);
  }
  static loadSprite(e, t) {
    return loadSprite(e, t);
  }
  static setup(e, t = {}) {
    let i = null;
    return is.string(e) ? i = Array.from(document.querySelectorAll(e)) : is.nodeList(e) ? i = Array.from(e) : is.array(e) && (i = e.filter(is.element)), is.empty(i) ? null : i.map((e2) => new Plyr$1(e2, t));
  }
}
Plyr$1.defaults = cloneDeep(defaults);
function create_else_block(ctx) {
  let video;
  let source2;
  let source_src_value;
  let video_class_value;
  return {
    c() {
      video = element("video");
      source2 = element("source");
      if (!src_url_equal(source2.src, source_src_value = ctx[5]))
        attr(source2, "src", source_src_value);
      attr(source2, "type", ctx[4]);
      attr(video, "data-app-kind", "Plyr");
      attr(video, "crossorigin", "anonymous");
      video.playsInline = true;
      attr(video, "data-poster", ctx[6]);
      attr(video, "class", video_class_value = `${ctx[1] ? "disbale-progress" : ""} ${ctx[2] ? "hide-control" : ""}`);
    },
    m(target, anchor) {
      insert(target, video, anchor);
      append(video, source2);
      ctx[10](video);
    },
    p(ctx2, dirty) {
      if (dirty & 6 && video_class_value !== (video_class_value = `${ctx2[1] ? "disbale-progress" : ""} ${ctx2[2] ? "hide-control" : ""}`)) {
        attr(video, "class", video_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(video);
      ctx[10](null);
    }
  };
}
function create_if_block_2(ctx) {
  let audio;
  let source2;
  let source_src_value;
  let audio_class_value;
  return {
    c() {
      audio = element("audio");
      source2 = element("source");
      if (!src_url_equal(source2.src, source_src_value = ctx[5]))
        attr(source2, "src", source_src_value);
      attr(source2, "type", ctx[4]);
      attr(audio, "data-app-kind", "Plyr");
      attr(audio, "crossorigin", "anonymous");
      attr(audio, "data-poster", ctx[6]);
      attr(audio, "class", audio_class_value = `${ctx[1] ? "disbale-progress" : ""} ${ctx[2] ? "hide-control" : ""}`);
      attr(audio, "playsinline", "");
    },
    m(target, anchor) {
      insert(target, audio, anchor);
      append(audio, source2);
      ctx[9](audio);
    },
    p(ctx2, dirty) {
      if (dirty & 6 && audio_class_value !== (audio_class_value = `${ctx2[1] ? "disbale-progress" : ""} ${ctx2[2] ? "hide-control" : ""}`)) {
        attr(audio, "class", audio_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(audio);
      ctx[9](null);
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let t0;
  let t1_value = JSON.stringify({
    src: ctx[5],
    type: ctx[0].state.type
  }) + "";
  let t1;
  return {
    c() {
      div = element("div");
      t0 = text('Invalid "src" or "type".\n    ');
      t1 = text(t1_value);
      attr(div, "data-app-kind", "Plyr");
      attr(div, "class", "plyr--audio");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
    },
    p(ctx2, dirty) {
      if (dirty & 1 && t1_value !== (t1_value = JSON.stringify({
        src: ctx2[5],
        type: ctx2[0].state.type
      }) + ""))
        set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "data-app-kind", "Plyr");
      attr(div, "class", "plyr__video-embed");
      attr(div, "data-plyr-provider", "youtube");
      attr(div, "data-plyr-embed-id", ctx[5]);
      attr(div, "data-poster", ctx[6]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      ctx[8](div);
    },
    p: noop$1,
    d(detaching) {
      if (detaching)
        detach(div);
      ctx[8](null);
    }
  };
}
function create_fragment(ctx) {
  let show_if;
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (ctx2[0].state.provider === "youtube")
      return create_if_block;
    if (!ctx2[4])
      return create_if_block_1;
    if (show_if == null)
      show_if = !!ctx2[4].startsWith("audio/");
    if (show_if)
      return create_if_block_2;
    return create_else_block;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    i: noop$1,
    o: noop$1,
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { storage } = $$props;
  let { sync } = $$props;
  let { readonly } = $$props;
  let { isMobile } = $$props;
  const type = storage.state.provider ? void 0 : storage.state.type || guessTypeFromSrc(storage.state.src);
  const { src, poster } = storage.state;
  const useHLS = hlsTypes.includes(String(type).toLowerCase());
  let player_element;
  let player;
  onMount(async () => {
    if (player_element) {
      if (useHLS && cannotPlayHLSNatively(player_element)) {
        const hls = await loadHLS();
        hls.loadSource(src);
        hls.attachMedia(player_element);
      }
      player = new Plyr$1(
        player_element,
        {
          fullscreen: { enabled: false },
          controls: ["play", "progress", "current-time", "mute", "volume"],
          clickToPlay: false,
          youtube: { autoplay: true },
          iconUrl: "https://solutions-apaas.agora.io/static/assets/plyr.svg"
        }
      );
      $$invalidate(7, sync.player = player, sync);
    }
  });
  onDestroy(() => {
    try {
      sync.dispose();
      player == null ? void 0 : player.destroy();
    } catch (e) {
      console.warn("[Plyr] destroy plyr error", e);
    }
  });
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      player_element = $$value;
      $$invalidate(3, player_element);
    });
  }
  function audio_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      player_element = $$value;
      $$invalidate(3, player_element);
    });
  }
  function video_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      player_element = $$value;
      $$invalidate(3, player_element);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("storage" in $$props2)
      $$invalidate(0, storage = $$props2.storage);
    if ("sync" in $$props2)
      $$invalidate(7, sync = $$props2.sync);
    if ("readonly" in $$props2)
      $$invalidate(1, readonly = $$props2.readonly);
    if ("isMobile" in $$props2)
      $$invalidate(2, isMobile = $$props2.isMobile);
  };
  return [
    storage,
    readonly,
    isMobile,
    player_element,
    type,
    src,
    poster,
    sync,
    div_binding,
    audio_binding,
    video_binding
  ];
}
class Player extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      storage: 0,
      sync: 7,
      readonly: 1,
      isMobile: 2
    });
  }
}
class Sync {
  constructor(context) {
    this.context = context;
    this.behavior = "owner";
    this._skip_next_play_pause = 0;
    this._sync_timer = 0;
    this._interval = 1e3;
    this._blink = 0;
    this._player = null;
    this._buffering = false;
    this._throttle = 0;
    this._dispatch_time_again = false;
    this._buffering_timer = 0;
    this._disposer = null;
    this.firstSync = false;
    const room = context.getRoom();
    const player = context.getDisplayer();
    this.uid = room ? room.uid : "";
    this.getTimestamp = room ? () => room.calibrationTimestamp : () => player.beginTimestamp + player.progressTime;
    this._disposer = this.context.storage.addStateChangedListener(this.syncAll.bind(this));
  }
  dispose() {
    this._disposer && this._disposer();
    this._disposer = null;
    clearInterval(this._sync_timer);
    clearTimeout(this._buffering_timer);
  }
  get player() {
    return this._player;
  }
  set player(player) {
    this._player = player;
    player && player.once("ready", this.setupPlayer.bind(this, player));
  }
  setupPlayer(player) {
    this.registerListeners(player);
    this.watchUserInputs(player);
    this._sync_timer = setInterval(this.syncAll.bind(this), this._interval);
  }
  syncAll() {
    const { behavior, player, context } = this;
    if (!player)
      return;
    const { storage } = context;
    const { currentTime, hostTime, muted, paused, volume, owner } = storage.state;
    if (behavior === "owner" && owner === this.uid && this.firstSync)
      return;
    this.firstSync = true;
    if (paused !== player.paused && !this._skip_next_play_pause) {
      console.log("< sync paused", paused);
      paused ? player.pause() : safePlay(player);
    }
    if (muted !== player.muted) {
      console.log("< sync muted", muted);
      player.muted = muted;
    }
    if (volume !== player.volume) {
      console.log("< sync volume", volume);
      player.volume = volume;
    }
    if (this._buffering)
      return;
    if (paused) {
      if (Math.abs(player.currentTime - currentTime) > 0.5) {
        console.log("< sync current time (paused)", currentTime);
        player.currentTime = currentTime;
      }
    } else {
      this.syncCurrentTime(hostTime, currentTime, player);
    }
  }
  watchUserInputs(player) {
    const $controls = player.elements.controls;
    const $play = first(player.elements.buttons.play);
    const $seek = $controls == null ? void 0 : $controls.querySelector('input[data-plyr="seek"]');
    const $mute = $controls == null ? void 0 : $controls.querySelector('button[data-plyr="mute"]');
    const $volume = $controls == null ? void 0 : $controls.querySelector('input[data-plyr="volume"]');
    this.fixSeekBarOnInit($seek, player);
    $play == null ? void 0 : $play.addEventListener("click", () => {
      this.behavior === "owner" && this.dispatchOwner();
      this.dispatchPlayPause(player);
    });
    $seek == null ? void 0 : $seek.addEventListener("change", () => {
      this.behavior === "owner" && this.dispatchOwner();
      this.dispatchSeek(player, $seek);
    });
    $mute == null ? void 0 : $mute.addEventListener("click", () => {
      this.behavior === "owner" && this.dispatchOwner();
      this.dispatchVolume(player);
    });
    $volume == null ? void 0 : $volume.addEventListener("change", () => {
      this.behavior === "owner" && this.dispatchOwner();
      this.dispatchVolume(player);
    });
  }
  fixSeekBarOnInit($seek, player) {
    const { currentTime } = this.context.storage.state;
    if (player.duration && currentTime && $seek) {
      const percent = 100 * currentTime / player.duration;
      $seek.value = percent.toFixed(2);
    }
  }
  registerListeners(player) {
    player.on("ended", () => {
      player.stop();
      this.context.storage.setState({ paused: true, currentTime: 0 });
    });
    player.on("waiting", () => {
      this._buffering = true;
      this._buffering_timer = setTimeout(this.clearBuffering.bind(this), this._interval / 2);
    });
    player.on("playing", () => {
      this._buffering = false;
    });
    player.on("timeupdate", () => {
      this.isOwner() && this.dispatchCurrentTime(player);
    });
    player.on("volumechange", () => {
      this.isOwner() && this.dispatchVolume(player);
    });
    player.on("play", () => {
      this.isOwner() && this.dispatchPlayPause(player);
    });
    player.on("pause", () => {
      this.isOwner() && this.dispatchPlayPause(player);
    });
    const box = this.context.getBox();
    box.events.on("minimized", (mini) => {
      if (this.isOwner()) {
        mini && player.pause();
      }
    });
  }
  clearBuffering() {
    this._buffering = false;
    this._buffering_timer = 0;
  }
  dispatchOwner() {
    if (this.context.storage.state.owner !== this.uid) {
      console.log("> set owner", this.uid);
      this.context.storage.setState({ owner: this.uid });
    }
  }
  dispatchPlayPause(player) {
    console.log("> set paused", player.paused);
    this.context.storage.setState({
      hostTime: this.getTimestamp(),
      currentTime: player.currentTime,
      paused: player.paused
    });
    clearTimeout(this._skip_next_play_pause);
    this._skip_next_play_pause = setTimeout(this.skipNextPlayPause.bind(this), 500);
  }
  skipNextPlayPause() {
    this._skip_next_play_pause = 0;
  }
  dispatchVolume(player) {
    console.log("> set volume", player.volume);
    this.context.storage.setState({
      muted: player.muted,
      volume: player.volume
    });
  }
  dispatchSeek(player, $seek) {
    const currentTime = $seek.valueAsNumber * player.duration / 100;
    console.log("> set current time (seek)", currentTime);
    this.context.storage.setState({ hostTime: this.getTimestamp(), currentTime });
  }
  dispatchCurrentTime(player) {
    if (this._throttle) {
      this._dispatch_time_again = true;
      return;
    }
    console.log("> set current time", player.currentTime);
    this.context.storage.setState({
      hostTime: this.getTimestamp(),
      currentTime: player.currentTime
    });
    this._throttle = setTimeout(this.clearThrottle.bind(this, player), 1e3);
  }
  clearThrottle(player) {
    this._throttle = 0;
    if (this._dispatch_time_again) {
      this._dispatch_time_again = false;
      this.dispatchCurrentTime(player);
    }
  }
  isOwner() {
    return this.behavior === "owner" && this.context.storage.state.owner === this.uid;
  }
  syncCurrentTime(hostTime, currentTime, player) {
    const now = this.getTimestamp();
    if (now && hostTime) {
      const expected = currentTime + (now - hostTime) / 1e3;
      if (Math.abs(expected - player.currentTime) > 1) {
        console.log("< sync current time (playing)", expected);
        player.currentTime = expected;
        this._blink++;
        if (this._blink > 3) {
          this.updateSyncInterval(true);
        }
      } else {
        this.updateSyncInterval(false);
      }
    }
  }
  updateSyncInterval(inc) {
    this._blink = 0;
    this._interval = clamp$1(this._interval + (inc ? 2e3 : -2e3), 1e3, 15e3);
    clearTimeout(this._sync_timer);
    this._sync_timer = setInterval(this.syncAll.bind(this), this._interval);
  }
}
var styles = '@charset "UTF-8";@keyframes plyr-progress{to{background-position:25px 0;background-position:var(--plyr-progress-loading-size,25px) 0}}@keyframes plyr-popup{0%{opacity:.5;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes plyr-fade-in{0%{opacity:0}to{opacity:1}}.plyr{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;align-items:center;direction:ltr;display:flex;flex-direction:column;font-family:inherit;font-family:var(--plyr-font-family,inherit);font-variant-numeric:tabular-nums;font-weight:400;font-weight:var(--plyr-font-weight-regular,400);line-height:1.7;line-height:var(--plyr-line-height,1.7);max-width:100%;min-width:200px;position:relative;text-shadow:none;transition:box-shadow .3s ease;z-index:0}.plyr audio,.plyr iframe,.plyr video{display:block;height:100%;width:100%}.plyr button{font:inherit;line-height:inherit;width:auto}.plyr:focus{outline:0}.plyr--full-ui{box-sizing:border-box}.plyr--full-ui *,.plyr--full-ui :after,.plyr--full-ui :before{box-sizing:inherit}.plyr--full-ui a,.plyr--full-ui button,.plyr--full-ui input,.plyr--full-ui label{touch-action:manipulation}.plyr__badge{background:#4a5464;background:var(--plyr-badge-background,#4a5464);border-radius:2px;border-radius:var(--plyr-badge-border-radius,2px);color:#fff;color:var(--plyr-badge-text-color,#fff);font-size:9px;font-size:var(--plyr-font-size-badge,9px);line-height:1;padding:3px 4px}.plyr--full-ui ::-webkit-media-text-track-container{display:none}.plyr__captions{animation:plyr-fade-in .3s ease;bottom:0;display:none;font-size:13px;font-size:var(--plyr-font-size-small,13px);left:0;padding:10px;padding:var(--plyr-control-spacing,10px);position:absolute;text-align:center;transition:transform .4s ease-in-out;width:100%}.plyr__captions span:empty{display:none}@media (min-width:480px){.plyr__captions{font-size:15px;font-size:var(--plyr-font-size-base,15px);padding:20px;padding:calc(var(--plyr-control-spacing, 10px)*2)}}@media (min-width:768px){.plyr__captions{font-size:18px;font-size:var(--plyr-font-size-large,18px)}}.plyr--captions-active .plyr__captions{display:block}.plyr:not(.plyr--hide-controls) .plyr__controls:not(:empty)~.plyr__captions{transform:translateY(-40px);transform:translateY(calc(var(--plyr-control-spacing, 10px)*-4))}.plyr__caption{background:#000c;background:var(--plyr-captions-background,#000c);border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone;color:#fff;color:var(--plyr-captions-text-color,#fff);line-height:185%;padding:.2em .5em;white-space:pre-wrap}.plyr__caption div{display:inline}.plyr__control{background:#0000;border:0;border-radius:4px;border-radius:var(--plyr-control-radius,4px);color:inherit;cursor:pointer;flex-shrink:0;overflow:visible;padding:7px;padding:calc(var(--plyr-control-spacing, 10px)*.7);position:relative;transition:all .3s ease}.plyr__control svg{fill:currentColor;display:block;height:18px;height:var(--plyr-control-icon-size,18px);pointer-events:none;width:18px;width:var(--plyr-control-icon-size,18px)}.plyr__control:focus{outline:0}.plyr__control:focus-visible{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}a.plyr__control{text-decoration:none}.plyr__control.plyr__control--pressed .icon--not-pressed,.plyr__control.plyr__control--pressed .label--not-pressed,.plyr__control:not(.plyr__control--pressed) .icon--pressed,.plyr__control:not(.plyr__control--pressed) .label--pressed,a.plyr__control:after,a.plyr__control:before{display:none}.plyr--full-ui ::-webkit-media-controls{display:none}.plyr__controls{align-items:center;display:flex;justify-content:flex-end;text-align:center}.plyr__controls .plyr__progress__container{flex:1;min-width:0}.plyr__controls .plyr__controls__item{margin-left:2.5px;margin-left:calc(var(--plyr-control-spacing, 10px)/4)}.plyr__controls .plyr__controls__item:first-child{margin-left:0;margin-right:auto}.plyr__controls .plyr__controls__item.plyr__progress__container{padding-left:2.5px;padding-left:calc(var(--plyr-control-spacing, 10px)/4)}.plyr__controls .plyr__controls__item.plyr__time{padding:0 5px;padding:0 calc(var(--plyr-control-spacing, 10px)/2)}.plyr__controls .plyr__controls__item.plyr__progress__container:first-child,.plyr__controls .plyr__controls__item.plyr__time+.plyr__time,.plyr__controls .plyr__controls__item.plyr__time:first-child{padding-left:0}.plyr [data-plyr=airplay],.plyr [data-plyr=captions],.plyr [data-plyr=fullscreen],.plyr [data-plyr=pip],.plyr__controls:empty{display:none}.plyr--airplay-supported [data-plyr=airplay],.plyr--captions-enabled [data-plyr=captions],.plyr--fullscreen-enabled [data-plyr=fullscreen],.plyr--pip-supported [data-plyr=pip]{display:inline-block}.plyr__menu{display:flex;position:relative}.plyr__menu .plyr__control svg{transition:transform .3s ease}.plyr__menu .plyr__control[aria-expanded=true] svg{transform:rotate(90deg)}.plyr__menu .plyr__control[aria-expanded=true] .plyr__tooltip{display:none}.plyr__menu__container{animation:plyr-popup .2s ease;background:#ffffffe6;background:var(--plyr-menu-background,#ffffffe6);border-radius:8px;border-radius:var(--plyr-menu-radius,8px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-menu-shadow,0 1px 2px #00000026);color:#4a5464;color:var(--plyr-menu-color,#4a5464);font-size:15px;font-size:var(--plyr-font-size-base,15px);margin-bottom:10px;position:absolute;right:-3px;text-align:left;white-space:nowrap;z-index:3}.plyr__menu__container>div{overflow:hidden;transition:height .35s cubic-bezier(.4,0,.2,1),width .35s cubic-bezier(.4,0,.2,1)}.plyr__menu__container:after{border:4px solid #0000;border-top-color:#ffffffe6;border:var(--plyr-menu-arrow-size,4px) solid #0000;border-top-color:var(--plyr-menu-background,#ffffffe6);content:"";height:0;position:absolute;right:14px;right:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7 - var(--plyr-menu-arrow-size, 4px)/2);top:100%;width:0}.plyr__menu__container [role=menu]{padding:7px;padding:calc(var(--plyr-control-spacing, 10px)*.7)}.plyr__menu__container [role=menuitem],.plyr__menu__container [role=menuitemradio]{margin-top:2px}.plyr__menu__container [role=menuitem]:first-child,.plyr__menu__container [role=menuitemradio]:first-child{margin-top:0}.plyr__menu__container .plyr__control{align-items:center;color:#4a5464;color:var(--plyr-menu-color,#4a5464);display:flex;font-size:13px;font-size:var(--plyr-font-size-menu,var(--plyr-font-size-small,13px));padding:4.66667px 10.5px;padding:calc(var(--plyr-control-spacing, 10px)*.7/1.5) calc(var(--plyr-control-spacing, 10px)*.7*1.5);-webkit-user-select:none;user-select:none;width:100%}.plyr__menu__container .plyr__control>span{align-items:inherit;display:flex;width:100%}.plyr__menu__container .plyr__control:after{border:4px solid #0000;border:var(--plyr-menu-item-arrow-size,4px) solid #0000;content:"";position:absolute;top:50%;transform:translateY(-50%)}.plyr__menu__container .plyr__control--forward{padding-right:28px;padding-right:calc(var(--plyr-control-spacing, 10px)*.7*4)}.plyr__menu__container .plyr__control--forward:after{border-left-color:#728197;border-left-color:var(--plyr-menu-arrow-color,#728197);right:6.5px;right:calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))}.plyr__menu__container .plyr__control--forward:focus-visible:after,.plyr__menu__container .plyr__control--forward:hover:after{border-left-color:initial}.plyr__menu__container .plyr__control--back{font-weight:400;font-weight:var(--plyr-font-weight-regular,400);margin:7px;margin:calc(var(--plyr-control-spacing, 10px)*.7);margin-bottom:3.5px;margin-bottom:calc(var(--plyr-control-spacing, 10px)*.7/2);padding-left:28px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7*4);position:relative;width:calc(100% - 14px);width:calc(100% - var(--plyr-control-spacing, 10px)*.7*2)}.plyr__menu__container .plyr__control--back:after{border-right-color:#728197;border-right-color:var(--plyr-menu-arrow-color,#728197);left:6.5px;left:calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))}.plyr__menu__container .plyr__control--back:before{background:#dcdfe5;background:var(--plyr-menu-back-border-color,#dcdfe5);box-shadow:0 1px #fff;box-shadow:0 1px 0 var(--plyr-menu-back-border-shadow-color,#fff);content:"";height:1px;left:0;margin-top:3.5px;margin-top:calc(var(--plyr-control-spacing, 10px)*.7/2);overflow:hidden;position:absolute;right:0;top:100%}.plyr__menu__container .plyr__control--back:focus-visible:after,.plyr__menu__container .plyr__control--back:hover:after{border-right-color:initial}.plyr__menu__container .plyr__control[role=menuitemradio]{padding-left:7px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7)}.plyr__menu__container .plyr__control[role=menuitemradio]:after,.plyr__menu__container .plyr__control[role=menuitemradio]:before{border-radius:100%}.plyr__menu__container .plyr__control[role=menuitemradio]:before{background:#0000001a;content:"";display:block;flex-shrink:0;height:16px;margin-right:10px;margin-right:var(--plyr-control-spacing,10px);transition:all .3s ease;width:16px}.plyr__menu__container .plyr__control[role=menuitemradio]:after{background:#fff;border:0;height:6px;left:12px;opacity:0;top:50%;transform:translateY(-50%) scale(0);transition:transform .3s ease,opacity .3s ease;width:6px}.plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:before{background:#00b2ff;background:var(--plyr-control-toggle-checked-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))}.plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:after{opacity:1;transform:translateY(-50%) scale(1)}.plyr__menu__container .plyr__control[role=menuitemradio]:focus-visible:before,.plyr__menu__container .plyr__control[role=menuitemradio]:hover:before{background:#23282f1a}.plyr__menu__container .plyr__menu__value{align-items:center;display:flex;margin-left:auto;margin-right:-5px;margin-right:calc(var(--plyr-control-spacing, 10px)*.7*-1 - -2px);overflow:hidden;padding-left:24.5px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7*3.5);pointer-events:none}.plyr--full-ui input[type=range]{-webkit-appearance:none;appearance:none;background:#0000;border:0;border-radius:26px;border-radius:calc(var(--plyr-range-thumb-height, 13px)*2);color:#00b2ff;color:var(--plyr-range-fill-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));display:block;height:19px;height:calc(var(--plyr-range-thumb-active-shadow-width, 3px)*2 + var(--plyr-range-thumb-height, 13px));margin:0;min-width:0;padding:0;transition:box-shadow .3s ease;width:100%}.plyr--full-ui input[type=range]::-webkit-slider-runnable-track{background:#0000;background-image:linear-gradient(90deg,currentColor 0,#0000 0);background-image:linear-gradient(to right,currentColor var(--value,0),#0000 var(--value,0));border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-webkit-transition:box-shadow .3s ease;transition:box-shadow .3s ease;-webkit-user-select:none;user-select:none}.plyr--full-ui input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);margin-top:-4px;margin-top:calc((var(--plyr-range-thumb-height, 13px) - var(--plyr-range-track-height, 5px))/2*-1);position:relative;-webkit-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-moz-range-track{background:#0000;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-moz-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-moz-range-thumb{background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);position:relative;-moz-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-moz-range-progress{background:currentColor;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px)}.plyr--full-ui input[type=range]::-ms-track{color:#0000}.plyr--full-ui input[type=range]::-ms-fill-upper,.plyr--full-ui input[type=range]::-ms-track{background:#0000;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-ms-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-ms-fill-lower{background:#0000;background:currentColor;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-ms-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-ms-thumb{background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);margin-top:0;position:relative;-ms-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-ms-tooltip{display:none}.plyr--full-ui input[type=range]::-moz-focus-outer{border:0}.plyr--full-ui input[type=range]:focus{outline:0}.plyr--full-ui input[type=range]:focus-visible::-webkit-slider-runnable-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr--full-ui input[type=range]:focus-visible::-moz-range-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr--full-ui input[type=range]:focus-visible::-ms-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr__poster{background-color:#000;background-color:var(--plyr-video-background,var(--plyr-video-background,#000));background-position:50% 50%;background-repeat:no-repeat;background-size:contain;height:100%;left:0;opacity:0;position:absolute;top:0;transition:opacity .2s ease;width:100%;z-index:1}.plyr--stopped.plyr__poster-enabled .plyr__poster{opacity:1}.plyr--youtube.plyr--paused.plyr__poster-enabled:not(.plyr--stopped) .plyr__poster{display:none}.plyr__time{font-size:13px;font-size:var(--plyr-font-size-time,var(--plyr-font-size-small,13px))}.plyr__time+.plyr__time:before{content:"\\2044";margin-right:10px;margin-right:var(--plyr-control-spacing,10px)}@media (max-width:767px){.plyr__time+.plyr__time{display:none}}.plyr__tooltip{background:#fff;background:var(--plyr-tooltip-background,#fff);border-radius:5px;border-radius:var(--plyr-tooltip-radius,5px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-tooltip-shadow,0 1px 2px #00000026);color:#4a5464;color:var(--plyr-tooltip-color,#4a5464);font-size:13px;font-size:var(--plyr-font-size-small,13px);font-weight:400;font-weight:var(--plyr-font-weight-regular,400);left:50%;line-height:1.3;margin-bottom:10px;margin-bottom:calc(var(--plyr-control-spacing, 10px)/2*2);opacity:0;padding:5px 7.5px;padding:calc(var(--plyr-control-spacing, 10px)/2) calc(var(--plyr-control-spacing, 10px)/2*1.5);pointer-events:none;position:absolute;transform:translate(-50%,10px) scale(.8);transform-origin:50% 100%;transition:transform .2s ease .1s,opacity .2s ease .1s;white-space:nowrap;z-index:2}.plyr__tooltip:before{border-left:4px solid #0000;border-left:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-right:4px solid #0000;border-right:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-top:4px solid #fff;border-top:var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff);bottom:-4px;bottom:calc(var(--plyr-tooltip-arrow-size, 4px)*-1);content:"";height:0;left:50%;position:absolute;transform:translate(-50%);width:0;z-index:2}.plyr .plyr__control:focus-visible .plyr__tooltip,.plyr .plyr__control:hover .plyr__tooltip,.plyr__tooltip--visible{opacity:1;transform:translate(-50%) scale(1)}.plyr .plyr__control:hover .plyr__tooltip{z-index:3}.plyr__controls>.plyr__control:first-child .plyr__tooltip,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip{left:0;transform:translateY(10px) scale(.8);transform-origin:0 100%}.plyr__controls>.plyr__control:first-child .plyr__tooltip:before,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip:before{left:16px;left:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7)}.plyr__controls>.plyr__control:last-child .plyr__tooltip{left:auto;right:0;transform:translateY(10px) scale(.8);transform-origin:100% 100%}.plyr__controls>.plyr__control:last-child .plyr__tooltip:before{left:auto;right:16px;right:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7);transform:translate(50%)}.plyr__controls>.plyr__control:first-child .plyr__tooltip--visible,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip--visible,.plyr__controls>.plyr__control:first-child+.plyr__control:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:first-child+.plyr__control:hover .plyr__tooltip,.plyr__controls>.plyr__control:first-child:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:first-child:hover .plyr__tooltip,.plyr__controls>.plyr__control:last-child .plyr__tooltip--visible,.plyr__controls>.plyr__control:last-child:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:last-child:hover .plyr__tooltip{transform:translate(0) scale(1)}.plyr__progress{left:6.5px;left:calc(var(--plyr-range-thumb-height, 13px)*.5);margin-right:13px;margin-right:var(--plyr-range-thumb-height,13px);position:relative}.plyr__progress input[type=range],.plyr__progress__buffer{margin-left:-6.5px;margin-left:calc(var(--plyr-range-thumb-height, 13px)*-.5);margin-right:-6.5px;margin-right:calc(var(--plyr-range-thumb-height, 13px)*-.5);width:calc(100% + 13px);width:calc(100% + var(--plyr-range-thumb-height, 13px))}.plyr__progress input[type=range]{position:relative;z-index:2}.plyr__progress .plyr__tooltip{left:0;max-width:120px;overflow-wrap:break-word}.plyr__progress__buffer{-webkit-appearance:none;background:#0000;border:0;border-radius:100px;height:5px;height:var(--plyr-range-track-height,5px);left:0;margin-top:-2.5px;margin-top:calc((var(--plyr-range-track-height, 5px)/2)*-1);padding:0;position:absolute;top:50%}.plyr__progress__buffer::-webkit-progress-bar{background:#0000}.plyr__progress__buffer::-webkit-progress-value{background:currentColor;border-radius:100px;min-width:5px;min-width:var(--plyr-range-track-height,5px);-webkit-transition:width .2s ease;transition:width .2s ease}.plyr__progress__buffer::-moz-progress-bar{background:currentColor;border-radius:100px;min-width:5px;min-width:var(--plyr-range-track-height,5px);-moz-transition:width .2s ease;transition:width .2s ease}.plyr__progress__buffer::-ms-fill{border-radius:100px;-ms-transition:width .2s ease;transition:width .2s ease}.plyr--loading .plyr__progress__buffer{animation:plyr-progress 1s linear infinite;background-image:linear-gradient(-45deg,#23282f99 25%,#0000 0,#0000 50%,#23282f99 0,#23282f99 75%,#0000 0,#0000);background-image:linear-gradient(-45deg,var(--plyr-progress-loading-background,#23282f99) 25%,#0000 25%,#0000 50%,var(--plyr-progress-loading-background,#23282f99) 50%,var(--plyr-progress-loading-background,#23282f99) 75%,#0000 75%,#0000);background-repeat:repeat-x;background-size:25px 25px;background-size:var(--plyr-progress-loading-size,25px) var(--plyr-progress-loading-size,25px);color:#0000}.plyr--video.plyr--loading .plyr__progress__buffer{background-color:#ffffff40;background-color:var(--plyr-video-progress-buffered-background,#ffffff40)}.plyr--audio.plyr--loading .plyr__progress__buffer{background-color:#c1c8d199;background-color:var(--plyr-audio-progress-buffered-background,#c1c8d199)}.plyr__progress__marker{background-color:#fff;background-color:var(--plyr-progress-marker-background,#fff);border-radius:1px;height:5px;height:var(--plyr-range-track-height,5px);position:absolute;top:50%;transform:translate(-50%,-50%);width:3px;width:var(--plyr-progress-marker-width,3px);z-index:3}.plyr__volume{align-items:center;display:flex;position:relative}.plyr__volume input[type=range]{margin-left:5px;margin-left:calc(var(--plyr-control-spacing, 10px)/2);margin-right:5px;margin-right:calc(var(--plyr-control-spacing, 10px)/2);max-width:90px;min-width:60px;position:relative;z-index:2}.plyr--audio{display:block}.plyr--audio .plyr__controls{background:#fff;background:var(--plyr-audio-controls-background,#fff);border-radius:inherit;color:#4a5464;color:var(--plyr-audio-control-color,#4a5464);padding:10px;padding:var(--plyr-control-spacing,10px)}.plyr--audio .plyr__control:focus-visible,.plyr--audio .plyr__control:hover,.plyr--audio .plyr__control[aria-expanded=true]{background:#00b2ff;background:var(--plyr-audio-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));color:#fff;color:var(--plyr-audio-control-color-hover,#fff)}.plyr--full-ui.plyr--audio input[type=range]::-webkit-slider-runnable-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]::-moz-range-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]::-ms-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]:active::-webkit-slider-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--full-ui.plyr--audio input[type=range]:active::-moz-range-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--full-ui.plyr--audio input[type=range]:active::-ms-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--audio .plyr__progress__buffer{color:#c1c8d199;color:var(--plyr-audio-progress-buffered-background,#c1c8d199)}.plyr--video{overflow:hidden}.plyr--video.plyr--menu-open{overflow:visible}.plyr__video-wrapper{background:#000;background:var(--plyr-video-background,var(--plyr-video-background,#000));border-radius:inherit;height:100%;margin:auto;overflow:hidden;position:relative;width:100%}.plyr__video-embed,.plyr__video-wrapper--fixed-ratio{aspect-ratio:16/9}@supports not (aspect-ratio:16/9){.plyr__video-embed,.plyr__video-wrapper--fixed-ratio{height:0;padding-bottom:56.25%;position:relative}}.plyr__video-embed iframe,.plyr__video-wrapper--fixed-ratio video{border:0;height:100%;left:0;position:absolute;top:0;width:100%}.plyr--full-ui .plyr__video-embed>.plyr__video-embed__container{padding-bottom:240%;position:relative;transform:translateY(-38.28125%)}.plyr--video .plyr__controls{background:linear-gradient(#0000,#000000bf);background:var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf));border-bottom-left-radius:inherit;border-bottom-right-radius:inherit;bottom:0;color:#fff;color:var(--plyr-video-control-color,#fff);left:0;padding:5px;padding:calc(var(--plyr-control-spacing, 10px)/2);padding-top:20px;padding-top:calc(var(--plyr-control-spacing, 10px)*2);position:absolute;right:0;transition:opacity .4s ease-in-out,transform .4s ease-in-out;z-index:3}@media (min-width:480px){.plyr--video .plyr__controls{padding:10px;padding:var(--plyr-control-spacing,10px);padding-top:35px;padding-top:calc(var(--plyr-control-spacing, 10px)*3.5)}}.plyr--video.plyr--hide-controls .plyr__controls{opacity:0;pointer-events:none;transform:translateY(100%)}.plyr--video .plyr__control:focus-visible,.plyr--video .plyr__control:hover,.plyr--video .plyr__control[aria-expanded=true]{background:#00b2ff;background:var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));color:#fff;color:var(--plyr-video-control-color-hover,#fff)}.plyr__control--overlaid{background:#00b2ff;background:var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));border:0;border-radius:100%;color:#fff;color:var(--plyr-video-control-color,#fff);display:none;left:50%;opacity:.9;padding:15px;padding:calc(var(--plyr-control-spacing, 10px)*1.5);position:absolute;top:50%;transform:translate(-50%,-50%);transition:.3s;z-index:2}.plyr__control--overlaid svg{left:2px;position:relative}.plyr__control--overlaid:focus,.plyr__control--overlaid:hover{opacity:1}.plyr--playing .plyr__control--overlaid{opacity:0;visibility:hidden}.plyr--full-ui.plyr--video .plyr__control--overlaid{display:block}.plyr--full-ui.plyr--video input[type=range]::-webkit-slider-runnable-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]::-moz-range-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]::-ms-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]:active::-webkit-slider-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--full-ui.plyr--video input[type=range]:active::-moz-range-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--full-ui.plyr--video input[type=range]:active::-ms-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--video .plyr__progress__buffer{color:#ffffff40;color:var(--plyr-video-progress-buffered-background,#ffffff40)}.plyr:fullscreen{background:#000;border-radius:0!important;height:100%;margin:0;width:100%}.plyr:fullscreen video{height:100%}.plyr:fullscreen .plyr__control .icon--exit-fullscreen{display:block}.plyr:fullscreen .plyr__control .icon--exit-fullscreen+svg{display:none}.plyr:fullscreen.plyr--hide-controls{cursor:none}@media (min-width:1024px){.plyr:fullscreen .plyr__captions{font-size:21px;font-size:var(--plyr-font-size-xlarge,21px)}}.plyr--fullscreen-fallback{background:#000;border-radius:0!important;bottom:0;height:100%;left:0;margin:0;position:fixed;right:0;top:0;width:100%;z-index:10000000}.plyr--fullscreen-fallback video{height:100%}.plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen{display:block}.plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen+svg{display:none}.plyr--fullscreen-fallback.plyr--hide-controls{cursor:none}@media (min-width:1024px){.plyr--fullscreen-fallback .plyr__captions{font-size:21px;font-size:var(--plyr-font-size-xlarge,21px)}}.plyr__ads{border-radius:inherit;bottom:0;cursor:pointer;left:0;overflow:hidden;position:absolute;right:0;top:0;z-index:-1}.plyr__ads>div,.plyr__ads>div iframe{height:100%;position:absolute;width:100%}.plyr__ads:after{background:#23282f;border-radius:2px;bottom:10px;bottom:var(--plyr-control-spacing,10px);color:#fff;content:attr(data-badge-text);font-size:11px;padding:2px 6px;pointer-events:none;position:absolute;right:10px;right:var(--plyr-control-spacing,10px);z-index:3}.plyr__ads:empty:after{display:none}.plyr__cues{background:currentColor;display:block;height:5px;height:var(--plyr-range-track-height,5px);left:0;opacity:.8;position:absolute;top:50%;transform:translateY(-50%);width:3px;z-index:3}.plyr__preview-thumb{background-color:#fff;background-color:var(--plyr-tooltip-background,#fff);border-radius:8px;border-radius:var(--plyr-menu-radius,8px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-tooltip-shadow,0 1px 2px #00000026);margin-bottom:10px;margin-bottom:calc(var(--plyr-control-spacing, 10px)/2*2);opacity:0;padding:3px;pointer-events:none;position:absolute;transform:translateY(10px) scale(.8);transform-origin:50% 100%;transition:transform .2s ease .1s,opacity .2s ease .1s;z-index:2}.plyr__preview-thumb--is-shown{opacity:1;transform:translate(0) scale(1)}.plyr__preview-thumb:before{border-left:4px solid #0000;border-left:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-right:4px solid #0000;border-right:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-top:4px solid #fff;border-top:var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff);bottom:-4px;bottom:calc(var(--plyr-tooltip-arrow-size, 4px)*-1);content:"";height:0;left:calc(50% + var(--preview-arrow-offset));position:absolute;transform:translate(-50%);width:0;z-index:2}.plyr__preview-thumb__image-container{background:#c1c8d1;border-radius:7px;border-radius:calc(var(--plyr-menu-radius, 8px) - 1px);overflow:hidden;position:relative;z-index:0}.plyr__preview-thumb__image-container img,.plyr__preview-thumb__image-container:after{height:100%;left:0;position:absolute;top:0;width:100%}.plyr__preview-thumb__image-container:after{border-radius:inherit;box-shadow:inset 0 0 0 1px #00000026;content:"";pointer-events:none}.plyr__preview-thumb__image-container img{max-height:none;max-width:none}.plyr__preview-thumb__time-container{background:linear-gradient(#0000,#000000bf);background:var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf));border-bottom-left-radius:7px;border-bottom-left-radius:calc(var(--plyr-menu-radius, 8px) - 1px);border-bottom-right-radius:7px;border-bottom-right-radius:calc(var(--plyr-menu-radius, 8px) - 1px);bottom:0;left:0;line-height:1.1;padding:20px 6px 6px;position:absolute;right:0;z-index:3}.plyr__preview-thumb__time-container span{color:#fff;font-size:13px;font-size:var(--plyr-font-size-time,var(--plyr-font-size-small,13px))}.plyr__preview-scrubbing{bottom:0;filter:blur(1px);height:100%;left:0;margin:auto;opacity:0;overflow:hidden;pointer-events:none;position:absolute;right:0;top:0;transition:opacity .3s ease;width:100%;z-index:1}.plyr__preview-scrubbing--is-shown{opacity:1}.plyr__preview-scrubbing img{height:100%;left:0;max-height:none;max-width:none;object-fit:contain;position:absolute;top:0;width:100%}.plyr--no-transition{transition:none!important}.plyr__sr-only{clip:rect(1px,1px,1px,1px);border:0!important;height:1px!important;overflow:hidden;padding:0!important;position:absolute!important;width:1px!important}.plyr [hidden]{display:none!important}.plyr--video{width:100%;height:100%}.plyr--audio-wrp{width:100%;height:100%;display:flex;align-items:center}.plyr--audio{width:120%;height:100%;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end;background-color:none;--plyr-audio-controls-background: rgba(0, 0, 0, .5);--plyr-audio-control-color: #fff;border-radius:12px}.plyr__close img{width:24px;height:24px}.telebox-color-scheme-dark .plyr--audio{color-scheme:dark;background-color:#121212;--plyr-audio-controls-background: #121212;--plyr-audio-control-color: #eee}.disbale-progress .plyr__progress{pointer-events:none}.disbale-progress .plyr__volume{pointer-events:none;display:none}.is-mobile .plyr__progress{pointer-events:none}.is-mobile .plyr__volume{pointer-events:none;display:none}.is-mobile .plyr__control{display:none}.app-plyr-loading{display:flex;justify-content:center;align-items:center;width:100%;height:100%;position:absolute;top:0;left:0;z-index:100;background:white}.app-plyr-loader{border:4px solid rgb(57,171,255);border-left-color:transparent;width:36px;height:36px;animation:spin 1s linear infinite;border-radius:100%}@keyframes spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}\n';
const _ua = (_a = window.navigator) == null ? void 0 : _a.userAgent;
_ua == null ? void 0 : _ua.match(/(Edge?)\/(\d+)/);
const isIOS = () => {
  return typeof navigator !== "undefined" && typeof window !== "undefined" && /iPad|iPhone|iPod/.test(_ua);
};
const isAndroid = () => {
  return typeof navigator !== "undefined" && /Android/.test(_ua);
};
var closeSvg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNCOTM5M0IiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNi4yMDcxIDkuMjA3MTFDMTYuNTk3NiA4LjgxNjU4IDE2LjU5NzYgOC4xODM0MiAxNi4yMDcxIDcuNzkyODlDMTUuODE2NiA3LjQwMjM3IDE1LjE4MzQgNy40MDIzNyAxNC43OTI5IDcuNzkyODlMMTIgMTAuNTg1OEw5LjIwNzExIDcuNzkyODlDOC44MTY1OCA3LjQwMjM3IDguMTgzNDIgNy40MDIzNyA3Ljc5Mjg5IDcuNzkyODlDNy40MDIzNyA4LjE4MzQyIDcuNDAyMzcgOC44MTY1OCA3Ljc5Mjg5IDkuMjA3MTFMMTAuNTg1OCAxMkw3Ljc5Mjg5IDE0Ljc5MjlDNy40MDIzNyAxNS4xODM0IDcuNDAyMzcgMTUuODE2NiA3Ljc5Mjg5IDE2LjIwNzFDOC4xODM0MiAxNi41OTc2IDguODE2NTggMTYuNTk3NiA5LjIwNzExIDE2LjIwNzFMMTIgMTMuNDE0MkwxNC43OTI5IDE2LjIwNzFDMTUuMTgzNCAxNi41OTc2IDE1LjgxNjYgMTYuNTk3NiAxNi4yMDcxIDE2LjIwNzFDMTYuNTk3NiAxNS44MTY2IDE2LjU5NzYgMTUuMTgzNCAxNi4yMDcxIDE0Ljc5MjlMMTMuNDE0MiAxMkwxNi4yMDcxIDkuMjA3MTFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";
const ClickThroughAppliances = /* @__PURE__ */ new Set(["clicker"]);
const DefaultAttributes = {
  volume: 1,
  paused: true,
  muted: false,
  currentTime: 0
};
const Plyr = {
  kind: "Plyr",
  config: {
    minwidth: 300,
    minheight: 80
  },
  setup(context) {
    const storage = context.storage;
    if (context == null ? void 0 : context.getIsWritable()) {
      storage.ensureState(DefaultAttributes);
    }
    if (!storage.state.src) {
      context.emitter.emit("destroy", {
        error: new Error(`[Plyr]: missing "src"`)
      });
      return;
    }
    if (!storage.state.type && !storage.state.provider) {
      console.warn(`[Plyr]: missing "type", will guess from file extension`);
    }
    const type = storage.state.type || guessTypeFromSrc(storage.state.src);
    const box = context.getBox();
    const room = context.getRoom();
    box.mountStyles(styles);
    box.$box.classList.toggle("is-mobile", isIOS() || isAndroid());
    const loading = document.createElement("div");
    loading.className = "app-plyr-loading";
    const loader = document.createElement("div");
    loader.className = "app-plyr-loader";
    loading.appendChild(loader);
    if (type == null ? void 0 : type.startsWith("video/")) {
      box.$content.appendChild(loading);
    }
    const sync = new Sync(context);
    const app = new Player({
      target: box.$content,
      props: {
        storage: context.storage,
        sync,
        readonly: isIOS() || isAndroid() || !(context == null ? void 0 : context.getIsWritable()),
        isMobile: isIOS() || isAndroid()
      }
    });
    setTimeout(() => {
      loading.remove();
    }, 300);
    context.emitter.on("writableChange", (writable) => {
      app.$set({ readonly: isIOS() || isAndroid() || !writable });
    });
    context.emitter.on("destroy", () => {
      try {
        sync.dispose();
        app.$destroy();
      } catch (err) {
      }
    });
    const shouldClickThrough = (tool) => {
      return ClickThroughAppliances.has(tool);
    };
    if (type == null ? void 0 : type.startsWith("audio/")) {
      box.$box.style.pointerEvents = "none";
      box.$titleBar.style.display = "none";
      const wrp = box.$box.querySelector(".telebox-content-wrap");
      if (wrp) {
        wrp.style.background = "none";
        const boxMain = box.$box.querySelector(".telebox-box-main");
        if (boxMain) {
          boxMain.style.background = "none";
          boxMain.style.pointerEvents = "none";
        }
      }
      const content = box.$box.querySelector(".telebox-content");
      if (content) {
        content.style.background = "none";
        const p = content.querySelector(".plyr__controls");
        if (p) {
          const close = document.createElement("button");
          close.className = "plyr__controls__item plyr__close plyr__control";
          const img = document.createElement("img");
          img.src = closeSvg;
          close.appendChild(img);
          close.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            box._delegateEvents.emit("close");
          });
          p.appendChild(close);
          const toggleClickThrough = (enable) => {
            p.style.pointerEvents = enable ? "none" : "auto";
            img.style.display = enable ? "none" : "block";
          };
          if (room == null ? void 0 : room.state.memberState.currentApplianceName) {
            toggleClickThrough(!shouldClickThrough(room == null ? void 0 : room.state.memberState.currentApplianceName));
          }
          if (room) {
            const onRoomStateChanged = (e) => {
              if (e.memberState) {
                toggleClickThrough(!shouldClickThrough(e.memberState.currentApplianceName));
              }
            };
            room.callbacks.on("onRoomStateChanged", onRoomStateChanged);
          }
        }
      }
    }
  }
};
export { Plyr as default };
//# sourceMappingURL=main.es.js.map
