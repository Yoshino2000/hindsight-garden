"""Local test host. Uses temporary SQLite data, never Hindsight's application data."""

import argparse
import json
import math
import mimetypes
import re
import sqlite3
import tempfile
import threading
import time
from contextlib import closing
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


PLUGIN_ROOT = Path(__file__).resolve().parent.parent
HINDSIGHT_SOURCE = PLUGIN_ROOT.parent / "Hindsight" / "src-tauri" / "src" / "plugins" / "file_reader.rs"
FILES = {
    "manifest.json", "background.js", "core.js", "store.js", "garden-layout.js",
    "ui/index.html", "ui/style.css", "ui/album.css", "ui/drawer.css", "ui/main.js", "ui/ambience.js", "ui/plant-guide.js", "ui/collection.js", "ui/features.css",
    "assets/collection/milestones.png", "assets/collection/themes.png",
    "icon.png", "assets/sunflower.png", "assets/hydrangea.png",
    "assets/tulip.png", "assets/daisy.png",
    "assets/rose.png", "assets/lavender.png", "assets/cosmos.png", "assets/lily.png",
    *(f"assets/garden/{name}.png" for name in ("sunflower", "hydrangea", "tulip", "daisy", "rose", "lavender", "cosmos", "lily")),
    *(f"assets/ambience/{name}.png" for name in ("swing", "bird", "butterfly", "bird-blue", "bird-robin", "bird-finch", "butterfly-amber", "butterfly-blue")),
}
PLUGIN_CSP = "; ".join([
    "default-src 'none'", "script-src 'self'", "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
    "font-src 'self' data:", "media-src 'self' data: blob:",
    "connect-src 'self'", "frame-src 'none'", "object-src 'none'",
    "base-uri 'none'", "form-action 'none'", "frame-ancestors 'self'",
])
HOST_CSP = ("default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; "
            "frame-src 'self'; worker-src 'self'; connect-src 'self'; "
            "base-uri 'none'; form-action 'none'")

# Synthetic categories only. Never read the user's Hindsight database for a preview.
SUPER_CATEGORIES = [
    {"id": "work", "name": "工作", "color": "#8b5cf6", "icon": "Briefcase"},
    {"id": "leisure", "name": "娱乐", "color": "#f59e0b", "icon": "Gamepad2"},
]
CATEGORIES = [
    {"id": "reading", "name": "阅读", "color": "#55a879", "icon": "BookOpen", "superCategory": SUPER_CATEGORIES[0]},
    {"id": "code", "name": "编程", "color": "#a78bfa", "icon": "Code", "superCategory": SUPER_CATEGORIES[0]},
    {"id": "games", "name": "游戏", "color": "#f59e0b", "icon": "Gamepad2", "superCategory": SUPER_CATEGORIES[1]},
]


def bridges():
    source = HINDSIGHT_SOURCE.read_text(encoding="utf-8-sig")
    result = {}
    for filename, constant in [("_page.js", "PAGE_JS"), ("_worker.js", "WORKER_JS")]:
        match = re.search(r"const\s+" + constant + r':\s*&str\s*=\s*r#"(.*?)"#;', source, re.S)
        if not match:
            raise RuntimeError(f"Cannot extract {constant} from {HINDSIGHT_SOURCE}")
        result[filename] = match.group(1).encode("utf-8")
    return result


def authorize(action, first, second, database, source):
    if database not in (None, "main"):
        return sqlite3.SQLITE_DENY
    if action in (sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH):
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_FUNCTION and (second or "").lower() in {
        "load_extension", "fts3_tokenizer", "json_group_array", "jsonb_group_array",
        "json_group_object", "jsonb_group_object",
    }:
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_PRAGMA:
        allowed = {"user_version", "table_info", "table_xinfo", "index_list", "index_info", "foreign_key_list"}
        if (first or "").lower() not in allowed:
            return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK


def database_call(server, method, params):
    if not server.storage_mb:
        raise ValueError("Plugin has no storage_mb in manifest.json")
    if not isinstance(params, dict) or not isinstance(params.get("sql"), str):
        raise ValueError("db methods need {sql, params?}")
    sql, values = params["sql"], params.get("params", [])
    if not sql.strip() or not isinstance(values, list):
        raise ValueError("SQL must be nonempty and params must be an array")
    if any(not (value is None or isinstance(value, (str, bool, int, float))) for value in values):
        raise ValueError("Bind JSON objects/arrays as JSON.stringify strings")
    if any(isinstance(value, float) and not math.isfinite(value) for value in values):
        raise ValueError("SQL parameters must be finite")
    with server.db_lock, closing(sqlite3.connect(server.db_path, timeout=5)) as connection, connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA temp_store=FILE")
        page_size = connection.execute("PRAGMA page_size").fetchone()[0]
        connection.execute(f"PRAGMA max_page_count={server.storage_mb * 1024 * 1024 // page_size}")
        if hasattr(connection, "setlimit"):
            for limit, value in [(sqlite3.SQLITE_LIMIT_LENGTH, 256000),
                                 (sqlite3.SQLITE_LIMIT_SQL_LENGTH, 100000),
                                 (sqlite3.SQLITE_LIMIT_COLUMN, 100),
                                 (sqlite3.SQLITE_LIMIT_FUNCTION_ARG, 8),
                                 (sqlite3.SQLITE_LIMIT_ATTACHED, 0),
                                 (sqlite3.SQLITE_LIMIT_TRIGGER_DEPTH, 10),
                                 (sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER, 1000)]:
                connection.setlimit(limit, value)
        connection.set_authorizer(authorize)
        started = time.monotonic()
        connection.set_progress_handler(lambda: time.monotonic() - started > 5, 1000)
        # execute(), not executescript(): SQLite rejects a second statement.
        cursor = connection.execute(sql, values)
        if method == "db.execute":
            if cursor.description is not None:
                raise ValueError("db.execute cannot return rows; use db.query")
            return {"changes": connection.execute("SELECT changes()").fetchone()[0],
                    "lastInsertRowid": connection.execute("SELECT last_insert_rowid()").fetchone()[0]}
        rows = [dict(row) for row in cursor.fetchall()]
        if any(isinstance(value, bytes) for row in rows for value in row.values()):
            raise ValueError("db.query cannot return BLOB values")
        if len(json.dumps(rows, ensure_ascii=False).encode("utf-8")) > 10_000_000:
            raise ValueError("db.query result exceeds 10 MB")
        return rows


def seed_garden(server, params):
    """Explicit synthetic scene fixtures, available only in the development host."""
    count = params.get("count") if isinstance(params, dict) else None
    if type(count) is not int or count not in (0, 1, 8, 26, 56, 122, 200, 1000, 5001):
        raise ValueError("Choose a supported synthetic garden size")
    names = [("sunflower", "向日葵"), ("hydrangea", "绣球"), ("tulip", "郁金香"), ("daisy", "雏菊"),
             ("rose", "玫瑰"), ("lavender", "薰衣草"), ("cosmos", "波斯菊"), ("lily", "百合")]
    base = int(time.time() * 1000) - (count + 1) * 3600000
    garden = []
    for index in range(count):
        species, name = names[index % len(names)]
        at = base + index * 3600000
        if count == 56:
            # Two calendar weeks with 28 blooms each, to exercise weekly overflow.
            current = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            monday = current - timedelta(days=current.weekday())
            at = int((monday - timedelta(days=7 if index < 28 else 0)
                      + timedelta(minutes=(index % 28) * 30)).timestamp() * 1000)
        elif count == 122:
            current = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            monday = current - timedelta(days=current.weekday())
            group = 0 if index < 32 else 1 + (index - 32) // 30
            slot = index if index < 32 else (index - 32) % 30
            at = int((monday - timedelta(days=group * 7) + timedelta(minutes=slot * 30)).timestamp() * 1000)
        garden.append({"id": f"demo-{index:03d}", "name": f"演示{name}{index + 1}", "species": species,
                       "createdAt": at, "bloomAt": at + 1800000, "targetMs": 1800000, "progressMs": 1800000})
    state = {"schema": 1, "paused": False, "notify": False, "active": None, "garden": garden,
             "focus": None, "lastAt": None, "sessionId": None, "interruption": None,
             "heartbeatAt": None, "lastPenalty": None, "lastBloom": None, "lastError": None}
    # Explicit disposable fixtures only. Large fixtures are written as individual rows rather
    # than forging a giant legacy state that the real host would correctly reject.
    assert Path(server.db_path).parent.name.startswith("hindsight-garden-preview-")
    with server.db_lock, closing(sqlite3.connect(server.db_path, timeout=5)) as connection, connection:
        connection.execute("BEGIN IMMEDIATE")
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not {"garden_store", "garden_plants", "garden_archive_meta"}.issubset(tables):
            raise ValueError("Wait until the background store is ready before loading a fixture")
        previous = connection.execute("SELECT version FROM garden_store WHERE key='state'").fetchone()
        version = (previous[0] + 1) if previous else 0
        connection.execute("DELETE FROM garden_store WHERE key='state'")
        connection.execute("DELETE FROM garden_plants")
        if count > 200:
            state.update(schema=2, garden=[])
            connection.executemany("INSERT INTO garden_plants (id, value) VALUES (?, ?)",
                                   [(plant["id"], json.dumps(plant, ensure_ascii=False)) for plant in garden])
        connection.execute("INSERT INTO garden_store (key,value,version) VALUES (?,?,?)",
                           ("state", json.dumps(state, ensure_ascii=False), version))
    return {"synthetic": True, "count": count}


class Handler(BaseHTTPRequestHandler):
    def send(self, status, data, content_type, csp=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if csp:
            self.send_header("Content-Security-Policy", csp)
        self.end_headers()
        self.wfile.write(data)

    def json_response(self, status, payload):
        self.send(status, json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8"),
                  "application/json; charset=utf-8")

    def do_GET(self):
        path = urlsplit(self.path).path
        if path in ("/", "/preview-host.js"):
            filename = "preview-host.html" if path == "/" else "preview-host.js"
            content_type = "text/html" if path == "/" else "text/javascript"
            self.send(200, (PLUGIN_ROOT / "scripts" / filename).read_bytes(), content_type + "; charset=utf-8", HOST_CSP)
            return
        if path.startswith("/plugin/"):
            relative = path[len("/plugin/"):]
            if relative in self.server.bridges:
                self.send(200, self.server.bridges[relative], "text/javascript; charset=utf-8", PLUGIN_CSP)
                return
            if relative in FILES and (PLUGIN_ROOT / relative).is_file():
                content_type = "text/javascript" if relative.endswith(".js") else (mimetypes.guess_type(relative)[0] or "application/octet-stream")
                self.send(200, (PLUGIN_ROOT / relative).read_bytes(), content_type + "; charset=utf-8", PLUGIN_CSP)
                return
        self.send(404, b"Not found", "text/plain; charset=utf-8")

    def do_POST(self):
        if urlsplit(self.path).path != "/api/call":
            self.json_response(404, {"error": "Unknown endpoint"})
            return
        try:
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                raise ValueError("Expected application/json")
            if self.headers.get("Origin") not in (None, f"http://127.0.0.1:{self.server.server_port}"):
                raise ValueError("Unexpected origin")
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 512000:
                raise ValueError("Invalid request size")
            call = json.loads(self.rfile.read(length).decode("utf-8"))
            method, params = call.get("method"), call.get("params")
            if method not in self.server.allowed_methods:
                raise ValueError(f"Unknown or unapproved method: {method}")
            if method in ("db.execute", "db.query"):
                result = database_call(self.server, method, params)
            elif method == "categories.list":
                result = CATEGORIES
            elif method == "super_categories.list":
                result = SUPER_CATEGORIES
            elif method == "preview.seed":
                result = seed_garden(self.server, params)
            else:
                body = params.get("body") if isinstance(params, dict) else None
                if not isinstance(body, str) or not body.strip():
                    raise ValueError("notifications.send needs a nonempty body")
                result = None  # Captured by preview-host.js; no OS notification is sent.
            self.json_response(200, {"result": result})
        except (ValueError, TypeError, AttributeError, OverflowError, sqlite3.Error) as error:
            self.json_response(200, {"error": str(error)})

    def log_message(self, format, *values):
        if values and "404" in str(values):
            super().log_message(format, *values)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    options = parser.parse_args()
    manifest = json.loads((PLUGIN_ROOT / "manifest.json").read_text(encoding="utf-8-sig"))
    with tempfile.TemporaryDirectory(prefix="hindsight-garden-preview-") as temporary:
        server = ThreadingHTTPServer(("127.0.0.1", options.port), Handler)
        server.bridges = bridges()
        server.db_path = Path(temporary) / "plugin.sqlite3"
        server.db_lock = threading.Lock()
        server.storage_mb = manifest.get("storage_mb")
        server.allowed_methods = {"db.execute", "db.query", "preview.seed"}
        if "notifications" in manifest.get("permissions", []):
            server.allowed_methods.add("notifications.send")
        if "categories.read" in manifest.get("permissions", []):
            server.allowed_methods.add("categories.list")
        if "super_categories.read" in manifest.get("permissions", []):
            server.allowed_methods.add("super_categories.list")
        print(f"Test host (not real Hindsight/OS notifications): http://127.0.0.1:{options.port}", flush=True)
        print("SQLite data is temporary and will be removed when this server exits.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
