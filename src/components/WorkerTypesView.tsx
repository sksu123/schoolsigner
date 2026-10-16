import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Clock, Check, X, ShieldAlert } from 'lucide-react';
import { WorkerTypeConfig } from '../types';

interface WorkerTypesViewProps {
  types: WorkerTypeConfig[];
  onUpdateTypes: (types: WorkerTypeConfig[]) => void;
}

export const WorkerTypesView: React.FC<WorkerTypesViewProps> = ({ types, onUpdateTypes }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [defaultStartTime, setDefaultStartTime] = useState('08:30');
  const [defaultEndTime, setDefaultEndTime] = useState('16:30');
  const [defaultBreakHours, setDefaultBreakHours] = useState(1);
  const [dailyWage, setDailyWage] = useState(78400);
  const [hourlyWage, setHourlyWage] = useState(11200);
  const [description, setDescription] = useState('');
  const [insuranceNote, setInsuranceNote] = useState('');
  const [assignedWorkersStr, setAssignedWorkersStr] = useState('');

  const handleStartAdd = () => {
    setName('');
    setDefaultStartTime('08:30');
    setDefaultEndTime('16:30');
    setDefaultBreakHours(1);
    setDailyWage(78400);
    setHourlyWage(11200);
    setDescription('');
    setInsuranceNote('고용보험/산재보험 적용 대상');
    setAssignedWorkersStr('');
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (t: WorkerTypeConfig) => {
    setName(t.name);
    setDefaultStartTime(t.defaultStartTime);
    setDefaultEndTime(t.defaultEndTime);
    setDefaultBreakHours(t.defaultBreakHours);
    setDailyWage(t.dailyWage);
    setHourlyWage(t.hourlyWage);
    setDescription(t.description);
    setInsuranceNote(t.insuranceNote || '');
    setAssignedWorkersStr(t.assignedWorkers?.join(', ') || '');
    setEditingId(t.id);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('직종명을 입력하세요.');
      return;
    }

    const assignedWorkersList = assignedWorkersStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      const updated = types.map((t) =>
        t.id === editingId
          ? {
              ...t,
              name: name.trim(),
              defaultStartTime,
              defaultEndTime,
              defaultBreakHours,
              dailyWage: Number(dailyWage),
              hourlyWage: Number(hourlyWage),
              description: description.trim(),
              insuranceNote: insuranceNote.trim(),
              assignedWorkers: assignedWorkersList,
            }
          : t
      );
      onUpdateTypes(updated);
      setEditingId(null);
    } else {
      const newType: WorkerTypeConfig = {
        id: `type-${Date.now()}`,
        name: name.trim(),
        defaultStartTime,
        defaultEndTime,
        defaultBreakHours,
        dailyWage: Number(dailyWage),
        hourlyWage: Number(hourlyWage),
        description: description.trim(),
        insuranceNote: insuranceNote.trim(),
        assignedWorkers: assignedWorkersList,
      };
      onUpdateTypes([...types, newType]);
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string, typeName: string) => {
    if (confirm(`'${typeName}' 인력 유형을 삭제하시겠습니까?`)) {
      onUpdateTypes(types.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28">
      <div className="neu-card p-6 sm:p-8 bg-[#EEF1F8]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/60 gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              기준 정보 관리
            </span>
            <h2 className="text-2xl font-black text-slate-700 tracking-tight mt-0.5">
              인력 유형 및 시급·일당 기준단가
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              학교에서 운영하는 대체인력의 기본 출퇴근 시간, 휴게시간 및 K-에듀파인 품의용 단가를 관리합니다.
            </p>
          </div>

          {!isAdding && !editingId && (
            <button
              onClick={handleStartAdd}
              className="neu-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow self-start sm:self-center"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 인력유형 추가</span>
            </button>
          )}
        </div>

        {/* Add / Edit Form */}
        {(isAdding || editingId) && (
          <form
            onSubmit={handleSave}
            className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8] mb-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-300">
              <h4 className="text-sm font-black text-slate-700">
                {editingId ? '인력 유형 수정' : '새 인력 유형 등록'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  직종명 (예: 급식실 대체인력) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  직무 설명
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="예: 조리실무사 결원 시 조리 및 배식 지원"
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  기본 시작시간
                </label>
                <input
                  type="time"
                  value={defaultStartTime}
                  onChange={(e) => setDefaultStartTime(e.target.value)}
                  className="neu-inset-box w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  기본 종료시간
                </label>
                <input
                  type="time"
                  value={defaultEndTime}
                  onChange={(e) => setDefaultEndTime(e.target.value)}
                  className="neu-inset-box w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  기본 휴게(공제)시간
                </label>
                <select
                  value={defaultBreakHours}
                  onChange={(e) => setDefaultBreakHours(Number(e.target.value))}
                  className="neu-inset-box w-full px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={0}>0시간</option>
                  <option value={0.5}>30분 (0.5h)</option>
                  <option value={1}>1시간 (1.0h)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  시간당 시급 (원)
                </label>
                <input
                  type="number"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Number(e.target.value))}
                  className="neu-inset-box w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>소속/활동 근무자 명단 (모바일 서명 시 원클릭 선택)</span>
                <span className="text-[11px] text-slate-500 font-normal">쉼표(,)로 여러 명 입력 (예: 이지은, 박영희)</span>
              </label>
              <input
                type="text"
                placeholder="예: 이지은, 박영희, 김명순"
                value={assignedWorkersStr}
                onChange={(e) => setAssignedWorkersStr(e.target.value)}
                className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="neu-button px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600"
              >
                취소
              </button>
              <button
                type="submit"
                className="neu-button-primary px-5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                저장하기
              </button>
            </div>
          </form>
        )}

        {/* Types List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((t) => (
            <div
              key={t.id}
              className="neu-inset-bar p-4 rounded-2xl bg-[#EEF1F8] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-slate-800">{t.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-1 rounded-lg text-slate-500 hover:text-blue-600"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">{t.description || '상세 설명 없음'}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                  <div className="neu-button p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">근무 시간</span>
                    <span className="font-bold text-slate-700">
                      {t.defaultStartTime} ~ {t.defaultEndTime} (휴게 {t.defaultBreakHours}h)
                    </span>
                  </div>
                  <div className="neu-button p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">기준 시급</span>
                    <span className="font-extrabold text-emerald-700">
                      {t.hourlyWage.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {t.insuranceNote && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    <span>{t.insuranceNote}</span>
                  </p>
                )}

                {t.assignedWorkers && t.assignedWorkers.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                      모바일 자동선택 인력 ({t.assignedWorkers.length}명):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {t.assignedWorkers.map((w) => (
                        <span
                          key={w}
                          className="px-2 py-0.5 rounded-lg neu-inset-bar text-[11px] font-extrabold text-emerald-800 bg-[#dbe0e7]"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
