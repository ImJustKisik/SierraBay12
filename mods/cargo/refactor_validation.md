# Cargo refactor validation

The six stages were checked independently on 2026-10-02, starting from
`4b3951d553bb3c3c189cedcff195861c4273b555` on `228dev`.
Each stage passed its checks before preparation of the next stage.

Compilation used BYOND Dream Maker 516.1675 and `baystation12.dme`, with the
existing Sierra map include chain. DreamChecker parsed the corresponding
worktree before each check. `git diff --check` passed for every stage.

| Stage | Branch | Sierra compilation | DreamChecker | Compiler time |
| --- | --- | --- | --- | --- |
| 1 | `cargo/refactor-1` | 0 errors, 0 warnings | Baseline only (3 hints) | 1:12 |
| 2 | `cargo/refactor-2` | 0 errors, 0 warnings | Baseline only (3 hints) | 1:12 |
| 3 | `cargo/refactor-3` | 0 errors, 0 warnings | Baseline only (3 hints) | 1:02 |
| 4 | `cargo/refactor-4` | 0 errors, 0 warnings | Baseline only (3 hints) | 0:52 |
| 5 | `cargo/refactor-5` | 0 errors, 0 warnings | Baseline only (3 hints) | 0:53 |
| 6 | `cargo/refactor-6` | 0 errors, 0 warnings | Baseline only (3 hints) | 0:54 |

The unchanged DreamChecker baseline consists of three `Hint` diagnostics in
`code/__defines/misc.dm` at lines 301, 302 and 303: use `//!` instead of `///`
after a define. No new diagnostics were introduced.

Stage 1 was also checked by comparing all 348 original declarations and
procedure bodies; 206 were extracted without body changes. Later stages use
canonical carts and typed orders, so their behavior changes are intentional.
The final staged sources match the working checkout after line-ending
normalization.

Unit tests and DreamDaemon were not executed, as explicitly requested by the
user. Test definitions and fixtures were updated and compiled. Runtime cargo,
export, caravan, metabolism, UI and refund scenarios remain unverified; a
successful compilation does not demonstrate those scenarios.

The originally planned final CI unit-test run (`TEST=MAP`, `MAP_PATH=sierra`)
was omitted under that user instruction. No test workflow was dispatched.

The first draft PR targets `228dev`; each later PR targets its predecessor.
Review and merge the stages in order. Monetary fixes appear only in stage 6.
