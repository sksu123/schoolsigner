import React, { useState, useEffect } from 'react';
import { TopNeumorphicCard } from './components/TopNeumorphicCard';
import { BottomNeumorphicNav, ActiveTab } from './components/BottomNeumorphicNav';
import { AdminRecords } from './components/AdminRecords';
import { RecordModal } from './components/RecordModal';
import { BatchSignModal } from './components/BatchSignModal';
import { WorkerSubmission } from './components/WorkerSubmission';
import { QrShareModal } from './components/QrShareModal';
import { WorkerTypesView } from './components/WorkerTypesView';
import { SettingsView } from './components/SettingsView';
import { PrintAllView } from './components/PrintAllView';
import { EdufineSummaryModal } from './components/EdufineSummaryModal';
import { ApprovalLineModal } from './components/ApprovalLineModal';
import {
  WorkRecord,
  WorkerTypeConfig,
  SchoolSettings,
  ApprovalStep,
} from './types';
import {
  initialWorkRecords,
  initialWorkerTypes,
  initialSchoolSettings,
} from './mockData';
import { LayoutDashboard, Smartphone } from 'lucide-react';

// URL 파라미터(?mode=worker 또는 ?mode=sign 등)를 검사하여 근무자 서명 모드 여부 판별
const checkIsWorkerMode = () => {
  if (typeof window === 'undefined') return false;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const view = searchParams.get('view');
    const isWorker = searchParams.get('worker');
    const hash = (window.location.hash || '').toLowerCase();

    return (
      mode === 'worker' ||
      mode === 'sign' ||
      mode === 'submit' ||
      view === 'worker' ||
      view === 'sign' ||
      isWorker === 'true' ||
      hash.includes('worker') ||
      hash.includes('sign')
    );
  } catch {
    return false;
  }
};

export default function App() {
  // State Initialization from LocalStorage (기본 빈 배열로 시작)
  const [records, setRecords] = useState<WorkRecord[]>(() => {
    const saved = localStorage.getItem('school_records_neu_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [workerTypes, setWorkerTypes] = useState<WorkerTypeConfig[]>(() => {
    const saved = localStorage.getItem('school_types_neu_v2');
    return saved ? JSON.parse(saved) : initialWorkerTypes;
  });

  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('school_settings_neu_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.schoolName === '담양남초등학교' || parsed.schoolName === '전남희망초등학교') {
          parsed.schoolName = '행복초등학교';
          parsed.sealText = '행복초등학교장인';
        }
        return parsed;
      } catch (e) {
        return initialSchoolSettings;
      }
    }
    return initialSchoolSettings;
  });

  // Current view tab
  const [currentTab, setCurrentTab] = useState<ActiveTab>('records');
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => checkIsWorkerMode());
  const [isPrintAllMode, setIsPrintAllMode] = useState<boolean>(false);

  // URL 브라우저 히스토리 및 뒤로가기/앞으로가기 동기화
  useEffect(() => {
    const handleUrlChange = () => {
      setIsMobileMode(checkIsWorkerMode());
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleOpenWorkerMode = () => {
    setIsMobileMode(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'worker');
      window.history.pushState({}, '', url.toString());
    } catch {
      // fallback
    }
  };

  const handleBackToAdmin = () => {
    setIsMobileMode(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('view');
      url.searchParams.delete('worker');
      if (url.hash.includes('worker') || url.hash.includes('sign')) {
        url.hash = '';
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // fallback
    }
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBatchSignOpen, setIsBatchSignOpen] = useState<boolean>(false);
  const [batchSignIds, setBatchSignIds] = useState<string[]>([]);
  const [isEdufineModalOpen, setIsEdufineModalOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  // Synchronize state with localStorage
  useEffect(() => {
    localStorage.setItem('school_records_neu_v3', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('school_types_neu_v2', JSON.stringify(workerTypes));
  }, [workerTypes]);

  useEffect(() => {
    localStorage.setItem('school_settings_neu_v2', JSON.stringify(settings));
  }, [settings]);

  // Add new work record
  const handleAddRecord = (recordData: Partial<WorkRecord>) => {
    const newRecord: WorkRecord = {
      id: `rec-${Date.now()}`,
      workDate: recordData.workDate || new Date().toISOString().slice(0, 10),
      workerType: recordData.workerType || '급식실 대체인력',
      workerName: recordData.workerName || '',
      contact: recordData.contact || '',
      startTime: recordData.startTime || '07:30',
      endTime: recordData.endTime || '15:30',
      breakHours: recordData.breakHours ?? 1,
      workHours: recordData.workHours ?? 7,
      dailyPay: recordData.dailyPay || 78400,
      workerSignature: recordData.workerSignature || '',
      signedAt: recordData.signedAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      verifierName: settings.autoApprove ? settings.adminOfficer : undefined,
      verifierSignature: settings.autoApprove ? undefined : undefined,
      verifiedAt: undefined,
      notes: recordData.notes || '',
    };

    setRecords((prev) => [newRecord, ...prev]);
  };

  // Batch Sign Action
  const handleOpenBatchSign = (selectedIds: string[]) => {
    const idsToSign = selectedIds.length > 0 ? selectedIds : records.map((r) => r.id);
    setBatchSignIds(idsToSign);
    setIsBatchSignOpen(true);
  };

  const handleConfirmBatchSign = (
    targetIds: string[],
    verifierName: string,
    signatureData: string
  ) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRecords((prev) =>
      prev.map((r) => {
        if (targetIds.includes(r.id)) {
          return {
            ...r,
            verifierName,
            verifierSignature: signatureData,
            verifiedAt: nowStr,
          };
        }
        return r;
      })
    );
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Batch Delete Records
  const handleBatchDeleteRecords = (recordIds: string[]) => {
    if (!recordIds || recordIds.length === 0) return;
    if (window.confirm(`선택하신 ${recordIds.length}건의 근무 기록을 삭제하시겠습니까?`)) {
      setRecords((prev) => prev.filter((r) => !recordIds.includes(r.id)));
    }
  };

  // Reset sample data
  const handleSaveApprovalLine = (newLine: ApprovalStep[]) => {
    setSettings((prev) => ({
      ...prev,
      approvalLine: newLine,
    }));
  };

  const handleResetData = () => {
    if (confirm('초기 예시 데이터로 복원하시겠습니까? (현재 데이터는 교체됩니다)')) {
      setRecords(initialWorkRecords);
      setWorkerTypes(initialWorkerTypes);
      setSettings(initialSchoolSettings);
      localStorage.removeItem('school_records_neu_v2');
      localStorage.removeItem('school_types_neu_v2');
      localStorage.removeItem('school_settings_neu_v2');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1B2340] selection:bg-[#DEE5F5] selection:text-[#2C3E70]">
      
      {isMobileMode && (
        <div className="w-full bg-[#EEF1F8] border-b border-[#DCE3F1] px-4 py-2 flex items-center justify-between text-xs no-print shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E4633F] animate-pulse" />
            <span className="font-bold text-[#1B2340]">
              근무자 모바일 출근확인서 & 전자서명 뷰
            </span>
          </div>

          <button
            onClick={handleBackToAdmin}
            className="neu-button px-3.5 py-1.5 text-[#2C3E70] font-bold flex items-center gap-1.5 hover:text-[#1B2340]"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#2C3E70]" />
            <span>행정실 관리자 모드로 복귀</span>
          </button>
        </div>
      )}


      {/* 
        [A4 출근대장 공식 인쇄 모드]
      */}
      {isPrintAllMode ? (
        <div className="pt-6">
          <PrintAllView
            records={records}
            settings={settings}
            onBack={() => setIsPrintAllMode(false)}
          />
        </div>
      ) : isMobileMode ? (
        /* 
          [근무자 모바일 서명 페이지]
        */
        <div className="pt-4">
          <WorkerSubmission
            settings={settings}
            workerTypes={workerTypes}
            records={records}
            onSubmitRecord={handleAddRecord}
            onBackToAdmin={handleBackToAdmin}
          />
        </div>
      ) : (
        /* 
          [행정실 관리자 대시보드 메인 레이아웃]
        */
        <div>
          {/* 
            [장식] 상단 카드 (바깥+안쪽 그림자 뉴모피즘), [제목] 카드 내·회색·대형 2줄, [본문] 안쪽 그림자 막대
          */}
          <TopNeumorphicCard
            settings={settings}
            records={records}
          />

          {/* 중앙 메인 뷰 컨텐츠 */}
          <main>
            {currentTab === 'records' && (
              <AdminRecords
                records={records}
                workerTypes={workerTypes}
                settings={settings}
                onAddRecord={() => setIsAddModalOpen(true)}
                onBatchSign={handleOpenBatchSign}
                onDeleteRecord={handleDeleteRecord}
                onBatchDelete={handleBatchDeleteRecords}
                onPrintAll={() => setIsPrintAllMode(true)}
                onOpenEdufineSummary={() => setIsEdufineModalOpen(true)}
              />
            )}

            {currentTab === 'workerTypes' && (
              <WorkerTypesView
                types={workerTypes}
                onUpdateTypes={setWorkerTypes}
              />
            )}

            {currentTab === 'qr' && (
              <QrShareModal
                settings={settings}
                onOpenSubmissionPage={handleOpenWorkerMode}
              />
            )}


            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={setSettings}
                onResetData={handleResetData}
                records={records}
                onImportRecords={setRecords}
                onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
              />
            )}
          </main>

          {/* 
            [하단 원형+막대 뉴모피즘 UI] 컨트롤러
          */}
          <BottomNeumorphicNav
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            onOpenEdufineModal={() => setIsEdufineModalOpen(true)}
          />
        </div>
      )}

      {/* 
        [모달 다이얼로그 모음]
      */}

      {/* 1. 누락 기록 추가 모달 */}
      <RecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddRecord}
        workerTypes={workerTypes}
        settings={settings}
      />

      {/* 2. 기간 일괄 확인 서명 모달 */}
      <BatchSignModal
        isOpen={isBatchSignOpen}
        onClose={() => setIsBatchSignOpen(false)}
        recordIds={batchSignIds}
        records={records}
        settings={settings}
        onConfirm={handleConfirmBatchSign}
      />

      {/* 3. K-에듀파인 지출품의 연계 요약기 모달 */}
      {isEdufineModalOpen && (
        <EdufineSummaryModal
          records={records}
          settings={settings}
          onClose={() => setIsEdufineModalOpen(false)}
        />
      )}

      {/* 5. 결재라인(실장/교감/전결/대결) 관리 모달 */}
      <ApprovalLineModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        settings={settings}
        onSaveApprovalLine={handleSaveApprovalLine}
      />
    </div>
  );
}
