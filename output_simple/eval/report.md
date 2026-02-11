# Quality Gate Report

⚠️ **Status:** passed-with-warnings
**Run ID:** 3534a074-1013-4c17-bc19-0db3f11e2d66
**Timestamp:** 2026-02-11T14:19:49.741Z

## Summary

| Metric | Count |
|--------|-------|
| Total Checks | 5 |
| Passed | 4 |
| Warnings | 1 |
| Errors | 0 |

## Stage Results

### ✅ requirements-structurer

### ✅ domain-model

### ✅ system-architect

- ✅ All component entity references are valid
- ✅ 3 ADRs with alternatives documented

### ✅ api-contract

- ⚠️ Some use cases lack API coverage: create, log, reset, create, edit, mark, delete, view, filter, assign, categorize, search, configure

### ✅ prompt-pack-designer

- ✅ All 7 agents have prompt packs

### ✅ scaffold-builder

- ✅ Scaffold includes 61 files with required structure

## Recommendations

- 1 warnings detected. Consider addressing these for better quality.
- Review use cases and ensure all have corresponding API endpoints.
