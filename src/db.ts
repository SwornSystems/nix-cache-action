import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

interface PathInfo {
  path: string;
  references: string[];
}

export class Db {
  private db: DatabaseSync;

  private constructor(db: DatabaseSync) {
    this.db = db;
  }

  static open(store = "/"): Db {
    const dbPath = join(store, "nix", "var", "nix", "db", "db.sqlite");
    const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    return new Db(db);
  }

  close(): void {
    this.db.close();
  }

  allPaths(): Set<string> {
    const rows = this.db.prepare("SELECT path FROM ValidPaths").all();
    return new Set(rows.map((row) => String(row.path)));
  }

  ultimatePathInfo(paths: string[]): PathInfo[] {
    if (paths.length === 0) {
      return [];
    }

    const placeholders = paths.map(() => "?").join(",");
    const rows = this.db
      .prepare(
        `SELECT
           paths.path,
           GROUP_CONCAT(ref.path, '\n') AS refs
         FROM ValidPaths paths
         LEFT JOIN Refs refs
           ON refs.referrer = paths.id
         LEFT JOIN ValidPaths ref
           ON ref.id = refs.reference
         WHERE paths.ultimate = 1
           AND paths.path IN (${placeholders})
         GROUP BY paths.id`
      )
      .all(...paths);

    return rows.map((row) => ({
      path: String(row.path),
      references: row.refs === null ? [] : String(row.refs).split("\n")
    }));
  }
}
