import { c as e, d as t, i as n, l as r, n as i, o as a, r as o, t as s } from "./snapshot-uyE_Mka3.js";
//#region src/save.ts
var c = async () => {
	let t = await n.load();
	r(t.version);
	let c = e("key");
	if (e("matched-key") === c) {
		r("Exact cache hit, skipping save");
		return;
	}
	let l = i.open(), u = await s.load(), d = s.take(l);
	r(`Store snapshot: ${d.activePaths.size} paths`);
	let f = d.diff(u);
	r(`New paths: ${f.length}`);
	let p = await o.open();
	f.length > 0 && r(`Locally-built paths: ${await p.populate(f, l)}`), l.close();
	let m = await p.gc(d.activePaths);
	m.length > 0 && r(`GC: removed ${m.length} stale paths`);
	let h = await p.sync(t.substituters);
	h.length > 0 && r(`Substituter sync: removed ${h.length} paths now available upstream`), await a([o.path], c), r(`Cache saved with key: ${c}`);
};
try {
	await c();
} catch (e) {
	e instanceof Error && t(e.message);
}
//#endregion
export {};

//# sourceMappingURL=save.js.map