import json
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "src" / "content" / "rules" / "generated" / "rulebooks.generated.json"

PDFS = [
    {
        "id": "warhammer-rules-main",
        "title": "Warhammer Rules (Main)",
        "path": Path(r"c:\Users\mail\Documents\Warhammer\Infos\Warhammer_Rules.pdf"),
        "primary": True,
    },
    {
        "id": "realm-slaves-darkness",
        "title": "Realm of Chaos - Slaves to Darkness",
        "path": Path(r"c:\Users\mail\Documents\Warhammer\Infos\Chaos\Realm of Chaos - Slaves to Darkness.pdf"),
        "primary": False,
    },
    {
        "id": "travel-distances-empire",
        "title": "Travel Distances in the Empire",
        "path": Path(r"c:\Users\mail\Documents\Warhammer\Infos\Overalls\Travel Distances in the Empire.pdf"),
        "primary": False,
    },
    {
        "id": "lernen-buecher",
        "title": "Regelwerk - Lernen Buecher",
        "path": Path(r"c:\Users\mail\Documents\Warhammer\Infos\Rules\Regelwerk_-_Lernen__Bucher.pdf"),
        "primary": False,
    },
]


def extract_pdf(path: Path):
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append({"page": i, "text": text})
    return pages


def main():
    payload = {"rulebooks": []}
    for source in PDFS:
        exists = source["path"].exists()
        entry = {
            "id": source["id"],
            "title": source["title"],
            "path": str(source["path"]),
            "primary": source["primary"],
            "available": exists,
            "pages": [],
        }
        if exists:
            entry["pages"] = extract_pdf(source["path"])
        payload["rulebooks"].append(entry)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
