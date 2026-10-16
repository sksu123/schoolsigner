import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  Link,
  Save,
  CheckCircle2,
  Download,
  Upload,
  Phone,
  Sparkles,
  Smartphone,
  Palette,
  PenTool,
  Code2,
  Copy,
  FileCode,
} from 'lucide-react';
import { SchoolSettings, WorkRecord } from '../types';
import { generateCodeGs, generateIndexHtml } from '../gasCodeGenerator';

interface SettingsViewProps {
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onResetData: () => void;
  records: WorkRecord[];
  onImportRecords: (records: WorkRecord[]) => void;
  onOpenApprovalModal?: () => void;
}

const TITLE_RECOMMENDATIONS = [
  {
    title: '스쿨사인 365',
    subTitle: '모바일 출근확인서 & 전자서명 자동화 시스템',
    badge: '추천 1위',
    desc: '가장 직관적이고 기억하기 쉬움 (School + Sign)',
  },
  {
    title: '바로사인 학교출근부',
    subTitle: '스마트폰 무설치 원클릭 출근확인서 & 전자서명',
    badge: '추천 2위',
    desc: '도착하자마자 폰으로 바로 서명하는 신속성 강조',
  },
  {
    title: '스쿨출근패스',
    subTitle: '모바일 전자서명 출근확인서 & K-에듀파인 품의 연계',
    badge: '추천 3위',
    desc: '기존 친숙함에 출근 확인서 기능 직관적 결합',
  },
  {
    title: '출근체크 모바일사인',
    subTitle: '학교 대체인력 근무확인서 모바일 간편서명 시스템',
    badge: '실무형',
    desc: '출근체크 및 전자서명 기능을 그대로 표현',
  },
  {
    title: '에듀사인 365',
    subTitle: '교육기관 대체인력 모바일 전자서명 & 근무기록 자동화',
    badge: '공공기관형',
    desc: '교육청 및 각급 학교 표준 플랫폼 느낌의 정갈한 명칭',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  records,
  onImportRecords,
  onOpenApprovalModal,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({
    ...settings,
    appName: settings.appName || '스쿨사인 365',
    subTitle: settings.subTitle || '모바일 출근확인서 & 전자서명 자동화 시스템',
  });
  const [saved, setSaved] = useState(false);
  const [copiedCodeGs, setCopiedCodeGs] = useState(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<'none' | 'codeGs' | 'indexHtml'>('none');

  const handleCopyCodeGs = () => {
    const code = generateCodeGs(formData.schoolName);
    navigator.clipboard.writeText(code);
    setCopiedCodeGs(true);
    setTimeout(() => setCopiedCodeGs(false), 2500);
  };

  const handleCopyIndexHtml = () => {
    const code = generateIndexHtml(formData.schoolName);
    navigator.clipboard.writeText(code);
    setCopiedIndexHtml(true);
    setTimeout(() => setCopiedIndexHtml(false), 2500);
  };

  const handleDownloadCodeGs = () => {
    const code = generateCodeGs(formData.schoolName);
    const blob = new Blob([code], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadIndexHtml = () => {
    const code = generateIndexHtml(formData.schoolName);
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleApplyTitlePreset = (item: typeof TITLE_RECOMMENDATIONS[0]) => {
    setFormData({
      ...formData,
      appName: item.title,
      subTitle: item.subTitle,
    });
  };

  const handleBackupExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ settings: formData, records }, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `[학교출결_백업]_${formData.schoolName}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) onUpdateSettings(parsed.settings);
        if (parsed.records) onImportRecords(parsed.records);
        alert('백업 데이터가 성공적으로 복원되었습니다.');
      } catch {
        alert('올바른 백업 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-28">
      <div className="neu-card p-6 sm:p-8 bg-[#EEF1F8]">
        {/* Header */}
        <div className="pb-5 border-b border-white/60 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#53607E] uppercase tracking-wider">
              학교 및 시스템 설정
            </span>
            <h2 className="text-2xl font-black text-[#1B2340] tracking-tight mt-0.5">
              학교 정보 & 앱 환경설정
            </h2>
            <p className="text-xs text-[#53607E] mt-1">
              앱 제목, 모바일 출근확인서 강조 문구, 출근대장 결재선 및 Google Apps Script 연동을 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#2C3E70] shadow-sm">
              {formData.schoolName}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. 앱 제목 및 모바일 출근확인서 서명 강조 설정 (사용자 요청 반영) */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-[#1B2340] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E4633F]" />
                앱 명칭 & 모바일 출근확인서 기능 강조 제목
              </h3>
              <span className="text-[11px] font-bold text-[#E4633F] bg-[#FFEFEA] px-2.5 py-0.5 rounded-full border border-[#E4633F]/20">
                실시간 적용
              </span>
            </div>

            <p className="text-xs text-[#53607E] mb-3">
              '스쿨패스 365' 대신 모바일 출근확인서 및 전자서명 기능을 직관적으로 알 수 있는 추천 제목 중 하나를 클릭하거나 원하는 명칭으로 직접 변경할 수 있습니다.
            </p>

            {/* 추천 제목 5선 퀵 셀렉터 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
              {TITLE_RECOMMENDATIONS.map((rec) => {
                const isSelected = formData.appName === rec.title;
                return (
                  <button
                    key={rec.title}
                    type="button"
                    onClick={() => handleApplyTitlePreset(rec)}
                    className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'neu-inset-bar border-2 border-[#2C3E70] bg-[#DEE5F5]'
                        : 'neu-button hover:border-[#2C3E70]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#1B2340] flex items-center gap-1">
                        <PenTool className="w-3 h-3 text-[#E4633F]" />
                        {rec.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        rec.badge.includes('1위') ? 'bg-[#E4633F] text-white' : 'bg-[#2C3E70] text-white'
                      }`}>
                        {rec.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#53607E] leading-tight line-clamp-1 mb-1">
                      {rec.desc}
                    </p>
                    <span className="text-[10px] font-medium text-[#2C3E70] line-clamp-1">
                      {rec.subTitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 직접 입력란 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/60">
              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  앱 메인 제목
                </label>
                <input
                  type="text"
                  required
                  value={formData.appName || ''}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  placeholder="예: 스쿨사인 365"
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1B2340] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  앱 부제목 (모바일 출근확인서 강조 슬로건)
                </label>
                <input
                  type="text"
                  value={formData.subTitle || ''}
                  onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                  placeholder="예: 모바일 출근확인서 & 전자서명 자동화 시스템"
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-[#2C3E70] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. 학교 기본정보 */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <h3 className="text-sm font-black text-[#1B2340] mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2C3E70]" />
              학교 기본 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  학교명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-bold text-[#1B2340] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#53607E]" />
                  대표 연락처 (문의처)
                </label>
                <input
                  type="text"
                  value={formData.schoolOfficeContact || ''}
                  onChange={(e) => setFormData({ ...formData, schoolOfficeContact: e.target.value })}
                  placeholder="061-000-0000"
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-[#1B2340] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. 결재라인 */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <h3 className="text-sm font-black text-[#1B2340] mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#2C3E70]" />
              공식 결재선 정보 (출근대장 3단 결재란)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  행정담당자 (작성/확인자)
                </label>
                <input
                  type="text"
                  value={formData.adminOfficer}
                  onChange={(e) => setFormData({ ...formData, adminOfficer: e.target.value })}
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-[#1B2340] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  행정실장 (검토자)
                </label>
                <input
                  type="text"
                  value={formData.adminOfficeChief}
                  onChange={(e) => setFormData({ ...formData, adminOfficeChief: e.target.value })}
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-[#1B2340] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2340] mb-1">
                  학교장 (최종결재자)
                </label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-medium text-[#1B2340] outline-none"
                />
              </div>
            </div>

            {onOpenApprovalModal && (
              <div className="mt-3.5 pt-3 border-t border-slate-300/50 flex items-center justify-between">
                <span className="text-xs text-[#53607E]">
                  사무위임전결 규정에 따른 [전결·대결·결재선 단계] 변경
                </span>
                <button
                  type="button"
                  onClick={onOpenApprovalModal}
                  className="neu-button px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2C3E70] flex items-center gap-1.5"
                >
                  결재라인 세부 편집 (전결·대결)
                </button>
              </div>
            )}
          </div>

          {/* 4. 적용된 디자인 컬러 시스템 카드 */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <h3 className="text-sm font-black text-[#1B2340] mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#E4633F]" />
              교육행정 신뢰 디자인 컬러 시스템
            </h3>
            <p className="text-[11px] text-[#53607E] mb-3">
              사용자 지정 CSS 컬러 변수가 전역에 완벽히 적용되었습니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-white p-2 rounded-xl border border-[#DCE3F1] shadow-xs text-center">
                <div className="w-full h-6 rounded-lg bg-[#FFFFFF] border border-slate-300 mb-1" />
                <span className="block text-[11px] font-bold text-[#1B2340]">--color-bg</span>
                <span className="block text-[10px] text-[#53607E]">#FFFFFF</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#DCE3F1] shadow-xs text-center">
                <div className="w-full h-6 rounded-lg bg-[#EEF1F8] border border-slate-300 mb-1" />
                <span className="block text-[11px] font-bold text-[#1B2340]">--color-surface</span>
                <span className="block text-[10px] text-[#53607E]">#EEF1F8</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#DCE3F1] shadow-xs text-center">
                <div className="w-full h-6 rounded-lg bg-[#1B2340] mb-1" />
                <span className="block text-[11px] font-bold text-[#1B2340]">--color-text</span>
                <span className="block text-[10px] text-[#53607E]">#1B2340</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#DCE3F1] shadow-xs text-center">
                <div className="w-full h-6 rounded-lg bg-[#2C3E70] mb-1" />
                <span className="block text-[11px] font-bold text-[#1B2340]">--color-primary</span>
                <span className="block text-[10px] text-[#53607E]">#2C3E70</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#DCE3F1] shadow-xs text-center">
                <div className="w-full h-6 rounded-lg bg-[#E4633F] mb-1" />
                <span className="block text-[11px] font-bold text-[#1B2340]">--color-accent</span>
                <span className="block text-[10px] text-[#53607E]">#E4633F</span>
              </div>
            </div>
          </div>

          {/* 5. Google Apps Script 연동 URL */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <h3 className="text-sm font-black text-[#1B2340] mb-2 flex items-center gap-2">
              <Link className="w-4 h-4 text-[#2C3E70]" />
              Google Apps Script 웹앱 배포 URL (선택)
            </h3>
            <p className="text-[11px] text-[#53607E] mb-3">
              구글 드라이브 스프레드시트에서 배포한 Apps Script 웹앱 URL을 입력하시면 실시간 시트 양방향 동기화가 활성화됩니다.
            </p>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={formData.gasApiUrl}
              onChange={(e) => setFormData({ ...formData, gasApiUrl: e.target.value })}
              className="neu-inset-box w-full px-3 py-2 rounded-xl text-xs font-mono text-[#1B2340] outline-none"
            />
          </div>

          {/* 6. Code.gs & index.html 원클릭 복사 및 배포 파일 다운로드 */}
          <div className="neu-inset-bar p-5 rounded-2xl bg-[#EEF1F8]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-[#1B2340] flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#2C3E70]" />
                Google Apps Script & 단일 HTML 배포 소스코드
              </h3>
              <span className="text-[11px] font-bold text-[#E4633F] px-2.5 py-0.5 rounded-full bg-[#FFEFEA] border border-[#FCD9CF]">
                원클릭 복사 지원
              </span>
            </div>
            <p className="text-[11px] text-[#53607E] mb-4">
              구글 스프레드시트 [확장 프로그램] → [Apps Script]에 붙여넣을 <strong>Code.gs</strong> 및 <strong>index.html</strong> 최신 코드입니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Code.gs 카드 */}
              <div className="bg-white p-4 rounded-xl border border-[#DCE3F1] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[#2C3E70] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[#2C3E70]" />
                      Code.gs (Apps Script 백엔드)
                    </span>
                    <span className="text-[10px] text-[#53607E] font-mono">gs</span>
                  </div>
                  <p className="text-[11px] text-[#53607E] mb-3">
                    스프레드시트 자동 시트 생성, 모바일 서명 doGet/doPost 수신 및 결재 데이터 관리
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCopyCodeGs}
                    className="flex-1 neu-button py-2 rounded-lg text-xs font-bold text-[#2C3E70] flex items-center justify-center gap-1.5"
                  >
                    {copiedCodeGs ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#2C3E70]" />
                        <span>Code.gs 복사</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodeGs}
                    className="neu-button px-3 py-2 rounded-lg text-xs font-bold text-[#53607E] hover:text-[#1B2340] flex items-center gap-1"
                    title="Code.gs 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodePreview(activeCodePreview === 'codeGs' ? 'none' : 'codeGs')}
                    className="neu-button px-2.5 py-2 rounded-lg text-[11px] font-bold text-[#53607E]"
                  >
                    {activeCodePreview === 'codeGs' ? '닫기' : '보기'}
                  </button>
                </div>
              </div>

              {/* index.html 카드 */}
              <div className="bg-white p-4 rounded-xl border border-[#DCE3F1] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[#E4633F] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[#E4633F]" />
                      index.html (웹앱 프론트엔드)
                    </span>
                    <span className="text-[10px] text-[#53607E] font-mono">html</span>
                  </div>
                  <p className="text-[11px] text-[#53607E] mb-3">
                    모바일 서명, QR인식 및 결재 서식 일체 포함 단일 HTML 웹 애플리케이션
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCopyIndexHtml}
                    className="flex-1 neu-button py-2 rounded-lg text-xs font-bold text-[#E4633F] flex items-center justify-center gap-1.5"
                  >
                    {copiedIndexHtml ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#E4633F]" />
                        <span>index.html 복사</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIndexHtml}
                    className="neu-button px-3 py-2 rounded-lg text-xs font-bold text-[#53607E] hover:text-[#1B2340] flex items-center gap-1"
                    title="index.html 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodePreview(activeCodePreview === 'indexHtml' ? 'none' : 'indexHtml')}
                    className="neu-button px-2.5 py-2 rounded-lg text-[11px] font-bold text-[#53607E]"
                  >
                    {activeCodePreview === 'indexHtml' ? '닫기' : '보기'}
                  </button>
                </div>
              </div>
            </div>

            {/* 코드 미리보기 창 */}
            {activeCodePreview !== 'none' && (
              <div className="mt-3 p-3 bg-[#1B2340] text-slate-100 rounded-xl font-mono text-xs max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                  <span className="font-bold text-amber-400">
                    {activeCodePreview === 'codeGs' ? 'Code.gs 소스코드' : 'index.html 소스코드'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCodePreview('none')}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕ 닫기
                  </button>
                </div>
                <pre className="whitespace-pre-wrap select-all text-[11px] leading-relaxed">
                  {activeCodePreview === 'codeGs'
                    ? generateCodeGs(formData.schoolName)
                    : generateIndexHtml(formData.schoolName)}
                </pre>
              </div>
            )}
          </div>

          {/* 저장 버튼 & 백업 */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackupExport}
                className="neu-button px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B2340] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#2C3E70]" />
                전체 백업 다운로드
              </button>
              <label className="neu-button px-3.5 py-2 rounded-xl text-xs font-bold text-[#1B2340] flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#2C3E70]" />
                백업 복원
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImport}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="neu-button-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? '설정 저장 완료!' : '설정 저장하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
