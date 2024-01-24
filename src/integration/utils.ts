export function getActiveMarks(marksObj: Record<string, boolean> | undefined) {
  return Object.entries(marksObj ?? {})
    .filter((mark) => mark[1])
    .map(([markName]) => markName);
}
