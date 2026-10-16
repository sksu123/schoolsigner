import React from 'react';
import {
  FileText,
  QrCode,
  Users,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'records' | 'edufine' | 'workerTypes' | 'qr' | 'settings';

interface BottomNeumorphicNavProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenEdufineModal: () => void;
}

export const BottomNeumorphicNav: React.FC<BottomNeumorphicNavProps> = ({
  currentTab,
  onTabChange,
  onOpenEdufineModal,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none no-print">
      <div className="max-w-4xl mx-auto flex items-center justify-center pointer-events-auto">
        
        {/* 
          [하단 컨트롤러 바] 교육행정 네이비/코랄 테마 (#EEF1F8, #2C3E70, #E4633F)
        */}
        <div className="neu-bottom-bar px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 shadow-2xl bg-[#EEF1F8]/95 backdrop-blur-md overflow-x-auto max-w-full border border-white/80">
          <button
            onClick={() => onTabChange('records')}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'records'
                ? 'neu-inset-bar text-[#2C3E70] bg-[#DEE5F5] font-black'
                : 'neu-button text-[#53607E] hover:text-[#1B2340]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#2C3E70]" />
            근무기록 대장
          </button>

          <button
            onClick={() => {
              onTabChange('edufine');
              onOpenEdufineModal();
            }}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'edufine'
                ? 'neu-inset-bar text-[#E4633F] bg-[#FFEFEA] font-black'
                : 'neu-button text-[#E4633F] hover:text-[#C54826]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#E4633F] animate-pulse" />
            에듀파인 품의서
          </button>

          <button
            onClick={() => onTabChange('workerTypes')}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'workerTypes'
                ? 'neu-inset-bar text-[#2C3E70] bg-[#DEE5F5] font-black'
                : 'neu-button text-[#53607E] hover:text-[#1B2340]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#2C3E70]" />
            인력유형·단가
          </button>

          <button
            onClick={() => onTabChange('qr')}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'qr'
                ? 'neu-inset-bar text-[#2C3E70] bg-[#DEE5F5] font-black'
                : 'neu-button text-[#53607E] hover:text-[#1B2340]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#E4633F]" />
            비치용 QR
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'settings'
                ? 'neu-inset-bar text-[#2C3E70] bg-[#DEE5F5] font-black'
                : 'neu-button text-[#53607E] hover:text-[#1B2340]'
            }`}
            title="학교 및 직인 설정"
          >
            <Settings className="w-3.5 h-3.5 text-[#53607E]" />
            설정
          </button>
        </div>

      </div>
    </div>
  );
};
