"""Behavior checks for the deterministic Section 3.3.3 tone audit."""

import unittest

from tools.audit_333_tone import TextRecord, audit


class ToneAuditBehavior(unittest.TestCase):
    def test_allows_common_and_channel_website_forms(self):
        findings = audit(
            [
                TextRecord("P1", "Website Mushroomie là kênh sở hữu."),
                TextRecord("T1R1C1P0", "Ưu tiên website liên quan."),
            ]
        )
        self.assertEqual(findings, [])

    def test_flags_mixed_or_all_caps_website_forms(self):
        findings = audit(
            [
                TextRecord("P1", "WebSite Mushroomie cần được rà soát."),
                TextRecord("P2", "WEBSITE cần được rà soát."),
            ]
        )
        self.assertEqual(
            [(finding.location, finding.marker) for finding in findings],
            [("P1", "website_case"), ("P2", "website_case")],
        )

    def test_repetition_counts_occurrences_within_one_record(self):
        findings = audit(
            [
                TextRecord(
                    "P1",
                    "Nhìn chung, nội dung rõ ràng. Nhìn chung, cần rà soát. Nhìn chung, cần đối chiếu.",
                )
            ]
        )
        self.assertEqual(
            [(finding.category, finding.location, finding.marker) for finding in findings],
            [("repetition", "P1", "nhìn chung")],
        )

    def test_distant_single_connectors_do_not_create_false_positive(self):
        findings = audit(
            [
                TextRecord("P1", "Bên cạnh đó, cần kiểm tra dữ liệu."),
                TextRecord("P40", "Bên cạnh đó, cần đối chiếu minh chứng."),
                TextRecord("T2R3C1P0", "Bên cạnh đó, cần rà soát cách trình bày."),
            ]
        )
        self.assertEqual(findings, [])

    def test_flags_non_metric_index_wording_but_keeps_speed_index(self):
        findings = audit(
            [
                TextRecord("P1", "Speed Index là chỉ số kỹ thuật."),
                TextRecord("P2", "Cần kiểm tra trạng thái index."),
            ]
        )
        self.assertEqual(
            [(finding.location, finding.marker) for finding in findings],
            [("P2", "index_language")],
        )


if __name__ == "__main__":
    unittest.main()
