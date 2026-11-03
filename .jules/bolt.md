## 2025-05-22 - Incorrect Optimization: UTC vs Local Time
**Learning:** String slicing `isoString.slice(0, 10)` to extract a date key is faster than `format(parseISO(isoString), 'yyyy-MM-dd')`, but it extracts the UTC date. If the rest of the application uses local time for date groupings, this causes a mismatch and silent data loss for sessions near midnight.
**Action:** Always use consistent date parsing/formatting libraries (like `date-fns`) for keys used in groupings unless the entire data pipeline is strictly UTC.
