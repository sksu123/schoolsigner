import React from 'react';
import { SchoolSettings, WorkRecord } from '../types';
import { Smartphone, PenTool, CheckCircle2 } from 'lucide-react';

interface TopNeumorphicCardProps {
  settings: SchoolSettings;
  records?: WorkRecord[];
}

export const TopNeumorphicCard: React.FC<TopNeumorphicCardProps> = ({ settings }) => {
  const appName = settings.appName || '스쿨사인 365';
  const subTitle = settings.subTitle || '모바일 출근확인서 전자서명 & 학교 근무기록 관리';

  return (
    <div className="w-full max-w-7xl mx-auto mb-5 px-4 pt-4 no-print">
      {/* 
        [헤더 카드] 교육행정 신뢰 디자인 (Soft Surface #EEF1F8 + Royal Navy #2C3E70 + Accent #E4633F)
      */}
      <div className="neu-card-top p-6 sm:p-7 transition-all border border-white/80">
        {/* 학교명 및 기능 뱃지 상단 라인 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#2C3E70] shadow-sm flex items-center gap-1.5">
              <span>🏫</span>
              <span>{settings.schoolName}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#2C3E70] bg-[#DEE5F5] border border-[#2C3E70]/20 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-[#E4633F]" />
              <span>모바일 무설치 QR 서명</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#53607E] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>K-에듀파인 지출품의 연계 지원</span>
          </div>
        </div>

        {/* 
          [제목] 직관적인 앱 명칭 & 모바일 출근확인서 서명 강조 부제목
        */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1B2340] tracking-tight leading-none">
                {appName}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase text-white bg-[#E4633F] shadow-sm">
                Live
              </span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-[#2C3E70] mt-2 tracking-tight flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-[#E4633F]" />
              <span>{subTitle}</span>
            </h2>
          </div>

          {/* 개발자 문구 및 저작권 */}
          <div className="text-right flex-shrink-0 self-end pb-0.5">
            <div className="text-right leading-tight select-none">
              <span className="block text-[11px] font-medium text-[#53607E] tracking-tight">
                전라남도교육청 학교행정실 업무자동화
              </span>
              <span className="block text-[11px] font-normal text-[#7A87A0] mt-0.5 tracking-tight">
                Developed by 신경수(담양남초) · © 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
