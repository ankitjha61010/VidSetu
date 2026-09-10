/**
 * Formats runtime minutes into hours and minutes (e.g. 103 -> "1h 43m", 145 -> "2h 25m").
 */
export const formatRuntime = (totalMinutes?: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};
