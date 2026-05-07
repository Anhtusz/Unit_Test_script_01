# Unit Testing Report

## 1. Tools and Scope

### Tools

| Item | Tool / Library | Purpose |
|---|---|---|
| Test runner | `Vitest 4.0.15` | Execute unit tests and assertions |
| React testing | `@testing-library/react` | Render components and verify UI behavior |
| DOM matchers | `@testing-library/jest-dom` | Readable DOM assertions |
| Mocking | `vi.fn`, `vi.mock`, `vi.spyOn` | Mock API calls, auth helpers, router hooks, and dependencies |
| Coverage | `@vitest/coverage-v8` | Generate statement / branch / function / line coverage |

### Scope

- `F08`: Blog view, search, create, edit, delete
- `F09`: Forum search, ask question, discussion answer API
- `F10`: Course / exam management validation and API flows

## 2. Test Case Distribution

All new scripts are stored in `frontend/UnitTestscript`.

Additional intentional-failure scripts are stored in:

- `frontend/UnitTestscript/FailingCases`

### F08

| Test file | Test cases |
|---|---:|
| `F08/posts.api.test.js` | 30 |
| `F08/SearchBar.test.jsx` | 5 |
| `F08/EditorForm.test.jsx` | 9 |
| `F08/BlogEditor.test.jsx` | 11 |
| **Total F08** | **55** |

Covered areas:

- API response normalization: raw array, wrapped data, empty payload fallback
- API error handling: backend message and HTTP status fallback
- Auth header handling for create / update / delete flows
- Search keyword trim and URL encoding
- Editor form loading, saving, edit mode, checkbox toggle, cancel link
- Blog editor create/edit flow, invalid submit guard, parse invalid `contentJson`, toast and navigation behavior

### F09

| Test file | Test cases |
|---|---:|
| `F09/dicussion.api.test.js` | 6 |
| `F09/ForumSearchBar.test.jsx` | 6 |
| `F09/AskQuestion.test.jsx` | 21 |
| **Total F09** | **33** |

Covered areas:

- Trim / normalize answer content before update
- Delete answer request verification
- Forum search submit by click and form submit
- Hover behavior and optional callback safety
- Ask-question auth guard
- Boundary validation for title/content length
- Tag normalization, empty-tag handling, and payload shaping
- Submitting state, duplicate-submit prevention, success/error toast, delayed navigation

### F10

| Test file | Test cases |
|---|---:|
| `F10/CheckCourseCreate.test.js` | 14 |
| `F10/CheckFormatExcel.test.js` | 9 |
| `F10/courses.api.test.js` | 14 |
| `F10/exams.api.test.js` | 13 |
| **Total F10** | **50** |

Covered areas:

- Course creation validation boundaries
- Lesson index-specific validation messages
- Excel header validation, invalid types, numeric index checks, choice-row validation
- Course API query-string construction
- Course create / update / publish error handling
- Exam create / submit / fetch flows
- Query param filtering for exam list API

## 3. Execution Result

### Commands

```powershell
npm.cmd run test:unit-scope
npm.cmd run coverage:unit-scope
npm.cmd run test:known-failures
npm.cmd run test:unit-scope:with-failures
```

### Unit Test Result

| Metric | Result |
|---|---:|
| Test files passed | `11 / 11` |
| Test cases passed | `138 / 138` |

### Known Failure Suite

Intentional failing cases are separated from the normal suite so you can choose whether the run should pass or expose known defects.

| Command | Expected outcome |
|---|---|
| `npm.cmd run test:unit-scope` | Pass |
| `npm.cmd run coverage:unit-scope` | Pass + generate coverage |
| `npm.cmd run test:known-failures` | Fail on known defects only |
| `npm.cmd run test:unit-scope:with-failures` | Fail because it includes both normal tests and known failing cases |

Current `known-failures` result:

| Metric | Result |
|---|---:|
| Test files failed | `5 / 5` |
| Failing test cases | `12 / 12` |

Known failing cases currently added:

- `KF_F08_01`: `BlogEditor` still navigates to `/blog/undefined` when create API returns no `id`
- `KF_F08_02`: `createPost()` throws a JSON parse error instead of falling back to `HTTP 500`
- `KF_F08_03`: `updatePost()` throws a JSON parse error instead of falling back to `HTTP 502`
- `KF_F08_04`: `softDeletePost()` throws a JSON parse error instead of falling back to `HTTP 503`
- `KF_F09_01`: forum search still submits an empty string when the query is blank
- `KF_F09_02`: `updateAnswerApi()` still calls the backend for whitespace-only content
- `KF_F09_03`: `deleteAnswerApi()` still calls the backend when `discussionId` is missing
- `KF_F09_04`: `AskQuestion` does not deduplicate repeated tags before submit
- `KF_F10_01`: `fetchExamsByLesson()` does not convert HTTP `403` into the expected "not enrolled" error
- `KF_F10_02`: `fetchExamById()` does not convert HTTP `401` into the expected "not enrolled" error
- `KF_F10_03`: `checkCourseCreate()` throws when `courseContent` is missing instead of returning a validation result
- `KF_F10_04`: `checkCourseCreate()` throws when `lessons` is missing instead of returning a validation result

## 4. Coverage Summary

Coverage below was generated from `vitest --coverage` on `2026-05-06`.

### Overall Coverage

| Metric | Result |
|---|---:|
| Statements | `76.77%` |
| Branches | `69.71%` |
| Functions | `75.53%` |
| Lines | `77.70%` |

### Main Covered Files

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/api/posts.api.js` | `100.00%` | `91.66%` | `100.00%` | `100.00%` |
| `src/pages/shared/Blog/components/SearchBar.jsx` | `100.00%` | `100.00%` | `100.00%` | `100.00%` |
| `src/pages/shared/BlogEditor/BlogEditor.jsx` | `98.07%` | `83.67%` | `100.00%` | `100.00%` |
| `src/pages/shared/BlogEditor/Components/EditorForm.jsx` | `100.00%` | `100.00%` | `100.00%` | `100.00%` |
| `src/api/dicussion.api.js` | `100.00%` | `100.00%` | `100.00%` | `100.00%` |
| `src/pages/shared/Forum/AskQuestion.jsx` | `93.02%` | `95.00%` | `80.00%` | `95.00%` |
| `src/pages/shared/Forum/components/SearchBar.jsx` | `100.00%` | `100.00%` | `100.00%` | `100.00%` |
| `src/api/courses.api.js` | `100.00%` | `82.50%` | `100.00%` | `100.00%` |
| `src/api/exams.api.js` | `78.12%` | `59.09%` | `100.00%` | `78.12%` |
| `src/pages/instructor/CreateCourse/Components/FormCreateCourse/CheckCourseCreate.js` | `100.00%` | `100.00%` | `100.00%` | `100.00%` |
| `src/pages/instructor/CreateExam/Components/ListQuestion/CheckFormatExcel.js` | `100.00%` | `94.73%` | `100.00%` | `100.00%` |

### Coverage Artifacts

- HTML report: `frontend/coverage/index.html`
- Raw JSON: `frontend/coverage/coverage-final.json`
- XML report: `frontend/coverage/clover.xml`

## 5. Notes

- Negative-path API tests intentionally trigger `console.error` lines already present in the source code. These logs appear during test execution, but the test suite still passes.
- Overall coverage is affected by shared imported utilities such as `src/utils/auth.js`, which are only partially exercised by this feature-scoped test suite.
