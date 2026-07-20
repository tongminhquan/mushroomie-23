# Task 2 report — invariant tests for section 3.3.3

## Scope

Created and revised `tools/test_sync_333_prose.py`, a `unittest` regression
suite for the section 3.3.3 source/output DOCX pair. Until Task 3 creates
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
test_campaign_plan_and_urls_are_preserved ... ERROR
test_numeric_evidence_is_preserved ... ERROR
test_required_rules ... ERROR
test_structure_is_preserved ... ERROR

docx.opc.exceptions.PackageNotFoundError: Package not found at
'C:\Users\Admin\OneDrive\Tài liệu\mushroomie\artifacts\Muc_3.3.3_Kenh_Website_Mushroomie_Dong_Bo_Van_Phong_ASM.docx'

Ran 4 tests in 0.091s
FAILED (errors=4)
```

This is the expected RED outcome: the source document loads successfully, but
the output DOCX does not exist yet. The failure is therefore not caused by the
missing Task 3 sync module; fallback constants route the tests to the agreed
absolute artifact paths.

## Invariants covered

- Exact source/output counts: 28 inline images and 12 tables.
- Numeric evidence, collected from main-document paragraphs and every table
  cell paragraph, must match exactly.
- The exact lists of four campaign stages, eleven activities, and URLs must be
  retained. The source URL list is asserted as `https://mushroomie.io.vn/`.
- Output must not contain "landing page", must not use a first-line indent,
  and table index 6 must retain sequential labels 1 through 30.

## Files changed

- `tools/test_sync_333_prose.py`
- `.superpowers/sdd/task-2-report.md`

## Self-review

- Confirmed the source has 28 inline images, 12 tables, and 31 rows in table 6.
- Imports use `tools.sync_333_prose_to_asm`, so they work from the repository
  root with the required unittest command. Fallback occurs only when that
  module itself is absent; missing imports raised inside it are re-raised.
- Source assertions confirm four stages and eleven activities before comparing
  their exact heading lists with the output.
- The tests use only `python-docx`, already available in the prescribed runtime.

## Commit

`test: strengthen section 3.3.3 document invariants` (this report and the
test revision are committed together.)

## Concerns / handoff

- Tests are intentionally RED until Task 3 writes the target DOCX.
- Task 3 supplies the `tools.sync_333_prose_to_asm` module; the controlled
  fallback can then be removed while keeping its constants and output location
  unchanged.
