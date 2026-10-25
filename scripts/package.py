"""Build a deterministic installable ZIP and market-entry metadata; publish nothing."""

from pathlib import Path
import hashlib
import json
import re
import struct
import zipfile


ROOT = Path(__file__).resolve().parents[1]
SPECIES = ("sunflower", "hydrangea", "tulip", "daisy", "rose", "lavender", "cosmos", "lily")
AMBIENCE = ("swing", "bird", "butterfly", "bird-blue", "bird-robin", "bird-finch", "butterfly-amber", "butterfly-blue")
FILES = [
    "manifest.json", "icon.png", "background.js", "core.js", "store.js", "garden-layout.js",
    "ui/index.html", "ui/style.css", "ui/main.js", "ui/ambience.js",
    *(f"assets/{name}.png" for name in SPECIES),
    *(f"assets/garden/{name}.png" for name in SPECIES),
    *(f"assets/ambience/{name}.png" for name in AMBIENCE),
    "README.md", "intro/zh/README.md", "docs/development.md",
    "docs/verification.md", "docs/releasing.md", "docs/artwork.md", "docs/artwork-ambience.md", "docs/artwork-ambience-070.md",
    "docs/screenshots/garden.png", "docs/screenshots/album.png", "docs/screenshots/current.png", "LICENSE",
]


def png_size(data):
    if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) < 33:
        raise ValueError("Image is not a PNG")
    if data[12:16] != b"IHDR":
        raise ValueError("Missing PNG header")
    return struct.unpack(">II", data[16:24])


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8-sig"))
    metadata = json.loads((ROOT / "package.json").read_text(encoding="utf-8-sig"))
    assert manifest["id"] == "hindsight-garden"
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"])
    assert metadata["version"] == manifest["version"], "Version mismatch"
    assert manifest["permissions"] == ["focus.changed", "focus.app", "focus.title", "focus.category",
                                       "categories.read", "super_categories.read", "notifications"]
    assert manifest["storage_mb"] == 64 and manifest["runs_in_background"] is True
    assert manifest["opens_in"] == "window"
    for name in FILES:
        assert (ROOT / name).is_file(), f"Missing package file: {name}"
    icon = (ROOT / "icon.png").read_bytes()
    png_size(icon)
    assert len(icon) <= 256 * 1024, "Icon exceeds Hindsight's 256 KB limit"
    for name in SPECIES:
        width, height = png_size((ROOT / "assets" / f"{name}.png").read_bytes())
        assert width > height and width >= 500, f"{name}: expected a five-column horizontal image strip"
        small_width, small_height = png_size((ROOT / "assets" / "garden" / f"{name}.png").read_bytes())
        assert min(small_width, small_height) >= 64, f"{name}: missing dedicated garden illustration"
    html = (ROOT / "ui/index.html").read_text(encoding="utf-8-sig")
    for name in AMBIENCE:
        width, height = png_size((ROOT / "assets/ambience" / f"{name}.png").read_bytes())
        assert min(width, height) >= 64, f"{name}: missing ambience illustration"
        if name == "swing":
            assert width == height * 2, "Swing illustration needs two equal square layers"
        elif name.startswith("bird-"):
            assert width == height * 3, "Bird illustration needs three equal square poses"
    assert "../_page.js" in html, "Missing injected page bridge reference"
    assert "_page.js" not in FILES and "_worker.js" not in FILES
    destination = ROOT / "dist" / f'{manifest["id"]}-{manifest["version"]}.zip'
    destination.parent.mkdir(exist_ok=True)
    total = 0
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            data = (ROOT / name).read_bytes()
            if not name.endswith(".png"):
                data = data.decode("utf-8-sig").replace("\r\n", "\n").encode("utf-8")
            total += len(data)
            entry = zipfile.ZipInfo(name, date_time=(2026, 10, 25, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    assert total <= 100 * 1024 * 1024, "Unpacked package exceeds host limit"
    with zipfile.ZipFile(destination) as archive:
        assert set(archive.namelist()) == set(FILES)
        assert archive.testzip() is None
        assert json.loads(archive.read("manifest.json")) == manifest
        assert archive.read("icon.png") == icon
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(".zip.sha256").write_text(
        f"{digest}  {destination.name}\n", encoding="utf-8")
    entry = {
        "id": manifest["id"], "name": manifest["name"], "author": "Yoshino2000",
        "description": {
            "zh-CN": "使用 Hindsight 分类或程序网站规则累计种花，支持可选中断惩罚、花园相册和按周回看",
            "en": "Grow flowers with Hindsight categories, apps or websites, with optional interruption penalties and weekly garden albums",
        },
        "repo": "Yoshino2000/hindsight-garden",
        "versions": [{
            "version": manifest["version"],
            "url": f'https://github.com/Yoshino2000/hindsight-garden/releases/download/{manifest["version"]}/{destination.name}',
            "sha256": digest, "permissions": manifest["permissions"],
            "storage_mb": manifest["storage_mb"],
        }],
    }
    (destination.parent / "market-entry.json").write_text(
        json.dumps(entry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"zip": str(destination), "bytes": destination.stat().st_size,
                      "unpacked_bytes": total, "sha256": digest, "files": FILES},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
