import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ApprovalStep, ApprovalType, SchoolSettings } from '../types';
import { defaultApprovalLine } from '../mockData';

interface ApprovalLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onSaveApprovalLine: (newLine: ApprovalStep[]) => void;
}

export const ApprovalLineModal: React.FC<ApprovalLineModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveApprovalLine,
}) => {
  if (!isOpen) return null;

  const initialLine: ApprovalStep[] =
    settings.approvalLine && settings.approvalLine.length > 0
      ? JSON.parse(JSON.stringify(settings.approvalLine))
      : JSON.parse(JSON.stringify(defaultApprovalLine));

  const [steps, setSteps] = useState<ApprovalStep[]>(initialLine);

  // Common Presets
  const applyPreset = (presetType: string) => {
    const chief = settings.adminOfficeChief || '박행정';
    const officer = settings.adminOfficer || '김주무';
    const vice = settings.vicePrincipalName || '정교감';
    const principal = settings.principalName || '이빛나';

    if (presetType === 'standard_chief') {
      // 담당 - 실장 - 학교장
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '실장', approverName: chief.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-3`, roleName: '학교장', approverName: principal.split(' ')[0], approvalType: '일반' },
      ]);
    } else if (presetType === 'vice_principal') {
      // 담당 - 교감 - 학교장
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '교감', approverName: vice.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-3`, roleName: '학교장', approverName: principal.split(' ')[0], approvalType: '일반' },
      ]);
    } else if (presetType === 'four_steps') {
      // 담당 - 실장 - 교감 - 학교장
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '실장', approverName: chief.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-3`, roleName: '교감', approverName: vice.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-4`, roleName: '학교장', approverName: principal.split(' ')[0], approvalType: '일반' },
      ]);
    } else if (presetType === 'chief_jeongyeol') {
      // 담당 - 실장 (전결)
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '실장', approverName: chief.split(' ')[0], approvalType: '전결' },
      ]);
    } else if (presetType === 'vice_jeongyeol') {
      // 담당 - 교감 (전결)
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '교감', approverName: vice.split(' ')[0], approvalType: '전결' },
      ]);
    } else if (presetType === 'vice_daegyeol') {
      // 담당 - 교감 (대결)
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '교감', approverName: vice.split(' ')[0], approvalType: '대결' },
      ]);
    } else if (presetType === 'chief_daegyeol') {
      // 담당 - 실장 (대결)
      setSteps([
        { id: `step-${Date.now()}-1`, roleName: '담당', approverName: officer.split(' ')[0], approvalType: '일반' },
        { id: `step-${Date.now()}-2`, roleName: '실장', approverName: chief.split(' ')[0], approvalType: '대결' },
      ]);
    }
  };

  const handleStepChange = (
    index: number,
    field: 'roleName' | 'approverName' | 'approvalType',
    value: string
  ) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSteps(updated);
  };

  const handleAddStep = () => {
    if (steps.length >= 5) {
      alert('결재라인은 최대 5단계까지 등록할 수 있습니다.');
      return;
    }
    const newStep: ApprovalStep = {
      id: `step-${Date.now()}`,
      roleName: '교감',
      approverName: (settings.vicePrincipalName || '교감').split(' ')[0],
      approvalType: '일반',
    };
    setSteps([...steps, newStep]);
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 1) {
      alert('결재라인은 최소 1단계(담당자) 이상이어야 합니다.');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // 직위/단계명만 검증 (수기 서명이므로 성명 불필요)
    for (const step of steps) {
      if (!step.roleName.trim()) {
        alert('모든 결재 단계의 직위/단계명을 입력해주세요.');
        return;
      }
    }
    onSaveApprovalLine(steps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="neu-card w-full max-w-2xl max-h-[92vh] flex flex-col p-6 sm:p-7 bg-[#EEF1F8] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-inset-bar flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-700 tracking-tight">
                결재라인 설정 및 대결·전결 관리
              </h3>
              <p className="text-xs text-slate-500">
                학교별 사무위임전결 규정에 맞게 [교감/실장/부장] 결재선 및 전결·대결을 지정합니다.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* 1. 빠른 결재선 프리셋 버튼 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              자주 쓰는 학교 결재선 빠른 적용
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('standard_chief')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                담당 - 실장 - 학교장 (표준)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('vice_principal')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                담당 - 교감 - 학교장
              </button>
              <button
                type="button"
                onClick={() => applyPreset('four_steps')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                담당 - 실장 - 교감 - 학교장 (4단)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('chief_jeongyeol')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                실장/부장 (전결)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('vice_jeongyeol')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                교감 (전결)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('vice_daegyeol')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 hover:text-amber-900"
              >
                교감 (대결)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('chief_daegyeol')}
                className="neu-button px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-900"
              >
                실장/부장 (대결)
              </button>
            </div>
          </div>

          {/* 2. 결재 단계 리스트 (직위명, 성명, 구분) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  결재 단계별 직위/단계 구성 ({steps.length}단계)
                </label>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="neu-button px-3 py-1 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  단계 추가
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                ※ 결재는 수기 서명(날인)을 받으므로 결재란에는 직위/단계명만 인쇄되며 서명 칸은 수기 서명용 공란으로 출력됩니다.
              </p>
            </div>

            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="neu-inset-bar p-3.5 rounded-2xl bg-[#EEF1F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="w-6 h-6 rounded-full neu-button text-xs font-black text-slate-600 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* 직위/단계명 입력 */}
                    <div className="flex-1 sm:w-48">
                      <input
                        type="text"
                        value={step.roleName}
                        onChange={(e) => handleStepChange(idx, 'roleName', e.target.value)}
                        placeholder="직위/단계명 (예: 담당, 실장, 교감, 학교장)"
                        className="neu-inset-box w-full px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* 결재 구분: 일반 / 전결 / 대결 토글 */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <div className="neu-inset-bar p-1 rounded-xl flex items-center gap-1 bg-[#EEF1F8]">
                      <button
                        type="button"
                        onClick={() => handleStepChange(idx, 'approvalType', '일반')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          step.approvalType === '일반'
                            ? 'neu-button text-slate-800 font-extrabold bg-[#dbe0e7]'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        일반
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepChange(idx, 'approvalType', '전결')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          step.approvalType === '전결'
                            ? 'neu-button text-emerald-800 font-extrabold bg-[#dbe0e7]'
                            : 'text-slate-500 hover:text-emerald-700'
                        }`}
                        title="사무위임전결 규정에 따라 이 단계에서 최종 결재"
                      >
                        전결 (專決)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepChange(idx, 'approvalType', '대결')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          step.approvalType === '대결'
                            ? 'neu-button text-amber-800 font-extrabold bg-[#dbe0e7]'
                            : 'text-slate-500 hover:text-amber-700'
                        }`}
                        title="학교장 부재/출장 시 대리 결재"
                      >
                        대결 (代決)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStep(idx)}
                      disabled={steps.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="단계 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 인쇄 시 나타날 공식 결재란 실시간 미리보기 (Live Preview) */}
          <div className="neu-card p-4 rounded-2xl bg-[#EEF1F8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                출근대장 인쇄 결재란 실시간 미리보기
              </span>
              <span className="text-[10px] text-slate-400">A4 인쇄 시 상단에 표시되는 모양</span>
            </div>

            <div className="p-3 bg-white rounded-xl shadow-inner flex justify-center">
              <table className="border-collapse border border-slate-700 text-xs text-center">
                <tbody>
                  <tr>
                    <th
                      rowSpan={2}
                      className="border border-slate-700 bg-slate-100 w-8 font-bold py-1 text-slate-800 leading-tight"
                    >
                      결<br />재
                    </th>
                    {steps.map((st) => (
                      <th
                        key={st.id}
                        className="border border-slate-700 bg-slate-50 py-1 px-3 font-semibold min-w-[70px] text-[11px]"
                      >
                        {st.roleName}
                        {st.approvalType !== '일반' && (
                          <span className={`block text-[10px] font-bold ${
                            st.approvalType === '전결' ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            ({st.approvalType})
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  <tr className="h-12">
                    {steps.map((st) => (
                      <td
                        key={st.id}
                        className="border border-slate-700 align-bottom p-1 text-[10px] text-slate-500 font-medium"
                      >
                        {st.approverName && st.approverName !== '서명' ? st.approverName.replace(/서명/g, '').trim() : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                전결(專決) 설정 시 해당 직위가 최종 결재권자로 처리되며, 대결(代決) 설정 시 결재란에 (대결) 문구가 명시되어 교육청 감사 및 공문 규정을 준수합니다.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="neu-button px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="neu-button-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Check className="w-3.5 h-3.5" />
            결재라인 저장 적용
          </button>
        </div>
      </div>
    </div>
  );
};
