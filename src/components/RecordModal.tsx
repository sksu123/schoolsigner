import React, { useState } from 'react';
import { X, Calendar, Clock, User, Check, Sparkles, PenLine } from 'lucide-react';
import { WorkRecord, WorkerTypeConfig, SchoolSettings } from '../types';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<WorkRecord>) => void;
  workerTypes: WorkerTypeConfig[];
  settings: SchoolSettings;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workerTypes,
  settings,
}) => {
  if (!isOpen) return null;

  const defaultType = workerTypes[0] || {
    name: '급식실 대체인력',
    defaultStartTime: '07:30',
    defaultEndTime: '15:30',
    defaultBreakHours: 1,
    dailyWage: 78400,
    hourlyWage: 11200,
  };

  const [workDate, setWorkDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [workerType, setWorkerType] = useState<string>(defaultType.name);
  const [workerName, setWorkerName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(defaultType.defaultStartTime);
  const [endTime, setEndTime] = useState<string>(defaultType.defaultEndTime);
  const [breakHours, setBreakHours] = useState<number>(defaultType.defaultBreakHours);
  const [notes, setNotes] = useState<string>('정상 근무 확인');

  const handleTypeChange = (typeName: string) => {
    setWorkerType(typeName);
    const target = workerTypes.find((t) => t.name === typeName);
    if (target) {
      setStartTime(target.defaultStartTime);
      setEndTime(target.defaultEndTime);
      setBreakHours(target.defaultBreakHours);
    }
  };

  // Calculate work hours
  const calculateHours = (): number => {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const totalMinutes = eH * 60 + eM - (sH * 60 + sM) - breakHours * 60;
    return Math.max(0, Math.round((totalMinutes / 60) * 10) / 10);
  };

  const workHours = calculateHours();
  const currentConfig = workerTypes.find((t) => t.name === workerType) || defaultType;
  const estimatedPay = Math.round(workHours * (currentConfig.hourlyWage || 11200));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      alert('근무자 성명을 입력해주세요.');
      return;
    }

    onSave({
      workDate,
      workerType,
      workerName: workerName.trim(),
      startTime,
      endTime,
      breakHours,
      workHours,
      dailyPay: estimatedPay,
      workerSignature: '', // 전자서명 대신 인쇄된 근무상황부에 수기 자필 서명
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
      <div className="neu-card w-full max-w-xl max-h-[92vh] flex flex-col p-6 sm:p-7 bg-[#EEF1F8] overflow-hidden">
        {/* 모달 상단 */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-inset-bar flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-700">누가 기록 수기 추가</h3>
              <p className="text-xs text-slate-500">
                소급 등록 또는 수기 관리가 필요한 경우 담당자가 직접 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-circle-btn w-8 h-8 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* 1. 근무일자 & 인력유형 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                근무일자 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                인력 유형 (직종) <span className="text-rose-500">*</span>
              </label>
              <select
                value={workerType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {workerTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. 근무자 성명 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              근무자 성명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 김영희"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          {/* 3. 근무시간 & 인정시간 산출 */}
          <div className="neu-inset-bar p-3.5 rounded-2xl bg-[#EEF1F8]">
            <span className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              근무시간 설정 및 인정시간 자동산출
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1">시작시간</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="neu-inset-box w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 mb-1">종료시간</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="neu-inset-box w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 mb-1">휴게(공제)시간</span>
                <select
                  value={breakHours}
                  onChange={(e) => setBreakHours(Number(e.target.value))}
                  className="neu-inset-box w-full px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={0}>0시간</option>
                  <option value={0.5}>30분 (0.5h)</option>
                  <option value={1}>1시간 (1.0h)</option>
                  <option value={1.5}>1.5시간</option>
                </select>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-300/50 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">인정 근무시간:</span>
              <span className="font-extrabold text-slate-800 text-sm">{workHours}시간</span>
              <span className="text-slate-600 font-medium ml-3">산출 일당:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {estimatedPay.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 4. 근무자 수기 서명 안내문구 (전자서명 대체) */}
          <div className="neu-inset-bar p-4 rounded-2xl bg-[#EEF1F8] border-l-4 border-blue-600 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
              <PenLine className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>근무자 서명 안내 (출근부 인쇄본 자필 수기 서명)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              수기 추가 건은 화면 내 별도의 전자서명이 필요하지 않습니다. 본 기록 저장 후 상단의 <strong>[출근대장 A4 인쇄 / PDF 저장]</strong>으로 출력하시어, 해당 서명란에 <strong>근무자가 직접 자필로 수기 서명(날인)</strong>할 수 있도록 안내해 주시기 바랍니다.
            </p>
          </div>

          {/* 5. 비고 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              비고 (결원 사유 및 업무내용)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 조리실무사 병가 대체, 급식 청소 및 식재료 검수"
              className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 outline-none"
            />
          </div>

          {/* 버튼 영역 */}
          <div className="pt-3 border-t border-white/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="neu-button px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
            >
              취소
            </button>
            <button
              type="submit"
              className="neu-button-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              근무기록 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
