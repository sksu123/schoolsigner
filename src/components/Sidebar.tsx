import React from 'react';
import {
  ClipboardList,
  Users,
  QrCode,
  Settings,
  Code2,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { SchoolSettings } from '../types';

export type TabType = 'records' | 'types' | 'submission_link' | 'settings' | 'gas_export';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  settings: SchoolSettings;
  recordCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  recordCount,
}) => {
  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen no-print select-none">
      <div>
        {/* Logo and Brand matching the image */}
        <div className="p-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2e6b56] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[17px] tracking-tight text-slate-900">
                학교근무<span className="text-[#2e6b56]">ON</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">관리 시스템</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1.5 pt-2">
          {/* 1. 근무기록 */}
          <button
            onClick={() => onSelectTab('records')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-[13.5px] transition-all flex items-center justify-between ${
              currentTab === 'records'
                ? 'bg-[#1e2329] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 opacity-90" />
              <span>근무기록</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                currentTab === 'records'
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {recordCount}
            </span>
          </button>

          {/* 2. 인력 유형 */}
          <button
            onClick={() => onSelectTab('types')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-[13.5px] transition-all flex items-center gap-2.5 ${
              currentTab === 'types'
                ? 'bg-[#1e2329] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 opacity-90" />
            <span>인력 유형</span>
          </button>

          {/* 3. 제출 링크 */}
          <button
            onClick={() => onSelectTab('submission_link')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-[13.5px] transition-all flex items-center gap-2.5 ${
              currentTab === 'submission_link'
                ? 'bg-[#1e2329] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4 opacity-90" />
            <span>제출 링크 (QR)</span>
          </button>

          {/* 4. 설정 */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-[13.5px] transition-all flex items-center gap-2.5 ${
              currentTab === 'settings'
                ? 'bg-[#1e2329] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 opacity-90" />
            <span>설정</span>
          </button>

          <div className="pt-3 pb-1">
            <div className="border-t border-slate-100 my-2" />
          </div>

          {/* 5. Google Apps Script / Code.gs 연동 허브 */}
          <button
            onClick={() => onSelectTab('gas_export')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-[12.5px] transition-all flex items-center gap-2 border ${
              currentTab === 'gas_export'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-emerald-50/40 hover:border-emerald-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 truncate">
              <span className="block leading-tight">Code.gs & 시트</span>
              <span className="text-[10px] text-slate-400 font-normal">구글 무료 연동 코드</span>
            </div>
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{settings.schoolName}</span>
        </div>
        <div className="text-[11px] text-slate-500 flex justify-between">
          <span>{settings.adminOfficer || '담당자'}</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            정상 작동
          </span>
        </div>
      </div>
    </aside>
  );
};
