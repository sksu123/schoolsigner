import React, { useState, useMemo } from 'react';
import { WorkRecord, SchoolSettings } from '../types';
import {
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface EdufineSummaryModalProps {
  records: WorkRecord[];
  settings: SchoolSettings;
  onClose: () => void;
}

export const EdufineSummaryModal: React.FC<EdufineSummaryModalProps> = ({
  records,
  settings,
  onClose,
}) => {
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedType, setSelectedType] = useState('전체');
  const [copied, setCopied] = useState(false);

  // Filter records by month and type
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchMonth = r.workDate.startsWith(targetMonth);
      const matchType = selectedType === '전체' || r.workerType === selectedType;
      return matchMonth && matchType;
    });
  }, [records, targetMonth, selectedType]);

  // Aggregate by worker name and type
  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      {
        workerName: string;
        workerType: string;
        contact: string;
        dates: string[];
        totalDays: number;
        totalHours: number;
        totalGross: number;
      }
    >();

    filtered.forEach((r) => {
      const key = `${r.workerName}_${r.workerType}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          workerName: r.workerName,
          workerType: r.workerType,
          contact: r.contact || '',
          dates: [r.workDate],
          totalDays: 1,
          totalHours: r.workHours,
          totalGross: r.dailyPay || 0,
        });
      } else {
        existing.dates.push(r.workDate);
        existing.totalDays += 1;
        existing.totalHours += r.workHours;
        existing.totalGross += r.dailyPay || 0;
      }
    });

    return Array.from(map.values()).map((item) => {
      // 4대보험 & 세금 공제 계산 (교육청 일용/단시간 근로 지침 기준)
      // 배움터지킴이는 실비 정액(비과세/보험 제외)
      const isVolunteer = item.workerType.includes('지킴이');
      
      // 고용보험: 0.9% (근로자 부담분)
      const employmentInsurance = isVolunteer ? 0 : Math.floor(item.totalGross * 0.009);
      
      // 일용근로소득세 (1일 15만원 비과세 초과분 산식 적용 - 학교 단기인력은 통상 0원)
      const incomeTax = 0;
      const residentTax = 0;
      
      const totalDeduction = employmentInsurance + incomeTax + residentTax;
      const netPay = item.totalGross - totalDeduction;

      return {
        ...item,
        employmentInsurance,
        totalDeduction,
        netPay,
      };
    });
  }, [filtered]);

  const totalSumGross = aggregated.reduce((s, a) => s + a.totalGross, 0);
  const totalSumDeduction = aggregated.reduce((s, a) => s + a.totalDeduction, 0);
  const totalSumNet = aggregated.reduce((s, a) => s + a.netPay, 0);

  // Generate K-Edufine proposal description text
  const generateProposalText = () => {
    const [year, month] = targetMonth.split('-');
    const typeLabel = selectedType === '전체' ? '단기·대체인력' : selectedType;
    
    let text = `1. 관련: ${settings.schoolName} 교육공무직원 및 단기대체인력 운영 관리계획\n`;
    text += `2. ${year}년 ${parseInt(month, 10)}월 ${typeLabel} 인건비를 아래와 같이 지급하고자 품의합니다.\n\n`;
    text += `  가. 지급대상: 총 ${aggregated.length}명\n`;
    text += `  나. 지급총액: 금 ${totalSumGross.toLocaleString()}원 (실지급액: 금 ${totalSumNet.toLocaleString()}원)\n`;
    text += `  다. 세부 지급내역:\n`;
    
    aggregated.forEach((item, idx) => {
      text += `    [${idx + 1}] ${item.workerName} (${item.workerType}) : ${item.totalDays}일(${item.totalHours}시간) / 총액 ${item.totalGross.toLocaleString()}원 (공제 ${item.totalDeduction.toLocaleString()}원 / 실지급 ${item.netPay.toLocaleString()}원)\n`;
    });
    
    text += `\n붙임: 1. ${year}년 ${parseInt(month, 10)}월 근무확인서 및 출근부 각 1부. 끝.`;
    return text;
  };

  const handleCopyProposal = () => {
    navigator.clipboard.writeText(generateProposalText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    let csv = '\uFEFF';
    csv += '순번,직종,성명,연락처,근무일수,총근무시간,지급총액,고용보험공제,실지급액\n';
    aggregated.forEach((item, idx) => {
      csv += `"${idx + 1}","${item.workerType}","${item.workerName}","${item.contact}","${item.totalDays}일","${item.totalHours}시간","${item.totalGross}","${item.employmentInsurance}","${item.netPay}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `K-에듀파인_인건비품의내역_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
      <div className="neu-card w-full max-w-4xl max-h-[92vh] flex flex-col p-6 sm:p-8 bg-[#EEF1F8] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset-bar flex items-center justify-center text-emerald-700">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-700 tracking-tight">
                K-에듀파인 지출품의 연계 요약표
              </h2>
              <p className="text-xs text-slate-500">
                인건비 지급 품의서 작성 시 필요한 직종별 집계 및 복사용 문구
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-circle-btn w-9 h-9 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 필터 바 */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">대상월:</span>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="neu-inset-bar px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            />

            <span className="text-xs font-bold text-slate-500 ml-2">직종:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="neu-inset-bar px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="전체">전체 직종</option>
              <option value="급식실 대체인력">급식실 대체인력</option>
              <option value="배움터지킴이">배움터지킴이</option>
              <option value="늘봄·돌봄 대체">늘봄·돌봄 대체</option>
              <option value="시설보조·환경정비">시설보조·환경정비</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="neu-button px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              집계 엑셀 다운로드
            </button>
            <button
              onClick={handleCopyProposal}
              className="neu-button-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '품의문 복사완료!' : '품의문 원클릭 복사'}
            </button>
          </div>
        </div>

        {/* 집계 표 */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="neu-inset-bar p-3 rounded-2xl mb-4 bg-[#EEF1F8]">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[11px] font-bold text-slate-500 border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-2">순번</th>
                  <th className="py-2.5 px-2">인력 구분</th>
                  <th className="py-2.5 px-2">성명</th>
                  <th className="py-2.5 px-2 text-center">근무일수</th>
                  <th className="py-2.5 px-2 text-center">총 인정시간</th>
                  <th className="py-2.5 px-2 text-right">산출총액</th>
                  <th className="py-2.5 px-2 text-right">공제액(고용 등)</th>
                  <th className="py-2.5 px-2 text-right font-bold text-slate-800">실지급액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40">
                {aggregated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      해당 월/직종에 대한 근무기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  aggregated.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/30 transition-colors">
                      <td className="py-2.5 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-medium">{item.workerType}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-800">{item.workerName}</td>
                      <td className="py-2.5 px-2 text-center">{item.totalDays}일</td>
                      <td className="py-2.5 px-2 text-center">{item.totalHours}시간</td>
                      <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                        {item.totalGross.toLocaleString()}원
                      </td>
                      <td className="py-2.5 px-2 text-right text-rose-600 font-medium">
                        -{item.totalDeduction.toLocaleString()}원
                      </td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-emerald-700">
                        {item.netPay.toLocaleString()}원
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {aggregated.length > 0 && (
                <tfoot className="border-t-2 border-slate-300 font-bold text-slate-800 bg-white/20">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-2 text-center">
                      총 계 ({aggregated.length}명)
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {aggregated.reduce((s, a) => s + a.totalDays, 0)}일
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {aggregated.reduce((s, a) => s + a.totalHours, 0)}시간
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-900">
                      {totalSumGross.toLocaleString()}원
                    </td>
                    <td className="py-2.5 px-2 text-right text-rose-600">
                      -{totalSumDeduction.toLocaleString()}원
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-800 text-sm font-black">
                      {totalSumNet.toLocaleString()}원
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 에듀파인 본문 복사용 텍스트 미리보기 */}
          <div className="neu-card p-4 rounded-2xl bg-[#EEF1F8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                K-에듀파인 지출품의 본문 텍스트 (그대로 복사하여 붙여넣으시면 됩니다)
              </span>
              <button
                onClick={handleCopyProposal}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                {copied ? '복사됨 ✓' : '텍스트 복사'}
              </button>
            </div>
            <pre className="neu-inset-bar p-3 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed select-all">
              {generateProposalText()}
            </pre>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>
              참고: 배움터지킴이 활동비는 자원봉사 실비로 소득세 및 4대보험 비과세이며, 조리실무사 등 대체인력은 고용보험(0.9%)이 자동 공제 계산됩니다.
            </span>
          </div>
        </div>

        {/* 모달 풋터 */}
        <div className="pt-4 mt-2 border-t border-white/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="neu-button px-5 py-2 rounded-xl text-xs font-bold text-slate-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
