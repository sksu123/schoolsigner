import React, { useState } from 'react';
import { X, ShieldCheck, PenTool, Edit3 } from 'lucide-react';
import { SchoolSettings, WorkRecord } from '../types';
import { SignaturePad } from './SignaturePad';

interface BatchSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIds: string[];
  records: WorkRecord[];
  settings: SchoolSettings;
  onConfirm: (recordIds: string[], verifierName: string, signatureData: string) => void;
}

export const BatchSignModal: React.FC<BatchSignModalProps> = ({
  isOpen,
  onClose,
  recordIds,
  records,
  settings,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const targetRecords = records.filter((r) => recordIds.includes(r.id));
  const [verifierName, setVerifierName] = useState<string>(
    settings.adminOfficer || settings.adminOfficeChief || '김주무 (교육행정주무관)'
  );
  const [signatureData, setSignatureData] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierName.trim()) {
      alert('확인자(담당자) 성명을 입력해주세요.');
      return;
    }
    if (!signatureData) {
      alert('서명 패드에 직접 서명을 입력해주세요.');
      return;
    }

    onConfirm(recordIds, verifierName.trim(), signatureData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="neu-card rounded-2xl max-w-md w-full bg-[#EEF1F8] p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl neu-inset-bar flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-700">기간 일괄 확인 서명</h3>
              <p className="text-xs text-slate-500">담당 확인자 직접 서명 날인</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-circle-btn w-8 h-8 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="neu-inset-bar p-3.5 rounded-xl text-xs text-slate-600">
            <span className="font-bold text-slate-800">날인 대상: </span>
            <span className="text-blue-700 font-extrabold">{targetRecords.length}건</span>의 근무기록에 확인자 직접 서명을 일괄 반영합니다.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              확인자 직급 및 성명
            </label>
            <input
              type="text"
              required
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
              className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>

          {/* 직접 서명 전용 패드 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                확인자 직접 전자서명 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">마우스 또는 터치펜 서명</span>
            </div>

            <SignaturePad
              height={140}
              onSave={(data) => setSignatureData(data)}
              initialData={signatureData}
            />
          </div>

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
              <PenTool className="w-3.5 h-3.5" />
              {targetRecords.length}건 일괄 서명 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
