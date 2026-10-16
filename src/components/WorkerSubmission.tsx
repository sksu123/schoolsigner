import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  Check,
  Power,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { SchoolSettings, WorkerTypeConfig, WorkRecord } from '../types';
import { SignaturePad } from './SignaturePad';

interface WorkerSubmissionProps {
  settings: SchoolSettings;
  workerTypes: WorkerTypeConfig[];
  records?: WorkRecord[];
  onSubmitRecord: (record: Partial<WorkRecord>) => void;
  onBackToAdmin?: () => void;
}

export const WorkerSubmission: React.FC<WorkerSubmissionProps> = ({
  settings,
  workerTypes,
  records = [],
  onSubmitRecord,
  onBackToAdmin,
}) => {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [lastSubmitted, setLastSubmitted] = useState<Partial<WorkRecord> | null>(null);
  const [isClosed, setIsClosed] = useState<boolean>(false);

  const handleExitApp = () => {
    try {
      window.close();
    } catch {
      // ignore
    }
    setIsClosed(true);
  };

  const defaultType = workerTypes[0] || {
    name: '급식실 대체인력',
    defaultStartTime: '07:30',
    defaultEndTime: '15:30',
    defaultBreakHours: 1,
    dailyWage: 78400,
    hourlyWage: 11200,
    assignedWorkers: ['이지은', '박영희', '김명순'],
  };

  const [workDate, setWorkDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [workerType, setWorkerType] = useState<string>(defaultType.name);
  const [workerName, setWorkerName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(defaultType.defaultStartTime);
  const [endTime, setEndTime] = useState<string>(defaultType.defaultEndTime);
  const [breakHours, setBreakHours] = useState<number>(defaultType.defaultBreakHours);
  const [notes, setNotes] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string>('');

  // 현재 선택된 직종에 등록된 근무자 목록 계산 (WorkerTypeConfig.assignedWorkers + 기존 records)
  const registeredWorkers = useMemo(() => {
    const targetConfig = workerTypes.find((t) => t.name === workerType);
    const fromConfig = targetConfig?.assignedWorkers || [];
    const fromRecords = records
      .filter((r) => r.workerType === workerType)
      .map((r) => r.workerName);
    const merged = Array.from(new Set([...fromConfig, ...fromRecords])).filter(Boolean);
    return merged;
  }, [workerTypes, workerType, records]);

  // 최초 로드 시 첫 번째 등록된 근무자 자동 선택
  useEffect(() => {
    if (!workerName && registeredWorkers.length > 0) {
      setWorkerName(registeredWorkers[0]);
    }
  }, [registeredWorkers, workerName]);

  const handleTypeChange = (typeName: string) => {
    setWorkerType(typeName);
    const target = workerTypes.find((t) => t.name === typeName);
    if (target) {
      setStartTime(target.defaultStartTime);
      setEndTime(target.defaultEndTime);
      setBreakHours(target.defaultBreakHours);

      // 직종 변경 시 해당 직종의 등록 인력 중 첫 번째 성명을 자동 선택
      const available = target.assignedWorkers || records.filter((r) => r.workerType === typeName).map((r) => r.workerName);
      if (available && available.length > 0) {
        setWorkerName(available[0]);
      } else {
        setWorkerName('');
      }
    }
  };

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
      alert('근무자 성명을 선택하거나 입력해 주세요.');
      return;
    }
    if (!signatureData) {
      alert('화면 하단 서명란에 정자 또는 서명을 입력해 주세요.');
      return;
    }

    const newRecord: Partial<WorkRecord> = {
      workDate,
      workerType,
      workerName: workerName.trim(),
      startTime,
      endTime,
      breakHours,
      workHours,
      dailyPay: estimatedPay,
      workerSignature: signatureData,
      signedAt: `${workDate} ${endTime}`,
      notes: notes.trim(),
    };

    onSubmitRecord(newRecord);
    setLastSubmitted(newRecord);
    setSubmitted(true);
  };

  const handleResetForNew = () => {
    setSubmitted(false);
    if (registeredWorkers.length > 0) {
      setWorkerName(registeredWorkers[0]);
    } else {
      setWorkerName('');
    }
    setNotes('');
    setSignatureData('');
  };

  if (isClosed) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center">
        <div className="neu-card p-8 bg-[#EEF1F8] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full neu-inset-bar flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-black text-slate-800">
            출근 서명이 완료되었습니다
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            정상 등록되어 제출되었습니다.<br />
            스마트폰 브라우저 상단의 <strong>[뒤로가기]</strong> 또는 <strong>인터넷 탭 [× 닫기]</strong>를 눌러 화면을 종료해 주세요.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsClosed(false);
                setSubmitted(false);
              }}
              className="neu-button px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              새로 출근 서명하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 pb-28">
      {/* 
        [모바일 컨테이너 - 뉴모피즘 카드]
      */}
      <div className="neu-card p-6 sm:p-8 bg-[#EEF1F8]">
        {/* 상단 타이틀 */}
        <div className="text-center pb-5 border-b border-white/60 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 neu-inset-bar mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            스쿨패스 365
          </div>
          <h2 className="text-2xl font-black text-slate-700 tracking-tight">
            스쿨패스 365 모바일 출근 서명
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            오늘 근무하신 일자와 시간을 확인하시고 서명 후 제출해 주세요.
          </p>
        </div>

        {submitted && lastSubmitted ? (
          /* 제출 완료 화면 */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full neu-inset-bar flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-800">
                정상적으로 제출되었습니다!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                출근부에 즉시 등록되어 확인 대기 상태로 전달되었습니다.
              </p>
            </div>

            {/* 영수증 요약 */}
            <div className="neu-inset-bar p-4 rounded-2xl text-left text-xs text-slate-600 space-y-1.5 bg-[#EEF1F8]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">근무자:</span>
                <span className="font-bold text-slate-800">{lastSubmitted.workerName} 님</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">활동직종:</span>
                <span className="font-semibold text-slate-700">{lastSubmitted.workerType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">근무일자:</span>
                <span className="font-bold text-slate-800">{lastSubmitted.workDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">근무시간:</span>
                <span className="font-mono text-slate-700">
                  {lastSubmitted.startTime} ~ {lastSubmitted.endTime} (인정 {lastSubmitted.workHours}시간)
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleResetForNew}
                className="neu-button w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                추가 제출 또는 새 기록 입력
              </button>
              <button
                type="button"
                onClick={handleExitApp}
                className="neu-button-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <Power className="w-3.5 h-3.5" />
                종료 (화면 닫기)
              </button>
            </div>
          </div>
        ) : (
          /* 입력 폼 */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. 활동 직종 (시인성 극대화 화이트 카드) */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-1.5">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>활동 직종 구분 <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={workerType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base font-black text-slate-900 shadow-sm outline-none cursor-pointer bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white"
              >
                {workerTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">※ 본인의 담당 활동 직종을 선택하시면 기본 근무시간이 자동 세팅됩니다.</p>
            </div>

            {/* 2. 근무일자 (시인성 극대화 화이트 카드) */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-1.5">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>근무일자 (출근 날짜) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base font-black text-slate-900 shadow-sm outline-none cursor-pointer bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* 3. 근무자 성명 (원클릭 자동 선택) */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
              <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  근무자 성명 입력 <span className="text-rose-500">*</span>
                </span>
                {registeredWorkers.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    등록 인력 {registeredWorkers.length}명
                  </span>
                )}
              </label>

              {/* 등록된 인력이 있는 경우: 원클릭 터치 칩 제공 */}
              {registeredWorkers.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-2">
                    {registeredWorkers.map((name) => {
                      const isSelected = workerName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setWorkerName(name)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'text-emerald-800 bg-emerald-100/70 border-2 border-emerald-500 shadow-inner'
                              : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                          <span>{name}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setWorkerName('')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        !registeredWorkers.includes(workerName) && workerName !== ''
                          ? 'text-blue-800 bg-blue-100/60 border border-blue-400'
                          : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      직접 입력
                    </button>
                  </div>
                </div>
              )}

              {/* 확인 및 직접 수정용 인풋 */}
              <input
                type="text"
                required
                placeholder={
                  registeredWorkers.length > 0
                    ? '위 명단에서 터치하여 선택하거나 직접 입력하세요'
                    : '근무자 성명을 입력하세요 (예: 홍길동)'
                }
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base font-black text-slate-900 placeholder-slate-400 outline-none bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white"
              />
            </div>

            {/* 4. 근무시간 & 휴게시간 관리 (시인성 극대화 화이트 카드) */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  근무 시간 및 휴게시간 관리
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">터치하여 변경 가능</span>
              </div>

              {/* 시작 & 종료 시간 2열 와이드 배치 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-xs font-black text-slate-600 mb-1">시작시간</span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg py-2.5 px-2 text-base font-black text-slate-900 text-center outline-none bg-white border border-slate-300 shadow-xs"
                  />
                </div>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-xs font-black text-slate-600 mb-1">종료시간</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg py-2.5 px-2 text-base font-black text-slate-900 text-center outline-none bg-white border border-slate-300 shadow-xs"
                  />
                </div>
              </div>

              {/* 휴게시간 선택 행 */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-700">휴게시간 공제</span>
                <select
                  value={breakHours}
                  onChange={(e) => setBreakHours(Number(e.target.value))}
                  className="rounded-xl py-2 px-3 text-xs font-black text-slate-900 outline-none cursor-pointer bg-white border-2 border-slate-300"
                >
                  <option value={0}>0시간 (미공제)</option>
                  <option value={0.5}>30분 공제 (0.5h)</option>
                  <option value={1}>1시간 공제 (1.0h)</option>
                  <option value={1.5}>1.5시간 공제 (1.5h)</option>
                  <option value={2}>2시간 공제 (2.0h)</option>
                </select>
              </div>

              {/* 인정 근무시간 하이라이트 배너 */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  인정 근무시간:
                </span>
                <strong className="text-emerald-800 font-black text-lg sm:text-xl">{workHours}시간</strong>
              </div>
            </div>

            {/* 4. 업무 내용 / 비고 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                근무 내용 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 급식실 조리 및 배식 보조, 안전지도 등"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>

            {/* 5. 모바일 전자서명 패드 */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                근무자 전자서명 (필수) <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                아래 네모 박스 안에 손가락이나 펜으로 정자 또는 서명을 입력해 주세요.
              </p>
              <SignaturePad
                onSave={(data) => setSignatureData(data)}
                initialData={signatureData}
                height={160}
              />
            </div>

            {/* 제출 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                className="neu-button-primary w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <span>근무확인서 서명 제출하기</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
