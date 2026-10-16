import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { WorkRecord, SchoolSettings } from '../types';
import { formatKoreanDate } from '../utils/dateFormatter';

interface PrintAllViewProps {
  records: WorkRecord[];
  settings: SchoolSettings;
  onBack: () => void;
}

export const PrintAllView: React.FC<PrintAllViewProps> = ({
  records,
  settings,
  onBack,
}) => {
  const totalHours = records.reduce((acc, r) => acc + (r.workHours || 0), 0);
  const totalPay = records.reduce((acc, r) => acc + (r.dailyPay || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28">
      {/* Action Header (Hidden in print) */}
      <div className="neu-card p-4 bg-[#EEF1F8] flex items-center justify-between no-print mb-6">
        <button
          onClick={onBack}
          className="neu-button px-3.5 py-2 text-slate-700 font-bold text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>관리자 대시보드로 복귀</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium">
            총 <strong className="text-slate-900">{records.length}</strong>건의 출근 기록이 인쇄 서식으로 준비되었습니다.
          </span>
          <button
            onClick={handlePrint}
            className="neu-button-primary px-4 py-2 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>출근대장 A4 인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard School Official Log) */}
      <div className="bg-white rounded-2xl border-2 border-slate-700 p-8 md:p-12 shadow-sm text-slate-900 print-document select-text">
        {/* Top 결재란 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              근무상황 확인대장
            </h1>
          </div>

          {/* 사용자 정의 결재란 (담당, 행정실장, 교감, 학교장 및 대결/전결 반영) */}
          {(() => {
            const steps = settings.approvalLine && settings.approvalLine.length > 0
              ? settings.approvalLine
              : [
                  { id: '1', roleName: '담 당', approverName: settings.adminOfficer?.split(' ')[0] || '', approvalType: '일반' as const },
                  { id: '2', roleName: '실 장', approverName: settings.adminOfficeChief?.split(' ')[0] || '', approvalType: '일반' as const },
                  { id: '3', roleName: '학교장', approverName: settings.principalName?.split(' ')[0] || '', approvalType: '일반' as const },
                ];

            return (
              <table className="border-collapse border border-slate-700 text-xs text-center shadow-xs">
                <tbody>
                  <tr>
                    <th
                      rowSpan={2}
                      className="border border-slate-700 bg-slate-100 w-7 font-bold py-1 text-slate-800 leading-tight select-none"
                    >
                      결<br />재
                    </th>
                    {steps.map((step) => (
                      <th
                        key={step.id}
                        className="border border-slate-700 bg-slate-50 py-1 px-3 font-semibold min-w-[62px] text-[11px]"
                      >
                        {step.roleName}
                        {step.approvalType !== '일반' && (
                          <span className={`block text-[10px] font-bold ${
                            step.approvalType === '전결' ? 'text-red-600' : 'text-amber-700'
                          }`}>
                            ({step.approvalType})
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  <tr className="h-16">
                    {steps.map((step) => (
                      <td
                        key={step.id}
                        className="border border-slate-700 align-middle text-center p-1"
                      >
                        {/* 결재는 수기 서명/날인을 받으므로 결재란 내 이름 생략 */}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Records Table */}
        <table className="w-full border-collapse border border-slate-700 text-xs text-left mb-6">
          <thead className="bg-slate-100 text-slate-800 text-center font-bold">
            <tr>
              <th className="border border-slate-700 py-2 px-1 w-10">순번</th>
              <th className="border border-slate-700 py-2 px-2 whitespace-nowrap min-w-[95px]">근무일자</th>
              <th className="border border-slate-700 py-2 px-2 w-28">인력 유형</th>
              <th className="border border-slate-700 py-2 px-2 w-20">성명</th>
              <th className="border border-slate-700 py-2 px-2 w-32">근무 시간</th>
              <th className="border border-slate-700 py-2 px-1 w-16">인정시간</th>
              <th className="border border-slate-700 py-2 px-2 w-28">근무자 서명</th>
              <th className="border border-slate-700 py-2 px-2 w-24">확인자</th>
              <th className="border border-slate-700 py-2 px-2">비고 (수기 기재)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={r.id} className="text-center">
                <td className="border border-slate-700 py-2 px-1 text-slate-600 font-mono">
                  {idx + 1}
                </td>
                <td className="border border-slate-700 py-2 px-2 font-mono whitespace-nowrap">
                  {formatKoreanDate(r.workDate)}
                </td>
                <td className="border border-slate-700 py-2 px-2 font-medium">{r.workerType}</td>
                <td className="border border-slate-700 py-2 px-2 font-bold text-slate-900">
                  {r.workerName}
                </td>
                <td className="border border-slate-700 py-2 px-2 font-mono text-[11px]">
                  {r.startTime} ~ {r.endTime}
                </td>
                <td className="border border-slate-700 py-2 px-1 font-bold">{r.workHours}h</td>
                <td className="border border-slate-700 py-1 px-2 font-bold text-slate-800">
                  {r.workerSignature === '서명완료' ? (
                    '서명완료'
                  ) : r.workerSignature && r.workerSignature.startsWith('data:') ? (
                    <img
                      src={r.workerSignature}
                      alt="근무자 서명"
                      className="h-7 w-20 object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-slate-400 font-normal">미서명</span>
                  )}
                </td>
                <td className="border border-slate-700 py-1 px-2 font-bold text-slate-800">
                  {r.verifierSignature === '서명완료' ? (
                    r.verifierName ? `${r.verifierName}` : '서명완료'
                  ) : r.verifierSignature && r.verifierSignature.startsWith('data:') ? (
                    <img
                      src={r.verifierSignature}
                      alt="확인자 서명"
                      className="h-7 w-16 object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-slate-400 font-normal">미서명</span>
                  )}
                </td>
                {/* 인쇄나 PDF 저장 시 비고란은 수기로 작성할 수 있게 비워둠 */}
                <td className="border border-slate-700 py-2 px-2 text-center"></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-slate-900 text-center">
            <tr>
              <td colSpan={5} className="border border-slate-700 py-2 px-2 text-right">
                총 합계 ({records.length}건)
              </td>
              <td className="border border-slate-700 py-2 px-1 text-emerald-800">
                {totalHours.toFixed(1)}h
              </td>
              <td colSpan={2} className="border border-slate-700 py-2 px-2 text-right">
                지급예상액: {totalPay.toLocaleString()}원
              </td>
              <td className="border border-slate-700 py-2 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
