"""Regression checks for the edited section 3.3.3 Word document."""

import re
import unittest

from docx import Document

try:
    from tools.sync_333_prose_to_asm import OUTPUT_DOCX, SOURCE_DOCX
except ModuleNotFoundError as error:
    if error.name != "tools.sync_333_prose_to_asm":
        raise
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


def all_paragraphs(document):
    yield from document.paragraphs
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                yield from cell.paragraphs


def document_text(document):
    return "\n".join(paragraph.text for paragraph in all_paragraphs(document))


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
            document_text(document),
        )
        self.assertEqual(get_numbers(self.before), get_numbers(self.after))

    def test_campaign_plan_and_urls_are_preserved(self):
        get_stages = lambda document: re.findall(
            r"^➔ Giai đoạn .+", document_text(document), re.MULTILINE
        )
        get_activities = lambda document: re.findall(
            r"^Hoạt động \d+:.+", document_text(document), re.MULTILINE
        )
        get_urls = lambda document: re.findall(
            r"https?://[^\s,;)\]]+", document_text(document)
        )

        self.assertEqual(len(get_stages(self.before)), 4)
        self.assertEqual(len(get_activities(self.before)), 11)
        self.assertEqual(get_urls(self.before), ["https://mushroomie.io.vn/"])
        self.assertEqual(get_stages(self.before), get_stages(self.after))
        self.assertEqual(get_activities(self.before), get_activities(self.after))
        self.assertEqual(get_urls(self.before), get_urls(self.after))

    def test_required_rules(self):
        text = document_text(self.after)
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
