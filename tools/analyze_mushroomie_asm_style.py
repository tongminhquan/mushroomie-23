"""Build a reproducible prose-style profile from the Mushroomie ASM DOCX."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any

from docx import Document


PREFERRED = ("nhóm thực hiện", "Mushroomie", "kết quả", "dữ liệu")
EVIDENCE = ("kết quả cho thấy", "kết quả ghi nhận", "dữ liệu cho thấy", "qua phân tích")
QUALIFIERS = ("tại thời điểm", "trong phạm vi", "có thể", "cần tiếp tục")
SAMPLE_SIZE = 30


def _stratified_sample(paragraphs: list[str], size: int = SAMPLE_SIZE) -> list[str]:
    """Select evenly distributed paragraphs so later sections are represented."""
    if len(paragraphs) <= size:
        return paragraphs

    last_index = len(paragraphs) - 1
    return [paragraphs[index * last_index // (size - 1)] for index in range(size)]


def build_profile(path: str | Path) -> dict[str, Any]:
    """Read one DOCX source and return its prose-style measurements."""
    doc = Document(path)
    prose = [paragraph.text.strip() for paragraph in doc.paragraphs if len(paragraph.text.strip()) >= 120]
    joined = "\n".join(prose).lower()
    return {
        "preferred_subjects": {term: joined.count(term.lower()) for term in PREFERRED},
        "evidence_phrases": {term: joined.count(term) for term in EVIDENCE},
        "qualification_phrases": {term: joined.count(term) for term in QUALIFIERS},
        "term_frequency": Counter(joined.split()).most_common(100),
        "sample_paragraphs": _stratified_sample(prose),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze prose style in a single ASM DOCX file.")
    parser.add_argument("--input", required=True, type=Path, help="Path to the ASM DOCX file")
    parser.add_argument("--output", required=True, type=Path, help="Path for the JSON profile")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.input.is_file():
        raise SystemExit(f"Input file does not exist: {args.input}")
    if args.input.suffix.lower() != ".docx":
        raise SystemExit(f"Input file must be a DOCX: {args.input}")

    profile = build_profile(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as output_file:
        json.dump(profile, output_file, ensure_ascii=False, indent=2)
        output_file.write("\n")


if __name__ == "__main__":
    main()
