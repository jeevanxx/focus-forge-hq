## 2025-05-15 - O(N*W) vs O(N) in Analytics
**Learning:** The analytics engine was performing redundant date parsing and formatting by looping over all sessions for every day of the week (O(N * 7)). For users with many sessions, this caused significant lag in rendering analytics components.
**Action:** Use a single-pass approach with a `Map` or lookup object to accumulate metrics in O(N). Always perform a simple date boundary check (e.g., `date >= start && date < end`) before doing expensive string formatting or complex parsing.
