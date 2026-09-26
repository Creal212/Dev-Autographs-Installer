"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../schema/dist/index.js
var PROTOCOL;
var init_dist = __esm({
  "../schema/dist/index.js"() {
    "use strict";
    PROTOCOL = {
      seal: "pawprints-seal-v1",
      attestation: "pawprints-attestation-v1",
      revocation: "pawprints-revocation-v1",
      repoInk: "codeink-repo-v1"
    };
  }
});

// ../crypto/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  aggregateContributors: () => aggregateContributors,
  attestationPayload: () => attestationPayload,
  createAttestation: () => createAttestation,
  createRepoInk: () => createRepoInk,
  createSeal: () => createSeal,
  fingerprint: () => fingerprint,
  generateKeyPair: () => generateKeyPair,
  normalizeWeights: () => normalizeWeights,
  repoInkPayload: () => repoInkPayload,
  sealPayload: () => sealPayload,
  sha256Hex: () => sha256Hex,
  signBytes: () => signBytes,
  verifyAttestation: () => verifyAttestation,
  verifyBytes: () => verifyBytes,
  verifyRepoInk: () => verifyRepoInk,
  verifySeal: () => verifySeal
});
function sha256Hex(data) {
  return (0, import_node_crypto.createHash)("sha256").update(data).digest("hex");
}
function generateKeyPair() {
  const { publicKey, privateKey } = (0, import_node_crypto.generateKeyPairSync)("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" }
  });
  return {
    publicKey: Buffer.from(publicKey).toString("base64url"),
    privateKey: Buffer.from(privateKey).toString("base64url")
  };
}
function loadPrivate(privateKeyB64) {
  return (0, import_node_crypto.createPrivateKey)({
    key: Buffer.from(privateKeyB64, "base64url"),
    format: "der",
    type: "pkcs8"
  });
}
function loadPublic(publicKeyB64) {
  return (0, import_node_crypto.createPublicKey)({
    key: Buffer.from(publicKeyB64, "base64url"),
    format: "der",
    type: "spki"
  });
}
function signBytes(message, privateKeyB64) {
  const sig = (0, import_node_crypto.sign)(null, Buffer.from(message), loadPrivate(privateKeyB64));
  return Buffer.from(sig).toString("base64url");
}
function verifyBytes(message, publicKeyB64, signatureB64) {
  try {
    return (0, import_node_crypto.verify)(null, Buffer.from(message), loadPublic(publicKeyB64), Buffer.from(signatureB64, "base64url"));
  } catch {
    return false;
  }
}
function fingerprint(publicKeyB64) {
  const der = Buffer.from(publicKeyB64, "base64url");
  const hex = (0, import_node_crypto.createHash)("sha256").update(der).digest("hex").toUpperCase();
  return hex.match(/.{1,2}/g).slice(0, 8).join(":");
}
function sealPayload(input) {
  return [
    PROTOCOL.seal,
    `contentSha256=${input.contentSha256}`,
    `path=${input.path.replace(/\\/g, "/")}`,
    `signer=${input.signer}`,
    `createdAt=${input.createdAt}`
  ].join("\n");
}
function createSeal(input) {
  const createdAt = input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const contentSha256 = sha256Hex(input.content);
  const path7 = input.path.replace(/\\/g, "/");
  const payload = sealPayload({
    contentSha256,
    path: path7,
    signer: input.publicKey,
    createdAt
  });
  return {
    version: PROTOCOL.seal,
    contentSha256,
    path: path7,
    signer: input.publicKey,
    displayMark: input.displayMark,
    createdAt,
    signature: signBytes(payload, input.privateKey)
  };
}
function verifySeal(seal, content) {
  if (seal.version !== PROTOCOL.seal)
    return false;
  if (content !== void 0) {
    if (sha256Hex(content) !== seal.contentSha256)
      return false;
  }
  const payload = sealPayload({
    contentSha256: seal.contentSha256,
    path: seal.path,
    signer: seal.signer,
    createdAt: seal.createdAt
  });
  return verifyBytes(payload, seal.signer, seal.signature);
}
function stableContributorsJson(contributors) {
  const sorted = [...contributors].sort((a, b) => a.signerId.localeCompare(b.signerId));
  return JSON.stringify(sorted);
}
function attestationPayload(input) {
  return [
    PROTOCOL.attestation,
    `buildHash=${input.buildHash}`,
    `version=${input.versionLabel}`,
    `createdAt=${input.createdAt}`,
    `contributors=${stableContributorsJson(input.contributors)}`
  ].join("\n");
}
function createAttestation(input) {
  const createdAt = input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const contributors = normalizeWeights(input.contributors);
  const payload = attestationPayload({
    buildHash: input.buildHash,
    versionLabel: input.versionLabel,
    createdAt,
    contributors
  });
  return {
    version: PROTOCOL.attestation,
    app: input.app,
    versionLabel: input.versionLabel,
    buildHash: input.buildHash,
    commit: input.commit,
    createdAt,
    contributors,
    issuer: input.issuerPublicKey,
    signature: signBytes(payload, input.issuerPrivateKey)
  };
}
function verifyAttestation(attestation) {
  if (attestation.version !== PROTOCOL.attestation)
    return false;
  const payload = attestationPayload({
    buildHash: attestation.buildHash,
    versionLabel: attestation.versionLabel,
    createdAt: attestation.createdAt,
    contributors: attestation.contributors
  });
  return verifyBytes(payload, attestation.issuer, attestation.signature);
}
function normalizeWeights(contributors) {
  const total = contributors.reduce((s, c) => s + c.weight, 0);
  if (total <= 0) {
    const even = contributors.length ? 1 / contributors.length : 0;
    return contributors.map((c) => ({ ...c, weight: even }));
  }
  return contributors.map((c) => ({
    ...c,
    weight: Number((c.weight / total).toFixed(6))
  }));
}
function aggregateContributors(seals, meta) {
  const counts = /* @__PURE__ */ new Map();
  for (const seal of seals) {
    counts.set(seal.signer, (counts.get(seal.signer) ?? 0) + 1);
  }
  const out = [];
  for (const [signerId, sealedFiles] of counts) {
    const m = meta?.get(signerId);
    out.push({
      signerId,
      displayMark: m?.displayMark ?? fingerprint(signerId),
      trustLevel: m?.trustLevel ?? "L2",
      weight: sealedFiles,
      roles: ["author"],
      sealedFiles
    });
  }
  return normalizeWeights(out);
}
function repoInkPayload(input) {
  return [
    PROTOCOL.repoInk,
    `repoId=${input.repoId}`,
    `treeSha=${input.treeSha}`,
    `originTreeSha=${input.originTreeSha}`,
    `contentMerkle=${input.contentMerkle}`,
    `ownerLogin=${input.ownerLogin}`,
    `signer=${input.signer}`,
    `createdAt=${input.createdAt}`
  ].join("\n");
}
function createRepoInk(input) {
  const createdAt = input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const originTreeSha = input.originTreeSha ?? input.treeSha;
  const payload = repoInkPayload({
    repoId: input.repoId,
    treeSha: input.treeSha,
    originTreeSha,
    contentMerkle: input.contentMerkle,
    ownerLogin: input.ownerLogin,
    signer: input.publicKey,
    createdAt
  });
  return {
    version: PROTOCOL.repoInk,
    repoFullName: input.repoFullName,
    repoId: String(input.repoId),
    treeSha: input.treeSha,
    originTreeSha,
    contentMerkle: input.contentMerkle,
    ownerLogin: input.ownerLogin,
    signer: input.publicKey,
    displayMark: input.displayMark,
    createdAt,
    signature: signBytes(payload, input.privateKey),
    status: "active"
  };
}
function verifyRepoInk(ink) {
  if (ink.version !== PROTOCOL.repoInk)
    return false;
  const payload = repoInkPayload({
    repoId: ink.repoId,
    treeSha: ink.treeSha,
    originTreeSha: ink.originTreeSha,
    contentMerkle: ink.contentMerkle,
    ownerLogin: ink.ownerLogin,
    signer: ink.signer,
    createdAt: ink.createdAt
  });
  return verifyBytes(payload, ink.signer, ink.signature);
}
var import_node_crypto;
var init_dist2 = __esm({
  "../crypto/dist/index.js"() {
    "use strict";
    import_node_crypto = require("node:crypto");
    init_dist();
  }
});

// src/registry.generated.ts
var HOSTED_REGISTRY;
var init_registry_generated = __esm({
  "src/registry.generated.ts"() {
    "use strict";
    HOSTED_REGISTRY = "https://dev-autographs-registry-production.up.railway.app";
  }
});

// src/report.ts
var report_exports = {};
__export(report_exports, {
  bootScriptSource: () => bootScriptSource,
  buildHonorRoll: () => buildHonorRoll,
  latestSealPerPath: () => latestSealPerPath,
  mergeSeals: () => mergeSeals,
  rebuildSiteReport: () => rebuildSiteReport,
  resolveLedgerApi: () => resolveLedgerApi,
  syncOverlayArtifacts: () => syncOverlayArtifacts,
  upsertOverlayIntoHtml: () => upsertOverlayIntoHtml
});
async function exists(p) {
  try {
    await (0, import_promises.access)(p, import_node_fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
function git(args, cwd) {
  return (0, import_node_child_process.execFileSync)("git", args, { cwd, encoding: "utf8" }).trim();
}
function parseRepoFullName(remote) {
  const r = remote.trim();
  if (r.startsWith("git@github.com:")) {
    return r.slice("git@github.com:".length).replace(/\.git$/, "");
  }
  const m = /github\.com[/:]([^/]+\/[^/.]+)/i.exec(r);
  return m?.[1]?.replace(/\.git$/, "") ?? null;
}
function resolveLedgerApi(fallback = HOSTED_REGISTRY) {
  const env = process.env.DEV_AUTOGRAPHS_REGISTRY || process.env.CODEINK_REGISTRY || process.env.PAWPRINTS_API;
  if (env?.trim()) return env.trim().replace(/\/$/, "");
  return fallback.replace(/\/$/, "");
}
async function readPkgDeps(cwd) {
  try {
    const pkg = JSON.parse(await (0, import_promises.readFile)(import_node_path.default.join(cwd, "package.json"), "utf8"));
    return { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  } catch {
    return {};
  }
}
function hasWebPackage(deps) {
  const skipAlone = /* @__PURE__ */ new Set(["nest", "@nestjs/core", "express", "fastify", "koa", "hapi"]);
  let hit = false;
  for (const k of WEB_PKG_KEYS) {
    if (!deps[k]) continue;
    if (skipAlone.has(k)) continue;
    hit = true;
    break;
  }
  return hit;
}
async function walkRepo(cwd, onEntry, maxDepth = 6) {
  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await (0, import_promises.readdir)(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (WALK_SKIP.has(ent.name)) continue;
      if (ent.name.startsWith(".") && ent.isDirectory()) continue;
      const abs = import_node_path.default.join(dir, ent.name);
      const rel = import_node_path.default.relative(cwd, abs).replace(/\\/g, "/");
      await onEntry(abs, rel, ent);
      if (ent.isDirectory()) await walk(abs, depth + 1);
    }
  }
  await walk(cwd, 0);
}
function shellKindFor(fileName, rel) {
  const base = import_node_path.default.basename(fileName);
  const lower = base.toLowerCase();
  if (/\.(html?|htm|ejs|njk|hbs|mustache|pug|php)$/i.test(base)) return "html";
  if (lower.endsWith(".astro")) return "astro";
  if (lower.endsWith(".vue")) return "vue";
  if (lower.endsWith(".svelte")) return "svelte";
  if (/\.(tsx|jsx|ts|js|mjs|cjs)$/i.test(base)) {
    if (SKIP_JSX_SHELLS.has(lower) || lower === "main.tsx" || lower === "main.jsx" || lower === "main.ts" || lower === "main.js") {
      return null;
    }
    if (LAYOUT_BASENAMES.has(base) || LAYOUT_BASENAMES.has(lower)) return "jsx";
    if (/(^|\/)(root|_document|document)\.(tsx|jsx|js|ts)$/i.test(rel)) return "jsx";
    if (/(^|\/)app\/layout\.(tsx|jsx|js|ts)$/i.test(rel)) return "jsx";
    if (/(^|\/)src\/app\/layout\.(tsx|jsx|js|ts)$/i.test(rel)) return "jsx";
    if (/(^|\/)\+layout\.(tsx|jsx)$/i.test(rel)) return "jsx";
    return null;
  }
  return null;
}
function isPreferredShell(rel, kind) {
  const r = rel.replace(/\\/g, "/").toLowerCase();
  if (r.endsWith("app.html") || r.endsWith("index.html") || r.endsWith("document.html")) return 0;
  if (r.includes("_document.")) return 1;
  if (r.endsWith("root.tsx") || r.endsWith("root.jsx") || r.endsWith("root.js")) return 2;
  if (/(^|\/)app\/layout\./.test(r) || /(^|\/)src\/app\/layout\./.test(r)) return 3;
  if (r.includes("+layout.")) return 4;
  if (r.endsWith("app.vue") || r.endsWith("app.svelte")) return 5;
  if (kind === "html") return 6;
  if (kind === "jsx") return 7;
  if (kind === "astro") return 8;
  if (kind === "vue" || kind === "svelte") return 9;
  return 20;
}
async function discoverStaticRoots(cwd) {
  const preferred = [
    "public",
    "static",
    "staticfiles",
    "www",
    "web",
    "client/public",
    "frontend/public",
    "src/public",
    "src/static",
    "app/static",
    "apps/web/public",
    "apps/web/static",
    "apps/site/public",
    "apps/frontend/public",
    "packages/web/public",
    "packages/site/public",
    "docs/public",
    "website/public",
    "site/public"
  ];
  const found = [];
  for (const rel of preferred) {
    const abs = import_node_path.default.join(cwd, rel);
    if (await exists(abs)) found.push(abs);
  }
  await walkRepo(cwd, async (abs, rel, ent) => {
    if (!ent.isDirectory()) return;
    const base = ent.name.toLowerCase();
    if (base !== "public" && base !== "static") return;
    if (found.includes(abs)) return;
    if (rel.split("/").length > 4) return;
    found.push(abs);
  }, 4);
  return [...new Set(found)];
}
async function discoverInjectTargets(cwd) {
  const targets = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (abs, kind) => {
    const key = abs.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ abs, kind });
  };
  const conventional = [
    "index.html",
    "public/index.html",
    "src/index.html",
    "src/app.html",
    "app.html",
    "client/index.html",
    "frontend/index.html",
    "web/index.html",
    "www/index.html",
    "docs/index.html",
    "website/index.html",
    "site/index.html",
    "apps/web/index.html",
    "apps/web/public/index.html",
    "apps/site/index.html",
    "apps/frontend/index.html",
    "packages/web/index.html",
    "app/layout.tsx",
    "app/layout.jsx",
    "app/layout.js",
    "src/app/layout.tsx",
    "src/app/layout.jsx",
    "src/app/layout.js",
    "pages/_document.tsx",
    "pages/_document.jsx",
    "pages/_document.js",
    "src/pages/_document.tsx",
    "src/pages/_document.jsx",
    "src/pages/_document.js",
    "app/root.tsx",
    "app/root.jsx",
    "app/root.js",
    "src/root.tsx",
    "src/App.vue",
    "app.vue",
    "App.vue",
    "src/app.vue",
    "layouts/default.vue",
    "src/layouts/default.vue",
    "app/layouts/default.vue",
    "src/routes/+layout.svelte",
    "src/routes/+layout.tsx",
    "src/App.svelte",
    "src/app.html",
    "src/layouts/Layout.astro",
    "src/layouts/BaseLayout.astro",
    "src/layouts/layout.astro",
    "layouts/Layout.astro",
    "src/pages/_document.tsx"
  ];
  for (const rel of conventional) {
    const abs = import_node_path.default.join(cwd, rel);
    if (!await exists(abs)) continue;
    const kind = shellKindFor(import_node_path.default.basename(rel), rel);
    if (kind) push(abs, kind);
  }
  await walkRepo(cwd, async (abs, rel, ent) => {
    if (!ent.isFile()) return;
    const base = ent.name;
    if (HTML_SHELL_NAMES.has(base.toLowerCase()) || HTML_SHELL_NAMES.has(base)) {
      push(abs, "html");
      return;
    }
    if (LAYOUT_BASENAMES.has(base) || LAYOUT_BASENAMES.has(base.toLowerCase())) {
      const kind = shellKindFor(base, rel);
      if (kind) push(abs, kind);
      return;
    }
    if (/\.astro$/i.test(base) && /\/layouts?\//i.test(rel)) {
      push(abs, "astro");
    }
  }, 5);
  targets.sort(
    (a, b) => isPreferredShell(import_node_path.default.relative(cwd, a.abs), a.kind) - isPreferredShell(import_node_path.default.relative(cwd, b.abs), b.kind)
  );
  return targets;
}
async function isWebProject(cwd) {
  if ((await discoverInjectTargets(cwd)).length) return true;
  if ((await discoverStaticRoots(cwd)).length) return true;
  const deps = await readPkgDeps(cwd);
  if (hasWebPackage(deps)) return true;
  const fingerprints = [
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "nuxt.config.ts",
    "nuxt.config.js",
    "astro.config.mjs",
    "astro.config.ts",
    "svelte.config.js",
    "svelte.config.ts",
    "angular.json",
    "remix.config.js",
    "remix.config.ts",
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "webpack.config.js",
    "gatsby-config.js",
    "gatsby-config.ts",
    "docusaurus.config.js",
    "docusaurus.config.ts",
    "ember-cli-build.js",
    "project.json",
    // nx
    "nx.json",
    "turbo.json",
    "vercel.json",
    "netlify.toml",
    "wrangler.toml",
    "fly.toml",
    "render.yaml",
    "hugo.toml",
    "hugo.yaml",
    "config.toml",
    // hugo/jekyll-ish
    "_config.yml",
    // jekyll
    "mkdocs.yml",
    "Gemfile",
    "manage.py",
    // django often has templates
    "composer.json"
    // laravel/php
  ];
  for (const f of fingerprints) {
    if (await exists(import_node_path.default.join(cwd, f))) {
      if (f === "Gemfile" || f === "manage.py" || f === "composer.json" || f === "config.toml") {
        continue;
      }
      return true;
    }
  }
  for (const rel of [
    "templates",
    "app/templates",
    "resources/views",
    "app/views",
    "views"
  ]) {
    if (await exists(import_node_path.default.join(cwd, rel))) return true;
  }
  return false;
}
async function ensureStaticRoots(cwd, deps) {
  let roots = await discoverStaticRoots(cwd);
  if (roots.length) return roots;
  let rel = "public";
  if (deps["@sveltejs/kit"] || deps.svelte && !deps.nuxt && !deps.vite) rel = "static";
  else if (deps.gatsby) rel = "static";
  else if (await exists(import_node_path.default.join(cwd, "manage.py")) || await exists(import_node_path.default.join(cwd, "templates")) || await exists(import_node_path.default.join(cwd, "app/templates"))) {
    rel = "static";
  } else if (await exists(import_node_path.default.join(cwd, "config.ru")) || await exists(import_node_path.default.join(cwd, "Gemfile"))) {
    rel = "public";
  } else if (await exists(import_node_path.default.join(cwd, "artisan"))) {
    rel = "public";
  }
  const abs = import_node_path.default.join(cwd, rel);
  await (0, import_promises.mkdir)(abs, { recursive: true });
  return [abs];
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function bootVersion() {
  if (!bootVersionCache) bootVersionCache = sha256Hex(bootScriptSource("")).slice(0, 8);
  return bootVersionCache;
}
function snippetHtml(indent = "") {
  return `${indent}${MARK_START}
${indent}<script type="module" src="/${BOOT_NAME}?v=${bootVersion()}"></script>
${indent}<meta name="dev-autographs-report" content="/${REPORT_NAME}" />
${indent}${MARK_END}`;
}
function snippetJsx(indent = "      ") {
  return `${indent}${MARK_START_JSX}
${indent}<script type="module" src="/${BOOT_NAME}?v=${bootVersion()}" />
${indent}<meta name="dev-autographs-report" content="/${REPORT_NAME}" />
${indent}${MARK_END_JSX}`;
}
function upsertMarkedBlock(src, start, end, block, insertBefore) {
  if (src.includes(start) && src.includes(end)) {
    return src.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, "m"), block);
  }
  for (const re of insertBefore) {
    if (re.test(src)) return src.replace(re, `${block}
$&`);
  }
  return `${src.trimEnd()}
${block}
`;
}
async function maybeAddRepoMeta(src, cwd) {
  if (/name=["']dev-autographs-repo["']/i.test(src) || /name=["']pawprints-repo["']/i.test(src)) {
    return src;
  }
  try {
    const remote = git(["remote", "get-url", "origin"], cwd);
    const full = parseRepoFullName(remote);
    if (full && /<head[^>]*>/i.test(src)) {
      return src.replace(
        /<head[^>]*>/i,
        (m) => `${m}
    <meta name="dev-autographs-repo" content="${full}" />`
      );
    }
  } catch {
  }
  return src;
}
async function isTauriAppPath(abs, cwd) {
  let dir = import_node_path.default.dirname(abs);
  const root = import_node_path.default.resolve(cwd);
  for (let i = 0; i < 8; i++) {
    if (await exists(import_node_path.default.join(dir, "src-tauri")) || await exists(import_node_path.default.join(dir, "tauri.conf.json")) || await exists(import_node_path.default.join(dir, "tauri.conf.json5"))) {
      return true;
    }
    const parent = import_node_path.default.dirname(dir);
    if (parent === dir || !import_node_path.default.resolve(dir).startsWith(root)) break;
    dir = parent;
  }
  return false;
}
async function upsertOverlayIntoShell(target, cwd) {
  if (await isTauriAppPath(target.abs, cwd)) return null;
  let src = await (0, import_promises.readFile)(target.abs, "utf8");
  const rel = import_node_path.default.relative(cwd, target.abs).replace(/\\/g, "/");
  if (target.kind === "jsx") {
    if (!/<\/body>/i.test(src) && !/<body[\s>]/i.test(src) && !/<\/html>/i.test(src)) {
      return null;
    }
    const block = snippetJsx();
    src = upsertMarkedBlock(src, MARK_START_JSX, MARK_END_JSX, block, [
      /<\/body>/i,
      /<\/html>/i
    ]);
  } else if (target.kind === "vue") {
    const block = snippetHtml("    ");
    if (/<\/template>/i.test(src)) {
      if (src.includes(MARK_START) && src.includes(MARK_END)) {
        src = src.replace(
          new RegExp(`${escapeRegExp(MARK_START)}[\\s\\S]*?${escapeRegExp(MARK_END)}`, "m"),
          block
        );
      } else {
        src = src.replace(/<\/template>/i, `${block}
</template>`);
      }
    } else {
      src = upsertMarkedBlock(src, MARK_START, MARK_END, block, [/<\/body>/i]);
    }
  } else if (target.kind === "svelte") {
    const block = snippetHtml("");
    src = upsertMarkedBlock(src, MARK_START, MARK_END, block, [
      /<\/body>/i,
      /<\/html>/i
    ]);
  } else if (target.kind === "astro") {
    const block = snippetHtml("  ");
    src = upsertMarkedBlock(src, MARK_START, MARK_END, block, [/<\/body>/i, /<\/html>/i]);
  } else {
    const block = snippetHtml("");
    src = upsertMarkedBlock(src, MARK_START, MARK_END, block, [/<\/body>/i]);
    src = await maybeAddRepoMeta(src, cwd);
  }
  if (target.kind === "jsx") {
    src = await maybeAddRepoMeta(src, cwd);
  }
  await (0, import_promises.writeFile)(target.abs, src);
  return rel;
}
async function ensureNextPagesDocument(cwd) {
  const pagesDirs = ["pages", "src/pages"];
  for (const dir of pagesDirs) {
    const pagesAbs = import_node_path.default.join(cwd, dir);
    if (!await exists(pagesAbs)) continue;
    if (await exists(import_node_path.default.join(cwd, "app")) || await exists(import_node_path.default.join(cwd, "src/app"))) {
      continue;
    }
    for (const ext of ["tsx", "jsx", "js"]) {
      if (await exists(import_node_path.default.join(pagesAbs, `_document.${ext}`))) return null;
    }
    const out = import_node_path.default.join(pagesAbs, "_document.tsx");
    const body = `import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
${snippetJsx("        ")}
      </body>
    </Html>
  );
}
`;
    await (0, import_promises.writeFile)(out, body);
    return import_node_path.default.relative(cwd, out).replace(/\\/g, "/");
  }
  return null;
}
async function ensureSvelteAppHtml(cwd, deps) {
  if (!deps["@sveltejs/kit"] && !deps.svelte) return null;
  const candidates = ["src/app.html", "app.html"];
  for (const rel of candidates) {
    if (await exists(import_node_path.default.join(cwd, rel))) return null;
  }
  if (!await exists(import_node_path.default.join(cwd, "src"))) return null;
  const out = import_node_path.default.join(cwd, "src/app.html");
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
${snippetHtml("    ")}
  </body>
</html>
`;
  await (0, import_promises.writeFile)(out, body);
  return "src/app.html";
}
async function upsertOverlayIntoHtml(cwd, ledgerApi) {
  const touched = [];
  const deps = await readPkgDeps(cwd);
  const staticRoots = await ensureStaticRoots(cwd, deps);
  const bootSrc = bootScriptSource(ledgerApi);
  const bootTargets = /* @__PURE__ */ new Set([import_node_path.default.join(cwd, BOOT_NAME)]);
  for (const root of staticRoots) bootTargets.add(import_node_path.default.join(root, BOOT_NAME));
  for (const bootPath of bootTargets) {
    await (0, import_promises.mkdir)(import_node_path.default.dirname(bootPath), { recursive: true });
    await (0, import_promises.writeFile)(bootPath, bootSrc);
    touched.push(import_node_path.default.relative(cwd, bootPath).replace(/\\/g, "/"));
  }
  const reportRoot = import_node_path.default.join(cwd, REPORT_NAME);
  if (await exists(reportRoot)) {
    for (const root of staticRoots) {
      const dest = import_node_path.default.join(root, REPORT_NAME);
      await (0, import_promises.copyFile)(reportRoot, dest);
      touched.push(import_node_path.default.relative(cwd, dest).replace(/\\/g, "/"));
    }
  }
  const dist = overlayPackageDist();
  if (await exists(dist)) {
    try {
      await (0, import_promises.copyFile)(dist, import_node_path.default.join(cwd, OVERLAY_JS));
      touched.push(OVERLAY_JS);
      for (const root of staticRoots) {
        await (0, import_promises.copyFile)(dist, import_node_path.default.join(root, OVERLAY_JS));
        touched.push(import_node_path.default.relative(cwd, import_node_path.default.join(root, OVERLAY_JS)).replace(/\\/g, "/"));
      }
    } catch {
    }
  }
  const createdDoc = await ensureNextPagesDocument(cwd);
  if (createdDoc) touched.push(createdDoc);
  const createdSvelte = await ensureSvelteAppHtml(cwd, deps);
  if (createdSvelte) touched.push(createdSvelte);
  let targets = await discoverInjectTargets(cwd);
  const maxInject = 8;
  targets = targets.slice(0, maxInject);
  for (const t of targets) {
    try {
      const rel = await upsertOverlayIntoShell(t, cwd);
      if (rel) touched.push(rel);
    } catch (e) {
      console.warn(
        `Dev Autographs: skip inject ${import_node_path.default.relative(cwd, t.abs)} (${e instanceof Error ? e.message : e})`
      );
    }
  }
  if (!targets.length) {
    const root = staticRoots[0] ?? import_node_path.default.join(cwd, "public");
    await (0, import_promises.mkdir)(root, { recursive: true });
    const stub = import_node_path.default.join(root, "dev-autographs.html");
    if (!await exists(stub)) {
      await (0, import_promises.writeFile)(
        stub,
        `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Dev Autographs</title>
${snippetHtml("  ")}
</head>
<body>
  <p>Dev Autographs overlay host. Open this page or include the boot script on your site.</p>
</body>
</html>
`
      );
      touched.push(import_node_path.default.relative(cwd, stub).replace(/\\/g, "/"));
    }
    console.warn(
      "Dev Autographs: no HTML/layout shell found \u2014 wrote static assets + public/dev-autographs.html. Wire /dev-autographs-boot.js into your app entry if the FAB does not appear."
    );
  }
  return [...new Set(touched)];
}
async function loadExistingReport(cwd) {
  const p = import_node_path.default.join(cwd, REPORT_NAME);
  if (!await exists(p)) return null;
  try {
    return JSON.parse(await (0, import_promises.readFile)(p, "utf8"));
  } catch {
    return null;
  }
}
function mergeSeals(prev, next) {
  const map = /* @__PURE__ */ new Map();
  for (const s of [...prev, ...next]) {
    const key = s.contentSha256.toLowerCase();
    const old = map.get(key);
    if (!old || (s.createdAt || "") >= (old.createdAt || "")) {
      map.set(key, s);
    }
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
function latestSealPerPath(seals) {
  const map = /* @__PURE__ */ new Map();
  for (const s of seals) {
    const key = s.path.replace(/\\/g, "/");
    const old = map.get(key);
    if (!old || (s.createdAt || "") >= (old.createdAt || "")) {
      map.set(key, { ...s, path: key });
    }
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
function countTrackedSealableFiles(cwd) {
  try {
    const listed = git(["ls-files", "-z"], cwd);
    if (!listed) return 0;
    return listed.split("\0").map((f) => f.trim()).filter(Boolean).filter((f) => HONOR_SEALABLE.test(f) && !HONOR_SKIP.test(f)).length;
  } catch {
    return 0;
  }
}
function buildHonorRoll(seals, trackedFiles, fontByMark) {
  const unique = latestSealPerPath(seals);
  const sealedFiles = unique.length;
  const denom = Math.max(trackedFiles, sealedFiles, 1);
  const counts = /* @__PURE__ */ new Map();
  for (const s of unique) {
    const mark = (s.displayMark || "Unknown").trim() || "Unknown";
    counts.set(mark, (counts.get(mark) ?? 0) + 1);
  }
  const ranking = [...counts.entries()].map(([displayMark, n]) => ({
    displayMark,
    sealedFiles: n,
    percent: Number((n / denom * 100).toFixed(2)),
    markFont: fontByMark?.get(displayMark)
  })).sort((a, b) => b.percent - a.percent || b.sealedFiles - a.sealedFiles || a.displayMark.localeCompare(b.displayMark)).map((row, i) => ({ ...row, rank: i + 1 }));
  const unsignedPercent = Number(
    Math.max(0, (denom - sealedFiles) / denom * 100).toFixed(2)
  );
  return {
    trackedFiles: denom,
    sealedFiles,
    unsignedPercent,
    ranking
  };
}
async function rebuildSiteReport(loadIdentity2, loadAllSeals2, apiBase, cwd = process.cwd()) {
  const id = await loadIdentity2();
  const seals = await loadAllSeals2(cwd);
  const prev = await loadExistingReport(cwd);
  let repoFullName = prev?.repoFullName;
  try {
    const remote = git(["remote", "get-url", "origin"], cwd);
    repoFullName = parseRepoFullName(remote) ?? repoFullName;
  } catch {
  }
  const fromSeals = seals.map((s) => ({
    path: s.path,
    contentSha256: s.contentSha256,
    displayMark: s.displayMark ?? fingerprint(s.signer).slice(0, 8),
    createdAt: s.createdAt,
    signer: s.signer
  }));
  const merged = mergeSeals(prev?.seals ?? [], fromSeals);
  const meta = /* @__PURE__ */ new Map();
  for (const s of seals) {
    meta.set(s.signer, { displayMark: s.displayMark, trustLevel: "L2" });
  }
  const contributors = aggregateContributors(seals.length ? seals : [], meta).map((c) => ({
    displayMark: c.displayMark,
    trustLevel: c.trustLevel,
    weight: c.weight,
    sealedFiles: c.sealedFiles
  }));
  const buildHash = sha256Hex(
    merged.map((s) => `${s.path}:${s.contentSha256}:${s.signer}`).sort().join("|") || `empty:${Date.now()}`
  );
  const fontByMark = /* @__PURE__ */ new Map();
  fontByMark.set(id.displayMark, id.markFont);
  if (id.repoDisplayMark) fontByMark.set(id.repoDisplayMark, id.repoMarkFont);
  for (const c of contributors) {
    if (!fontByMark.has(c.displayMark)) fontByMark.set(c.displayMark, void 0);
  }
  const honor = buildHonorRoll(merged, countTrackedSealableFiles(cwd), fontByMark);
  const report = {
    version: "dev-autographs-report-v1",
    repoFullName,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ledgerApi: apiBase.replace(/\/$/, ""),
    codeMark: {
      displayMark: id.displayMark,
      markFont: id.markFont,
      markIcon: id.markIcon,
      githubLogin: id.githubLogin,
      fingerprint: id.fingerprint ?? fingerprint(id.publicKey)
    },
    repoMark: id.repoDisplayMark ? {
      displayMark: id.repoDisplayMark,
      markFont: id.repoMarkFont,
      markIcon: id.repoMarkIcon,
      githubLogin: id.githubLogin
    } : void 0,
    seals: merged,
    contributors,
    honor,
    buildHash
  };
  if (seals.length && id.privateKey) {
    try {
      const attestation = createAttestation({
        app: repoFullName ?? import_node_path.default.basename(cwd),
        versionLabel: report.updatedAt.slice(0, 10),
        buildHash,
        contributors: aggregateContributors(seals, meta),
        issuerPrivateKey: id.privateKey,
        issuerPublicKey: id.publicKey
      });
      await (0, import_promises.writeFile)(import_node_path.default.join(cwd, "provenance.json"), JSON.stringify(attestation, null, 2));
    } catch {
    }
  }
  await (0, import_promises.writeFile)(import_node_path.default.join(cwd, REPORT_NAME), JSON.stringify(report, null, 2));
  if (repoFullName) {
    await recordRepoTally(repoFullName, merged, id);
  }
  return report;
}
async function recordRepoTally(repoFullName, seals, id) {
  try {
    const keys = /* @__PURE__ */ new Set([id.publicKey, ...id.previousPublicKeys ?? []]);
    const myMark = (id.displayMark || "").trim().toLowerCase();
    const mine = /* @__PURE__ */ new Set();
    for (const s of seals) {
      const byKey = keys.has(s.signer);
      const byMark = Boolean(id.marksLocked) && myMark.length > 1 && (s.displayMark || "").trim().toLowerCase() === myMark;
      if (byKey || byMark) mine.add(s.path.replace(/\\/g, "/"));
    }
    const file = import_node_path.default.join(import_node_os.default.homedir(), ".dev-autographs", "repos.json");
    let current = {};
    try {
      current = JSON.parse(await (0, import_promises.readFile)(file, "utf8"));
    } catch {
    }
    const repos = current.repos ?? {};
    repos[repoFullName] = { sealedFiles: mine.size, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await (0, import_promises.mkdir)(import_node_path.default.dirname(file), { recursive: true });
    await (0, import_promises.writeFile)(
      file,
      JSON.stringify({ version: "dev-autographs-repo-tally-v1", repos }, null, 2),
      { mode: 384 }
    );
  } catch {
  }
}
function overlayPackageDist() {
  try {
    const here = import_node_path.default.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
    return import_node_path.default.resolve(here, "../../overlay/dist/index.js");
  } catch {
    return import_node_path.default.join(import_node_os.default.homedir(), "paw-prints", "packages", "overlay", "dist", "index.js");
  }
}
function bootScriptSource(ledgerApi) {
  return `/* Dev Autographs boot: honorary contribution report; Shift+D */
const LEDGER = ${JSON.stringify(ledgerApi)};
const REPORT_URL = "/dev-autographs.report.json";

async function loadReport() {
  try {
    const res = await fetch(REPORT_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

function ensureUi() {
  if (document.getElementById("da-overlay-root")) return;
  if (!document.getElementById("da-overlay-fonts")) {
    const link = document.createElement("link");
    link.id = "da-overlay-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=Great+Vibes&family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Tangerine:wght@700&display=swap";
    link.referrerPolicy = "no-referrer";
    document.head.appendChild(link);
  }
  const style = document.createElement("style");
  style.textContent = \`
#da-overlay-root{
  --da-page:#f7f5ef;--da-page-2:#fdfcf9;--da-cream:#efe8d6;--da-ink:#17171a;--da-ink-2:#3c3b38;--da-muted:#6b6a64;
  --da-rule:#c7d1df;--da-rule-2:#aebbcd;--da-margin:#d9463c;--da-stamp:#d21f2f;--da-stamp-deep:#9a1421;--da-ok:#1f7a4d;
  --da-display:Syne,"Arial Black",system-ui,sans-serif;
  --da-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --da-royal:"Cinzel Decorative",Cinzel,"Times New Roman",serif;
  --da-grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='0.28' intercept='0.76'/%3E%3CfeFuncG type='linear' slope='0.28' intercept='0.76'/%3E%3CfeFuncB type='linear' slope='0.28' intercept='0.76'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;
  padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));
  background:rgba(23,23,26,.55);backdrop-filter:blur(10px) saturate(110%);-webkit-backdrop-filter:blur(10px) saturate(110%);
  font-family:var(--da-mono);color:var(--da-ink);line-height:1.45;font-size:14px;letter-spacing:0;
}
#da-overlay-root *{box-sizing:border-box}
#da-overlay-root[data-open="1"]{display:flex;animation:da-scrim .22s ease both}
@keyframes da-scrim{from{opacity:0}to{opacity:1}}
#da-overlay-root .card{
  --mx:34px;
  width:min(580px,100%);max-height:min(88vh,820px);display:flex;flex-direction:column;min-height:0;
  position:relative;overflow:hidden;color:var(--da-ink);border:1px solid var(--da-rule-2);border-radius:2px;
  background-color:var(--da-page);
  background-image:
    linear-gradient(90deg,transparent var(--mx),var(--da-margin) var(--mx),var(--da-margin) calc(var(--mx) + 2px),transparent calc(var(--mx) + 2px)),
    repeating-linear-gradient(180deg,transparent 0 27px,var(--da-rule) 27px 28px);
  box-shadow:0 40px 90px -30px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.35) inset;
  animation:da-card .4s cubic-bezier(.22,1,.36,1) both;
}
@keyframes da-card{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
#da-overlay-root .card::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.55;mix-blend-mode:multiply;background:var(--da-grain);background-size:300px 300px}
#da-overlay-root .card > *{position:relative;z-index:1}
#da-overlay-root .head{padding:22px 22px 16px calc(var(--mx) + 18px);border-bottom:1px solid var(--da-rule-2);flex:0 0 auto;background:rgba(253,252,249,.55)}
#da-overlay-root .body{padding:16px 22px 22px calc(var(--mx) + 18px);overflow:auto;flex:1 1 auto;min-height:0;scrollbar-width:thin;scrollbar-color:var(--da-rule-2) transparent}
#da-overlay-root .brand{display:flex;align-items:center;gap:8px;margin:0 0 10px;padding-right:96px}
#da-overlay-root .blot{width:18px;height:18px;color:var(--da-stamp);flex:0 0 auto;display:block}
#da-overlay-root .k{letter-spacing:.18em;text-transform:uppercase;font-size:10px;color:var(--da-stamp);margin:0;font-weight:700}
#da-overlay-root h1{margin:0 0 4px;font-family:var(--da-display);font-size:clamp(22px,4.2vw,30px);font-weight:800;letter-spacing:-.03em;color:var(--da-ink);line-height:1}
#da-overlay-root .m{color:var(--da-muted);font-size:12px;margin:0;line-height:1.5;font-weight:500}
#da-overlay-root .tools{position:absolute;top:12px;right:12px;display:flex;gap:6px;align-items:center}
#da-overlay-root .x,#da-overlay-root .rf{border:1px solid var(--da-rule-2);background:var(--da-page-2);color:var(--da-ink);cursor:pointer;height:32px;border-radius:2px;font-family:var(--da-mono);transition:background .15s ease,border-color .15s ease}
#da-overlay-root .x{width:32px;font-size:18px;line-height:1;padding:0}
#da-overlay-root .rf{padding:0 10px 0 8px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;gap:6px}
#da-overlay-root .rf svg{width:13px;height:13px;display:block}
#da-overlay-root .rf[data-busy="1"] svg{animation:da-spin .8s linear infinite}
@keyframes da-spin{to{transform:rotate(360deg)}}
#da-overlay-root .x:hover,#da-overlay-root .rf:hover{background:var(--da-cream);border-color:var(--da-ink)}
#da-overlay-root .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 0}
#da-overlay-root .stat{padding:12px 12px 10px;border:1px solid var(--da-rule-2);background:var(--da-page-2)}
#da-overlay-root .stat .n{font-family:var(--da-display);font-size:26px;font-weight:800;margin:0;letter-spacing:-.03em;color:var(--da-ink);line-height:1;font-variant-numeric:tabular-nums}
#da-overlay-root .stat .l{margin:6px 0 0;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--da-muted);font-weight:600}
#da-overlay-root .bar{height:4px;background:var(--da-cream);overflow:hidden;margin-top:10px;border:1px solid var(--da-rule-2)}
#da-overlay-root .bar > i{display:block;height:100%;background:var(--da-stamp);animation:da-fill .9s cubic-bezier(.22,1,.36,1) both}
@keyframes da-fill{from{transform:translateX(-100%)}to{transform:none}}
#da-overlay-root .sec{margin-top:18px}
#da-overlay-root .sec:first-child{margin-top:0}
#da-overlay-root .sec h2{margin:0 0 10px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--da-stamp);font-weight:700}
#da-overlay-root .plate{position:relative;padding:18px 74px 16px 18px;border:1px dashed var(--da-rule-2);background:var(--da-page-2);text-align:center}
#da-overlay-root .plate .mark{font-size:clamp(26px,6vw,38px);margin:0;color:var(--da-ink);line-height:1.05;overflow-wrap:anywhere}
#da-overlay-root .plate .cap{margin:8px 0 0;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--da-muted);font-weight:600}
#da-overlay-root .wax{position:absolute;right:-6px;top:-10px;width:66px;height:66px;transform:rotate(-8deg);filter:drop-shadow(0 8px 14px rgba(154,20,33,.4));pointer-events:none;animation:da-wax .8s cubic-bezier(.2,.8,.2,1) .3s both}
@keyframes da-wax{0%{transform:translateY(-40px) scale(1.3) rotate(-16deg);opacity:0}60%{transform:translateY(2px) scale(.96) rotate(-6deg);opacity:1}100%{transform:rotate(-8deg);opacity:1}}
#da-overlay-root .wax img{width:100%;height:100%;display:block;object-fit:contain;-webkit-user-drag:none}
#da-overlay-root .wax::after{content:"";position:absolute;inset:0;pointer-events:none;-webkit-mask:var(--da-wax-img) center/contain no-repeat;mask:var(--da-wax-img) center/contain no-repeat;background:linear-gradient(112deg,transparent 38%,rgba(255,255,255,.55) 48%,rgba(255,255,255,.18) 52%,transparent 62%);background-size:260% 100%;background-position:120% 0;animation:da-sweep 7s cubic-bezier(.45,0,.2,1) 1.6s infinite;mix-blend-mode:screen;opacity:.85}
@keyframes da-sweep{0%{background-position:120% 0}45%,100%{background-position:-20% 0}}
#da-overlay-root .rh{display:grid;grid-template-columns:1fr auto;gap:10px;padding:7px 12px;border:1px solid var(--da-rule-2);border-bottom:0;background:var(--da-cream);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--da-muted);font-weight:600}
#da-overlay-root .reg{list-style:none;margin:0;padding:0;border:1px solid var(--da-rule-2);background:var(--da-page);max-height:min(268px,36vh);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--da-rule-2) transparent}
#da-overlay-root .reg::-webkit-scrollbar{width:8px}
#da-overlay-root .reg::-webkit-scrollbar-thumb{background:var(--da-rule-2);border:2px solid var(--da-page);border-radius:99px}
#da-overlay-root .reg li{display:grid;grid-template-columns:14px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--da-rule);animation:da-row .4s cubic-bezier(.22,1,.36,1) both}
#da-overlay-root .reg li:last-child{border-bottom:0}
#da-overlay-root .reg li:nth-child(even){background:var(--da-page-2)}
@keyframes da-row{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
#da-overlay-root .sig{position:relative;width:10px;height:10px;border-radius:50%;flex:0 0 auto;justify-self:center}
#da-overlay-root .sig[data-live="1"]{background:var(--da-ok);box-shadow:0 0 0 2px rgba(31,122,77,.18)}
#da-overlay-root .sig[data-live="1"]::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1.5px solid var(--da-ok);animation:da-pulse 1.8s ease-out infinite}
@keyframes da-pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}
#da-overlay-root .sig[data-live="0"]{background:transparent;border:2px solid var(--da-stamp)}
#da-overlay-root .sig[data-live="?"]{background:var(--da-rule-2)}
#da-overlay-root .reg .nm{font-size:18px;margin:0;color:var(--da-ink);font-weight:600;line-height:1.1;overflow-wrap:anywhere;min-width:0}
#da-overlay-root .reg .st{margin:3px 0 0;font-size:10.5px;color:var(--da-muted);font-weight:500;letter-spacing:.02em}
#da-overlay-root .reg .st[data-live="1"]{color:var(--da-ok)}
#da-overlay-root .reg .st[data-live="0"]{color:var(--da-stamp)}
#da-overlay-root .reg .ct{font-family:var(--da-display);font-size:20px;font-weight:800;color:var(--da-stamp);letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
#da-overlay-root .reg .ct small{display:block;font-family:var(--da-mono);font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--da-muted)}
#da-overlay-root .unsigned{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-top:8px;padding:9px 12px;border:1px dashed var(--da-stamp);color:var(--da-muted);font-size:12px;font-weight:500;background:var(--da-page-2)}
#da-overlay-root .unsigned strong{color:var(--da-ink);font-variant-numeric:tabular-nums}
#da-overlay-root .complete{margin:8px 0 0;color:var(--da-ok);font-size:12px;font-weight:600}
#da-overlay-root .legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;font-size:10px;color:var(--da-muted);font-weight:500}
#da-overlay-root .legend span{display:inline-flex;align-items:flex-start;gap:6px}
#da-overlay-root .legend .sig{width:8px;height:8px;margin-top:3px}
#da-overlay-root .legend .sig::after{display:none}
#da-overlay-root .foot{margin:18px 0 0;font-size:10px;color:var(--da-muted);font-weight:600;display:flex;justify-content:space-between;gap:10px;letter-spacing:.06em;text-transform:uppercase;flex-wrap:wrap}
#da-overlay-root .foot kbd{font-family:var(--da-mono);font-size:10px;padding:2px 7px;border:1px solid var(--da-ink);background:var(--da-page-2);color:var(--da-ink);text-transform:none;letter-spacing:.04em}
@media (max-width:520px){
  #da-overlay-root .card{--mx:22px;max-height:92vh}
  #da-overlay-root .head{padding:16px 14px 12px calc(var(--mx) + 12px)}
  #da-overlay-root .body{padding:12px 14px 16px calc(var(--mx) + 12px)}
  #da-overlay-root .brand{padding-right:84px}
  #da-overlay-root .rf span{display:none}
  #da-overlay-root .rf{padding:0 8px}
  #da-overlay-root .reg .nm{font-size:15px}
  #da-overlay-root .plate{padding:16px 60px 14px 12px}
}
@media (prefers-reduced-motion:reduce){#da-overlay-root,#da-overlay-root .card,#da-overlay-root .reg li,#da-overlay-root .bar > i,#da-overlay-root .wax,#da-overlay-root .wax::after,#da-overlay-root .sig::after{animation:none!important}#da-overlay-root .wax::after{display:none}}
\`;
  document.head.appendChild(style);
  const root = document.createElement("div");
  root.id = "da-overlay-root";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Dev Autographs honorary report");
  document.body.appendChild(root);
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
// Fonts come from other signers' profiles: only a plain family list may reach a style attribute.
function safeFont(f) {
  const v = String(f || "").trim();
  return /^[A-Za-z0-9 ,'"_-]{1,80}$/.test(v) ? v : "";
}
function fontAttr(f) {
  const v = safeFont(f);
  return v ? \` style="font-family:\${esc(v)}"\` : "";
}

// The photographed crown wax seal, cut to transparency. Inlined so the overlay stays self-contained on any host.
const WAX_IMG = "data:image/webp;base64,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";

/**
 * Register of signatures. One row per signature: how many files it sealed in
 * this project (all seals, not just the latest per file) and whether any of
 * that code is still the live version. Live = the newest seal on a path is
 * still this signature's. The ledger can downgrade a path to "changed" if the
 * registry recorded a stop (unsigned edit or takeover) for that hash.
 */
function buildRegister(report) {
  const seals = Array.isArray(report?.seals) ? report.seals : [];
  const norm = (p) => String(p || "").replace(/\\\\/g, "/");
  const latest = new Map();
  for (const s of seals) {
    const p = norm(s.path);
    const old = latest.get(p);
    if (!old || String(s.createdAt || "") >= String(old.createdAt || "")) latest.set(p, s);
  }
  const groups = new Map();
  const fontOf = (mark) => {
    if (report?.codeMark?.displayMark === mark) return report.codeMark.markFont;
    const row = (report?.honor?.ranking || []).find((r) => r.displayMark === mark);
    return row?.markFont;
  };
  for (const s of seals) {
    const mark = String(s.displayMark || "Unknown").trim() || "Unknown";
    let g = groups.get(mark);
    if (!g) {
      g = { mark, font: fontOf(mark), paths: new Set(), live: new Map(), latestAt: "" };
      groups.set(mark, g);
    }
    const p = norm(s.path);
    g.paths.add(p);
    if (String(s.createdAt || "") > g.latestAt) g.latestAt = String(s.createdAt || "");
    const top = latest.get(p);
    if (top && (String(top.displayMark || "Unknown").trim() || "Unknown") === mark) {
      g.live.set(p, String(top.contentSha256 || "").toLowerCase());
    }
  }
  return [...groups.values()].sort(
    (a, b) => b.live.size - a.live.size || b.paths.size - a.paths.size || a.mark.localeCompare(b.mark),
  );
}

/** Ask the registry which live hashes it has since marked stopped. Soft: any failure keeps local truth. */
async function refineWithLedger(groups) {
  const hashes = [];
  const owner = new Map();
  for (const g of groups) {
    for (const [p, h] of g.live) {
      if (/^[0-9a-f]{64}$/.test(h) && hashes.length < 200) {
        hashes.push(h);
        owner.set(h, [g, p]);
      }
    }
  }
  if (!hashes.length || !LEDGER) return false;
  const base = String(LEDGER).replace(/\\/$/, "");
  let touched = false;
  for (let i = 0; i < hashes.length; i += 50) {
    const batch = hashes.slice(i, i + 50);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(base + "/v1/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hashes: batch }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of data?.results || []) {
        const h = String(r?.contentSha256 || "").toLowerCase();
        const hit = owner.get(h);
        if (!hit || !r?.found) continue;
        if (r.current === false || r.stoppedAt) {
          hit[0].live.delete(hit[1]);
          touched = true;
        }
      }
    } catch {
      /* offline or blocked: local view stands */
    }
  }
  return touched;
}

function statusLine(g, checked) {
  const total = g.paths.size;
  const live = g.live.size;
  if (live > 0) {
    return live === total
      ? \`live \xB7 every sealed file is still in place\`
      : \`live \xB7 \${live} of \${total} sealed file\${total === 1 ? "" : "s"} still in place\`;
  }
  return checked
    ? \`changed \xB7 all \${total} sealed file\${total === 1 ? "" : "s"} have been rewritten since\`
    : \`changed \xB7 nothing sealed by this signature is still live\`;
}

function registerHtml(groups, checked) {
  if (!groups.length) return \`<p class="m">No signatures yet.</p>\`;
  const rows = groups.map((g, i) => {
    const live = g.live.size > 0 ? "1" : "0";
    return \`
    <li style="animation-delay:\${Math.min(i, 12) * 30}ms">
      <span class="sig" data-live="\${live}" aria-hidden="true"></span>
      <div>
        <p class="nm"\${fontAttr(g.font)}>\${esc(g.mark)}</p>
        <p class="st" data-live="\${live}">\${esc(statusLine(g, checked))}</p>
      </div>
      <span class="ct">\${esc(g.paths.size)}<small>seal\${g.paths.size === 1 ? "" : "s"}</small></span>
    </li>\`;
  }).join("");
  return \`<div class="rh" aria-hidden="true"><span>Signature</span><span>Seals</span></div><ul class="reg" aria-label="Signatures and how many files each sealed">\${rows}</ul>\`;
}

function timeLabel(d) {
  try { return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); } catch { return ""; }
}

function render(root, report, groups, checked, stamp) {
  const code = report?.codeMark;
  const repo = report?.repoMark;
  const honor = report?.honor || {};
  const sealedFiles = Number(honor.sealedFiles ?? new Set((report?.seals || []).map((s) => String(s.path || ""))).size) || 0;
  const unsignedPct = Math.max(0, Number(honor.unsignedPercent || 0));
  const signedPct = Math.max(0, Number((100 - unsignedPct).toFixed(2)));
  const markFont = repo?.markFont || code?.markFont;
  root.innerHTML = \`
    <div class="card">
      <div class="head">
        <div class="tools">
          <button class="rf" type="button" aria-label="Refresh the report" title="Refresh the report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
            <span>Refresh</span>
          </button>
          <button class="x" type="button" aria-label="Close">\xD7</button>
        </div>
        <div class="brand"><svg class="blot" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="50" cy="50" r="46.5" stroke-width="3.2"/><svg x="27.5" y="27" width="45" height="45" viewBox="0 0 100 100" stroke-width="14" stroke-linejoin="round"><polyline points="-6,-8 50,40 106,-8"/><polyline points="7,-6 7,34 40,65 -2,106"/><polyline points="93,-6 93,34 60,65 102,106"/></svg></svg><p class="k">Dev Autographs \xB7 honorary report</p></div>
        <h1>Who signed this build</h1>
        <p class="m">Contribution out of 100 \xB7 fingerprints only \xB7 never source\${stamp ? \` \xB7 updated \${esc(stamp)}\` : ""}</p>
        <div class="stats">
          <div class="stat"><p class="n">\${esc(sealedFiles)}</p><p class="l">Signed files</p></div>
          <div class="stat"><p class="n">\${esc(signedPct)}%</p><p class="l">Signed share</p></div>
        </div>
        <div class="bar" aria-hidden="true"><i style="width:\${Math.min(100, signedPct)}%"></i></div>
      </div>
      <div class="body">
        <div class="sec">
          <h2>Repo mark</h2>
          <div class="plate">
            <p class="mark"\${fontAttr(markFont)}>\${esc(repo?.displayMark || code?.displayMark || "DA")}</p>
            <p class="cap">\${repo?.displayMark ? "owner signature for this project" : "code mark \xB7 no repo mark claimed"}</p>
            <span class="wax" style="--da-wax-img:url(\${WAX_IMG})"><img src="\${WAX_IMG}" alt="" draggable="false"></span>
          </div>
        </div>
        <div class="sec">
          <h2>Signatures</h2>
          <div class="regwrap">\${registerHtml(groups, checked)}</div>
          \${unsignedPct > 0
            ? \`<div class="unsigned"><span>Unsigned work</span><strong>\${esc(unsignedPct)}/100</strong></div>\`
            : \`<p class="complete">Every tracked file is signed. Ranking is complete.</p>\`}
          <div class="legend" aria-hidden="true">
            <span><i class="sig" data-live="1"></i> live: some of this signature's code is still the shipped version</span>
            <span><i class="sig" data-live="0"></i> changed: everything it sealed has since been rewritten</span>
          </div>
        </div>
        <p class="foot"><span>Sealed with Dev Autographs</span><kbd>Shift + D</kbd></p>
      </div>
    </div>\`;
  root.querySelector(".x")?.addEventListener("click", () => { root.dataset.open = "0"; });
  root.querySelector(".rf")?.addEventListener("click", () => void openOverlay(true));
}

let opening = false;
async function openOverlay(isRefresh) {
  if (opening) return;
  opening = true;
  ensureUi();
  const root = document.getElementById("da-overlay-root");
  const rf = root.querySelector(".rf");
  if (rf) rf.dataset.busy = "1";
  try {
    const report = await loadReport();
    const groups = buildRegister(report);
    const stamp = isRefresh ? timeLabel(new Date()) : "";
    render(root, report, groups, false, stamp);
    root.dataset.open = "1";
    // Live signals: local truth first, then let the registry downgrade anything it has seen change.
    await refineWithLedger(groups);
    const wrap = root.querySelector(".regwrap");
    if (wrap && root.dataset.open === "1") {
      const scroll = wrap.querySelector(".reg")?.scrollTop || 0;
      wrap.innerHTML = registerHtml(groups, true);
      const reg = wrap.querySelector(".reg");
      if (reg) reg.scrollTop = scroll;
    }
  } finally {
    opening = false;
    const rf2 = root.querySelector(".rf");
    if (rf2) rf2.dataset.busy = "0";
  }
}

function toggle() {
  const root = document.getElementById("da-overlay-root");
  if (root?.dataset.open === "1") root.dataset.open = "0";
  else void openOverlay(false);
}

function typingTarget(el) {
  if (!el || !(el instanceof Element)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return !!el.closest("[contenteditable='true']");
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const root = document.getElementById("da-overlay-root");
    if (root) root.dataset.open = "0";
    return;
  }
  if (
    e.key.toLowerCase() === "d" &&
    e.shiftKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !typingTarget(e.target)
  ) {
    e.preventDefault();
    toggle();
  }
});

document.addEventListener("click", (e) => {
  const root = document.getElementById("da-overlay-root");
  if (root && e.target === root) root.dataset.open = "0";
});

document.querySelectorAll("[data-dev-autographs-open]").forEach((el) => {
  el.addEventListener("click", () => void openOverlay(false));
});
`;
}
async function syncOverlayArtifacts(loadIdentity2, loadAllSeals2, sealPathFor2, sealsDirFn, createSeal2, apiBase, cwd = process.cwd()) {
  const hasWeb = await isWebProject(cwd);
  if (!hasWeb) {
    await rebuildSiteReport(loadIdentity2, loadAllSeals2, apiBase, cwd);
    try {
      git(["add", "--", REPORT_NAME, "provenance.json"], cwd);
    } catch {
    }
    return;
  }
  const ledger = resolveLedgerApi(apiBase);
  const report = await rebuildSiteReport(loadIdentity2, loadAllSeals2, ledger, cwd);
  const touched = await upsertOverlayIntoHtml(cwd, report.ledgerApi);
  const all = [REPORT_NAME, "provenance.json", ...touched];
  const id = await loadIdentity2();
  await (0, import_promises.mkdir)(sealsDirFn(cwd), { recursive: true });
  const sealableOverlay = /\.(html?|htm|js|mjs|cjs|json|css|md|tsx|jsx|ts|vue|svelte|astro|php|ejs|njk|hbs)$/i;
  for (const rel of all) {
    const abs = import_node_path.default.join(cwd, rel);
    if (!await exists(abs)) continue;
    try {
      git(["add", "--", rel], cwd);
    } catch {
    }
    if (!sealableOverlay.test(rel)) continue;
    if (rel.startsWith(".pawprints/")) continue;
    try {
      const content = await (0, import_promises.readFile)(abs);
      const seal = createSeal2({
        content,
        path: rel.replace(/\\/g, "/"),
        privateKey: id.privateKey,
        publicKey: id.publicKey,
        displayMark: id.displayMark
      });
      const out = sealPathFor2(rel, cwd);
      await (0, import_promises.mkdir)(import_node_path.default.dirname(out), { recursive: true });
      await (0, import_promises.writeFile)(out, JSON.stringify(seal, null, 2));
      try {
        git(["add", "--", import_node_path.default.relative(cwd, out)], cwd);
      } catch {
      }
    } catch {
    }
  }
  console.log(
    `Dev Autographs: overlay synced (${touched.length} entry file(s), ${report.seals.length} unique seal(s) in report)`
  );
}
var import_promises, import_node_fs, import_node_path, import_node_os, import_node_child_process, import_node_url, import_meta, REPORT_NAME, OVERLAY_JS, BOOT_NAME, MARK_START, MARK_END, MARK_START_JSX, MARK_END_JSX, WALK_SKIP, WEB_PKG_KEYS, HTML_SHELL_NAMES, LAYOUT_BASENAMES, SKIP_JSX_SHELLS, bootVersionCache, HONOR_SEALABLE, HONOR_SKIP;
var init_report = __esm({
  "src/report.ts"() {
    "use strict";
    import_promises = require("node:fs/promises");
    import_node_fs = require("node:fs");
    import_node_path = __toESM(require("node:path"), 1);
    import_node_os = __toESM(require("node:os"), 1);
    import_node_child_process = require("node:child_process");
    import_node_url = require("node:url");
    init_dist2();
    init_registry_generated();
    import_meta = {};
    REPORT_NAME = "dev-autographs.report.json";
    OVERLAY_JS = "dev-autographs-overlay.js";
    BOOT_NAME = "dev-autographs-boot.js";
    MARK_START = "<!-- dev-autographs-overlay:start -->";
    MARK_END = "<!-- dev-autographs-overlay:end -->";
    MARK_START_JSX = "{/* dev-autographs-overlay:start */}";
    MARK_END_JSX = "{/* dev-autographs-overlay:end */}";
    WALK_SKIP = /* @__PURE__ */ new Set([
      "node_modules",
      ".git",
      ".hg",
      ".svn",
      ".next",
      ".nuxt",
      ".output",
      ".svelte-kit",
      ".vercel",
      ".netlify",
      ".turbo",
      ".cache",
      ".parcel-cache",
      "coverage",
      "dist",
      "build",
      "out",
      "target",
      "vendor",
      "__pycache__",
      ".venv",
      "venv",
      "Pods",
      "DerivedData",
      ".idea",
      ".vscode",
      "storybook-static",
      "cypress",
      "playwright-report"
    ]);
    WEB_PKG_KEYS = [
      "next",
      "nuxt",
      "vite",
      "vitest",
      "astro",
      "gatsby",
      "remix",
      "@remix-run/react",
      "@remix-run/node",
      "@remix-run/cloudflare",
      "@sveltejs/kit",
      "svelte",
      "vue",
      "@angular/core",
      "@angular/cli",
      "react-scripts",
      "react-dom",
      "preact",
      "solid-js",
      "@builder.io/qwik",
      "ember-source",
      "ember-cli",
      "@ember/application",
      "eleventy",
      "@11ty/eleventy",
      "parcel",
      "@parcel/core",
      "webpack",
      "webpack-dev-server",
      "rollup",
      "@vitejs/plugin-react",
      "@vitejs/plugin-vue",
      "expo",
      "expo-router",
      "react-native-web",
      "docusaurus",
      "@docusaurus/core",
      "vitepress",
      "docsify",
      "hexo",
      "vuepress",
      "@vuepress/core",
      "gridsome",
      "sapper",
      "qwik-city",
      "@tanstack/start",
      "@tanstack/react-start",
      "waku",
      "redwoodjs",
      "@redwoodjs/core",
      "blitz",
      "nest"
      // Nest alone is API — handled with html/static signals
    ];
    HTML_SHELL_NAMES = /* @__PURE__ */ new Set([
      "index.html",
      "index.htm",
      "app.html",
      "document.html",
      "200.html",
      "404.html",
      "_document.html"
    ]);
    LAYOUT_BASENAMES = /* @__PURE__ */ new Set([
      "layout.tsx",
      "layout.jsx",
      "layout.js",
      "layout.ts",
      "root.tsx",
      "root.jsx",
      "root.js",
      "_document.tsx",
      "_document.jsx",
      "_document.js",
      "_document.ts",
      "_app.tsx",
      "_app.jsx",
      "_app.js",
      "app.tsx",
      "app.jsx",
      "app.js",
      "app.vue",
      "App.vue",
      "app.svelte",
      "App.svelte",
      "+layout.svelte",
      "+layout.tsx",
      "+layout.jsx",
      "layout.vue",
      "default.vue",
      "Layout.astro",
      "layout.astro",
      "BaseLayout.astro",
      "RootLayout.astro",
      "Document.tsx",
      "Document.jsx"
    ]);
    SKIP_JSX_SHELLS = /* @__PURE__ */ new Set([
      "app.tsx",
      "app.jsx",
      "app.js",
      "app.ts"
    ]);
    HONOR_SEALABLE = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|html|htm|md|py|go|rs|java|kt|swift|cs|rb|php|vue|svelte|astro|ejs|njk|hbs)$/i;
    HONOR_SKIP = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|provenance\.json|dev-autographs\.(report\.json|boot\.js|overlay\.js)|node_modules\/|\.pawprints\/)/i;
  }
});

// src/summary.ts
var summary_exports = {};
__export(summary_exports, {
  loadSummarySettings: () => loadSummarySettings,
  localSummaryPath: () => localSummaryPath,
  mirrorUserSummary: () => mirrorUserSummary,
  saveSummarySettings: () => saveSummarySettings,
  summarySettingsPath: () => summarySettingsPath
});
function homeDir() {
  return import_node_path2.default.join(import_node_os2.default.homedir(), ".dev-autographs");
}
function localSummaryPath() {
  return import_node_path2.default.join(homeDir(), "summary.json");
}
function summarySettingsPath() {
  return import_node_path2.default.join(homeDir(), "github-summary.json");
}
async function loadSummarySettings() {
  try {
    return JSON.parse(await (0, import_promises2.readFile)(summarySettingsPath(), "utf8"));
  } catch {
    return {};
  }
}
async function saveSummarySettings(s) {
  await (0, import_promises2.mkdir)(homeDir(), { recursive: true });
  await (0, import_promises2.writeFile)(summarySettingsPath(), JSON.stringify(s, null, 2), { mode: 384 });
}
async function mirrorUserSummary(apiBase, githubLogin) {
  const api = apiBase.replace(/\/$/, "");
  const login = githubLogin.replace(/^@/, "");
  if (!login) return null;
  let summary;
  try {
    const res = await fetch(
      `${api}/v1/accounts/summary?githubLogin=${encodeURIComponent(login)}`
    );
    if (!res.ok) {
      console.warn(`Dev Autographs: summary fetch failed (${res.status})`);
      return null;
    }
    summary = await res.json();
  } catch (e) {
    console.warn(
      `Dev Autographs: summary unreachable (${e instanceof Error ? e.message : e})`
    );
    return null;
  }
  await (0, import_promises2.mkdir)(homeDir(), { recursive: true });
  await (0, import_promises2.writeFile)(localSummaryPath(), JSON.stringify(summary, null, 2), { mode: 384 });
  const settings = await loadSummarySettings();
  if (settings.githubToken) {
    try {
      const mirrored = await upsertSummaryGist(summary, settings);
      if (mirrored.gistId && mirrored.gistId !== settings.summaryGistId) {
        settings.summaryGistId = mirrored.gistId;
        await saveSummarySettings(settings);
      }
      if (mirrored.url) {
        summary.gistUrl = mirrored.url;
        await (0, import_promises2.writeFile)(localSummaryPath(), JSON.stringify(summary, null, 2), { mode: 384 });
        console.log(`Dev Autographs: mirrored summary gist \u2192 ${mirrored.url}`);
      }
    } catch (e) {
      console.warn(
        `Dev Autographs: gist mirror skipped (${e instanceof Error ? e.message : e})`
      );
    }
  } else {
    console.log(`Dev Autographs: wrote personal summary \u2192 ${localSummaryPath()}`);
    console.log("  Tip: set githubToken in ~/.dev-autographs/github-summary.json to mirror a gist.");
  }
  return summary;
}
async function upsertSummaryGist(summary, settings) {
  const token = settings.githubToken;
  const filename = "devautographs-summary.json";
  const body = {
    description: `Dev Autographs personal summary for @${summary.githubLogin}`,
    public: settings.privateGist === false,
    files: {
      [filename]: { content: JSON.stringify(summary, null, 2) }
    }
  };
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "Dev-Autographs",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (settings.summaryGistId) {
    const res = await fetch(`https://api.github.com/gists/${settings.summaryGistId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        description: body.description,
        files: body.files
      })
    });
    if (res.ok) {
      const data2 = await res.json();
      return { gistId: data2.id, url: data2.html_url };
    }
  }
  const create = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!create.ok) {
    const err = await create.text();
    throw new Error(`gist create ${create.status}: ${err.slice(0, 200)}`);
  }
  const data = await create.json();
  return { gistId: data.id, url: data.html_url };
}
var import_promises2, import_node_path2, import_node_os2;
var init_summary = __esm({
  "src/summary.ts"() {
    "use strict";
    import_promises2 = require("node:fs/promises");
    import_node_path2 = __toESM(require("node:path"), 1);
    import_node_os2 = __toESM(require("node:os"), 1);
  }
});

// src/repo-ink.ts
var repo_ink_exports = {};
__export(repo_ink_exports, {
  ensureDevAutographsHome: () => ensureDevAutographsHome,
  loadLocalSettings: () => loadLocalSettings,
  maybeAutoRepoInk: () => maybeAutoRepoInk,
  publishRepoInk: () => publishRepoInk,
  revokeRepoInk: () => revokeRepoInk,
  saveLocalSettings: () => saveLocalSettings
});
function git2(args, cwd) {
  return (0, import_node_child_process2.execFileSync)("git", args, { cwd, encoding: "utf8" }).trim();
}
async function exists2(p) {
  try {
    await (0, import_promises3.access)(p, import_node_fs2.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
function parseRepoFullName2(remote) {
  const r = remote.trim();
  if (r.startsWith("git@github.com:")) {
    return r.slice("git@github.com:".length).replace(/\.git$/, "");
  }
  const m = /github\.com[/:]([^/]+\/[^/.]+)/i.exec(r);
  return m?.[1]?.replace(/\.git$/, "") ?? null;
}
function treeMerkle(cwd) {
  const treeSha = git2(["rev-parse", "HEAD"], cwd);
  const listing = git2(["ls-tree", "-r", "HEAD"], cwd);
  return { treeSha, contentMerkle: sha256Hex(listing) };
}
async function loadLocalSettings() {
  const p = import_node_path3.default.join(import_node_os3.default.homedir(), ".dev-autographs", "settings.json");
  try {
    const raw = JSON.parse(await (0, import_promises3.readFile)(p, "utf8"));
    return { autoRepoInk: raw.autoRepoInk !== false };
  } catch {
    return { autoRepoInk: true };
  }
}
async function saveLocalSettings(s) {
  const dir = import_node_path3.default.join(import_node_os3.default.homedir(), ".dev-autographs");
  await (0, import_promises3.mkdir)(dir, { recursive: true });
  await (0, import_promises3.writeFile)(import_node_path3.default.join(dir, "settings.json"), JSON.stringify(s, null, 2), { mode: 384 });
}
async function isForkedGithubRepo(repoFullName, cwd) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Dev-Autographs"
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.fork);
    }
  } catch {
  }
  try {
    const upstream = git2(["remote", "get-url", "upstream"], cwd);
    const up = parseRepoFullName2(upstream);
    if (up && up.toLowerCase() !== repoFullName.toLowerCase()) {
      const upOwner = up.split("/")[0];
      const owner = repoFullName.split("/")[0];
      if (upOwner.toLowerCase() !== owner.toLowerCase()) return true;
    }
  } catch {
  }
  return false;
}
async function publishRepoInk(loadIdentity2, apiBase, cwd = process.cwd(), opts = {}) {
  const id = await loadIdentity2();
  if (!id.githubLogin) {
    console.error("Dev Autographs: link GitHub first (dev-autographs login / paw-prints login).");
    process.exitCode = 1;
    return;
  }
  let remote;
  try {
    remote = git2(["remote", "get-url", "origin"], cwd);
  } catch {
    console.error("Dev Autographs: no origin remote.");
    process.exitCode = 1;
    return;
  }
  const repoFullName = parseRepoFullName2(remote);
  if (!repoFullName) {
    console.error("Dev Autographs: origin is not a GitHub remote.");
    process.exitCode = 1;
    return;
  }
  const owner = repoFullName.split("/")[0];
  if (owner.toLowerCase() !== id.githubLogin.toLowerCase()) {
    console.error(
      `Dev Autographs: Repo ink requires you own ${repoFullName}. Collaborators / other remotes use Dev ink only.`
    );
    process.exitCode = 1;
    return;
  }
  if (await isForkedGithubRepo(repoFullName, cwd)) {
    console.error(
      `Dev Autographs: ${repoFullName} is a fork \u2014 Repo ink is only for repos you created. Dev ink (file seals) still applies.`
    );
    process.exitCode = 1;
    return;
  }
  const api = apiBase.replace(/\/$/, "");
  const existing = await fetch(`${api}/v1/repo-ink?repo=${encodeURIComponent(repoFullName)}`);
  const look = await existing.json();
  if (look.active && !opts.force) {
    console.log(`Dev Autographs: repo already inked (${repoFullName}).`);
    if (look.firstSigner) {
      console.log(
        `  First signer authenticity: @${look.firstSigner.ownerLogin} at ${look.firstSigner.createdAt}`
      );
    }
    return;
  }
  const { treeSha, contentMerkle } = treeMerkle(cwd);
  const byMerkle = await fetch(
    `${api}/v1/repo-ink?originTreeSha=${encodeURIComponent(treeSha)}`
  );
  const merkleLook = await byMerkle.json();
  const lock = look.originLock || merkleLook.originLock;
  if (lock && lock.ownerLogin.toLowerCase() !== id.githubLogin.toLowerCase()) {
    console.error(
      `Dev Autographs: origin already signed by @${lock.ownerLogin} (${lock.repoFullName}). Zip/rehost Repo ink is locked until they revoke.`
    );
    process.exitCode = 1;
    return;
  }
  const originCache = import_node_path3.default.join(import_node_os3.default.homedir(), ".dev-autographs", "origin-tree.json");
  let originMap = {};
  try {
    originMap = JSON.parse(await (0, import_promises3.readFile)(originCache, "utf8"));
  } catch {
  }
  const lineageKey = (0, import_node_crypto2.createHash)("sha256").update(contentMerkle).digest("hex").slice(0, 32);
  let originTreeSha = look.active?.originTreeSha || originMap[lineageKey] || treeSha;
  if (look.firstSigner && look.active?.originTreeSha) {
    originTreeSha = look.active.originTreeSha;
  }
  originMap[lineageKey] = originTreeSha;
  await (0, import_promises3.mkdir)(import_node_path3.default.dirname(originCache), { recursive: true });
  await (0, import_promises3.writeFile)(originCache, JSON.stringify(originMap, null, 2));
  const repoId = sha256Hex(`github:${repoFullName}`).slice(0, 16);
  const ink = createRepoInk({
    repoFullName,
    repoId,
    treeSha,
    originTreeSha,
    contentMerkle,
    ownerLogin: id.githubLogin,
    privateKey: id.privateKey,
    publicKey: id.publicKey,
    displayMark: id.repoDisplayMark?.trim() || id.displayMark
  });
  const res = await fetch(`${api}/v1/repo-ink`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...ink, claimedOwner: id.githubLogin, isFork: false })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Dev Autographs: repo ink failed: ${data.error ?? res.status}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Dev Autographs: REPO INK stamped on ${repoFullName}`);
  console.log(`  mark: ${id.displayMark} \xB7 @${id.githubLogin}`);
  console.log(`  tree: ${treeSha.slice(0, 12)}\u2026`);
  console.log(`  signer: ${fingerprint(id.publicKey)}`);
  if (data.firstSigner) {
    console.log(
      `  Authenticity (signed first): @${data.firstSigner.ownerLogin} \xB7 ${data.firstSigner.createdAt}`
    );
  }
  console.log("  Tip: sign at repo creation. Auto Repo-ink is on by default.");
  try {
    const { mirrorUserSummary: mirrorUserSummary2 } = await Promise.resolve().then(() => (init_summary(), summary_exports));
    await mirrorUserSummary2(api, id.githubLogin);
  } catch {
  }
}
async function revokeRepoInk(loadIdentity2, apiBase, cwd = process.cwd()) {
  const id = await loadIdentity2();
  if (!id.githubLogin) {
    console.error("Dev Autographs: link GitHub first (dev-autographs login).");
    process.exitCode = 1;
    return;
  }
  let remote;
  try {
    remote = git2(["remote", "get-url", "origin"], cwd);
  } catch {
    console.error("Dev Autographs: no origin remote.");
    process.exitCode = 1;
    return;
  }
  const repoFullName = parseRepoFullName2(remote);
  if (!repoFullName) {
    console.error("Dev Autographs: origin is not a GitHub remote.");
    process.exitCode = 1;
    return;
  }
  const api = apiBase.replace(/\/$/, "");
  const look = await (await fetch(`${api}/v1/repo-ink?repo=${encodeURIComponent(repoFullName)}`)).json();
  if (!look.active) {
    console.log(`Dev Autographs: ${repoFullName} has no active repo signature.`);
    return;
  }
  const repoId = look.active.repoId;
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const payload = ["devautographs-repo-revoke-v1", `repoId=${repoId}`, `publicKey=${id.publicKey}`, `updatedAt=${updatedAt}`].join("\n");
  const res = await fetch(`${api}/v1/repo-ink/revoke`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      repoId,
      reason: "owner_revoked",
      publicKey: id.publicKey,
      updatedAt,
      signature: signBytes(payload, id.privateKey)
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Dev Autographs: revoke failed: ${data.error_description ?? data.error ?? res.status}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Dev Autographs: repo signature removed from ${repoFullName} (${data.revoked ?? 0} entry).`);
  console.log("  Another GitHub account can now sign this origin tree.");
}
async function maybeAutoRepoInk(loadIdentity2, apiBase, cwd = process.cwd()) {
  const settings = await loadLocalSettings();
  if (!settings.autoRepoInk && process.env.DEV_AUTOGRAPHS_AUTO_REPO_INK !== "1") {
    if (process.env.DEV_AUTOGRAPHS_AUTO_REPO_INK === "0") return;
    if (!settings.autoRepoInk) return;
  }
  if (process.env.DEV_AUTOGRAPHS_AUTO_REPO_INK === "0") return;
  try {
    const id = await loadIdentity2();
    if (!id.githubLogin) return;
    const remote = git2(["remote", "get-url", "origin"], cwd);
    const full = parseRepoFullName2(remote);
    if (!full) return;
    const owner = full.split("/")[0];
    if (owner.toLowerCase() !== id.githubLogin.toLowerCase()) return;
    if (await isForkedGithubRepo(full, cwd)) {
      console.log("Dev Autographs: fork detected \u2014 skipping Repo ink (Dev ink still published).");
      return;
    }
    const api = apiBase.replace(/\/$/, "");
    const existing = await fetch(`${api}/v1/repo-ink?repo=${encodeURIComponent(full)}`);
    const look = await existing.json();
    if (look.active) return;
    console.log("Dev Autographs: unsigned created repo \u2014 auto Repo-ink (disable in settings if needed)\u2026");
    await publishRepoInk(loadIdentity2, apiBase, cwd);
  } catch {
  }
}
async function ensureDevAutographsHome() {
  const home = import_node_path3.default.join(import_node_os3.default.homedir(), ".dev-autographs");
  await (0, import_promises3.mkdir)(home, { recursive: true });
  const modern = import_node_path3.default.join(home, "identity.json");
  if (await exists2(modern)) return;
  for (const legacy of [
    import_node_path3.default.join(import_node_os3.default.homedir(), ".codeink", "identity.json"),
    import_node_path3.default.join(import_node_os3.default.homedir(), ".pawprints", "identity.json")
  ]) {
    if (await exists2(legacy)) {
      await (0, import_promises3.writeFile)(modern, await (0, import_promises3.readFile)(legacy, "utf8"), { mode: 384 });
      console.log(`Dev Autographs: migrated identity from ${legacy} \u2192 ~/.dev-autographs`);
      return;
    }
  }
}
var import_node_child_process2, import_node_crypto2, import_promises3, import_node_fs2, import_node_path3, import_node_os3;
var init_repo_ink = __esm({
  "src/repo-ink.ts"() {
    "use strict";
    import_node_child_process2 = require("node:child_process");
    import_node_crypto2 = require("node:crypto");
    import_promises3 = require("node:fs/promises");
    import_node_fs2 = require("node:fs");
    import_node_path3 = __toESM(require("node:path"), 1);
    import_node_os3 = __toESM(require("node:os"), 1);
    init_dist2();
  }
});

// src/hooks.ts
var hooks_exports = {};
__export(hooks_exports, {
  detectUnsignedChanges: () => detectUnsignedChanges,
  ensureHooksHealthy: () => ensureHooksHealthy,
  globalHooksDir: () => globalHooksDir,
  installGitHooks: () => installGitHooks,
  installGlobalGitHooks: () => installGlobalGitHooks,
  openBrowser: () => openBrowser,
  postCommitNote: () => postCommitNote,
  sealAndPublishPush: () => sealAndPublishPush,
  sealStagedFiles: () => sealStagedFiles,
  signerSeatLost: () => signerSeatLost
});
async function exists3(p) {
  try {
    await (0, import_promises4.access)(p, import_node_fs3.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
function git3(args, cwd = process.cwd()) {
  return (0, import_node_child_process3.execFileSync)("git", args, { cwd, encoding: "utf8" }).trim();
}
function clawPath() {
  if (process.argv[1]) return import_node_path4.default.resolve(process.argv[1]);
  return import_node_path4.default.resolve(process.cwd(), "node_modules", "paw-prints", "bin", "paw-prints.cjs");
}
function hookScripts(cli) {
  const preCommit = `#!/bin/sh
# Dev Autographs \u2014 seal staged source files before commit
${NODE_TLS_ENV} node "${cli}" seal-staged || exit 1
`;
  const postCommit = `#!/bin/sh
# Dev Autographs \u2014 detect signed\u2192unsigned once (further unsigned churn stays quiet)
${NODE_TLS_ENV} node "${cli}" detect-unsigned || true
`;
  const prePush = `#!/bin/sh
# Dev Autographs \u2014 seal + publish fingerprints to ledger on push
${NODE_TLS_ENV} node "${cli}" seal-push || exit 1
`;
  return {
    preCommit: preCommit.replace(/\r\n/g, "\n"),
    postCommit: postCommit.replace(/\r\n/g, "\n"),
    prePush: prePush.replace(/\r\n/g, "\n")
  };
}
async function writeHooks(hooksDir) {
  await (0, import_promises4.mkdir)(hooksDir, { recursive: true });
  const cli = clawPath().replace(/\\/g, "/");
  const { preCommit, postCommit, prePush } = hookScripts(cli);
  const files = [
    ["pre-commit", preCommit],
    ["post-commit", postCommit],
    ["pre-push", prePush]
  ];
  for (const [name, body] of files) {
    const p = import_node_path4.default.join(hooksDir, name);
    await (0, import_promises4.writeFile)(p, body, { mode: 493 });
    try {
      await (0, import_promises4.chmod)(p, 493);
    } catch {
    }
  }
}
async function installGitHooks(cwd = process.cwd()) {
  const gitDir = git3(["rev-parse", "--git-dir"], cwd);
  const hooksDir = import_node_path4.default.resolve(cwd, gitDir, "hooks");
  await writeHooks(hooksDir);
  console.log("Installed Dev Autographs git hooks (this repo):");
  console.log(`  ${hooksDir}`);
  console.log("  pre-commit  \u2192 seal staged files");
  console.log("  post-commit \u2192 detect unsigned_from (one stop)");
  console.log("  pre-push    \u2192 seal + publish ledger fingerprints");
}
function globalHooksDir() {
  return import_node_path4.default.join(import_node_os4.default.homedir(), ".dev-autographs", "hooks");
}
async function installGlobalGitHooks() {
  const hooksDir = globalHooksDir();
  await writeHooks(hooksDir);
  const templateDir = import_node_path4.default.join(import_node_os4.default.homedir(), ".dev-autographs", "git-template");
  await writeHooks(import_node_path4.default.join(templateDir, "hooks"));
  const hooksPath = hooksDir.replace(/\\/g, "/");
  const templatePath = templateDir.replace(/\\/g, "/");
  git3(["config", "--global", "core.hooksPath", hooksPath]);
  git3(["config", "--global", "init.templateDir", templatePath]);
  console.log("Installed Dev Autographs global hooks (every repo on this machine):");
  console.log(`  ${hooksDir}`);
  console.log("  git config --global core.hooksPath \u2192 set");
  console.log("  git config --global init.templateDir \u2192 set");
  console.log("  pre-commit \u2192 seal staged files");
  console.log("  pre-push   \u2192 seal + publish fingerprints");
}
async function ensureHooksHealthy(cwd = process.cwd()) {
  try {
    const need = ["pre-commit", "pre-push"];
    const primary = globalHooksDir();
    let ok = true;
    for (const name of need) {
      if (!await exists3(import_node_path4.default.join(primary, name))) ok = false;
    }
    if (!ok) {
      await installGlobalGitHooks();
      ok = true;
    } else {
      try {
        const configured = git3(["config", "--global", "--get", "core.hooksPath"]);
        const expected = primary.replace(/\\/g, "/");
        if (configured.replace(/\\/g, "/") !== expected) {
          git3(["config", "--global", "core.hooksPath", expected]);
        }
      } catch {
        git3(["config", "--global", "core.hooksPath", primary.replace(/\\/g, "/")]);
      }
    }
    try {
      let hooksPathSet = false;
      try {
        git3(["config", "--global", "--get", "core.hooksPath"]);
        hooksPathSet = true;
      } catch {
        hooksPathSet = false;
      }
      if (!hooksPathSet) {
        const gitDir = git3(["rev-parse", "--git-dir"], cwd);
        const localHooks = import_node_path4.default.resolve(cwd, gitDir, "hooks");
        for (const name of need) {
          if (!await exists3(import_node_path4.default.join(localHooks, name))) {
            await installGitHooks(cwd);
            break;
          }
        }
      }
    } catch {
    }
    return true;
  } catch {
    return false;
  }
}
function openBrowser(url) {
  if (!/^https?:\/\//i.test(url)) return;
  try {
    if (process.platform === "win32") {
      (0, import_node_child_process3.spawn)("rundll32", ["url.dll,FileProtocolHandler", url], { detached: true, stdio: "ignore" }).unref();
    } else if (process.platform === "darwin") {
      (0, import_node_child_process3.spawn)("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      (0, import_node_child_process3.spawn)("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
  }
}
async function signerSeatLost(publicKey, apiBase) {
  try {
    const res = await fetch(
      `${apiBase.replace(/\/$/, "")}/v1/auth/device/status?public_key=${encodeURIComponent(publicKey)}`,
      { signal: AbortSignal.timeout(1500) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    if (data.status !== "replaced") return false;
    console.error(`Dev Autographs: someone inked @${data.githubLogin ?? "your GitHub"} on another device${data.replacedAt ? ` (${data.replacedAt.slice(0, 16).replace("T", " ")} UTC)` : ""}.`);
    console.error("  This PC no longer signs. Not you? Secure your GitHub account. Then open Dev Autographs and Ink again here.");
    return true;
  } catch {
    return false;
  }
}
async function sealStagedFiles(loadIdentity2, sealPathFor2, sealsDir2, cwd = process.cwd()) {
  let staged;
  try {
    staged = git3(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], cwd);
  } catch {
    console.error("Not a git repository (or git missing).");
    process.exitCode = 1;
    return;
  }
  const files = staged.split(/\r?\n/).map((f) => f.trim()).filter(Boolean).filter((f) => SEALABLE.test(f) && !SKIP.test(f));
  if (files.length === 0) {
    console.log("Dev Autographs: no sealable staged files.");
    return;
  }
  const id = await loadIdentity2();
  if (await signerSeatLost(id.publicKey, resolveLedgerApi())) {
    return;
  }
  await (0, import_promises4.mkdir)(sealsDir2(cwd), { recursive: true });
  let sealed = 0;
  for (const rel of files) {
    const abs = import_node_path4.default.resolve(cwd, rel);
    if (!await exists3(abs)) continue;
    const content = await (0, import_promises4.readFile)(abs);
    const seal = createSeal({
      content,
      path: rel.replace(/\\/g, "/"),
      privateKey: id.privateKey,
      publicKey: id.publicKey,
      displayMark: id.displayMark
    });
    const out = sealPathFor2(rel, cwd);
    await (0, import_promises4.writeFile)(out, JSON.stringify(seal, null, 2));
    try {
      git3(["add", "--", import_node_path4.default.relative(cwd, out)], cwd);
    } catch {
    }
    sealed++;
    console.log(`Dev Autographs: sealed ${rel} as ${id.displayMark}`);
  }
  console.log(`Dev Autographs: sealed ${sealed} file(s).`);
  try {
    const loadAllSealsLocal = async (dir = cwd) => {
      const { readdir: readdir4, readFile: rf } = await import("node:fs/promises");
      const { verifySeal: verifySeal2 } = await Promise.resolve().then(() => (init_dist2(), dist_exports));
      const d = sealsDir2(dir);
      if (!await exists3(d)) return [];
      const files2 = await readdir4(d);
      const out = [];
      for (const f of files2) {
        if (!f.endsWith(".json")) continue;
        try {
          const seal = JSON.parse(await rf(import_node_path4.default.join(d, f), "utf8"));
          if (verifySeal2(seal)) out.push(seal);
        } catch {
        }
      }
      return out;
    };
    await syncOverlayArtifacts(
      loadIdentity2,
      loadAllSealsLocal,
      sealPathFor2,
      sealsDir2,
      createSeal,
      resolveLedgerApi(),
      cwd
    );
  } catch (e) {
    console.warn(
      `Dev Autographs: overlay sync skipped (${e instanceof Error ? e.message : e})`
    );
  }
}
async function postCommitNote() {
  console.log("Dev Autographs: commit recorded. Only sealed files earn overlay credit.");
}
async function detectUnsignedChanges(sealPathFor2, apiBase, cwd = process.cwd(), loadIdentity2) {
  let id;
  try {
    id = loadIdentity2 ? await loadIdentity2() : void 0;
  } catch {
    id = void 0;
  }
  if (!id?.privateKey || !id.publicKey) return;
  let files = [];
  try {
    files = git3(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], cwd).split(/\r?\n/).map((f) => f.trim()).filter(Boolean).filter((f) => SEALABLE.test(f) && !SKIP.test(f));
  } catch {
    return;
  }
  if (!files.length) return;
  const cache = await loadLineageCache();
  const events = [];
  for (const rel of files) {
    const abs = import_node_path4.default.resolve(cwd, rel);
    if (!await exists3(abs)) continue;
    const content = await (0, import_promises4.readFile)(abs);
    const contentSha = sha256Hex(content);
    const ph = pathHashOf(rel);
    const prev = cache.entries[ph];
    let sealedSha = prev?.contentSha256;
    const sealFile = sealPathFor2(rel, cwd);
    try {
      const seal = JSON.parse(await (0, import_promises4.readFile)(sealFile, "utf8"));
      sealedSha = seal.contentSha256;
    } catch {
    }
    if (!sealedSha) continue;
    if (sealedSha === contentSha) continue;
    events.push({ pathHash: ph, contentSha256: contentSha });
  }
  if (!events.length) {
    console.log("Dev Autographs: commit recorded. Only sealed files earn overlay credit.");
    return;
  }
  const api = apiBase.replace(/\/$/, "");
  const at = (/* @__PURE__ */ new Date()).toISOString();
  const digest = sha256Hex(
    events.map((e) => `${e.pathHash.toLowerCase()}:${e.contentSha256.toLowerCase()}`).join("\n")
  );
  const payload = ["devautographs-unsigned-v1", `publicKey=${id.publicKey}`, `at=${at}`, `events=${digest}`].join("\n");
  const signature = signBytes(payload, id.privateKey);
  try {
    const res = await fetch(`${api}/v1/ledger/unsigned`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events, publicKey: id.publicKey, at, signature })
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn(`Dev Autographs: unsigned_from report failed: ${data.error ?? res.status}`);
      return;
    }
    const n = data.recorded?.length ?? 0;
    if (n > 0) {
      console.log(
        `Dev Autographs: recorded unsigned_from on ${n} path(s) \u2014 prior mark stopped (further unsigned edits stay quiet).`
      );
    } else {
      console.log("Dev Autographs: unsigned edits noted (already quiet for these paths).");
    }
  } catch (e) {
    console.warn(
      `Dev Autographs: registry unreachable for unsigned_from (${e instanceof Error ? e.message : e})`
    );
  }
}
function lineageCachePath() {
  const modern = import_node_path4.default.join(import_node_os4.default.homedir(), ".dev-autographs", "lineage-cache.json");
  const legacy = import_node_path4.default.join(import_node_os4.default.homedir(), ".pawprints", "lineage-cache.json");
  return modern;
}
async function lineageCacheReadPath() {
  const modern = import_node_path4.default.join(import_node_os4.default.homedir(), ".dev-autographs", "lineage-cache.json");
  const legacy = import_node_path4.default.join(import_node_os4.default.homedir(), ".pawprints", "lineage-cache.json");
  if (await exists3(modern)) return modern;
  if (await exists3(legacy)) return legacy;
  return modern;
}
async function loadLineageCache() {
  try {
    return JSON.parse(await (0, import_promises4.readFile)(await lineageCacheReadPath(), "utf8"));
  } catch {
    return { entries: {} };
  }
}
async function saveLineageCache(cache) {
  await (0, import_promises4.mkdir)(import_node_path4.default.dirname(lineageCachePath()), { recursive: true });
  await (0, import_promises4.writeFile)(lineageCachePath(), JSON.stringify(cache, null, 2), { mode: 384 });
}
function pathHashOf(rel) {
  return sha256Hex(rel.replace(/\\/g, "/").toLowerCase());
}
function filesBeingPushed(cwd) {
  try {
    let range = "";
    try {
      const upstream = git3(["rev-parse", "--abbrev-ref", "@{upstream}"], cwd);
      range = `${upstream}..HEAD`;
    } catch {
      range = "HEAD";
    }
    const names = range === "HEAD" ? git3(["ls-tree", "-r", "--name-only", "HEAD"], cwd) : git3(["diff", "--name-only", "--diff-filter=ACMR", range], cwd);
    return names.split(/\r?\n/).map((f) => f.trim()).filter(Boolean).filter((f) => SEALABLE.test(f) && !SKIP.test(f));
  } catch {
    return [];
  }
}
async function sealAndPublishPush(loadIdentity2, sealPathFor2, sealsDir2, apiBase, cwd = process.cwd(), mode = "push") {
  const id = await loadIdentity2();
  if (!id.githubLogin) {
    console.error("Dev Autographs: link GitHub first (`paw-prints login`).");
    process.exitCode = 1;
    return;
  }
  let files = mode === "all" ? [] : filesBeingPushed(cwd);
  if (files.length === 0) {
    try {
      files = git3(["ls-files"], cwd).split(/\r?\n/).map((f) => f.trim()).filter(Boolean).filter((f) => SEALABLE.test(f) && !SKIP.test(f));
      if (mode === "push" && files.length) {
        console.log("Dev Autographs: no unpushed sealable files \u2014 publishing tracked sealable tree.");
      }
    } catch {
      files = [];
    }
  }
  if (files.length === 0) {
    console.log("Dev Autographs: nothing sealable.");
    return;
  }
  await (0, import_promises4.mkdir)(sealsDir2(cwd), { recursive: true });
  const cache = await loadLineageCache();
  const toPublish = [];
  for (const rel of files) {
    const abs = import_node_path4.default.resolve(cwd, rel);
    if (!await exists3(abs)) continue;
    const content = await (0, import_promises4.readFile)(abs);
    const contentSha = sha256Hex(content);
    const ph = pathHashOf(rel);
    const prev = cache.entries[ph];
    const seal = createSeal({
      content,
      path: rel.replace(/\\/g, "/"),
      privateKey: id.privateKey,
      publicKey: id.publicKey,
      displayMark: id.displayMark
    });
    await (0, import_promises4.writeFile)(sealPathFor2(rel, cwd), JSON.stringify(seal, null, 2));
    let parentSha256;
    let originSha256 = contentSha;
    if (prev && prev.contentSha256 !== contentSha) {
      parentSha256 = prev.contentSha256;
      originSha256 = prev.originSha256;
      cache.entries[ph] = {
        pathHash: ph,
        contentSha256: contentSha,
        originSha256,
        firstChangedAt: prev.firstChangedAt ?? (/* @__PURE__ */ new Date()).toISOString()
      };
    } else if (!prev) {
      cache.entries[ph] = {
        pathHash: ph,
        contentSha256: contentSha,
        originSha256
      };
    }
    toPublish.push({
      ...seal,
      githubLogin: id.githubLogin,
      pathHash: ph,
      parentSha256
    });
  }
  await saveLineageCache(cache);
  if (!toPublish.length) {
    console.log("Dev Autographs: no files to publish.");
    return;
  }
  const api = apiBase.replace(/\/$/, "");
  try {
    const res = await fetch(`${api}/v1/ledger/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seals: toPublish, githubLogin: id.githubLogin })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "signer_replaced") {
        console.error("Dev Autographs: this PC is no longer the signer for your GitHub.");
        console.error(`  ${data.error_description ?? "Someone inked your GitHub on another device."}`);
        console.error("  Open Dev Autographs and Ink again here to take the seat back, or push with PAWPRINTS_ALLOW_OFFLINE_PUSH=1.");
      } else {
        console.error(`Dev Autographs: ledger publish failed: ${data.error_description ?? data.error ?? res.status}`);
        if (data.error === "unknown_signer") {
          console.error("  Open Dev Autographs (or the web desk) and Ink again, or push with PAWPRINTS_ALLOW_OFFLINE_PUSH=1.");
        }
      }
      if (process.env.PAWPRINTS_ALLOW_OFFLINE_PUSH === "1") {
        console.error("  PAWPRINTS_ALLOW_OFFLINE_PUSH=1 set: pushing without publishing.");
        return;
      }
      process.exitCode = 1;
      return;
    }
    console.log(
      `Dev Autographs: published ${data.published?.length ?? toPublish.length} fingerprint(s) as ${id.displayMark} (@${id.githubLogin})`
    );
    console.log(`  signer: ${fingerprint(id.publicKey)}`);
    try {
      const { mirrorUserSummary: mirrorUserSummary2 } = await Promise.resolve().then(() => (init_summary(), summary_exports));
      await mirrorUserSummary2(api, id.githubLogin);
    } catch {
    }
  } catch (e) {
    console.error(`Dev Autographs: ledger unreachable (${e instanceof Error ? e.message : e})`);
    console.error("Set PAWPRINTS_ALLOW_OFFLINE_PUSH=1 to skip, or start: npm run api");
    if (process.env.PAWPRINTS_ALLOW_OFFLINE_PUSH === "1") return;
    process.exitCode = 1;
    return;
  }
  try {
    const { maybeAutoRepoInk: maybeAutoRepoInk2 } = await Promise.resolve().then(() => (init_repo_ink(), repo_ink_exports));
    await maybeAutoRepoInk2(loadIdentity2, api, cwd);
  } catch {
  }
}
var import_node_child_process3, import_promises4, import_node_fs3, import_node_path4, import_node_os4, NODE_TLS_ENV, SEALABLE, SKIP;
var init_hooks = __esm({
  "src/hooks.ts"() {
    "use strict";
    import_node_child_process3 = require("node:child_process");
    import_promises4 = require("node:fs/promises");
    import_node_fs3 = require("node:fs");
    import_node_path4 = __toESM(require("node:path"), 1);
    import_node_os4 = __toESM(require("node:os"), 1);
    init_dist2();
    init_report();
    NODE_TLS_ENV = "NODE_USE_SYSTEM_CA=1";
    SEALABLE = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|html|htm|md|py|go|rs|java|kt|swift|cs|rb|php|vue|svelte|astro|ejs|njk|hbs)$/i;
    SKIP = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|provenance\.json|\.pawprints\/)/i;
  }
});

// src/agent.ts
var agent_exports = {};
__export(agent_exports, {
  disableRegistryKey: () => disableRegistryKey,
  runAgent: () => runAgent,
  unlinkIdentity: () => unlinkIdentity
});
async function exists4(p) {
  try {
    await (0, import_promises5.access)(p, import_node_fs4.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
async function appendLog(line) {
  await (0, import_promises5.mkdir)(HOME, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
  await (0, import_promises5.writeFile)(AGENT_LOG, `[${stamp}] ${line}
`, { flag: "a" });
}
async function runAgent(opts) {
  const interval = opts.intervalMs ?? 6e4;
  await (0, import_promises5.mkdir)(HOME, { recursive: true });
  await (0, import_promises5.writeFile)(AGENT_PID, String(process.pid), { mode: 384 });
  await appendLog(`agent start pid=${process.pid}`);
  const tick = async () => {
    try {
      await ensureHooksHealthy();
      await appendLog("hooks healthy");
    } catch (e) {
      await appendLog(`tick error: ${e instanceof Error ? e.message : e}`);
    }
  };
  await tick();
  if (opts.once) {
    await appendLog("agent once done");
    try {
      await (0, import_promises5.unlink)(AGENT_PID);
    } catch {
    }
    console.log("Dev Autographs agent: hooks checked once.");
    return;
  }
  console.log("Dev Autographs agent running (Ctrl+C to stop).");
  console.log(`  home: ${HOME}`);
  console.log(`  log:  ${AGENT_LOG}`);
  console.log("  Keeping global git hooks healthy; pre-push publishes to the ledger.");
  const timer = setInterval(() => {
    void tick();
  }, interval);
  const shutdown = async () => {
    clearInterval(timer);
    await appendLog("agent stop");
    try {
      await (0, import_promises5.unlink)(AGENT_PID);
    } catch {
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  await new Promise(() => void 0);
}
async function unlinkIdentity(identityPath, loadIdentity2) {
  if (!await exists4(identityPath)) {
    console.log("No identity on this device.");
    return;
  }
  const id = await loadIdentity2();
  const home = import_node_path5.default.dirname(identityPath);
  const targets = [
    identityPath,
    import_node_path5.default.join(import_node_os5.default.homedir(), ".pawprints", "identity.json"),
    import_node_path5.default.join(import_node_os5.default.homedir(), ".codeink", "identity.json")
  ];
  try {
    for (const entry of await (0, import_promises5.readdir)(home)) {
      if (entry.startsWith("identity.json.bak")) targets.push(import_node_path5.default.join(home, entry));
    }
  } catch {
  }
  for (const target of targets) {
    if (!await exists4(target)) continue;
    try {
      const size = (await (0, import_promises5.readFile)(target)).length;
      await (0, import_promises5.writeFile)(target, Buffer.alloc(size, 0));
    } catch {
    }
    await (0, import_promises5.unlink)(target).catch(() => void 0);
  }
  console.log("Unlinked GitHub identity from this device \u2014 private key destroyed.");
  console.log(`  was: @${id.githubLogin ?? "?"} mark=${id.displayMark}`);
  console.log("Link again with: paw-prints login");
}
async function disableRegistryKey(identityPath, loadIdentity2, apiBase) {
  if (!await exists4(identityPath)) return false;
  const id = await loadIdentity2();
  if (!id.publicKey || !id.privateKey) return false;
  const { signBytes: signBytes2 } = await Promise.resolve().then(() => (init_dist2(), dist_exports));
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const payload = ["devautographs-disable-v1", `publicKey=${id.publicKey}`, `updatedAt=${updatedAt}`].join(
    "\n"
  );
  const signature = signBytes2(payload, id.privateKey);
  const api = apiBase.replace(/\/$/, "");
  try {
    const res = await fetch(`${api}/v1/accounts/disable-key`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKey: id.publicKey, updatedAt, signature })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn(
        `Registry disable-key failed: ${data.error_description ?? data.error ?? res.status}`
      );
      return false;
    }
    console.log("Registry: old device signature disabled.");
    return true;
  } catch (e) {
    console.warn(`Registry disable-key unreachable: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}
var import_promises5, import_node_fs4, import_node_path5, import_node_os5, HOME, AGENT_PID, AGENT_LOG;
var init_agent = __esm({
  "src/agent.ts"() {
    "use strict";
    import_promises5 = require("node:fs/promises");
    import_node_fs4 = require("node:fs");
    import_node_path5 = __toESM(require("node:path"), 1);
    import_node_os5 = __toESM(require("node:os"), 1);
    init_hooks();
    HOME = import_node_path5.default.join(import_node_os5.default.homedir(), ".dev-autographs");
    AGENT_PID = import_node_path5.default.join(HOME, "agent.pid");
    AGENT_LOG = import_node_path5.default.join(HOME, "agent.log");
  }
});

// src/index.ts
var import_node_child_process5 = require("node:child_process");

// src/main.ts
var import_promises6 = require("node:fs/promises");
var import_node_fs5 = require("node:fs");
var import_node_path6 = __toESM(require("node:path"), 1);
var import_node_os6 = __toESM(require("node:os"), 1);
var import_node_child_process4 = require("node:child_process");
init_dist2();
init_registry_generated();
var HOME_LEGACY_PAW = import_node_path6.default.join(import_node_os6.default.homedir(), ".pawprints");
var HOME_LEGACY_CODEINK = import_node_path6.default.join(import_node_os6.default.homedir(), ".codeink");
var HOME2 = import_node_path6.default.join(import_node_os6.default.homedir(), ".dev-autographs");
var IDENTITY_PATH = import_node_path6.default.join(HOME2, "identity.json");
var IDENTITY_PATH_LEGACY = import_node_path6.default.join(HOME_LEGACY_PAW, "identity.json");
var IDENTITY_PATH_CODEINK = import_node_path6.default.join(HOME_LEGACY_CODEINK, "identity.json");
async function exists5(p) {
  try {
    await (0, import_promises6.access)(p, import_node_fs5.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
function parseJsonFile(raw) {
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}
async function resolveIdentityPath() {
  for (const p of [IDENTITY_PATH, IDENTITY_PATH_CODEINK, IDENTITY_PATH_LEGACY]) {
    if (await exists5(p)) return p;
  }
  return null;
}
async function loadIdentity() {
  const p = await resolveIdentityPath();
  if (!p) {
    throw new Error("No identity found. Run: paw-prints login (Dev Autographs)");
  }
  const id = parseJsonFile(await (0, import_promises6.readFile)(p, "utf8"));
  if (p !== IDENTITY_PATH) {
    await saveIdentity(id);
  }
  return id;
}
async function saveIdentity(id) {
  await (0, import_promises6.mkdir)(HOME2, { recursive: true });
  await (0, import_promises6.writeFile)(IDENTITY_PATH, JSON.stringify(id, null, 2), { mode: 384 });
  for (const legacy of [IDENTITY_PATH_CODEINK, IDENTITY_PATH_LEGACY]) {
    try {
      if (await exists5(legacy)) await (0, import_promises6.rm)(legacy, { force: true });
    } catch {
    }
  }
}
function sealsDir(cwd = process.cwd()) {
  return import_node_path6.default.join(cwd, ".pawprints", "seals");
}
function sealPathFor(filePath, cwd = process.cwd()) {
  const rel = import_node_path6.default.relative(cwd, import_node_path6.default.resolve(cwd, filePath)).replace(/\\/g, "/");
  const safe = rel.replace(/[\\/]/g, "__");
  return import_node_path6.default.join(sealsDir(cwd), `${safe}.json`);
}
async function cmdKeygen(args) {
  let mark = "PP";
  let printOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mark" && args[i + 1]) mark = args[++i];
    else if (args[i] === "--print" || args[i] === "--json") printOnly = true;
  }
  if (printOnly) {
    const kp2 = generateKeyPair();
    process.stdout.write(
      JSON.stringify({ publicKey: kp2.publicKey, privateKey: kp2.privateKey, fingerprint: fingerprint(kp2.publicKey) })
    );
    return;
  }
  if (await exists5(IDENTITY_PATH)) {
    console.error(`Identity already exists at ${IDENTITY_PATH}`);
    console.error("Delete it first if you intend to rotate keys.");
    process.exitCode = 1;
    return;
  }
  const kp = generateKeyPair();
  const id = {
    publicKey: kp.publicKey,
    privateKey: kp.privateKey,
    displayMark: mark,
    trustLevel: "L1",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveIdentity(id);
  console.log("Dev Autographs identity created.");
  console.log(`  path:        ${IDENTITY_PATH}`);
  console.log(`  displayMark: ${id.displayMark}`);
  console.log(`  fingerprint: ${fingerprint(id.publicKey)}`);
  console.log(`  trustLevel:  ${id.trustLevel} (bind GitHub later to reach L2)`);
}
async function cmdWhoami() {
  const id = await loadIdentity();
  console.log(
    JSON.stringify(
      {
        githubLogin: id.githubLogin ?? null,
        displayMark: id.displayMark,
        fingerprint: fingerprint(id.publicKey),
        trustLevel: id.trustLevel,
        publicKey: id.publicKey,
        path: await exists5(IDENTITY_PATH) ? IDENTITY_PATH : IDENTITY_PATH_LEGACY
      },
      null,
      2
    )
  );
}
async function cmdSeal(args) {
  const file = args[0];
  if (!file) {
    console.error("Usage: paw-prints seal <file>");
    process.exitCode = 1;
    return;
  }
  const id = await loadIdentity();
  const abs = import_node_path6.default.resolve(file);
  const content = await (0, import_promises6.readFile)(abs);
  const rel = import_node_path6.default.relative(process.cwd(), abs).replace(/\\/g, "/");
  const seal = createSeal({
    content,
    path: rel,
    privateKey: id.privateKey,
    publicKey: id.publicKey,
    displayMark: id.displayMark
  });
  await (0, import_promises6.mkdir)(sealsDir(), { recursive: true });
  const out = sealPathFor(rel);
  await (0, import_promises6.writeFile)(out, JSON.stringify(seal, null, 2));
  console.log(`Sealed ${rel}`);
  console.log(`  contentSha256: ${seal.contentSha256}`);
  console.log(`  seal: ${out}`);
  console.log(`  signer: ${id.displayMark} (${fingerprint(id.publicKey)})`);
}
async function cmdVerify(args) {
  const file = args[0];
  if (!file) {
    console.error("Usage: paw-prints verify <file>");
    process.exitCode = 1;
    return;
  }
  const abs = import_node_path6.default.resolve(file);
  const content = await (0, import_promises6.readFile)(abs);
  const rel = import_node_path6.default.relative(process.cwd(), abs).replace(/\\/g, "/");
  const sealFile = sealPathFor(rel);
  if (!await exists5(sealFile)) {
    console.error(`No seal found for ${rel}`);
    process.exitCode = 1;
    return;
  }
  const seal = JSON.parse(await (0, import_promises6.readFile)(sealFile, "utf8"));
  const ok = verifySeal(seal, content);
  if (!ok) {
    console.error("INVALID seal (signature or content mismatch)");
    process.exitCode = 1;
    return;
  }
  console.log("VALID");
  console.log(`  path: ${seal.path}`);
  console.log(`  displayMark: ${seal.displayMark ?? fingerprint(seal.signer)}`);
  console.log(`  fingerprint: ${fingerprint(seal.signer)}`);
  console.log(`  contentSha256: ${seal.contentSha256}`);
}
async function loadAllSeals(cwd = process.cwd()) {
  const dir = sealsDir(cwd);
  if (!await exists5(dir)) return [];
  const files = await (0, import_promises6.readdir)(dir);
  const seals = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const seal = JSON.parse(await (0, import_promises6.readFile)(import_node_path6.default.join(dir, f), "utf8"));
    if (verifySeal(seal)) seals.push(seal);
  }
  return seals;
}
async function cmdAttest(args) {
  let app = "app";
  let versionLabel = "0.0.0";
  let out = import_node_path6.default.join(process.cwd(), "provenance.json");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--app" && args[i + 1]) app = args[++i];
    else if ((args[i] === "--version" || args[i] === "-v") && args[i + 1])
      versionLabel = args[++i];
    else if (args[i] === "--out" && args[i + 1]) out = import_node_path6.default.resolve(args[++i]);
  }
  const id = await loadIdentity();
  const seals = await loadAllSeals();
  if (seals.length === 0) {
    console.error("No valid seals in .pawprints/seals \u2014 nothing to attest.");
    process.exitCode = 1;
    return;
  }
  const meta = /* @__PURE__ */ new Map();
  for (const s of seals) {
    meta.set(s.signer, { displayMark: s.displayMark, trustLevel: "L2" });
  }
  const contributors = aggregateContributors(seals, meta);
  const buildHash = sha256Hex(
    seals.map((s) => `${s.path}:${s.contentSha256}:${s.signer}`).sort().join("|")
  );
  const attestation = createAttestation({
    app,
    versionLabel,
    buildHash,
    contributors,
    issuerPrivateKey: id.privateKey,
    issuerPublicKey: id.publicKey
  });
  await (0, import_promises6.writeFile)(out, JSON.stringify(attestation, null, 2));
  console.log(`Wrote attestation ${out}`);
  console.log(`  buildHash: ${buildHash}`);
  console.log(`  contributors: ${contributors.length}`);
  for (const c of contributors) {
    console.log(
      `    - ${c.displayMark} ${(c.weight * 100).toFixed(1)}% (${c.sealedFiles} files)`
    );
  }
  try {
    const slackCfgPath = import_node_path6.default.join(HOME2, "slack.json");
    if (await exists5(slackCfgPath)) {
      const { webhookUrl } = JSON.parse(await (0, import_promises6.readFile)(slackCfgPath, "utf8"));
      const names = contributors.map((c) => `${c.displayMark} ${(c.weight * 100).toFixed(0)}%`).join(", ");
      const text = `Dev Autographs ship: *${app}* \`${versionLabel}\` \u2014 ${names}`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) console.log("Notified Slack webhook.");
      else console.warn(`Slack notify failed: ${res.status}`);
    }
  } catch (e) {
    console.warn(`Slack notify skipped: ${e instanceof Error ? e.message : e}`);
  }
}
async function cmdVerifyAttestation(args) {
  const file = args[0] ?? "provenance.json";
  const att = JSON.parse(await (0, import_promises6.readFile)(import_node_path6.default.resolve(file), "utf8"));
  const ok = verifyAttestation(att);
  if (!ok) {
    console.error("INVALID attestation");
    process.exitCode = 1;
    return;
  }
  console.log("VALID attestation");
  console.log(`  app: ${att.app} @ ${att.versionLabel}`);
  console.log(`  buildHash: ${att.buildHash}`);
  console.log(`  issuer: ${fingerprint(att.issuer)}`);
  for (const c of att.contributors) {
    console.log(`  - ${c.displayMark} ${(c.weight * 100).toFixed(1)}% [${c.trustLevel}]`);
  }
}
var DEFAULT_API = process.env.DEV_AUTOGRAPHS_REGISTRY ?? process.env.CODEINK_REGISTRY ?? process.env.PAWPRINTS_API ?? HOSTED_REGISTRY;
function help() {
  console.log(`Dev Autographs CLI \u2014 local agent + public ledger

Usage:
  npx --yes github:Creal212/Dev-Autographs login
  dev-autographs login --api <url>  Override API (default: ${DEFAULT_API})
  dev-autographs unlink             Clear device identity (disables registry key first)
  dev-autographs disable-key        Disable this device key on the registry only
  dev-autographs whoami             Show identity (includes githubLogin)
  dev-autographs serve              Start local ledger API
  dev-autographs agent [--once]     Hook health
  dev-autographs install-hooks [--global]
  dev-autographs doctor
  dev-autographs mark-style --mark "\u2726DA" [--font "\u2026"] [--icon tiny.gif]
                        [--repo-mark "\u2726Repo"] [--repo-font "\u2026"] [--repo-icon tiny.gif]
  dev-autographs seal <file>
  dev-autographs seal-staged
  dev-autographs sync-overlay       Rebuild report + upsert overlay boot (web repos)
  dev-autographs seal-push          Seal push range (or tracked tree) + publish
  dev-autographs ink-publish        Seal all tracked sealable files + publish
  dev-autographs repo-ink [--force] Loud whole-repo ink (owner only)
  dev-autographs repo-ink --revoke  Remove your repo signature (unlocks the origin for others)
  dev-autographs detect-unsigned    Report signed\u2192unsigned once (post-commit hook)
  dev-autographs summary-mirror     Mirror personal summary to ~/.dev-autographs (+ optional gist)

One GitHub per install (last Ink wins). Identity: ~/.dev-autographs/identity.json
Personal summary: ~/.dev-autographs/summary.json (gist token: ~/.dev-autographs/github-summary.json)
Ledger: hashes + marks + dates only \u2014 never source
`);
}
async function saveClaimedIdentity(data, opts) {
  let prior;
  if (await exists5(IDENTITY_PATH)) {
    const existing = await loadIdentity();
    if (existing.githubLogin && existing.githubLogin.toLowerCase() !== data.githubLogin.toLowerCase()) {
      console.error(
        `This device is already linked to @${existing.githubLogin}.`
      );
      console.error("One GitHub account per device. Unlink first:");
      console.error("  paw-prints unlink");
      process.exitCode = 1;
      return;
    }
    prior = existing;
  }
  const keepMarks = Boolean(prior?.marksLocked) || Boolean(prior?.markFont || prior?.markIcon || prior?.repoDisplayMark) || Boolean(prior?.displayMark && prior.displayMark.trim());
  const id = {
    publicKey: data.publicKey,
    privateKey: data.privateKey,
    displayMark: keepMarks && prior?.displayMark ? prior.displayMark : data.displayMark,
    accountId: data.accountId,
    githubLogin: data.githubLogin,
    fingerprint: data.fingerprint,
    trustLevel: data.trustLevel ?? "L2",
    createdAt: prior?.createdAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  if (keepMarks && prior) {
    if (prior.markFont) id.markFont = prior.markFont;
    if (prior.markIcon) id.markIcon = prior.markIcon;
    if (prior.repoDisplayMark) id.repoDisplayMark = prior.repoDisplayMark;
    if (prior.repoMarkFont) id.repoMarkFont = prior.repoMarkFont;
    if (prior.repoMarkIcon) id.repoMarkIcon = prior.repoMarkIcon;
    if (prior.marksLocked || keepMarks) id.marksLocked = true;
  }
  if (prior?.publicKey) {
    const previous = [...prior.previousPublicKeys ?? []];
    if (prior.publicKey !== id.publicKey && !previous.includes(prior.publicKey)) previous.push(prior.publicKey);
    if (previous.length) id.previousPublicKeys = previous.slice(-20);
  }
  await saveIdentity(id);
  console.log("Dev Autographs identity saved on this machine.");
  console.log(`  github:      @${id.githubLogin}`);
  console.log(`  displayMark: ${id.displayMark}`);
  console.log(`  fingerprint: ${data.fingerprint}`);
  console.log(`  trustLevel:  ${id.trustLevel}`);
  console.log(`  identity:    ${IDENTITY_PATH}`);
  if (!opts.skipHooks) {
    try {
      const { installGitHooks: installGitHooks2, installGlobalGitHooks: installGlobalGitHooks2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      await installGlobalGitHooks2();
      try {
        await installGitHooks2();
      } catch {
        console.log("(Not inside a git repo \u2014 global template still installed for future repos.)");
      }
      if (opts.globalHooks) {
      }
    } catch (e) {
      console.warn(`Hooks not installed: ${e instanceof Error ? e.message : e}`);
      console.warn("Run later: paw-prints install-hooks --global");
    }
  }
  console.log("Done. Commits seal locally; pushes publish fingerprints to the public ledger.");
  console.log("Optional background agent: paw-prints agent");
}
async function deviceKeyPair() {
  if (await exists5(IDENTITY_PATH)) {
    try {
      const existing = parseJsonFile(await (0, import_promises6.readFile)(IDENTITY_PATH, "utf8"));
      if (existing.publicKey && existing.privateKey) {
        return { publicKey: existing.publicKey, privateKey: existing.privateKey };
      }
    } catch {
    }
  }
  return generateKeyPair();
}
function resolvePrivateKey(data, local) {
  if (data.publicKey === local.publicKey) return local.privateKey;
  if (data.privateKey) return data.privateKey;
  return null;
}
async function cmdLogin(args) {
  let token = "";
  let api = process.env.PAWPRINTS_API ?? DEFAULT_API;
  let skipHooks = false;
  let globalHooks = true;
  let noBrowser = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && args[i + 1]) token = args[++i];
    else if (args[i] === "--api" && args[i + 1]) api = args[++i];
    else if (args[i] === "--no-hooks") skipHooks = true;
    else if (args[i] === "--no-global") globalHooks = false;
    else if (args[i] === "--no-browser") noBrowser = true;
  }
  api = api.replace(/\/$/, "");
  if (!/^https:/i.test(api) && !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(api)) {
    console.error("Refusing to log in over plain http to a remote registry. Use https:// (loopback is allowed).");
    process.exitCode = 1;
    return;
  }
  const localKeys = await deviceKeyPair();
  if (token) {
    const res = await fetch(`${api}/v1/auth/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, public_key: localKeys.publicKey })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(data.error ?? `claim failed (${res.status})`);
      process.exitCode = 1;
      return;
    }
    const privateKey = resolvePrivateKey(data, localKeys);
    if (!privateKey) {
      console.error("Registry returned a key this device does not hold. Aborting.");
      process.exitCode = 1;
      return;
    }
    await saveClaimedIdentity({ ...data, privateKey }, { skipHooks, globalHooks });
    return;
  }
  console.log("Starting device login\u2026");
  const startRes = await fetch(`${api}/v1/auth/device/code`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ public_key: localKeys.publicKey })
  });
  const start = await startRes.json();
  if (!startRes.ok) {
    console.error(start.error_description ?? start.error ?? "Could not start device login");
    process.exitCode = 1;
    return;
  }
  console.log("");
  console.log("  Confirm in your browser:");
  console.log(`  ${start.verification_uri_complete}`);
  console.log("");
  console.log(`  Or go to ${start.verification_uri} and enter code: ${start.user_code}`);
  console.log(`  This device: ${start.device_fingerprint ?? fingerprint(localKeys.publicKey)}`);
  console.log("  The browser page shows the same fingerprint. If it differs, do not continue.");
  console.log("");
  const { openBrowser: openBrowser2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
  if (!noBrowser) openBrowser2(start.verification_uri_complete);
  const deadline = Date.now() + start.expires_in * 1e3;
  const intervalMs = Math.max(2, start.interval || 3) * 1e3;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const pollRes = await fetch(`${api}/v1/auth/device/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_code: start.device_code })
    });
    const poll = await pollRes.json();
    if (pollRes.ok && poll.publicKey) {
      const privateKey = resolvePrivateKey(poll, localKeys);
      if (!privateKey) {
        console.error("\nRegistry returned a key this device does not hold. Aborting.");
        process.exitCode = 1;
        return;
      }
      await saveClaimedIdentity(
        {
          accountId: poll.accountId,
          githubLogin: poll.githubLogin,
          displayMark: poll.displayMark,
          publicKey: poll.publicKey,
          privateKey,
          trustLevel: poll.trustLevel ?? "L2",
          fingerprint: poll.fingerprint
        },
        { skipHooks, globalHooks }
      );
      return;
    }
    if (poll.error === "authorization_pending") {
      process.stdout.write(".");
      continue;
    }
    console.error(`
Login failed: ${poll.error_description ?? poll.error ?? pollRes.status}`);
    process.exitCode = 1;
    return;
  }
  console.error("\nTimed out waiting for browser confirmation. Run paw-prints login again.");
  process.exitCode = 1;
}
async function cmdDoctor() {
  console.log("Dev Autographs doctor\n");
  try {
    const id = await loadIdentity();
    const p = await resolveIdentityPath() ?? IDENTITY_PATH;
    console.log(`\u2713 Identity: @${id.githubLogin ?? "?"} mark=${id.displayMark} trust=${id.trustLevel}`);
    console.log(`  ${p}`);
  } catch {
    console.log("\u2717 No identity. Run: paw-prints login");
  }
  try {
    const res = await fetch(`${DEFAULT_API}/health`, { signal: AbortSignal.timeout(3e3) });
    console.log(`${res.ok ? "\u2713" : "\u2717"} Registry: ${DEFAULT_API}${res.ok ? "" : ` (HTTP ${res.status})`}`);
    if (res.ok) {
      try {
        const id = await loadIdentity();
        const seat = await fetch(
          `${DEFAULT_API}/v1/auth/device/status?public_key=${encodeURIComponent(id.publicKey)}`,
          { signal: AbortSignal.timeout(3e3) }
        );
        const j = await seat.json();
        if (j.status === "active") console.log("\u2713 Signer seat: this device is the signer for the account");
        else if (j.status === "replaced")
          console.log(`\u2717 Signer seat: moved to another device (${j.replacedAt ?? "unknown time"}). Run: paw-prints login`);
        else if (j.status === "disabled") console.log("\u25CB Signer seat: key disabled (unlinked). Run: paw-prints login");
        else if (j.status === "unknown") console.log("\u25CB Signer seat: key not known to the registry. Run: paw-prints login");
      } catch {
      }
    }
  } catch {
    console.log(`\u2717 Registry unreachable: ${DEFAULT_API} (offline? hooks still seal, publish retries on next push)`);
  }
  try {
    const hooksPath = git4(["config", "--global", "--get", "core.hooksPath"]);
    console.log(`\u2713 Global hooksPath (all repos): ${hooksPath}`);
  } catch {
    console.log("\u25CB No core.hooksPath. Run: paw-prints install-hooks --global");
  }
  try {
    const template = git4(["config", "--global", "--get", "init.templateDir"]);
    console.log(`\u2713 Global git template: ${template}`);
  } catch {
    console.log("\u25CB No global template. Run: paw-prints install-hooks --global");
  }
  try {
    git4(["rev-parse", "--git-dir"]);
    let hooksDir = import_node_path6.default.join(git4(["rev-parse", "--git-dir"]), "hooks");
    try {
      hooksDir = git4(["config", "--get", "core.hooksPath"]) || hooksDir;
    } catch {
    }
    const pre = import_node_path6.default.join(hooksDir, "pre-commit");
    const push = import_node_path6.default.join(hooksDir, "pre-push");
    if (await exists5(pre)) {
      const body = await (0, import_promises6.readFile)(pre, "utf8");
      console.log(
        body.includes("seal-staged") || body.includes("paw-prints") || body.includes("Dev Autographs") ? `\u2713 pre-commit hook: ${pre}` : `\u25CB Hooks dir has pre-commit but not Dev Autographs. Run: paw-prints install-hooks --global`
      );
    } else {
      console.log("\u25CB No pre-commit active. Run: paw-prints install-hooks --global");
    }
    if (await exists5(push)) {
      const body = await (0, import_promises6.readFile)(push, "utf8");
      console.log(
        body.includes("seal-push") ? `\u2713 pre-push ledger publish: ${push}` : `\u25CB Hooks dir has pre-push but not Dev Autographs. Run: paw-prints install-hooks --global`
      );
    } else {
      console.log("\u25CB No pre-push active. Run: paw-prints install-hooks --global");
    }
  } catch {
    console.log("\u25CB Not inside a git repo right now.");
  }
  console.log(`
Tips:
  \u2022 One GitHub per install. Ink on another device moves the signer seat there; this one is warned and stops signing.
  \u2022 Autograph words and ledger history stay with the GitHub account across devices.
  \u2022 Background hook health: paw-prints agent
  \u2022 Pushes publish fingerprints to the ledger (never source)
  \u2022 install-hooks --global enables sealing in every repo via core.hooksPath
`);
}
function git4(args) {
  return (0, import_node_child_process4.execFileSync)("git", args, { encoding: "utf8" }).trim();
}
async function cmdBindGithub(args) {
  const login = args[0];
  if (!login) {
    console.error("Usage: paw-prints bind-github <github-username>");
    process.exitCode = 1;
    return;
  }
  const id = await loadIdentity();
  id.accountId = id.accountId ?? `gh:${login}`;
  id.githubLogin = login;
  id.trustLevel = "L2";
  await saveIdentity(id);
  const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
  try {
    const res = await fetch(`${api}/v1/identities`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        accountId: id.accountId,
        displayMark: id.displayMark,
        publicKey: id.publicKey,
        githubLogin: login,
        trustLevel: "L2"
      })
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`Bound GitHub @${login} and registered with API ${api}`);
  } catch (e) {
    console.log(`Bound GitHub @${login} locally (API unreachable: ${e instanceof Error ? e.message : e})`);
  }
  console.log(`trustLevel: L2`);
}
async function cmdBindSlack(args) {
  const webhook = args[0];
  if (!webhook || !webhook.startsWith("https://hooks.slack.com/")) {
    console.error("Usage: paw-prints bind-slack https://hooks.slack.com/services/...");
    process.exitCode = 1;
    return;
  }
  await (0, import_promises6.mkdir)(HOME2, { recursive: true });
  const cfgPath = import_node_path6.default.join(HOME2, "slack.json");
  await (0, import_promises6.writeFile)(cfgPath, JSON.stringify({ webhookUrl: webhook, savedAt: (/* @__PURE__ */ new Date()).toISOString() }, null, 2), {
    mode: 384
  });
  console.log(`Saved Slack webhook to ${cfgPath}`);
}
async function cmdMarkStyle(args) {
  const id = await loadIdentity();
  let mark = id.displayMark;
  let font = id.markFont;
  let icon = id.markIcon;
  let repoMark = id.repoDisplayMark;
  let repoFont = id.repoMarkFont;
  let repoIcon = id.repoMarkIcon;
  let clearIcon = false;
  let clearRepoIcon = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mark" && args[i + 1]) mark = args[++i];
    else if (args[i] === "--font" && args[i + 1]) font = args[++i];
    else if (args[i] === "--repo-mark" && args[i + 1]) repoMark = args[++i];
    else if (args[i] === "--repo-font" && args[i + 1]) repoFont = args[++i];
    else if (args[i] === "--icon" && args[i + 1]) {
      const p = import_node_path6.default.resolve(args[++i]);
      const buf = await (0, import_promises6.readFile)(p);
      const ext = import_node_path6.default.extname(p).toLowerCase();
      const mime = ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      icon = `data:${mime};base64,${buf.toString("base64")}`;
      if (icon.length > 16e3) {
        console.error("Icon too large after encode (max ~12KB). Use a tiny 32\xD732 GIF/PNG.");
        process.exitCode = 1;
        return;
      }
    } else if (args[i] === "--repo-icon" && args[i + 1]) {
      const p = import_node_path6.default.resolve(args[++i]);
      const buf = await (0, import_promises6.readFile)(p);
      const ext = import_node_path6.default.extname(p).toLowerCase();
      const mime = ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      repoIcon = `data:${mime};base64,${buf.toString("base64")}`;
      if (repoIcon.length > 16e3) {
        console.error("Repo icon too large after encode (max ~12KB).");
        process.exitCode = 1;
        return;
      }
    } else if (args[i] === "--clear-icon") {
      clearIcon = true;
    } else if (args[i] === "--clear-repo-icon") {
      clearRepoIcon = true;
    }
  }
  if (clearIcon) icon = void 0;
  if (clearRepoIcon) repoIcon = void 0;
  id.displayMark = mark.slice(0, 64);
  id.markFont = font?.trim() || void 0;
  id.markIcon = icon;
  id.repoDisplayMark = (repoMark ?? "").trim().slice(0, 64) || void 0;
  id.repoMarkFont = repoFont?.trim() || void 0;
  id.repoMarkIcon = repoIcon;
  id.marksLocked = true;
  await saveIdentity(id);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const payload = [
    "codeink-mark-v1",
    `publicKey=${id.publicKey}`,
    `displayMark=${id.displayMark}`,
    `markFont=${id.markFont ?? ""}`,
    `markIconSha=${id.markIcon ? sha256Hex(id.markIcon) : ""}`,
    `repoDisplayMark=${id.repoDisplayMark ?? ""}`,
    `updatedAt=${updatedAt}`
  ].join("\n");
  const signature = signBytes(payload, id.privateKey);
  const api = (process.env.PAWPRINTS_API ?? DEFAULT_API).replace(/\/$/, "");
  const res = await fetch(`${api}/v1/mark-profile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKey: id.publicKey,
      displayMark: id.displayMark,
      markFont: id.markFont,
      markIcon: id.markIcon,
      repoDisplayMark: id.repoDisplayMark,
      repoMarkFont: id.repoMarkFont,
      repoMarkIcon: id.repoMarkIcon,
      updatedAt,
      signature
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Mark profile publish failed: ${data.error_description ?? data.error ?? res.status}`);
    if (data.error === "unknown public key \u2014 link GitHub first" || res.status === 404) {
      console.error("Re-link once (Desk \u2192 Ink your GitHub) so this registry knows your key.");
    }
    console.log("Saved locally; sync when the ledger accepts the profile.");
    process.exitCode = 1;
    return;
  }
  console.log(`Dev Autographs code mark saved: ${id.displayMark}`);
  if (id.repoDisplayMark) console.log(`  repo mark: ${id.repoDisplayMark}`);
  if (id.markFont) console.log(`  font: ${id.markFont}`);
  if (id.markIcon) console.log(`  icon: yes (${Math.round(id.markIcon.length / 1024)}KB data URL)`);
}
async function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "keygen":
      return cmdKeygen(rest);
    case "whoami":
      return cmdWhoami();
    case "seal":
      return cmdSeal(rest);
    case "verify":
      return cmdVerify(rest);
    case "attest":
      return cmdAttest(rest);
    case "verify-attestation":
      return cmdVerifyAttestation(rest);
    case "install-hooks": {
      const { installGitHooks: installGitHooks2, installGlobalGitHooks: installGlobalGitHooks2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      if (rest.includes("--global")) return installGlobalGitHooks2();
      return installGitHooks2();
    }
    case "doctor":
      return cmdDoctor();
    case "mark-style":
      return cmdMarkStyle(rest);
    case "sync-overlay": {
      const { syncOverlayArtifacts: syncOverlayArtifacts2, resolveLedgerApi: resolveLedgerApi2 } = await Promise.resolve().then(() => (init_report(), report_exports));
      const { createSeal: createSeal2 } = await Promise.resolve().then(() => (init_dist2(), dist_exports));
      return syncOverlayArtifacts2(
        loadIdentity,
        loadAllSeals,
        sealPathFor,
        sealsDir,
        createSeal2,
        resolveLedgerApi2(process.env.PAWPRINTS_API ?? DEFAULT_API)
      );
    }
    case "seal-staged": {
      const { sealStagedFiles: sealStagedFiles2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      return sealStagedFiles2(loadIdentity, sealPathFor, sealsDir);
    }
    case "seal-push": {
      const { sealAndPublishPush: sealAndPublishPush2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
      return sealAndPublishPush2(loadIdentity, sealPathFor, sealsDir, api, process.cwd(), "push");
    }
    case "ink-publish": {
      const { sealAndPublishPush: sealAndPublishPush2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
      return sealAndPublishPush2(loadIdentity, sealPathFor, sealsDir, api, process.cwd(), "all");
    }
    case "serve": {
      const { spawn: spawn2 } = await import("node:child_process");
      const candidates = [
        import_node_path6.default.resolve(process.cwd(), "apps/api/dist/index.js"),
        import_node_path6.default.resolve(import_node_path6.default.dirname(process.argv[1] ?? ""), "../../../apps/api/dist/index.js"),
        import_node_path6.default.resolve(HOME2, "../../paw-prints/apps/api/dist/index.js")
      ];
      let apiEntry = "";
      for (const c of candidates) {
        if (await exists5(c)) {
          apiEntry = c;
          break;
        }
      }
      if (!apiEntry) {
        console.error("Dev Autographs: could not find apps/api/dist/index.js \u2014 run npm run build from the monorepo.");
        process.exitCode = 1;
        return;
      }
      console.log("Starting Dev Autographs ledger API\u2026");
      console.log(`  ${apiEntry}`);
      const child = spawn2(process.execPath, [apiEntry], {
        stdio: "inherit",
        env: process.env
      });
      await new Promise((resolve) => {
        child.on("exit", (code) => {
          process.exitCode = code ?? 1;
          resolve();
        });
      });
      return;
    }
    case "repo-ink": {
      const { publishRepoInk: publishRepoInk2, revokeRepoInk: revokeRepoInk2, ensureDevAutographsHome: ensureDevAutographsHome2 } = await Promise.resolve().then(() => (init_repo_ink(), repo_ink_exports));
      await ensureDevAutographsHome2();
      const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
      if (rest.includes("--revoke")) return revokeRepoInk2(loadIdentity, api, process.cwd());
      return publishRepoInk2(loadIdentity, api, process.cwd(), { force: rest.includes("--force") });
    }
    case "post-commit-note": {
      const { postCommitNote: postCommitNote2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      return postCommitNote2();
    }
    case "detect-unsigned": {
      const { detectUnsignedChanges: detectUnsignedChanges2 } = await Promise.resolve().then(() => (init_hooks(), hooks_exports));
      const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
      return detectUnsignedChanges2(sealPathFor, api, process.cwd(), loadIdentity);
    }
    case "summary-mirror": {
      const { mirrorUserSummary: mirrorUserSummary2 } = await Promise.resolve().then(() => (init_summary(), summary_exports));
      const id = await loadIdentity();
      if (!id.githubLogin) {
        console.error("Link GitHub first: paw-prints login");
        process.exitCode = 1;
        return;
      }
      const api = process.env.PAWPRINTS_API ?? DEFAULT_API;
      await mirrorUserSummary2(api, id.githubLogin);
      return;
    }
    case "agent": {
      const { runAgent: runAgent2 } = await Promise.resolve().then(() => (init_agent(), agent_exports));
      return runAgent2({ once: rest.includes("--once") });
    }
    case "unlink": {
      const { unlinkIdentity: unlinkIdentity2, disableRegistryKey: disableRegistryKey2 } = await Promise.resolve().then(() => (init_agent(), agent_exports));
      const api = (process.env.DEV_AUTOGRAPHS_REGISTRY || process.env.PAWPRINTS_API || DEFAULT_API).replace(
        /\/$/,
        ""
      );
      await disableRegistryKey2(IDENTITY_PATH, loadIdentity, api);
      return unlinkIdentity2(IDENTITY_PATH, loadIdentity);
    }
    case "disable-key": {
      const { disableRegistryKey: disableRegistryKey2 } = await Promise.resolve().then(() => (init_agent(), agent_exports));
      let api = (process.env.DEV_AUTOGRAPHS_REGISTRY || process.env.PAWPRINTS_API || DEFAULT_API).replace(
        /\/$/,
        ""
      );
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === "--api" && rest[i + 1]) {
          api = rest[++i].replace(/\/$/, "");
        }
      }
      const ok = await disableRegistryKey2(IDENTITY_PATH, loadIdentity, api);
      if (!ok) process.exitCode = 1;
      return;
    }
    case "bind-github":
      return cmdBindGithub(rest);
    case "bind-slack":
      return cmdBindSlack(rest);
    case "login":
      return cmdLogin(rest);
    case "help":
    case "--help":
    case "-h":
    case void 0:
      return help();
    default:
      console.error(`Unknown command: ${cmd}`);
      help();
      process.exitCode = 1;
  }
}

// src/index.ts
function relaunchWithSystemCa() {
  if (process.env.NODE_USE_SYSTEM_CA || process.env.DEV_AUTOGRAPHS_NO_SYSTEM_CA) return false;
  if (process.execArgv.includes("--use-system-ca")) return false;
  if (!process.allowedNodeEnvironmentFlags.has("--use-system-ca")) return false;
  const r = (0, import_node_child_process5.spawnSync)(process.execPath, ["--use-system-ca", ...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_SYSTEM_CA: "1" }
  });
  process.exitCode = r.status ?? 1;
  return true;
}
if (!relaunchWithSystemCa()) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
