export interface WorkRecord {
  id: string;
  workDate: string; // YYYY-MM-DD
  workerType: string;
  workerName: string;
  contact?: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakHours: number; // 인정 휴게시간 (기본 1시간)
  workHours: number;  // 실수정 인정 근무시간
  workerSignature: string; // data:image/png;base64,...
  signedAt?: string;
  verifierName?: string;
  verifierSignature?: string; // data:image/png;base64,...
  verifiedAt?: string;
  notes?: string;
  dailyPay?: number; // 1일 산출 인건비 (원)
  isWeeklyHolidayEligible?: boolean; // 주 15시간 이상 여부
}

export interface WorkerTypeConfig {
  id: string;
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
  defaultBreakHours: number;
  hourlyWage: number;
  dailyWage: number;
  description: string;
  insuranceNote?: string;
  assignedWorkers?: string[]; // 관리자가 사전 등록한 활동 근무자 명단
}

export type ApprovalType = '일반' | '전결' | '대결';

export interface ApprovalStep {
  id: string;
  roleName: string;      // 직위 (예: 담당, 행정실장, 교감, 학교장)
  approverName: string;  // 성명 (예: 김주무, 박행정, 이교감, 이빛나)
  approvalType: ApprovalType; // '일반' | '전결' | '대결'
}

export interface SchoolSettings {
  schoolName: string;
  appName?: string;
  subTitle?: string;
  adminOfficeChief: string;
  adminOfficer: string;
  vicePrincipalName?: string;
  principalName: string;
  sealText: string;
  gasApiUrl: string;
  autoApprove: boolean;
  schoolOfficeContact?: string;
  approvalLine?: ApprovalStep[];
}

export interface EdufineProposalItem {
  workerName: string;
  workerType: string;
  totalDays: number;
  totalHours: number;
  totalGrossPay: number;
  employmentInsurance: number;
  industrialInsurance: number;
  residentTax: number;
  netPay: number;
  bankAccount?: string;
}
