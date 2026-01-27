import { PublicKey as Ne, MessageV0 as Wr, VersionedTransaction as $0, Keypair as Gr, Transaction as mr, Connection as Kr } from "@solana/web3.js";
import { ethers as j0 } from "ethers";
import { BigNumber as V0 } from "bignumber.js";
import { getAssociatedTokenAddress as mt, createTransferInstruction as Vr, TOKEN_PROGRAM_ID as Xr } from "@solana/spl-token";
let Zr = class {
  constructor(t) {
    this.provider = t, this.swapper = {}, this.estimate = {
      swap: this._estimateSwap.bind(this),
      transfer: this._estimateTransfer.bind(this)
    };
  }
  async transfer(t, e = {}) {
    if (!t.signer)
      throw new Error("Signer is required");
    return t.tokenAddress === "0x0000000000000000000000000000000000000000" || t.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? (await this.provider.getSigner().sendTransaction({
      ...e,
      to: t.to,
      value: t.amount
    })).hash : (await new j0.Contract(t.tokenAddress, ["function transfer(address to, uint amount) returns (bool)"], t.signer).transfer(t.to, t.amount, e)).hash;
  }
  async swap(t, e) {
    const r = await this.provider.getTransactionCount(t.address, "latest"), a = t.signTransaction({
      to: e.to,
      data: e.data,
      gasLimit: e.gas,
      chainId: this.provider.network.chainId,
      nonce: r
    });
    return await this.provider.send("eth_sendRawTransaction", [a]);
  }
  async load(t) {
    if (this.swapper[t.name()])
      throw new Error(`Swapper already loaded. ${t.name()}`);
    this.swapper[t.name()] = t;
  }
  async _estimateTransfer(t, e) {
    return t.tokenAddress === "0x0000000000000000000000000000000000000000" || t.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? (await this.provider.estimateGas({
      to: t.to,
      value: t.amount,
      from: (e == null ? void 0 : e.from) || this.provider.getSigner().getAddress()
      // Use the overrideParams from if provided, otherwise use the signer's address
    })).toString() : (await new j0.Contract(t.tokenAddress, ["function transfer(address to, uint amount) returns (bool)"], this.provider).estimateGas.transfer(t.to, t.amount, {
      from: (e == null ? void 0 : e.from) || this.provider.getSigner().getAddress()
      // Use the overrideParams from if provided, otherwise use the signer's address
    })).toString();
  }
  async _estimateSwap(t, e) {
    let r = this.provider.network.chainId;
    r || (r = await this.provider.getNetwork().then((x) => x.chainId));
    let a = t.prefferRouters || Object.keys(this.swapper);
    if (a.length === 0)
      throw new Error("No router available");
    let o;
    for (const x of a) {
      const s = this.swapper[x];
      if (s && s.enabled(r))
        try {
          return await Promise.race([
            s.estimate(t, e),
            new Promise((u, l) => setTimeout(() => l(new Error("Timeout")), 3e4))
          ]);
        } catch (h) {
          o = h;
        }
    }
    throw o || new Error("No router available");
  }
};
const vt = {
  324: "0xD1f1bA4BF2aDe4F47472D0B73ba0f5DC30E225DF",
  80094: "0x7d55D31adFde09f48d35cfcA13c08A31EBc790CB"
}, Yr = {
  324: "https://swap.hold.so/api",
  80094: "https://swap.hold.so/berachain/api"
}, Qr = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
function Jr(c) {
  return c.toLowerCase() === Qr.toLowerCase();
}
class en {
  constructor(t) {
    this.provider = t;
  }
  async estimate(t, e) {
    const r = {
      src: t.fromToken,
      dst: t.toToken,
      amount: t.amount,
      receiver: (e == null ? void 0 : e.from) ?? j0.constants.AddressZero,
      slippage: Number(t.slippage) / 100
    }, a = await this.fetchSwapParams(r), o = this.provider.network.chainId, x = Jr(t.fromToken) ? t.amount : "0";
    let s = e == null ? void 0 : e.gasLimit;
    return s || (s = await this.provider.estimateGas({
      from: (e == null ? void 0 : e.from) ?? j0.constants.AddressZero,
      to: vt[o],
      data: a.tx.data,
      value: x
    }).then((h) => h.toString())), {
      to: vt[o],
      gas: s ?? "0",
      data: a.tx.data,
      addons: {
        amountOut: a.quote.amount,
        amountOutUsd: a.quote.amountUsd,
        minAmountOut: a.quote.minReceive,
        protocols: a.quote.protocols.map((h) => ({
          amount: h.amount,
          swaps: h.swaps.map((u) => ({
            amount: u.amount,
            from: u.from,
            pool: u.pool,
            protocol: u.protocol,
            to: u.to
          }))
        }))
      }
    };
  }
  name() {
    return "hold.so";
  }
  enabled(t) {
    return t === 324 || t === 80094;
  }
  async fetchSwapParams(t) {
    const e = this.provider.network.chainId, r = Yr[e] + "/swap", a = new URL(r);
    for (const [s, h] of Object.entries(t))
      a.searchParams.append(s, h.toString());
    const o = await fetch(a.toString(), { method: "GET" });
    if (!o.ok) {
      const s = await o.text();
      throw new Error(`HTTP ${o.status}: ${s}`);
    }
    return await o.json();
  }
}
class tn {
  constructor() {
  }
  async estimate(t, e) {
    throw new Error("Method not implemented.");
  }
  name() {
    return "kyberswap";
  }
  enabled(t) {
    return !1;
  }
}
let rn = class {
  constructor() {
  }
  async estimate(t, e) {
    throw new Error("Method not implemented.");
  }
  name() {
    return "okx";
  }
  enabled(t) {
    return !1;
  }
};
const it = (c = {}) => {
  const t = {
    isDebug: !!c.isDebug,
    prefix: c.prefix
  }, e = (o) => t.prefix ? `[${t.prefix}] ${o}` : o, r = (o, x, s) => {
    if ((o === "debug" || o === "info") && !t.isDebug)
      return;
    const u = e(x);
    if (s !== void 0) {
      console[o](u, s);
      return;
    }
    console[o](u);
  };
  return {
    debug: (o, x) => {
      r("debug", o, x);
    },
    info: (o, x) => {
      r("info", o, x);
    },
    warn: (o, x) => {
      r("warn", o, x);
    },
    error: (o, x) => {
      r("error", o, x);
    },
    withOptions: (o = {}) => {
      const x = {
        ...t,
        ...o
      };
      return it(x);
    }
  };
};
var Ge = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function at(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c;
}
function nn(c) {
  if (Object.prototype.hasOwnProperty.call(c, "__esModule")) return c;
  var t = c.default;
  if (typeof t == "function") {
    var e = function r() {
      return this instanceof r ? Reflect.construct(t, arguments, this.constructor) : t.apply(this, arguments);
    };
    e.prototype = t.prototype;
  } else e = {};
  return Object.defineProperty(e, "__esModule", { value: !0 }), Object.keys(c).forEach(function(r) {
    var a = Object.getOwnPropertyDescriptor(c, r);
    Object.defineProperty(e, r, a.get ? a : {
      enumerable: !0,
      get: function() {
        return c[r];
      }
    });
  }), e;
}
var Y0 = { exports: {} }, Ke = {}, K0 = {}, Bt;
function an() {
  if (Bt) return K0;
  Bt = 1, K0.byteLength = s, K0.toByteArray = u, K0.fromByteArray = d;
  for (var c = [], t = [], e = typeof Uint8Array < "u" ? Uint8Array : Array, r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, o = r.length; a < o; ++a)
    c[a] = r[a], t[r.charCodeAt(a)] = a;
  t[45] = 62, t[95] = 63;
  function x(p) {
    var m = p.length;
    if (m % 4 > 0)
      throw new Error("Invalid string. Length must be a multiple of 4");
    var E = p.indexOf("=");
    E === -1 && (E = m);
    var A = E === m ? 0 : 4 - E % 4;
    return [E, A];
  }
  function s(p) {
    var m = x(p), E = m[0], A = m[1];
    return (E + A) * 3 / 4 - A;
  }
  function h(p, m, E) {
    return (m + E) * 3 / 4 - E;
  }
  function u(p) {
    var m, E = x(p), A = E[0], C = E[1], g = new e(h(p, A, C)), B = 0, F = C > 0 ? A - 4 : A, b;
    for (b = 0; b < F; b += 4)
      m = t[p.charCodeAt(b)] << 18 | t[p.charCodeAt(b + 1)] << 12 | t[p.charCodeAt(b + 2)] << 6 | t[p.charCodeAt(b + 3)], g[B++] = m >> 16 & 255, g[B++] = m >> 8 & 255, g[B++] = m & 255;
    return C === 2 && (m = t[p.charCodeAt(b)] << 2 | t[p.charCodeAt(b + 1)] >> 4, g[B++] = m & 255), C === 1 && (m = t[p.charCodeAt(b)] << 10 | t[p.charCodeAt(b + 1)] << 4 | t[p.charCodeAt(b + 2)] >> 2, g[B++] = m >> 8 & 255, g[B++] = m & 255), g;
  }
  function l(p) {
    return c[p >> 18 & 63] + c[p >> 12 & 63] + c[p >> 6 & 63] + c[p & 63];
  }
  function y(p, m, E) {
    for (var A, C = [], g = m; g < E; g += 3)
      A = (p[g] << 16 & 16711680) + (p[g + 1] << 8 & 65280) + (p[g + 2] & 255), C.push(l(A));
    return C.join("");
  }
  function d(p) {
    for (var m, E = p.length, A = E % 3, C = [], g = 16383, B = 0, F = E - A; B < F; B += g)
      C.push(y(p, B, B + g > F ? F : B + g));
    return A === 1 ? (m = p[E - 1], C.push(
      c[m >> 2] + c[m << 4 & 63] + "=="
    )) : A === 2 && (m = (p[E - 2] << 8) + p[E - 1], C.push(
      c[m >> 10] + c[m >> 4 & 63] + c[m << 2 & 63] + "="
    )), C.join("");
  }
  return K0;
}
var Q0 = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var Et;
function sn() {
  return Et || (Et = 1, Q0.read = function(c, t, e, r, a) {
    var o, x, s = a * 8 - r - 1, h = (1 << s) - 1, u = h >> 1, l = -7, y = e ? a - 1 : 0, d = e ? -1 : 1, p = c[t + y];
    for (y += d, o = p & (1 << -l) - 1, p >>= -l, l += s; l > 0; o = o * 256 + c[t + y], y += d, l -= 8)
      ;
    for (x = o & (1 << -l) - 1, o >>= -l, l += r; l > 0; x = x * 256 + c[t + y], y += d, l -= 8)
      ;
    if (o === 0)
      o = 1 - u;
    else {
      if (o === h)
        return x ? NaN : (p ? -1 : 1) * (1 / 0);
      x = x + Math.pow(2, r), o = o - u;
    }
    return (p ? -1 : 1) * x * Math.pow(2, o - r);
  }, Q0.write = function(c, t, e, r, a, o) {
    var x, s, h, u = o * 8 - a - 1, l = (1 << u) - 1, y = l >> 1, d = a === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, p = r ? 0 : o - 1, m = r ? 1 : -1, E = t < 0 || t === 0 && 1 / t < 0 ? 1 : 0;
    for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (s = isNaN(t) ? 1 : 0, x = l) : (x = Math.floor(Math.log(t) / Math.LN2), t * (h = Math.pow(2, -x)) < 1 && (x--, h *= 2), x + y >= 1 ? t += d / h : t += d * Math.pow(2, 1 - y), t * h >= 2 && (x++, h /= 2), x + y >= l ? (s = 0, x = l) : x + y >= 1 ? (s = (t * h - 1) * Math.pow(2, a), x = x + y) : (s = t * Math.pow(2, y - 1) * Math.pow(2, a), x = 0)); a >= 8; c[e + p] = s & 255, p += m, s /= 256, a -= 8)
      ;
    for (x = x << a | s, u += a; u > 0; c[e + p] = x & 255, p += m, x /= 256, u -= 8)
      ;
    c[e + p - m] |= E * 128;
  }), Q0;
}
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var yt;
function on() {
  return yt || (yt = 1, (function(c) {
    const t = an(), e = sn(), r = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
    c.Buffer = s, c.SlowBuffer = g, c.INSPECT_MAX_BYTES = 50;
    const a = 2147483647;
    c.kMaxLength = a, s.TYPED_ARRAY_SUPPORT = o(), !s.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
      "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
    );
    function o() {
      try {
        const f = new Uint8Array(1), n = { foo: function() {
          return 42;
        } };
        return Object.setPrototypeOf(n, Uint8Array.prototype), Object.setPrototypeOf(f, n), f.foo() === 42;
      } catch {
        return !1;
      }
    }
    Object.defineProperty(s.prototype, "parent", {
      enumerable: !0,
      get: function() {
        if (s.isBuffer(this))
          return this.buffer;
      }
    }), Object.defineProperty(s.prototype, "offset", {
      enumerable: !0,
      get: function() {
        if (s.isBuffer(this))
          return this.byteOffset;
      }
    });
    function x(f) {
      if (f > a)
        throw new RangeError('The value "' + f + '" is invalid for option "size"');
      const n = new Uint8Array(f);
      return Object.setPrototypeOf(n, s.prototype), n;
    }
    function s(f, n, i) {
      if (typeof f == "number") {
        if (typeof n == "string")
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        return y(f);
      }
      return h(f, n, i);
    }
    s.poolSize = 8192;
    function h(f, n, i) {
      if (typeof f == "string")
        return d(f, n);
      if (ArrayBuffer.isView(f))
        return m(f);
      if (f == null)
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof f
        );
      if (a0(f, ArrayBuffer) || f && a0(f.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (a0(f, SharedArrayBuffer) || f && a0(f.buffer, SharedArrayBuffer)))
        return E(f, n, i);
      if (typeof f == "number")
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      const v = f.valueOf && f.valueOf();
      if (v != null && v !== f)
        return s.from(v, n, i);
      const w = A(f);
      if (w) return w;
      if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof f[Symbol.toPrimitive] == "function")
        return s.from(f[Symbol.toPrimitive]("string"), n, i);
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof f
      );
    }
    s.from = function(f, n, i) {
      return h(f, n, i);
    }, Object.setPrototypeOf(s.prototype, Uint8Array.prototype), Object.setPrototypeOf(s, Uint8Array);
    function u(f) {
      if (typeof f != "number")
        throw new TypeError('"size" argument must be of type number');
      if (f < 0)
        throw new RangeError('The value "' + f + '" is invalid for option "size"');
    }
    function l(f, n, i) {
      return u(f), f <= 0 ? x(f) : n !== void 0 ? typeof i == "string" ? x(f).fill(n, i) : x(f).fill(n) : x(f);
    }
    s.alloc = function(f, n, i) {
      return l(f, n, i);
    };
    function y(f) {
      return u(f), x(f < 0 ? 0 : C(f) | 0);
    }
    s.allocUnsafe = function(f) {
      return y(f);
    }, s.allocUnsafeSlow = function(f) {
      return y(f);
    };
    function d(f, n) {
      if ((typeof n != "string" || n === "") && (n = "utf8"), !s.isEncoding(n))
        throw new TypeError("Unknown encoding: " + n);
      const i = B(f, n) | 0;
      let v = x(i);
      const w = v.write(f, n);
      return w !== i && (v = v.slice(0, w)), v;
    }
    function p(f) {
      const n = f.length < 0 ? 0 : C(f.length) | 0, i = x(n);
      for (let v = 0; v < n; v += 1)
        i[v] = f[v] & 255;
      return i;
    }
    function m(f) {
      if (a0(f, Uint8Array)) {
        const n = new Uint8Array(f);
        return E(n.buffer, n.byteOffset, n.byteLength);
      }
      return p(f);
    }
    function E(f, n, i) {
      if (n < 0 || f.byteLength < n)
        throw new RangeError('"offset" is outside of buffer bounds');
      if (f.byteLength < n + (i || 0))
        throw new RangeError('"length" is outside of buffer bounds');
      let v;
      return n === void 0 && i === void 0 ? v = new Uint8Array(f) : i === void 0 ? v = new Uint8Array(f, n) : v = new Uint8Array(f, n, i), Object.setPrototypeOf(v, s.prototype), v;
    }
    function A(f) {
      if (s.isBuffer(f)) {
        const n = C(f.length) | 0, i = x(n);
        return i.length === 0 || f.copy(i, 0, 0, n), i;
      }
      if (f.length !== void 0)
        return typeof f.length != "number" || g0(f.length) ? x(0) : p(f);
      if (f.type === "Buffer" && Array.isArray(f.data))
        return p(f.data);
    }
    function C(f) {
      if (f >= a)
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + a.toString(16) + " bytes");
      return f | 0;
    }
    function g(f) {
      return +f != f && (f = 0), s.alloc(+f);
    }
    s.isBuffer = function(n) {
      return n != null && n._isBuffer === !0 && n !== s.prototype;
    }, s.compare = function(n, i) {
      if (a0(n, Uint8Array) && (n = s.from(n, n.offset, n.byteLength)), a0(i, Uint8Array) && (i = s.from(i, i.offset, i.byteLength)), !s.isBuffer(n) || !s.isBuffer(i))
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      if (n === i) return 0;
      let v = n.length, w = i.length;
      for (let T = 0, $ = Math.min(v, w); T < $; ++T)
        if (n[T] !== i[T]) {
          v = n[T], w = i[T];
          break;
        }
      return v < w ? -1 : w < v ? 1 : 0;
    }, s.isEncoding = function(n) {
      switch (String(n).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return !0;
        default:
          return !1;
      }
    }, s.concat = function(n, i) {
      if (!Array.isArray(n))
        throw new TypeError('"list" argument must be an Array of Buffers');
      if (n.length === 0)
        return s.alloc(0);
      let v;
      if (i === void 0)
        for (i = 0, v = 0; v < n.length; ++v)
          i += n[v].length;
      const w = s.allocUnsafe(i);
      let T = 0;
      for (v = 0; v < n.length; ++v) {
        let $ = n[v];
        if (a0($, Uint8Array))
          T + $.length > w.length ? (s.isBuffer($) || ($ = s.from($)), $.copy(w, T)) : Uint8Array.prototype.set.call(
            w,
            $,
            T
          );
        else if (s.isBuffer($))
          $.copy(w, T);
        else
          throw new TypeError('"list" argument must be an Array of Buffers');
        T += $.length;
      }
      return w;
    };
    function B(f, n) {
      if (s.isBuffer(f))
        return f.length;
      if (ArrayBuffer.isView(f) || a0(f, ArrayBuffer))
        return f.byteLength;
      if (typeof f != "string")
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof f
        );
      const i = f.length, v = arguments.length > 2 && arguments[2] === !0;
      if (!v && i === 0) return 0;
      let w = !1;
      for (; ; )
        switch (n) {
          case "ascii":
          case "latin1":
          case "binary":
            return i;
          case "utf8":
          case "utf-8":
            return w0(f).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return i * 2;
          case "hex":
            return i >>> 1;
          case "base64":
            return D0(f).length;
          default:
            if (w)
              return v ? -1 : w0(f).length;
            n = ("" + n).toLowerCase(), w = !0;
        }
    }
    s.byteLength = B;
    function F(f, n, i) {
      let v = !1;
      if ((n === void 0 || n < 0) && (n = 0), n > this.length || ((i === void 0 || i > this.length) && (i = this.length), i <= 0) || (i >>>= 0, n >>>= 0, i <= n))
        return "";
      for (f || (f = "utf8"); ; )
        switch (f) {
          case "hex":
            return Q(this, n, i);
          case "utf8":
          case "utf-8":
            return N(this, n, i);
          case "ascii":
            return J(this, n, i);
          case "latin1":
          case "binary":
            return V(this, n, i);
          case "base64":
            return U(this, n, i);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return X(this, n, i);
          default:
            if (v) throw new TypeError("Unknown encoding: " + f);
            f = (f + "").toLowerCase(), v = !0;
        }
    }
    s.prototype._isBuffer = !0;
    function b(f, n, i) {
      const v = f[n];
      f[n] = f[i], f[i] = v;
    }
    s.prototype.swap16 = function() {
      const n = this.length;
      if (n % 2 !== 0)
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      for (let i = 0; i < n; i += 2)
        b(this, i, i + 1);
      return this;
    }, s.prototype.swap32 = function() {
      const n = this.length;
      if (n % 4 !== 0)
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      for (let i = 0; i < n; i += 4)
        b(this, i, i + 3), b(this, i + 1, i + 2);
      return this;
    }, s.prototype.swap64 = function() {
      const n = this.length;
      if (n % 8 !== 0)
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (let i = 0; i < n; i += 8)
        b(this, i, i + 7), b(this, i + 1, i + 6), b(this, i + 2, i + 5), b(this, i + 3, i + 4);
      return this;
    }, s.prototype.toString = function() {
      const n = this.length;
      return n === 0 ? "" : arguments.length === 0 ? N(this, 0, n) : F.apply(this, arguments);
    }, s.prototype.toLocaleString = s.prototype.toString, s.prototype.equals = function(n) {
      if (!s.isBuffer(n)) throw new TypeError("Argument must be a Buffer");
      return this === n ? !0 : s.compare(this, n) === 0;
    }, s.prototype.inspect = function() {
      let n = "";
      const i = c.INSPECT_MAX_BYTES;
      return n = this.toString("hex", 0, i).replace(/(.{2})/g, "$1 ").trim(), this.length > i && (n += " ... "), "<Buffer " + n + ">";
    }, r && (s.prototype[r] = s.prototype.inspect), s.prototype.compare = function(n, i, v, w, T) {
      if (a0(n, Uint8Array) && (n = s.from(n, n.offset, n.byteLength)), !s.isBuffer(n))
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof n
        );
      if (i === void 0 && (i = 0), v === void 0 && (v = n ? n.length : 0), w === void 0 && (w = 0), T === void 0 && (T = this.length), i < 0 || v > n.length || w < 0 || T > this.length)
        throw new RangeError("out of range index");
      if (w >= T && i >= v)
        return 0;
      if (w >= T)
        return -1;
      if (i >= v)
        return 1;
      if (i >>>= 0, v >>>= 0, w >>>= 0, T >>>= 0, this === n) return 0;
      let $ = T - w, W = v - i;
      const r0 = Math.min($, W), t0 = this.slice(w, T), i0 = n.slice(i, v);
      for (let Z = 0; Z < r0; ++Z)
        if (t0[Z] !== i0[Z]) {
          $ = t0[Z], W = i0[Z];
          break;
        }
      return $ < W ? -1 : W < $ ? 1 : 0;
    };
    function D(f, n, i, v, w) {
      if (f.length === 0) return -1;
      if (typeof i == "string" ? (v = i, i = 0) : i > 2147483647 ? i = 2147483647 : i < -2147483648 && (i = -2147483648), i = +i, g0(i) && (i = w ? 0 : f.length - 1), i < 0 && (i = f.length + i), i >= f.length) {
        if (w) return -1;
        i = f.length - 1;
      } else if (i < 0)
        if (w) i = 0;
        else return -1;
      if (typeof n == "string" && (n = s.from(n, v)), s.isBuffer(n))
        return n.length === 0 ? -1 : S(f, n, i, v, w);
      if (typeof n == "number")
        return n = n & 255, typeof Uint8Array.prototype.indexOf == "function" ? w ? Uint8Array.prototype.indexOf.call(f, n, i) : Uint8Array.prototype.lastIndexOf.call(f, n, i) : S(f, [n], i, v, w);
      throw new TypeError("val must be string, number or Buffer");
    }
    function S(f, n, i, v, w) {
      let T = 1, $ = f.length, W = n.length;
      if (v !== void 0 && (v = String(v).toLowerCase(), v === "ucs2" || v === "ucs-2" || v === "utf16le" || v === "utf-16le")) {
        if (f.length < 2 || n.length < 2)
          return -1;
        T = 2, $ /= 2, W /= 2, i /= 2;
      }
      function r0(i0, Z) {
        return T === 1 ? i0[Z] : i0.readUInt16BE(Z * T);
      }
      let t0;
      if (w) {
        let i0 = -1;
        for (t0 = i; t0 < $; t0++)
          if (r0(f, t0) === r0(n, i0 === -1 ? 0 : t0 - i0)) {
            if (i0 === -1 && (i0 = t0), t0 - i0 + 1 === W) return i0 * T;
          } else
            i0 !== -1 && (t0 -= t0 - i0), i0 = -1;
      } else
        for (i + W > $ && (i = $ - W), t0 = i; t0 >= 0; t0--) {
          let i0 = !0;
          for (let Z = 0; Z < W; Z++)
            if (r0(f, t0 + Z) !== r0(n, Z)) {
              i0 = !1;
              break;
            }
          if (i0) return t0;
        }
      return -1;
    }
    s.prototype.includes = function(n, i, v) {
      return this.indexOf(n, i, v) !== -1;
    }, s.prototype.indexOf = function(n, i, v) {
      return D(this, n, i, v, !0);
    }, s.prototype.lastIndexOf = function(n, i, v) {
      return D(this, n, i, v, !1);
    };
    function R(f, n, i, v) {
      i = Number(i) || 0;
      const w = f.length - i;
      v ? (v = Number(v), v > w && (v = w)) : v = w;
      const T = n.length;
      v > T / 2 && (v = T / 2);
      let $;
      for ($ = 0; $ < v; ++$) {
        const W = parseInt(n.substr($ * 2, 2), 16);
        if (g0(W)) return $;
        f[i + $] = W;
      }
      return $;
    }
    function P(f, n, i, v) {
      return l0(w0(n, f.length - i), f, i, v);
    }
    function _(f, n, i, v) {
      return l0(I0(n), f, i, v);
    }
    function k(f, n, i, v) {
      return l0(D0(n), f, i, v);
    }
    function q(f, n, i, v) {
      return l0(G0(n, f.length - i), f, i, v);
    }
    s.prototype.write = function(n, i, v, w) {
      if (i === void 0)
        w = "utf8", v = this.length, i = 0;
      else if (v === void 0 && typeof i == "string")
        w = i, v = this.length, i = 0;
      else if (isFinite(i))
        i = i >>> 0, isFinite(v) ? (v = v >>> 0, w === void 0 && (w = "utf8")) : (w = v, v = void 0);
      else
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      const T = this.length - i;
      if ((v === void 0 || v > T) && (v = T), n.length > 0 && (v < 0 || i < 0) || i > this.length)
        throw new RangeError("Attempt to write outside buffer bounds");
      w || (w = "utf8");
      let $ = !1;
      for (; ; )
        switch (w) {
          case "hex":
            return R(this, n, i, v);
          case "utf8":
          case "utf-8":
            return P(this, n, i, v);
          case "ascii":
          case "latin1":
          case "binary":
            return _(this, n, i, v);
          case "base64":
            return k(this, n, i, v);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return q(this, n, i, v);
          default:
            if ($) throw new TypeError("Unknown encoding: " + w);
            w = ("" + w).toLowerCase(), $ = !0;
        }
    }, s.prototype.toJSON = function() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function U(f, n, i) {
      return n === 0 && i === f.length ? t.fromByteArray(f) : t.fromByteArray(f.slice(n, i));
    }
    function N(f, n, i) {
      i = Math.min(f.length, i);
      const v = [];
      let w = n;
      for (; w < i; ) {
        const T = f[w];
        let $ = null, W = T > 239 ? 4 : T > 223 ? 3 : T > 191 ? 2 : 1;
        if (w + W <= i) {
          let r0, t0, i0, Z;
          switch (W) {
            case 1:
              T < 128 && ($ = T);
              break;
            case 2:
              r0 = f[w + 1], (r0 & 192) === 128 && (Z = (T & 31) << 6 | r0 & 63, Z > 127 && ($ = Z));
              break;
            case 3:
              r0 = f[w + 1], t0 = f[w + 2], (r0 & 192) === 128 && (t0 & 192) === 128 && (Z = (T & 15) << 12 | (r0 & 63) << 6 | t0 & 63, Z > 2047 && (Z < 55296 || Z > 57343) && ($ = Z));
              break;
            case 4:
              r0 = f[w + 1], t0 = f[w + 2], i0 = f[w + 3], (r0 & 192) === 128 && (t0 & 192) === 128 && (i0 & 192) === 128 && (Z = (T & 15) << 18 | (r0 & 63) << 12 | (t0 & 63) << 6 | i0 & 63, Z > 65535 && Z < 1114112 && ($ = Z));
          }
        }
        $ === null ? ($ = 65533, W = 1) : $ > 65535 && ($ -= 65536, v.push($ >>> 10 & 1023 | 55296), $ = 56320 | $ & 1023), v.push($), w += W;
      }
      return j(v);
    }
    const H = 4096;
    function j(f) {
      const n = f.length;
      if (n <= H)
        return String.fromCharCode.apply(String, f);
      let i = "", v = 0;
      for (; v < n; )
        i += String.fromCharCode.apply(
          String,
          f.slice(v, v += H)
        );
      return i;
    }
    function J(f, n, i) {
      let v = "";
      i = Math.min(f.length, i);
      for (let w = n; w < i; ++w)
        v += String.fromCharCode(f[w] & 127);
      return v;
    }
    function V(f, n, i) {
      let v = "";
      i = Math.min(f.length, i);
      for (let w = n; w < i; ++w)
        v += String.fromCharCode(f[w]);
      return v;
    }
    function Q(f, n, i) {
      const v = f.length;
      (!n || n < 0) && (n = 0), (!i || i < 0 || i > v) && (i = v);
      let w = "";
      for (let T = n; T < i; ++T)
        w += N0[f[T]];
      return w;
    }
    function X(f, n, i) {
      const v = f.slice(n, i);
      let w = "";
      for (let T = 0; T < v.length - 1; T += 2)
        w += String.fromCharCode(v[T] + v[T + 1] * 256);
      return w;
    }
    s.prototype.slice = function(n, i) {
      const v = this.length;
      n = ~~n, i = i === void 0 ? v : ~~i, n < 0 ? (n += v, n < 0 && (n = 0)) : n > v && (n = v), i < 0 ? (i += v, i < 0 && (i = 0)) : i > v && (i = v), i < n && (i = n);
      const w = this.subarray(n, i);
      return Object.setPrototypeOf(w, s.prototype), w;
    };
    function I(f, n, i) {
      if (f % 1 !== 0 || f < 0) throw new RangeError("offset is not uint");
      if (f + n > i) throw new RangeError("Trying to access beyond buffer length");
    }
    s.prototype.readUintLE = s.prototype.readUIntLE = function(n, i, v) {
      n = n >>> 0, i = i >>> 0, v || I(n, i, this.length);
      let w = this[n], T = 1, $ = 0;
      for (; ++$ < i && (T *= 256); )
        w += this[n + $] * T;
      return w;
    }, s.prototype.readUintBE = s.prototype.readUIntBE = function(n, i, v) {
      n = n >>> 0, i = i >>> 0, v || I(n, i, this.length);
      let w = this[n + --i], T = 1;
      for (; i > 0 && (T *= 256); )
        w += this[n + --i] * T;
      return w;
    }, s.prototype.readUint8 = s.prototype.readUInt8 = function(n, i) {
      return n = n >>> 0, i || I(n, 1, this.length), this[n];
    }, s.prototype.readUint16LE = s.prototype.readUInt16LE = function(n, i) {
      return n = n >>> 0, i || I(n, 2, this.length), this[n] | this[n + 1] << 8;
    }, s.prototype.readUint16BE = s.prototype.readUInt16BE = function(n, i) {
      return n = n >>> 0, i || I(n, 2, this.length), this[n] << 8 | this[n + 1];
    }, s.prototype.readUint32LE = s.prototype.readUInt32LE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), (this[n] | this[n + 1] << 8 | this[n + 2] << 16) + this[n + 3] * 16777216;
    }, s.prototype.readUint32BE = s.prototype.readUInt32BE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), this[n] * 16777216 + (this[n + 1] << 16 | this[n + 2] << 8 | this[n + 3]);
    }, s.prototype.readBigUInt64LE = m0(function(n) {
      n = n >>> 0, u0(n, "offset");
      const i = this[n], v = this[n + 7];
      (i === void 0 || v === void 0) && o0(n, this.length - 8);
      const w = i + this[++n] * 2 ** 8 + this[++n] * 2 ** 16 + this[++n] * 2 ** 24, T = this[++n] + this[++n] * 2 ** 8 + this[++n] * 2 ** 16 + v * 2 ** 24;
      return BigInt(w) + (BigInt(T) << BigInt(32));
    }), s.prototype.readBigUInt64BE = m0(function(n) {
      n = n >>> 0, u0(n, "offset");
      const i = this[n], v = this[n + 7];
      (i === void 0 || v === void 0) && o0(n, this.length - 8);
      const w = i * 2 ** 24 + this[++n] * 2 ** 16 + this[++n] * 2 ** 8 + this[++n], T = this[++n] * 2 ** 24 + this[++n] * 2 ** 16 + this[++n] * 2 ** 8 + v;
      return (BigInt(w) << BigInt(32)) + BigInt(T);
    }), s.prototype.readIntLE = function(n, i, v) {
      n = n >>> 0, i = i >>> 0, v || I(n, i, this.length);
      let w = this[n], T = 1, $ = 0;
      for (; ++$ < i && (T *= 256); )
        w += this[n + $] * T;
      return T *= 128, w >= T && (w -= Math.pow(2, 8 * i)), w;
    }, s.prototype.readIntBE = function(n, i, v) {
      n = n >>> 0, i = i >>> 0, v || I(n, i, this.length);
      let w = i, T = 1, $ = this[n + --w];
      for (; w > 0 && (T *= 256); )
        $ += this[n + --w] * T;
      return T *= 128, $ >= T && ($ -= Math.pow(2, 8 * i)), $;
    }, s.prototype.readInt8 = function(n, i) {
      return n = n >>> 0, i || I(n, 1, this.length), this[n] & 128 ? (255 - this[n] + 1) * -1 : this[n];
    }, s.prototype.readInt16LE = function(n, i) {
      n = n >>> 0, i || I(n, 2, this.length);
      const v = this[n] | this[n + 1] << 8;
      return v & 32768 ? v | 4294901760 : v;
    }, s.prototype.readInt16BE = function(n, i) {
      n = n >>> 0, i || I(n, 2, this.length);
      const v = this[n + 1] | this[n] << 8;
      return v & 32768 ? v | 4294901760 : v;
    }, s.prototype.readInt32LE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), this[n] | this[n + 1] << 8 | this[n + 2] << 16 | this[n + 3] << 24;
    }, s.prototype.readInt32BE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), this[n] << 24 | this[n + 1] << 16 | this[n + 2] << 8 | this[n + 3];
    }, s.prototype.readBigInt64LE = m0(function(n) {
      n = n >>> 0, u0(n, "offset");
      const i = this[n], v = this[n + 7];
      (i === void 0 || v === void 0) && o0(n, this.length - 8);
      const w = this[n + 4] + this[n + 5] * 2 ** 8 + this[n + 6] * 2 ** 16 + (v << 24);
      return (BigInt(w) << BigInt(32)) + BigInt(i + this[++n] * 2 ** 8 + this[++n] * 2 ** 16 + this[++n] * 2 ** 24);
    }), s.prototype.readBigInt64BE = m0(function(n) {
      n = n >>> 0, u0(n, "offset");
      const i = this[n], v = this[n + 7];
      (i === void 0 || v === void 0) && o0(n, this.length - 8);
      const w = (i << 24) + // Overflow
      this[++n] * 2 ** 16 + this[++n] * 2 ** 8 + this[++n];
      return (BigInt(w) << BigInt(32)) + BigInt(this[++n] * 2 ** 24 + this[++n] * 2 ** 16 + this[++n] * 2 ** 8 + v);
    }), s.prototype.readFloatLE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), e.read(this, n, !0, 23, 4);
    }, s.prototype.readFloatBE = function(n, i) {
      return n = n >>> 0, i || I(n, 4, this.length), e.read(this, n, !1, 23, 4);
    }, s.prototype.readDoubleLE = function(n, i) {
      return n = n >>> 0, i || I(n, 8, this.length), e.read(this, n, !0, 52, 8);
    }, s.prototype.readDoubleBE = function(n, i) {
      return n = n >>> 0, i || I(n, 8, this.length), e.read(this, n, !1, 52, 8);
    };
    function O(f, n, i, v, w, T) {
      if (!s.isBuffer(f)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (n > w || n < T) throw new RangeError('"value" argument is out of bounds');
      if (i + v > f.length) throw new RangeError("Index out of range");
    }
    s.prototype.writeUintLE = s.prototype.writeUIntLE = function(n, i, v, w) {
      if (n = +n, i = i >>> 0, v = v >>> 0, !w) {
        const W = Math.pow(2, 8 * v) - 1;
        O(this, n, i, v, W, 0);
      }
      let T = 1, $ = 0;
      for (this[i] = n & 255; ++$ < v && (T *= 256); )
        this[i + $] = n / T & 255;
      return i + v;
    }, s.prototype.writeUintBE = s.prototype.writeUIntBE = function(n, i, v, w) {
      if (n = +n, i = i >>> 0, v = v >>> 0, !w) {
        const W = Math.pow(2, 8 * v) - 1;
        O(this, n, i, v, W, 0);
      }
      let T = v - 1, $ = 1;
      for (this[i + T] = n & 255; --T >= 0 && ($ *= 256); )
        this[i + T] = n / $ & 255;
      return i + v;
    }, s.prototype.writeUint8 = s.prototype.writeUInt8 = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 1, 255, 0), this[i] = n & 255, i + 1;
    }, s.prototype.writeUint16LE = s.prototype.writeUInt16LE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 2, 65535, 0), this[i] = n & 255, this[i + 1] = n >>> 8, i + 2;
    }, s.prototype.writeUint16BE = s.prototype.writeUInt16BE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 2, 65535, 0), this[i] = n >>> 8, this[i + 1] = n & 255, i + 2;
    }, s.prototype.writeUint32LE = s.prototype.writeUInt32LE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 4, 4294967295, 0), this[i + 3] = n >>> 24, this[i + 2] = n >>> 16, this[i + 1] = n >>> 8, this[i] = n & 255, i + 4;
    }, s.prototype.writeUint32BE = s.prototype.writeUInt32BE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 4, 4294967295, 0), this[i] = n >>> 24, this[i + 1] = n >>> 16, this[i + 2] = n >>> 8, this[i + 3] = n & 255, i + 4;
    };
    function z(f, n, i, v, w) {
      b0(n, v, w, f, i, 7);
      let T = Number(n & BigInt(4294967295));
      f[i++] = T, T = T >> 8, f[i++] = T, T = T >> 8, f[i++] = T, T = T >> 8, f[i++] = T;
      let $ = Number(n >> BigInt(32) & BigInt(4294967295));
      return f[i++] = $, $ = $ >> 8, f[i++] = $, $ = $ >> 8, f[i++] = $, $ = $ >> 8, f[i++] = $, i;
    }
    function L(f, n, i, v, w) {
      b0(n, v, w, f, i, 7);
      let T = Number(n & BigInt(4294967295));
      f[i + 7] = T, T = T >> 8, f[i + 6] = T, T = T >> 8, f[i + 5] = T, T = T >> 8, f[i + 4] = T;
      let $ = Number(n >> BigInt(32) & BigInt(4294967295));
      return f[i + 3] = $, $ = $ >> 8, f[i + 2] = $, $ = $ >> 8, f[i + 1] = $, $ = $ >> 8, f[i] = $, i + 8;
    }
    s.prototype.writeBigUInt64LE = m0(function(n, i = 0) {
      return z(this, n, i, BigInt(0), BigInt("0xffffffffffffffff"));
    }), s.prototype.writeBigUInt64BE = m0(function(n, i = 0) {
      return L(this, n, i, BigInt(0), BigInt("0xffffffffffffffff"));
    }), s.prototype.writeIntLE = function(n, i, v, w) {
      if (n = +n, i = i >>> 0, !w) {
        const r0 = Math.pow(2, 8 * v - 1);
        O(this, n, i, v, r0 - 1, -r0);
      }
      let T = 0, $ = 1, W = 0;
      for (this[i] = n & 255; ++T < v && ($ *= 256); )
        n < 0 && W === 0 && this[i + T - 1] !== 0 && (W = 1), this[i + T] = (n / $ >> 0) - W & 255;
      return i + v;
    }, s.prototype.writeIntBE = function(n, i, v, w) {
      if (n = +n, i = i >>> 0, !w) {
        const r0 = Math.pow(2, 8 * v - 1);
        O(this, n, i, v, r0 - 1, -r0);
      }
      let T = v - 1, $ = 1, W = 0;
      for (this[i + T] = n & 255; --T >= 0 && ($ *= 256); )
        n < 0 && W === 0 && this[i + T + 1] !== 0 && (W = 1), this[i + T] = (n / $ >> 0) - W & 255;
      return i + v;
    }, s.prototype.writeInt8 = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 1, 127, -128), n < 0 && (n = 255 + n + 1), this[i] = n & 255, i + 1;
    }, s.prototype.writeInt16LE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 2, 32767, -32768), this[i] = n & 255, this[i + 1] = n >>> 8, i + 2;
    }, s.prototype.writeInt16BE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 2, 32767, -32768), this[i] = n >>> 8, this[i + 1] = n & 255, i + 2;
    }, s.prototype.writeInt32LE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 4, 2147483647, -2147483648), this[i] = n & 255, this[i + 1] = n >>> 8, this[i + 2] = n >>> 16, this[i + 3] = n >>> 24, i + 4;
    }, s.prototype.writeInt32BE = function(n, i, v) {
      return n = +n, i = i >>> 0, v || O(this, n, i, 4, 2147483647, -2147483648), n < 0 && (n = 4294967295 + n + 1), this[i] = n >>> 24, this[i + 1] = n >>> 16, this[i + 2] = n >>> 8, this[i + 3] = n & 255, i + 4;
    }, s.prototype.writeBigInt64LE = m0(function(n, i = 0) {
      return z(this, n, i, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    }), s.prototype.writeBigInt64BE = m0(function(n, i = 0) {
      return L(this, n, i, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function e0(f, n, i, v, w, T) {
      if (i + v > f.length) throw new RangeError("Index out of range");
      if (i < 0) throw new RangeError("Index out of range");
    }
    function Y(f, n, i, v, w) {
      return n = +n, i = i >>> 0, w || e0(f, n, i, 4), e.write(f, n, i, v, 23, 4), i + 4;
    }
    s.prototype.writeFloatLE = function(n, i, v) {
      return Y(this, n, i, !0, v);
    }, s.prototype.writeFloatBE = function(n, i, v) {
      return Y(this, n, i, !1, v);
    };
    function f0(f, n, i, v, w) {
      return n = +n, i = i >>> 0, w || e0(f, n, i, 8), e.write(f, n, i, v, 52, 8), i + 8;
    }
    s.prototype.writeDoubleLE = function(n, i, v) {
      return f0(this, n, i, !0, v);
    }, s.prototype.writeDoubleBE = function(n, i, v) {
      return f0(this, n, i, !1, v);
    }, s.prototype.copy = function(n, i, v, w) {
      if (!s.isBuffer(n)) throw new TypeError("argument should be a Buffer");
      if (v || (v = 0), !w && w !== 0 && (w = this.length), i >= n.length && (i = n.length), i || (i = 0), w > 0 && w < v && (w = v), w === v || n.length === 0 || this.length === 0) return 0;
      if (i < 0)
        throw new RangeError("targetStart out of bounds");
      if (v < 0 || v >= this.length) throw new RangeError("Index out of range");
      if (w < 0) throw new RangeError("sourceEnd out of bounds");
      w > this.length && (w = this.length), n.length - i < w - v && (w = n.length - i + v);
      const T = w - v;
      return this === n && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(i, v, w) : Uint8Array.prototype.set.call(
        n,
        this.subarray(v, w),
        i
      ), T;
    }, s.prototype.fill = function(n, i, v, w) {
      if (typeof n == "string") {
        if (typeof i == "string" ? (w = i, i = 0, v = this.length) : typeof v == "string" && (w = v, v = this.length), w !== void 0 && typeof w != "string")
          throw new TypeError("encoding must be a string");
        if (typeof w == "string" && !s.isEncoding(w))
          throw new TypeError("Unknown encoding: " + w);
        if (n.length === 1) {
          const $ = n.charCodeAt(0);
          (w === "utf8" && $ < 128 || w === "latin1") && (n = $);
        }
      } else typeof n == "number" ? n = n & 255 : typeof n == "boolean" && (n = Number(n));
      if (i < 0 || this.length < i || this.length < v)
        throw new RangeError("Out of range index");
      if (v <= i)
        return this;
      i = i >>> 0, v = v === void 0 ? this.length : v >>> 0, n || (n = 0);
      let T;
      if (typeof n == "number")
        for (T = i; T < v; ++T)
          this[T] = n;
      else {
        const $ = s.isBuffer(n) ? n : s.from(n, w), W = $.length;
        if (W === 0)
          throw new TypeError('The value "' + n + '" is invalid for argument "value"');
        for (T = 0; T < v - i; ++T)
          this[T + i] = $[T % W];
      }
      return this;
    };
    const M = {};
    function y0(f, n, i) {
      M[f] = class extends i {
        constructor() {
          super(), Object.defineProperty(this, "message", {
            value: n.apply(this, arguments),
            writable: !0,
            configurable: !0
          }), this.name = `${this.name} [${f}]`, this.stack, delete this.name;
        }
        get code() {
          return f;
        }
        set code(w) {
          Object.defineProperty(this, "code", {
            configurable: !0,
            enumerable: !0,
            value: w,
            writable: !0
          });
        }
        toString() {
          return `${this.name} [${f}]: ${this.message}`;
        }
      };
    }
    y0(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(f) {
        return f ? `${f} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
      },
      RangeError
    ), y0(
      "ERR_INVALID_ARG_TYPE",
      function(f, n) {
        return `The "${f}" argument must be of type number. Received type ${typeof n}`;
      },
      TypeError
    ), y0(
      "ERR_OUT_OF_RANGE",
      function(f, n, i) {
        let v = `The value of "${f}" is out of range.`, w = i;
        return Number.isInteger(i) && Math.abs(i) > 2 ** 32 ? w = A0(String(i)) : typeof i == "bigint" && (w = String(i), (i > BigInt(2) ** BigInt(32) || i < -(BigInt(2) ** BigInt(32))) && (w = A0(w)), w += "n"), v += ` It must be ${n}. Received ${w}`, v;
      },
      RangeError
    );
    function A0(f) {
      let n = "", i = f.length;
      const v = f[0] === "-" ? 1 : 0;
      for (; i >= v + 4; i -= 3)
        n = `_${f.slice(i - 3, i)}${n}`;
      return `${f.slice(0, i)}${n}`;
    }
    function W0(f, n, i) {
      u0(n, "offset"), (f[n] === void 0 || f[n + i] === void 0) && o0(n, f.length - (i + 1));
    }
    function b0(f, n, i, v, w, T) {
      if (f > i || f < n) {
        const $ = typeof n == "bigint" ? "n" : "";
        let W;
        throw n === 0 || n === BigInt(0) ? W = `>= 0${$} and < 2${$} ** ${(T + 1) * 8}${$}` : W = `>= -(2${$} ** ${(T + 1) * 8 - 1}${$}) and < 2 ** ${(T + 1) * 8 - 1}${$}`, new M.ERR_OUT_OF_RANGE("value", W, f);
      }
      W0(v, w, T);
    }
    function u0(f, n) {
      if (typeof f != "number")
        throw new M.ERR_INVALID_ARG_TYPE(n, "number", f);
    }
    function o0(f, n, i) {
      throw Math.floor(f) !== f ? (u0(f, i), new M.ERR_OUT_OF_RANGE("offset", "an integer", f)) : n < 0 ? new M.ERR_BUFFER_OUT_OF_BOUNDS() : new M.ERR_OUT_OF_RANGE(
        "offset",
        `>= 0 and <= ${n}`,
        f
      );
    }
    const z0 = /[^+/0-9A-Za-z-_]/g;
    function R0(f) {
      if (f = f.split("=")[0], f = f.trim().replace(z0, ""), f.length < 2) return "";
      for (; f.length % 4 !== 0; )
        f = f + "=";
      return f;
    }
    function w0(f, n) {
      n = n || 1 / 0;
      let i;
      const v = f.length;
      let w = null;
      const T = [];
      for (let $ = 0; $ < v; ++$) {
        if (i = f.charCodeAt($), i > 55295 && i < 57344) {
          if (!w) {
            if (i > 56319) {
              (n -= 3) > -1 && T.push(239, 191, 189);
              continue;
            } else if ($ + 1 === v) {
              (n -= 3) > -1 && T.push(239, 191, 189);
              continue;
            }
            w = i;
            continue;
          }
          if (i < 56320) {
            (n -= 3) > -1 && T.push(239, 191, 189), w = i;
            continue;
          }
          i = (w - 55296 << 10 | i - 56320) + 65536;
        } else w && (n -= 3) > -1 && T.push(239, 191, 189);
        if (w = null, i < 128) {
          if ((n -= 1) < 0) break;
          T.push(i);
        } else if (i < 2048) {
          if ((n -= 2) < 0) break;
          T.push(
            i >> 6 | 192,
            i & 63 | 128
          );
        } else if (i < 65536) {
          if ((n -= 3) < 0) break;
          T.push(
            i >> 12 | 224,
            i >> 6 & 63 | 128,
            i & 63 | 128
          );
        } else if (i < 1114112) {
          if ((n -= 4) < 0) break;
          T.push(
            i >> 18 | 240,
            i >> 12 & 63 | 128,
            i >> 6 & 63 | 128,
            i & 63 | 128
          );
        } else
          throw new Error("Invalid code point");
      }
      return T;
    }
    function I0(f) {
      const n = [];
      for (let i = 0; i < f.length; ++i)
        n.push(f.charCodeAt(i) & 255);
      return n;
    }
    function G0(f, n) {
      let i, v, w;
      const T = [];
      for (let $ = 0; $ < f.length && !((n -= 2) < 0); ++$)
        i = f.charCodeAt($), v = i >> 8, w = i % 256, T.push(w), T.push(v);
      return T;
    }
    function D0(f) {
      return t.toByteArray(R0(f));
    }
    function l0(f, n, i, v) {
      let w;
      for (w = 0; w < v && !(w + i >= n.length || w >= f.length); ++w)
        n[w + i] = f[w];
      return w;
    }
    function a0(f, n) {
      return f instanceof n || f != null && f.constructor != null && f.constructor.name != null && f.constructor.name === n.name;
    }
    function g0(f) {
      return f !== f;
    }
    const N0 = (function() {
      const f = "0123456789abcdef", n = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const v = i * 16;
        for (let w = 0; w < 16; ++w)
          n[v + w] = f[i] + f[w];
      }
      return n;
    })();
    function m0(f) {
      return typeof BigInt > "u" ? _0 : f;
    }
    function _0() {
      throw new Error("BigInt not supported");
    }
  })(Ke)), Ke;
}
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var At;
function un() {
  return At || (At = 1, (function(c, t) {
    var e = on(), r = e.Buffer;
    function a(x, s) {
      for (var h in x)
        s[h] = x[h];
    }
    r.from && r.alloc && r.allocUnsafe && r.allocUnsafeSlow ? c.exports = e : (a(e, t), t.Buffer = o);
    function o(x, s, h) {
      return r(x, s, h);
    }
    o.prototype = Object.create(r.prototype), a(r, o), o.from = function(x, s, h) {
      if (typeof x == "number")
        throw new TypeError("Argument must not be a number");
      return r(x, s, h);
    }, o.alloc = function(x, s, h) {
      if (typeof x != "number")
        throw new TypeError("Argument must be a number");
      var u = r(x);
      return s !== void 0 ? typeof h == "string" ? u.fill(s, h) : u.fill(s) : u.fill(0), u;
    }, o.allocUnsafe = function(x) {
      if (typeof x != "number")
        throw new TypeError("Argument must be a number");
      return r(x);
    }, o.allocUnsafeSlow = function(x) {
      if (typeof x != "number")
        throw new TypeError("Argument must be a number");
      return e.SlowBuffer(x);
    };
  })(Y0, Y0.exports)), Y0.exports;
}
var Ve, Ct;
function xn() {
  if (Ct) return Ve;
  Ct = 1;
  var c = un().Buffer;
  function t(e) {
    if (e.length >= 255)
      throw new TypeError("Alphabet too long");
    for (var r = new Uint8Array(256), a = 0; a < r.length; a++)
      r[a] = 255;
    for (var o = 0; o < e.length; o++) {
      var x = e.charAt(o), s = x.charCodeAt(0);
      if (r[s] !== 255)
        throw new TypeError(x + " is ambiguous");
      r[s] = o;
    }
    var h = e.length, u = e.charAt(0), l = Math.log(h) / Math.log(256), y = Math.log(256) / Math.log(h);
    function d(E) {
      if ((Array.isArray(E) || E instanceof Uint8Array) && (E = c.from(E)), !c.isBuffer(E))
        throw new TypeError("Expected Buffer");
      if (E.length === 0)
        return "";
      for (var A = 0, C = 0, g = 0, B = E.length; g !== B && E[g] === 0; )
        g++, A++;
      for (var F = (B - g) * y + 1 >>> 0, b = new Uint8Array(F); g !== B; ) {
        for (var D = E[g], S = 0, R = F - 1; (D !== 0 || S < C) && R !== -1; R--, S++)
          D += 256 * b[R] >>> 0, b[R] = D % h >>> 0, D = D / h >>> 0;
        if (D !== 0)
          throw new Error("Non-zero carry");
        C = S, g++;
      }
      for (var P = F - C; P !== F && b[P] === 0; )
        P++;
      for (var _ = u.repeat(A); P < F; ++P)
        _ += e.charAt(b[P]);
      return _;
    }
    function p(E) {
      if (typeof E != "string")
        throw new TypeError("Expected String");
      if (E.length === 0)
        return c.alloc(0);
      for (var A = 0, C = 0, g = 0; E[A] === u; )
        C++, A++;
      for (var B = (E.length - A) * l + 1 >>> 0, F = new Uint8Array(B); A < E.length; ) {
        var b = E.charCodeAt(A);
        if (b > 255)
          return;
        var D = r[b];
        if (D === 255)
          return;
        for (var S = 0, R = B - 1; (D !== 0 || S < g) && R !== -1; R--, S++)
          D += h * F[R] >>> 0, F[R] = D % 256 >>> 0, D = D / 256 >>> 0;
        if (D !== 0)
          throw new Error("Non-zero carry");
        g = S, A++;
      }
      for (var P = B - g; P !== B && F[P] === 0; )
        P++;
      var _ = c.allocUnsafe(C + (B - P));
      _.fill(0, 0, C);
      for (var k = C; P !== B; )
        _[k++] = F[P++];
      return _;
    }
    function m(E) {
      var A = p(E);
      if (A)
        return A;
      throw new Error("Non-base" + h + " character");
    }
    return {
      encode: d,
      decodeUnsafe: p,
      decode: m
    };
  }
  return Ve = t, Ve;
}
var Xe, Ft;
function cn() {
  if (Ft) return Xe;
  Ft = 1;
  var c = xn(), t = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Xe = c(t), Xe;
}
var fn = cn();
const J0 = /* @__PURE__ */ at(fn);
var re = { exports: {} };
function ln(c) {
  throw new Error('Could not dynamically require "' + c + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var ne = { exports: {} };
const hn = {}, dn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: hn
}, Symbol.toStringTag, { value: "Module" })), pn = /* @__PURE__ */ nn(dn);
var gn = ne.exports, bt;
function G() {
  return bt || (bt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r();
    })(gn, function() {
      var e = e || (function(r, a) {
        var o;
        if (typeof window < "u" && window.crypto && (o = window.crypto), typeof self < "u" && self.crypto && (o = self.crypto), typeof globalThis < "u" && globalThis.crypto && (o = globalThis.crypto), !o && typeof window < "u" && window.msCrypto && (o = window.msCrypto), !o && typeof Ge < "u" && Ge.crypto && (o = Ge.crypto), !o && typeof ln == "function")
          try {
            o = pn;
          } catch {
          }
        var x = function() {
          if (o) {
            if (typeof o.getRandomValues == "function")
              try {
                return o.getRandomValues(new Uint32Array(1))[0];
              } catch {
              }
            if (typeof o.randomBytes == "function")
              try {
                return o.randomBytes(4).readInt32LE();
              } catch {
              }
          }
          throw new Error("Native crypto module could not be used to get secure random number.");
        }, s = Object.create || /* @__PURE__ */ (function() {
          function g() {
          }
          return function(B) {
            var F;
            return g.prototype = B, F = new g(), g.prototype = null, F;
          };
        })(), h = {}, u = h.lib = {}, l = u.Base = /* @__PURE__ */ (function() {
          return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function(g) {
              var B = s(this);
              return g && B.mixIn(g), (!B.hasOwnProperty("init") || this.init === B.init) && (B.init = function() {
                B.$super.init.apply(this, arguments);
              }), B.init.prototype = B, B.$super = this, B;
            },
            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function() {
              var g = this.extend();
              return g.init.apply(g, arguments), g;
            },
            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function() {
            },
            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function(g) {
              for (var B in g)
                g.hasOwnProperty(B) && (this[B] = g[B]);
              g.hasOwnProperty("toString") && (this.toString = g.toString);
            },
            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function() {
              return this.init.prototype.extend(this);
            }
          };
        })(), y = u.WordArray = l.extend({
          /**
           * Initializes a newly created word array.
           *
           * @param {Array} words (Optional) An array of 32-bit words.
           * @param {number} sigBytes (Optional) The number of significant bytes in the words.
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.create();
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
           */
          init: function(g, B) {
            g = this.words = g || [], B != a ? this.sigBytes = B : this.sigBytes = g.length * 4;
          },
          /**
           * Converts this word array to a string.
           *
           * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
           *
           * @return {string} The stringified word array.
           *
           * @example
           *
           *     var string = wordArray + '';
           *     var string = wordArray.toString();
           *     var string = wordArray.toString(CryptoJS.enc.Utf8);
           */
          toString: function(g) {
            return (g || p).stringify(this);
          },
          /**
           * Concatenates a word array to this word array.
           *
           * @param {WordArray} wordArray The word array to append.
           *
           * @return {WordArray} This word array.
           *
           * @example
           *
           *     wordArray1.concat(wordArray2);
           */
          concat: function(g) {
            var B = this.words, F = g.words, b = this.sigBytes, D = g.sigBytes;
            if (this.clamp(), b % 4)
              for (var S = 0; S < D; S++) {
                var R = F[S >>> 2] >>> 24 - S % 4 * 8 & 255;
                B[b + S >>> 2] |= R << 24 - (b + S) % 4 * 8;
              }
            else
              for (var P = 0; P < D; P += 4)
                B[b + P >>> 2] = F[P >>> 2];
            return this.sigBytes += D, this;
          },
          /**
           * Removes insignificant bits.
           *
           * @example
           *
           *     wordArray.clamp();
           */
          clamp: function() {
            var g = this.words, B = this.sigBytes;
            g[B >>> 2] &= 4294967295 << 32 - B % 4 * 8, g.length = r.ceil(B / 4);
          },
          /**
           * Creates a copy of this word array.
           *
           * @return {WordArray} The clone.
           *
           * @example
           *
           *     var clone = wordArray.clone();
           */
          clone: function() {
            var g = l.clone.call(this);
            return g.words = this.words.slice(0), g;
          },
          /**
           * Creates a word array filled with random bytes.
           *
           * @param {number} nBytes The number of random bytes to generate.
           *
           * @return {WordArray} The random word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.random(16);
           */
          random: function(g) {
            for (var B = [], F = 0; F < g; F += 4)
              B.push(x());
            return new y.init(B, g);
          }
        }), d = h.enc = {}, p = d.Hex = {
          /**
           * Converts a word array to a hex string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The hex string.
           *
           * @static
           *
           * @example
           *
           *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
           */
          stringify: function(g) {
            for (var B = g.words, F = g.sigBytes, b = [], D = 0; D < F; D++) {
              var S = B[D >>> 2] >>> 24 - D % 4 * 8 & 255;
              b.push((S >>> 4).toString(16)), b.push((S & 15).toString(16));
            }
            return b.join("");
          },
          /**
           * Converts a hex string to a word array.
           *
           * @param {string} hexStr The hex string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
           */
          parse: function(g) {
            for (var B = g.length, F = [], b = 0; b < B; b += 2)
              F[b >>> 3] |= parseInt(g.substr(b, 2), 16) << 24 - b % 8 * 4;
            return new y.init(F, B / 2);
          }
        }, m = d.Latin1 = {
          /**
           * Converts a word array to a Latin1 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The Latin1 string.
           *
           * @static
           *
           * @example
           *
           *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
           */
          stringify: function(g) {
            for (var B = g.words, F = g.sigBytes, b = [], D = 0; D < F; D++) {
              var S = B[D >>> 2] >>> 24 - D % 4 * 8 & 255;
              b.push(String.fromCharCode(S));
            }
            return b.join("");
          },
          /**
           * Converts a Latin1 string to a word array.
           *
           * @param {string} latin1Str The Latin1 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
           */
          parse: function(g) {
            for (var B = g.length, F = [], b = 0; b < B; b++)
              F[b >>> 2] |= (g.charCodeAt(b) & 255) << 24 - b % 4 * 8;
            return new y.init(F, B);
          }
        }, E = d.Utf8 = {
          /**
           * Converts a word array to a UTF-8 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The UTF-8 string.
           *
           * @static
           *
           * @example
           *
           *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
           */
          stringify: function(g) {
            try {
              return decodeURIComponent(escape(m.stringify(g)));
            } catch {
              throw new Error("Malformed UTF-8 data");
            }
          },
          /**
           * Converts a UTF-8 string to a word array.
           *
           * @param {string} utf8Str The UTF-8 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
           */
          parse: function(g) {
            return m.parse(unescape(encodeURIComponent(g)));
          }
        }, A = u.BufferedBlockAlgorithm = l.extend({
          /**
           * Resets this block algorithm's data buffer to its initial state.
           *
           * @example
           *
           *     bufferedBlockAlgorithm.reset();
           */
          reset: function() {
            this._data = new y.init(), this._nDataBytes = 0;
          },
          /**
           * Adds new data to this block algorithm's buffer.
           *
           * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
           *
           * @example
           *
           *     bufferedBlockAlgorithm._append('data');
           *     bufferedBlockAlgorithm._append(wordArray);
           */
          _append: function(g) {
            typeof g == "string" && (g = E.parse(g)), this._data.concat(g), this._nDataBytes += g.sigBytes;
          },
          /**
           * Processes available data blocks.
           *
           * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
           *
           * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
           *
           * @return {WordArray} The processed data.
           *
           * @example
           *
           *     var processedData = bufferedBlockAlgorithm._process();
           *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
           */
          _process: function(g) {
            var B, F = this._data, b = F.words, D = F.sigBytes, S = this.blockSize, R = S * 4, P = D / R;
            g ? P = r.ceil(P) : P = r.max((P | 0) - this._minBufferSize, 0);
            var _ = P * S, k = r.min(_ * 4, D);
            if (_) {
              for (var q = 0; q < _; q += S)
                this._doProcessBlock(b, q);
              B = b.splice(0, _), F.sigBytes -= k;
            }
            return new y.init(B, k);
          },
          /**
           * Creates a copy of this object.
           *
           * @return {Object} The clone.
           *
           * @example
           *
           *     var clone = bufferedBlockAlgorithm.clone();
           */
          clone: function() {
            var g = l.clone.call(this);
            return g._data = this._data.clone(), g;
          },
          _minBufferSize: 0
        });
        u.Hasher = A.extend({
          /**
           * Configuration options.
           */
          cfg: l.extend(),
          /**
           * Initializes a newly created hasher.
           *
           * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
           *
           * @example
           *
           *     var hasher = CryptoJS.algo.SHA256.create();
           */
          init: function(g) {
            this.cfg = this.cfg.extend(g), this.reset();
          },
          /**
           * Resets this hasher to its initial state.
           *
           * @example
           *
           *     hasher.reset();
           */
          reset: function() {
            A.reset.call(this), this._doReset();
          },
          /**
           * Updates this hasher with a message.
           *
           * @param {WordArray|string} messageUpdate The message to append.
           *
           * @return {Hasher} This hasher.
           *
           * @example
           *
           *     hasher.update('message');
           *     hasher.update(wordArray);
           */
          update: function(g) {
            return this._append(g), this._process(), this;
          },
          /**
           * Finalizes the hash computation.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} messageUpdate (Optional) A final message update.
           *
           * @return {WordArray} The hash.
           *
           * @example
           *
           *     var hash = hasher.finalize();
           *     var hash = hasher.finalize('message');
           *     var hash = hasher.finalize(wordArray);
           */
          finalize: function(g) {
            g && this._append(g);
            var B = this._doFinalize();
            return B;
          },
          blockSize: 16,
          /**
           * Creates a shortcut function to a hasher's object interface.
           *
           * @param {Hasher} hasher The hasher to create a helper for.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
           */
          _createHelper: function(g) {
            return function(B, F) {
              return new g.init(F).finalize(B);
            };
          },
          /**
           * Creates a shortcut function to the HMAC's object interface.
           *
           * @param {Hasher} hasher The hasher to use in this HMAC helper.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
           */
          _createHmacHelper: function(g) {
            return function(B, F) {
              return new C.HMAC.init(g, F).finalize(B);
            };
          }
        });
        var C = h.algo = {};
        return h;
      })(Math);
      return e;
    });
  })(ne)), ne.exports;
}
var ie = { exports: {} }, mn = ie.exports, wt;
function We() {
  return wt || (wt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(mn, function(e) {
      return (function(r) {
        var a = e, o = a.lib, x = o.Base, s = o.WordArray, h = a.x64 = {};
        h.Word = x.extend({
          /**
           * Initializes a newly created 64-bit word.
           *
           * @param {number} high The high 32 bits.
           * @param {number} low The low 32 bits.
           *
           * @example
           *
           *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
           */
          init: function(u, l) {
            this.high = u, this.low = l;
          }
          /**
           * Bitwise NOTs this word.
           *
           * @return {X64Word} A new x64-Word object after negating.
           *
           * @example
           *
           *     var negated = x64Word.not();
           */
          // not: function () {
          // var high = ~this.high;
          // var low = ~this.low;
          // return X64Word.create(high, low);
          // },
          /**
           * Bitwise ANDs this word with the passed word.
           *
           * @param {X64Word} word The x64-Word to AND with this word.
           *
           * @return {X64Word} A new x64-Word object after ANDing.
           *
           * @example
           *
           *     var anded = x64Word.and(anotherX64Word);
           */
          // and: function (word) {
          // var high = this.high & word.high;
          // var low = this.low & word.low;
          // return X64Word.create(high, low);
          // },
          /**
           * Bitwise ORs this word with the passed word.
           *
           * @param {X64Word} word The x64-Word to OR with this word.
           *
           * @return {X64Word} A new x64-Word object after ORing.
           *
           * @example
           *
           *     var ored = x64Word.or(anotherX64Word);
           */
          // or: function (word) {
          // var high = this.high | word.high;
          // var low = this.low | word.low;
          // return X64Word.create(high, low);
          // },
          /**
           * Bitwise XORs this word with the passed word.
           *
           * @param {X64Word} word The x64-Word to XOR with this word.
           *
           * @return {X64Word} A new x64-Word object after XORing.
           *
           * @example
           *
           *     var xored = x64Word.xor(anotherX64Word);
           */
          // xor: function (word) {
          // var high = this.high ^ word.high;
          // var low = this.low ^ word.low;
          // return X64Word.create(high, low);
          // },
          /**
           * Shifts this word n bits to the left.
           *
           * @param {number} n The number of bits to shift.
           *
           * @return {X64Word} A new x64-Word object after shifting.
           *
           * @example
           *
           *     var shifted = x64Word.shiftL(25);
           */
          // shiftL: function (n) {
          // if (n < 32) {
          // var high = (this.high << n) | (this.low >>> (32 - n));
          // var low = this.low << n;
          // } else {
          // var high = this.low << (n - 32);
          // var low = 0;
          // }
          // return X64Word.create(high, low);
          // },
          /**
           * Shifts this word n bits to the right.
           *
           * @param {number} n The number of bits to shift.
           *
           * @return {X64Word} A new x64-Word object after shifting.
           *
           * @example
           *
           *     var shifted = x64Word.shiftR(7);
           */
          // shiftR: function (n) {
          // if (n < 32) {
          // var low = (this.low >>> n) | (this.high << (32 - n));
          // var high = this.high >>> n;
          // } else {
          // var low = this.high >>> (n - 32);
          // var high = 0;
          // }
          // return X64Word.create(high, low);
          // },
          /**
           * Rotates this word n bits to the left.
           *
           * @param {number} n The number of bits to rotate.
           *
           * @return {X64Word} A new x64-Word object after rotating.
           *
           * @example
           *
           *     var rotated = x64Word.rotL(25);
           */
          // rotL: function (n) {
          // return this.shiftL(n).or(this.shiftR(64 - n));
          // },
          /**
           * Rotates this word n bits to the right.
           *
           * @param {number} n The number of bits to rotate.
           *
           * @return {X64Word} A new x64-Word object after rotating.
           *
           * @example
           *
           *     var rotated = x64Word.rotR(7);
           */
          // rotR: function (n) {
          // return this.shiftR(n).or(this.shiftL(64 - n));
          // },
          /**
           * Adds this word with the passed word.
           *
           * @param {X64Word} word The x64-Word to add with this word.
           *
           * @return {X64Word} A new x64-Word object after adding.
           *
           * @example
           *
           *     var added = x64Word.add(anotherX64Word);
           */
          // add: function (word) {
          // var low = (this.low + word.low) | 0;
          // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
          // var high = (this.high + word.high + carry) | 0;
          // return X64Word.create(high, low);
          // }
        }), h.WordArray = x.extend({
          /**
           * Initializes a newly created word array.
           *
           * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
           * @param {number} sigBytes (Optional) The number of significant bytes in the words.
           *
           * @example
           *
           *     var wordArray = CryptoJS.x64.WordArray.create();
           *
           *     var wordArray = CryptoJS.x64.WordArray.create([
           *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
           *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
           *     ]);
           *
           *     var wordArray = CryptoJS.x64.WordArray.create([
           *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
           *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
           *     ], 10);
           */
          init: function(u, l) {
            u = this.words = u || [], l != r ? this.sigBytes = l : this.sigBytes = u.length * 8;
          },
          /**
           * Converts this 64-bit word array to a 32-bit word array.
           *
           * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
           *
           * @example
           *
           *     var x32WordArray = x64WordArray.toX32();
           */
          toX32: function() {
            for (var u = this.words, l = u.length, y = [], d = 0; d < l; d++) {
              var p = u[d];
              y.push(p.high), y.push(p.low);
            }
            return s.create(y, this.sigBytes);
          },
          /**
           * Creates a copy of this word array.
           *
           * @return {X64WordArray} The clone.
           *
           * @example
           *
           *     var clone = x64WordArray.clone();
           */
          clone: function() {
            for (var u = x.clone.call(this), l = u.words = this.words.slice(0), y = l.length, d = 0; d < y; d++)
              l[d] = l[d].clone();
            return u;
          }
        });
      })(), e;
    });
  })(ie)), ie.exports;
}
var ae = { exports: {} }, vn = ae.exports, Dt;
function Bn() {
  return Dt || (Dt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(vn, function(e) {
      return (function() {
        if (typeof ArrayBuffer == "function") {
          var r = e, a = r.lib, o = a.WordArray, x = o.init, s = o.init = function(h) {
            if (h instanceof ArrayBuffer && (h = new Uint8Array(h)), (h instanceof Int8Array || typeof Uint8ClampedArray < "u" && h instanceof Uint8ClampedArray || h instanceof Int16Array || h instanceof Uint16Array || h instanceof Int32Array || h instanceof Uint32Array || h instanceof Float32Array || h instanceof Float64Array) && (h = new Uint8Array(h.buffer, h.byteOffset, h.byteLength)), h instanceof Uint8Array) {
              for (var u = h.byteLength, l = [], y = 0; y < u; y++)
                l[y >>> 2] |= h[y] << 24 - y % 4 * 8;
              x.call(this, l, u);
            } else
              x.apply(this, arguments);
          };
          s.prototype = o;
        }
      })(), e.lib.WordArray;
    });
  })(ae)), ae.exports;
}
var se = { exports: {} }, En = se.exports, _t;
function yn() {
  return _t || (_t = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(En, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = r.enc;
        x.Utf16 = x.Utf16BE = {
          /**
           * Converts a word array to a UTF-16 BE string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The UTF-16 BE string.
           *
           * @static
           *
           * @example
           *
           *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
           */
          stringify: function(h) {
            for (var u = h.words, l = h.sigBytes, y = [], d = 0; d < l; d += 2) {
              var p = u[d >>> 2] >>> 16 - d % 4 * 8 & 65535;
              y.push(String.fromCharCode(p));
            }
            return y.join("");
          },
          /**
           * Converts a UTF-16 BE string to a word array.
           *
           * @param {string} utf16Str The UTF-16 BE string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
           */
          parse: function(h) {
            for (var u = h.length, l = [], y = 0; y < u; y++)
              l[y >>> 1] |= h.charCodeAt(y) << 16 - y % 2 * 16;
            return o.create(l, u * 2);
          }
        }, x.Utf16LE = {
          /**
           * Converts a word array to a UTF-16 LE string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The UTF-16 LE string.
           *
           * @static
           *
           * @example
           *
           *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
           */
          stringify: function(h) {
            for (var u = h.words, l = h.sigBytes, y = [], d = 0; d < l; d += 2) {
              var p = s(u[d >>> 2] >>> 16 - d % 4 * 8 & 65535);
              y.push(String.fromCharCode(p));
            }
            return y.join("");
          },
          /**
           * Converts a UTF-16 LE string to a word array.
           *
           * @param {string} utf16Str The UTF-16 LE string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
           */
          parse: function(h) {
            for (var u = h.length, l = [], y = 0; y < u; y++)
              l[y >>> 1] |= s(h.charCodeAt(y) << 16 - y % 2 * 16);
            return o.create(l, u * 2);
          }
        };
        function s(h) {
          return h << 8 & 4278255360 | h >>> 8 & 16711935;
        }
      })(), e.enc.Utf16;
    });
  })(se)), se.exports;
}
var oe = { exports: {} }, An = oe.exports, kt;
function P0() {
  return kt || (kt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(An, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = r.enc;
        x.Base64 = {
          /**
           * Converts a word array to a Base64 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The Base64 string.
           *
           * @static
           *
           * @example
           *
           *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
           */
          stringify: function(h) {
            var u = h.words, l = h.sigBytes, y = this._map;
            h.clamp();
            for (var d = [], p = 0; p < l; p += 3)
              for (var m = u[p >>> 2] >>> 24 - p % 4 * 8 & 255, E = u[p + 1 >>> 2] >>> 24 - (p + 1) % 4 * 8 & 255, A = u[p + 2 >>> 2] >>> 24 - (p + 2) % 4 * 8 & 255, C = m << 16 | E << 8 | A, g = 0; g < 4 && p + g * 0.75 < l; g++)
                d.push(y.charAt(C >>> 6 * (3 - g) & 63));
            var B = y.charAt(64);
            if (B)
              for (; d.length % 4; )
                d.push(B);
            return d.join("");
          },
          /**
           * Converts a Base64 string to a word array.
           *
           * @param {string} base64Str The Base64 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
           */
          parse: function(h) {
            var u = h.length, l = this._map, y = this._reverseMap;
            if (!y) {
              y = this._reverseMap = [];
              for (var d = 0; d < l.length; d++)
                y[l.charCodeAt(d)] = d;
            }
            var p = l.charAt(64);
            if (p) {
              var m = h.indexOf(p);
              m !== -1 && (u = m);
            }
            return s(h, u, y);
          },
          _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        };
        function s(h, u, l) {
          for (var y = [], d = 0, p = 0; p < u; p++)
            if (p % 4) {
              var m = l[h.charCodeAt(p - 1)] << p % 4 * 2, E = l[h.charCodeAt(p)] >>> 6 - p % 4 * 2, A = m | E;
              y[d >>> 2] |= A << 24 - d % 4 * 8, d++;
            }
          return o.create(y, d);
        }
      })(), e.enc.Base64;
    });
  })(oe)), oe.exports;
}
var ue = { exports: {} }, Cn = ue.exports, St;
function Fn() {
  return St || (St = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(Cn, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = r.enc;
        x.Base64url = {
          /**
           * Converts a word array to a Base64url string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @param {boolean} urlSafe Whether to use url safe
           *
           * @return {string} The Base64url string.
           *
           * @static
           *
           * @example
           *
           *     var base64String = CryptoJS.enc.Base64url.stringify(wordArray);
           */
          stringify: function(h, u) {
            u === void 0 && (u = !0);
            var l = h.words, y = h.sigBytes, d = u ? this._safe_map : this._map;
            h.clamp();
            for (var p = [], m = 0; m < y; m += 3)
              for (var E = l[m >>> 2] >>> 24 - m % 4 * 8 & 255, A = l[m + 1 >>> 2] >>> 24 - (m + 1) % 4 * 8 & 255, C = l[m + 2 >>> 2] >>> 24 - (m + 2) % 4 * 8 & 255, g = E << 16 | A << 8 | C, B = 0; B < 4 && m + B * 0.75 < y; B++)
                p.push(d.charAt(g >>> 6 * (3 - B) & 63));
            var F = d.charAt(64);
            if (F)
              for (; p.length % 4; )
                p.push(F);
            return p.join("");
          },
          /**
           * Converts a Base64url string to a word array.
           *
           * @param {string} base64Str The Base64url string.
           *
           * @param {boolean} urlSafe Whether to use url safe
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Base64url.parse(base64String);
           */
          parse: function(h, u) {
            u === void 0 && (u = !0);
            var l = h.length, y = u ? this._safe_map : this._map, d = this._reverseMap;
            if (!d) {
              d = this._reverseMap = [];
              for (var p = 0; p < y.length; p++)
                d[y.charCodeAt(p)] = p;
            }
            var m = y.charAt(64);
            if (m) {
              var E = h.indexOf(m);
              E !== -1 && (l = E);
            }
            return s(h, l, d);
          },
          _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
          _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        };
        function s(h, u, l) {
          for (var y = [], d = 0, p = 0; p < u; p++)
            if (p % 4) {
              var m = l[h.charCodeAt(p - 1)] << p % 4 * 2, E = l[h.charCodeAt(p)] >>> 6 - p % 4 * 2, A = m | E;
              y[d >>> 2] |= A << 24 - d % 4 * 8, d++;
            }
          return o.create(y, d);
        }
      })(), e.enc.Base64url;
    });
  })(ue)), ue.exports;
}
var xe = { exports: {} }, bn = xe.exports, Tt;
function q0() {
  return Tt || (Tt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(bn, function(e) {
      return (function(r) {
        var a = e, o = a.lib, x = o.WordArray, s = o.Hasher, h = a.algo, u = [];
        (function() {
          for (var E = 0; E < 64; E++)
            u[E] = r.abs(r.sin(E + 1)) * 4294967296 | 0;
        })();
        var l = h.MD5 = s.extend({
          _doReset: function() {
            this._hash = new x.init([
              1732584193,
              4023233417,
              2562383102,
              271733878
            ]);
          },
          _doProcessBlock: function(E, A) {
            for (var C = 0; C < 16; C++) {
              var g = A + C, B = E[g];
              E[g] = (B << 8 | B >>> 24) & 16711935 | (B << 24 | B >>> 8) & 4278255360;
            }
            var F = this._hash.words, b = E[A + 0], D = E[A + 1], S = E[A + 2], R = E[A + 3], P = E[A + 4], _ = E[A + 5], k = E[A + 6], q = E[A + 7], U = E[A + 8], N = E[A + 9], H = E[A + 10], j = E[A + 11], J = E[A + 12], V = E[A + 13], Q = E[A + 14], X = E[A + 15], I = F[0], O = F[1], z = F[2], L = F[3];
            I = y(I, O, z, L, b, 7, u[0]), L = y(L, I, O, z, D, 12, u[1]), z = y(z, L, I, O, S, 17, u[2]), O = y(O, z, L, I, R, 22, u[3]), I = y(I, O, z, L, P, 7, u[4]), L = y(L, I, O, z, _, 12, u[5]), z = y(z, L, I, O, k, 17, u[6]), O = y(O, z, L, I, q, 22, u[7]), I = y(I, O, z, L, U, 7, u[8]), L = y(L, I, O, z, N, 12, u[9]), z = y(z, L, I, O, H, 17, u[10]), O = y(O, z, L, I, j, 22, u[11]), I = y(I, O, z, L, J, 7, u[12]), L = y(L, I, O, z, V, 12, u[13]), z = y(z, L, I, O, Q, 17, u[14]), O = y(O, z, L, I, X, 22, u[15]), I = d(I, O, z, L, D, 5, u[16]), L = d(L, I, O, z, k, 9, u[17]), z = d(z, L, I, O, j, 14, u[18]), O = d(O, z, L, I, b, 20, u[19]), I = d(I, O, z, L, _, 5, u[20]), L = d(L, I, O, z, H, 9, u[21]), z = d(z, L, I, O, X, 14, u[22]), O = d(O, z, L, I, P, 20, u[23]), I = d(I, O, z, L, N, 5, u[24]), L = d(L, I, O, z, Q, 9, u[25]), z = d(z, L, I, O, R, 14, u[26]), O = d(O, z, L, I, U, 20, u[27]), I = d(I, O, z, L, V, 5, u[28]), L = d(L, I, O, z, S, 9, u[29]), z = d(z, L, I, O, q, 14, u[30]), O = d(O, z, L, I, J, 20, u[31]), I = p(I, O, z, L, _, 4, u[32]), L = p(L, I, O, z, U, 11, u[33]), z = p(z, L, I, O, j, 16, u[34]), O = p(O, z, L, I, Q, 23, u[35]), I = p(I, O, z, L, D, 4, u[36]), L = p(L, I, O, z, P, 11, u[37]), z = p(z, L, I, O, q, 16, u[38]), O = p(O, z, L, I, H, 23, u[39]), I = p(I, O, z, L, V, 4, u[40]), L = p(L, I, O, z, b, 11, u[41]), z = p(z, L, I, O, R, 16, u[42]), O = p(O, z, L, I, k, 23, u[43]), I = p(I, O, z, L, N, 4, u[44]), L = p(L, I, O, z, J, 11, u[45]), z = p(z, L, I, O, X, 16, u[46]), O = p(O, z, L, I, S, 23, u[47]), I = m(I, O, z, L, b, 6, u[48]), L = m(L, I, O, z, q, 10, u[49]), z = m(z, L, I, O, Q, 15, u[50]), O = m(O, z, L, I, _, 21, u[51]), I = m(I, O, z, L, J, 6, u[52]), L = m(L, I, O, z, R, 10, u[53]), z = m(z, L, I, O, H, 15, u[54]), O = m(O, z, L, I, D, 21, u[55]), I = m(I, O, z, L, U, 6, u[56]), L = m(L, I, O, z, X, 10, u[57]), z = m(z, L, I, O, k, 15, u[58]), O = m(O, z, L, I, V, 21, u[59]), I = m(I, O, z, L, P, 6, u[60]), L = m(L, I, O, z, j, 10, u[61]), z = m(z, L, I, O, S, 15, u[62]), O = m(O, z, L, I, N, 21, u[63]), F[0] = F[0] + I | 0, F[1] = F[1] + O | 0, F[2] = F[2] + z | 0, F[3] = F[3] + L | 0;
          },
          _doFinalize: function() {
            var E = this._data, A = E.words, C = this._nDataBytes * 8, g = E.sigBytes * 8;
            A[g >>> 5] |= 128 << 24 - g % 32;
            var B = r.floor(C / 4294967296), F = C;
            A[(g + 64 >>> 9 << 4) + 15] = (B << 8 | B >>> 24) & 16711935 | (B << 24 | B >>> 8) & 4278255360, A[(g + 64 >>> 9 << 4) + 14] = (F << 8 | F >>> 24) & 16711935 | (F << 24 | F >>> 8) & 4278255360, E.sigBytes = (A.length + 1) * 4, this._process();
            for (var b = this._hash, D = b.words, S = 0; S < 4; S++) {
              var R = D[S];
              D[S] = (R << 8 | R >>> 24) & 16711935 | (R << 24 | R >>> 8) & 4278255360;
            }
            return b;
          },
          clone: function() {
            var E = s.clone.call(this);
            return E._hash = this._hash.clone(), E;
          }
        });
        function y(E, A, C, g, B, F, b) {
          var D = E + (A & C | ~A & g) + B + b;
          return (D << F | D >>> 32 - F) + A;
        }
        function d(E, A, C, g, B, F, b) {
          var D = E + (A & g | C & ~g) + B + b;
          return (D << F | D >>> 32 - F) + A;
        }
        function p(E, A, C, g, B, F, b) {
          var D = E + (A ^ C ^ g) + B + b;
          return (D << F | D >>> 32 - F) + A;
        }
        function m(E, A, C, g, B, F, b) {
          var D = E + (C ^ (A | ~g)) + B + b;
          return (D << F | D >>> 32 - F) + A;
        }
        a.MD5 = s._createHelper(l), a.HmacMD5 = s._createHmacHelper(l);
      })(Math), e.MD5;
    });
  })(xe)), xe.exports;
}
var ce = { exports: {} }, wn = ce.exports, Rt;
function vr() {
  return Rt || (Rt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(wn, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = a.Hasher, s = r.algo, h = [], u = s.SHA1 = x.extend({
          _doReset: function() {
            this._hash = new o.init([
              1732584193,
              4023233417,
              2562383102,
              271733878,
              3285377520
            ]);
          },
          _doProcessBlock: function(l, y) {
            for (var d = this._hash.words, p = d[0], m = d[1], E = d[2], A = d[3], C = d[4], g = 0; g < 80; g++) {
              if (g < 16)
                h[g] = l[y + g] | 0;
              else {
                var B = h[g - 3] ^ h[g - 8] ^ h[g - 14] ^ h[g - 16];
                h[g] = B << 1 | B >>> 31;
              }
              var F = (p << 5 | p >>> 27) + C + h[g];
              g < 20 ? F += (m & E | ~m & A) + 1518500249 : g < 40 ? F += (m ^ E ^ A) + 1859775393 : g < 60 ? F += (m & E | m & A | E & A) - 1894007588 : F += (m ^ E ^ A) - 899497514, C = A, A = E, E = m << 30 | m >>> 2, m = p, p = F;
            }
            d[0] = d[0] + p | 0, d[1] = d[1] + m | 0, d[2] = d[2] + E | 0, d[3] = d[3] + A | 0, d[4] = d[4] + C | 0;
          },
          _doFinalize: function() {
            var l = this._data, y = l.words, d = this._nDataBytes * 8, p = l.sigBytes * 8;
            return y[p >>> 5] |= 128 << 24 - p % 32, y[(p + 64 >>> 9 << 4) + 14] = Math.floor(d / 4294967296), y[(p + 64 >>> 9 << 4) + 15] = d, l.sigBytes = y.length * 4, this._process(), this._hash;
          },
          clone: function() {
            var l = x.clone.call(this);
            return l._hash = this._hash.clone(), l;
          }
        });
        r.SHA1 = x._createHelper(u), r.HmacSHA1 = x._createHmacHelper(u);
      })(), e.SHA1;
    });
  })(ce)), ce.exports;
}
var fe = { exports: {} }, Dn = fe.exports, It;
function st() {
  return It || (It = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(Dn, function(e) {
      return (function(r) {
        var a = e, o = a.lib, x = o.WordArray, s = o.Hasher, h = a.algo, u = [], l = [];
        (function() {
          function p(C) {
            for (var g = r.sqrt(C), B = 2; B <= g; B++)
              if (!(C % B))
                return !1;
            return !0;
          }
          function m(C) {
            return (C - (C | 0)) * 4294967296 | 0;
          }
          for (var E = 2, A = 0; A < 64; )
            p(E) && (A < 8 && (u[A] = m(r.pow(E, 1 / 2))), l[A] = m(r.pow(E, 1 / 3)), A++), E++;
        })();
        var y = [], d = h.SHA256 = s.extend({
          _doReset: function() {
            this._hash = new x.init(u.slice(0));
          },
          _doProcessBlock: function(p, m) {
            for (var E = this._hash.words, A = E[0], C = E[1], g = E[2], B = E[3], F = E[4], b = E[5], D = E[6], S = E[7], R = 0; R < 64; R++) {
              if (R < 16)
                y[R] = p[m + R] | 0;
              else {
                var P = y[R - 15], _ = (P << 25 | P >>> 7) ^ (P << 14 | P >>> 18) ^ P >>> 3, k = y[R - 2], q = (k << 15 | k >>> 17) ^ (k << 13 | k >>> 19) ^ k >>> 10;
                y[R] = _ + y[R - 7] + q + y[R - 16];
              }
              var U = F & b ^ ~F & D, N = A & C ^ A & g ^ C & g, H = (A << 30 | A >>> 2) ^ (A << 19 | A >>> 13) ^ (A << 10 | A >>> 22), j = (F << 26 | F >>> 6) ^ (F << 21 | F >>> 11) ^ (F << 7 | F >>> 25), J = S + j + U + l[R] + y[R], V = H + N;
              S = D, D = b, b = F, F = B + J | 0, B = g, g = C, C = A, A = J + V | 0;
            }
            E[0] = E[0] + A | 0, E[1] = E[1] + C | 0, E[2] = E[2] + g | 0, E[3] = E[3] + B | 0, E[4] = E[4] + F | 0, E[5] = E[5] + b | 0, E[6] = E[6] + D | 0, E[7] = E[7] + S | 0;
          },
          _doFinalize: function() {
            var p = this._data, m = p.words, E = this._nDataBytes * 8, A = p.sigBytes * 8;
            return m[A >>> 5] |= 128 << 24 - A % 32, m[(A + 64 >>> 9 << 4) + 14] = r.floor(E / 4294967296), m[(A + 64 >>> 9 << 4) + 15] = E, p.sigBytes = m.length * 4, this._process(), this._hash;
          },
          clone: function() {
            var p = s.clone.call(this);
            return p._hash = this._hash.clone(), p;
          }
        });
        a.SHA256 = s._createHelper(d), a.HmacSHA256 = s._createHmacHelper(d);
      })(Math), e.SHA256;
    });
  })(fe)), fe.exports;
}
var le = { exports: {} }, _n = le.exports, $t;
function kn() {
  return $t || ($t = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), st());
    })(_n, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = r.algo, s = x.SHA256, h = x.SHA224 = s.extend({
          _doReset: function() {
            this._hash = new o.init([
              3238371032,
              914150663,
              812702999,
              4144912697,
              4290775857,
              1750603025,
              1694076839,
              3204075428
            ]);
          },
          _doFinalize: function() {
            var u = s._doFinalize.call(this);
            return u.sigBytes -= 4, u;
          }
        });
        r.SHA224 = s._createHelper(h), r.HmacSHA224 = s._createHmacHelper(h);
      })(), e.SHA224;
    });
  })(le)), le.exports;
}
var he = { exports: {} }, Sn = he.exports, Ot;
function Br() {
  return Ot || (Ot = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), We());
    })(Sn, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.Hasher, x = r.x64, s = x.Word, h = x.WordArray, u = r.algo;
        function l() {
          return s.create.apply(s, arguments);
        }
        var y = [
          l(1116352408, 3609767458),
          l(1899447441, 602891725),
          l(3049323471, 3964484399),
          l(3921009573, 2173295548),
          l(961987163, 4081628472),
          l(1508970993, 3053834265),
          l(2453635748, 2937671579),
          l(2870763221, 3664609560),
          l(3624381080, 2734883394),
          l(310598401, 1164996542),
          l(607225278, 1323610764),
          l(1426881987, 3590304994),
          l(1925078388, 4068182383),
          l(2162078206, 991336113),
          l(2614888103, 633803317),
          l(3248222580, 3479774868),
          l(3835390401, 2666613458),
          l(4022224774, 944711139),
          l(264347078, 2341262773),
          l(604807628, 2007800933),
          l(770255983, 1495990901),
          l(1249150122, 1856431235),
          l(1555081692, 3175218132),
          l(1996064986, 2198950837),
          l(2554220882, 3999719339),
          l(2821834349, 766784016),
          l(2952996808, 2566594879),
          l(3210313671, 3203337956),
          l(3336571891, 1034457026),
          l(3584528711, 2466948901),
          l(113926993, 3758326383),
          l(338241895, 168717936),
          l(666307205, 1188179964),
          l(773529912, 1546045734),
          l(1294757372, 1522805485),
          l(1396182291, 2643833823),
          l(1695183700, 2343527390),
          l(1986661051, 1014477480),
          l(2177026350, 1206759142),
          l(2456956037, 344077627),
          l(2730485921, 1290863460),
          l(2820302411, 3158454273),
          l(3259730800, 3505952657),
          l(3345764771, 106217008),
          l(3516065817, 3606008344),
          l(3600352804, 1432725776),
          l(4094571909, 1467031594),
          l(275423344, 851169720),
          l(430227734, 3100823752),
          l(506948616, 1363258195),
          l(659060556, 3750685593),
          l(883997877, 3785050280),
          l(958139571, 3318307427),
          l(1322822218, 3812723403),
          l(1537002063, 2003034995),
          l(1747873779, 3602036899),
          l(1955562222, 1575990012),
          l(2024104815, 1125592928),
          l(2227730452, 2716904306),
          l(2361852424, 442776044),
          l(2428436474, 593698344),
          l(2756734187, 3733110249),
          l(3204031479, 2999351573),
          l(3329325298, 3815920427),
          l(3391569614, 3928383900),
          l(3515267271, 566280711),
          l(3940187606, 3454069534),
          l(4118630271, 4000239992),
          l(116418474, 1914138554),
          l(174292421, 2731055270),
          l(289380356, 3203993006),
          l(460393269, 320620315),
          l(685471733, 587496836),
          l(852142971, 1086792851),
          l(1017036298, 365543100),
          l(1126000580, 2618297676),
          l(1288033470, 3409855158),
          l(1501505948, 4234509866),
          l(1607167915, 987167468),
          l(1816402316, 1246189591)
        ], d = [];
        (function() {
          for (var m = 0; m < 80; m++)
            d[m] = l();
        })();
        var p = u.SHA512 = o.extend({
          _doReset: function() {
            this._hash = new h.init([
              new s.init(1779033703, 4089235720),
              new s.init(3144134277, 2227873595),
              new s.init(1013904242, 4271175723),
              new s.init(2773480762, 1595750129),
              new s.init(1359893119, 2917565137),
              new s.init(2600822924, 725511199),
              new s.init(528734635, 4215389547),
              new s.init(1541459225, 327033209)
            ]);
          },
          _doProcessBlock: function(m, E) {
            for (var A = this._hash.words, C = A[0], g = A[1], B = A[2], F = A[3], b = A[4], D = A[5], S = A[6], R = A[7], P = C.high, _ = C.low, k = g.high, q = g.low, U = B.high, N = B.low, H = F.high, j = F.low, J = b.high, V = b.low, Q = D.high, X = D.low, I = S.high, O = S.low, z = R.high, L = R.low, e0 = P, Y = _, f0 = k, M = q, y0 = U, A0 = N, W0 = H, b0 = j, u0 = J, o0 = V, z0 = Q, R0 = X, w0 = I, I0 = O, G0 = z, D0 = L, l0 = 0; l0 < 80; l0++) {
              var a0, g0, N0 = d[l0];
              if (l0 < 16)
                g0 = N0.high = m[E + l0 * 2] | 0, a0 = N0.low = m[E + l0 * 2 + 1] | 0;
              else {
                var m0 = d[l0 - 15], _0 = m0.high, f = m0.low, n = (_0 >>> 1 | f << 31) ^ (_0 >>> 8 | f << 24) ^ _0 >>> 7, i = (f >>> 1 | _0 << 31) ^ (f >>> 8 | _0 << 24) ^ (f >>> 7 | _0 << 25), v = d[l0 - 2], w = v.high, T = v.low, $ = (w >>> 19 | T << 13) ^ (w << 3 | T >>> 29) ^ w >>> 6, W = (T >>> 19 | w << 13) ^ (T << 3 | w >>> 29) ^ (T >>> 6 | w << 26), r0 = d[l0 - 7], t0 = r0.high, i0 = r0.low, Z = d[l0 - 16], Pr = Z.high, ft = Z.low;
                a0 = i + i0, g0 = n + t0 + (a0 >>> 0 < i >>> 0 ? 1 : 0), a0 = a0 + W, g0 = g0 + $ + (a0 >>> 0 < W >>> 0 ? 1 : 0), a0 = a0 + ft, g0 = g0 + Pr + (a0 >>> 0 < ft >>> 0 ? 1 : 0), N0.high = g0, N0.low = a0;
              }
              var qr = u0 & z0 ^ ~u0 & w0, lt = o0 & R0 ^ ~o0 & I0, Ur = e0 & f0 ^ e0 & y0 ^ f0 & y0, Lr = Y & M ^ Y & A0 ^ M & A0, zr = (e0 >>> 28 | Y << 4) ^ (e0 << 30 | Y >>> 2) ^ (e0 << 25 | Y >>> 7), ht = (Y >>> 28 | e0 << 4) ^ (Y << 30 | e0 >>> 2) ^ (Y << 25 | e0 >>> 7), Nr = (u0 >>> 14 | o0 << 18) ^ (u0 >>> 18 | o0 << 14) ^ (u0 << 23 | o0 >>> 9), Hr = (o0 >>> 14 | u0 << 18) ^ (o0 >>> 18 | u0 << 14) ^ (o0 << 23 | u0 >>> 9), dt = y[l0], Mr = dt.high, pt = dt.low, p0 = D0 + Hr, k0 = G0 + Nr + (p0 >>> 0 < D0 >>> 0 ? 1 : 0), p0 = p0 + lt, k0 = k0 + qr + (p0 >>> 0 < lt >>> 0 ? 1 : 0), p0 = p0 + pt, k0 = k0 + Mr + (p0 >>> 0 < pt >>> 0 ? 1 : 0), p0 = p0 + a0, k0 = k0 + g0 + (p0 >>> 0 < a0 >>> 0 ? 1 : 0), gt = ht + Lr, jr = zr + Ur + (gt >>> 0 < ht >>> 0 ? 1 : 0);
              G0 = w0, D0 = I0, w0 = z0, I0 = R0, z0 = u0, R0 = o0, o0 = b0 + p0 | 0, u0 = W0 + k0 + (o0 >>> 0 < b0 >>> 0 ? 1 : 0) | 0, W0 = y0, b0 = A0, y0 = f0, A0 = M, f0 = e0, M = Y, Y = p0 + gt | 0, e0 = k0 + jr + (Y >>> 0 < p0 >>> 0 ? 1 : 0) | 0;
            }
            _ = C.low = _ + Y, C.high = P + e0 + (_ >>> 0 < Y >>> 0 ? 1 : 0), q = g.low = q + M, g.high = k + f0 + (q >>> 0 < M >>> 0 ? 1 : 0), N = B.low = N + A0, B.high = U + y0 + (N >>> 0 < A0 >>> 0 ? 1 : 0), j = F.low = j + b0, F.high = H + W0 + (j >>> 0 < b0 >>> 0 ? 1 : 0), V = b.low = V + o0, b.high = J + u0 + (V >>> 0 < o0 >>> 0 ? 1 : 0), X = D.low = X + R0, D.high = Q + z0 + (X >>> 0 < R0 >>> 0 ? 1 : 0), O = S.low = O + I0, S.high = I + w0 + (O >>> 0 < I0 >>> 0 ? 1 : 0), L = R.low = L + D0, R.high = z + G0 + (L >>> 0 < D0 >>> 0 ? 1 : 0);
          },
          _doFinalize: function() {
            var m = this._data, E = m.words, A = this._nDataBytes * 8, C = m.sigBytes * 8;
            E[C >>> 5] |= 128 << 24 - C % 32, E[(C + 128 >>> 10 << 5) + 30] = Math.floor(A / 4294967296), E[(C + 128 >>> 10 << 5) + 31] = A, m.sigBytes = E.length * 4, this._process();
            var g = this._hash.toX32();
            return g;
          },
          clone: function() {
            var m = o.clone.call(this);
            return m._hash = this._hash.clone(), m;
          },
          blockSize: 1024 / 32
        });
        r.SHA512 = o._createHelper(p), r.HmacSHA512 = o._createHmacHelper(p);
      })(), e.SHA512;
    });
  })(he)), he.exports;
}
var de = { exports: {} }, Tn = de.exports, Pt;
function Rn() {
  return Pt || (Pt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), We(), Br());
    })(Tn, function(e) {
      return (function() {
        var r = e, a = r.x64, o = a.Word, x = a.WordArray, s = r.algo, h = s.SHA512, u = s.SHA384 = h.extend({
          _doReset: function() {
            this._hash = new x.init([
              new o.init(3418070365, 3238371032),
              new o.init(1654270250, 914150663),
              new o.init(2438529370, 812702999),
              new o.init(355462360, 4144912697),
              new o.init(1731405415, 4290775857),
              new o.init(2394180231, 1750603025),
              new o.init(3675008525, 1694076839),
              new o.init(1203062813, 3204075428)
            ]);
          },
          _doFinalize: function() {
            var l = h._doFinalize.call(this);
            return l.sigBytes -= 16, l;
          }
        });
        r.SHA384 = h._createHelper(u), r.HmacSHA384 = h._createHmacHelper(u);
      })(), e.SHA384;
    });
  })(de)), de.exports;
}
var pe = { exports: {} }, In = pe.exports, qt;
function $n() {
  return qt || (qt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), We());
    })(In, function(e) {
      return (function(r) {
        var a = e, o = a.lib, x = o.WordArray, s = o.Hasher, h = a.x64, u = h.Word, l = a.algo, y = [], d = [], p = [];
        (function() {
          for (var A = 1, C = 0, g = 0; g < 24; g++) {
            y[A + 5 * C] = (g + 1) * (g + 2) / 2 % 64;
            var B = C % 5, F = (2 * A + 3 * C) % 5;
            A = B, C = F;
          }
          for (var A = 0; A < 5; A++)
            for (var C = 0; C < 5; C++)
              d[A + 5 * C] = C + (2 * A + 3 * C) % 5 * 5;
          for (var b = 1, D = 0; D < 24; D++) {
            for (var S = 0, R = 0, P = 0; P < 7; P++) {
              if (b & 1) {
                var _ = (1 << P) - 1;
                _ < 32 ? R ^= 1 << _ : S ^= 1 << _ - 32;
              }
              b & 128 ? b = b << 1 ^ 113 : b <<= 1;
            }
            p[D] = u.create(S, R);
          }
        })();
        var m = [];
        (function() {
          for (var A = 0; A < 25; A++)
            m[A] = u.create();
        })();
        var E = l.SHA3 = s.extend({
          /**
           * Configuration options.
           *
           * @property {number} outputLength
           *   The desired number of bits in the output hash.
           *   Only values permitted are: 224, 256, 384, 512.
           *   Default: 512
           */
          cfg: s.cfg.extend({
            outputLength: 512
          }),
          _doReset: function() {
            for (var A = this._state = [], C = 0; C < 25; C++)
              A[C] = new u.init();
            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
          },
          _doProcessBlock: function(A, C) {
            for (var g = this._state, B = this.blockSize / 2, F = 0; F < B; F++) {
              var b = A[C + 2 * F], D = A[C + 2 * F + 1];
              b = (b << 8 | b >>> 24) & 16711935 | (b << 24 | b >>> 8) & 4278255360, D = (D << 8 | D >>> 24) & 16711935 | (D << 24 | D >>> 8) & 4278255360;
              var S = g[F];
              S.high ^= D, S.low ^= b;
            }
            for (var R = 0; R < 24; R++) {
              for (var P = 0; P < 5; P++) {
                for (var _ = 0, k = 0, q = 0; q < 5; q++) {
                  var S = g[P + 5 * q];
                  _ ^= S.high, k ^= S.low;
                }
                var U = m[P];
                U.high = _, U.low = k;
              }
              for (var P = 0; P < 5; P++)
                for (var N = m[(P + 4) % 5], H = m[(P + 1) % 5], j = H.high, J = H.low, _ = N.high ^ (j << 1 | J >>> 31), k = N.low ^ (J << 1 | j >>> 31), q = 0; q < 5; q++) {
                  var S = g[P + 5 * q];
                  S.high ^= _, S.low ^= k;
                }
              for (var V = 1; V < 25; V++) {
                var _, k, S = g[V], Q = S.high, X = S.low, I = y[V];
                I < 32 ? (_ = Q << I | X >>> 32 - I, k = X << I | Q >>> 32 - I) : (_ = X << I - 32 | Q >>> 64 - I, k = Q << I - 32 | X >>> 64 - I);
                var O = m[d[V]];
                O.high = _, O.low = k;
              }
              var z = m[0], L = g[0];
              z.high = L.high, z.low = L.low;
              for (var P = 0; P < 5; P++)
                for (var q = 0; q < 5; q++) {
                  var V = P + 5 * q, S = g[V], e0 = m[V], Y = m[(P + 1) % 5 + 5 * q], f0 = m[(P + 2) % 5 + 5 * q];
                  S.high = e0.high ^ ~Y.high & f0.high, S.low = e0.low ^ ~Y.low & f0.low;
                }
              var S = g[0], M = p[R];
              S.high ^= M.high, S.low ^= M.low;
            }
          },
          _doFinalize: function() {
            var A = this._data, C = A.words;
            this._nDataBytes * 8;
            var g = A.sigBytes * 8, B = this.blockSize * 32;
            C[g >>> 5] |= 1 << 24 - g % 32, C[(r.ceil((g + 1) / B) * B >>> 5) - 1] |= 128, A.sigBytes = C.length * 4, this._process();
            for (var F = this._state, b = this.cfg.outputLength / 8, D = b / 8, S = [], R = 0; R < D; R++) {
              var P = F[R], _ = P.high, k = P.low;
              _ = (_ << 8 | _ >>> 24) & 16711935 | (_ << 24 | _ >>> 8) & 4278255360, k = (k << 8 | k >>> 24) & 16711935 | (k << 24 | k >>> 8) & 4278255360, S.push(k), S.push(_);
            }
            return new x.init(S, b);
          },
          clone: function() {
            for (var A = s.clone.call(this), C = A._state = this._state.slice(0), g = 0; g < 25; g++)
              C[g] = C[g].clone();
            return A;
          }
        });
        a.SHA3 = s._createHelper(E), a.HmacSHA3 = s._createHmacHelper(E);
      })(Math), e.SHA3;
    });
  })(pe)), pe.exports;
}
var ge = { exports: {} }, On = ge.exports, Ut;
function Pn() {
  return Ut || (Ut = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(On, function(e) {
      /** @preserve
      			(c) 2012 by Cédric Mesnil. All rights reserved.
      
      			Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
      
      			    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
      			    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
      
      			THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
      			*/
      return (function(r) {
        var a = e, o = a.lib, x = o.WordArray, s = o.Hasher, h = a.algo, u = x.create([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          7,
          4,
          13,
          1,
          10,
          6,
          15,
          3,
          12,
          0,
          9,
          5,
          2,
          14,
          11,
          8,
          3,
          10,
          14,
          4,
          9,
          15,
          8,
          1,
          2,
          7,
          0,
          6,
          13,
          11,
          5,
          12,
          1,
          9,
          11,
          10,
          0,
          8,
          12,
          4,
          13,
          3,
          7,
          15,
          14,
          5,
          6,
          2,
          4,
          0,
          5,
          9,
          7,
          12,
          2,
          10,
          14,
          1,
          3,
          8,
          11,
          6,
          15,
          13
        ]), l = x.create([
          5,
          14,
          7,
          0,
          9,
          2,
          11,
          4,
          13,
          6,
          15,
          8,
          1,
          10,
          3,
          12,
          6,
          11,
          3,
          7,
          0,
          13,
          5,
          10,
          14,
          15,
          8,
          12,
          4,
          9,
          1,
          2,
          15,
          5,
          1,
          3,
          7,
          14,
          6,
          9,
          11,
          8,
          12,
          2,
          10,
          0,
          4,
          13,
          8,
          6,
          4,
          1,
          3,
          11,
          15,
          0,
          5,
          12,
          2,
          13,
          9,
          7,
          10,
          14,
          12,
          15,
          10,
          4,
          1,
          5,
          8,
          7,
          6,
          2,
          13,
          14,
          0,
          3,
          9,
          11
        ]), y = x.create([
          11,
          14,
          15,
          12,
          5,
          8,
          7,
          9,
          11,
          13,
          14,
          15,
          6,
          7,
          9,
          8,
          7,
          6,
          8,
          13,
          11,
          9,
          7,
          15,
          7,
          12,
          15,
          9,
          11,
          7,
          13,
          12,
          11,
          13,
          6,
          7,
          14,
          9,
          13,
          15,
          14,
          8,
          13,
          6,
          5,
          12,
          7,
          5,
          11,
          12,
          14,
          15,
          14,
          15,
          9,
          8,
          9,
          14,
          5,
          6,
          8,
          6,
          5,
          12,
          9,
          15,
          5,
          11,
          6,
          8,
          13,
          12,
          5,
          12,
          13,
          14,
          11,
          8,
          5,
          6
        ]), d = x.create([
          8,
          9,
          9,
          11,
          13,
          15,
          15,
          5,
          7,
          7,
          8,
          11,
          14,
          14,
          12,
          6,
          9,
          13,
          15,
          7,
          12,
          8,
          9,
          11,
          7,
          7,
          12,
          7,
          6,
          15,
          13,
          11,
          9,
          7,
          15,
          11,
          8,
          6,
          6,
          14,
          12,
          13,
          5,
          14,
          13,
          13,
          7,
          5,
          15,
          5,
          8,
          11,
          14,
          14,
          6,
          14,
          6,
          9,
          12,
          9,
          12,
          5,
          15,
          8,
          8,
          5,
          12,
          9,
          12,
          5,
          14,
          6,
          8,
          13,
          6,
          5,
          15,
          13,
          11,
          11
        ]), p = x.create([0, 1518500249, 1859775393, 2400959708, 2840853838]), m = x.create([1352829926, 1548603684, 1836072691, 2053994217, 0]), E = h.RIPEMD160 = s.extend({
          _doReset: function() {
            this._hash = x.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
          },
          _doProcessBlock: function(D, S) {
            for (var R = 0; R < 16; R++) {
              var P = S + R, _ = D[P];
              D[P] = (_ << 8 | _ >>> 24) & 16711935 | (_ << 24 | _ >>> 8) & 4278255360;
            }
            var k = this._hash.words, q = p.words, U = m.words, N = u.words, H = l.words, j = y.words, J = d.words, V, Q, X, I, O, z, L, e0, Y, f0;
            z = V = k[0], L = Q = k[1], e0 = X = k[2], Y = I = k[3], f0 = O = k[4];
            for (var M, R = 0; R < 80; R += 1)
              M = V + D[S + N[R]] | 0, R < 16 ? M += A(Q, X, I) + q[0] : R < 32 ? M += C(Q, X, I) + q[1] : R < 48 ? M += g(Q, X, I) + q[2] : R < 64 ? M += B(Q, X, I) + q[3] : M += F(Q, X, I) + q[4], M = M | 0, M = b(M, j[R]), M = M + O | 0, V = O, O = I, I = b(X, 10), X = Q, Q = M, M = z + D[S + H[R]] | 0, R < 16 ? M += F(L, e0, Y) + U[0] : R < 32 ? M += B(L, e0, Y) + U[1] : R < 48 ? M += g(L, e0, Y) + U[2] : R < 64 ? M += C(L, e0, Y) + U[3] : M += A(L, e0, Y) + U[4], M = M | 0, M = b(M, J[R]), M = M + f0 | 0, z = f0, f0 = Y, Y = b(e0, 10), e0 = L, L = M;
            M = k[1] + X + Y | 0, k[1] = k[2] + I + f0 | 0, k[2] = k[3] + O + z | 0, k[3] = k[4] + V + L | 0, k[4] = k[0] + Q + e0 | 0, k[0] = M;
          },
          _doFinalize: function() {
            var D = this._data, S = D.words, R = this._nDataBytes * 8, P = D.sigBytes * 8;
            S[P >>> 5] |= 128 << 24 - P % 32, S[(P + 64 >>> 9 << 4) + 14] = (R << 8 | R >>> 24) & 16711935 | (R << 24 | R >>> 8) & 4278255360, D.sigBytes = (S.length + 1) * 4, this._process();
            for (var _ = this._hash, k = _.words, q = 0; q < 5; q++) {
              var U = k[q];
              k[q] = (U << 8 | U >>> 24) & 16711935 | (U << 24 | U >>> 8) & 4278255360;
            }
            return _;
          },
          clone: function() {
            var D = s.clone.call(this);
            return D._hash = this._hash.clone(), D;
          }
        });
        function A(D, S, R) {
          return D ^ S ^ R;
        }
        function C(D, S, R) {
          return D & S | ~D & R;
        }
        function g(D, S, R) {
          return (D | ~S) ^ R;
        }
        function B(D, S, R) {
          return D & R | S & ~R;
        }
        function F(D, S, R) {
          return D ^ (S | ~R);
        }
        function b(D, S) {
          return D << S | D >>> 32 - S;
        }
        a.RIPEMD160 = s._createHelper(E), a.HmacRIPEMD160 = s._createHmacHelper(E);
      })(), e.RIPEMD160;
    });
  })(ge)), ge.exports;
}
var me = { exports: {} }, qn = me.exports, Lt;
function ot() {
  return Lt || (Lt = 1, (function(c, t) {
    (function(e, r) {
      c.exports = r(G());
    })(qn, function(e) {
      (function() {
        var r = e, a = r.lib, o = a.Base, x = r.enc, s = x.Utf8, h = r.algo;
        h.HMAC = o.extend({
          /**
           * Initializes a newly created HMAC.
           *
           * @param {Hasher} hasher The hash algorithm to use.
           * @param {WordArray|string} key The secret key.
           *
           * @example
           *
           *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
           */
          init: function(u, l) {
            u = this._hasher = new u.init(), typeof l == "string" && (l = s.parse(l));
            var y = u.blockSize, d = y * 4;
            l.sigBytes > d && (l = u.finalize(l)), l.clamp();
            for (var p = this._oKey = l.clone(), m = this._iKey = l.clone(), E = p.words, A = m.words, C = 0; C < y; C++)
              E[C] ^= 1549556828, A[C] ^= 909522486;
            p.sigBytes = m.sigBytes = d, this.reset();
          },
          /**
           * Resets this HMAC to its initial state.
           *
           * @example
           *
           *     hmacHasher.reset();
           */
          reset: function() {
            var u = this._hasher;
            u.reset(), u.update(this._iKey);
          },
          /**
           * Updates this HMAC with a message.
           *
           * @param {WordArray|string} messageUpdate The message to append.
           *
           * @return {HMAC} This HMAC instance.
           *
           * @example
           *
           *     hmacHasher.update('message');
           *     hmacHasher.update(wordArray);
           */
          update: function(u) {
            return this._hasher.update(u), this;
          },
          /**
           * Finalizes the HMAC computation.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} messageUpdate (Optional) A final message update.
           *
           * @return {WordArray} The HMAC.
           *
           * @example
           *
           *     var hmac = hmacHasher.finalize();
           *     var hmac = hmacHasher.finalize('message');
           *     var hmac = hmacHasher.finalize(wordArray);
           */
          finalize: function(u) {
            var l = this._hasher, y = l.finalize(u);
            l.reset();
            var d = l.finalize(this._oKey.clone().concat(y));
            return d;
          }
        });
      })();
    });
  })(me)), me.exports;
}
var ve = { exports: {} }, Un = ve.exports, zt;
function Ln() {
  return zt || (zt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), st(), ot());
    })(Un, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.Base, x = a.WordArray, s = r.algo, h = s.SHA256, u = s.HMAC, l = s.PBKDF2 = o.extend({
          /**
           * Configuration options.
           *
           * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
           * @property {Hasher} hasher The hasher to use. Default: SHA256
           * @property {number} iterations The number of iterations to perform. Default: 250000
           */
          cfg: o.extend({
            keySize: 128 / 32,
            hasher: h,
            iterations: 25e4
          }),
          /**
           * Initializes a newly created key derivation function.
           *
           * @param {Object} cfg (Optional) The configuration options to use for the derivation.
           *
           * @example
           *
           *     var kdf = CryptoJS.algo.PBKDF2.create();
           *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
           *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
           */
          init: function(y) {
            this.cfg = this.cfg.extend(y);
          },
          /**
           * Computes the Password-Based Key Derivation Function 2.
           *
           * @param {WordArray|string} password The password.
           * @param {WordArray|string} salt A salt.
           *
           * @return {WordArray} The derived key.
           *
           * @example
           *
           *     var key = kdf.compute(password, salt);
           */
          compute: function(y, d) {
            for (var p = this.cfg, m = u.create(p.hasher, y), E = x.create(), A = x.create([1]), C = E.words, g = A.words, B = p.keySize, F = p.iterations; C.length < B; ) {
              var b = m.update(d).finalize(A);
              m.reset();
              for (var D = b.words, S = D.length, R = b, P = 1; P < F; P++) {
                R = m.finalize(R), m.reset();
                for (var _ = R.words, k = 0; k < S; k++)
                  D[k] ^= _[k];
              }
              E.concat(b), g[0]++;
            }
            return E.sigBytes = B * 4, E;
          }
        });
        r.PBKDF2 = function(y, d, p) {
          return l.create(p).compute(y, d);
        };
      })(), e.PBKDF2;
    });
  })(ve)), ve.exports;
}
var Be = { exports: {} }, zn = Be.exports, Nt;
function T0() {
  return Nt || (Nt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), vr(), ot());
    })(zn, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.Base, x = a.WordArray, s = r.algo, h = s.MD5, u = s.EvpKDF = o.extend({
          /**
           * Configuration options.
           *
           * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
           * @property {Hasher} hasher The hash algorithm to use. Default: MD5
           * @property {number} iterations The number of iterations to perform. Default: 1
           */
          cfg: o.extend({
            keySize: 128 / 32,
            hasher: h,
            iterations: 1
          }),
          /**
           * Initializes a newly created key derivation function.
           *
           * @param {Object} cfg (Optional) The configuration options to use for the derivation.
           *
           * @example
           *
           *     var kdf = CryptoJS.algo.EvpKDF.create();
           *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
           *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
           */
          init: function(l) {
            this.cfg = this.cfg.extend(l);
          },
          /**
           * Derives a key from a password.
           *
           * @param {WordArray|string} password The password.
           * @param {WordArray|string} salt A salt.
           *
           * @return {WordArray} The derived key.
           *
           * @example
           *
           *     var key = kdf.compute(password, salt);
           */
          compute: function(l, y) {
            for (var d, p = this.cfg, m = p.hasher.create(), E = x.create(), A = E.words, C = p.keySize, g = p.iterations; A.length < C; ) {
              d && m.update(d), d = m.update(l).finalize(y), m.reset();
              for (var B = 1; B < g; B++)
                d = m.finalize(d), m.reset();
              E.concat(d);
            }
            return E.sigBytes = C * 4, E;
          }
        });
        r.EvpKDF = function(l, y, d) {
          return u.create(d).compute(l, y);
        };
      })(), e.EvpKDF;
    });
  })(Be)), Be.exports;
}
var Ee = { exports: {} }, Nn = Ee.exports, Ht;
function c0() {
  return Ht || (Ht = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), T0());
    })(Nn, function(e) {
      e.lib.Cipher || (function(r) {
        var a = e, o = a.lib, x = o.Base, s = o.WordArray, h = o.BufferedBlockAlgorithm, u = a.enc;
        u.Utf8;
        var l = u.Base64, y = a.algo, d = y.EvpKDF, p = o.Cipher = h.extend({
          /**
           * Configuration options.
           *
           * @property {WordArray} iv The IV to use for this operation.
           */
          cfg: x.extend(),
          /**
           * Creates this cipher in encryption mode.
           *
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {Cipher} A cipher instance.
           *
           * @static
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
           */
          createEncryptor: function(_, k) {
            return this.create(this._ENC_XFORM_MODE, _, k);
          },
          /**
           * Creates this cipher in decryption mode.
           *
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {Cipher} A cipher instance.
           *
           * @static
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
           */
          createDecryptor: function(_, k) {
            return this.create(this._DEC_XFORM_MODE, _, k);
          },
          /**
           * Initializes a newly created cipher.
           *
           * @param {number} xformMode Either the encryption or decryption transormation mode constant.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
           */
          init: function(_, k, q) {
            this.cfg = this.cfg.extend(q), this._xformMode = _, this._key = k, this.reset();
          },
          /**
           * Resets this cipher to its initial state.
           *
           * @example
           *
           *     cipher.reset();
           */
          reset: function() {
            h.reset.call(this), this._doReset();
          },
          /**
           * Adds data to be encrypted or decrypted.
           *
           * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
           *
           * @return {WordArray} The data after processing.
           *
           * @example
           *
           *     var encrypted = cipher.process('data');
           *     var encrypted = cipher.process(wordArray);
           */
          process: function(_) {
            return this._append(_), this._process();
          },
          /**
           * Finalizes the encryption or decryption process.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
           *
           * @return {WordArray} The data after final processing.
           *
           * @example
           *
           *     var encrypted = cipher.finalize();
           *     var encrypted = cipher.finalize('data');
           *     var encrypted = cipher.finalize(wordArray);
           */
          finalize: function(_) {
            _ && this._append(_);
            var k = this._doFinalize();
            return k;
          },
          keySize: 128 / 32,
          ivSize: 128 / 32,
          _ENC_XFORM_MODE: 1,
          _DEC_XFORM_MODE: 2,
          /**
           * Creates shortcut functions to a cipher's object interface.
           *
           * @param {Cipher} cipher The cipher to create a helper for.
           *
           * @return {Object} An object with encrypt and decrypt shortcut functions.
           *
           * @static
           *
           * @example
           *
           *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
           */
          _createHelper: /* @__PURE__ */ (function() {
            function _(k) {
              return typeof k == "string" ? P : D;
            }
            return function(k) {
              return {
                encrypt: function(q, U, N) {
                  return _(U).encrypt(k, q, U, N);
                },
                decrypt: function(q, U, N) {
                  return _(U).decrypt(k, q, U, N);
                }
              };
            };
          })()
        });
        o.StreamCipher = p.extend({
          _doFinalize: function() {
            var _ = this._process(!0);
            return _;
          },
          blockSize: 1
        });
        var m = a.mode = {}, E = o.BlockCipherMode = x.extend({
          /**
           * Creates this mode for encryption.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @static
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
           */
          createEncryptor: function(_, k) {
            return this.Encryptor.create(_, k);
          },
          /**
           * Creates this mode for decryption.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @static
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
           */
          createDecryptor: function(_, k) {
            return this.Decryptor.create(_, k);
          },
          /**
           * Initializes a newly created mode.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
           */
          init: function(_, k) {
            this._cipher = _, this._iv = k;
          }
        }), A = m.CBC = (function() {
          var _ = E.extend();
          _.Encryptor = _.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function(q, U) {
              var N = this._cipher, H = N.blockSize;
              k.call(this, q, U, H), N.encryptBlock(q, U), this._prevBlock = q.slice(U, U + H);
            }
          }), _.Decryptor = _.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function(q, U) {
              var N = this._cipher, H = N.blockSize, j = q.slice(U, U + H);
              N.decryptBlock(q, U), k.call(this, q, U, H), this._prevBlock = j;
            }
          });
          function k(q, U, N) {
            var H, j = this._iv;
            j ? (H = j, this._iv = r) : H = this._prevBlock;
            for (var J = 0; J < N; J++)
              q[U + J] ^= H[J];
          }
          return _;
        })(), C = a.pad = {}, g = C.Pkcs7 = {
          /**
           * Pads data using the algorithm defined in PKCS #5/7.
           *
           * @param {WordArray} data The data to pad.
           * @param {number} blockSize The multiple that the data should be padded to.
           *
           * @static
           *
           * @example
           *
           *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
           */
          pad: function(_, k) {
            for (var q = k * 4, U = q - _.sigBytes % q, N = U << 24 | U << 16 | U << 8 | U, H = [], j = 0; j < U; j += 4)
              H.push(N);
            var J = s.create(H, U);
            _.concat(J);
          },
          /**
           * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
           *
           * @param {WordArray} data The data to unpad.
           *
           * @static
           *
           * @example
           *
           *     CryptoJS.pad.Pkcs7.unpad(wordArray);
           */
          unpad: function(_) {
            var k = _.words[_.sigBytes - 1 >>> 2] & 255;
            _.sigBytes -= k;
          }
        };
        o.BlockCipher = p.extend({
          /**
           * Configuration options.
           *
           * @property {Mode} mode The block mode to use. Default: CBC
           * @property {Padding} padding The padding strategy to use. Default: Pkcs7
           */
          cfg: p.cfg.extend({
            mode: A,
            padding: g
          }),
          reset: function() {
            var _;
            p.reset.call(this);
            var k = this.cfg, q = k.iv, U = k.mode;
            this._xformMode == this._ENC_XFORM_MODE ? _ = U.createEncryptor : (_ = U.createDecryptor, this._minBufferSize = 1), this._mode && this._mode.__creator == _ ? this._mode.init(this, q && q.words) : (this._mode = _.call(U, this, q && q.words), this._mode.__creator = _);
          },
          _doProcessBlock: function(_, k) {
            this._mode.processBlock(_, k);
          },
          _doFinalize: function() {
            var _, k = this.cfg.padding;
            return this._xformMode == this._ENC_XFORM_MODE ? (k.pad(this._data, this.blockSize), _ = this._process(!0)) : (_ = this._process(!0), k.unpad(_)), _;
          },
          blockSize: 128 / 32
        });
        var B = o.CipherParams = x.extend({
          /**
           * Initializes a newly created cipher params object.
           *
           * @param {Object} cipherParams An object with any of the possible cipher parameters.
           *
           * @example
           *
           *     var cipherParams = CryptoJS.lib.CipherParams.create({
           *         ciphertext: ciphertextWordArray,
           *         key: keyWordArray,
           *         iv: ivWordArray,
           *         salt: saltWordArray,
           *         algorithm: CryptoJS.algo.AES,
           *         mode: CryptoJS.mode.CBC,
           *         padding: CryptoJS.pad.PKCS7,
           *         blockSize: 4,
           *         formatter: CryptoJS.format.OpenSSL
           *     });
           */
          init: function(_) {
            this.mixIn(_);
          },
          /**
           * Converts this cipher params object to a string.
           *
           * @param {Format} formatter (Optional) The formatting strategy to use.
           *
           * @return {string} The stringified cipher params.
           *
           * @throws Error If neither the formatter nor the default formatter is set.
           *
           * @example
           *
           *     var string = cipherParams + '';
           *     var string = cipherParams.toString();
           *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
           */
          toString: function(_) {
            return (_ || this.formatter).stringify(this);
          }
        }), F = a.format = {}, b = F.OpenSSL = {
          /**
           * Converts a cipher params object to an OpenSSL-compatible string.
           *
           * @param {CipherParams} cipherParams The cipher params object.
           *
           * @return {string} The OpenSSL-compatible string.
           *
           * @static
           *
           * @example
           *
           *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
           */
          stringify: function(_) {
            var k, q = _.ciphertext, U = _.salt;
            return U ? k = s.create([1398893684, 1701076831]).concat(U).concat(q) : k = q, k.toString(l);
          },
          /**
           * Converts an OpenSSL-compatible string to a cipher params object.
           *
           * @param {string} openSSLStr The OpenSSL-compatible string.
           *
           * @return {CipherParams} The cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
           */
          parse: function(_) {
            var k, q = l.parse(_), U = q.words;
            return U[0] == 1398893684 && U[1] == 1701076831 && (k = s.create(U.slice(2, 4)), U.splice(0, 4), q.sigBytes -= 16), B.create({ ciphertext: q, salt: k });
          }
        }, D = o.SerializableCipher = x.extend({
          /**
           * Configuration options.
           *
           * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
           */
          cfg: x.extend({
            format: b
          }),
          /**
           * Encrypts a message.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {WordArray|string} message The message to encrypt.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {CipherParams} A cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           */
          encrypt: function(_, k, q, U) {
            U = this.cfg.extend(U);
            var N = _.createEncryptor(q, U), H = N.finalize(k), j = N.cfg;
            return B.create({
              ciphertext: H,
              key: q,
              iv: j.iv,
              algorithm: _,
              mode: j.mode,
              padding: j.padding,
              blockSize: _.blockSize,
              formatter: U.format
            });
          },
          /**
           * Decrypts serialized ciphertext.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {WordArray} The plaintext.
           *
           * @static
           *
           * @example
           *
           *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           */
          decrypt: function(_, k, q, U) {
            U = this.cfg.extend(U), k = this._parse(k, U.format);
            var N = _.createDecryptor(q, U).finalize(k.ciphertext);
            return N;
          },
          /**
           * Converts serialized ciphertext to CipherParams,
           * else assumed CipherParams already and returns ciphertext unchanged.
           *
           * @param {CipherParams|string} ciphertext The ciphertext.
           * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
           *
           * @return {CipherParams} The unserialized ciphertext.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
           */
          _parse: function(_, k) {
            return typeof _ == "string" ? k.parse(_, this) : _;
          }
        }), S = a.kdf = {}, R = S.OpenSSL = {
          /**
           * Derives a key and IV from a password.
           *
           * @param {string} password The password to derive from.
           * @param {number} keySize The size in words of the key to generate.
           * @param {number} ivSize The size in words of the IV to generate.
           * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
           *
           * @return {CipherParams} A cipher params object with the key, IV, and salt.
           *
           * @static
           *
           * @example
           *
           *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
           *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
           */
          execute: function(_, k, q, U, N) {
            if (U || (U = s.random(64 / 8)), N)
              var H = d.create({ keySize: k + q, hasher: N }).compute(_, U);
            else
              var H = d.create({ keySize: k + q }).compute(_, U);
            var j = s.create(H.words.slice(k), q * 4);
            return H.sigBytes = k * 4, B.create({ key: H, iv: j, salt: U });
          }
        }, P = o.PasswordBasedCipher = D.extend({
          /**
           * Configuration options.
           *
           * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
           */
          cfg: D.cfg.extend({
            kdf: R
          }),
          /**
           * Encrypts a message using a password.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {WordArray|string} message The message to encrypt.
           * @param {string} password The password.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {CipherParams} A cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
           *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
           */
          encrypt: function(_, k, q, U) {
            U = this.cfg.extend(U);
            var N = U.kdf.execute(q, _.keySize, _.ivSize, U.salt, U.hasher);
            U.iv = N.iv;
            var H = D.encrypt.call(this, _, k, N.key, U);
            return H.mixIn(N), H;
          },
          /**
           * Decrypts serialized ciphertext using a password.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
           * @param {string} password The password.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {WordArray} The plaintext.
           *
           * @static
           *
           * @example
           *
           *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
           *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
           */
          decrypt: function(_, k, q, U) {
            U = this.cfg.extend(U), k = this._parse(k, U.format);
            var N = U.kdf.execute(q, _.keySize, _.ivSize, k.salt, U.hasher);
            U.iv = N.iv;
            var H = D.decrypt.call(this, _, k, N.key, U);
            return H;
          }
        });
      })();
    });
  })(Ee)), Ee.exports;
}
var ye = { exports: {} }, Hn = ye.exports, Mt;
function Mn() {
  return Mt || (Mt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(Hn, function(e) {
      return e.mode.CFB = (function() {
        var r = e.lib.BlockCipherMode.extend();
        r.Encryptor = r.extend({
          processBlock: function(o, x) {
            var s = this._cipher, h = s.blockSize;
            a.call(this, o, x, h, s), this._prevBlock = o.slice(x, x + h);
          }
        }), r.Decryptor = r.extend({
          processBlock: function(o, x) {
            var s = this._cipher, h = s.blockSize, u = o.slice(x, x + h);
            a.call(this, o, x, h, s), this._prevBlock = u;
          }
        });
        function a(o, x, s, h) {
          var u, l = this._iv;
          l ? (u = l.slice(0), this._iv = void 0) : u = this._prevBlock, h.encryptBlock(u, 0);
          for (var y = 0; y < s; y++)
            o[x + y] ^= u[y];
        }
        return r;
      })(), e.mode.CFB;
    });
  })(ye)), ye.exports;
}
var Ae = { exports: {} }, jn = Ae.exports, jt;
function Wn() {
  return jt || (jt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(jn, function(e) {
      return e.mode.CTR = (function() {
        var r = e.lib.BlockCipherMode.extend(), a = r.Encryptor = r.extend({
          processBlock: function(o, x) {
            var s = this._cipher, h = s.blockSize, u = this._iv, l = this._counter;
            u && (l = this._counter = u.slice(0), this._iv = void 0);
            var y = l.slice(0);
            s.encryptBlock(y, 0), l[h - 1] = l[h - 1] + 1 | 0;
            for (var d = 0; d < h; d++)
              o[x + d] ^= y[d];
          }
        });
        return r.Decryptor = a, r;
      })(), e.mode.CTR;
    });
  })(Ae)), Ae.exports;
}
var Ce = { exports: {} }, Gn = Ce.exports, Wt;
function Kn() {
  return Wt || (Wt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(Gn, function(e) {
      /** @preserve
       * Counter block mode compatible with  Dr Brian Gladman fileenc.c
       * derived from CryptoJS.mode.CTR
       * Jan Hruby jhruby.web@gmail.com
       */
      return e.mode.CTRGladman = (function() {
        var r = e.lib.BlockCipherMode.extend();
        function a(s) {
          if ((s >> 24 & 255) === 255) {
            var h = s >> 16 & 255, u = s >> 8 & 255, l = s & 255;
            h === 255 ? (h = 0, u === 255 ? (u = 0, l === 255 ? l = 0 : ++l) : ++u) : ++h, s = 0, s += h << 16, s += u << 8, s += l;
          } else
            s += 1 << 24;
          return s;
        }
        function o(s) {
          return (s[0] = a(s[0])) === 0 && (s[1] = a(s[1])), s;
        }
        var x = r.Encryptor = r.extend({
          processBlock: function(s, h) {
            var u = this._cipher, l = u.blockSize, y = this._iv, d = this._counter;
            y && (d = this._counter = y.slice(0), this._iv = void 0), o(d);
            var p = d.slice(0);
            u.encryptBlock(p, 0);
            for (var m = 0; m < l; m++)
              s[h + m] ^= p[m];
          }
        });
        return r.Decryptor = x, r;
      })(), e.mode.CTRGladman;
    });
  })(Ce)), Ce.exports;
}
var Fe = { exports: {} }, Vn = Fe.exports, Gt;
function Xn() {
  return Gt || (Gt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(Vn, function(e) {
      return e.mode.OFB = (function() {
        var r = e.lib.BlockCipherMode.extend(), a = r.Encryptor = r.extend({
          processBlock: function(o, x) {
            var s = this._cipher, h = s.blockSize, u = this._iv, l = this._keystream;
            u && (l = this._keystream = u.slice(0), this._iv = void 0), s.encryptBlock(l, 0);
            for (var y = 0; y < h; y++)
              o[x + y] ^= l[y];
          }
        });
        return r.Decryptor = a, r;
      })(), e.mode.OFB;
    });
  })(Fe)), Fe.exports;
}
var be = { exports: {} }, Zn = be.exports, Kt;
function Yn() {
  return Kt || (Kt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(Zn, function(e) {
      return e.mode.ECB = (function() {
        var r = e.lib.BlockCipherMode.extend();
        return r.Encryptor = r.extend({
          processBlock: function(a, o) {
            this._cipher.encryptBlock(a, o);
          }
        }), r.Decryptor = r.extend({
          processBlock: function(a, o) {
            this._cipher.decryptBlock(a, o);
          }
        }), r;
      })(), e.mode.ECB;
    });
  })(be)), be.exports;
}
var we = { exports: {} }, Qn = we.exports, Vt;
function Jn() {
  return Vt || (Vt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(Qn, function(e) {
      return e.pad.AnsiX923 = {
        pad: function(r, a) {
          var o = r.sigBytes, x = a * 4, s = x - o % x, h = o + s - 1;
          r.clamp(), r.words[h >>> 2] |= s << 24 - h % 4 * 8, r.sigBytes += s;
        },
        unpad: function(r) {
          var a = r.words[r.sigBytes - 1 >>> 2] & 255;
          r.sigBytes -= a;
        }
      }, e.pad.Ansix923;
    });
  })(we)), we.exports;
}
var De = { exports: {} }, ei = De.exports, Xt;
function ti() {
  return Xt || (Xt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(ei, function(e) {
      return e.pad.Iso10126 = {
        pad: function(r, a) {
          var o = a * 4, x = o - r.sigBytes % o;
          r.concat(e.lib.WordArray.random(x - 1)).concat(e.lib.WordArray.create([x << 24], 1));
        },
        unpad: function(r) {
          var a = r.words[r.sigBytes - 1 >>> 2] & 255;
          r.sigBytes -= a;
        }
      }, e.pad.Iso10126;
    });
  })(De)), De.exports;
}
var _e = { exports: {} }, ri = _e.exports, Zt;
function ni() {
  return Zt || (Zt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(ri, function(e) {
      return e.pad.Iso97971 = {
        pad: function(r, a) {
          r.concat(e.lib.WordArray.create([2147483648], 1)), e.pad.ZeroPadding.pad(r, a);
        },
        unpad: function(r) {
          e.pad.ZeroPadding.unpad(r), r.sigBytes--;
        }
      }, e.pad.Iso97971;
    });
  })(_e)), _e.exports;
}
var ke = { exports: {} }, ii = ke.exports, Yt;
function ai() {
  return Yt || (Yt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(ii, function(e) {
      return e.pad.ZeroPadding = {
        pad: function(r, a) {
          var o = a * 4;
          r.clamp(), r.sigBytes += o - (r.sigBytes % o || o);
        },
        unpad: function(r) {
          for (var a = r.words, o = r.sigBytes - 1, o = r.sigBytes - 1; o >= 0; o--)
            if (a[o >>> 2] >>> 24 - o % 4 * 8 & 255) {
              r.sigBytes = o + 1;
              break;
            }
        }
      }, e.pad.ZeroPadding;
    });
  })(ke)), ke.exports;
}
var Se = { exports: {} }, si = Se.exports, Qt;
function oi() {
  return Qt || (Qt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(si, function(e) {
      return e.pad.NoPadding = {
        pad: function() {
        },
        unpad: function() {
        }
      }, e.pad.NoPadding;
    });
  })(Se)), Se.exports;
}
var Te = { exports: {} }, ui = Te.exports, Jt;
function xi() {
  return Jt || (Jt = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), c0());
    })(ui, function(e) {
      return (function(r) {
        var a = e, o = a.lib, x = o.CipherParams, s = a.enc, h = s.Hex, u = a.format;
        u.Hex = {
          /**
           * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
           *
           * @param {CipherParams} cipherParams The cipher params object.
           *
           * @return {string} The hexadecimally encoded string.
           *
           * @static
           *
           * @example
           *
           *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
           */
          stringify: function(l) {
            return l.ciphertext.toString(h);
          },
          /**
           * Converts a hexadecimally encoded ciphertext string to a cipher params object.
           *
           * @param {string} input The hexadecimally encoded string.
           *
           * @return {CipherParams} The cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
           */
          parse: function(l) {
            var y = h.parse(l);
            return x.create({ ciphertext: y });
          }
        };
      })(), e.format.Hex;
    });
  })(Te)), Te.exports;
}
var Re = { exports: {} }, ci = Re.exports, er;
function fi() {
  return er || (er = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(ci, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.BlockCipher, x = r.algo, s = [], h = [], u = [], l = [], y = [], d = [], p = [], m = [], E = [], A = [];
        (function() {
          for (var B = [], F = 0; F < 256; F++)
            F < 128 ? B[F] = F << 1 : B[F] = F << 1 ^ 283;
          for (var b = 0, D = 0, F = 0; F < 256; F++) {
            var S = D ^ D << 1 ^ D << 2 ^ D << 3 ^ D << 4;
            S = S >>> 8 ^ S & 255 ^ 99, s[b] = S, h[S] = b;
            var R = B[b], P = B[R], _ = B[P], k = B[S] * 257 ^ S * 16843008;
            u[b] = k << 24 | k >>> 8, l[b] = k << 16 | k >>> 16, y[b] = k << 8 | k >>> 24, d[b] = k;
            var k = _ * 16843009 ^ P * 65537 ^ R * 257 ^ b * 16843008;
            p[S] = k << 24 | k >>> 8, m[S] = k << 16 | k >>> 16, E[S] = k << 8 | k >>> 24, A[S] = k, b ? (b = R ^ B[B[B[_ ^ R]]], D ^= B[B[D]]) : b = D = 1;
          }
        })();
        var C = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54], g = x.AES = o.extend({
          _doReset: function() {
            var B;
            if (!(this._nRounds && this._keyPriorReset === this._key)) {
              for (var F = this._keyPriorReset = this._key, b = F.words, D = F.sigBytes / 4, S = this._nRounds = D + 6, R = (S + 1) * 4, P = this._keySchedule = [], _ = 0; _ < R; _++)
                _ < D ? P[_] = b[_] : (B = P[_ - 1], _ % D ? D > 6 && _ % D == 4 && (B = s[B >>> 24] << 24 | s[B >>> 16 & 255] << 16 | s[B >>> 8 & 255] << 8 | s[B & 255]) : (B = B << 8 | B >>> 24, B = s[B >>> 24] << 24 | s[B >>> 16 & 255] << 16 | s[B >>> 8 & 255] << 8 | s[B & 255], B ^= C[_ / D | 0] << 24), P[_] = P[_ - D] ^ B);
              for (var k = this._invKeySchedule = [], q = 0; q < R; q++) {
                var _ = R - q;
                if (q % 4)
                  var B = P[_];
                else
                  var B = P[_ - 4];
                q < 4 || _ <= 4 ? k[q] = B : k[q] = p[s[B >>> 24]] ^ m[s[B >>> 16 & 255]] ^ E[s[B >>> 8 & 255]] ^ A[s[B & 255]];
              }
            }
          },
          encryptBlock: function(B, F) {
            this._doCryptBlock(B, F, this._keySchedule, u, l, y, d, s);
          },
          decryptBlock: function(B, F) {
            var b = B[F + 1];
            B[F + 1] = B[F + 3], B[F + 3] = b, this._doCryptBlock(B, F, this._invKeySchedule, p, m, E, A, h);
            var b = B[F + 1];
            B[F + 1] = B[F + 3], B[F + 3] = b;
          },
          _doCryptBlock: function(B, F, b, D, S, R, P, _) {
            for (var k = this._nRounds, q = B[F] ^ b[0], U = B[F + 1] ^ b[1], N = B[F + 2] ^ b[2], H = B[F + 3] ^ b[3], j = 4, J = 1; J < k; J++) {
              var V = D[q >>> 24] ^ S[U >>> 16 & 255] ^ R[N >>> 8 & 255] ^ P[H & 255] ^ b[j++], Q = D[U >>> 24] ^ S[N >>> 16 & 255] ^ R[H >>> 8 & 255] ^ P[q & 255] ^ b[j++], X = D[N >>> 24] ^ S[H >>> 16 & 255] ^ R[q >>> 8 & 255] ^ P[U & 255] ^ b[j++], I = D[H >>> 24] ^ S[q >>> 16 & 255] ^ R[U >>> 8 & 255] ^ P[N & 255] ^ b[j++];
              q = V, U = Q, N = X, H = I;
            }
            var V = (_[q >>> 24] << 24 | _[U >>> 16 & 255] << 16 | _[N >>> 8 & 255] << 8 | _[H & 255]) ^ b[j++], Q = (_[U >>> 24] << 24 | _[N >>> 16 & 255] << 16 | _[H >>> 8 & 255] << 8 | _[q & 255]) ^ b[j++], X = (_[N >>> 24] << 24 | _[H >>> 16 & 255] << 16 | _[q >>> 8 & 255] << 8 | _[U & 255]) ^ b[j++], I = (_[H >>> 24] << 24 | _[q >>> 16 & 255] << 16 | _[U >>> 8 & 255] << 8 | _[N & 255]) ^ b[j++];
            B[F] = V, B[F + 1] = Q, B[F + 2] = X, B[F + 3] = I;
          },
          keySize: 256 / 32
        });
        r.AES = o._createHelper(g);
      })(), e.AES;
    });
  })(Re)), Re.exports;
}
var Ie = { exports: {} }, li = Ie.exports, tr;
function hi() {
  return tr || (tr = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(li, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.WordArray, x = a.BlockCipher, s = r.algo, h = [
          57,
          49,
          41,
          33,
          25,
          17,
          9,
          1,
          58,
          50,
          42,
          34,
          26,
          18,
          10,
          2,
          59,
          51,
          43,
          35,
          27,
          19,
          11,
          3,
          60,
          52,
          44,
          36,
          63,
          55,
          47,
          39,
          31,
          23,
          15,
          7,
          62,
          54,
          46,
          38,
          30,
          22,
          14,
          6,
          61,
          53,
          45,
          37,
          29,
          21,
          13,
          5,
          28,
          20,
          12,
          4
        ], u = [
          14,
          17,
          11,
          24,
          1,
          5,
          3,
          28,
          15,
          6,
          21,
          10,
          23,
          19,
          12,
          4,
          26,
          8,
          16,
          7,
          27,
          20,
          13,
          2,
          41,
          52,
          31,
          37,
          47,
          55,
          30,
          40,
          51,
          45,
          33,
          48,
          44,
          49,
          39,
          56,
          34,
          53,
          46,
          42,
          50,
          36,
          29,
          32
        ], l = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28], y = [
          {
            0: 8421888,
            268435456: 32768,
            536870912: 8421378,
            805306368: 2,
            1073741824: 512,
            1342177280: 8421890,
            1610612736: 8389122,
            1879048192: 8388608,
            2147483648: 514,
            2415919104: 8389120,
            2684354560: 33280,
            2952790016: 8421376,
            3221225472: 32770,
            3489660928: 8388610,
            3758096384: 0,
            4026531840: 33282,
            134217728: 0,
            402653184: 8421890,
            671088640: 33282,
            939524096: 32768,
            1207959552: 8421888,
            1476395008: 512,
            1744830464: 8421378,
            2013265920: 2,
            2281701376: 8389120,
            2550136832: 33280,
            2818572288: 8421376,
            3087007744: 8389122,
            3355443200: 8388610,
            3623878656: 32770,
            3892314112: 514,
            4160749568: 8388608,
            1: 32768,
            268435457: 2,
            536870913: 8421888,
            805306369: 8388608,
            1073741825: 8421378,
            1342177281: 33280,
            1610612737: 512,
            1879048193: 8389122,
            2147483649: 8421890,
            2415919105: 8421376,
            2684354561: 8388610,
            2952790017: 33282,
            3221225473: 514,
            3489660929: 8389120,
            3758096385: 32770,
            4026531841: 0,
            134217729: 8421890,
            402653185: 8421376,
            671088641: 8388608,
            939524097: 512,
            1207959553: 32768,
            1476395009: 8388610,
            1744830465: 2,
            2013265921: 33282,
            2281701377: 32770,
            2550136833: 8389122,
            2818572289: 514,
            3087007745: 8421888,
            3355443201: 8389120,
            3623878657: 0,
            3892314113: 33280,
            4160749569: 8421378
          },
          {
            0: 1074282512,
            16777216: 16384,
            33554432: 524288,
            50331648: 1074266128,
            67108864: 1073741840,
            83886080: 1074282496,
            100663296: 1073758208,
            117440512: 16,
            134217728: 540672,
            150994944: 1073758224,
            167772160: 1073741824,
            184549376: 540688,
            201326592: 524304,
            218103808: 0,
            234881024: 16400,
            251658240: 1074266112,
            8388608: 1073758208,
            25165824: 540688,
            41943040: 16,
            58720256: 1073758224,
            75497472: 1074282512,
            92274688: 1073741824,
            109051904: 524288,
            125829120: 1074266128,
            142606336: 524304,
            159383552: 0,
            176160768: 16384,
            192937984: 1074266112,
            209715200: 1073741840,
            226492416: 540672,
            243269632: 1074282496,
            260046848: 16400,
            268435456: 0,
            285212672: 1074266128,
            301989888: 1073758224,
            318767104: 1074282496,
            335544320: 1074266112,
            352321536: 16,
            369098752: 540688,
            385875968: 16384,
            402653184: 16400,
            419430400: 524288,
            436207616: 524304,
            452984832: 1073741840,
            469762048: 540672,
            486539264: 1073758208,
            503316480: 1073741824,
            520093696: 1074282512,
            276824064: 540688,
            293601280: 524288,
            310378496: 1074266112,
            327155712: 16384,
            343932928: 1073758208,
            360710144: 1074282512,
            377487360: 16,
            394264576: 1073741824,
            411041792: 1074282496,
            427819008: 1073741840,
            444596224: 1073758224,
            461373440: 524304,
            478150656: 0,
            494927872: 16400,
            511705088: 1074266128,
            528482304: 540672
          },
          {
            0: 260,
            1048576: 0,
            2097152: 67109120,
            3145728: 65796,
            4194304: 65540,
            5242880: 67108868,
            6291456: 67174660,
            7340032: 67174400,
            8388608: 67108864,
            9437184: 67174656,
            10485760: 65792,
            11534336: 67174404,
            12582912: 67109124,
            13631488: 65536,
            14680064: 4,
            15728640: 256,
            524288: 67174656,
            1572864: 67174404,
            2621440: 0,
            3670016: 67109120,
            4718592: 67108868,
            5767168: 65536,
            6815744: 65540,
            7864320: 260,
            8912896: 4,
            9961472: 256,
            11010048: 67174400,
            12058624: 65796,
            13107200: 65792,
            14155776: 67109124,
            15204352: 67174660,
            16252928: 67108864,
            16777216: 67174656,
            17825792: 65540,
            18874368: 65536,
            19922944: 67109120,
            20971520: 256,
            22020096: 67174660,
            23068672: 67108868,
            24117248: 0,
            25165824: 67109124,
            26214400: 67108864,
            27262976: 4,
            28311552: 65792,
            29360128: 67174400,
            30408704: 260,
            31457280: 65796,
            32505856: 67174404,
            17301504: 67108864,
            18350080: 260,
            19398656: 67174656,
            20447232: 0,
            21495808: 65540,
            22544384: 67109120,
            23592960: 256,
            24641536: 67174404,
            25690112: 65536,
            26738688: 67174660,
            27787264: 65796,
            28835840: 67108868,
            29884416: 67109124,
            30932992: 67174400,
            31981568: 4,
            33030144: 65792
          },
          {
            0: 2151682048,
            65536: 2147487808,
            131072: 4198464,
            196608: 2151677952,
            262144: 0,
            327680: 4198400,
            393216: 2147483712,
            458752: 4194368,
            524288: 2147483648,
            589824: 4194304,
            655360: 64,
            720896: 2147487744,
            786432: 2151678016,
            851968: 4160,
            917504: 4096,
            983040: 2151682112,
            32768: 2147487808,
            98304: 64,
            163840: 2151678016,
            229376: 2147487744,
            294912: 4198400,
            360448: 2151682112,
            425984: 0,
            491520: 2151677952,
            557056: 4096,
            622592: 2151682048,
            688128: 4194304,
            753664: 4160,
            819200: 2147483648,
            884736: 4194368,
            950272: 4198464,
            1015808: 2147483712,
            1048576: 4194368,
            1114112: 4198400,
            1179648: 2147483712,
            1245184: 0,
            1310720: 4160,
            1376256: 2151678016,
            1441792: 2151682048,
            1507328: 2147487808,
            1572864: 2151682112,
            1638400: 2147483648,
            1703936: 2151677952,
            1769472: 4198464,
            1835008: 2147487744,
            1900544: 4194304,
            1966080: 64,
            2031616: 4096,
            1081344: 2151677952,
            1146880: 2151682112,
            1212416: 0,
            1277952: 4198400,
            1343488: 4194368,
            1409024: 2147483648,
            1474560: 2147487808,
            1540096: 64,
            1605632: 2147483712,
            1671168: 4096,
            1736704: 2147487744,
            1802240: 2151678016,
            1867776: 4160,
            1933312: 2151682048,
            1998848: 4194304,
            2064384: 4198464
          },
          {
            0: 128,
            4096: 17039360,
            8192: 262144,
            12288: 536870912,
            16384: 537133184,
            20480: 16777344,
            24576: 553648256,
            28672: 262272,
            32768: 16777216,
            36864: 537133056,
            40960: 536871040,
            45056: 553910400,
            49152: 553910272,
            53248: 0,
            57344: 17039488,
            61440: 553648128,
            2048: 17039488,
            6144: 553648256,
            10240: 128,
            14336: 17039360,
            18432: 262144,
            22528: 537133184,
            26624: 553910272,
            30720: 536870912,
            34816: 537133056,
            38912: 0,
            43008: 553910400,
            47104: 16777344,
            51200: 536871040,
            55296: 553648128,
            59392: 16777216,
            63488: 262272,
            65536: 262144,
            69632: 128,
            73728: 536870912,
            77824: 553648256,
            81920: 16777344,
            86016: 553910272,
            90112: 537133184,
            94208: 16777216,
            98304: 553910400,
            102400: 553648128,
            106496: 17039360,
            110592: 537133056,
            114688: 262272,
            118784: 536871040,
            122880: 0,
            126976: 17039488,
            67584: 553648256,
            71680: 16777216,
            75776: 17039360,
            79872: 537133184,
            83968: 536870912,
            88064: 17039488,
            92160: 128,
            96256: 553910272,
            100352: 262272,
            104448: 553910400,
            108544: 0,
            112640: 553648128,
            116736: 16777344,
            120832: 262144,
            124928: 537133056,
            129024: 536871040
          },
          {
            0: 268435464,
            256: 8192,
            512: 270532608,
            768: 270540808,
            1024: 268443648,
            1280: 2097152,
            1536: 2097160,
            1792: 268435456,
            2048: 0,
            2304: 268443656,
            2560: 2105344,
            2816: 8,
            3072: 270532616,
            3328: 2105352,
            3584: 8200,
            3840: 270540800,
            128: 270532608,
            384: 270540808,
            640: 8,
            896: 2097152,
            1152: 2105352,
            1408: 268435464,
            1664: 268443648,
            1920: 8200,
            2176: 2097160,
            2432: 8192,
            2688: 268443656,
            2944: 270532616,
            3200: 0,
            3456: 270540800,
            3712: 2105344,
            3968: 268435456,
            4096: 268443648,
            4352: 270532616,
            4608: 270540808,
            4864: 8200,
            5120: 2097152,
            5376: 268435456,
            5632: 268435464,
            5888: 2105344,
            6144: 2105352,
            6400: 0,
            6656: 8,
            6912: 270532608,
            7168: 8192,
            7424: 268443656,
            7680: 270540800,
            7936: 2097160,
            4224: 8,
            4480: 2105344,
            4736: 2097152,
            4992: 268435464,
            5248: 268443648,
            5504: 8200,
            5760: 270540808,
            6016: 270532608,
            6272: 270540800,
            6528: 270532616,
            6784: 8192,
            7040: 2105352,
            7296: 2097160,
            7552: 0,
            7808: 268435456,
            8064: 268443656
          },
          {
            0: 1048576,
            16: 33555457,
            32: 1024,
            48: 1049601,
            64: 34604033,
            80: 0,
            96: 1,
            112: 34603009,
            128: 33555456,
            144: 1048577,
            160: 33554433,
            176: 34604032,
            192: 34603008,
            208: 1025,
            224: 1049600,
            240: 33554432,
            8: 34603009,
            24: 0,
            40: 33555457,
            56: 34604032,
            72: 1048576,
            88: 33554433,
            104: 33554432,
            120: 1025,
            136: 1049601,
            152: 33555456,
            168: 34603008,
            184: 1048577,
            200: 1024,
            216: 34604033,
            232: 1,
            248: 1049600,
            256: 33554432,
            272: 1048576,
            288: 33555457,
            304: 34603009,
            320: 1048577,
            336: 33555456,
            352: 34604032,
            368: 1049601,
            384: 1025,
            400: 34604033,
            416: 1049600,
            432: 1,
            448: 0,
            464: 34603008,
            480: 33554433,
            496: 1024,
            264: 1049600,
            280: 33555457,
            296: 34603009,
            312: 1,
            328: 33554432,
            344: 1048576,
            360: 1025,
            376: 34604032,
            392: 33554433,
            408: 34603008,
            424: 0,
            440: 34604033,
            456: 1049601,
            472: 1024,
            488: 33555456,
            504: 1048577
          },
          {
            0: 134219808,
            1: 131072,
            2: 134217728,
            3: 32,
            4: 131104,
            5: 134350880,
            6: 134350848,
            7: 2048,
            8: 134348800,
            9: 134219776,
            10: 133120,
            11: 134348832,
            12: 2080,
            13: 0,
            14: 134217760,
            15: 133152,
            2147483648: 2048,
            2147483649: 134350880,
            2147483650: 134219808,
            2147483651: 134217728,
            2147483652: 134348800,
            2147483653: 133120,
            2147483654: 133152,
            2147483655: 32,
            2147483656: 134217760,
            2147483657: 2080,
            2147483658: 131104,
            2147483659: 134350848,
            2147483660: 0,
            2147483661: 134348832,
            2147483662: 134219776,
            2147483663: 131072,
            16: 133152,
            17: 134350848,
            18: 32,
            19: 2048,
            20: 134219776,
            21: 134217760,
            22: 134348832,
            23: 131072,
            24: 0,
            25: 131104,
            26: 134348800,
            27: 134219808,
            28: 134350880,
            29: 133120,
            30: 2080,
            31: 134217728,
            2147483664: 131072,
            2147483665: 2048,
            2147483666: 134348832,
            2147483667: 133152,
            2147483668: 32,
            2147483669: 134348800,
            2147483670: 134217728,
            2147483671: 134219808,
            2147483672: 134350880,
            2147483673: 134217760,
            2147483674: 134219776,
            2147483675: 0,
            2147483676: 133120,
            2147483677: 2080,
            2147483678: 131104,
            2147483679: 134350848
          }
        ], d = [
          4160749569,
          528482304,
          33030144,
          2064384,
          129024,
          8064,
          504,
          2147483679
        ], p = s.DES = x.extend({
          _doReset: function() {
            for (var C = this._key, g = C.words, B = [], F = 0; F < 56; F++) {
              var b = h[F] - 1;
              B[F] = g[b >>> 5] >>> 31 - b % 32 & 1;
            }
            for (var D = this._subKeys = [], S = 0; S < 16; S++) {
              for (var R = D[S] = [], P = l[S], F = 0; F < 24; F++)
                R[F / 6 | 0] |= B[(u[F] - 1 + P) % 28] << 31 - F % 6, R[4 + (F / 6 | 0)] |= B[28 + (u[F + 24] - 1 + P) % 28] << 31 - F % 6;
              R[0] = R[0] << 1 | R[0] >>> 31;
              for (var F = 1; F < 7; F++)
                R[F] = R[F] >>> (F - 1) * 4 + 3;
              R[7] = R[7] << 5 | R[7] >>> 27;
            }
            for (var _ = this._invSubKeys = [], F = 0; F < 16; F++)
              _[F] = D[15 - F];
          },
          encryptBlock: function(C, g) {
            this._doCryptBlock(C, g, this._subKeys);
          },
          decryptBlock: function(C, g) {
            this._doCryptBlock(C, g, this._invSubKeys);
          },
          _doCryptBlock: function(C, g, B) {
            this._lBlock = C[g], this._rBlock = C[g + 1], m.call(this, 4, 252645135), m.call(this, 16, 65535), E.call(this, 2, 858993459), E.call(this, 8, 16711935), m.call(this, 1, 1431655765);
            for (var F = 0; F < 16; F++) {
              for (var b = B[F], D = this._lBlock, S = this._rBlock, R = 0, P = 0; P < 8; P++)
                R |= y[P][((S ^ b[P]) & d[P]) >>> 0];
              this._lBlock = S, this._rBlock = D ^ R;
            }
            var _ = this._lBlock;
            this._lBlock = this._rBlock, this._rBlock = _, m.call(this, 1, 1431655765), E.call(this, 8, 16711935), E.call(this, 2, 858993459), m.call(this, 16, 65535), m.call(this, 4, 252645135), C[g] = this._lBlock, C[g + 1] = this._rBlock;
          },
          keySize: 64 / 32,
          ivSize: 64 / 32,
          blockSize: 64 / 32
        });
        function m(C, g) {
          var B = (this._lBlock >>> C ^ this._rBlock) & g;
          this._rBlock ^= B, this._lBlock ^= B << C;
        }
        function E(C, g) {
          var B = (this._rBlock >>> C ^ this._lBlock) & g;
          this._lBlock ^= B, this._rBlock ^= B << C;
        }
        r.DES = x._createHelper(p);
        var A = s.TripleDES = x.extend({
          _doReset: function() {
            var C = this._key, g = C.words;
            if (g.length !== 2 && g.length !== 4 && g.length < 6)
              throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
            var B = g.slice(0, 2), F = g.length < 4 ? g.slice(0, 2) : g.slice(2, 4), b = g.length < 6 ? g.slice(0, 2) : g.slice(4, 6);
            this._des1 = p.createEncryptor(o.create(B)), this._des2 = p.createEncryptor(o.create(F)), this._des3 = p.createEncryptor(o.create(b));
          },
          encryptBlock: function(C, g) {
            this._des1.encryptBlock(C, g), this._des2.decryptBlock(C, g), this._des3.encryptBlock(C, g);
          },
          decryptBlock: function(C, g) {
            this._des3.decryptBlock(C, g), this._des2.encryptBlock(C, g), this._des1.decryptBlock(C, g);
          },
          keySize: 192 / 32,
          ivSize: 64 / 32,
          blockSize: 64 / 32
        });
        r.TripleDES = x._createHelper(A);
      })(), e.TripleDES;
    });
  })(Ie)), Ie.exports;
}
var $e = { exports: {} }, di = $e.exports, rr;
function pi() {
  return rr || (rr = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(di, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.StreamCipher, x = r.algo, s = x.RC4 = o.extend({
          _doReset: function() {
            for (var l = this._key, y = l.words, d = l.sigBytes, p = this._S = [], m = 0; m < 256; m++)
              p[m] = m;
            for (var m = 0, E = 0; m < 256; m++) {
              var A = m % d, C = y[A >>> 2] >>> 24 - A % 4 * 8 & 255;
              E = (E + p[m] + C) % 256;
              var g = p[m];
              p[m] = p[E], p[E] = g;
            }
            this._i = this._j = 0;
          },
          _doProcessBlock: function(l, y) {
            l[y] ^= h.call(this);
          },
          keySize: 256 / 32,
          ivSize: 0
        });
        function h() {
          for (var l = this._S, y = this._i, d = this._j, p = 0, m = 0; m < 4; m++) {
            y = (y + 1) % 256, d = (d + l[y]) % 256;
            var E = l[y];
            l[y] = l[d], l[d] = E, p |= l[(l[y] + l[d]) % 256] << 24 - m * 8;
          }
          return this._i = y, this._j = d, p;
        }
        r.RC4 = o._createHelper(s);
        var u = x.RC4Drop = s.extend({
          /**
           * Configuration options.
           *
           * @property {number} drop The number of keystream words to drop. Default 192
           */
          cfg: s.cfg.extend({
            drop: 192
          }),
          _doReset: function() {
            s._doReset.call(this);
            for (var l = this.cfg.drop; l > 0; l--)
              h.call(this);
          }
        });
        r.RC4Drop = o._createHelper(u);
      })(), e.RC4;
    });
  })($e)), $e.exports;
}
var Oe = { exports: {} }, gi = Oe.exports, nr;
function mi() {
  return nr || (nr = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(gi, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.StreamCipher, x = r.algo, s = [], h = [], u = [], l = x.Rabbit = o.extend({
          _doReset: function() {
            for (var d = this._key.words, p = this.cfg.iv, m = 0; m < 4; m++)
              d[m] = (d[m] << 8 | d[m] >>> 24) & 16711935 | (d[m] << 24 | d[m] >>> 8) & 4278255360;
            var E = this._X = [
              d[0],
              d[3] << 16 | d[2] >>> 16,
              d[1],
              d[0] << 16 | d[3] >>> 16,
              d[2],
              d[1] << 16 | d[0] >>> 16,
              d[3],
              d[2] << 16 | d[1] >>> 16
            ], A = this._C = [
              d[2] << 16 | d[2] >>> 16,
              d[0] & 4294901760 | d[1] & 65535,
              d[3] << 16 | d[3] >>> 16,
              d[1] & 4294901760 | d[2] & 65535,
              d[0] << 16 | d[0] >>> 16,
              d[2] & 4294901760 | d[3] & 65535,
              d[1] << 16 | d[1] >>> 16,
              d[3] & 4294901760 | d[0] & 65535
            ];
            this._b = 0;
            for (var m = 0; m < 4; m++)
              y.call(this);
            for (var m = 0; m < 8; m++)
              A[m] ^= E[m + 4 & 7];
            if (p) {
              var C = p.words, g = C[0], B = C[1], F = (g << 8 | g >>> 24) & 16711935 | (g << 24 | g >>> 8) & 4278255360, b = (B << 8 | B >>> 24) & 16711935 | (B << 24 | B >>> 8) & 4278255360, D = F >>> 16 | b & 4294901760, S = b << 16 | F & 65535;
              A[0] ^= F, A[1] ^= D, A[2] ^= b, A[3] ^= S, A[4] ^= F, A[5] ^= D, A[6] ^= b, A[7] ^= S;
              for (var m = 0; m < 4; m++)
                y.call(this);
            }
          },
          _doProcessBlock: function(d, p) {
            var m = this._X;
            y.call(this), s[0] = m[0] ^ m[5] >>> 16 ^ m[3] << 16, s[1] = m[2] ^ m[7] >>> 16 ^ m[5] << 16, s[2] = m[4] ^ m[1] >>> 16 ^ m[7] << 16, s[3] = m[6] ^ m[3] >>> 16 ^ m[1] << 16;
            for (var E = 0; E < 4; E++)
              s[E] = (s[E] << 8 | s[E] >>> 24) & 16711935 | (s[E] << 24 | s[E] >>> 8) & 4278255360, d[p + E] ^= s[E];
          },
          blockSize: 128 / 32,
          ivSize: 64 / 32
        });
        function y() {
          for (var d = this._X, p = this._C, m = 0; m < 8; m++)
            h[m] = p[m];
          p[0] = p[0] + 1295307597 + this._b | 0, p[1] = p[1] + 3545052371 + (p[0] >>> 0 < h[0] >>> 0 ? 1 : 0) | 0, p[2] = p[2] + 886263092 + (p[1] >>> 0 < h[1] >>> 0 ? 1 : 0) | 0, p[3] = p[3] + 1295307597 + (p[2] >>> 0 < h[2] >>> 0 ? 1 : 0) | 0, p[4] = p[4] + 3545052371 + (p[3] >>> 0 < h[3] >>> 0 ? 1 : 0) | 0, p[5] = p[5] + 886263092 + (p[4] >>> 0 < h[4] >>> 0 ? 1 : 0) | 0, p[6] = p[6] + 1295307597 + (p[5] >>> 0 < h[5] >>> 0 ? 1 : 0) | 0, p[7] = p[7] + 3545052371 + (p[6] >>> 0 < h[6] >>> 0 ? 1 : 0) | 0, this._b = p[7] >>> 0 < h[7] >>> 0 ? 1 : 0;
          for (var m = 0; m < 8; m++) {
            var E = d[m] + p[m], A = E & 65535, C = E >>> 16, g = ((A * A >>> 17) + A * C >>> 15) + C * C, B = ((E & 4294901760) * E | 0) + ((E & 65535) * E | 0);
            u[m] = g ^ B;
          }
          d[0] = u[0] + (u[7] << 16 | u[7] >>> 16) + (u[6] << 16 | u[6] >>> 16) | 0, d[1] = u[1] + (u[0] << 8 | u[0] >>> 24) + u[7] | 0, d[2] = u[2] + (u[1] << 16 | u[1] >>> 16) + (u[0] << 16 | u[0] >>> 16) | 0, d[3] = u[3] + (u[2] << 8 | u[2] >>> 24) + u[1] | 0, d[4] = u[4] + (u[3] << 16 | u[3] >>> 16) + (u[2] << 16 | u[2] >>> 16) | 0, d[5] = u[5] + (u[4] << 8 | u[4] >>> 24) + u[3] | 0, d[6] = u[6] + (u[5] << 16 | u[5] >>> 16) + (u[4] << 16 | u[4] >>> 16) | 0, d[7] = u[7] + (u[6] << 8 | u[6] >>> 24) + u[5] | 0;
        }
        r.Rabbit = o._createHelper(l);
      })(), e.Rabbit;
    });
  })(Oe)), Oe.exports;
}
var Pe = { exports: {} }, vi = Pe.exports, ir;
function Bi() {
  return ir || (ir = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(vi, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.StreamCipher, x = r.algo, s = [], h = [], u = [], l = x.RabbitLegacy = o.extend({
          _doReset: function() {
            var d = this._key.words, p = this.cfg.iv, m = this._X = [
              d[0],
              d[3] << 16 | d[2] >>> 16,
              d[1],
              d[0] << 16 | d[3] >>> 16,
              d[2],
              d[1] << 16 | d[0] >>> 16,
              d[3],
              d[2] << 16 | d[1] >>> 16
            ], E = this._C = [
              d[2] << 16 | d[2] >>> 16,
              d[0] & 4294901760 | d[1] & 65535,
              d[3] << 16 | d[3] >>> 16,
              d[1] & 4294901760 | d[2] & 65535,
              d[0] << 16 | d[0] >>> 16,
              d[2] & 4294901760 | d[3] & 65535,
              d[1] << 16 | d[1] >>> 16,
              d[3] & 4294901760 | d[0] & 65535
            ];
            this._b = 0;
            for (var A = 0; A < 4; A++)
              y.call(this);
            for (var A = 0; A < 8; A++)
              E[A] ^= m[A + 4 & 7];
            if (p) {
              var C = p.words, g = C[0], B = C[1], F = (g << 8 | g >>> 24) & 16711935 | (g << 24 | g >>> 8) & 4278255360, b = (B << 8 | B >>> 24) & 16711935 | (B << 24 | B >>> 8) & 4278255360, D = F >>> 16 | b & 4294901760, S = b << 16 | F & 65535;
              E[0] ^= F, E[1] ^= D, E[2] ^= b, E[3] ^= S, E[4] ^= F, E[5] ^= D, E[6] ^= b, E[7] ^= S;
              for (var A = 0; A < 4; A++)
                y.call(this);
            }
          },
          _doProcessBlock: function(d, p) {
            var m = this._X;
            y.call(this), s[0] = m[0] ^ m[5] >>> 16 ^ m[3] << 16, s[1] = m[2] ^ m[7] >>> 16 ^ m[5] << 16, s[2] = m[4] ^ m[1] >>> 16 ^ m[7] << 16, s[3] = m[6] ^ m[3] >>> 16 ^ m[1] << 16;
            for (var E = 0; E < 4; E++)
              s[E] = (s[E] << 8 | s[E] >>> 24) & 16711935 | (s[E] << 24 | s[E] >>> 8) & 4278255360, d[p + E] ^= s[E];
          },
          blockSize: 128 / 32,
          ivSize: 64 / 32
        });
        function y() {
          for (var d = this._X, p = this._C, m = 0; m < 8; m++)
            h[m] = p[m];
          p[0] = p[0] + 1295307597 + this._b | 0, p[1] = p[1] + 3545052371 + (p[0] >>> 0 < h[0] >>> 0 ? 1 : 0) | 0, p[2] = p[2] + 886263092 + (p[1] >>> 0 < h[1] >>> 0 ? 1 : 0) | 0, p[3] = p[3] + 1295307597 + (p[2] >>> 0 < h[2] >>> 0 ? 1 : 0) | 0, p[4] = p[4] + 3545052371 + (p[3] >>> 0 < h[3] >>> 0 ? 1 : 0) | 0, p[5] = p[5] + 886263092 + (p[4] >>> 0 < h[4] >>> 0 ? 1 : 0) | 0, p[6] = p[6] + 1295307597 + (p[5] >>> 0 < h[5] >>> 0 ? 1 : 0) | 0, p[7] = p[7] + 3545052371 + (p[6] >>> 0 < h[6] >>> 0 ? 1 : 0) | 0, this._b = p[7] >>> 0 < h[7] >>> 0 ? 1 : 0;
          for (var m = 0; m < 8; m++) {
            var E = d[m] + p[m], A = E & 65535, C = E >>> 16, g = ((A * A >>> 17) + A * C >>> 15) + C * C, B = ((E & 4294901760) * E | 0) + ((E & 65535) * E | 0);
            u[m] = g ^ B;
          }
          d[0] = u[0] + (u[7] << 16 | u[7] >>> 16) + (u[6] << 16 | u[6] >>> 16) | 0, d[1] = u[1] + (u[0] << 8 | u[0] >>> 24) + u[7] | 0, d[2] = u[2] + (u[1] << 16 | u[1] >>> 16) + (u[0] << 16 | u[0] >>> 16) | 0, d[3] = u[3] + (u[2] << 8 | u[2] >>> 24) + u[1] | 0, d[4] = u[4] + (u[3] << 16 | u[3] >>> 16) + (u[2] << 16 | u[2] >>> 16) | 0, d[5] = u[5] + (u[4] << 8 | u[4] >>> 24) + u[3] | 0, d[6] = u[6] + (u[5] << 16 | u[5] >>> 16) + (u[4] << 16 | u[4] >>> 16) | 0, d[7] = u[7] + (u[6] << 8 | u[6] >>> 24) + u[5] | 0;
        }
        r.RabbitLegacy = o._createHelper(l);
      })(), e.RabbitLegacy;
    });
  })(Pe)), Pe.exports;
}
var qe = { exports: {} }, Ei = qe.exports, ar;
function yi() {
  return ar || (ar = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), P0(), q0(), T0(), c0());
    })(Ei, function(e) {
      return (function() {
        var r = e, a = r.lib, o = a.BlockCipher, x = r.algo;
        const s = 16, h = [
          608135816,
          2242054355,
          320440878,
          57701188,
          2752067618,
          698298832,
          137296536,
          3964562569,
          1160258022,
          953160567,
          3193202383,
          887688300,
          3232508343,
          3380367581,
          1065670069,
          3041331479,
          2450970073,
          2306472731
        ], u = [
          [
            3509652390,
            2564797868,
            805139163,
            3491422135,
            3101798381,
            1780907670,
            3128725573,
            4046225305,
            614570311,
            3012652279,
            134345442,
            2240740374,
            1667834072,
            1901547113,
            2757295779,
            4103290238,
            227898511,
            1921955416,
            1904987480,
            2182433518,
            2069144605,
            3260701109,
            2620446009,
            720527379,
            3318853667,
            677414384,
            3393288472,
            3101374703,
            2390351024,
            1614419982,
            1822297739,
            2954791486,
            3608508353,
            3174124327,
            2024746970,
            1432378464,
            3864339955,
            2857741204,
            1464375394,
            1676153920,
            1439316330,
            715854006,
            3033291828,
            289532110,
            2706671279,
            2087905683,
            3018724369,
            1668267050,
            732546397,
            1947742710,
            3462151702,
            2609353502,
            2950085171,
            1814351708,
            2050118529,
            680887927,
            999245976,
            1800124847,
            3300911131,
            1713906067,
            1641548236,
            4213287313,
            1216130144,
            1575780402,
            4018429277,
            3917837745,
            3693486850,
            3949271944,
            596196993,
            3549867205,
            258830323,
            2213823033,
            772490370,
            2760122372,
            1774776394,
            2652871518,
            566650946,
            4142492826,
            1728879713,
            2882767088,
            1783734482,
            3629395816,
            2517608232,
            2874225571,
            1861159788,
            326777828,
            3124490320,
            2130389656,
            2716951837,
            967770486,
            1724537150,
            2185432712,
            2364442137,
            1164943284,
            2105845187,
            998989502,
            3765401048,
            2244026483,
            1075463327,
            1455516326,
            1322494562,
            910128902,
            469688178,
            1117454909,
            936433444,
            3490320968,
            3675253459,
            1240580251,
            122909385,
            2157517691,
            634681816,
            4142456567,
            3825094682,
            3061402683,
            2540495037,
            79693498,
            3249098678,
            1084186820,
            1583128258,
            426386531,
            1761308591,
            1047286709,
            322548459,
            995290223,
            1845252383,
            2603652396,
            3431023940,
            2942221577,
            3202600964,
            3727903485,
            1712269319,
            422464435,
            3234572375,
            1170764815,
            3523960633,
            3117677531,
            1434042557,
            442511882,
            3600875718,
            1076654713,
            1738483198,
            4213154764,
            2393238008,
            3677496056,
            1014306527,
            4251020053,
            793779912,
            2902807211,
            842905082,
            4246964064,
            1395751752,
            1040244610,
            2656851899,
            3396308128,
            445077038,
            3742853595,
            3577915638,
            679411651,
            2892444358,
            2354009459,
            1767581616,
            3150600392,
            3791627101,
            3102740896,
            284835224,
            4246832056,
            1258075500,
            768725851,
            2589189241,
            3069724005,
            3532540348,
            1274779536,
            3789419226,
            2764799539,
            1660621633,
            3471099624,
            4011903706,
            913787905,
            3497959166,
            737222580,
            2514213453,
            2928710040,
            3937242737,
            1804850592,
            3499020752,
            2949064160,
            2386320175,
            2390070455,
            2415321851,
            4061277028,
            2290661394,
            2416832540,
            1336762016,
            1754252060,
            3520065937,
            3014181293,
            791618072,
            3188594551,
            3933548030,
            2332172193,
            3852520463,
            3043980520,
            413987798,
            3465142937,
            3030929376,
            4245938359,
            2093235073,
            3534596313,
            375366246,
            2157278981,
            2479649556,
            555357303,
            3870105701,
            2008414854,
            3344188149,
            4221384143,
            3956125452,
            2067696032,
            3594591187,
            2921233993,
            2428461,
            544322398,
            577241275,
            1471733935,
            610547355,
            4027169054,
            1432588573,
            1507829418,
            2025931657,
            3646575487,
            545086370,
            48609733,
            2200306550,
            1653985193,
            298326376,
            1316178497,
            3007786442,
            2064951626,
            458293330,
            2589141269,
            3591329599,
            3164325604,
            727753846,
            2179363840,
            146436021,
            1461446943,
            4069977195,
            705550613,
            3059967265,
            3887724982,
            4281599278,
            3313849956,
            1404054877,
            2845806497,
            146425753,
            1854211946
          ],
          [
            1266315497,
            3048417604,
            3681880366,
            3289982499,
            290971e4,
            1235738493,
            2632868024,
            2414719590,
            3970600049,
            1771706367,
            1449415276,
            3266420449,
            422970021,
            1963543593,
            2690192192,
            3826793022,
            1062508698,
            1531092325,
            1804592342,
            2583117782,
            2714934279,
            4024971509,
            1294809318,
            4028980673,
            1289560198,
            2221992742,
            1669523910,
            35572830,
            157838143,
            1052438473,
            1016535060,
            1802137761,
            1753167236,
            1386275462,
            3080475397,
            2857371447,
            1040679964,
            2145300060,
            2390574316,
            1461121720,
            2956646967,
            4031777805,
            4028374788,
            33600511,
            2920084762,
            1018524850,
            629373528,
            3691585981,
            3515945977,
            2091462646,
            2486323059,
            586499841,
            988145025,
            935516892,
            3367335476,
            2599673255,
            2839830854,
            265290510,
            3972581182,
            2759138881,
            3795373465,
            1005194799,
            847297441,
            406762289,
            1314163512,
            1332590856,
            1866599683,
            4127851711,
            750260880,
            613907577,
            1450815602,
            3165620655,
            3734664991,
            3650291728,
            3012275730,
            3704569646,
            1427272223,
            778793252,
            1343938022,
            2676280711,
            2052605720,
            1946737175,
            3164576444,
            3914038668,
            3967478842,
            3682934266,
            1661551462,
            3294938066,
            4011595847,
            840292616,
            3712170807,
            616741398,
            312560963,
            711312465,
            1351876610,
            322626781,
            1910503582,
            271666773,
            2175563734,
            1594956187,
            70604529,
            3617834859,
            1007753275,
            1495573769,
            4069517037,
            2549218298,
            2663038764,
            504708206,
            2263041392,
            3941167025,
            2249088522,
            1514023603,
            1998579484,
            1312622330,
            694541497,
            2582060303,
            2151582166,
            1382467621,
            776784248,
            2618340202,
            3323268794,
            2497899128,
            2784771155,
            503983604,
            4076293799,
            907881277,
            423175695,
            432175456,
            1378068232,
            4145222326,
            3954048622,
            3938656102,
            3820766613,
            2793130115,
            2977904593,
            26017576,
            3274890735,
            3194772133,
            1700274565,
            1756076034,
            4006520079,
            3677328699,
            720338349,
            1533947780,
            354530856,
            688349552,
            3973924725,
            1637815568,
            332179504,
            3949051286,
            53804574,
            2852348879,
            3044236432,
            1282449977,
            3583942155,
            3416972820,
            4006381244,
            1617046695,
            2628476075,
            3002303598,
            1686838959,
            431878346,
            2686675385,
            1700445008,
            1080580658,
            1009431731,
            832498133,
            3223435511,
            2605976345,
            2271191193,
            2516031870,
            1648197032,
            4164389018,
            2548247927,
            300782431,
            375919233,
            238389289,
            3353747414,
            2531188641,
            2019080857,
            1475708069,
            455242339,
            2609103871,
            448939670,
            3451063019,
            1395535956,
            2413381860,
            1841049896,
            1491858159,
            885456874,
            4264095073,
            4001119347,
            1565136089,
            3898914787,
            1108368660,
            540939232,
            1173283510,
            2745871338,
            3681308437,
            4207628240,
            3343053890,
            4016749493,
            1699691293,
            1103962373,
            3625875870,
            2256883143,
            3830138730,
            1031889488,
            3479347698,
            1535977030,
            4236805024,
            3251091107,
            2132092099,
            1774941330,
            1199868427,
            1452454533,
            157007616,
            2904115357,
            342012276,
            595725824,
            1480756522,
            206960106,
            497939518,
            591360097,
            863170706,
            2375253569,
            3596610801,
            1814182875,
            2094937945,
            3421402208,
            1082520231,
            3463918190,
            2785509508,
            435703966,
            3908032597,
            1641649973,
            2842273706,
            3305899714,
            1510255612,
            2148256476,
            2655287854,
            3276092548,
            4258621189,
            236887753,
            3681803219,
            274041037,
            1734335097,
            3815195456,
            3317970021,
            1899903192,
            1026095262,
            4050517792,
            356393447,
            2410691914,
            3873677099,
            3682840055
          ],
          [
            3913112168,
            2491498743,
            4132185628,
            2489919796,
            1091903735,
            1979897079,
            3170134830,
            3567386728,
            3557303409,
            857797738,
            1136121015,
            1342202287,
            507115054,
            2535736646,
            337727348,
            3213592640,
            1301675037,
            2528481711,
            1895095763,
            1721773893,
            3216771564,
            62756741,
            2142006736,
            835421444,
            2531993523,
            1442658625,
            3659876326,
            2882144922,
            676362277,
            1392781812,
            170690266,
            3921047035,
            1759253602,
            3611846912,
            1745797284,
            664899054,
            1329594018,
            3901205900,
            3045908486,
            2062866102,
            2865634940,
            3543621612,
            3464012697,
            1080764994,
            553557557,
            3656615353,
            3996768171,
            991055499,
            499776247,
            1265440854,
            648242737,
            3940784050,
            980351604,
            3713745714,
            1749149687,
            3396870395,
            4211799374,
            3640570775,
            1161844396,
            3125318951,
            1431517754,
            545492359,
            4268468663,
            3499529547,
            1437099964,
            2702547544,
            3433638243,
            2581715763,
            2787789398,
            1060185593,
            1593081372,
            2418618748,
            4260947970,
            69676912,
            2159744348,
            86519011,
            2512459080,
            3838209314,
            1220612927,
            3339683548,
            133810670,
            1090789135,
            1078426020,
            1569222167,
            845107691,
            3583754449,
            4072456591,
            1091646820,
            628848692,
            1613405280,
            3757631651,
            526609435,
            236106946,
            48312990,
            2942717905,
            3402727701,
            1797494240,
            859738849,
            992217954,
            4005476642,
            2243076622,
            3870952857,
            3732016268,
            765654824,
            3490871365,
            2511836413,
            1685915746,
            3888969200,
            1414112111,
            2273134842,
            3281911079,
            4080962846,
            172450625,
            2569994100,
            980381355,
            4109958455,
            2819808352,
            2716589560,
            2568741196,
            3681446669,
            3329971472,
            1835478071,
            660984891,
            3704678404,
            4045999559,
            3422617507,
            3040415634,
            1762651403,
            1719377915,
            3470491036,
            2693910283,
            3642056355,
            3138596744,
            1364962596,
            2073328063,
            1983633131,
            926494387,
            3423689081,
            2150032023,
            4096667949,
            1749200295,
            3328846651,
            309677260,
            2016342300,
            1779581495,
            3079819751,
            111262694,
            1274766160,
            443224088,
            298511866,
            1025883608,
            3806446537,
            1145181785,
            168956806,
            3641502830,
            3584813610,
            1689216846,
            3666258015,
            3200248200,
            1692713982,
            2646376535,
            4042768518,
            1618508792,
            1610833997,
            3523052358,
            4130873264,
            2001055236,
            3610705100,
            2202168115,
            4028541809,
            2961195399,
            1006657119,
            2006996926,
            3186142756,
            1430667929,
            3210227297,
            1314452623,
            4074634658,
            4101304120,
            2273951170,
            1399257539,
            3367210612,
            3027628629,
            1190975929,
            2062231137,
            2333990788,
            2221543033,
            2438960610,
            1181637006,
            548689776,
            2362791313,
            3372408396,
            3104550113,
            3145860560,
            296247880,
            1970579870,
            3078560182,
            3769228297,
            1714227617,
            3291629107,
            3898220290,
            166772364,
            1251581989,
            493813264,
            448347421,
            195405023,
            2709975567,
            677966185,
            3703036547,
            1463355134,
            2715995803,
            1338867538,
            1343315457,
            2802222074,
            2684532164,
            233230375,
            2599980071,
            2000651841,
            3277868038,
            1638401717,
            4028070440,
            3237316320,
            6314154,
            819756386,
            300326615,
            590932579,
            1405279636,
            3267499572,
            3150704214,
            2428286686,
            3959192993,
            3461946742,
            1862657033,
            1266418056,
            963775037,
            2089974820,
            2263052895,
            1917689273,
            448879540,
            3550394620,
            3981727096,
            150775221,
            3627908307,
            1303187396,
            508620638,
            2975983352,
            2726630617,
            1817252668,
            1876281319,
            1457606340,
            908771278,
            3720792119,
            3617206836,
            2455994898,
            1729034894,
            1080033504
          ],
          [
            976866871,
            3556439503,
            2881648439,
            1522871579,
            1555064734,
            1336096578,
            3548522304,
            2579274686,
            3574697629,
            3205460757,
            3593280638,
            3338716283,
            3079412587,
            564236357,
            2993598910,
            1781952180,
            1464380207,
            3163844217,
            3332601554,
            1699332808,
            1393555694,
            1183702653,
            3581086237,
            1288719814,
            691649499,
            2847557200,
            2895455976,
            3193889540,
            2717570544,
            1781354906,
            1676643554,
            2592534050,
            3230253752,
            1126444790,
            2770207658,
            2633158820,
            2210423226,
            2615765581,
            2414155088,
            3127139286,
            673620729,
            2805611233,
            1269405062,
            4015350505,
            3341807571,
            4149409754,
            1057255273,
            2012875353,
            2162469141,
            2276492801,
            2601117357,
            993977747,
            3918593370,
            2654263191,
            753973209,
            36408145,
            2530585658,
            25011837,
            3520020182,
            2088578344,
            530523599,
            2918365339,
            1524020338,
            1518925132,
            3760827505,
            3759777254,
            1202760957,
            3985898139,
            3906192525,
            674977740,
            4174734889,
            2031300136,
            2019492241,
            3983892565,
            4153806404,
            3822280332,
            352677332,
            2297720250,
            60907813,
            90501309,
            3286998549,
            1016092578,
            2535922412,
            2839152426,
            457141659,
            509813237,
            4120667899,
            652014361,
            1966332200,
            2975202805,
            55981186,
            2327461051,
            676427537,
            3255491064,
            2882294119,
            3433927263,
            1307055953,
            942726286,
            933058658,
            2468411793,
            3933900994,
            4215176142,
            1361170020,
            2001714738,
            2830558078,
            3274259782,
            1222529897,
            1679025792,
            2729314320,
            3714953764,
            1770335741,
            151462246,
            3013232138,
            1682292957,
            1483529935,
            471910574,
            1539241949,
            458788160,
            3436315007,
            1807016891,
            3718408830,
            978976581,
            1043663428,
            3165965781,
            1927990952,
            4200891579,
            2372276910,
            3208408903,
            3533431907,
            1412390302,
            2931980059,
            4132332400,
            1947078029,
            3881505623,
            4168226417,
            2941484381,
            1077988104,
            1320477388,
            886195818,
            18198404,
            3786409e3,
            2509781533,
            112762804,
            3463356488,
            1866414978,
            891333506,
            18488651,
            661792760,
            1628790961,
            3885187036,
            3141171499,
            876946877,
            2693282273,
            1372485963,
            791857591,
            2686433993,
            3759982718,
            3167212022,
            3472953795,
            2716379847,
            445679433,
            3561995674,
            3504004811,
            3574258232,
            54117162,
            3331405415,
            2381918588,
            3769707343,
            4154350007,
            1140177722,
            4074052095,
            668550556,
            3214352940,
            367459370,
            261225585,
            2610173221,
            4209349473,
            3468074219,
            3265815641,
            314222801,
            3066103646,
            3808782860,
            282218597,
            3406013506,
            3773591054,
            379116347,
            1285071038,
            846784868,
            2669647154,
            3771962079,
            3550491691,
            2305946142,
            453669953,
            1268987020,
            3317592352,
            3279303384,
            3744833421,
            2610507566,
            3859509063,
            266596637,
            3847019092,
            517658769,
            3462560207,
            3443424879,
            370717030,
            4247526661,
            2224018117,
            4143653529,
            4112773975,
            2788324899,
            2477274417,
            1456262402,
            2901442914,
            1517677493,
            1846949527,
            2295493580,
            3734397586,
            2176403920,
            1280348187,
            1908823572,
            3871786941,
            846861322,
            1172426758,
            3287448474,
            3383383037,
            1655181056,
            3139813346,
            901632758,
            1897031941,
            2986607138,
            3066810236,
            3447102507,
            1393639104,
            373351379,
            950779232,
            625454576,
            3124240540,
            4148612726,
            2007998917,
            544563296,
            2244738638,
            2330496472,
            2058025392,
            1291430526,
            424198748,
            50039436,
            29584100,
            3605783033,
            2429876329,
            2791104160,
            1057563949,
            3255363231,
            3075367218,
            3463963227,
            1469046755,
            985887462
          ]
        ];
        var l = {
          pbox: [],
          sbox: []
        };
        function y(A, C) {
          let g = C >> 24 & 255, B = C >> 16 & 255, F = C >> 8 & 255, b = C & 255, D = A.sbox[0][g] + A.sbox[1][B];
          return D = D ^ A.sbox[2][F], D = D + A.sbox[3][b], D;
        }
        function d(A, C, g) {
          let B = C, F = g, b;
          for (let D = 0; D < s; ++D)
            B = B ^ A.pbox[D], F = y(A, B) ^ F, b = B, B = F, F = b;
          return b = B, B = F, F = b, F = F ^ A.pbox[s], B = B ^ A.pbox[s + 1], { left: B, right: F };
        }
        function p(A, C, g) {
          let B = C, F = g, b;
          for (let D = s + 1; D > 1; --D)
            B = B ^ A.pbox[D], F = y(A, B) ^ F, b = B, B = F, F = b;
          return b = B, B = F, F = b, F = F ^ A.pbox[1], B = B ^ A.pbox[0], { left: B, right: F };
        }
        function m(A, C, g) {
          for (let S = 0; S < 4; S++) {
            A.sbox[S] = [];
            for (let R = 0; R < 256; R++)
              A.sbox[S][R] = u[S][R];
          }
          let B = 0;
          for (let S = 0; S < s + 2; S++)
            A.pbox[S] = h[S] ^ C[B], B++, B >= g && (B = 0);
          let F = 0, b = 0, D = 0;
          for (let S = 0; S < s + 2; S += 2)
            D = d(A, F, b), F = D.left, b = D.right, A.pbox[S] = F, A.pbox[S + 1] = b;
          for (let S = 0; S < 4; S++)
            for (let R = 0; R < 256; R += 2)
              D = d(A, F, b), F = D.left, b = D.right, A.sbox[S][R] = F, A.sbox[S][R + 1] = b;
          return !0;
        }
        var E = x.Blowfish = o.extend({
          _doReset: function() {
            if (this._keyPriorReset !== this._key) {
              var A = this._keyPriorReset = this._key, C = A.words, g = A.sigBytes / 4;
              m(l, C, g);
            }
          },
          encryptBlock: function(A, C) {
            var g = d(l, A[C], A[C + 1]);
            A[C] = g.left, A[C + 1] = g.right;
          },
          decryptBlock: function(A, C) {
            var g = p(l, A[C], A[C + 1]);
            A[C] = g.left, A[C + 1] = g.right;
          },
          blockSize: 64 / 32,
          keySize: 128 / 32,
          ivSize: 64 / 32
        });
        r.Blowfish = o._createHelper(E);
      })(), e.Blowfish;
    });
  })(qe)), qe.exports;
}
var Ai = re.exports, sr;
function Ci() {
  return sr || (sr = 1, (function(c, t) {
    (function(e, r, a) {
      c.exports = r(G(), We(), Bn(), yn(), P0(), Fn(), q0(), vr(), st(), kn(), Br(), Rn(), $n(), Pn(), ot(), Ln(), T0(), c0(), Mn(), Wn(), Kn(), Xn(), Yn(), Jn(), ti(), ni(), ai(), oi(), xi(), fi(), hi(), pi(), mi(), Bi(), yi());
    })(Ai, function(e) {
      return e;
    });
  })(re)), re.exports;
}
var Fi = Ci();
const or = /* @__PURE__ */ at(Fi);
var Ze, ur;
function bi() {
  if (ur) return Ze;
  ur = 1;
  function c(C) {
    this._maxSize = C, this.clear();
  }
  c.prototype.clear = function() {
    this._size = 0, this._values = /* @__PURE__ */ Object.create(null);
  }, c.prototype.get = function(C) {
    return this._values[C];
  }, c.prototype.set = function(C, g) {
    return this._size >= this._maxSize && this.clear(), C in this._values || this._size++, this._values[C] = g;
  };
  var t = /[^.^\]^[]+|(?=\[\]|\.\.)/g, e = /^\d+$/, r = /^\d/, a = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g, o = /^\s*(['"]?)(.*?)(\1)\s*$/, x = 512, s = new c(x), h = new c(x), u = new c(x);
  Ze = {
    Cache: c,
    split: y,
    normalizePath: l,
    setter: function(C) {
      var g = l(C);
      return h.get(C) || h.set(C, function(F, b) {
        for (var D = 0, S = g.length, R = F; D < S - 1; ) {
          var P = g[D];
          if (P === "__proto__" || P === "constructor" || P === "prototype")
            return F;
          R = R[g[D++]];
        }
        R[g[D]] = b;
      });
    },
    getter: function(C, g) {
      var B = l(C);
      return u.get(C) || u.set(C, function(b) {
        for (var D = 0, S = B.length; D < S; )
          if (b != null || !g) b = b[B[D++]];
          else return;
        return b;
      });
    },
    join: function(C) {
      return C.reduce(function(g, B) {
        return g + (p(B) || e.test(B) ? "[" + B + "]" : (g ? "." : "") + B);
      }, "");
    },
    forEach: function(C, g, B) {
      d(Array.isArray(C) ? C : y(C), g, B);
    }
  };
  function l(C) {
    return s.get(C) || s.set(
      C,
      y(C).map(function(g) {
        return g.replace(o, "$2");
      })
    );
  }
  function y(C) {
    return C.match(t) || [""];
  }
  function d(C, g, B) {
    var F = C.length, b, D, S, R;
    for (D = 0; D < F; D++)
      b = C[D], b && (A(b) && (b = '"' + b + '"'), R = p(b), S = !R && /^\d+$/.test(b), g.call(B, b, R, S, D, C));
  }
  function p(C) {
    return typeof C == "string" && C && ["'", '"'].indexOf(C.charAt(0)) !== -1;
  }
  function m(C) {
    return C.match(r) && !C.match(e);
  }
  function E(C) {
    return a.test(C);
  }
  function A(C) {
    return !p(C) && (m(C) || E(C));
  }
  return Ze;
}
var O0 = bi(), Ye, xr;
function wi() {
  if (xr) return Ye;
  xr = 1;
  const c = /[A-Z\xc0-\xd6\xd8-\xde]?[a-z\xdf-\xf6\xf8-\xff]+(?:['’](?:d|ll|m|re|s|t|ve))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde]|$)|(?:[A-Z\xc0-\xd6\xd8-\xde]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:D|LL|M|RE|S|T|VE))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde](?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])|$)|[A-Z\xc0-\xd6\xd8-\xde]?(?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:d|ll|m|re|s|t|ve))?|[A-Z\xc0-\xd6\xd8-\xde]+(?:['’](?:D|LL|M|RE|S|T|VE))?|\d*(?:1ST|2ND|3RD|(?![123])\dTH)(?=\b|[a-z_])|\d*(?:1st|2nd|3rd|(?![123])\dth)(?=\b|[A-Z_])|\d+|(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?)*/g, t = (l) => l.match(c) || [], e = (l) => l[0].toUpperCase() + l.slice(1), r = (l, y) => t(l).join(y).toLowerCase(), a = (l) => t(l).reduce(
    (y, d) => `${y}${y ? d[0].toUpperCase() + d.slice(1).toLowerCase() : d.toLowerCase()}`,
    ""
  );
  return Ye = {
    words: t,
    upperFirst: e,
    camelCase: a,
    pascalCase: (l) => e(a(l)),
    snakeCase: (l) => r(l, "_"),
    kebabCase: (l) => r(l, "-"),
    sentenceCase: (l) => e(r(l, " ")),
    titleCase: (l) => t(l).map(e).join(" ")
  }, Ye;
}
var Qe = wi(), ee = { exports: {} }, cr;
function Di() {
  if (cr) return ee.exports;
  cr = 1, ee.exports = function(a) {
    return c(t(a), a);
  }, ee.exports.array = c;
  function c(a, o) {
    var x = a.length, s = new Array(x), h = {}, u = x, l = e(o), y = r(a);
    for (o.forEach(function(p) {
      if (!y.has(p[0]) || !y.has(p[1]))
        throw new Error("Unknown node. There is an unknown node in the supplied edges.");
    }); u--; )
      h[u] || d(a[u], u, /* @__PURE__ */ new Set());
    return s;
    function d(p, m, E) {
      if (E.has(p)) {
        var A;
        try {
          A = ", node was:" + JSON.stringify(p);
        } catch {
          A = "";
        }
        throw new Error("Cyclic dependency" + A);
      }
      if (!y.has(p))
        throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(p));
      if (!h[m]) {
        h[m] = !0;
        var C = l.get(p) || /* @__PURE__ */ new Set();
        if (C = Array.from(C), m = C.length) {
          E.add(p);
          do {
            var g = C[--m];
            d(g, y.get(g), E);
          } while (m);
          E.delete(p);
        }
        s[--x] = p;
      }
    }
  }
  function t(a) {
    for (var o = /* @__PURE__ */ new Set(), x = 0, s = a.length; x < s; x++) {
      var h = a[x];
      o.add(h[0]), o.add(h[1]);
    }
    return Array.from(o);
  }
  function e(a) {
    for (var o = /* @__PURE__ */ new Map(), x = 0, s = a.length; x < s; x++) {
      var h = a[x];
      o.has(h[0]) || o.set(h[0], /* @__PURE__ */ new Set()), o.has(h[1]) || o.set(h[1], /* @__PURE__ */ new Set()), o.get(h[0]).add(h[1]);
    }
    return o;
  }
  function r(a) {
    for (var o = /* @__PURE__ */ new Map(), x = 0, s = a.length; x < s; x++)
      o.set(a[x], x);
    return o;
  }
  return ee.exports;
}
var _i = Di();
const ki = /* @__PURE__ */ at(_i), Si = Object.prototype.toString, Ti = Error.prototype.toString, Ri = RegExp.prototype.toString, Ii = typeof Symbol < "u" ? Symbol.prototype.toString : () => "", $i = /^Symbol\((.*)\)(.*)$/;
function Oi(c) {
  return c != +c ? "NaN" : c === 0 && 1 / c < 0 ? "-0" : "" + c;
}
function fr(c, t = !1) {
  if (c == null || c === !0 || c === !1) return "" + c;
  const e = typeof c;
  if (e === "number") return Oi(c);
  if (e === "string") return t ? `"${c}"` : c;
  if (e === "function") return "[Function " + (c.name || "anonymous") + "]";
  if (e === "symbol") return Ii.call(c).replace($i, "Symbol($1)");
  const r = Si.call(c).slice(8, -1);
  return r === "Date" ? isNaN(c.getTime()) ? "" + c : c.toISOString(c) : r === "Error" || c instanceof Error ? "[" + Ti.call(c) + "]" : r === "RegExp" ? Ri.call(c) : null;
}
function F0(c, t) {
  let e = fr(c, t);
  return e !== null ? e : JSON.stringify(c, function(r, a) {
    let o = fr(this[r], t);
    return o !== null ? o : a;
  }, 2);
}
function Er(c) {
  return c == null ? [] : [].concat(c);
}
let yr, Ar, Cr, Pi = /\$\{\s*(\w+)\s*\}/g;
yr = Symbol.toStringTag;
class lr {
  constructor(t, e, r, a) {
    this.name = void 0, this.message = void 0, this.value = void 0, this.path = void 0, this.type = void 0, this.params = void 0, this.errors = void 0, this.inner = void 0, this[yr] = "Error", this.name = "ValidationError", this.value = e, this.path = r, this.type = a, this.errors = [], this.inner = [], Er(t).forEach((o) => {
      if (x0.isError(o)) {
        this.errors.push(...o.errors);
        const x = o.inner.length ? o.inner : [o];
        this.inner.push(...x);
      } else
        this.errors.push(o);
    }), this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0];
  }
}
Ar = Symbol.hasInstance;
Cr = Symbol.toStringTag;
class x0 extends Error {
  static formatError(t, e) {
    const r = e.label || e.path || "this";
    return e = Object.assign({}, e, {
      path: r,
      originalPath: e.path
    }), typeof t == "string" ? t.replace(Pi, (a, o) => F0(e[o])) : typeof t == "function" ? t(e) : t;
  }
  static isError(t) {
    return t && t.name === "ValidationError";
  }
  constructor(t, e, r, a, o) {
    const x = new lr(t, e, r, a);
    if (o)
      return x;
    super(), this.value = void 0, this.path = void 0, this.type = void 0, this.params = void 0, this.errors = [], this.inner = [], this[Cr] = "Error", this.name = x.name, this.message = x.message, this.type = x.type, this.value = x.value, this.path = x.path, this.errors = x.errors, this.inner = x.inner, Error.captureStackTrace && Error.captureStackTrace(this, x0);
  }
  static [Ar](t) {
    return lr[Symbol.hasInstance](t) || super[Symbol.hasInstance](t);
  }
}
let B0 = {
  default: "${path} is invalid",
  required: "${path} is a required field",
  defined: "${path} must be defined",
  notNull: "${path} cannot be null",
  oneOf: "${path} must be one of the following values: ${values}",
  notOneOf: "${path} must not be one of the following values: ${values}",
  notType: ({
    path: c,
    type: t,
    value: e,
    originalValue: r
  }) => {
    const a = r != null && r !== e ? ` (cast from the value \`${F0(r, !0)}\`).` : ".";
    return t !== "mixed" ? `${c} must be a \`${t}\` type, but the final value was: \`${F0(e, !0)}\`` + a : `${c} must match the configured type. The validated value was: \`${F0(e, !0)}\`` + a;
  }
}, h0 = {
  length: "${path} must be exactly ${length} characters",
  min: "${path} must be at least ${min} characters",
  max: "${path} must be at most ${max} characters",
  matches: '${path} must match the following: "${regex}"',
  email: "${path} must be a valid email",
  url: "${path} must be a valid URL",
  uuid: "${path} must be a valid UUID",
  datetime: "${path} must be a valid ISO date-time",
  datetime_precision: "${path} must be a valid ISO date-time with a sub-second precision of exactly ${precision} digits",
  datetime_offset: '${path} must be a valid ISO date-time with UTC "Z" timezone',
  trim: "${path} must be a trimmed string",
  lowercase: "${path} must be a lowercase string",
  uppercase: "${path} must be a upper case string"
}, S0 = {
  min: "${path} must be greater than or equal to ${min}",
  max: "${path} must be less than or equal to ${max}",
  lessThan: "${path} must be less than ${less}",
  moreThan: "${path} must be greater than ${more}",
  positive: "${path} must be a positive number",
  negative: "${path} must be a negative number",
  integer: "${path} must be an integer"
}, tt = {
  min: "${path} field must be later than ${min}",
  max: "${path} field must be at earlier than ${max}"
}, rt = {
  isValue: "${path} field must be ${value}"
}, Ue = {
  noUnknown: "${path} field has unspecified keys: ${unknown}",
  exact: "${path} object contains unknown properties: ${properties}"
}, Le = {
  min: "${path} field must have at least ${min} items",
  max: "${path} field must have less than or equal to ${max} items",
  length: "${path} must have ${length} items"
}, qi = {
  notType: (c) => {
    const {
      path: t,
      value: e,
      spec: r
    } = c, a = r.types.length;
    if (Array.isArray(e)) {
      if (e.length < a) return `${t} tuple value has too few items, expected a length of ${a} but got ${e.length} for value: \`${F0(e, !0)}\``;
      if (e.length > a) return `${t} tuple value has too many items, expected a length of ${a} but got ${e.length} for value: \`${F0(e, !0)}\``;
    }
    return x0.formatError(B0.notType, c);
  }
};
Object.assign(/* @__PURE__ */ Object.create(null), {
  mixed: B0,
  string: h0,
  number: S0,
  date: tt,
  object: Ue,
  array: Le,
  boolean: rt,
  tuple: qi
});
const Z0 = (c) => c && c.__isYupSchema__;
class He {
  static fromOptions(t, e) {
    if (!e.then && !e.otherwise) throw new TypeError("either `then:` or `otherwise:` is required for `when()` conditions");
    let {
      is: r,
      then: a,
      otherwise: o
    } = e, x = typeof r == "function" ? r : (...s) => s.every((h) => h === r);
    return new He(t, (s, h) => {
      var u;
      let l = x(...s) ? a : o;
      return (u = l == null ? void 0 : l(h)) != null ? u : h;
    });
  }
  constructor(t, e) {
    this.fn = void 0, this.refs = t, this.refs = t, this.fn = e;
  }
  resolve(t, e) {
    let r = this.refs.map((o) => (
      // TODO: ? operator here?
      o.getValue(e == null ? void 0 : e.value, e == null ? void 0 : e.parent, e == null ? void 0 : e.context)
    )), a = this.fn(r, t, e);
    if (a === void 0 || // @ts-ignore this can be base
    a === t)
      return t;
    if (!Z0(a)) throw new TypeError("conditions must return a schema object");
    return a.resolve(e);
  }
}
const te = {
  context: "$",
  value: "."
};
class U0 {
  constructor(t, e = {}) {
    if (this.key = void 0, this.isContext = void 0, this.isValue = void 0, this.isSibling = void 0, this.path = void 0, this.getter = void 0, this.map = void 0, typeof t != "string") throw new TypeError("ref must be a string, got: " + t);
    if (this.key = t.trim(), t === "") throw new TypeError("ref must be a non-empty string");
    this.isContext = this.key[0] === te.context, this.isValue = this.key[0] === te.value, this.isSibling = !this.isContext && !this.isValue;
    let r = this.isContext ? te.context : this.isValue ? te.value : "";
    this.path = this.key.slice(r.length), this.getter = this.path && O0.getter(this.path, !0), this.map = e.map;
  }
  getValue(t, e, r) {
    let a = this.isContext ? r : this.isValue ? t : e;
    return this.getter && (a = this.getter(a || {})), this.map && (a = this.map(a)), a;
  }
  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {Object=} options.context
   * @param {Object=} options.parent
   */
  cast(t, e) {
    return this.getValue(t, e == null ? void 0 : e.parent, e == null ? void 0 : e.context);
  }
  resolve() {
    return this;
  }
  describe() {
    return {
      type: "ref",
      key: this.key
    };
  }
  toString() {
    return `Ref(${this.key})`;
  }
  static isRef(t) {
    return t && t.__isYupRef;
  }
}
U0.prototype.__isYupRef = !0;
const v0 = (c) => c == null;
function H0(c) {
  function t({
    value: e,
    path: r = "",
    options: a,
    originalValue: o,
    schema: x
  }, s, h) {
    const {
      name: u,
      test: l,
      params: y,
      message: d,
      skipAbsent: p
    } = c;
    let {
      parent: m,
      context: E,
      abortEarly: A = x.spec.abortEarly,
      disableStackTrace: C = x.spec.disableStackTrace
    } = a;
    const g = {
      value: e,
      parent: m,
      context: E
    };
    function B(k = {}) {
      const q = Fr(Object.assign({
        value: e,
        originalValue: o,
        label: x.spec.label,
        path: k.path || r,
        spec: x.spec,
        disableStackTrace: k.disableStackTrace || C
      }, y, k.params), g), U = new x0(x0.formatError(k.message || d, q), e, q.path, k.type || u, q.disableStackTrace);
      return U.params = q, U;
    }
    const F = A ? s : h;
    let b = {
      path: r,
      parent: m,
      type: u,
      from: a.from,
      createError: B,
      resolve(k) {
        return br(k, g);
      },
      options: a,
      originalValue: o,
      schema: x
    };
    const D = (k) => {
      x0.isError(k) ? F(k) : k ? h(null) : F(B());
    }, S = (k) => {
      x0.isError(k) ? F(k) : s(k);
    };
    if (p && v0(e))
      return D(!0);
    let P;
    try {
      var _;
      if (P = l.call(b, e, b), typeof ((_ = P) == null ? void 0 : _.then) == "function") {
        if (a.sync)
          throw new Error(`Validation test of type: "${b.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);
        return Promise.resolve(P).then(D, S);
      }
    } catch (k) {
      S(k);
      return;
    }
    D(P);
  }
  return t.OPTIONS = c, t;
}
function Fr(c, t) {
  if (!c) return c;
  for (const e of Object.keys(c))
    c[e] = br(c[e], t);
  return c;
}
function br(c, t) {
  return U0.isRef(c) ? c.getValue(t.value, t.parent, t.context) : c;
}
function Ui(c, t, e, r = e) {
  let a, o, x;
  return t ? (O0.forEach(t, (s, h, u) => {
    let l = h ? s.slice(1, s.length - 1) : s;
    c = c.resolve({
      context: r,
      parent: a,
      value: e
    });
    let y = c.type === "tuple", d = u ? parseInt(l, 10) : 0;
    if (c.innerType || y) {
      if (y && !u) throw new Error(`Yup.reach cannot implicitly index into a tuple type. the path part "${x}" must contain an index to the tuple element, e.g. "${x}[0]"`);
      if (e && d >= e.length)
        throw new Error(`Yup.reach cannot resolve an array item at index: ${s}, in the path: ${t}. because there is no value at that index. `);
      a = e, e = e && e[d], c = y ? c.spec.types[d] : c.innerType;
    }
    if (!u) {
      if (!c.fields || !c.fields[l]) throw new Error(`The schema does not contain the path: ${t}. (failed at: ${x} which is a type: "${c.type}")`);
      a = e, e = e && e[l], c = c.fields[l];
    }
    o = l, x = h ? "[" + s + "]" : "." + s;
  }), {
    schema: c,
    parent: a,
    parentPath: o
  }) : {
    parent: a,
    parentPath: t,
    schema: c
  };
}
class Me extends Set {
  describe() {
    const t = [];
    for (const e of this.values())
      t.push(U0.isRef(e) ? e.describe() : e);
    return t;
  }
  resolveAll(t) {
    let e = [];
    for (const r of this.values())
      e.push(t(r));
    return e;
  }
  clone() {
    return new Me(this.values());
  }
  merge(t, e) {
    const r = this.clone();
    return t.forEach((a) => r.add(a)), e.forEach((a) => r.delete(a)), r;
  }
}
function M0(c, t = /* @__PURE__ */ new Map()) {
  if (Z0(c) || !c || typeof c != "object") return c;
  if (t.has(c)) return t.get(c);
  let e;
  if (c instanceof Date)
    e = new Date(c.getTime()), t.set(c, e);
  else if (c instanceof RegExp)
    e = new RegExp(c), t.set(c, e);
  else if (Array.isArray(c)) {
    e = new Array(c.length), t.set(c, e);
    for (let r = 0; r < c.length; r++) e[r] = M0(c[r], t);
  } else if (c instanceof Map) {
    e = /* @__PURE__ */ new Map(), t.set(c, e);
    for (const [r, a] of c.entries()) e.set(r, M0(a, t));
  } else if (c instanceof Set) {
    e = /* @__PURE__ */ new Set(), t.set(c, e);
    for (const r of c) e.add(M0(r, t));
  } else if (c instanceof Object) {
    e = {}, t.set(c, e);
    for (const [r, a] of Object.entries(c)) e[r] = M0(a, t);
  } else
    throw Error(`Unable to clone ${c}`);
  return e;
}
function Li(c) {
  if (!(c != null && c.length))
    return;
  const t = [];
  let e = "", r = !1, a = !1;
  for (let o = 0; o < c.length; o++) {
    const x = c[o];
    if (x === "[" && !a) {
      e && (t.push(...e.split(".").filter(Boolean)), e = ""), r = !0;
      continue;
    }
    if (x === "]" && !a) {
      e && (/^\d+$/.test(e) ? t.push(e) : t.push(e.replace(/^"|"$/g, "")), e = ""), r = !1;
      continue;
    }
    if (x === '"') {
      a = !a;
      continue;
    }
    if (x === "." && !r && !a) {
      e && (t.push(e), e = "");
      continue;
    }
    e += x;
  }
  return e && t.push(...e.split(".").filter(Boolean)), t;
}
function zi(c, t) {
  const e = t ? `${t}.${c.path}` : c.path;
  return c.errors.map((r) => ({
    message: r,
    path: Li(e)
  }));
}
function ut(c, t) {
  var e;
  if (!((e = c.inner) != null && e.length) && c.errors.length)
    return zi(c, t);
  const r = t ? `${t}.${c.path}` : c.path;
  return c.inner.flatMap((a) => ut(a, r));
}
class d0 {
  constructor(t) {
    this.type = void 0, this.deps = [], this.tests = void 0, this.transforms = void 0, this.conditions = [], this._mutate = void 0, this.internalTests = {}, this._whitelist = new Me(), this._blacklist = new Me(), this.exclusiveTests = /* @__PURE__ */ Object.create(null), this._typeCheck = void 0, this.spec = void 0, this.tests = [], this.transforms = [], this.withMutation(() => {
      this.typeError(B0.notType);
    }), this.type = t.type, this._typeCheck = t.check, this.spec = Object.assign({
      strip: !1,
      strict: !1,
      abortEarly: !0,
      recursive: !0,
      disableStackTrace: !1,
      nullable: !1,
      optional: !0,
      coerce: !0
    }, t == null ? void 0 : t.spec), this.withMutation((e) => {
      e.nonNullable();
    });
  }
  // TODO: remove
  get _type() {
    return this.type;
  }
  clone(t) {
    if (this._mutate)
      return t && Object.assign(this.spec, t), this;
    const e = Object.create(Object.getPrototypeOf(this));
    return e.type = this.type, e._typeCheck = this._typeCheck, e._whitelist = this._whitelist.clone(), e._blacklist = this._blacklist.clone(), e.internalTests = Object.assign({}, this.internalTests), e.exclusiveTests = Object.assign({}, this.exclusiveTests), e.deps = [...this.deps], e.conditions = [...this.conditions], e.tests = [...this.tests], e.transforms = [...this.transforms], e.spec = M0(Object.assign({}, this.spec, t)), e;
  }
  label(t) {
    let e = this.clone();
    return e.spec.label = t, e;
  }
  meta(...t) {
    if (t.length === 0) return this.spec.meta;
    let e = this.clone();
    return e.spec.meta = Object.assign(e.spec.meta || {}, t[0]), e;
  }
  withMutation(t) {
    let e = this._mutate;
    this._mutate = !0;
    let r = t(this);
    return this._mutate = e, r;
  }
  concat(t) {
    if (!t || t === this) return this;
    if (t.type !== this.type && this.type !== "mixed") throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this.type} and ${t.type}`);
    let e = this, r = t.clone();
    const a = Object.assign({}, e.spec, r.spec);
    return r.spec = a, r.internalTests = Object.assign({}, e.internalTests, r.internalTests), r._whitelist = e._whitelist.merge(t._whitelist, t._blacklist), r._blacklist = e._blacklist.merge(t._blacklist, t._whitelist), r.tests = e.tests, r.exclusiveTests = e.exclusiveTests, r.withMutation((o) => {
      t.tests.forEach((x) => {
        o.test(x.OPTIONS);
      });
    }), r.transforms = [...e.transforms, ...r.transforms], r;
  }
  isType(t) {
    return t == null ? !!(this.spec.nullable && t === null || this.spec.optional && t === void 0) : this._typeCheck(t);
  }
  resolve(t) {
    let e = this;
    if (e.conditions.length) {
      let r = e.conditions;
      e = e.clone(), e.conditions = [], e = r.reduce((a, o) => o.resolve(a, t), e), e = e.resolve(t);
    }
    return e;
  }
  resolveOptions(t) {
    var e, r, a, o;
    return Object.assign({}, t, {
      from: t.from || [],
      strict: (e = t.strict) != null ? e : this.spec.strict,
      abortEarly: (r = t.abortEarly) != null ? r : this.spec.abortEarly,
      recursive: (a = t.recursive) != null ? a : this.spec.recursive,
      disableStackTrace: (o = t.disableStackTrace) != null ? o : this.spec.disableStackTrace
    });
  }
  /**
   * Run the configured transform pipeline over an input value.
   */
  cast(t, e = {}) {
    let r = this.resolve(Object.assign({}, e, {
      value: t
      // parent: options.parent,
      // context: options.context,
    })), a = e.assert === "ignore-optionality", o = r._cast(t, e);
    if (e.assert !== !1 && !r.isType(o)) {
      if (a && v0(o))
        return o;
      let x = F0(t), s = F0(o);
      throw new TypeError(`The value of ${e.path || "field"} could not be cast to a value that satisfies the schema type: "${r.type}". 

attempted value: ${x} 
` + (s !== x ? `result of cast: ${s}` : ""));
    }
    return o;
  }
  _cast(t, e) {
    let r = t === void 0 ? t : this.transforms.reduce((a, o) => o.call(this, a, t, this, e), t);
    return r === void 0 && (r = this.getDefault(e)), r;
  }
  _validate(t, e = {}, r, a) {
    let {
      path: o,
      originalValue: x = t,
      strict: s = this.spec.strict
    } = e, h = t;
    s || (h = this._cast(h, Object.assign({
      assert: !1
    }, e)));
    let u = [];
    for (let l of Object.values(this.internalTests))
      l && u.push(l);
    this.runTests({
      path: o,
      value: h,
      originalValue: x,
      options: e,
      tests: u
    }, r, (l) => {
      if (l.length)
        return a(l, h);
      this.runTests({
        path: o,
        value: h,
        originalValue: x,
        options: e,
        tests: this.tests
      }, r, a);
    });
  }
  /**
   * Executes a set of validations, either schema, produced Tests or a nested
   * schema validate result.
   */
  runTests(t, e, r) {
    let a = !1, {
      tests: o,
      value: x,
      originalValue: s,
      path: h,
      options: u
    } = t, l = (E) => {
      a || (a = !0, e(E, x));
    }, y = (E) => {
      a || (a = !0, r(E, x));
    }, d = o.length, p = [];
    if (!d) return y([]);
    let m = {
      value: x,
      originalValue: s,
      path: h,
      options: u,
      schema: this
    };
    for (let E = 0; E < o.length; E++) {
      const A = o[E];
      A(m, l, function(g) {
        g && (Array.isArray(g) ? p.push(...g) : p.push(g)), --d <= 0 && y(p);
      });
    }
  }
  asNestedTest({
    key: t,
    index: e,
    parent: r,
    parentPath: a,
    originalParent: o,
    options: x
  }) {
    const s = t ?? e;
    if (s == null)
      throw TypeError("Must include `key` or `index` for nested validations");
    const h = typeof s == "number";
    let u = r[s];
    const l = Object.assign({}, x, {
      // Nested validations fields are always strict:
      //    1. parent isn't strict so the casting will also have cast inner values
      //    2. parent is strict in which case the nested values weren't cast either
      strict: !0,
      parent: r,
      value: u,
      originalValue: o[s],
      // FIXME: tests depend on `index` being passed around deeply,
      //   we should not let the options.key/index bleed through
      key: void 0,
      // index: undefined,
      [h ? "index" : "key"]: s,
      path: h || s.includes(".") ? `${a || ""}[${h ? s : `"${s}"`}]` : (a ? `${a}.` : "") + t
    });
    return (y, d, p) => this.resolve(l)._validate(u, l, d, p);
  }
  validate(t, e) {
    var r;
    let a = this.resolve(Object.assign({}, e, {
      value: t
    })), o = (r = e == null ? void 0 : e.disableStackTrace) != null ? r : a.spec.disableStackTrace;
    return new Promise((x, s) => a._validate(t, e, (h, u) => {
      x0.isError(h) && (h.value = u), s(h);
    }, (h, u) => {
      h.length ? s(new x0(h, u, void 0, void 0, o)) : x(u);
    }));
  }
  validateSync(t, e) {
    var r;
    let a = this.resolve(Object.assign({}, e, {
      value: t
    })), o, x = (r = e == null ? void 0 : e.disableStackTrace) != null ? r : a.spec.disableStackTrace;
    return a._validate(t, Object.assign({}, e, {
      sync: !0
    }), (s, h) => {
      throw x0.isError(s) && (s.value = h), s;
    }, (s, h) => {
      if (s.length) throw new x0(s, t, void 0, void 0, x);
      o = h;
    }), o;
  }
  isValid(t, e) {
    return this.validate(t, e).then(() => !0, (r) => {
      if (x0.isError(r)) return !1;
      throw r;
    });
  }
  isValidSync(t, e) {
    try {
      return this.validateSync(t, e), !0;
    } catch (r) {
      if (x0.isError(r)) return !1;
      throw r;
    }
  }
  _getDefault(t) {
    let e = this.spec.default;
    return e == null ? e : typeof e == "function" ? e.call(this, t) : M0(e);
  }
  getDefault(t) {
    return this.resolve(t || {})._getDefault(t);
  }
  default(t) {
    return arguments.length === 0 ? this._getDefault() : this.clone({
      default: t
    });
  }
  strict(t = !0) {
    return this.clone({
      strict: t
    });
  }
  nullability(t, e) {
    const r = this.clone({
      nullable: t
    });
    return r.internalTests.nullable = H0({
      message: e,
      name: "nullable",
      test(a) {
        return a === null ? this.schema.spec.nullable : !0;
      }
    }), r;
  }
  optionality(t, e) {
    const r = this.clone({
      optional: t
    });
    return r.internalTests.optionality = H0({
      message: e,
      name: "optionality",
      test(a) {
        return a === void 0 ? this.schema.spec.optional : !0;
      }
    }), r;
  }
  optional() {
    return this.optionality(!0);
  }
  defined(t = B0.defined) {
    return this.optionality(!1, t);
  }
  nullable() {
    return this.nullability(!0);
  }
  nonNullable(t = B0.notNull) {
    return this.nullability(!1, t);
  }
  required(t = B0.required) {
    return this.clone().withMutation((e) => e.nonNullable(t).defined(t));
  }
  notRequired() {
    return this.clone().withMutation((t) => t.nullable().optional());
  }
  transform(t) {
    let e = this.clone();
    return e.transforms.push(t), e;
  }
  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   */
  test(...t) {
    let e;
    if (t.length === 1 ? typeof t[0] == "function" ? e = {
      test: t[0]
    } : e = t[0] : t.length === 2 ? e = {
      name: t[0],
      test: t[1]
    } : e = {
      name: t[0],
      message: t[1],
      test: t[2]
    }, e.message === void 0 && (e.message = B0.default), typeof e.test != "function") throw new TypeError("`test` is a required parameters");
    let r = this.clone(), a = H0(e), o = e.exclusive || e.name && r.exclusiveTests[e.name] === !0;
    if (e.exclusive && !e.name)
      throw new TypeError("Exclusive tests must provide a unique `name` identifying the test");
    return e.name && (r.exclusiveTests[e.name] = !!e.exclusive), r.tests = r.tests.filter((x) => !(x.OPTIONS.name === e.name && (o || x.OPTIONS.test === a.OPTIONS.test))), r.tests.push(a), r;
  }
  when(t, e) {
    !Array.isArray(t) && typeof t != "string" && (e = t, t = ".");
    let r = this.clone(), a = Er(t).map((o) => new U0(o));
    return a.forEach((o) => {
      o.isSibling && r.deps.push(o.key);
    }), r.conditions.push(typeof e == "function" ? new He(a, e) : He.fromOptions(a, e)), r;
  }
  typeError(t) {
    let e = this.clone();
    return e.internalTests.typeError = H0({
      message: t,
      name: "typeError",
      skipAbsent: !0,
      test(r) {
        return this.schema._typeCheck(r) ? !0 : this.createError({
          params: {
            type: this.schema.type
          }
        });
      }
    }), e;
  }
  oneOf(t, e = B0.oneOf) {
    let r = this.clone();
    return t.forEach((a) => {
      r._whitelist.add(a), r._blacklist.delete(a);
    }), r.internalTests.whiteList = H0({
      message: e,
      name: "oneOf",
      skipAbsent: !0,
      test(a) {
        let o = this.schema._whitelist, x = o.resolveAll(this.resolve);
        return x.includes(a) ? !0 : this.createError({
          params: {
            values: Array.from(o).join(", "),
            resolved: x
          }
        });
      }
    }), r;
  }
  notOneOf(t, e = B0.notOneOf) {
    let r = this.clone();
    return t.forEach((a) => {
      r._blacklist.add(a), r._whitelist.delete(a);
    }), r.internalTests.blacklist = H0({
      message: e,
      name: "notOneOf",
      test(a) {
        let o = this.schema._blacklist, x = o.resolveAll(this.resolve);
        return x.includes(a) ? this.createError({
          params: {
            values: Array.from(o).join(", "),
            resolved: x
          }
        }) : !0;
      }
    }), r;
  }
  strip(t = !0) {
    let e = this.clone();
    return e.spec.strip = t, e;
  }
  /**
   * Return a serialized description of the schema including validations, flags, types etc.
   *
   * @param options Provide any needed context for resolving runtime schema alterations (lazy, when conditions, etc).
   */
  describe(t) {
    const e = (t ? this.resolve(t) : this).clone(), {
      label: r,
      meta: a,
      optional: o,
      nullable: x
    } = e.spec;
    return {
      meta: a,
      label: r,
      optional: o,
      nullable: x,
      default: e.getDefault(t),
      type: e.type,
      oneOf: e._whitelist.describe(),
      notOneOf: e._blacklist.describe(),
      tests: e.tests.filter((h, u, l) => l.findIndex((y) => y.OPTIONS.name === h.OPTIONS.name) === u).map((h) => {
        const u = h.OPTIONS.params && t ? Fr(Object.assign({}, h.OPTIONS.params), t) : h.OPTIONS.params;
        return {
          name: h.OPTIONS.name,
          params: u
        };
      })
    };
  }
  get "~standard"() {
    const t = this;
    return {
      version: 1,
      vendor: "yup",
      async validate(r) {
        try {
          return {
            value: await t.validate(r, {
              abortEarly: !1
            })
          };
        } catch (a) {
          if (a instanceof x0)
            return {
              issues: ut(a)
            };
          throw a;
        }
      }
    };
  }
}
d0.prototype.__isYupSchema__ = !0;
for (const c of ["validate", "validateSync"]) d0.prototype[`${c}At`] = function(t, e, r = {}) {
  const {
    parent: a,
    parentPath: o,
    schema: x
  } = Ui(this, t, e, r.context);
  return x[c](a && a[o], Object.assign({}, r, {
    parent: a,
    path: t
  }));
};
for (const c of ["equals", "is"]) d0.prototype[c] = d0.prototype.oneOf;
for (const c of ["not", "nope"]) d0.prototype[c] = d0.prototype.notOneOf;
const Ni = () => !0;
function X0(c) {
  return new wr(c);
}
class wr extends d0 {
  constructor(t) {
    super(typeof t == "function" ? {
      type: "mixed",
      check: t
    } : Object.assign({
      type: "mixed",
      check: Ni
    }, t));
  }
}
X0.prototype = wr.prototype;
function Dr() {
  return new _r();
}
class _r extends d0 {
  constructor() {
    super({
      type: "boolean",
      check(t) {
        return t instanceof Boolean && (t = t.valueOf()), typeof t == "boolean";
      }
    }), this.withMutation(() => {
      this.transform((t, e) => {
        if (this.spec.coerce && !this.isType(t)) {
          if (/^(true|1)$/i.test(String(t))) return !0;
          if (/^(false|0)$/i.test(String(t))) return !1;
        }
        return t;
      });
    });
  }
  isTrue(t = rt.isValue) {
    return this.test({
      message: t,
      name: "is-value",
      exclusive: !0,
      params: {
        value: "true"
      },
      test(e) {
        return v0(e) || e === !0;
      }
    });
  }
  isFalse(t = rt.isValue) {
    return this.test({
      message: t,
      name: "is-value",
      exclusive: !0,
      params: {
        value: "false"
      },
      test(e) {
        return v0(e) || e === !1;
      }
    });
  }
  default(t) {
    return super.default(t);
  }
  defined(t) {
    return super.defined(t);
  }
  optional() {
    return super.optional();
  }
  required(t) {
    return super.required(t);
  }
  notRequired() {
    return super.notRequired();
  }
  nullable() {
    return super.nullable();
  }
  nonNullable(t) {
    return super.nonNullable(t);
  }
  strip(t) {
    return super.strip(t);
  }
}
Dr.prototype = _r.prototype;
const Hi = /^(\d{4}|[+-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,.](\d{1,}))?)?(?:(Z)|([+-])(\d{2})(?::?(\d{2}))?)?)?$/;
function Mi(c) {
  const t = nt(c);
  if (!t) return Date.parse ? Date.parse(c) : Number.NaN;
  if (t.z === void 0 && t.plusMinus === void 0)
    return new Date(t.year, t.month, t.day, t.hour, t.minute, t.second, t.millisecond).valueOf();
  let e = 0;
  return t.z !== "Z" && t.plusMinus !== void 0 && (e = t.hourOffset * 60 + t.minuteOffset, t.plusMinus === "+" && (e = 0 - e)), Date.UTC(t.year, t.month, t.day, t.hour, t.minute + e, t.second, t.millisecond);
}
function nt(c) {
  var t, e;
  const r = Hi.exec(c);
  return r ? {
    year: C0(r[1]),
    month: C0(r[2], 1) - 1,
    day: C0(r[3], 1),
    hour: C0(r[4]),
    minute: C0(r[5]),
    second: C0(r[6]),
    millisecond: r[7] ? (
      // allow arbitrary sub-second precision beyond milliseconds
      C0(r[7].substring(0, 3))
    ) : 0,
    precision: (t = (e = r[7]) == null ? void 0 : e.length) != null ? t : void 0,
    z: r[8] || void 0,
    plusMinus: r[9] || void 0,
    hourOffset: C0(r[10]),
    minuteOffset: C0(r[11])
  } : null;
}
function C0(c, t = 0) {
  return Number(c) || t;
}
let ji = (
  // eslint-disable-next-line
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
), Wi = (
  // eslint-disable-next-line
  /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
), Gi = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i, Ki = "^\\d{4}-\\d{2}-\\d{2}", Vi = "\\d{2}:\\d{2}:\\d{2}", Xi = "(([+-]\\d{2}(:?\\d{2})?)|Z)", Zi = new RegExp(`${Ki}T${Vi}(\\.\\d+)?${Xi}$`), Yi = (c) => v0(c) || c === c.trim(), Qi = {}.toString();
function K() {
  return new kr();
}
class kr extends d0 {
  constructor() {
    super({
      type: "string",
      check(t) {
        return t instanceof String && (t = t.valueOf()), typeof t == "string";
      }
    }), this.withMutation(() => {
      this.transform((t, e) => {
        if (!this.spec.coerce || this.isType(t) || Array.isArray(t)) return t;
        const r = t != null && t.toString ? t.toString() : t;
        return r === Qi ? t : r;
      });
    });
  }
  required(t) {
    return super.required(t).withMutation((e) => e.test({
      message: t || B0.required,
      name: "required",
      skipAbsent: !0,
      test: (r) => !!r.length
    }));
  }
  notRequired() {
    return super.notRequired().withMutation((t) => (t.tests = t.tests.filter((e) => e.OPTIONS.name !== "required"), t));
  }
  length(t, e = h0.length) {
    return this.test({
      message: e,
      name: "length",
      exclusive: !0,
      params: {
        length: t
      },
      skipAbsent: !0,
      test(r) {
        return r.length === this.resolve(t);
      }
    });
  }
  min(t, e = h0.min) {
    return this.test({
      message: e,
      name: "min",
      exclusive: !0,
      params: {
        min: t
      },
      skipAbsent: !0,
      test(r) {
        return r.length >= this.resolve(t);
      }
    });
  }
  max(t, e = h0.max) {
    return this.test({
      name: "max",
      exclusive: !0,
      message: e,
      params: {
        max: t
      },
      skipAbsent: !0,
      test(r) {
        return r.length <= this.resolve(t);
      }
    });
  }
  matches(t, e) {
    let r = !1, a, o;
    return e && (typeof e == "object" ? {
      excludeEmptyString: r = !1,
      message: a,
      name: o
    } = e : a = e), this.test({
      name: o || "matches",
      message: a || h0.matches,
      params: {
        regex: t
      },
      skipAbsent: !0,
      test: (x) => x === "" && r || x.search(t) !== -1
    });
  }
  email(t = h0.email) {
    return this.matches(ji, {
      name: "email",
      message: t,
      excludeEmptyString: !0
    });
  }
  url(t = h0.url) {
    return this.matches(Wi, {
      name: "url",
      message: t,
      excludeEmptyString: !0
    });
  }
  uuid(t = h0.uuid) {
    return this.matches(Gi, {
      name: "uuid",
      message: t,
      excludeEmptyString: !1
    });
  }
  datetime(t) {
    let e = "", r, a;
    return t && (typeof t == "object" ? {
      message: e = "",
      allowOffset: r = !1,
      precision: a = void 0
    } = t : e = t), this.matches(Zi, {
      name: "datetime",
      message: e || h0.datetime,
      excludeEmptyString: !0
    }).test({
      name: "datetime_offset",
      message: e || h0.datetime_offset,
      params: {
        allowOffset: r
      },
      skipAbsent: !0,
      test: (o) => {
        if (!o || r) return !0;
        const x = nt(o);
        return x ? !!x.z : !1;
      }
    }).test({
      name: "datetime_precision",
      message: e || h0.datetime_precision,
      params: {
        precision: a
      },
      skipAbsent: !0,
      test: (o) => {
        if (!o || a == null) return !0;
        const x = nt(o);
        return x ? x.precision === a : !1;
      }
    });
  }
  //-- transforms --
  ensure() {
    return this.default("").transform((t) => t === null ? "" : t);
  }
  trim(t = h0.trim) {
    return this.transform((e) => e != null ? e.trim() : e).test({
      message: t,
      name: "trim",
      test: Yi
    });
  }
  lowercase(t = h0.lowercase) {
    return this.transform((e) => v0(e) ? e : e.toLowerCase()).test({
      message: t,
      name: "string_case",
      exclusive: !0,
      skipAbsent: !0,
      test: (e) => v0(e) || e === e.toLowerCase()
    });
  }
  uppercase(t = h0.uppercase) {
    return this.transform((e) => v0(e) ? e : e.toUpperCase()).test({
      message: t,
      name: "string_case",
      exclusive: !0,
      skipAbsent: !0,
      test: (e) => v0(e) || e === e.toUpperCase()
    });
  }
}
K.prototype = kr.prototype;
let Ji = (c) => c != +c;
function E0() {
  return new Sr();
}
class Sr extends d0 {
  constructor() {
    super({
      type: "number",
      check(t) {
        return t instanceof Number && (t = t.valueOf()), typeof t == "number" && !Ji(t);
      }
    }), this.withMutation(() => {
      this.transform((t, e) => {
        if (!this.spec.coerce) return t;
        let r = t;
        if (typeof r == "string") {
          if (r = r.replace(/\s/g, ""), r === "") return NaN;
          r = +r;
        }
        return this.isType(r) || r === null ? r : parseFloat(r);
      });
    });
  }
  min(t, e = S0.min) {
    return this.test({
      message: e,
      name: "min",
      exclusive: !0,
      params: {
        min: t
      },
      skipAbsent: !0,
      test(r) {
        return r >= this.resolve(t);
      }
    });
  }
  max(t, e = S0.max) {
    return this.test({
      message: e,
      name: "max",
      exclusive: !0,
      params: {
        max: t
      },
      skipAbsent: !0,
      test(r) {
        return r <= this.resolve(t);
      }
    });
  }
  lessThan(t, e = S0.lessThan) {
    return this.test({
      message: e,
      name: "max",
      exclusive: !0,
      params: {
        less: t
      },
      skipAbsent: !0,
      test(r) {
        return r < this.resolve(t);
      }
    });
  }
  moreThan(t, e = S0.moreThan) {
    return this.test({
      message: e,
      name: "min",
      exclusive: !0,
      params: {
        more: t
      },
      skipAbsent: !0,
      test(r) {
        return r > this.resolve(t);
      }
    });
  }
  positive(t = S0.positive) {
    return this.moreThan(0, t);
  }
  negative(t = S0.negative) {
    return this.lessThan(0, t);
  }
  integer(t = S0.integer) {
    return this.test({
      name: "integer",
      message: t,
      skipAbsent: !0,
      test: (e) => Number.isInteger(e)
    });
  }
  truncate() {
    return this.transform((t) => v0(t) ? t : t | 0);
  }
  round(t) {
    var e;
    let r = ["ceil", "floor", "round", "trunc"];
    if (t = ((e = t) == null ? void 0 : e.toLowerCase()) || "round", t === "trunc") return this.truncate();
    if (r.indexOf(t.toLowerCase()) === -1) throw new TypeError("Only valid options for round() are: " + r.join(", "));
    return this.transform((a) => v0(a) ? a : Math[t](a));
  }
}
E0.prototype = Sr.prototype;
let ea = /* @__PURE__ */ new Date(""), ta = (c) => Object.prototype.toString.call(c) === "[object Date]";
class xt extends d0 {
  constructor() {
    super({
      type: "date",
      check(t) {
        return ta(t) && !isNaN(t.getTime());
      }
    }), this.withMutation(() => {
      this.transform((t, e) => !this.spec.coerce || this.isType(t) || t === null ? t : (t = Mi(t), isNaN(t) ? xt.INVALID_DATE : new Date(t)));
    });
  }
  prepareParam(t, e) {
    let r;
    if (U0.isRef(t))
      r = t;
    else {
      let a = this.cast(t);
      if (!this._typeCheck(a)) throw new TypeError(`\`${e}\` must be a Date or a value that can be \`cast()\` to a Date`);
      r = a;
    }
    return r;
  }
  min(t, e = tt.min) {
    let r = this.prepareParam(t, "min");
    return this.test({
      message: e,
      name: "min",
      exclusive: !0,
      params: {
        min: t
      },
      skipAbsent: !0,
      test(a) {
        return a >= this.resolve(r);
      }
    });
  }
  max(t, e = tt.max) {
    let r = this.prepareParam(t, "max");
    return this.test({
      message: e,
      name: "max",
      exclusive: !0,
      params: {
        max: t
      },
      skipAbsent: !0,
      test(a) {
        return a <= this.resolve(r);
      }
    });
  }
}
xt.INVALID_DATE = ea;
function ra(c, t = []) {
  let e = [], r = /* @__PURE__ */ new Set(), a = new Set(t.map(([x, s]) => `${x}-${s}`));
  function o(x, s) {
    let h = O0.split(x)[0];
    r.add(h), a.has(`${s}-${h}`) || e.push([s, h]);
  }
  for (const x of Object.keys(c)) {
    let s = c[x];
    r.add(x), U0.isRef(s) && s.isSibling ? o(s.path, x) : Z0(s) && "deps" in s && s.deps.forEach((h) => o(h, x));
  }
  return ki.array(Array.from(r), e).reverse();
}
function hr(c, t) {
  let e = 1 / 0;
  return c.some((r, a) => {
    var o;
    if ((o = t.path) != null && o.includes(r))
      return e = a, !0;
  }), e;
}
function Tr(c) {
  return (t, e) => hr(c, t) - hr(c, e);
}
const Rr = (c, t, e) => {
  if (typeof c != "string")
    return c;
  let r = c;
  try {
    r = JSON.parse(c);
  } catch {
  }
  return e.isType(r) ? r : c;
};
function ze(c) {
  if ("fields" in c) {
    const t = {};
    for (const [e, r] of Object.entries(c.fields))
      t[e] = ze(r);
    return c.setFields(t);
  }
  if (c.type === "array") {
    const t = c.optional();
    return t.innerType && (t.innerType = ze(t.innerType)), t;
  }
  return c.type === "tuple" ? c.optional().clone({
    types: c.spec.types.map(ze)
  }) : "optional" in c ? c.optional() : c;
}
const na = (c, t) => {
  const e = [...O0.normalizePath(t)];
  if (e.length === 1) return e[0] in c;
  let r = e.pop(), a = O0.getter(O0.join(e), !0)(c);
  return !!(a && r in a);
};
let dr = (c) => Object.prototype.toString.call(c) === "[object Object]";
function pr(c, t) {
  let e = Object.keys(c.fields);
  return Object.keys(t).filter((r) => e.indexOf(r) === -1);
}
const ia = Tr([]);
function s0(c) {
  return new Ir(c);
}
class Ir extends d0 {
  constructor(t) {
    super({
      type: "object",
      check(e) {
        return dr(e) || typeof e == "function";
      }
    }), this.fields = /* @__PURE__ */ Object.create(null), this._sortErrors = ia, this._nodes = [], this._excludedEdges = [], this.withMutation(() => {
      t && this.shape(t);
    });
  }
  _cast(t, e = {}) {
    var r;
    let a = super._cast(t, e);
    if (a === void 0) return this.getDefault(e);
    if (!this._typeCheck(a)) return a;
    let o = this.fields, x = (r = e.stripUnknown) != null ? r : this.spec.noUnknown, s = [].concat(this._nodes, Object.keys(a).filter((y) => !this._nodes.includes(y))), h = {}, u = Object.assign({}, e, {
      parent: h,
      __validating: e.__validating || !1
    }), l = !1;
    for (const y of s) {
      let d = o[y], p = y in a, m = a[y];
      if (d) {
        let E;
        u.path = (e.path ? `${e.path}.` : "") + y, d = d.resolve({
          value: m,
          context: e.context,
          parent: h
        });
        let A = d instanceof d0 ? d.spec : void 0, C = A == null ? void 0 : A.strict;
        if (A != null && A.strip) {
          l = l || y in a;
          continue;
        }
        E = !e.__validating || !C ? d.cast(m, u) : m, E !== void 0 && (h[y] = E);
      } else p && !x && (h[y] = m);
      (p !== y in h || h[y] !== m) && (l = !0);
    }
    return l ? h : a;
  }
  _validate(t, e = {}, r, a) {
    let {
      from: o = [],
      originalValue: x = t,
      recursive: s = this.spec.recursive
    } = e;
    e.from = [{
      schema: this,
      value: x
    }, ...o], e.__validating = !0, e.originalValue = x, super._validate(t, e, r, (h, u) => {
      if (!s || !dr(u)) {
        a(h, u);
        return;
      }
      x = x || u;
      let l = [];
      for (let y of this._nodes) {
        let d = this.fields[y];
        !d || U0.isRef(d) || l.push(d.asNestedTest({
          options: e,
          key: y,
          parent: u,
          parentPath: e.path,
          originalParent: x
        }));
      }
      this.runTests({
        tests: l,
        value: u,
        originalValue: x,
        options: e
      }, r, (y) => {
        a(y.sort(this._sortErrors).concat(h), u);
      });
    });
  }
  clone(t) {
    const e = super.clone(t);
    return e.fields = Object.assign({}, this.fields), e._nodes = this._nodes, e._excludedEdges = this._excludedEdges, e._sortErrors = this._sortErrors, e;
  }
  concat(t) {
    let e = super.concat(t), r = e.fields;
    for (let [a, o] of Object.entries(this.fields)) {
      const x = r[a];
      r[a] = x === void 0 ? o : x;
    }
    return e.withMutation((a) => (
      // XXX: excludes here is wrong
      a.setFields(r, [...this._excludedEdges, ...t._excludedEdges])
    ));
  }
  _getDefault(t) {
    if ("default" in this.spec)
      return super._getDefault(t);
    if (!this._nodes.length)
      return;
    let e = {};
    return this._nodes.forEach((r) => {
      var a;
      const o = this.fields[r];
      let x = t;
      (a = x) != null && a.value && (x = Object.assign({}, x, {
        parent: x.value,
        value: x.value[r]
      })), e[r] = o && "getDefault" in o ? o.getDefault(x) : void 0;
    }), e;
  }
  setFields(t, e) {
    let r = this.clone();
    return r.fields = t, r._nodes = ra(t, e), r._sortErrors = Tr(Object.keys(t)), e && (r._excludedEdges = e), r;
  }
  shape(t, e = []) {
    return this.clone().withMutation((r) => {
      let a = r._excludedEdges;
      return e.length && (Array.isArray(e[0]) || (e = [e]), a = [...r._excludedEdges, ...e]), r.setFields(Object.assign(r.fields, t), a);
    });
  }
  partial() {
    const t = {};
    for (const [e, r] of Object.entries(this.fields))
      t[e] = "optional" in r && r.optional instanceof Function ? r.optional() : r;
    return this.setFields(t);
  }
  deepPartial() {
    return ze(this);
  }
  pick(t) {
    const e = {};
    for (const r of t)
      this.fields[r] && (e[r] = this.fields[r]);
    return this.setFields(e, this._excludedEdges.filter(([r, a]) => t.includes(r) && t.includes(a)));
  }
  omit(t) {
    const e = [];
    for (const r of Object.keys(this.fields))
      t.includes(r) || e.push(r);
    return this.pick(e);
  }
  from(t, e, r) {
    let a = O0.getter(t, !0);
    return this.transform((o) => {
      if (!o) return o;
      let x = o;
      return na(o, t) && (x = Object.assign({}, o), r || delete x[t], x[e] = a(o)), x;
    });
  }
  /** Parse an input JSON string to an object */
  json() {
    return this.transform(Rr);
  }
  /**
   * Similar to `noUnknown` but only validates that an object is the right shape without stripping the unknown keys
   */
  exact(t) {
    return this.test({
      name: "exact",
      exclusive: !0,
      message: t || Ue.exact,
      test(e) {
        if (e == null) return !0;
        const r = pr(this.schema, e);
        return r.length === 0 || this.createError({
          params: {
            properties: r.join(", ")
          }
        });
      }
    });
  }
  stripUnknown() {
    return this.clone({
      noUnknown: !0
    });
  }
  noUnknown(t = !0, e = Ue.noUnknown) {
    typeof t != "boolean" && (e = t, t = !0);
    let r = this.test({
      name: "noUnknown",
      exclusive: !0,
      message: e,
      test(a) {
        if (a == null) return !0;
        const o = pr(this.schema, a);
        return !t || o.length === 0 || this.createError({
          params: {
            unknown: o.join(", ")
          }
        });
      }
    });
    return r.spec.noUnknown = t, r;
  }
  unknown(t = !0, e = Ue.noUnknown) {
    return this.noUnknown(!t, e);
  }
  transformKeys(t) {
    return this.transform((e) => {
      if (!e) return e;
      const r = {};
      for (const a of Object.keys(e)) r[t(a)] = e[a];
      return r;
    });
  }
  camelCase() {
    return this.transformKeys(Qe.camelCase);
  }
  snakeCase() {
    return this.transformKeys(Qe.snakeCase);
  }
  constantCase() {
    return this.transformKeys((t) => Qe.snakeCase(t).toUpperCase());
  }
  describe(t) {
    const e = (t ? this.resolve(t) : this).clone(), r = super.describe(t);
    r.fields = {};
    for (const [o, x] of Object.entries(e.fields)) {
      var a;
      let s = t;
      (a = s) != null && a.value && (s = Object.assign({}, s, {
        parent: s.value,
        value: s.value[o]
      })), r.fields[o] = x.describe(s);
    }
    return r;
  }
}
s0.prototype = Ir.prototype;
function L0(c) {
  return new $r(c);
}
class $r extends d0 {
  constructor(t) {
    super({
      type: "array",
      spec: {
        types: t
      },
      check(e) {
        return Array.isArray(e);
      }
    }), this.innerType = void 0, this.innerType = t;
  }
  _cast(t, e) {
    const r = super._cast(t, e);
    if (!this._typeCheck(r) || !this.innerType)
      return r;
    let a = !1;
    const o = r.map((x, s) => {
      const h = this.innerType.cast(x, Object.assign({}, e, {
        path: `${e.path || ""}[${s}]`,
        parent: r,
        originalValue: x,
        value: x,
        index: s
      }));
      return h !== x && (a = !0), h;
    });
    return a ? o : r;
  }
  _validate(t, e = {}, r, a) {
    var o;
    let x = this.innerType, s = (o = e.recursive) != null ? o : this.spec.recursive;
    e.originalValue != null && e.originalValue, super._validate(t, e, r, (h, u) => {
      var l;
      if (!s || !x || !this._typeCheck(u)) {
        a(h, u);
        return;
      }
      let y = new Array(u.length);
      for (let p = 0; p < u.length; p++) {
        var d;
        y[p] = x.asNestedTest({
          options: e,
          index: p,
          parent: u,
          parentPath: e.path,
          originalParent: (d = e.originalValue) != null ? d : t
        });
      }
      this.runTests({
        value: u,
        tests: y,
        originalValue: (l = e.originalValue) != null ? l : t,
        options: e
      }, r, (p) => a(p.concat(h), u));
    });
  }
  clone(t) {
    const e = super.clone(t);
    return e.innerType = this.innerType, e;
  }
  /** Parse an input JSON string to an object */
  json() {
    return this.transform(Rr);
  }
  concat(t) {
    let e = super.concat(t);
    return e.innerType = this.innerType, t.innerType && (e.innerType = e.innerType ? (
      // @ts-expect-error Lazy doesn't have concat and will break
      e.innerType.concat(t.innerType)
    ) : t.innerType), e;
  }
  of(t) {
    let e = this.clone();
    if (!Z0(t)) throw new TypeError("`array.of()` sub-schema must be a valid yup schema not: " + F0(t));
    return e.innerType = t, e.spec = Object.assign({}, e.spec, {
      types: t
    }), e;
  }
  length(t, e = Le.length) {
    return this.test({
      message: e,
      name: "length",
      exclusive: !0,
      params: {
        length: t
      },
      skipAbsent: !0,
      test(r) {
        return r.length === this.resolve(t);
      }
    });
  }
  min(t, e) {
    return e = e || Le.min, this.test({
      message: e,
      name: "min",
      exclusive: !0,
      params: {
        min: t
      },
      skipAbsent: !0,
      // FIXME(ts): Array<typeof T>
      test(r) {
        return r.length >= this.resolve(t);
      }
    });
  }
  max(t, e) {
    return e = e || Le.max, this.test({
      message: e,
      name: "max",
      exclusive: !0,
      params: {
        max: t
      },
      skipAbsent: !0,
      test(r) {
        return r.length <= this.resolve(t);
      }
    });
  }
  ensure() {
    return this.default(() => []).transform((t, e) => this._typeCheck(t) ? t : e == null ? [] : [].concat(e));
  }
  compact(t) {
    let e = t ? (r, a, o) => !t(r, a, o) : (r) => !!r;
    return this.transform((r) => r != null ? r.filter(e) : r);
  }
  describe(t) {
    const e = (t ? this.resolve(t) : this).clone(), r = super.describe(t);
    if (e.innerType) {
      var a;
      let o = t;
      (a = o) != null && a.value && (o = Object.assign({}, o, {
        parent: o.value,
        value: o.value[0]
      })), r.innerType = e.innerType.describe(o);
    }
    return r;
  }
}
L0.prototype = $r.prototype;
function aa(c) {
  return new ct(c);
}
function gr(c) {
  try {
    return c();
  } catch (t) {
    if (x0.isError(t)) return Promise.reject(t);
    throw t;
  }
}
class ct {
  constructor(t) {
    this.type = "lazy", this.__isYupSchema__ = !0, this.spec = void 0, this._resolve = (e, r = {}) => {
      let a = this.builder(e, r);
      if (!Z0(a)) throw new TypeError("lazy() functions must return a valid schema");
      return this.spec.optional && (a = a.optional()), a.resolve(r);
    }, this.builder = t, this.spec = {
      meta: void 0,
      optional: !1
    };
  }
  clone(t) {
    const e = new ct(this.builder);
    return e.spec = Object.assign({}, this.spec, t), e;
  }
  optionality(t) {
    return this.clone({
      optional: t
    });
  }
  optional() {
    return this.optionality(!0);
  }
  resolve(t) {
    return this._resolve(t.value, t);
  }
  cast(t, e) {
    return this._resolve(t, e).cast(t, e);
  }
  asNestedTest(t) {
    let {
      key: e,
      index: r,
      parent: a,
      options: o
    } = t, x = a[r ?? e];
    return this._resolve(x, Object.assign({}, o, {
      value: x,
      parent: a
    })).asNestedTest(t);
  }
  validate(t, e) {
    return gr(() => this._resolve(t, e).validate(t, e));
  }
  validateSync(t, e) {
    return this._resolve(t, e).validateSync(t, e);
  }
  validateAt(t, e, r) {
    return gr(() => this._resolve(e, r).validateAt(t, e, r));
  }
  validateSyncAt(t, e, r) {
    return this._resolve(e, r).validateSyncAt(t, e, r);
  }
  isValid(t, e) {
    try {
      return this._resolve(t, e).isValid(t, e);
    } catch (r) {
      if (x0.isError(r))
        return Promise.resolve(!1);
      throw r;
    }
  }
  isValidSync(t, e) {
    return this._resolve(t, e).isValidSync(t, e);
  }
  describe(t) {
    return t ? this.resolve(t).describe(t) : {
      type: "lazy",
      meta: this.spec.meta,
      label: void 0
    };
  }
  meta(...t) {
    if (t.length === 0) return this.spec.meta;
    let e = this.clone();
    return e.spec.meta = Object.assign(e.spec.meta || {}, t[0]), e;
  }
  get "~standard"() {
    const t = this;
    return {
      version: 1,
      vendor: "yup",
      async validate(r) {
        try {
          return {
            value: await t.validate(r, {
              abortEarly: !1
            })
          };
        } catch (a) {
          if (x0.isError(a))
            return {
              issues: ut(a)
            };
          throw a;
        }
      }
    };
  }
}
const n0 = () => X0().transform((c, t) => t).test("string-or-number", "value must be string or number", (c) => c === void 0 || typeof c == "string" || typeof c == "number"), je = s0({
  decimal: n0().required(),
  isHoneyPot: Dr().notRequired(),
  taxRate: n0().notRequired(),
  tokenContractAddress: K().required(),
  tokenSymbol: K().required(),
  tokenUnitPrice: n0().required()
}).required(), sa = s0({
  dexName: K().required(),
  percent: n0().required()
}).required(), Or = s0({
  dexProtocol: sa,
  fromToken: je,
  fromTokenIndex: n0().notRequired(),
  toToken: je,
  toTokenIndex: n0().notRequired(),
  subRouterList: L0().notRequired()
}).required(), oa = s0({
  router: K().notRequired(),
  routerPercent: n0().notRequired(),
  subRouterList: L0(Or).notRequired()
}).required();
s0({
  amountOut: n0(),
  dexLogo: K().required(),
  dexName: K().required(),
  tradeFee: n0()
}).required();
const ua = L0(aa((c) => c && c.subRouterList ? oa : Or)).required(), xa = s0({
  chainId: n0().notRequired(),
  chainIndex: n0().required(),
  contextSlot: n0().notRequired(),
  dexRouterList: ua,
  estimateGasFee: n0().required(),
  fromToken: je,
  fromTokenAmount: n0().required(),
  priceImpactPercent: n0().notRequired(),
  priceImpactPercentage: n0().notRequired(),
  router: K().notRequired(),
  swapMode: K().notRequired(),
  // quoteCompareList: Yup.array(quoteCompareSchema).required(),
  toToken: je,
  toTokenAmount: n0().required(),
  tradeFee: n0().notRequired()
}).required(), ca = s0({
  data: K().required(),
  from: K().required(),
  gas: n0().notRequired(),
  gasPrice: n0().notRequired(),
  maxPriorityFeePerGas: n0().notRequired(),
  maxSpendAmount: n0().notRequired(),
  minReceiveAmount: n0().required(),
  signatureData: L0().of(K()).notRequired(),
  slippagePercent: n0().notRequired(),
  to: K().required(),
  value: n0().required()
}).required(), fa = s0({
  routerResult: xa,
  tx: ca
}).required(), la = s0({
  code: X0().test("code-type", "code must be string or number", (c) => typeof c == "string" || typeof c == "number").required(),
  data: L0(fa).required(),
  msg: K().nullable()
}).required();
class ha {
  constructor(t, e) {
    this.connection = t, this.swapUrl = "https://web3.okx.com", this.swapRequestPath = "/api/v6/dex/aggregator/swap", this.solanaChainIndex = "501", this.onchainGatewayBasePath = "/api/v6/dex/pre-transaction", this.postTransactionBasePath = "/api/v6/dex/post-transaction", this.logger = it({ prefix: "OKX", isDebug: !!(e != null && e.isDebug) });
  }
  /**
   * Estimate swap output and gas data using OKX swap + simulation + gas-limit APIs.
   *
   * @example
   * const estimate = await okx.estimate(params, { from: userPubkey, okxApiConfig });
   * console.log(estimate.gas, estimate.addons?.amountOut);
   */
  async estimate(t, e) {
    var p, m, E;
    const r = await this.getSwapData(t, e ?? {});
    this.logger.debug("simulateTransaction input", { swapData: r, override: e });
    const a = await this.simulateTransaction(r, e);
    this.logger.debug("getGasLimit input", { override: e });
    const o = await this.getGasLimit(r, e);
    this.logger.debug("bufferGasLimit input", { gasLimit: o });
    const x = this.bufferGasLimit(o);
    this.logger.debug("updateGasLimit input", { callDataLength: r.tx.data.length, bufferedGasLimit: x });
    const s = await this.updateGasLimit(r.tx.data, x), h = `${(r == null ? void 0 : r.routerResult.toTokenAmount) || "0"}`, u = new V0(`${((p = r == null ? void 0 : r.routerResult) == null ? void 0 : p.toToken.decimal) || "0"}`), l = new V0(`${((E = (m = r == null ? void 0 : r.routerResult) == null ? void 0 : m.toToken) == null ? void 0 : E.tokenUnitPrice) || "0"}`), y = u.isFinite() ? u.integerValue(V0.ROUND_FLOOR).toNumber() : 0, d = new V0(h).shiftedBy(-y).multipliedBy(l);
    return {
      to: r.tx.to,
      gas: `${x || 0}`,
      data: s,
      addons: {
        amountOut: `${r.routerResult.toTokenAmount}`,
        amountOutUsd: d.toFixed(2),
        minAmountOut: `${r.tx.minReceiveAmount}`,
        simulationError: a == null ? void 0 : a.failReason,
        simulationGasUsed: `${(a == null ? void 0 : a.gasUsed) ?? ""}`,
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            amount: "",
            swaps: this.buildProtocolSwaps(r.routerResult.dexRouterList)
          }
        ]
      }
    };
  }
  /**
   * Fetch a single OKX swap payload for Solana.
   *
   * @example
   * const swapData = await okx.getSwapData(params, { from: userPubkey, okxApiConfig });
   */
  async getSwapData(t, e = {}) {
    const r = await this.getSwapInfo(t, e), a = (r == null ? void 0 : r.data) ?? [];
    if (a.length === 0)
      throw new Error("Okx swap data empty");
    return a[0];
  }
  /**
   * Update gas limit in OKX swap transaction data and return base58-encoded bytes.
   *
   * @example
   * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
   */
  async updateGasLimit(t, e) {
    this.logger.debug("Updating gas limit in transaction"), this.logger.debug("Transaction data length", { length: t.length, gasLimit: e });
    const r = this.deserializeOkxTransaction(t), a = r instanceof $0 ? "versioned" : "legacy";
    switch (a) {
      case "versioned": {
        const o = this.updateVersionedTransactionGasLimit(r, e), x = this.encodeUpdatedGasLimitTransaction(o);
        return this.logger.debug("Transaction gas limit updated and encoded successfully ", a), x;
      }
      default: {
        const o = this.updateLegacyTransactionGasLimit(r, e), x = this.encodeUpdatedGasLimitTransaction(o);
        return this.logger.debug("Transaction gas limit updated and encoded successfully", a), x;
      }
    }
  }
  updateVersionedTransactionGasLimit(t, e) {
    this.logger.debug("Number of instructions in OKX transaction", {
      count: t.message.compiledInstructions.length
    });
    const r = new Ne("ComputeBudget111111111111111111111111111111"), a = t.message.staticAccountKeys.findIndex((y) => y.equals(r));
    if (a !== -1) {
      this.logger.debug("ComputeBudget program found", { index: a });
      const y = t.message.compiledInstructions.filter((d) => d.programIdIndex === a);
      this.logger.debug("Number of ComputeBudget instructions", { count: y.length });
      for (let d = 0; d < y.length; d += 1) {
        const p = y[d], m = p.data;
        if (m.length === 0)
          continue;
        const E = m[0];
        switch (this.logger.debug("ComputeBudget instruction", { index: d, type: E }), E) {
          case 0: {
            if (m.length < 5)
              break;
            const A = new DataView(m.buffer, m.byteOffset, m.length), C = A.getUint32(1, !0);
            if (this.logger.debug("Compute unit limit", { computeUnits: C }), e) {
              this.logger.debug("Gas limit from API", { gasLimit: e });
              const g = parseInt(e, 10);
              Number.isFinite(g) && C !== g && (this.logger.debug("Compute units mismatch", { okx: C, api: g }), A.setUint32(1, g, !0), p.data = m);
            }
            break;
          }
          case 1: {
            if (m.length < 9)
              break;
            const C = new DataView(m.buffer, m.byteOffset, m.length).getBigUint64(1, !0);
            this.logger.debug("Compute unit price", { microLamports: C.toString() });
            break;
          }
        }
      }
      return t;
    }
    if (!e)
      return t;
    this.logger.debug("No ComputeBudget program found - OKX transaction may not have compute budget instructions"), this.logger.debug("Adding ComputeBudget instruction with gas limit", { gasLimit: e });
    const o = Buffer.alloc(5);
    o[0] = 0, o.writeUInt32LE(parseInt(e, 10), 1);
    const x = [...t.message.staticAccountKeys, r], h = [
      {
        programIdIndex: x.length - 1,
        accountKeyIndexes: [],
        data: o
      },
      ...t.message.compiledInstructions
    ], u = new Wr({
      header: t.message.header,
      staticAccountKeys: x,
      recentBlockhash: t.message.recentBlockhash,
      compiledInstructions: h,
      addressTableLookups: t.message.addressTableLookups
    }), l = new $0(u);
    return this.logger.debug("Added ComputeBudget instruction with gas limit", { gasLimit: e }), l;
  }
  updateLegacyTransactionGasLimit(t, e) {
    this.logger.debug("Number of instructions in legacy transaction", { count: t.instructions.length });
    const r = new Ne("ComputeBudget111111111111111111111111111111"), a = t.instructions.filter((h) => h.programId.equals(r));
    if (!(a.length === 0 && !!e))
      return this.logger.debug("Found existing ComputeBudget instructions", { count: a.length }), t;
    this.logger.debug("No ComputeBudget instructions found in legacy transaction"), this.logger.debug("Adding ComputeBudget instruction with gas limit", { gasLimit: e });
    const x = Buffer.alloc(5);
    x[0] = 0, x.writeUInt32LE(parseInt(e, 10), 1);
    const s = {
      programId: r,
      keys: [],
      data: x
    };
    return t.instructions.unshift(s), this.logger.debug("Added ComputeBudget instruction to legacy transaction"), t;
  }
  encodeUpdatedGasLimitTransaction(t) {
    let e;
    switch (t instanceof $0 ? "versioned" : "legacy") {
      case "versioned": {
        e = t.serialize();
        break;
      }
      case "legacy":
      default: {
        e = t.serialize({ requireAllSignatures: !1, verifySignatures: !1 });
        break;
      }
    }
    return J0.encode(e);
  }
  /**
   * * This function is not currently in use; it's prepared for future use.
   * Sign OKX swap transaction data with a local signer and return base58-encoded bytes.
   *
   * @example
   * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
   * const signedTx = await okx.signTransaction(updatedCallData, signer);
   * const orderId = await okx.broadcastTransaction(signedTx, signer.publicKey.toBase58(), { okxApiConfig });
   * this logic is in https://web3.okx.com/build/dev-docs/wallet-api/dex-use-swap-solana-quick-start#7.-complete-implementation
   */
  async signTransaction(t, e) {
    this.logger.debug("Signing transaction");
    const r = Gr.fromSecretKey(e.secretKey);
    this.logger.debug("Transaction data length", { length: t.length });
    try {
      const a = this.deserializeOkxTransaction(t), o = await this.connection.getLatestBlockhash();
      this.logger.debug("Got recent blockhash", { blockhash: o.blockhash }), a instanceof $0 ? (this.logger.debug("Number of instructions in OKX transaction", {
        count: a.message.compiledInstructions.length
      }), a.message.recentBlockhash = o.blockhash, a.sign([r]), this.logger.debug("Signed VersionedTransaction")) : (this.logger.debug("Number of instructions in legacy transaction", { count: a.instructions.length }), a.recentBlockhash = o.blockhash, a.sign(r), this.logger.debug("Signed legacy Transaction"));
      const x = a.serialize(), s = J0.encode(x);
      return this.logger.debug("Transaction signed and encoded successfully"), s;
    } catch (a) {
      throw this.logger.debug("Failed to process OKX transaction data", { message: a.message }), new Error(`Cannot process OKX transaction data: ${a.message}`);
    }
  }
  /**
   * * This function is not currently in use; it's prepared for future use.
   * Broadcast a signed transaction via OKX Onchain Gateway API.
   *
   * @example
   * const orderId = await okx.broadcastTransactionViaOkx(signedTx, walletAddress, { okxApiConfig });
   */
  async broadcastTransactionViaOkx(t, e, r, a = {}) {
    var l, y;
    if (!e)
      throw new Error("Wallet address is required for broadcast");
    const o = this.requireOkxApiConfig(r), x = this.buildBroadcastExtraData(a), s = {
      signedTx: t,
      chainIndex: this.solanaChainIndex,
      address: e
    };
    x && (s.extraData = x);
    const h = await this.callOkxApi({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/broadcast-transaction`,
      okxApiConfig: o,
      body: s
    });
    if (h.code !== "0")
      throw new Error(h.msg ?? "Error when broadcast transaction");
    const u = (y = (l = h.data) == null ? void 0 : l[0]) == null ? void 0 : y.orderId;
    if (!u)
      throw new Error("Okx broadcast response empty");
    return u;
  }
  /**
   * * This function is not currently in use; it's prepared for future use.
   * Broadcast a signed transaction directly to Solana RPC.
   *
   * @example
   * const signature = await okx.broadcastTransactionViaRpc(signedTx);
   */
  async broadcastTransactionViaRpc(t, e = {}) {
    const r = J0.decode(t), a = await this.connection.sendRawTransaction(r, {
      skipPreflight: e.skipPreflight ?? !1,
      preflightCommitment: e.preflightCommitment ?? "processed"
    }), o = await this.connection.confirmTransaction(a, e.confirmCommitment ?? "confirmed");
    if (o.value.err)
      throw new Error(`Transaction failed: ${JSON.stringify(o.value.err)}`);
    return a;
  }
  /**
   * * This function is not currently in use; it's prepared for future use.
   * Poll order status via OKX Onchain Gateway API until success, failure, or timeout.
   *
   * @example
   * const order = await okx.trackTransaction(orderId, { from: userPubkey, okxApiConfig }, { intervalMs: 5000 });
   * console.log(order.txStatus, order.txHash);
   */
  async trackTransaction(t, e, r = {}) {
    var l, y, d;
    const a = this.requireOkxApiConfig(e), o = this.requireFromAddress(e), x = r.intervalMs ?? 5e3, s = r.timeoutMs ?? 18e4, h = Date.now();
    let u = "";
    for (; Date.now() - h < s; ) {
      const p = await this.callOkxApi({
        method: "GET",
        path: `${this.postTransactionBasePath}/orders`,
        okxApiConfig: a,
        query: {
          orderId: t,
          chainIndex: this.solanaChainIndex,
          address: o,
          limit: "1"
        }
      });
      if (p.code !== "0")
        throw new Error(p.msg ?? "Error when track transaction");
      const m = (d = (y = (l = p.data) == null ? void 0 : l[0]) == null ? void 0 : y.orders) == null ? void 0 : d[0];
      if (!m) {
        await this.sleep(x);
        continue;
      }
      if (m.txStatus !== u && (u = m.txStatus, this.logger.debug("Okx order status", { status: u, txHash: m.txHash ?? "" })), m.txStatus === "2")
        return m;
      if (m.txStatus === "3")
        throw new Error(m.failReason ?? "Transaction failed");
      await this.sleep(x);
    }
    throw new Error(`Transaction tracking timed out after ${s}ms`);
  }
  name() {
    return "okx";
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enabled(t) {
    return !0;
  }
  deserializeOkxTransaction(t) {
    const e = J0.decode(t);
    this.logger.debug("Decoded transaction bytes length", { length: e.length });
    try {
      const r = $0.deserialize(e);
      return this.logger.debug("Successfully deserialized as VersionedTransaction"), r;
    } catch (r) {
      this.logger.debug("VersionedTransaction failed, trying legacy Transaction");
      try {
        const a = mr.from(e);
        return this.logger.debug("Successfully deserialized as legacy Transaction"), a;
      } catch (a) {
        throw this.logger.debug("Both transaction types failed to deserialize"), this.logger.debug("VersionedTransaction error", { message: r.message }), this.logger.debug("Legacy Transaction error", { message: a.message }), new Error("Failed to deserialize OKX transaction data. Data may be corrupted.");
      }
    }
  }
  /**
   * Buffer gasLimit after estimate
   *
   * References
   * https://github.com/solana-developers/helpers?tab=readme-ov-file#addcomputeinstructions => multiplier 1.1
   * https://www.quicknode.com/guides/solana-development/transactions/how-to-optimize-solana-transactions?#compute-unit-optimization => max 1.4m
   * https://chainstack.com/solana-transaction-serialization-signatures-fees-and-runtime-execution/amp
   */
  bufferGasLimit(t) {
    const e = Number(t);
    if (!Number.isFinite(e) || e <= 0)
      return t;
    const o = Math.min(Math.ceil(e * 1.1), 14e5);
    return o !== e && this.logger.debug("Buffered gas limit", {
      original: e,
      buffered: o
    }), o.toString();
  }
  buildQueryString(t) {
    const e = new URLSearchParams();
    for (const [a, o] of Object.entries(t))
      o != null && o !== "" && e.append(a, o);
    const r = e.toString();
    return r ? `?${r}` : "";
  }
  async callOkxApi({
    method: t,
    path: e,
    okxApiConfig: r,
    query: a,
    body: o
  }) {
    const x = (/* @__PURE__ */ new Date()).toISOString(), s = a ? this.buildQueryString(a) : "", h = o ? JSON.stringify(o) : "", u = this.getHeaders(x, t, e, s, r, h), l = await fetch(`${this.swapUrl}${e}${s}`, {
      method: t,
      headers: u,
      body: h || void 0
    }), y = await l.json();
    if (!l.ok) {
      const d = (y == null ? void 0 : y.msg) || (y == null ? void 0 : y.error) || JSON.stringify(y);
      throw new Error(d);
    }
    return y;
  }
  buildProtocolSwaps(t) {
    if (!Array.isArray(t))
      return [];
    const e = t, r = e[0], a = r == null ? void 0 : r.subRouterList;
    return Array.isArray(a) && a.length > 0 ? a.map((o) => {
      const x = o, h = Array.isArray(x.dexProtocol) ? x.dexProtocol[0] : x.dexProtocol, u = x.fromToken, l = x.toToken, y = typeof (h == null ? void 0 : h.dexName) == "string" ? h.dexName : "";
      return {
        amount: "",
        from: (u == null ? void 0 : u.tokenContractAddress) ?? "",
        pool: y,
        protocol: y,
        to: (l == null ? void 0 : l.tokenContractAddress) ?? ""
      };
    }) : e.map((o) => {
      const x = o, h = Array.isArray(x.dexProtocol) ? x.dexProtocol[0] : x.dexProtocol, u = x.fromToken, l = x.toToken, y = typeof (h == null ? void 0 : h.dexName) == "string" ? h.dexName : "";
      return {
        amount: "",
        from: (u == null ? void 0 : u.tokenContractAddress) ?? "",
        pool: y,
        protocol: y,
        to: (l == null ? void 0 : l.tokenContractAddress) ?? ""
      };
    });
  }
  requireOkxApiConfig(t) {
    if (!(t != null && t.okxApiConfig))
      throw new Error("Okx swap need api config");
    return t.okxApiConfig;
  }
  requireFromAddress(t) {
    var r;
    const e = (r = t == null ? void 0 : t.from) == null ? void 0 : r.toString();
    if (!e)
      throw new Error("Unknown user public key");
    return e;
  }
  buildBroadcastExtraData(t) {
    if (!t.enableMevProtection && !t.jitoSignedTx)
      return;
    const e = {};
    return t.enableMevProtection && (e.enableMevProtection = !0), t.jitoSignedTx && (e.jitoSignedTx = t.jitoSignedTx), JSON.stringify(e);
  }
  async sleep(t) {
    await new Promise((e) => setTimeout(e, t));
  }
  getHeaders(t, e, r, a = "", o, x = "") {
    const s = t + e + r + (a || x);
    return {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": o.api_key,
      "OK-ACCESS-SIGN": or.enc.Base64.stringify(or.HmacSHA256(s, o.secret_key)),
      "OK-ACCESS-TIMESTAMP": t,
      "OK-ACCESS-PASSPHRASE": o.passphrase,
      "OK-ACCESS-PROJECT": o.project
    };
  }
  /**
   * Fetch compute unit estimate from OKX Onchain Gateway API.
   *
   * @example
   * const gasLimit = await okx.getGasLimit(swapData, { okxApiConfig });
   */
  async getGasLimit(t, e) {
    var s, h, u;
    const r = this.requireOkxApiConfig(e), a = t == null ? void 0 : t.tx;
    if (!(a != null && a.from) || !a.to)
      throw new Error("Okx gas limit requires transaction addresses");
    this.logger.debug("Gas limit request", {
      chainIndex: this.solanaChainIndex,
      fromAddress: a.from,
      toAddress: a.to,
      txAmount: `${a.value || 0}`,
      inputDataLength: ((s = a.data) == null ? void 0 : s.length) ?? 0,
      inputDataPrefix: a.data ? a.data.slice(0, 32) : ""
    });
    const o = await this.callOkxApi({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/gas-limit`,
      okxApiConfig: r,
      body: {
        chainIndex: this.solanaChainIndex,
        fromAddress: a.from,
        toAddress: a.to,
        txAmount: `${a.value || "0"}`,
        extJson: {
          inputData: a.data ?? ""
        }
      }
    });
    if (this.logger.debug("Gas limit response", {
      code: o.code,
      msg: o.msg ?? "",
      data: o.data ?? []
    }), o.code !== "0")
      throw new Error(o.msg ?? "Error when get gas limit");
    const x = (u = (h = o.data) == null ? void 0 : h[0]) == null ? void 0 : u.gasLimit;
    if (!x)
      throw new Error("Okx gas limit response empty");
    return x;
  }
  /**
   * Simulate a swap transaction using OKX Onchain Gateway API.
   *
   * @example
   * const sim = await okx.simulateTransaction(swapData, { okxApiConfig }, { includeDebug: true });
   */
  async simulateTransaction(t, e, r) {
    var u;
    const a = this.requireOkxApiConfig(e), o = t == null ? void 0 : t.tx;
    if (!(o != null && o.data))
      throw new Error("Okx simulate requires transaction data");
    if (!o.from || !o.to)
      throw new Error("Okx simulate requires transaction addresses");
    const x = {
      chainIndex: this.solanaChainIndex,
      fromAddress: o.from,
      toAddress: o.to,
      txAmount: `${o.value || "0"}`,
      extJson: {
        inputData: o.data
      }
    };
    r != null && r.includeDebug && (x.includeDebug = !0);
    const s = await this.callOkxApi({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/simulate`,
      okxApiConfig: a,
      body: x
    });
    if (s.code !== "0")
      throw new Error(s.msg ?? "Error when simulate transaction");
    const h = (u = s.data) == null ? void 0 : u[0];
    if (!h)
      throw new Error("Simulation response empty");
    if (h.failReason || h.success === !1) {
      const l = h.failReason || h.error || "Unknown simulation error";
      throw new Error(`Simulation failed: ${l}`);
    }
    return h;
  }
  async getSwapInfo(t, e) {
    var h;
    const r = this.requireOkxApiConfig(e), a = this.requireFromAddress(e), o = {
      amount: t.amount.toString(),
      // this chainIndex is defined in okx api
      // https://web3.okx.com/build/dev-docs/dex-api/dex-supported-chain#other-chains
      chainIndex: this.solanaChainIndex,
      fromTokenAddress: t.fromToken.toString(),
      toTokenAddress: t.toToken.toString(),
      userWalletAddress: a,
      slippagePercent: t.slippage,
      feePercent: ((h = t == null ? void 0 : t.fee) == null ? void 0 : h.toString()) ?? "0.2"
    };
    e != null && e.fromTokenReferrerWalletAddress && (o.fromTokenReferrerWalletAddress = e == null ? void 0 : e.fromTokenReferrerWalletAddress), e != null && e.toTokenReferrerWalletAddress && (o.toTokenReferrerWalletAddress = e == null ? void 0 : e.toTokenReferrerWalletAddress), e != null && e.computeUnitPrice && (o.computeUnitPrice = e.computeUnitPrice), e != null && e.computeUnitLimit && (o.computeUnitLimit = e.computeUnitLimit), e != null && e.directRoute && (o.directRoute = e.directRoute.toString()), e != null && e.priceImpactProtectionPercentage && (o.priceImpactProtectionPercentage = e.priceImpactProtectionPercentage), e != null && e.autoSlippage && (o.autoSlippage = e.autoSlippage), e != null && e.maxAutoSlippage && (o.maxAutoSlippage = e.maxAutoSlippage), this.logger.debug("Swap request params", o);
    const x = await this.callOkxApi({
      method: "GET",
      path: this.swapRequestPath,
      okxApiConfig: r,
      query: o
    });
    this.logger.debug("Okx swap data response", x);
    const s = await la.validate(x, {
      abortEarly: !1
    });
    if (String(s == null ? void 0 : s.code) !== "0")
      throw this.logger.debug("validatedData", { msg: (s == null ? void 0 : s.msg) ?? "" }), new Error((s == null ? void 0 : s.msg) ?? "Error when get swap data");
    return s;
  }
}
class da {
  constructor(t) {
    this.connection = t, this.swapper = {}, this.estimate = {
      swap: this._estimateSwap.bind(this),
      transfer: this._estimateTransfer.bind(this)
    };
  }
  async transfer(t) {
    if (!t.signer)
      throw new Error("Signer is required");
    const e = new Ne(t.tokenAddress), r = await mt(e, t.signer.publicKey), a = await mt(e, new Ne(t.to)), o = new mr().add(
      Vr(r, a, t.signer.publicKey, Number(t.amount), [], Xr)
    ), { blockhash: x } = await this.connection.getLatestBlockhash();
    return o.recentBlockhash = x, o.feePayer = t.signer.publicKey, o.sign(t.signer), await this.connection.sendRawTransaction(o.serialize(), { skipPreflight: !1 });
  }
  async swap(t, e) {
    const r = Buffer.from(e.data, "base64"), a = new Uint8Array(r), o = $0.deserialize(a);
    return o.sign([t]), await this.connection.sendRawTransaction(o.serialize(), {
      maxRetries: 2,
      skipPreflight: !0
    });
  }
  async load(t) {
    if (this.swapper[t.name()])
      throw new Error(`Swapper already loaded. ${t.name()}`);
    this.swapper[t.name()] = t;
  }
  async _estimateTransfer(t, e) {
    throw new Error("Method not implemented.");
  }
  async _estimateSwap(t, e) {
    const r = t.prefferRouters || Object.keys(this.swapper);
    if (r.length === 0)
      throw new Error("No router available");
    if (!(e != null && e.from))
      throw new Error("From address is required");
    let a;
    for (const o of r) {
      const x = this.swapper[o];
      if (x && x.enabled(1399811149))
        try {
          return await Promise.race([
            x.estimate(t, e),
            new Promise((h, u) => setTimeout(() => u(new Error("Timeout")), 3e4))
          ]);
        } catch (s) {
          a = s;
        }
    }
    throw a || new Error("No router available");
  }
}
const pa = s0({
  info: s0().test("is-record-string-string", "info must be an object Record<string, string>", (c) => typeof c != "object" || c === null ? !1 : Object.values(c).every((t) => typeof t == "string"))
}).required(), ga = s0({
  ammKey: K().required(),
  label: K().required(),
  inputMint: K().required(),
  outputMint: K().required(),
  inAmount: K().required(),
  outAmount: K().required(),
  feeAmount: K().required(),
  feeMint: K().required()
}).required(), ma = s0({
  swapInfo: ga,
  percent: E0().required()
}).required(), va = s0({
  amount: K().required(),
  feeBps: E0().required()
}).nullable(), Ba = s0({
  inputMint: K().required(),
  inAmount: K().required(),
  outputMint: K().required(),
  outAmount: K().required(),
  swapMode: K().required(),
  slippageBps: E0().required().nullable(),
  platformFee: va,
  priceImpactPct: K().required().nullable(),
  routePlan: L0(ma).required(),
  swapUsdValue: K().required(),
  mostReliableAmmsQuoteReport: pa.nullable()
}), Ea = s0({
  microLamports: E0().required(),
  estimatedMicroLamports: E0().required()
}).required(), ya = s0({
  computeBudget: Ea
}).required(), Aa = s0({
  errorCode: K().required(),
  error: K().required()
}).nullable(), Ca = s0({
  swapTransaction: K().required(),
  lastValidBlockHeight: E0().required(),
  prioritizationFeeLamports: E0().required(),
  computeUnitLimit: E0().required(),
  prioritizationType: ya,
  simulationSlot: E0().required().nullable(),
  simulationError: Aa,
  addressesByLookupTableAddress: X0().required().nullable(),
  dynamicSlippageReport: X0().required().nullable()
}), Fa = {
  SOLANA_JUPITER_API_KEY: ""
};
class ba {
  constructor(t, e) {
    this.connection = t, this.swapUrl = "https://lite-api.jup.ag", this.swapUrlPro = "https://quote-api.jup.ag", this.logger = it({ prefix: "JUPITER", isDebug: !!(e != null && e.debug) });
  }
  estimateComputeLamports(t) {
    const { computeUnitLimit: e, prioritizationType: r } = t, { microLamports: a } = r.computeBudget;
    return Math.round(e * (a / 1e6));
  }
  async estimate(t, e) {
    var y;
    if (!(e != null && e.from))
      throw new Error("Unknown user public key");
    this.logger.debug("getQuote input", { params: t, override: e });
    const r = await this.getQuote(t, e);
    this.logger.debug("getSwapInfo input", { quote: r, override: e });
    const a = await this.getSwapInfo(r, e);
    if (a != null && a.simulationError)
      throw new Error(a == null ? void 0 : a.simulationError.error);
    const o = this.estimateComputeLamports(a), x = Buffer.from(a.swapTransaction, "base64"), s = $0.deserialize(Uint8Array.from(x)), h = await this.connection.getFeeForMessage(s.message, "confirmed");
    let u = (h == null ? void 0 : h.value) ?? 5e3;
    o > 0 && (u += o);
    const l = {
      to: "",
      gas: u.toString(),
      data: a.swapTransaction,
      addons: {
        amountOut: r.outAmount,
        amountOutUsd: r.swapUsdValue,
        minAmountOut: r.outAmount,
        simulationError: a == null ? void 0 : a.simulationError,
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            // amount: refers to the amount of funds received when using this pathway.
            amount: new V0((y = r.routePlan) == null ? void 0 : y[r.routePlan.length - 1].swapInfo.outAmount).toString(),
            // swaps: provides details about the transaction routes, specifying through which tokens the funds are exchanged and by which protocols the swaps are executed.
            swaps: r.routePlan.map((d) => ({
              amount: d.swapInfo.outAmount,
              from: d.swapInfo.inputMint,
              pool: d.swapInfo.ammKey,
              protocol: d.swapInfo.label,
              to: d.swapInfo.outputMint
            }))
          }
        ]
      }
    };
    return this.logger.debug("result", l), l;
  }
  name() {
    return "jupiter";
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enabled(t) {
    return !0;
  }
  createQuoteSearchParams(t, e, r) {
    var a, o, x;
    return t.searchParams.append("inputMint", e.fromToken.toString()), t.searchParams.append("outputMint", e.toToken.toString()), t.searchParams.append("amount", e.amount.toString()), t.searchParams.append("platformFeeBps", (Number((e == null ? void 0 : e.fee) ?? 0.02) * 100).toString()), t.searchParams.append("slippageBps", (Number(e.slippage) * 100).toString()), t.searchParams.append("restrictIntermediateTokens", ((a = r == null ? void 0 : r.restrictIntermediateTokens) == null ? void 0 : a.toString()) ?? "true"), t.searchParams.append("onlyDirectRoutes", ((o = r == null ? void 0 : r.onlyDirectRoutes) == null ? void 0 : o.toString()) ?? "false"), t.searchParams.append("asLegacyTransaction", ((x = r == null ? void 0 : r.asLegacyTransaction) == null ? void 0 : x.toString()) ?? "false"), r != null && r.swapMode && t.searchParams.append("swapMode", r.swapMode.toString()), r != null && r.maxAccounts && t.searchParams.append("maxAccounts", r.maxAccounts.toString()), t;
  }
  // https://dev.jup.ag/docs/api/swap-api/quote
  async getQuote(t, e) {
    const r = new URL(`${this.swapUrl}/swap/v1/quote`);
    this.createQuoteSearchParams(r, t, e), this.logger.debug("Jupiter quote", { url: r.toString() });
    let a = await fetch(r.toString(), {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!a.ok && e.apiKey) {
      const s = new URL(`${this.swapUrlPro}/v6/quote`);
      this.createQuoteSearchParams(s, t, e), this.logger.debug("Jupiter quote", { url: s.toString() }), a = await fetch(s.toString(), {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": e.apiKey ?? Fa.SOLANA_JUPITER_API_KEY
        }
      });
    }
    if (!a.ok) {
      const s = await a.json().catch(() => {
      });
      this.logger.debug("errorData getSwapInfo", s);
      const h = (s == null ? void 0 : s.error) ?? "Something wrong";
      throw new Error(h);
    }
    const o = await a.json();
    return await Ba.validate(o, {
      abortEarly: !1
    });
  }
  // https://dev.jup.ag/docs/api/swap-api/swap
  async getSwapInfo(t, e) {
    if (!(e != null && e.from))
      throw new Error("Unknown user public key");
    const r = {
      quoteResponse: t,
      userPublicKey: e == null ? void 0 : e.from.toString(),
      dynamicSlippage: (e == null ? void 0 : e.dynamicSlippage) ?? !1,
      dynamicComputeUnitLimit: (e == null ? void 0 : e.dynamicComputeUnitLimit) ?? !1
    };
    e != null && e.feeAccount && (r.feeAccount = e.feeAccount), e != null && e.computeUnitPriceMicroLamports || (r.prioritizationFeeLamports = {
      priorityLevelWithMaxLamports: {
        maxLamports: (e == null ? void 0 : e.maxLamports) ?? 15e6,
        priorityLevel: "veryHigh"
      }
    }), e != null && e.computeUnitPriceMicroLamports && (r.computeUnitPriceMicroLamports = e.computeUnitPriceMicroLamports), this.logger.debug("bodyObject", r);
    let a = await fetch(`${this.swapUrl}/swap/v1/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // 'x-api-key': '' // enter api key here
      },
      body: JSON.stringify(r)
    });
    if (!a.ok && (e != null && e.apiKey) && (a = await fetch(`${this.swapUrlPro}/v6/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": e.apiKey
        // enter api key here
      },
      body: JSON.stringify(r)
    })), !a.ok) {
      const s = await a.json();
      this.logger.debug("errorData getQuote", s);
      const h = s.error || JSON.stringify(s);
      throw new Error(h);
    }
    const o = await a.json(), x = await Ca.validate(o, {
      abortEarly: !1
    });
    return this.logger.debug("getSwapInfo", x), x;
  }
}
const Je = /* @__PURE__ */ new Map(), et = /* @__PURE__ */ new Map();
async function Oa(c, t) {
  if (c === "evm")
    return wa(t);
  if (c === "solana")
    return Da(t);
  throw new Error("Unsupported protocol");
}
async function wa(c) {
  if (!Je.has(c)) {
    const a = await new j0.providers.JsonRpcProvider(c).getNetwork().then((x) => x.chainId), o = new j0.providers.StaticJsonRpcProvider(c, a);
    Je.set(c, o);
  }
  const t = Je.get(c), e = new Zr(t);
  return e.load(new en(t)), e.load(new rn()), e.load(new tn()), e;
}
async function Da(c) {
  if (!et.has(c)) {
    const r = new Kr(c);
    et.set(c, r);
  }
  const t = et.get(c), e = new da(t);
  return e.load(new ha(t)), e.load(new ba(t)), e;
}
export {
  Oa as load
};
