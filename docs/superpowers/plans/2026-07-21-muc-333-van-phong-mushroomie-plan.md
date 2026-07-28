# Mục 3.3.3 Mushroomie – Kế hoạch đồng bộ văn phong

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biên tập toàn bộ cách hành văn của mục 3.3.3 theo đúng giọng văn trong file ASM Mushroomie do người dùng cung cấp, đồng thời giữ nguyên dữ liệu, hình, bảng, bố cục và bốn giai đoạn triển khai.

**Architecture:** Dùng `python-docx` để đọc tài liệu chuẩn và tài liệu cần sửa, lập hồ sơ văn phong từ chính file ASM, sau đó áp dụng tập thay thế theo từng đoạn và từng ô bảng đã được rà soát. Một bộ kiểm tra bất biến sẽ so sánh tài liệu trước–sau để ngăn thay đổi ngoài phạm vi.

**Tech Stack:** Python 3 từ Codex workspace runtime, `python-docx`, OOXML audit scripts trong Documents skill, `unittest` của Python.

## Global Constraints

- Chỉ dùng `C:/Users/Admin/Downloads/PHẠM THỊ THU HƯƠNG_XÂY DỰNG VÀ TRIỂN KHAI KẾ HOẠCH DIGITAL MARKETING .docx` để xác lập giọng văn.
- Chỉ biên tập `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Khong_Landing_Page_SEO_Thuc_Te.docx`.
- Không bổ sung dữ liệu, nguồn hoặc hình ảnh mới.
- Giữ nguyên 4 giai đoạn, 11 hoạt động, 28 hình, 12 bảng và Bảng 3.14 có STT 1–30.
- Giữ nguyên số liệu, URL, thời gian đo và kết quả PageSpeed Insights/Lighthouse.
- Không xuất hiện cụm “landing page”; mọi đoạn không thụt đầu dòng.
- Tệp đầu ra: `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx`.

---

### Task 1: Lập hồ sơ văn phong từ file ASM

**Files:**
- Create: `tools/analyze_mushroomie_asm_style.py`
- Create: `tmp/mushroomie_asm_style_profile.json`
- Read: `C:/Users/Admin/Downloads/PHẠM THỊ THU HƯƠNG_XÂY DỰNG VÀ TRIỂN KHAI KẾ HOẠCH DIGITAL MARKETING .docx`

**Interfaces:**
- Consumes: đường dẫn DOCX chuẩn qua đối số dòng lệnh.
- Produces: JSON có các trường `preferred_subjects`, `evidence_phrases`, `qualification_phrases`, `term_frequency`, `sample_paragraphs`.

- [ ] **Step 1: Tạo kiểm tra đầu vào và bộ phân tích văn phong**

```python
from collections import Counter
from docx import Document

PREFERRED = ("nhóm thực hiện", "Mushroomie", "kết quả", "dữ liệu")
EVIDENCE = ("kết quả cho thấy", "kết quả ghi nhận", "dữ liệu cho thấy", "qua phân tích")
QUALIFIERS = ("tại thời điểm", "trong phạm vi", "có thể", "cần tiếp tục")

def build_profile(path):
    doc = Document(path)
    prose = [p.text.strip() for p in doc.paragraphs if len(p.text.strip()) >= 120]
    joined = "\n".join(prose).lower()
    return {
        "preferred_subjects": {x: joined.count(x.lower()) for x in PREFERRED},
        "evidence_phrases": {x: joined.count(x) for x in EVIDENCE},
        "qualification_phrases": {x: joined.count(x) for x in QUALIFIERS},
        "term_frequency": Counter(joined.split()).most_common(100),
        "sample_paragraphs": prose[:30],
    }
```

- [ ] **Step 2: Chạy bộ phân tích**

Run:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\analyze_mushroomie_asm_style.py --input 'C:\Users\Admin\Downloads\PHẠM THỊ THU HƯƠNG_XÂY DỰNG VÀ TRIỂN KHAI KẾ HOẠCH DIGITAL MARKETING .docx' --output tmp\mushroomie_asm_style_profile.json
```

Expected: exit code `0`; JSON chứa ít nhất 30 đoạn mẫu và không đọc nguồn ngoài file ASM.

- [ ] **Step 3: Commit công cụ phân tích**

```powershell
git add tools/analyze_mushroomie_asm_style.py
git commit -m "docs: add Mushroomie ASM style profiler"
```

### Task 2: Tạo bộ kiểm tra bất biến trước khi biên tập

**Files:**
- Create: `tools/test_sync_333_prose.py`
- Read: `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Khong_Landing_Page_SEO_Thuc_Te.docx`

**Interfaces:**
- Consumes: `SOURCE_DOCX` và `OUTPUT_DOCX` từ `tools/sync_333_prose_to_asm.py`.
- Produces: bộ kiểm tra `unittest` xác nhận cấu trúc và dữ liệu không đổi.

- [ ] **Step 1: Viết kiểm tra ban đầu**

```python
import re
import unittest
from docx import Document
from sync_333_prose_to_asm import SOURCE_DOCX, OUTPUT_DOCX

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
        get_numbers = lambda d: re.findall(r"\b\d+(?:[.,]\d+)?(?:/\d+)?\b", "\n".join(p.text for p in d.paragraphs))
        self.assertEqual(get_numbers(self.before), get_numbers(self.after))

    def test_required_rules(self):
        text = "\n".join(p.text for p in self.after.paragraphs)
        self.assertNotIn("landing page", text.lower())
        self.assertTrue(all(p.paragraph_format.first_line_indent in (None, 0) for p in self.after.paragraphs))
        keyword_table = self.after.tables[6]
        self.assertEqual([keyword_table.cell(i, 0).text.strip() for i in range(1, 31)], [str(i) for i in range(1, 31)])
```

- [ ] **Step 2: Chạy kiểm tra để xác nhận thất bại do chưa có tệp đầu ra**

Run:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest tools.test_sync_333_prose -v
```

Expected: FAIL vì `OUTPUT_DOCX` chưa được tạo.

### Task 3: Biên tập văn phong từng đoạn và ô bảng

**Files:**
- Create: `tools/asm_333_rewrites.py`
- Create: `tools/sync_333_prose_to_asm.py`
- Modify: `tools/test_sync_333_prose.py`
- Create: `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx`

**Interfaces:**
- `asm_333_rewrites.PARAGRAPH_REWRITES: dict[str, str]` ánh xạ nguyên văn đoạn cũ sang đoạn đã biên tập.
- `asm_333_rewrites.TABLE_CELL_REWRITES: dict[str, str]` ánh xạ nguyên văn ô bảng cũ sang ô đã biên tập.
- `sync_333_prose_to_asm.apply_rewrites(document: Document) -> tuple[int, int]` trả về số đoạn và số ô đã sửa.

- [ ] **Step 1: Lập tập ánh xạ biên tập theo sáu nhóm chức năng**

Mỗi mục trong `PARAGRAPH_REWRITES` phải giữ nguyên ý nghĩa và số liệu nhưng chuyển câu theo cấu trúc: bằng chứng/hiện trạng → ý nghĩa đánh giá → hạn chế hoặc hướng xử lý. Các nhóm bắt buộc gồm `mô tả`, `phân tích`, `đánh giá`, `hạn chế`, `đề xuất`, `kết luận`.

```python
PARAGRAPH_REWRITES = {
    "Trong hệ thống truyền thông số của Mushroomie, website là kênh sở hữu giữ vai trò trung tâm trong việc cung cấp thông tin thương hiệu, trưng bày sản phẩm, tiếp nhận nhu cầu tư vấn và hỗ trợ chuyển đổi đơn hàng.":
    "Trong hệ thống truyền thông số của Mushroomie, Website giữ vai trò là kênh sở hữu trung tâm, đảm nhiệm việc cung cấp thông tin thương hiệu, trưng bày sản phẩm, tiếp nhận nhu cầu tư vấn và hỗ trợ chuyển đổi đơn hàng.",
}

TABLE_CELL_REWRITES = {
    "Khả năng hiển thị nội dung đầu tiên tốt.":
    "Chỉ số phản ánh khả năng hiển thị nội dung đầu tiên ở mức tích cực tại thời điểm đo.",
}
```

Các ánh xạ còn lại được viết trực tiếp sau khi đối chiếu từng đoạn với hồ sơ văn phong ở Task 1; không dùng thay thế hàng loạt dựa trên từ khóa nếu chưa kiểm tra ngữ cảnh.

- [ ] **Step 2: Viết bộ áp dụng thay thế có kiểm soát**

```python
from pathlib import Path
from docx import Document
from docx.shared import Inches
from asm_333_rewrites import PARAGRAPH_REWRITES, TABLE_CELL_REWRITES

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DOCX = ROOT / "artifacts" / "Muc_3.3.3_Kenh_Website_Mushroomie_Khong_Landing_Page_SEO_Thuc_Te.docx"
OUTPUT_DOCX = ROOT / "artifacts" / "Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx"

def apply_rewrites(document):
    paragraph_count = 0
    cell_count = 0

    def replace_text_preserving_format(paragraph, value):
        if not paragraph.runs:
            paragraph.add_run(value)
            return
        paragraph.runs[0].text = value
        for run in list(paragraph.runs[1:]):
            run._element.getparent().remove(run._element)

    for paragraph in document.paragraphs:
        if paragraph.text in PARAGRAPH_REWRITES:
            replace_text_preserving_format(paragraph, PARAGRAPH_REWRITES[paragraph.text])
            paragraph_count += 1
        paragraph.paragraph_format.first_line_indent = Inches(0)
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    if paragraph.text in TABLE_CELL_REWRITES:
                        replace_text_preserving_format(paragraph, TABLE_CELL_REWRITES[paragraph.text])
                        cell_count += 1
    return paragraph_count, cell_count

def main():
    document = Document(SOURCE_DOCX)
    paragraph_count, cell_count = apply_rewrites(document)
    if paragraph_count < 30:
        raise RuntimeError(f"Số đoạn được biên tập chưa đủ phạm vi: {paragraph_count}")
    document.save(OUTPUT_DOCX)
    print(f"paragraphs={paragraph_count}; table_cells={cell_count}; output={OUTPUT_DOCX}")
```

- [ ] **Step 3: Chạy công cụ biên tập**

Run:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\sync_333_prose_to_asm.py
```

Expected: exit code `0`; ít nhất 30 đoạn được biên tập; tệp đầu ra tồn tại và lớn hơn 1 MB.

- [ ] **Step 4: Chạy kiểm tra bất biến**

Run:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest tools.test_sync_333_prose -v
```

Expected: tất cả kiểm tra PASS; không thay đổi số liệu, hình, bảng hoặc Bảng 3.14.

- [ ] **Step 5: Commit công cụ biên tập và kiểm tra**

```powershell
git add tools/asm_333_rewrites.py tools/sync_333_prose_to_asm.py tools/test_sync_333_prose.py
git commit -m "docs: synchronize section 3.3.3 academic tone"
```

### Task 4: Rà soát chất lượng hành văn

**Files:**
- Create: `tools/audit_333_tone.py`
- Read: `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx`

**Interfaces:**
- Consumes: tệp DOCX đầu ra.
- Produces: báo cáo lỗi theo nhóm `first_person`, `promotional`, `absolute_claim`, `repetition`, `terminology`.

- [ ] **Step 1: Viết bộ dò văn phong**

```python
FORBIDDEN = {
    "first_person": ("chúng em", "chúng tôi", "em nhận thấy"),
    "promotional": ("hoàn hảo", "tốt nhất", "vượt trội", "chắc chắn"),
    "absolute_claim": ("hoàn toàn", "luôn luôn", "tuyệt đối"),
}

def audit(paragraphs):
    findings = []
    for index, text in paragraphs:
        lowered = text.lower()
        for category, phrases in FORBIDDEN.items():
            for phrase in phrases:
                if phrase in lowered:
                    findings.append((category, index, phrase, text))
    return findings
```

- [ ] **Step 2: Chạy rà soát và sửa mọi phát hiện trong phạm vi**

Run:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\audit_333_tone.py artifacts\Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx
```

Expected: `0 findings`; thuật ngữ “Mushroomie”, “Website”, “SEO Onpage” và “PageSpeed Insights” được viết nhất quán.

### Task 5: Kiểm tra DOCX và bàn giao

**Files:**
- Create: `tools/verify_333_tone.py`
- Verify: `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx`

**Interfaces:**
- Consumes: tệp đầu ra từ Task 3.
- Produces: bằng chứng kiểm tra cấu trúc và, nếu môi trường hỗ trợ, ảnh kết xuất từng trang.

- [ ] **Step 1: Chạy bộ xác minh mục 3.3.3**

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\verify_333_tone.py
```

Expected: PASS với 4 giai đoạn, 11 hoạt động, 28 hình, 12 bảng, Bảng 3.14 STT 1–30, không có “landing page” và không thụt đầu dòng.

- [ ] **Step 2: Chạy kiểm tra khả năng truy cập, hình và bảng**

```powershell
$doc='artifacts\Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx'
$py='C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$scripts='C:\Users\Admin\.codex\plugins\cache\openai-primary-runtime\documents\26.715.12143\skills\documents\scripts'
& $py "$scripts\a11y_audit.py" $doc
& $py "$scripts\images_audit.py" $doc
& $py "$scripts\table_geometry.py" $doc
```

Expected: không có lỗi accessibility; 28 ảnh dạng inline; 12 bảng có `tblW`, `tblGrid` và `tcW` đồng nhất.

- [ ] **Step 3: Kết xuất và kiểm tra trực quan**

```powershell
$renderer='C:\Users\Admin\.codex\plugins\cache\openai-primary-runtime\documents\26.715.12143\skills\documents\render_docx.py'
& $py $renderer $doc --output_dir artifacts\render_333_dong_bo_van_phong --emit_pdf
```

Expected: có ảnh PNG cho mọi trang và không có cắt chữ, chồng hình hoặc vỡ bảng. Nếu LibreOffice không tồn tại, ghi nhận rõ giới hạn và chỉ bàn giao sau khi các kiểm tra cấu trúc ở Step 1–2 đều đạt.

- [ ] **Step 4: Bàn giao đúng một tệp Word**

Trả về liên kết đến `artifacts/Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx`, kèm số đoạn đã biên tập, kết quả kiểm tra và giới hạn kết xuất nếu có.
