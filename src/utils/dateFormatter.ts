/**
 * 한국 공문서 및 학교 출근부 표준 날짜 포맷 (예: 2026. 9. 8)
 * YYYY-MM-DD 형식을 YYYY. M. D 형태로 변환
 */
export function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return `${y}. ${m}. ${d}`;
  }
  return dateStr;
}
