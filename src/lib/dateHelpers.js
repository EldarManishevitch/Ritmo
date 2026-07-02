/**
 * Returns the Monday of the current week as a YYYY-MM-DD string.
 * Formula: today's date minus ((today.getDay() + 6) % 7) days.
 * Example: if today is Wednesday July 2 2026, returns "2026-06-29"
 */
export function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7; // 0 for Monday, 1 for Tuesday, etc.
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
}