"""Mutation tests proving the final section 3.3.3 verifier catches OOXML drift."""

from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path

from docx.oxml.ns import qn
from lxml import etree

from tools.sync_333_prose_to_asm import OUTPUT_PATH, SOURCE_PATH
from tools.verify_333_tone import W_NS, verify


REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def rewrite_package(source: Path, destination: Path, mutator) -> None:
    """Copy a DOCX then mutate selected ZIP part bytes without touching the original."""
    with zipfile.ZipFile(source) as package:
        parts = {name: package.read(name) for name in package.namelist()}
    mutator(parts)
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, content in parts.items():
            package.writestr(name, content)


class FinalVerifierMutationTests(unittest.TestCase):
    def _verify_mutation(self, mutator) -> list[str]:
        with tempfile.TemporaryDirectory() as temporary_directory:
            candidate = Path(temporary_directory) / "mutated.docx"
            rewrite_package(OUTPUT_PATH, candidate, mutator)
            return verify(SOURCE_PATH, candidate)

    def test_current_output_passes(self):
        self.assertEqual(verify(SOURCE_PATH, OUTPUT_PATH), [])

    def test_swapped_image_relationship_target_fails(self):
        def mutate(parts):
            name = "word/_rels/document.xml.rels"
            root = etree.fromstring(parts[name])
            image_relationships = [
                relationship
                for relationship in root.findall(f"{{{REL_NS}}}Relationship")
                if relationship.get("Type", "").endswith("/image")
            ]
            image_relationship = image_relationships[0]
            replacement_target = next(
                relationship.get("Target")
                for relationship in image_relationships[1:]
                if relationship.get("Target") != image_relationship.get("Target")
            )
            image_relationship.set("Target", replacement_target)
            parts[name] = etree.tostring(root, xml_declaration=True, encoding="UTF-8")

        errors = self._verify_mutation(mutate)
        self.assertTrue(any("drawing signatures" in error for error in errors), errors)

    def test_changed_cell_width_fails(self):
        def mutate(parts):
            name = "word/document.xml"
            root = etree.fromstring(parts[name])
            width = root.find(f".//{{{W_NS}}}tcW")
            self.assertIsNotNone(width)
            width.set(qn("w:w"), str(int(width.get(qn("w:w"))) + 137))
            parts[name] = etree.tostring(root, xml_declaration=True, encoding="UTF-8")

        errors = self._verify_mutation(mutate)
        self.assertTrue(any("table 0 geometry" in error for error in errors), errors)

    def test_changed_style_font_fails(self):
        def mutate(parts):
            name = "word/styles.xml"
            root = etree.fromstring(parts[name])
            font = root.find(f".//{{{W_NS}}}rFonts")
            self.assertIsNotNone(font)
            font.set(qn("w:ascii"), "QA Mutation Font")
            parts[name] = etree.tostring(root, xml_declaration=True, encoding="UTF-8")

        errors = self._verify_mutation(mutate)
        self.assertTrue(any("protected OOXML parts" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
