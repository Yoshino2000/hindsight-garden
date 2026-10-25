# Frozen Garden 0.4.0 test fixtures

Exact source bytes from the project's published `0.4.0` tag:
[Yoshino2000/hindsight-garden](https://github.com/Yoshino2000/hindsight-garden/tree/0.4.0).

Commit: `ae95990b893967c0c86a9c38ca3778f051584667`.

These files test that the actual older reader rejects the new archive schema. Do not reformat or edit them.
They are covered by the project's MIT license and excluded from the installable plugin ZIP.

| File | Bytes | SHA-256 | Git blob |
|---|---:|---|---|
| `core.js` | 18884 | `f97627b5428cea221c5b5780561d6fb7ed4435adbb6aa745301cbb3c73e0a793` | `577cd586b0d822110939b30fbe07dbb18030a623` |
| `store.js` | 4001 | `210a4311c49edb22002b45226e9e7cfdaea0f194ebecae66df46529675fd04ee` | `cf2da4df3478cc7b0c9cb9f243937c067102f9d0` |

Run all tests with `npm test`: Node 22.13+ and Python 3.11+ are required.
Windows uses `py -3`; other platforms use the `PYTHON` executable path or `python3`.
The tests read these fixtures locally and need neither Git history nor network access.
