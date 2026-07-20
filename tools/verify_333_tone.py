"""Final structural verification for the edited Mushroomie section 3.3.3.

This verifier deliberately compares the source and edited DOCX files rather
than relying on a text-only count.  It protects the evidence, document
structure, images, table layout, headings/captions, and paragraph formatting
that are outside the approved prose rewrite scope.
"""

from __future__ import annotations

import hashlib
import re
import sys
import zipfile
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

from docx import Document
from docx.document import Document as DocumentType
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph

try:
    from tools.sync_333_prose_to_asm import OUTPUT_PATH, SOURCE_PATH
except ModuleNotFoundError:  # Support direct execution from the tools directory.
    from sync_333_prose_to_asm import OUTPUT_PATH, SOURCE_PATH


NUMBER_PATTERN = re.compile(r"\b\d+(?:[.,]\d+)?(?:/\d+)?\b")
URL_PATTERN = re.compile(r"https?://[^\s,;)\]]+")
STAGE_PATTERN = re.compile(r"^➔ Giai đoạn .+", re.MULTILINE)
ACTIVITY_PATTERN = re.compile(r"^Hoạt động \d+:.+", re.MULTILINE)
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


@dataclass(frozen=True)
class ParagraphRecord:
    location: str
    paragraph: Paragraph


def iter_paragraphs(document: DocumentType) -> Iterator[ParagraphRecord]:
    """Yield body and table-cell paragraphs with stable human-readable paths."""
    for index, paragraph in enumerate(document.paragraphs):
        yield ParagraphRecord(f"P{index}", paragraph)
    for table_index, table in enumerate(document.tables):
        for row_index, row in enumerate(table.rows):
            for cell_index, cell in enumerate(row.cells):
                for paragraph_index, paragraph in enumerate(cell.paragraphs):
                    yield ParagraphRecord(
                        f"T{table_index}R{row_index}C{cell_index}P{paragraph_index}",
                        paragraph,
                    )


def document_text(document: DocumentType) -> str:
    return "\n".join(record.paragraph.text for record in iter_paragraphs(document))


def media_hashes(path: Path) -> dict[str, str]:
    with zipfile.ZipFile(path) as package:
        return {
            name: hashlib.sha256(package.read(name)).hexdigest()
            for name in package.namelist()
            if name.startswith("word/media/")
        }


def _xml_without_first_line_indent(paragraph: Paragraph) -> str:
    """Serialize paragraph properties while allowing the requested indent reset."""
    properties = paragraph._p.pPr
    if properties is None:
        return ""
    copied = deepcopy(properties)
    indent = copied.find(qn("w:ind"))
    if indent is not None:
        indent.attrib.pop(qn("w:firstLine"), None)
        indent.attrib.pop(qn("w:firstLineChars"), None)
        if not indent.attrib:
            copied.remove(indent)
    return copied.xml


def _run_properties(paragraph: Paragraph) -> list[str]:
    """Return only direct run formatting, not rewriteable text values."""
    return [run._r.rPr.xml if run._r.rPr is not None else "" for run in paragraph.runs]


def _table_geometry(table) -> list[str]:
    """Return deterministic geometry checks for a single Word table."""
    errors: list[str] = []
    table_xml = table._tbl
    if table_xml.find(qn("w:tblPr")) is None:
        errors.append("missing tblPr")
    table_width = table_xml.find(f".//{{{W_NS}}}tblW")
    if table_width is None:
        errors.append("missing tblW")
    grid = table_xml.find(qn("w:tblGrid"))
    if grid is None or not list(grid):
        errors.append("missing tblGrid")
    for row_index, row in enumerate(table.rows):
        for cell_index, cell in enumerate(row.cells):
            width = cell._tc.tcPr.find(qn("w:tcW")) if cell._tc.tcPr is not None else None
            if width is None:
                errors.append(f"missing tcW at R{row_index}C{cell_index}")
    return errors


def _assert_equal(errors: list[str], label: str, before, after) -> None:
    if before != after:
        errors.append(f"{label}: source and output differ")


def verify(source: Path = SOURCE_PATH, output: Path = OUTPUT_PATH) -> list[str]:
    """Return all final-QA failures; an empty list means the DOCX passed."""
    errors: list[str] = []
    if not source.is_file():
        return [f"Source DOCX not found: {source}"]
    if not output.is_file():
        return [f"Output DOCX not found: {output}"]

    before = Document(source)
    after = Document(output)
    before_text = document_text(before)
    after_text = document_text(after)

    _assert_equal(errors, "body paragraph count", len(before.paragraphs), len(after.paragraphs))
    _assert_equal(errors, "table count", len(before.tables), len(after.tables))
    _assert_equal(errors, "inline image count", len(before.inline_shapes), len(after.inline_shapes))
    if len(after.inline_shapes) != 28:
        errors.append(f"expected 28 inline images, found {len(after.inline_shapes)}")
    if len(after.tables) != 12:
        errors.append(f"expected 12 tables, found {len(after.tables)}")
    _assert_equal(
        errors,
        "table dimensions",
        [(len(table.rows), len(table.columns)) for table in before.tables],
        [(len(table.rows), len(table.columns)) for table in after.tables],
    )
    _assert_equal(errors, "embedded media hashes", media_hashes(source), media_hashes(output))

    _assert_equal(errors, "numeric evidence", NUMBER_PATTERN.findall(before_text), NUMBER_PATTERN.findall(after_text))
    _assert_equal(errors, "URLs", URL_PATTERN.findall(before_text), URL_PATTERN.findall(after_text))
    _assert_equal(errors, "stages", STAGE_PATTERN.findall(before_text), STAGE_PATTERN.findall(after_text))
    _assert_equal(errors, "activities", ACTIVITY_PATTERN.findall(before_text), ACTIVITY_PATTERN.findall(after_text))
    if len(STAGE_PATTERN.findall(after_text)) != 4:
        errors.append("expected 4 implementation stages")
    if len(ACTIVITY_PATTERN.findall(after_text)) != 11:
        errors.append("expected 11 implementation activities")
    if "landing page" in after_text.casefold():
        errors.append('forbidden phrase "landing page" is present')

    if len(after.tables) > 6:
        keyword_rows = [after.tables[6].cell(index, 0).text.strip() for index in range(1, 31)]
        if keyword_rows != [str(index) for index in range(1, 31)]:
            errors.append("Bảng 3.14 does not retain STT 1–30")
    else:
        errors.append("Bảng 3.14 cannot be checked because table index 6 is absent")

    protected_styles = {
        "Heading 2",
        "Heading 3",
        "Mushroomie Figure Caption",
        "Mushroomie Table Caption",
    }
    _assert_equal(
        errors,
        "headings and captions",
        [p.text for p in before.paragraphs if p.style.name in protected_styles],
        [p.text for p in after.paragraphs if p.style.name in protected_styles],
    )

    before_records = list(iter_paragraphs(before))
    after_records = list(iter_paragraphs(after))
    _assert_equal(errors, "total body/table paragraph count", len(before_records), len(after_records))
    for before_record, after_record in zip(before_records, after_records):
        if before_record.location != after_record.location:
            errors.append(f"paragraph path changed: {before_record.location}")
            continue
        if before_record.paragraph.style.name != after_record.paragraph.style.name:
            errors.append(f"paragraph style changed at {before_record.location}")
        if _xml_without_first_line_indent(before_record.paragraph) != _xml_without_first_line_indent(after_record.paragraph):
            errors.append(f"paragraph formatting changed at {before_record.location}")
        if _run_properties(before_record.paragraph) != _run_properties(after_record.paragraph):
            errors.append(f"run formatting changed at {before_record.location}")
        indent = after_record.paragraph.paragraph_format.first_line_indent
        if indent not in (None, 0):
            errors.append(f"first-line indent remains at {after_record.location}")

    for table_index, (before_table, after_table) in enumerate(zip(before.tables, after.tables)):
        _assert_equal(errors, f"table {table_index} properties", before_table._tbl.tblPr.xml, after_table._tbl.tblPr.xml)
        _assert_equal(errors, f"table {table_index} grid", before_table._tbl.tblGrid.xml, after_table._tbl.tblGrid.xml)
        for geometry_error in _table_geometry(after_table):
            errors.append(f"table {table_index}: {geometry_error}")

    _assert_equal(errors, "section properties", [section._sectPr.xml for section in before.sections], [section._sectPr.xml for section in after.sections])
    return errors


def main() -> int:
    errors = verify()
    if errors:
        print(f"FAIL: {len(errors)} final QA finding(s)")
        for error in errors:
            print(f"- {error}")
        return 1
    print("PASS: 4 stages; 11 activities; 28 inline images; 12 tables; Bảng 3.14 STT 1–30.")
    print("PASS: media, numeric evidence, URLs, headings/captions, formatting, table geometry, and zero first-line indentation are preserved.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
