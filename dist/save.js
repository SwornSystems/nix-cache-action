import { c as e, d as t, l as n, n as r, o as i, r as a, t as o } from "./snapshot-BCVRAY_w.js";
//#region src/save.ts
var s = async () => {
	let t = e("key"), s = e("matched-key"), c = e("substituters").split(" ").filter(Boolean);
	if (s.length > 0 && s === t) {
		n("Exact cache hit, skipping save");
		return;
	}
	let l = r.open(), u = await o.load(), d = o.take(l);
	n(`Store snapshot: ${d.activePaths.size} paths`);
	let f = d.diff(u);
	n(`New paths: ${f.length}`);
	let p = await a.open();
	f.length > 0 && n(`Locally-built paths: ${await p.populate(f, l)}`), l.close();
	let m = await p.gc(d.activePaths);
	m.length > 0 && n(`GC: removed ${m.length} stale paths`);
	let h = await p.sync(c);
	h.length > 0 && n(`Substituter sync: removed ${h.length} paths now available upstream`), await i([a.path], t), n(`Cache saved with key: ${t}`);
};
try {
	await s();
} catch (e) {
	t(e instanceof Error ? e.message : String(e));
}
//#endregion
export {};

//# sourceMappingURL=save.js.map