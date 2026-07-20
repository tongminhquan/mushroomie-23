# Task 2 report — invariant tests for section 3.3.3

## Scope

Created `tools/test_sync_333_prose.py`, a `unittest` regression suite for the
section 3.3.3 source/output DOCX pair. Until Task 3 creates
`tools/sync_333_prose_to_asm.py`, the test falls back to the agreed absolute
source and output paths under `C:\Users\Admin\OneDrive\Tài liệu\mushroomie\artifacts`.

## RED verification

Command:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest tools.test_sync_333_prose -v
```

Output summary:

```text
test_numeric_evidence_is_preserved ... ERROR
test_required_rules ... ERROR
test_structure_is_preserved ... ERROR

docx.opc.exceptions.PackageNotFoundError: Package not found at
'C:\Users\Admin\OneDrive\Tài liệu\mushroomie\artifacts\Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx'

Ran 3 tests in 0.104s
FAILED (errors=3)
```

This is the expected RED outcome: the source document loads successfully, but
the output DOCX does not exist yet. The failure is therefore not caused by the
missing Task 3 sync module; fallback constants route the tests to the agreed
absolute artifact paths.

## Invariants covered

- Exact source/output counts: 28 inline images and 12 tables.
- Paragraph-level numeric evidence in source and output must match exactly.
- Output must not contain "landing page", must not use a first-line indent,
  and table index 6 must retain sequential labels 1 through 30.

## Files changed

- `tools/test_sync_333_prose.py`
- `.superpowers/sdd/task-2-report.md`

## Self-review

- Confirmed the source has 28 inline images, 12 tables, and 31 rows in table 6.
- Fallback is limited to `ModuleNotFoundError`; other import errors remain
  visible rather than being masked.
- The tests use only `python-docx`, already available in the prescribed runtime.

## Commit

`test: add section 3.3.3 document invariants` (this report and the test are
committed together.)

## Concerns / handoff

- Tests are intentionally RED until Task 3 writes the target DOCX.
- Task 3 should replace the temporary fallback with its actual sync-module
  import while keeping the constants and output location unchanged.
