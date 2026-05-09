## 2025-05-14 - [Algorithmic Optimization of Weekly Analytics]
**Learning:** Redundant date parsing and formatting in loops (O(7*N)) was a major bottleneck. Single-pass iteration (O(N)) with a Map for O(1) lookups significantly improved performance.
**Action:** Always look for nested loops or repeated filter/reduce operations on the same dataset. Use Maps for fast lookups and pre-calculate date boundaries once instead of repeatedly parsing ISO strings.
