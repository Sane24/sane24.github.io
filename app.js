// GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`.
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/react.ts
  function getReact() {
    const R = window.React;
    if (!R) throw new Error("dc-runtime: window.React is not available yet");
    return R;
  }
  function getReactDOM() {
    const RD = window.ReactDOM;
    if (!RD) throw new Error("dc-runtime: window.ReactDOM is not available yet");
    return RD;
  }
  var h = ((...args) => getReact().createElement(
    ...args
  ));

  // src/parse.ts
  function parseDcDocument(doc) {
    const dc = doc.querySelector("x-dc");
    if (!dc) return null;
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template: dc.innerHTML,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDcText(src) {
    const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);
    if (!openMatch) return null;
    const close = src.lastIndexOf("</x-dc>");
    if (close === -1 || close < openMatch.index) return null;
    const template = src.slice(openMatch.index + openMatch[0].length, close);
    const doc = new DOMParser().parseFromString(src, "text/html");
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDataProps(raw) {
    if (!raw) return { props: null, preview: null };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { props: null, preview: null };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { props: null, preview: null };
    }
    const obj = parsed;
    const preview = obj.$preview && typeof obj.$preview === "object" ? obj.$preview : null;
    const rest = {};
    for (const k of Object.keys(obj)) {
      if (k[0] !== "$") rest[k] = obj[k];
    }
    return { props: Object.keys(rest).length ? rest : null, preview };
  }
  function dcNameFromPath(pathname) {
    let p = pathname || "";
    try {
      p = decodeURIComponent(p);
    } catch {
    }
    const base = p.split("/").pop() || "Root";
    return base.replace(/\.dc\.html$/, "").replace(/\.html?$/, "") || "Root";
  }

  // src/boot.ts
  var BASE_CSS = `
    .sc-placeholder{background:color-mix(in srgb,currentColor 8%,transparent);
      border:1px solid color-mix(in srgb,currentColor 50%,transparent);
      border-radius:2px;box-sizing:border-box;overflow:hidden}
    @keyframes sc-shine{0%{background-position:100% 50%}100%{background-position:0% 50%}}
    html.sc-dc-streaming .sc-placeholder,
    html.sc-dc-streaming .sc-interp.sc-missing{position:relative;
      background:color-mix(in srgb,currentColor 5%,transparent);
      border-color:transparent}
    html.sc-dc-streaming .sc-placeholder::before,
    html.sc-dc-streaming .sc-interp.sc-missing::before{content:'';
      position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(90deg,rgba(217,119,87,0) 25%,rgba(247,225,211,.95) 37%,rgba(217,119,87,0) 63%);
      background-size:400% 100%;animation:sc-shine 1.4s ease infinite}
    html.sc-dc-streaming .sc-placeholder:nth-child(n+9 of .sc-placeholder)::before,
    html.sc-dc-streaming .sc-interp.sc-missing:nth-child(n+9 of .sc-interp.sc-missing)::before{animation:none;
      background:color-mix(in srgb,currentColor 8%,transparent)}
    .sc-placeholder-error{padding:4px 8px;font:11px/1.4 ui-monospace,monospace;
      color:color-mix(in srgb,currentColor 70%,transparent);word-break:break-word}
    .sc-interp.sc-missing{display:inline-block;width:2em;height:1em;overflow:hidden;
      vertical-align:text-bottom;background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);
      border-radius:2px;box-sizing:border-box;color:transparent;
      user-select:none}
    .sc-interp.sc-unresolved{font-family:ui-monospace,monospace;font-size:.85em;
      color:color-mix(in srgb,currentColor 50%,transparent);
      background:color-mix(in srgb,currentColor 10%,transparent);border-radius:3px;
      padding:0 3px}
    .sc-host.sc-has-error{position:relative}
    .sc-logic-error{position:absolute;top:8px;left:8px;z-index:2147483647;max-width:60ch;
      padding:6px 10px;background:#b00020;color:#fff;font:12px/1.4 ui-monospace,monospace;
      border-radius:4px;white-space:pre-wrap;pointer-events:none}
    /* Mirrors PRINT_BASELINE_CSS in apps/web deck-stage-export.ts \u2014 keep both
       in sync until dc-runtime regains a build step. */
    @media print {
      @page { margin: 0.5cm; }
      figure, table { break-inside: avoid; }
      #dc-root, #dc-root > .sc-host { height: auto; }
      *, *::before, *::after {
        print-color-adjust: exact; -webkit-print-color-adjust: exact;
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        animation-delay: -99s !important; animation-duration: .001s !important;
        animation-iteration-count: 1 !important; animation-fill-mode: both !important;
        animation-play-state: running !important; transition-duration: 0s !important;
      }
    }
  `;
  var FULL_PAGE_CSS = "html,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}";
  function rootNameForDocument(doc, loc) {
    let bootPath = loc.pathname || "";
    if (!/\.dc\.html?$/i.test(safeDecode(bootPath))) {
      try {
        bootPath = new URL(doc.baseURI || "/").pathname;
      } catch {
      }
    }
    return dcNameFromPath(bootPath);
  }
  function safeDecode(s) {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }
  function boot(runtime, doc = document) {
    const parsed = parseDcDocument(doc);
    if (!parsed) return null;
    const React = getReact();
    const rootName = rootNameForDocument(doc, location);
    runtime.markFetched(rootName);
    runtime.setRootName(rootName);
    runtime.adoptParsed(rootName, parsed);
    fetch(location.href).then((res) => res.ok ? res.text() : "").then((t) => {
      const raw = t ? parseDcText(t) : null;
      if (raw?.template) runtime.updateHtml(rootName, raw.template);
    }).catch(() => {
    });
    const dc = doc.querySelector("x-dc");
    const hostEl = doc.createElement("div");
    hostEl.id = "dc-root";
    dc.replaceWith(hostEl);
    if (!parsed.preview) {
      const s = doc.createElement("style");
      s.textContent = FULL_PAGE_CSS;
      doc.head.appendChild(s);
    }
    const Root = runtime.getDC(rootName);
    const entry = runtime.registry.get(rootName);
    function StandaloneRoot() {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const sub = () => setTick((n) => n + 1);
        entry.subs.add(sub);
        return () => {
          entry.subs.delete(sub);
        };
      }, []);
      const defaults = React.useMemo(() => {
        const d = {};
        for (const k in entry.propsMeta || {}) {
          const v = entry.propsMeta?.[k]?.default;
          if (v !== void 0) d[k] = v;
        }
        return d;
      }, [entry.propsMeta]);
      return h(Root, { ...defaults, ...entry.propOverrides || {} });
    }
    const ReactDOM = getReactDOM();
    if (ReactDOM.createRoot)
      ReactDOM.createRoot(hostEl).render(h(StandaloneRoot));
    else ReactDOM.render(h(StandaloneRoot), hostEl);
    return rootName;
  }

  // src/expr.ts
  var IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
  var NUMBER_RE = /^-?\d+(\.\d+)?$/;
  function resolve(vals, src) {
    const expr = String(src).trim();
    if (!expr) return void 0;
    if (expr[0] === "(" && expr[expr.length - 1] === ")" && parensWrapWhole(expr)) {
      return resolve(vals, expr.slice(1, -1));
    }
    const eq = findTopLevelEquality(expr);
    if (eq) {
      const lv = resolve(vals, expr.slice(0, eq.index));
      const rv = resolve(vals, expr.slice(eq.index + eq.op.length));
      switch (eq.op) {
        case "===":
          return lv === rv;
        case "!==":
          return lv !== rv;
        case "==":
          return lv == rv;
        default:
          return lv != rv;
      }
    }
    if (expr[0] === "!") return !resolve(vals, expr.slice(1));
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;
    if (expr === "undefined") return void 0;
    if (NUMBER_RE.test(expr)) return Number(expr);
    if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) {
      return expr.slice(1, -1);
    }
    return resolvePath(vals, expr);
  }
  function parensWrapWhole(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") {
        depth--;
        if (depth === 0) return false;
      }
    }
    return true;
  }
  function findTopLevelEquality(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      if (c === "[" || c === "(") depth++;
      else if (c === "]" || c === ")") depth--;
      else if (depth === 0 && (c === "=" || c === "!") && expr[i + 1] === "=") {
        if (i > 0 && (expr[i - 1] === "=" || expr[i - 1] === "!")) continue;
        if (!expr.slice(0, i).trim()) continue;
        const op = expr[i + 2] === "=" ? c + "==" : c + "=";
        return { index: i, op };
      }
    }
    return null;
  }
  function resolvePath(vals, expr) {
    const head = expr.match(IDENT_RE);
    if (!head) return void 0;
    let cur = vals == null ? void 0 : vals[head[0]];
    let i = head[0].length;
    while (i < expr.length) {
      if (expr[i] === ".") {
        const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/);
        if (!m) return void 0;
        cur = cur == null ? void 0 : cur[m[0]];
        i += 1 + m[0].length;
      } else if (expr[i] === "[") {
        let depth = 1;
        let j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === "[") depth++;
          else if (expr[j] === "]") {
            depth--;
            if (depth === 0) break;
          }
          j++;
        }
        if (depth !== 0) return void 0;
        const key = resolve(vals, expr.slice(i + 1, j));
        cur = cur == null ? void 0 : cur[key];
        i = j + 1;
      } else {
        return void 0;
      }
    }
    return cur;
  }

  // src/encode.ts
  var CAMEL_ATTR = "sc-camel-";
  var INLINE_TEXT_TAGS = new Set(
    "a abbr b bdi bdo br cite code del dfn em i ins kbd mark q s samp small span strike strong sub sup u var wbr".split(
      " "
    )
  );
  var RAW_WRAP = {
    select: "sc-raw-select",
    table: "sc-raw-table",
    tbody: "sc-raw-tbody",
    thead: "sc-raw-thead",
    tfoot: "sc-raw-tfoot",
    tr: "sc-raw-tr",
    td: "sc-raw-td",
    th: "sc-raw-th",
    caption: "sc-raw-caption"
  };
  var RAW_UNWRAP = Object.fromEntries(
    Object.entries(RAW_WRAP).map(([k, v]) => [v, k])
  );
  var EVENT_MAP = {
    onclick: "onClick",
    onchange: "onChange",
    oninput: "onInput",
    onsubmit: "onSubmit",
    onkeydown: "onKeyDown",
    onkeyup: "onKeyUp",
    onkeypress: "onKeyPress",
    onmousedown: "onMouseDown",
    onmouseup: "onMouseUp",
    onmouseenter: "onMouseEnter",
    onmouseleave: "onMouseLeave",
    onfocus: "onFocus",
    onblur: "onBlur",
    ondoubleclick: "onDoubleClick",
    oncontextmenu: "onContextMenu"
  };
  var ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
  var IMPORT_SELF_CLOSE_RE = new RegExp(
    "<(x-import|dc-import)(" + ATTRS + ")/>",
    "gi"
  );
  var CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
  function encodeCase(html) {
    html = html.replace(
      IMPORT_SELF_CLOSE_RE,
      (_, t, a) => "<" + t + a + "></" + t + ">"
    );
    html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1");
    html = html.replace(/<\/helmet\s*>/gi, "</sc-helmet>");
    html = html.replace(
      CAMEL_ATTR_RE,
      (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + eq
    );
    for (const [real, alias] of Object.entries(RAW_WRAP)) {
      html = html.replace(
        new RegExp("(</?)" + real + "(?=[\\s>])", "gi"),
        "$1" + alias
      );
    }
    return html;
  }
  function kebabToCamel(s) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  function cssToObj(css) {
    const o = {};
    for (const decl of css.split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      o[prop.startsWith("--") ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
    }
    return o;
  }
  function compileAttr(raw) {
    const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (whole) {
      const path = whole[1];
      return (vals) => resolve(vals, path);
    }
    if (raw.includes("{{")) {
      const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
      return (vals) => parts.map((s, i) => i & 1 ? resolve(vals, s) ?? "" : s).join("");
    }
    return () => raw;
  }

  // src/compile.ts
  function collectProps(node, kind, host) {
    const propGetters = [];
    const pseudoClasses = [];
    let hintSize = null;
    for (const { name, value } of [...node.attributes]) {
      if (name === "sc-name" || name === "data-dc-tpl") continue;
      let key = name;
      if (key.startsWith(CAMEL_ATTR))
        key = kebabToCamel(key.slice(CAMEL_ATTR.length));
      if (key === "hint-size") {
        hintSize = value;
        continue;
      }
      if (key.startsWith("style-")) {
        pseudoClasses.push(host.pseudoClass(key.slice(6), value));
        continue;
      }
      if (kind !== "dom") {
        if (key.includes("-") && !(kind === "x-import" && (key.startsWith("aria-") || key.startsWith("data-"))))
          key = kebabToCamel(key);
      } else {
        if (key === "class") key = "className";
        else if (key === "for") key = "htmlFor";
        else if (key.startsWith("on"))
          key = EVENT_MAP[key] || "on" + key[2].toUpperCase() + key.slice(3);
      }
      propGetters.push([key, compileAttr(value)]);
    }
    return { propGetters, pseudoClasses, hintSize };
  }
  var HOST_STYLE_PROPS = /* @__PURE__ */ new Set([
    "position",
    "left",
    "right",
    "top",
    "bottom",
    "inset",
    "width",
    "height",
    "z-index",
    "transform"
  ]);
  function hostPositionStyle(style) {
    const all = typeof style === "string" ? cssToObj(style) : style != null && typeof style === "object" ? style : null;
    if (!all) return void 0;
    const out = {};
    for (const [k, v] of Object.entries(all)) {
      const kebab = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
      if (HOST_STYLE_PROPS.has(kebab)) out[k] = v;
    }
    return Object.keys(out).length ? out : void 0;
  }
  function compileTemplate(html, host) {
    const tpl = document.createElement("template");
    //! nosemgrep: direct-inner-html-assignment
    tpl.innerHTML = encodeCase(html);
    let tplN = 0;
    (function stamp(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.setAttribute("data-dc-tpl", String(tplN++));
      }
      for (const c of node.childNodes) stamp(c);
    })(tpl.content);
    const builders = walkChildren(tpl.content, host);
    const render = ((vals, ctx) => builders.map((b, i) => b(vals || {}, ctx, i)));
    render.__annotated = tpl.innerHTML;
    return render;
  }
  function walkChildren(node, host) {
    return [...node.childNodes].map((c) => walk(c, host)).filter((b) => b != null);
  }
  function walk(node, host) {
    if (node.nodeType === Node.TEXT_NODE) return walkText(node);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === "sc-for") return walkFor(el, host);
    if (tag === "sc-if") return walkIf(el, host);
    if (tag === "x-import") return walkXImport(el, host);
    if (tag === "sc-helmet") return host.helmet(el);
    if (tag === "dc-import") return walkComponent(el, host);
    return walkElement(el, host);
  }
  var warnedHoles = /* @__PURE__ */ new Set();
  function warnUnresolved(ctx, what) {
    const key = (ctx?.__name || "?") + "\0" + what;
    if (warnedHoles.has(key)) return;
    warnedHoles.add(key);
    console.warn("[dc-runtime] " + (ctx?.__name || "template") + ": " + what);
  }
  function walkText(node) {
    const txt = node.nodeValue ?? "";
    if (!txt.includes("{{")) {
      if (!txt.trim() && !txt.includes(" ")) return null;
      return () => txt;
    }
    const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
    return (vals, ctx, key) => h(
      getReact().Fragment,
      { key },
      ...parts.map((p, i) => {
        if (!(i & 1)) return p;
        const v = resolve(vals, p);
        if (v === void 0) {
          if (!ctx?.__streamingNow) {
            if (document.body?.hasAttribute("data-dc-editor-on")) {
              return h(
                "span",
                { key: i, className: "sc-interp sc-unresolved" },
                "{{ " + p.trim() + " }}"
              );
            }
            warnUnresolved(
              ctx,
              "{{ " + p.trim() + " }} never resolved \u2014 rendered as empty"
            );
            return null;
          }
          return h(
            "span",
            { key: i, className: "sc-interp sc-missing" },
            p.trim()
          );
        }
        if (getReact().isValidElement(v) || Array.isArray(v)) {
          return h(getReact().Fragment, { key: i }, v);
        }
        if (v === null || typeof v === "boolean") return null;
        return h("span", { key: i, className: "sc-interp" }, String(v));
      })
    );
  }
  function walkFor(el, host) {
    const listGet = compileAttr(el.getAttribute("list") || "");
    const asName = el.getAttribute("as") || "item";
    const hintN = parseInt(el.getAttribute("hint-placeholder-count") || "0", 10);
    const kids = walkChildren(el, host);
    const listSrc = el.getAttribute("list") || "";
    return (vals, ctx, key) => {
      let list = listGet(vals);
      if (!Array.isArray(list)) {
        if (!ctx?.__streamingNow) {
          if (list !== void 0 && list !== null) {
            warnUnresolved(
              ctx,
              'sc-for list="' + listSrc + '" is not an array (' + typeof list + ")"
            );
          }
          list = [];
        } else {
          list = hintN > 0 ? Array(hintN).fill(void 0) : [];
        }
      }
      return h(
        getReact().Fragment,
        { key },
        list.map((item, i) => {
          const sub = { ...vals, [asName]: item, $index: i };
          return h(
            getReact().Fragment,
            { key: i },
            kids.map((b, j) => b(sub, ctx, j))
          );
        })
      );
    };
  }
  function walkIf(el, host) {
    const valGet = compileAttr(el.getAttribute("value") || "");
    const hintRaw = el.getAttribute("hint-placeholder-val");
    const hintGet = hintRaw != null ? compileAttr(hintRaw) : null;
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      let v = valGet(vals);
      if (v === void 0 && hintGet && ctx?.__streamingNow) v = hintGet(vals);
      return v ? h(
        getReact().Fragment,
        { key },
        kids.map((b, j) => b(vals, ctx, j))
      ) : null;
    };
  }
  function walkComponent(el, host) {
    const name = el.getAttribute("name") || el.getAttribute("component") || "";
    el.removeAttribute("name");
    el.removeAttribute("component");
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const { propGetters, hintSize } = collectProps(el, "dc-import", host);
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      const props = {
        key,
        __hintSize: hintSize,
        __tplId: tplId,
        __hostStyle: styleGet ? hostPositionStyle(styleGet(vals)) : void 0
      };
      for (const [k, g] of propGetters) {
        const v = g(vals);
        if (k === "dcProps") {
          if (v && typeof v === "object") Object.assign(props, v);
          continue;
        }
        props[k] = v;
      }
      if (kids.length) props.children = kids.map((b, j) => b(vals, ctx, j));
      return h(host.component(name), props);
    };
  }
  function walkXImport(el, host) {
    const globalNameGet = compileAttr(
      el.getAttribute("component-from-global-scope") || ""
    );
    const exportNameGet = compileAttr(
      el.getAttribute("component") || el.getAttribute("name") || ""
    );
    const fromRaw = el.getAttribute("from") || el.getAttribute("src") || el.getAttribute("import") || "";
    const urls = fromRaw.trim() ? fromRaw.trim().split(/\s+/) : [];
    const url = urls.length ? urls[urls.length - 1] : "";
    const kindOf = (u) => /\.(jsx|tsx)(\?|#|$)/i.test(u) ? "jsx" : "js";
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const wrap = tplId != null || styleGet != null;
    const { propGetters, hintSize } = collectProps(el, "x-import", host);
    const hasContent = el.children.length > 0 || !!(el.textContent || "").trim();
    const kids = hasContent ? walkChildren(el, host) : [];
    const urlBindable = fromRaw.includes("{{");
    if (urls.length && !urlBindable) {
      let prev;
      for (const u of urls) prev = host.loadExternal(kindOf(u), u, prev);
    }
    const evalName = (g, vals) => {
      const v = g(vals);
      const s = v == null ? "" : String(v);
      return s.includes("{{") ? "" : s;
    };
    return (vals, ctx, key) => {
      const globalName = evalName(globalNameGet, vals);
      const name = globalName || evalName(exportNameGet, vals);
      const C = !name || urlBindable ? null : globalName ? host.resolveExternalGlobal(url, globalName) : host.resolveExternal(url, name);
      const hostStyle = styleGet ? hostPositionStyle(styleGet(vals)) : void 0;
      const wrapper = wrap ? {
        key,
        className: "sc-host-x",
        "data-dc-tpl": tplId,
        style: hostStyle || { display: "contents" }
      } : null;
      if (!C) {
        const error = urlBindable ? "x-import `from` cannot contain {{ \u2026 }} \u2014 module URLs are resolved at parse time; use a literal URL" : host.resolveExternalError(url, name);
        const ph = host.placeholder({
          key: wrapper ? void 0 : key,
          name,
          hintSize,
          error
        });
        return wrapper ? h("div", wrapper, ph) : ph;
      }
      const props = wrapper ? {} : { key };
      let unresolvedHole = false;
      for (const [k, g] of propGetters) {
        if (k === "component" || k === "componentFromGlobalScope" || k === "from") {
          continue;
        }
        const v = g(vals);
        if (v === void 0) unresolvedHole = true;
        if (k === "dcProps") {
          if (v && typeof v === "object") Object.assign(props, v);
          continue;
        }
        props[k] = v;
      }
      if (unresolvedHole && ctx?.__htmlStreamingNow) {
        const ph = host.placeholder({
          key: wrapper ? void 0 : key,
          name,
          hintSize,
          error: null
        });
        return wrapper ? h("div", wrapper, ph) : ph;
      }
      if (kids.length) props.children = kids.map((b, j) => b(vals, ctx, j));
      return wrapper ? h("div", wrapper, h(C, props)) : h(C, props);
    };
  }
  function contentKey(el) {
    const clone = el.cloneNode(true);
    for (const d of clone.querySelectorAll("*")) {
      while (d.attributes.length) d.removeAttribute(d.attributes[0].name);
    }
    const s = clone.innerHTML;
    let h2 = 5381;
    for (let i = 0; i < s.length; i++) h2 = (h2 << 5) + h2 + s.charCodeAt(i) | 0;
    return s.length + "." + (h2 >>> 0).toString(36);
  }
  var NEVER_CONTENT_KEYED = new Set(
    "script style textarea option title select canvas iframe video audio".split(
      " "
    )
  );
  var NOT_INLINE_SELECTOR = ":not(" + [...INLINE_TEXT_TAGS].join(",") + ")";
  function walkElement(el, host) {
    const realTag = RAW_UNWRAP[el.localName] || el.localName;
    const tplId = el.getAttribute("data-dc-tpl");
    const inlineOnly = el.childNodes.length > 0 && !NEVER_CONTENT_KEYED.has(realTag) && el.querySelector(NOT_INLINE_SELECTOR) === null;
    const keySuffix = inlineOnly ? "|" + contentKey(el) : "";
    const { propGetters, pseudoClasses } = collectProps(el, "dom", host);
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      const props = {
        key: key + keySuffix,
        "data-dc-tpl": tplId
      };
      for (const [k, g] of propGetters) {
        let v = g(vals);
        if (k === "style" && typeof v === "string") v = cssToObj(v);
        if ((k === "value" || k === "checked") && v === void 0) {
          v = k === "checked" ? false : "";
        }
        props[k] = v;
      }
      if (pseudoClasses.length) {
        props.className = [props.className, ...pseudoClasses].filter(Boolean).join(" ");
      }
      return h(realTag, props, ...kids.map((b, j) => b(vals, ctx, j)));
    };
  }

  // src/logic.ts
  var StreamableLogic = class {
    constructor(props) {
      __publicField(this, "props");
      __publicField(this, "state", {});
      /** Back-pointer to the wrapper component, installed after construction. */
      __publicField(this, "__host");
      this.props = props || {};
    }
    setState(update, cb) {
      this.__host && this.__host.__setLogicState(update, cb);
    }
    forceUpdate() {
      this.__host && this.__host.forceUpdate();
    }
    componentDidMount() {
    }
    componentDidUpdate(_prevProps) {
    }
    componentWillUnmount() {
    }
    /** The flat object the template renders against (merged over props). */
    renderVals() {
      return {};
    }
  };
  function evalDcLogic(src) {
    //! nosemgrep: eval-and-function-constructor
    const fn = new Function(
      "DCLogic",
      "StreamableLogic",
      "React",
      src + '\n;return (typeof Component!=="undefined"&&Component)||undefined;'
    );
    return fn(StreamableLogic, StreamableLogic, getReact());
  }

  // src/component.ts
  function shallowEqual(a, b) {
    if (!b) return false;
    const ak = Object.keys(a).filter((k) => k !== "children");
    const bk = Object.keys(b).filter((k) => k !== "children");
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  }
  function Placeholder({
    name,
    hintSize,
    streaming,
    error
  }) {
    const [w, hgt] = (hintSize || "100%,60px").split(",");
    return h(
      "div",
      {
        className: "sc-placeholder" + (streaming ? " sc-streaming" : ""),
        style: { width: w.trim(), height: hgt && hgt.trim() },
        title: name
      },
      error ? h(
        "div",
        { className: "sc-placeholder-error" },
        (name ? name + ": " : "") + error
      ) : null
    );
  }
  function hintToMin(hint) {
    if (!hint) return void 0;
    const [w, hgt] = hint.split(",");
    return { minWidth: w.trim(), minHeight: hgt && hgt.trim() };
  }
  function createComponentFactory(registry, ensureFetched) {
    const React = getReact();
    const AncestorContext = React.createContext([]);
    class StreamableComponent extends React.Component {
      constructor(props) {
        super(props);
        __publicField(this, "__name");
        __publicField(this, "__sub");
        __publicField(this, "__needsDidMount", false);
        /** Snapshot of the registry's streaming flags taken at render time —
         *  builders read it off the RenderCtx (this) to pick placeholder vs
         *  render-nothing for unresolved values. */
        __publicField(this, "__streamingNow", false);
        __publicField(this, "__htmlStreamingNow", false);
        /** When a construct throws, remember the (class, registry.ver, props)
         *  triple so render-time reconcile doesn't re-attempt it on every parent
         *  re-render. A registry bump (new class, template, external module
         *  resolving via bumpAll) changes `ver` and breaks the memo so an
         *  env-dependent constructor can self-heal. */
        __publicField(this, "__failedLogic", null);
        __publicField(this, "__failedUserProps", null);
        __publicField(this, "__failedVer", -1);
        /** Per-instance constructor error — kept here (not on the registry entry)
         *  so one instance's successful construct can't hide a sibling's failure,
         *  and a construct can never wipe an eval error `updateJs` recorded on
         *  `r.logicError`. */
        __publicField(this, "__ctorError", null);
        __publicField(this, "logic");
        this.__name = props.__name;
        this.state = { __v: 0, __err: null };
        this.__sub = () => {
          if (this.state.__err) this.setState({ __err: null });
          this.forceUpdate();
        };
        this.__makeLogic(registry.get(this.__name).Logic, null);
        ensureFetched(this.__name);
      }
      /** Error-boundary hook: a render crash anywhere in this DC's subtree
       *  (its own template, an x-import'd component, a child DC without its
       *  own deeper boundary) lands here instead of unmounting the page. */
      static getDerivedStateFromError(e) {
        return { __err: e instanceof Error && e.message ? e.message : String(e) };
      }
      componentDidCatch(e, info) {
        console.error(
          "[dc-runtime] render error in <" + this.__name + ">:",
          e,
          info?.componentStack || ""
        );
      }
      /** Instantiate the logic class (or the no-op base) and adopt `prevState`
       *  over its initial state — used both at mount and on hot-swap. */
      __makeLogic(Logic, prevState) {
        const L = Logic || StreamableLogic;
        try {
          this.logic = new L(this.__userProps());
          this.__failedLogic = null;
          this.__failedUserProps = null;
          this.__ctorError = null;
        } catch (e) {
          console.error(e);
          this.__failedLogic = Logic;
          this.__failedUserProps = this.__userProps();
          this.__failedVer = registry.get(this.__name).ver;
          this.__ctorError = this.__name + ": " + (e instanceof Error && e.message ? e.message : String(e));
          this.logic = new StreamableLogic(
            this.__userProps()
          );
        }
        this.logic.__host = this;
        if (prevState)
          this.logic.state = { ...this.logic.state || {}, ...prevState };
      }
      /** The props the author's logic + template see — internal __-prefixed
       *  wiring stripped. */
      __userProps() {
        const { __name, __hintSize, __tplId, __hostStyle, ...rest } = this.props;
        return rest;
      }
      __setLogicState(update, cb) {
        const prev = this.logic.state;
        const patch = typeof update === "function" ? update(prev) : update;
        this.logic.state = { ...prev, ...patch };
        this.setState((s) => ({ __v: s.__v + 1 }), cb);
      }
      /** Swap the logic instance when the registry's Logic class changed
       *  (streaming completion, hot reload). State carries over; didMount
       *  re-fires after the swap commits so refs exist. */
      __reconcileLogic() {
        const r = registry.get(this.__name);
        const Next = r.Logic;
        const Cur = this.logic.constructor;
        if (Next === Cur || !Next && Cur === StreamableLogic || Next === this.__failedLogic && r.ver === this.__failedVer && shallowEqual(this.__userProps(), this.__failedUserProps)) {
          return;
        }
        if (!this.__needsDidMount) {
          try {
            this.logic.componentWillUnmount();
          } catch (e) {
            console.error(e);
          }
        }
        this.__makeLogic(Next, this.logic.state);
        this.__needsDidMount = true;
      }
      componentDidMount() {
        registry.get(this.__name).subs.add(this.__sub);
        try {
          this.logic.componentDidMount();
        } catch (e) {
          console.error(e);
        }
      }
      componentDidUpdate(prevProps) {
        this.logic.props = this.__userProps();
        if (this.__needsDidMount) {
          if (this.state.__err || !registry.get(this.__name).tpl) return;
          this.__needsDidMount = false;
          try {
            this.logic.componentDidMount();
          } catch (e) {
            console.error(e);
          }
        } else {
          try {
            this.logic.componentDidUpdate(prevProps);
          } catch (e) {
            console.error(e);
          }
        }
      }
      componentWillUnmount() {
        registry.get(this.__name).subs.delete(this.__sub);
        if (!this.__needsDidMount) {
          try {
            this.logic.componentWillUnmount();
          } catch (e) {
            console.error(e);
          }
        }
      }
      render() {
        const r = registry.get(this.__name);
        const cls = "sc-host" + (r.htmlStreaming ? " sc-streaming-html" : "") + (r.jsStreaming ? " sc-streaming-js" : "");
        const hintStyle = r.htmlStreaming ? hintToMin(this.props.__hintSize) : void 0;
        const hostStyle = this.props.__hostStyle || hintStyle ? { ...hintStyle || {}, ...this.props.__hostStyle || {} } : void 0;
        const hostBase = {
          className: cls,
          style: hostStyle,
          "data-sc-name": this.__name,
          "data-dc-tpl": this.props.__tplId
        };
        const chain = Array.isArray(this.context) ? this.context : [];
        if (chain.includes(this.__name)) {
          const cycle = [
            ...chain.slice(chain.indexOf(this.__name)),
            this.__name
          ].join(" \u2192 ");
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: "circular import: " + cycle
            })
          );
        }
        if (this.state.__err) {
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(
              "div",
              { className: "sc-logic-error", "data-omelette-chrome": "" },
              this.__name + ": " + this.state.__err
            ),
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: this.state.__err
            })
          );
        }
        this.__reconcileLogic();
        if (!r.tpl) {
          return h(
            "div",
            hostBase,
            h(Placeholder, { name: this.__name, hintSize: this.props.__hintSize })
          );
        }
        const userProps = this.__userProps();
        this.logic.props = userProps;
        let vals = userProps;
        let renderErr = r.logicError || this.__ctorError;
        try {
          vals = { ...userProps, ...this.logic.renderVals() || {} };
        } catch (e) {
          console.error(e);
          renderErr = this.__name + ".renderVals(): " + (e instanceof Error && e.message ? e.message : String(e));
        }
        this.__streamingNow = !!(r.htmlStreaming || r.jsStreaming);
        this.__htmlStreamingNow = !!r.htmlStreaming;
        return h(
          "div",
          { ...hostBase, className: cls + (renderErr ? " sc-has-error" : "") },
          renderErr && h(
            "div",
            { className: "sc-logic-error", "data-omelette-chrome": "" },
            renderErr
          ),
          h(
            AncestorContext.Provider,
            { value: [...chain, this.__name] },
            r.tpl(vals, this)
          )
        );
      }
    }
    __publicField(StreamableComponent, "contextType", AncestorContext);
    const named = /* @__PURE__ */ new Map();
    function getDC(name) {
      const hit = named.get(name);
      if (hit) return hit;
      function Dispatcher(p) {
        const [, setTick] = React.useState(0);
        React.useEffect(() => {
          const sub = () => setTick((n) => n + 1);
          registry.get(name).subs.add(sub);
          return () => {
            registry.get(name).subs.delete(sub);
          };
        }, []);
        ensureFetched(name);
        return h(StreamableComponent, { ...p, __name: name });
      }
      Dispatcher.displayName = name;
      named.set(name, Dispatcher);
      return Dispatcher;
    }
    return {
      getDC,
      StreamableComponent
    };
  }

  // src/external.ts
  var isCustomElementName = (n) => !n.includes(".") && n.includes("-");
  function isRenderableType(g) {
    if (typeof g === "function") return !isElementClass(g);
    return typeof g === "object" && g !== null && typeof g.$$typeof === "symbol";
  }
  function resolveDottedPath(root, name) {
    let cur = root;
    for (const seg of name.split(".")) {
      if (cur == null) return void 0;
      cur = cur[seg];
    }
    return cur;
  }
  var BABEL_URL = "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js";
  var BABEL_SRI = "sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y";
  var GLOBAL_POLL_INTERVAL_MS = 50;
  var GLOBAL_POLL_TIMEOUT_MS = 3e4;
  function createExternalModules(onResolved) {
    const cache = /* @__PURE__ */ new Map();
    let babelLoading = null;
    const reportedMissing = /* @__PURE__ */ new Map();
    const polling = /* @__PURE__ */ new Set();
    function ensureBabel() {
      if (window.Babel) return Promise.resolve();
      if (babelLoading) return babelLoading;
      babelLoading = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BABEL_URL;
        s.integrity = BABEL_SRI;
        s.crossOrigin = "anonymous";
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
      return babelLoading;
    }
    const pending = /* @__PURE__ */ new Map();
    function load(kind, url, after) {
      const existing = pending.get(url);
      if (existing) return existing;
      cache.set(url, null);
      console.info("[dc-runtime] x-import: loading", url, "(" + kind + ")");
      const ready = Promise.all([
        kind === "jsx" ? ensureBabel() : Promise.resolve(),
        after ?? Promise.resolve()
      ]);
      const p = ready.then(() => fetch(url)).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      }).then((src) => {
        const code = kind === "jsx" ? window.Babel.transform(src, {
          filename: url,
          presets: ["react", "typescript"]
        }).code : src;
        const module = { exports: {} };
        const before = new Set(Object.keys(window));
        //! nosemgrep: eval-and-function-constructor
        new Function("React", "module", "exports", "require", code)(
          getReact(),
          module,
          module.exports,
          () => ({})
        );
        const globals = {};
        for (const k of Object.keys(window)) {
          if (!before.has(k) && typeof window[k] === "function") {
            globals[k] = window[k];
          }
        }
        cache.set(url, { mod: module.exports, globals });
        console.info(
          "[dc-runtime] x-import: loaded",
          url,
          "\u2014 exports:",
          Object.keys(module.exports),
          "window globals:",
          Object.keys(globals)
        );
        onResolved();
      }).catch((e) => {
        cache.set(url, {
          mod: {},
          globals: {},
          error: "failed to load: " + (e instanceof Error && e.message ? e.message : String(e))
        });
        console.error(
          "[dc-runtime] x-import: FAILED to load",
          url,
          "(" + kind + ")",
          e
        );
        onResolved();
      });
      pending.set(url, p);
      return p;
    }
    function resolve2(url, name) {
      const entry = cache.get(url);
      if (!entry) return null;
      const { mod, globals } = entry;
      const C = mod && mod[name] || globals && globals[name] || typeof window !== "undefined" && window[name] || mod && mod.default;
      if (typeof C === "function") return C;
      const key = url + "\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(
          key,
          entry.error || 'no export named "' + name + '" (has: ' + Object.keys(mod).join(", ") + ")"
        );
        console.error(
          "[dc-runtime] x-import: module",
          url,
          "loaded but has no component named",
          JSON.stringify(name),
          "\u2014 available exports:",
          Object.keys(mod),
          "window globals:",
          Object.keys(globals),
          ". The module must `module.exports = {" + name + "}` or set `window." + name + "`."
        );
      }
      return null;
    }
    function waitForGlobal(name) {
      if (polling.has(name)) return;
      polling.add(name);
      const started = Date.now();
      const isCE = isCustomElementName(name);
      const tick = () => {
        const found = isCE ? customElements.get(name) : isRenderableType(resolveDottedPath(window, name));
        if (found) {
          polling.delete(name);
          onResolved();
          return;
        }
        if (Date.now() - started >= GLOBAL_POLL_TIMEOUT_MS) {
          console.warn(
            "[dc-runtime] x-import: global",
            JSON.stringify(name),
            "never appeared on window after " + GLOBAL_POLL_TIMEOUT_MS + "ms"
          );
          return;
        }
        setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
      };
      setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
    }
    function resolveGlobal(url, name) {
      const isCE = isCustomElementName(name);
      if (!url) {
        if (isCE) {
          if (customElements.get(name)) return name;
          waitForGlobal(name);
          return null;
        }
        const g2 = resolveDottedPath(window, name);
        if (isRenderableType(g2)) return g2;
        waitForGlobal(name);
        return null;
      }
      const entry = cache.get(url);
      if (!entry) return null;
      if (isCE && customElements.get(name)) return name;
      const g = entry.globals[name] ?? resolveDottedPath(window, name);
      if (isRenderableType(g)) return g;
      if (name.includes(".")) return null;
      const key = url + "\0global\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(key, null);
        if (isCE && !customElements.get(name)) {
          console.warn(
            "[dc-runtime] x-import:",
            url,
            "loaded but no custom element",
            JSON.stringify(name),
            "is registered and window." + name + " is not a function \u2014 rendering <" + name + "> as an unknown element."
          );
        }
      }
      return name;
    }
    function getError(url, name) {
      const entry = cache.get(url);
      if (entry?.error) return entry.error;
      return reportedMissing.get(url + "\0" + name) || null;
    }
    return { load, resolve: resolve2, resolveGlobal, getError };
  }
  function isElementClass(g) {
    try {
      return typeof g === "function" && typeof HTMLElement !== "undefined" && g.prototype instanceof HTMLElement;
    } catch {
      return false;
    }
  }

  // src/atomics.ts
  var ATOMIC_CSS = (
    // layout
    ".fx{display:flex}.col{display:flex;flex-direction:column}.grid{display:grid}.ac{align-items:center}.jc{justify-content:center}.jb{justify-content:space-between}.f1{flex:1}.noshrink{flex-shrink:0}.wrap{flex-wrap:wrap}.fw5{font-weight:500}.fw6{font-weight:600}.fw7{font-weight:700}.fw8{font-weight:800}.fs11{font-size:11px}.fs12{font-size:12px}.fs13{font-size:13px}.fs14{font-size:14px}.fs15{font-size:15px}.fs16{font-size:16px}.fs20{font-size:20px}.fs22{font-size:22px}.upper{text-transform:uppercase}.tc{text-align:center}.nowrap{white-space:nowrap}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap16{gap:16px}.gap24{gap:24px}.m0{margin:0}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.posrel{position:relative}.posabs{position:absolute}.round{border-radius:50%}.ohide{overflow:hidden}.bbox{box-sizing:border-box}.pointer{cursor:pointer}.w100{width:100%}.b0{border:none}"
  );

  // src/helmet.ts
  var DESIGN_DOC_MODE_RE = /<meta\b[^>]*\bname\s*=\s*["']design_doc_mode["'][^>]*\b(?:content|value)\s*=\s*["'](\w+)["']/i;
  var CANVAS_BG_LIGHT = "#f0eee6";
  var CANVAS_BG_DARK = "#2e2c26";
  function createHelmetManager(doc, isStreaming) {
    const mounted = /* @__PURE__ */ new Set();
    const live = /* @__PURE__ */ new Map();
    let designDocMode = null;
    let canvasStyleEl = null;
    let appTheme = "light";
    try {
      const ds = doc.documentElement.dataset.theme;
      appTheme = ds === "dark" || ds === "light" ? ds : new URLSearchParams(doc.defaultView?.location.search ?? "").get(
        "theme"
      ) === "dark" ? "dark" : "light";
    } catch {
    }
    function applyCanvasBg() {
      if (!canvasStyleEl) return;
      const bg = appTheme === "dark" ? CANVAS_BG_DARK : CANVAS_BG_LIGHT;
      canvasStyleEl.textContent = `html,body{background:${bg}}#dc-root>.sc-host{position:relative}`;
    }
    function postDesignMode(mode) {
      if (window.parent === window) return;
      try {
        window.parent.postMessage({ type: "__dc_design_mode", mode }, "*");
      } catch {
      }
    }
    function setDesignDocMode(mode) {
      if (mode === designDocMode) return;
      designDocMode = mode;
      postDesignMode(mode);
      if (mode === "canvas") {
        doc.documentElement.setAttribute("data-dc-canvas", "");
        canvasStyleEl = doc.createElement("style");
        canvasStyleEl.setAttribute("data-dc-canvas", "");
        applyCanvasBg();
        doc.head.appendChild(canvasStyleEl);
      } else {
        doc.documentElement.removeAttribute("data-dc-canvas");
        canvasStyleEl?.remove();
        canvasStyleEl = null;
      }
    }
    window.addEventListener("message", (e) => {
      const type = e.data && e.data.type;
      if (type === "__dc_theme") {
        const t = e.data.theme;
        if (t === "light" || t === "dark") {
          appTheme = t;
          doc.documentElement.dataset.theme = t;
          applyCanvasBg();
        }
        return;
      }
      if (!designDocMode || type !== "__dc_probe") return;
      postDesignMode(designDocMode);
    });
    function compile(node) {
      const raw = [...node.children];
      const helmetClosed = node.nextSibling != null || node.parentNode?.nextSibling != null;
      if (node.hasAttribute("data-dc-atomics") && !mounted.has("__dc-atomics")) {
        mounted.add("__dc-atomics");
        const el = doc.createElement("style");
        el.id = "__dc-atomics";
        el.textContent = ATOMIC_CSS;
        doc.head.appendChild(el);
      }
      return (_vals, ctx) => {
        const name = ctx && ctx.__name || "";
        const streaming = !!(name && isStreaming(name));
        for (let i = 0; i < raw.length; i++) {
          const child = raw[i];
          const tag = child.tagName;
          const mayBePartial = streaming && !helmetClosed && i === raw.length - 1;
          if (tag === "SCRIPT") {
            if (mayBePartial) continue;
            const key = "SCRIPT|" + (child.getAttribute("src") || child.textContent || "");
            if (mounted.has(key)) continue;
            mounted.add(key);
            const el = doc.createElement("script");
            for (const { name: an, value } of [...child.attributes])
              el.setAttribute(an, value);
            if (child.textContent) el.textContent = child.textContent;
            doc.head.appendChild(el);
          } else if (tag === "LINK" || tag === "META") {
            if (mayBePartial) continue;
            const key = tag + "|" + (child.getAttribute("href") || child.getAttribute("src") || child.outerHTML);
            if (mounted.has(key)) continue;
            mounted.add(key);
            doc.head.appendChild(child.cloneNode(true));
          } else {
            const key = name + "|" + i;
            let el = live.get(key);
            if (!el || el.tagName !== tag) {
              if (el) el.remove();
              el = doc.createElement(tag.toLowerCase());
              live.set(key, el);
              doc.head.appendChild(el);
            }
            for (const { name: an, value } of [...child.attributes]) {
              if (el.getAttribute(an) !== value) el.setAttribute(an, value);
            }
            if (el.textContent !== child.textContent)
              el.textContent = child.textContent;
          }
        }
        return null;
      };
    }
    return { compile, setDesignDocMode };
  }

  // src/pseudo.ts
  function createPseudoSheet(doc) {
    let el = null;
    const cache = /* @__PURE__ */ new Map();
    let n = 0;
    return (pseudo, css) => {
      const k = pseudo + "|" + css;
      const hit = cache.get(k);
      if (hit) return hit;
      if (!el) {
        el = doc.createElement("style");
        doc.head.appendChild(el);
      }
      const cls = "scp" + (n++).toString(36);
      const sel = pseudo === "before" || pseudo === "after" ? "." + cls + "::" + pseudo : "." + cls + ":" + pseudo;
      el.sheet.insertRule(sel + "{" + css + "}", el.sheet.cssRules.length);
      cache.set(k, cls);
      return cls;
    };
  }

  // src/registry.ts
  function createRegistry() {
    const entries = /* @__PURE__ */ Object.create(null);
    function get(name) {
      return entries[name] || (entries[name] = {
        html: "",
        tpl: null,
        Logic: null,
        jsStreaming: false,
        htmlStreaming: false,
        ver: 0,
        subs: /* @__PURE__ */ new Set(),
        fetched: false
      });
    }
    function bump(name) {
      const r = get(name);
      r.ver++;
      for (const fn of r.subs) fn();
    }
    return {
      entries,
      get,
      bump,
      bumpAll() {
        for (const n in entries) bump(n);
      }
    };
  }

  // src/runtime.ts
  var COMPONENT_DIR = ".";
  function createRuntime(doc = document) {
    const registry = createRegistry();
    const pseudoClass = createPseudoSheet(doc);
    const helmet = createHelmetManager(
      doc,
      (name) => registry.get(name).htmlStreaming
    );
    const external = createExternalModules(() => registry.bumpAll());
    const factory = createComponentFactory(registry, ensureFetched);
    const host = {
      component: (name) => factory.getDC(name),
      placeholder: (props) => h(Placeholder, props),
      helmet: (node) => helmet.compile(node),
      loadExternal: (kind, url, after) => external.load(kind, url, after),
      resolveExternal: (url, name) => external.resolve(url, name),
      resolveExternalGlobal: (url, name) => external.resolveGlobal(url, name),
      resolveExternalError: (url, name) => external.getError(url, name),
      pseudoClass
    };
    function ensureFetched(name) {
      const r = registry.get(name);
      if (r.fetched) return;
      r.fetched = true;
      const url = COMPONENT_DIR + "/" + encodeURIComponent(name) + ".dc.html";
      fetch(url).then((res) => {
        if (!res.ok) {
          console.error(
            "[dc-runtime] sibling fetch for <" + name + "/> failed:",
            url,
            "returned",
            res.status,
            "\u2014 the reference renders as an empty placeholder."
          );
          return "";
        }
        return res.text();
      }).then((t) => {
        if (!t) return;
        const parsed = parseDcText(t);
        if (!parsed) {
          console.error(
            "[dc-runtime] sibling fetch for <" + name + "/>:",
            url,
            "has no <x-dc> block \u2014 not a Design Component."
          );
          return;
        }
        if (parsed.props) r.propsMeta = parsed.props;
        if (parsed.preview) r.preview = parsed.preview;
        if (parsed.template && !r.html) updateHtml(name, parsed.template);
        if (parsed.js && !r.Logic) updateJs(name, parsed.js);
      }).catch(
        (e) => console.error(
          "[dc-runtime] sibling fetch for <" + name + "/> threw:",
          url,
          e
        )
      );
    }
    let rootName = null;
    function updateHtml(name, html) {
      const r = registry.get(name);
      r.html = html;
      if (name === rootName) {
        const mode = DESIGN_DOC_MODE_RE.exec(html)?.[1] ?? null;
        if (mode || !r.htmlStreaming) helmet.setDesignDocMode(mode);
      }
      try {
        r.tpl = compileTemplate(html, host);
      } catch (e) {
        console.error("[dc-runtime] template compile FAILED for", name, e);
      }
      registry.bump(name);
    }
    function updateJs(name, src) {
      const r = registry.get(name);
      const seq = r.jsSeq = (r.jsSeq || 0) + 1;
      try {
        const Cls = evalDcLogic(src);
        if (r.jsSeq !== seq) return;
        if (typeof Cls !== "function") {
          r.logicError = name + ".dc.html: <script data-dc-script> must define `class Component extends DCLogic`";
        } else {
          r.logicError = null;
          r.Logic = Cls;
        }
      } catch (e) {
        if (r.jsSeq !== seq) return;
        console.error(
          "[dc-runtime] logic class eval FAILED for",
          name,
          "\u2014 the template renders with props only.",
          e
        );
        r.logicError = name + ": " + (e instanceof Error && e.message ? e.message : String(e));
      }
      registry.bump(name);
    }
    function setStreaming(name, kind, on) {
      const r = registry.get(name);
      if (kind === "html") r.htmlStreaming = !!on;
      else r.jsStreaming = !!on;
      let any = false;
      for (const n in registry.entries) {
        const e = registry.entries[n];
        if (e && (e.htmlStreaming || e.jsStreaming)) {
          any = true;
          break;
        }
      }
      doc.documentElement.classList.toggle("sc-dc-streaming", any);
      registry.bump(name);
    }
    function dcUpdate(name, kind, content, streaming) {
      if (streaming) registry.get(name).fetched = true;
      if (kind === "html") {
        setStreaming(name, "html", !!streaming);
        updateHtml(name, content);
      } else if (kind === "js") {
        setStreaming(name, "js", !!streaming);
        if (!streaming) updateJs(name, content);
      } else if (kind === "props") {
        const { props, preview } = parseDataProps(content);
        const r = registry.get(name);
        r.propsMeta = props ?? void 0;
        r.preview = preview;
        registry.bump(name);
      }
    }
    function setProps(name, overrides) {
      registry.get(name).propOverrides = overrides && typeof overrides === "object" ? { ...overrides } : null;
      registry.bump(name);
    }
    function adoptParsed(name, parsed) {
      if (!parsed) return;
      const r = registry.get(name);
      if (parsed.props) r.propsMeta = parsed.props;
      if (parsed.preview) r.preview = parsed.preview;
      if (parsed.template) updateHtml(name, parsed.template);
      if (parsed.js) updateJs(name, parsed.js);
    }
    return {
      registry,
      getDC: factory.getDC,
      updateHtml,
      updateJs,
      dcUpdate,
      setProps,
      adoptParsed,
      setRootName: (name) => {
        rootName = name;
      },
      markFetched: (name) => {
        registry.get(name).fetched = true;
      },
      annotatedTemplate: (name) => {
        const r = registry.get(name);
        return r.tpl && r.tpl.__annotated || null;
      },
      templateSource: (name) => registry.get(name).html || null,
      StreamableLogic
    };
  }

  // src/index.ts
  var REACT_URL = "https://unpkg.com/react@18.2.0/umd/react.production.min.js";
  var REACT_SRI = "";
  var REACT_DOM_URL = "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js";
  var REACT_DOM_SRI = "";
  function hideRawTemplate() {
    const s = document.createElement("style");
    s.textContent = "x-dc{display:none!important}";
    document.head.appendChild(s);
  }
  function loadScript(src, integrity) {
    return new Promise((resolve2, reject) => {
      //! nosemgrep: create-script-element
      const s = document.createElement("script");
      s.src = src;
      s.integrity = integrity;
      s.crossOrigin = "anonymous";
      s.async = false;
      s.onload = () => resolve2();
      s.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(s);
    });
  }
  function loadReactUmd() {
    const w = window;
    if (w.React && w.ReactDOM) return Promise.resolve();
    return Promise.all([
      loadScript(REACT_URL, REACT_SRI),
      loadScript(REACT_DOM_URL, REACT_DOM_SRI)
    ]).then(() => void 0);
  }
  function init() {
    const runtime = createRuntime(document);
    let rootName = "Root";
    const baseCss = document.createElement("style");
    baseCss.textContent = BASE_CSS;
    document.head.prepend(baseCss);
    const notifyHost = () => {
      if (window.parent === window) return;
      const r = runtime.registry.entries[rootName];
      try {
        window.parent.postMessage(
          {
            type: "__dc_booted",
            rootName,
            propsMeta: r && r.propsMeta || null,
            preview: r && r.preview || null
          },
          "*"
        );
      } catch {
      }
    };
    const api = {
      __dcUpdate: (name, kind, content, streaming) => {
        runtime.dcUpdate(name, kind, content, streaming);
        if (name === rootName && !streaming && kind === "props") notifyHost();
      },
      __dcSetProps: (name, overrides) => runtime.setProps(name, overrides),
      /** Name of the component currently mounted as the page root — DC tools
       *  push their template-stream here when targeting "the open page". */
      __dcRootName: () => rootName,
      /** Editor bridge — the encoded, `data-dc-tpl`-annotated template source.
       *  The host editor parses this into its own template DOM so it can map a
       *  rendered node (carrying the same `data-dc-tpl`) back to the source
       *  node that emitted it. Returns the encoded form (`<sc-comp>`,
       *  `sc-camel-*` attrs); the editor decodes on serialize. */
      __dcAnnotatedTemplate: (name) => runtime.annotatedTemplate(name),
      /** Editor bridge — the *original* (decoded) template source. */
      __dcTemplateSource: (name) => runtime.templateSource(name),
      __dcBoot: () => {
        rootName = boot(runtime, document) ?? rootName;
        notifyHost();
      },
      __dcRegistry: runtime.registry.entries,
      getDC: (name) => runtime.getDC(name),
      // `DCLogic` is the documented base class name; `StreamableLogic` is the
      // implementation alias kept for any project that already references it.
      DCLogic: runtime.StreamableLogic,
      StreamableLogic: runtime.StreamableLogic
    };
    Object.assign(window, api);
    window.__dcContentKeyed = true;
    if (document.readyState !== "loading") api.__dcBoot();
    else document.addEventListener("DOMContentLoaded", () => api.__dcBoot());
  }
  hideRawTemplate();
  loadReactUmd().then(init).catch((err) => {
    console.error("[dc] failed to load React or boot:", err);
    throw err;
  });
})();


/* ================= <image-slot> web component ================= */
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // Merge: sidecar loses to any in-memory change that raced ahead of
        // the fetch (drop or clear) so neither is clobbered by hydration.
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          // A framing-only write that raced ahead of hydration must not
          // drop a user image that's only on disk — inherit u from the
          // sidecar for any in-memory entry that lacks one.
          for (const k in slots) {
            if (merged[k] && !merged[k].u && j[k]) {
              merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
            }
          }
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }

  const S_MAX = 5;
  const clampS = (s) => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? { u: v, s: 1, x: 0, y: 0 } : v;
  }

  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save(); else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
    ':host{display:inline-block;position:relative;vertical-align:top;' +
    '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' +
    '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
    // .frame img (clipped) and .spill (unclipped ghost + handles) share the
    // same left/top/width/height in frame-%, computed by _applyView(), so the
    // inside-mask crop and the outside-mask spill stay pixel-aligned.
    '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' +
    '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
    // Reframe mode (double-click): the full image spills past the mask. The
    // spill layer is sized to the IMAGE bounds so its corners are where the
    // resize handles belong. The ghost <img> inside is translucent; the real
    // clipped <img> underneath shows the opaque in-mask crop.
    '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' +
    '  cursor:grab;touch-action:none}' +
    ':host([data-panning]) .spill{cursor:grabbing}' +
    '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' +
    '  pointer-events:none;-webkit-user-drag:none;user-select:none;' +
    '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' +
    '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' +
    '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' +
    '  transform:translate(-50%,-50%)}' +
    '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' +
    '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' +
    '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' +
    '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' +
    ':host([data-reframe]){z-index:10}' +
    ':host([data-reframe]) .spill{display:block}' +
    ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' +
    '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
    '  cursor:pointer;user-select:none}' +
    '.empty svg{opacity:.45}' +
    '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' +
    '.empty .sub{font-size:11px}' +
    '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' +
    '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' +
    ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' +
    '  background:rgba(201,100,66,.10)}' +
    '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' +
    '  transition:border-color .12s}' +
    ':host([data-over]) .ring{border-color:#c96442}' +
    ':host([data-filled]) .ring{display:none}' +
    // Controls sit BELOW the mask (top:100%), absolutely positioned so the
    // author-declared slot height is unaffected. The gap is padding, not a
    // top offset, so the hover target stays contiguous with the frame.
    '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' +
    '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' +
    '  white-space:nowrap}' +
    ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' +
    '  {opacity:1;pointer-events:auto}' +
    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' +
    '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' +
    '  backdrop-filter:blur(6px)}' +
    '.ctl button:hover{background:rgba(0,0,0,.8)}' +
    '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' +
    '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';

  const icon =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<path d="m21 15-5-5L5 21"/></svg>';

  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML =
        '<style>' + stylesheet + '</style>' +
        '<div class="frame" part="frame">' +
        '  <img part="image" alt="" draggable="false" style="display:none">' +
        '  <div class="empty" part="empty">' + icon +
        '    <div class="cap"></div>' +
        '    <div class="sub">or <u>browse files</u></div></div>' +
        '  <div class="ring" part="ring"></div>' +
        '</div>' +
        '<div class="spill">' +
        '  <img class="ghost" alt="" draggable="false">' +
        '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' +
        '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' +
        '  <button data-act="clear" title="Remove image">Remove</button></div>' +
        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = { s: 1, x: 0, y: 0 };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') { this._exitReframe(true); this._input.click(); }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null); else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', (e) => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);
        else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1, fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1, ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0, h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2, oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0, uy = sy * h0 / diag0;
          move = (ev) => {
            const proj = (ev.clientX - rect.left - ox) * ux +
                         (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = { px: e.clientX, py: e.clientY, x: this._view.x, y: this._view.y };
          move = (ev) => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try { this._spill.releasePointerCapture(e.pointerId); } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', (e) => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, { passive: false });
    }

    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }

    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      this._exitReframe(false);
    }

    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = (e) => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = (e) => { if (e.key === 'Escape') this._exitReframe(true); };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }

    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }

    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = { u: url, s: 1, x: 0, y: 0 };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) { this._local = val; this._render(); }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }

    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') &&
        (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth, ih = this._img.naturalHeight;
      const fw = this.clientWidth, fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return { iw, ih, fw, fh, base: Math.max(fw / iw, fh / ih) };
    }

    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }

    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = (g.iw * k / g.fw * 100) + '%';
      const h = (g.ih * k / g.fh * 100) + '%';
      const l = (50 + this._view.x) + '%';
      const t = (50 + this._view.y) + '%';
      this._img.style.width = w; this._img.style.height = h;
      this._img.style.left = l; this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w; this._spill.style.height = h;
      this._spill.style.left = l; this._spill.style.top = t;
    }

    _commitView() {
      const v = { s: this._view.s, x: this._view.x, y: this._view.y };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);
      else { this._local = v; }
    }

    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';
      else if (shape === 'pill') radius = '9999px';
      else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = (stored && stored.u) || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0,
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }

  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
