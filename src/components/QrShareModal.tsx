import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Printer,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { SchoolSettings } from '../types';

interface QrShareModalProps {
  settings: SchoolSettings;
  onOpenSubmissionPage: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  settings,
  onOpenSubmissionPage,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // 근무자가 스마트폰으로 접속했을 때 즉시 모바일 전자서명 화면이 열리도록 파라미터(?mode=worker) 부여
  const workerSubmissionUrl = (() => {
    if (typeof window === 'undefined') return 'https://example.com/?mode=worker';
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('mode', 'worker');
      return url.toString();
    } catch {
      return `${window.location.href.split('?')[0]}?mode=worker`;
    }
  })();

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    workerSubmissionUrl
  )}&color=0f766e&bgcolor=ffffff&qzone=2`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(workerSubmissionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-28">
      {/* Top Banner (No print) */}
      <div className="neu-card p-6 sm:p-7 bg-[#EEF1F8] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 neu-inset-bar mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            스쿨패스 365 · 출근 안내용 A4 안내장
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight">
            스쿨패스 365 모바일 출근 서명 QR 안내판
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            출입구 또는 근무 현장에 A4로 출력하여 부착해 두시면 대체인력이 스마트폰으로 간편하게 서명합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPoster}
            className="neu-button-primary px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>A4 포스터 인쇄</span>
          </button>
        </div>
      </div>

      {/* URL Copy Box (No print) */}
      <div className="neu-card p-5 bg-[#EEF1F8] mb-6 no-print">
        <label className="block text-xs font-bold text-slate-600 mb-2">
          근무자 접속 링크 주소
        </label>
        <div className="flex items-center gap-2">
          <div className="neu-inset-bar flex-1 px-3.5 py-2 text-xs font-mono text-[#2C3E70] font-semibold truncate bg-white/60">
            {workerSubmissionUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="neu-button px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사됨!' : '링크 복사'}</span>
          </button>
          <button
            onClick={onOpenSubmissionPage}
            className="neu-button px-3.5 py-2 text-xs font-bold text-[#2C3E70] flex items-center gap-1.5 hover:text-[#1B2340]"
            title="근무자 모바일 서명 화면 바로 열기"
          >
            <Smartphone className="w-4 h-4 text-[#E4633F]" />
            <span>서명 화면 열기</span>
          </button>
        </div>
      </div>

      {/* Printable Poster Section */}
      <div className="bg-white rounded-2xl border-4 border-teal-800 p-10 sm:p-14 shadow-lg text-center print-document mx-auto max-w-xl">
        <div className="flex items-center justify-center gap-2 text-teal-800 font-extrabold text-sm mb-4">
          <Building2 className="w-5 h-5" />
          <span>{settings.schoolName}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          스쿨패스 365
        </h1>
        <p className="text-base sm:text-lg font-bold text-slate-700 mb-1">
          단기·대체인력 근무확인서 모바일 전자서명
        </p>
        <p className="text-sm font-semibold text-teal-700 mb-7">
          스마트폰 카메라로 QR코드를 스캔하여 서명해 주세요
        </p>

        {/* QR Code Graphic Box */}
        <div className="inline-block p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-md mb-8">
          <img
            src={qrCodeUrl}
            alt="근무자 모바일 서명 접속 QR코드"
            className="w-56 h-56 mx-auto object-contain"
          />
        </div>

        {/* 3 Step Instruction Guide */}
        <div className="grid grid-cols-3 gap-3 text-left mb-8 max-w-md mx-auto">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold text-xs inline-flex items-center justify-center mb-1">
              1
            </span>
            <p className="text-xs font-bold text-slate-800">QR 스캔</p>
            <p className="text-[10px] text-slate-500 mt-0.5">카메라로 코드 비추기</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold text-xs inline-flex items-center justify-center mb-1">
              2
            </span>
            <p className="text-xs font-bold text-slate-800">시간/성명 입력</p>
            <p className="text-[10px] text-slate-500 mt-0.5">출퇴근 시간 확인</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold text-xs inline-flex items-center justify-center mb-1">
              3
            </span>
            <p className="text-xs font-bold text-slate-800">본인 서명 제출</p>
            <p className="text-[10px] text-slate-500 mt-0.5">손가락으로 서명 날인</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-200 pt-4">
          <p>문의: {settings.schoolName} ({settings.schoolOfficeContact || '061-260-1234'})</p>
        </div>
      </div>
    </div>
  );
};
