import { a as e, d as t, f as n, i as r, l as i, n as a, r as o, s, t as c, u as l } from "./snapshot-uyE_Mka3.js";
//#region src/restore.ts
var u = async () => {
	let t = await r.load();
	i(t.version);
	let u = s("key", { required: !0 }), d = s("restore-keys").split("\n").map((e) => e.trim()).filter(Boolean);
	await o.init();
	let f = await e([o.path], u, d);
	i(f === void 0 ? "Cache miss" : `Cache restored from key: ${f}`);
	let p = f === u;
	n("cache-hit", String(p)), l("key", u), p && l("matched-key", f), await t.register(o.path);
	let m = a.open(), h = c.take(m);
	m.close(), await h.save(), i(`Store snapshot: ${h.activePaths.size} paths`);
};
try {
	await u();
} catch (e) {
	e instanceof Error && t(e.message);
}
//#endregion
export {};

//# sourceMappingURL=restore.js.map