import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  PenLine,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { WorkRecord, WorkerTypeConfig, SchoolSettings } from '../types';
import { formatKoreanDate } from '../utils/dateFormatter';

interface AdminRecordsProps {
  records: WorkRecord[];
  workerTypes: WorkerTypeConfig[];
  settings: SchoolSettings;
  onAddRecord: () => void;
  onBatchSign: (recordIds: string[]) => void;
  onDeleteRecord: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onPrintAll: () => void;
  onOpenEdufineSummary?: () => void;
}

export const AdminRecords: React.FC<AdminRecordsProps> = ({
  records,
  workerTypes,
  settings,
  onAddRecord,
  onBatchSign,
  onDeleteRecord,
  onBatchDelete,
  onPrintAll,
  onOpenEdufineSummary,
}) => {
  // Filter States
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    type: '전체',
    preset: 'all',
    start: '',
    end: '',
    name: '',
  });

  // Checkbox selection for batch actions
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Handle Preset Clicks
  const handlePreset = (preset: 'all' | 'thisMonth' | 'lastMonth') => {
    setPeriodPreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'thisMonth') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${lastDay}`);
    } else if (preset === 'lastMonth') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastM.getFullYear();
      const lastMonth = String(lastM.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, lastM.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${lastMonth}-01`);
      setEndDate(`${year}-${lastMonth}-${lastDay}`);
    }
  };

  const handleSearch = () => {
    setAppliedFilters({
      type: selectedType,
      preset: periodPreset,
      start: startDate,
      end: endDate,
      name: searchName.trim(),
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedType('전체');
    setPeriodPreset('all');
    setStartDate('');
    setEndDate('');
    setSearchName('');
    setAppliedFilters({
      type: '전체',
      preset: 'all',
      start: '',
      end: '',
      name: '',
    });
    setCurrentPage(1);
    setSelectedRecordIds([]);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type filter
      if (appliedFilters.type !== '전체' && r.workerType !== appliedFilters.type) {
        return false;
      }
      // Date filter
      if (appliedFilters.start && r.workDate < appliedFilters.start) {
        return false;
      }
      if (appliedFilters.end && r.workDate > appliedFilters.end) {
        return false;
      }
      // Name filter
      if (appliedFilters.name && !r.workerName.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [records, appliedFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedRecordIds.length === currentRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(currentRecords.map((r) => r.id));
    }
  };

  const toggleSelectRecord = (id: string) => {
    if (selectedRecordIds.includes(id)) {
      setSelectedRecordIds(selectedRecordIds.filter((item) => item !== id));
    } else {
      setSelectedRecordIds([...selectedRecordIds, id]);
    }
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCsv = () => {
    let csv = '\uFEFF';
    csv += '순번,근무일자,인력유형,근무자성명,연락처,근무시간,인정시간,일당금액,근무자서명여부,확인자서명여부,확인자성명,비고\n';
    filteredRecords.forEach((r, idx) => {
      const workerSigned = r.workerSignature ? '서명완료' : '미서명';
      const verifierSigned = r.verifierSignature ? '확인완료' : '미확인';
      csv += `"${idx + 1}","${r.workDate}","${r.workerType}","${r.workerName}","${r.contact || ''}","${r.startTime}~${r.endTime}","${r.workHours}시간","${r.dailyPay || 0}","${workerSigned}","${verifierSigned}","${r.verifierName || ''}","${r.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${settings.schoolName}_근무확인출근부_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-28">
      {/* 
        [메인 작업 카드 - 뉴모피즘 컨테이너]
      */}
      <div className="neu-card p-5 sm:p-7 bg-[#EEF1F8]">
        
        {/* 상단 섹션 타이틀 */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                관리자 모드
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight mt-0.5">
              근무·활동 출근부 대장
            </h3>
          </div>
        </div>

        {/* 
          [검색 및 필터 영역 - 뉴모피즘 Inset Bar 구성]
        */}
        <div className="pt-5 pb-6">
          <div className="neu-inset-bar p-4 rounded-2xl bg-[#EEF1F8] flex flex-wrap items-center gap-3">
            {/* 1. 인력 유형 */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                인력 유형
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="neu-inset-box px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="전체">전체 직종</option>
                {workerTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 기간 프리셋 버튼들 */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap ml-1 sm:ml-2">
                기간
              </label>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodPreset === 'all'
                    ? 'neu-inset-box text-blue-700 font-extrabold'
                    : 'neu-button text-slate-600'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => handlePreset('thisMonth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodPreset === 'thisMonth'
                    ? 'neu-inset-box text-blue-700 font-extrabold'
                    : 'neu-button text-slate-600'
                }`}
              >
                이번 달
              </button>
              <button
                type="button"
                onClick={() => handlePreset('lastMonth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  periodPreset === 'lastMonth'
                    ? 'neu-inset-box text-blue-700 font-extrabold'
                    : 'neu-button text-slate-600'
                }`}
              >
                지난달
              </button>
            </div>

            {/* 3. 날짜 범위 선택기 */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="neu-inset-box px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              />
              <span className="text-slate-400 text-xs font-bold">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="neu-inset-box px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              />
            </div>

            {/* 4. 근무자 성명 검색 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                성명
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름 검색"
                className="neu-inset-box w-full px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>

            {/* 검색 및 초기화 버튼 */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleSearch}
                className="neu-button-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1 text-white shadow"
              >
                <Search className="w-3.5 h-3.5" />
                검색
              </button>
              <button
                onClick={handleReset}
                className="neu-button px-3 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-1"
                title="필터 초기화"
              >
                <RotateCcw className="w-3 h-3" />
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 
          [작업 헤더 툴바 - 조회 건수 및 원클릭 작업 버튼군]
        */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-700">
              조회 결과 <span className="text-emerald-700">{filteredRecords.length}</span>건
            </span>
            {selectedRecordIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full">
                {selectedRecordIds.length}건 선택됨
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. 누락 기록 추가 (Primary Green Accent) */}
            <button
              onClick={onAddRecord}
              className="neu-button-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>누락 기록 추가</span>
            </button>

            {/* 2. 기간 일괄 서명 */}
            <button
              onClick={() => onBatchSign(selectedRecordIds)}
              className="neu-button px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-slate-900"
            >
              <PenLine className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedRecordIds.length > 0 ? `선택 (${selectedRecordIds.length}건) 서명` : '기간 일괄 서명'}
              </span>
            </button>

            {/* 선택 일괄 삭제 */}
            {selectedRecordIds.length > 0 && onBatchDelete && (
              <button
                onClick={() => {
                  onBatchDelete(selectedRecordIds);
                  setSelectedRecordIds([]);
                }}
                className="neu-button px-3.5 py-2 text-xs font-bold text-rose-600 flex items-center gap-1.5 hover:text-rose-800 hover:bg-rose-50 border border-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>선택 일괄 삭제 ({selectedRecordIds.length}건)</span>
              </button>
            )}

            {/* 3. 엑셀 저장 (CSV UTF-8) */}
            <button
              onClick={handleExportCsv}
              className="neu-button px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-slate-900"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>엑셀 저장</span>
            </button>

            {/* 4. PDF 저장 / 인쇄 */}
            <button
              onClick={onPrintAll}
              className="neu-button px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-slate-900"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF 저장</span>
            </button>

            <button
              onClick={onPrintAll}
              className="neu-button px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-slate-900"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>인쇄</span>
            </button>
          </div>
        </div>

        {/* 
          [근무기록 데이터 테이블 - 뉴모피즘 Inset Bar 내부 수납]
        */}
        <div className="neu-inset-bar p-2 rounded-2xl overflow-x-auto bg-[#EEF1F8]">
          <table className="w-full text-xs text-left text-slate-600 border-collapse">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-2 text-center w-9">
                  <input
                    type="checkbox"
                    checked={
                      currentRecords.length > 0 &&
                      selectedRecordIds.length === currentRecords.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded cursor-pointer accent-emerald-600"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12">순번</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[95px]">근무일자</th>
                <th className="py-3 px-3">인력 유형</th>
                <th className="py-3 px-3 whitespace-nowrap">성명</th>
                <th className="py-3 px-3 text-center">근무시간 (인정)</th>
                <th className="py-3 px-3 text-center">근무자 서명</th>
                <th className="py-3 px-3 text-center">확인자 서명</th>
                <th className="py-3 px-2 text-center w-10">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/40">
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold mb-1">조회된 근무 기록이 없습니다.</p>
                    <p className="text-xs">상단의 검색 필터를 조정하시거나 '누락 기록 추가'를 눌러 등록해주세요.</p>
                  </td>
                </tr>
              ) : (
                currentRecords.map((r, index) => {
                  const seqNumber = (currentPage - 1) * pageSize + index + 1;
                  const isSelected = selectedRecordIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-white/40 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* 체크박스 */}
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRecord(r.id)}
                          className="rounded cursor-pointer accent-emerald-600"
                        />
                      </td>

                      {/* 순번 */}
                      <td className="py-3 px-2 text-center text-slate-400 font-medium">
                        {seqNumber}
                      </td>

                      {/* 근무일자 */}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap font-mono">
                        {formatKoreanDate(r.workDate)}
                      </td>

                      {/* 인력 유형 */}
                      <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md neu-inset-bar text-[11px] font-semibold text-slate-600">
                          {r.workerType}
                        </span>
                      </td>

                      {/* 근무자 성명 */}
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {r.workerName}
                        {r.contact && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {r.contact}
                          </span>
                        )}
                      </td>

                      {/* 근무시간 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-slate-700">
                        {r.startTime}~{r.endTime}
                        <span className="block text-[10px] text-emerald-700 font-sans font-bold">
                          {r.workHours}시간 (휴게 {r.breakHours}h)
                        </span>
                      </td>

                      {/* 근무자 서명 */}
                      <td className="py-2 px-3 text-center">
                        {r.workerSignature ? (
                          <div className="inline-block p-1 bg-white/70 rounded-lg shadow-sm border border-slate-200">
                            <img
                              src={r.workerSignature}
                              alt="근무자 서명"
                              className="h-7 w-20 object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-blue-700 font-bold px-2 py-0.5 rounded-lg bg-blue-100/70 border border-blue-200">
                            수기 서명
                          </span>
                        )}
                      </td>

                      {/* 확인자 서명 */}
                      <td className="py-2 px-3 text-center">
                        {r.verifierSignature ? (
                          <div className="inline-block p-1 bg-white/70 rounded-lg shadow-sm border border-blue-200">
                            <img
                              src={r.verifierSignature}
                              alt="확인자 서명"
                              className="h-7 w-20 object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-semibold px-2 py-0.5 rounded-full bg-amber-100/60">
                            확인 대기
                          </span>
                        )}
                      </td>

                      {/* 삭제 버튼 */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`${r.workerName} 님의 ${r.workDate} 기록을 삭제하시겠습니까?`)) {
                              onDeleteRecord(r.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="기록 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 
          [페이지네이션 - 하단 컨트롤러]
        */}
        <div className="flex items-center justify-between pt-5 text-xs text-slate-500">
          <div>
            총 <span className="font-bold text-slate-700">{filteredRecords.length}</span>개의 기록 중{' '}
            <span className="font-bold text-slate-700">
              {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, filteredRecords.length)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="neu-button px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              이전
            </button>

            <span className="px-3 py-1 rounded-xl neu-inset-bar font-bold text-slate-700 text-xs">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="neu-button px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              다음
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
