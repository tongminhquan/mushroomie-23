"""Regression checks for the edited section 3.3.3 Word document."""

import re
import unittest

from docx import Document

try:
    from sync_333_prose_to_asm import OUTPUT_DOCX, SOURCE_DOCX
except ModuleNotFoundError:
    # Task 3 will provide the sync module. Keep this test runnable in Task 2
    # so its RED state is caused by the intentionally absent output document.
    SOURCE_DOCX = (
        r"C:\Users\Admin\OneDrive\Tài liệu\mushroomie\artifacts"
        r"\Muc_3.3.3_Kenh_Website_Mushroomie_Khong_Landing_Page_SEO_Thuc_Te.docx"
    )
    OUTPUT_DOCX = (
        r"C:\Users\Admin\OneDrive\Tài liệu\mushroomie\artifacts"
        r"\Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx"
    )


class DocumentInvariants(unittest.TestCase):
    def setUp(self):
        self.before = Document(SOURCE_DOCX)
        self.after = Document(OUTPUT_DOCX)

    def test_structure_is_preserved(self):
        self.assertEqual(len(self.before.inline_shapes), 28)
        self.assertEqual(len(self.after.inline_shapes), 28)
        self.assertEqual(len(self.before.tables), 12)
        self.assertEqual(len(self.after.tables), 12)

    def test_numeric_evidence_is_preserved(self):
        get_numbers = lambda document: re.findall(
            r"\b\d+(?:[.,]\d+)?(?:/\d+)?\b",
            "\n".join(paragraph.text for paragraph in document.paragraphs),
        )
        self.assertEqual(get_numbers(self.before), get_numbers(self.after))

    def test_required_rules(self):
        text = "\n".join(paragraph.text for paragraph in self.after.paragraphs)
        self.assertNotIn("landing page", text.lower())
        self.assertTrue(
            all(
                paragraph.paragraph_format.first_line_indent in (None, 0)
                for paragraph in self.after.paragraphs
            )
        )
        keyword_table = self.after.tables[6]
        self.assertEqual(
            [keyword_table.cell(index, 0).text.strip() for index in range(1, 31)],
            [str(index) for index in range(1, 31)],
        )
