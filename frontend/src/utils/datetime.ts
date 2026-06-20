/**
 * Format an ISO 8601 date string to zh-CN UTC+8 display format.
 * Input:  "2026-06-20T06:38:22.479Z"
 * Output: "2026-06-20 14:38:22"
 * Returns "-" for null/undefined/invalid input.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" + pad(d.getMonth() + 1) +
    "-" + pad(d.getDate()) +
    " " + pad(d.getHours()) +
    ":" + pad(d.getMinutes()) +
    ":" + pad(d.getSeconds())
  );
}
