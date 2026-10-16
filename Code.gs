/**
 * @file Code.gs
 * @description 스쿨사인 365 (SchoolSign 365) - 모바일 출근확인서 전자서명 & 학교 근무기록 관리시스템 백엔드
 * @school 담양남초등학교 (또는 사용자 지정 학교)
 * @version 3.1.0
 * 
 * =========================================================================
 * [⚠️ 중요: "SyntaxError: Invalid or unexpected token" 오류 방지 3초 가이드]
 * 1. 스프레드시트 [확장 프로그램] -> [Apps Script] 편집기를 새로 열었을 때
 *    기본 작성되어 있는 'function myFunction() { }' 3줄을
 *    **반드시 전체 선택(Ctrl+A) 후 삭제(Delete)**하고 빈 파일에 붙여넣으세요!
 * 2. 'Code.gs'는 순수 자바스크립트 파일입니다. HTML 파일 내용이나 <...> 태그를
 *    Code.gs에 붙여넣으면 즉시 72행 등에서 'Invalid or unexpected token' 에러가 발생합니다.
 * 3. 웹 앱 화면(HTML)은 좌측 [+] -> [HTML]을 눌러 파일명을 'index'로 생성한 뒤
 *    index.html 코드를 붙여넣으셔야 합니다.
 * =========================================================================
 * 
 * [스프레드시트 원클릭 배포 안내]
 * 1. 구글 스프레드시트 새로 만들기 -> 상단 [확장 프로그램] -> [Apps Script] 클릭
 * 2. Code.gs 파일에 이 코드를 전체 붙여넣기
 * 3. 좌측 [+] 클릭 -> [HTML] 선택 -> 파일 이름을 'index' 로 생성 후 index.html 내용 붙여넣기
 * 4. 오른쪽 위 [배포] -> [새 배포] -> 유형 선택: [웹 앱]
 *    - 설명: 스쿨사인 365 v3.1
 *    - 다음 사용자로 실행: [나 (내 계정)]
 *    - 액세스 권한: [모든 사용자(Anyone)] (대체인력이 로그인 없이 폰으로 서명할 수 있도록 필수)
 * 5. 생성된 웹 앱 URL을 복사하여 QR코드 안내판 및 즐겨찾기에 등록!
 */

const SHEET_NAME_RECORDS = "근무기록";
const SHEET_NAME_MANUAL = "사용설명서";

/**
 * 근무기록 시트 안전 추출 헬퍼
 * - 사용자가 사전에 구성해 둔 시트 형태를 그대로 존중하여 자동 탐색
 * - '근무기록' 명칭 시트 우선, 없을 경우 설명서가 아닌 첫 번째 데이터 시트 자동 선택
 */
function getRecordsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_RECORDS);
  if (!sheet) {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const name = sheets[i].getName();
      if (name !== SHEET_NAME_MANUAL && !name.includes("설명서")) {
        return sheets[i];
      }
    }
    return sheets[0];
  }
  return sheet;
}

/**
 * 웹 앱 서빙 (HTML Service) & API GET
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  // 모바일 QR 스캔 / 링크 접속 시(?mode=worker 또는 ?view=worker)
  // Google Apps Script iframe 환경에서도 즉시 근무자 모드로 열리도록 serverMode 변수 안전 주입
  var mode = (e && e.parameter && (e.parameter.mode || e.parameter.view)) || "";
  var isWorkerRequested = mode === "worker" || 
                          (e && e.parameter && (e.parameter.worker !== undefined || e.parameter.sign !== undefined));

  var htmlOutput = HtmlService.createHtmlOutputFromFile("index");
  var content = htmlOutput.getContent();

  if (isWorkerRequested) {
    content = content.replace("<head>", "<head><script>var serverMode = 'worker';</script>");
  }

  return HtmlService.createHtmlOutput(content)
    .setTitle("스쿨사인 365 - 모바일 출근확인서 전자서명")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 배포 웹 앱 URL 실시간 반환 헬퍼 (클라이언트 google.script.run 호출용)
 */
function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl() || "";
  } catch(e) {
    return "";
  }
}

/**
 * 웹 앱 POST API (근무기록 제출 / 일괄 서명 / 삭제)
 */
function doPost(e) {
  try {
    // 안전한 본문 데이터 검증 (Apps Script 편집기에서 직접 실행 시 e가 없을 때 대응)
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: "POST 요청의 본문(e.postData)이 없습니다. 브라우저나 클라이언트 웹 앱을 통해 전송해야 합니다." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || "addRecord";

    if (action === "addRecord") {
      const record = postData.record;
      const result = appendWorkRecord(record);
      return ContentService.createTextOutput(JSON.stringify({ success: true, record: result }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "batchVerify") {
      const recordIds = postData.recordIds || [];
      const verifierName = postData.verifierName;
      const signatureData = postData.signatureData;
      batchVerifyRecords(recordIds, verifierName, signatureData);
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: recordIds.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "deleteRecord") {
      const recordId = postData.recordId;
      deleteRecordById(recordId);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "batchDelete") {
      const recordIds = postData.recordIds || [];
      const count = batchDeleteRecords(recordIds);
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: count }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "saveTypes") {
      saveWorkerTypes(postData.types || []);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "알 수 없는 작업" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiGet(e) {
  const action = e.parameter.action;
  if (action === "getRecords") {
    const records = fetchAllRecords();
    return ContentService.createTextOutput(JSON.stringify({ success: true, records }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "getTypes") {
    const types = fetchAllWorkerTypes();
    return ContentService.createTextOutput(JSON.stringify({ success: true, types }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. 시트 초기화 및 헤더 생성
 * - 메인 시트: '근무기록' (샘플 데이터 없이 헤더만 구성)
 * - 보조 시트: '사용설명서' (제일 마지막 탭)
 * - 불필요한 '시스템설정', '인력유형' 시트는 삭제하여 스프레드시트를 극도로 깔끔하게 유지합니다.
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 불필요한 구버전 시트 자동 제거
  const oldConfig = ss.getSheetByName("시스템설정");
  if (oldConfig) ss.deleteSheet(oldConfig);
  const oldTypes = ss.getSheetByName("인력유형");
  if (oldTypes) ss.deleteSheet(oldTypes);

  // 1-1. 메인 '근무기록' 시트 생성 (첫 번째 탭, 샘플 데이터 0건)
  let recSheet = ss.getSheetByName(SHEET_NAME_RECORDS);
  if (!recSheet) {
    recSheet = ss.insertSheet(SHEET_NAME_RECORDS, 0);
  }
  recSheet.clear();
  recSheet.setTabColor("#2C3E70");
  const recHeaders = [
    "ID", "근무일자", "인력유형", "근무자성명", "연락처", 
    "시작시간", "종료시간", "휴게시간(h)", "인정시간(h)", "산출급여(원)",
    "근무자서명", "제출일시", "확인자성명", "확인자서명", "확인일시", "비고"
  ];
  recSheet.getRange(1, 1, 1, recHeaders.length).setValues([recHeaders])
    .setBackground("#2C3E70").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  recSheet.setFrozenRows(1);

  // 시트 열 너비 단정하게 설정
  recSheet.setColumnWidth(1, 110);
  recSheet.setColumnWidth(2, 100);
  recSheet.setColumnWidth(3, 130);
  recSheet.setColumnWidth(4, 110);
  recSheet.setColumnWidth(5, 120);
  recSheet.setColumnWidth(6, 90);
  recSheet.setColumnWidth(7, 90);
  recSheet.setColumnWidth(8, 90);
  recSheet.setColumnWidth(9, 90);
  recSheet.setColumnWidth(10, 100);
  recSheet.setColumnWidth(11, 100); // 근무자서명 (서명완료/미서명)
  recSheet.setColumnWidth(12, 140);
  recSheet.setColumnWidth(13, 110);
  recSheet.setColumnWidth(14, 100); // 확인자서명 (서명완료/미서명)
  recSheet.setColumnWidth(15, 140);
  recSheet.setColumnWidth(16, 160);

  // 1-2. '사용설명서' 시트 생성 및 제일 마지막 탭으로 이동
  createManualSheet(ss);
  let manualSheet = ss.getSheetByName(SHEET_NAME_MANUAL);
  if (manualSheet) {
    ss.setActiveSheet(manualSheet);
    ss.moveActiveSheet(ss.getNumSheets());
  }

  // 기본 활성 탭을 '근무기록'으로 설정
  ss.setActiveSheet(recSheet);

  SpreadsheetApp.getUi().alert("✅ 시트 초기화 완료!\n'근무기록' 시트가 메인으로 준비되었으며, '사용설명서' 시트가 마지막 탭에 배치되었습니다.");
}

/**
 * '사용설명서' 시트 생성 및 서식 지정
 * - 사용자 지정 7단계 순서 기반 종합 표준 업무 매뉴얼
 * 1. 스프레드시트 사본 만들기 (도입 시작)
 * 2. Apps Script 코드 확인 및 저장 방법
 * 3. [트리거 메뉴] 초기 시스템 자동 환경설정
 * 4. 웹 앱 실제 사용 방법 (신청자 & 관리자)
 * 5. 근로자 모바일 사용 방법
 * 6. 웹 앱 배포 및 업데이트 방법 (새 배포 vs 배포 관리)
 * 7. 근로자, 교직원 안내 및 홍보 방법
 */
function createManualSheet(optSs) {
  const ss = optSs || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_MANUAL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_MANUAL, 0);
  }
  sheet.clear();
  sheet.setTabColor("#2C3E70");

  // 1. 대형 상단 타이틀 배너
  sheet.getRange("A1:D1").merge();
  sheet.getRange("A1").setValue("📋 [스쿨사인 365] 학교 대체·단기인력 모바일 출근확인서 & 전자서명 관리시스템 종합 사용설명서")
    .setFontSize(13).setFontWeight("bold").setFontColor("#ffffff").setBackground("#2C3E70")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);

  // 2. 부제목 (학교명 및 행정실 업무 자동화 슬로건)
  sheet.getRange("A2:D2").merge();
  sheet.getRange("A2").setValue("전라남도교육청 학교 행정실 업무 자동화 | 행복초등학교 행정실 | 모바일 무설치 QR 전자서명 · K-에듀파인 지출품의 연동")
    .setFontSize(10).setFontColor("#475569").setBackground("#f8fafc")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(2, 28);

  // 3. 핵심 3대 운영 프로세스 요약 배너
  sheet.getRange("A3:D3").merge();
  sheet.getRange("A3").setValue("💡 [표준 운영 흐름] ① 당일 출근 시 QR 모바일 간편 서명(로그인X) ➔ ② 월말 행정실 1초 일괄 승인 ➔ ③ K-에듀파인 품의 본문 자동복사 & 공식 A4 출근부 출력")
    .setFontSize(9.5).setFontWeight("bold").setFontColor("#2C3E70").setBackground("#EEF1F8")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(3, 30);

  // 4. 테이블 헤더 행
  const headers = ["단계 (순서)", "주요 항목 & 업무 절차", "상세 사용 가이드 및 표준 절차", "행정실 실무 팁 & 주의사항 (꿀팁)"];
  sheet.getRange(4, 1, 1, 4).setValues([headers])
    .setBackground("#1B2340").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setFontSize(10);
  sheet.setRowHeight(4, 32);

  // 5. 사용자가 요청한 정확한 7단계 사용설명서 데이터
  const manualData = [
    [
      "STEP 1",
      "1. 스프레드시트 사본 만들기\n(도입 시작)",
      "1) 배포된 [스쿨패스 365] 구글 스프레드시트 원본 링크에 웹 브라우저로 접속합니다.\n2) 상단 메뉴에서 [파일] ➔ [사본 만들기]를 클릭합니다.\n3) 사본 이름에 본인 학교명을 포함하여 지정합니다. (예: '[행복초등학교] 스쿨패스 365 출근관리대장')\n4) 학교 공용 구글 드라이브(또는 업무용 구글 계정 폴더)를 선택하고 [사본 만들기] 버튼을 클릭합니다.\n5) 생성된 사본은 학교 전용 클라우드 데이터베이스로 평생 무제한 무료 보관 및 관리됩니다.",
      "• 학교 공용 계정 또는 행정실 대표 구글 계정으로 사본을 만드시면 담당자 인사이동 시에도 인수인계가 매우 수월합니다.\n• 원본 시트의 서식, 수식, 연동된 백엔드 Apps Script 코드가 사본에 100% 그대로 안전하게 복사됩니다."
    ],
    [
      "STEP 2",
      "2. Apps Script 코드 확인\n및 저장 방법",
      "1) 사본으로 복사된 스프레드시트 상단 메뉴에서 [확장 프로그램] ➔ [Apps Script]를 클릭합니다.\n2) 열린 스크립트 편집기 좌측 파일 목록에 'Code.gs'와 'index.html' 파일이 정상적으로 있는지 확인합니다.\n3) 만약 최신 코드로 업데이트가 필요한 경우:\n   - Code.gs: 웹 화면의 [Code.gs] 코드를 전체 복사하여 기존 내용을 모두 지우고 덮어쓰기(Ctrl+V)합니다.\n   - index.html: 좌측 [+] ➔ [HTML]을 눌러 파일명을 'index'로 생성하고 웹 화면의 [index.html] 코드를 덮어쓰기합니다.\n4) 상단 툴바의 [저장 (디스크 아이콘 / Ctrl+S)]을 눌러 변경사항을 저장합니다.",
      "• 브라우저는 구글 크롬(Chrome) 또는 웨일(Whale) 사용을 적극 권장합니다.\n• index.html 생성 시 확장자 '.html'은 자동 부착되므로 이름에 점이나 영문 확장자 없이 'index'만 입력해야 올바르게 연동됩니다."
    ],
    [
      "STEP 3",
      "3. [트리거 메뉴]\n초기 시스템 자동 환경설정",
      "1) 코드 저장 후 스프레드시트 브라우저 탭으로 돌아와 새로고침(F5)합니다.\n2) 상단 도움말 메뉴 우측에 생성된 [📋 스쿨패스 365] 맞춤 메뉴를 확인합니다.\n3) [📋 스쿨패스 365] ➔ [🚀 전체 시트 초기화 및 사용설명서 생성]을 클릭합니다.\n4) 최초 1회 실행 시 구글 [권한 검토] 창이 나타납니다:\n   - 본인 구글 계정 선택 ➔ [고급] 클릭 ➔ 하단의 '...로 이동(안전하지 않음)' 클릭 ➔ [허용] 클릭\n5) 승인 후 메뉴를 한 번 더 클릭하면 [근무기록](샘플 없는 깨끗한 메인 탭)과 [사용설명서](마지막 탭) 2개 시트가 컬러 서식과 함께 완벽하게 자동 구성됩니다!",
      "• '안전하지 않음' 경고는 구글 마켓플레이스 유료 앱이 아닌 학교 자체 제작 스크립트일 때 구글이 띄우는 정상적인 보안 확인 절차입니다. 안심하고 [허용]을 누르시면 됩니다.\n• 불필요한 구버전 시트(시스템설정, 인력유형)는 자동으로 감지하여 깔끔하게 정리해 줍니다."
    ],
    [
      "STEP 4",
      "4. 웹 앱 실제 사용 방법\n(신청자 & 관리자)",
      "1) 대시보드 조회: 직종별(급식실, 배움터지킴이, 늘봄, 시설 등), 기간별(전체/이번달/지난달), 성명 검색으로 누적 대장을 실시간 필터링 조회합니다.\n2) 수기 추가 (소급 등록): 모바일 서명을 누락한 경우 [+ 누락 기록 추가]로 등록합니다. (인정시간 및 일당 자동 산출, 서명란 '미서명' 처리)\n3) 기간 일괄 서명 (원클릭 승인): 월말에 대상 목록 체크박스 선택 ➔ [기간 일괄 서명] ➔ 확인자 성명 및 서명 날인 ➔ 수십 건이 1초 만에 '서명완료'로 승인됩니다.\n4) K-에듀파인 품의 연동: [에듀파인 품의서] 클릭 ➔ 당월 총 인원, 총 인정시간, 총 지급액 자동 집계 ➔ [제목/개요 복사], [산출내역 복사]로 1초 만에 붙여넣기!\n5) 공식 출근대장 출력 / PDF: [인쇄/PDF] 클릭 ➔ 결재선(담당-실장-교장) 탑재 대장 출력 (비고란은 수기 기재를 위해 공란으로 출력)",
      "• K-에듀파인 품의서 작성 시간을 기존 30분~1시간에서 단 1분으로 대폭 단축시켜 줍니다.\n• 투입 인원 및 인정시간 곱셈 계산 오류, 산출 내역 오기재로 인한 과오납 및 감사 지적을 원천 방지합니다."
    ],
    [
      "STEP 5",
      "5. 근로자 모바일 사용 방법\n(무설치/무로그인)",
      "1) QR코드 스캔: 출근 시 교내(급식실, 행정실 등)에 부착된 A4 포스터의 QR코드를 스마트폰 기본 카메라로 비춥니다.\n2) 출근 정보 확인: 화면 상단 노란 배너를 터치하면 브라우저가 열리며, 본인 성명 입력 후 직종을 선택합니다.\n3) 시간 및 일당 확인: 직종에 맞는 기본 출퇴근 시간과 휴게시간이 자동 세팅되어 인정시간과 일당이 화면에 바로 표시됩니다. (필요 시 수정 가능)\n4) 터치 전자서명 날인: 화면 하단 서명 패드에 손가락이나 스마트폰 터치펜으로 자필 서명합니다.\n5) [출근 서명 제출] 터치: 제출 즉시 구글 시트 [근무기록] 시트에 실시간 행으로 추가되며, 화면에는 당일 '출근 서명 확인증(영수증 카드)'이 표시됩니다.",
      "• 별도 회원가입, 로그인, 어플 설치가 일절 필요 없어 연세가 있으신 어르신 지킴이, 조리 대체인력도 10초 만에 서명할 수 있습니다.\n• 제출 즉시 시트에 '서명완료'로 자동 기록되므로 행정실에서 출근 여부를 실시간으로 파악할 수 있습니다."
    ],
    [
      "STEP 6",
      "6. 웹 앱 배포 및 업데이트 방법\n(새 배포 vs 배포 관리)",
      "1) 최초 웹 앱 배포 (새 배포):\n   - Apps Script 우측 상단 파란색 [배포] ➔ [새 배포] 클릭\n   - 유형: 톱니바퀴 ➔ [웹 앱] 선택\n   - 다음 사용자로 실행: [나 (내 계정)]\n   - ★액세스 권한: 반드시 [모든 사용자 (Anyone)] 선택! (근로자가 로그인 없이 서명하기 위해 필수)\n   - [배포] 클릭 ➔ 발급되는 웹 앱 URL(.../exec로 끝나는 주소) 복사 및 보관\n2) 코드 수정 후 반영 (배포 관리 - 필수 체크!):\n   - 코드를 수정한 뒤 단순히 [저장]만 누르면 실제 웹 앱 주소에는 반영되지 않습니다!\n   - 반드시 우측 상단 [배포] ➔ [배포 관리] 클릭 ➔ 활성 배포 옆 [연필 (수정)] 아이콘 클릭 ➔ 버전 드롭다운에서 반드시 ★[새 버전]★ 선택 ➔ [배포] 클릭",
      "• 주소 끝이 '.../dev'인 개발 URL은 작성자 본인만 열리므로 절대 배포하지 마시고, 반드시 '.../exec'로 끝나는 정식 URL을 사용하세요.\n• 액세스 권한이 '모든 사용자'가 아니면 근로자 스마트폰에서 구글 로그인 창이 뜨게 되니 꼭 확인하세요."
    ],
    [
      "STEP 7",
      "7. 근로자, 교직원 안내\n및 홍보 방법",
      "1) A4 비치용 안내 포스터 출력:\n   - 웹 앱 관리자 화면의 [비치용 QR] 탭 클릭 ➔ 발급된 웹 앱 URL 등록 확인 ➔ [A4 포스터 인쇄] 버튼 클릭\n   - 학교명, QR코드, 3단계 이용안내가 포함된 깔끔한 공식 안내장이 컬러로 인쇄됩니다.\n2) 현장 부착 위치:\n   - 급식실 영양교사실 및 조리실 입구 (조리실무사 결원 대체인력)\n   - 배움터지킴이실 책상 앞 (배움터지킴이)\n   - 늘봄교실 / 돌봄교실 게시판 (늘봄·돌봄 대체전담사)\n   - 행정실 민원대 및 현관 게시판 (시설보조, 환경정비 등)\n3) 교직원 및 근로자 안내 요령:\n   - 교무회의 및 급식실 전달: '앞으로 모든 단기 대체인력은 종이 명부 대신 출근 시 QR코드로 10초 만에 서명하도록 안내해 주세요.'\n   - 첫 출근 대체인력에게는 행정실 또는 담당자가 스마트폰 카메라로 QR코드 찍는 법을 1회만 시연해 주시면 이후 자율적으로 출근 서명합니다.",
      "• 안내장을 코팅(라미네이팅)하거나 투명 아크릴 L자 스탠드에 끼워두시면 훼손 없이 1년 내내 깨끗하게 비치할 수 있습니다.\n• 스마트폰 조작이 서투른 어르신 근로자의 경우 언제든 관리자가 수기 등록할 수 있으므로 현장 반발 없이 부드럽게 정착됩니다."
    ]
  ];

  const startRow = 5;
  sheet.getRange(startRow, 1, manualData.length, 4).setValues(manualData)
    .setVerticalAlignment("top");

  // 행 높이 넉넉하게 설정 (텍스트 줄바꿈 시 잘림 방지)
  for (let i = 0; i < manualData.length; i++) {
    sheet.setRowHeight(startRow + i, 115);
  }

  // 열별 폰트, 정렬 및 컬러 스타일링
  sheet.getRange(startRow, 1, manualData.length, 1)
    .setFontWeight("bold").setHorizontalAlignment("center").setBackground("#f8fafc").setFontSize(10).setFontColor("#1e3a8a");
  sheet.getRange(startRow, 2, manualData.length, 1)
    .setFontWeight("bold").setFontColor("#1e3a8a").setBackground("#eff6ff").setFontSize(10).setVerticalAlignment("middle");
  sheet.getRange(startRow, 3, manualData.length, 1)
    .setWrap(true).setFontSize(9.5).setFontColor("#1e293b");
  sheet.getRange(startRow, 4, manualData.length, 1)
    .setWrap(true).setFontColor("#047857").setBackground("#f0fdf4").setFontSize(9);

  // 전체 격자 실선 테두리 적용
  const fullRange = sheet.getRange(4, 1, manualData.length + 1, 4);
  fullRange.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // 최적화된 열 너비 지정
  sheet.setColumnWidth(1, 95);  // 단계
  sheet.setColumnWidth(2, 230); // 주요 항목 & 절차
  sheet.setColumnWidth(3, 600); // 상세 사용 가이드
  sheet.setColumnWidth(4, 360); // 실무 팁 & 주의사항

  // 상단 4개 행 틀 고정 (스크롤 시에도 타이틀과 헤더 고정)
  sheet.setFrozenRows(4);
}

/**
 * 2. 근무기록 추가 (근무자 모바일 제출 or 수기 추가)
 * - 사용자가 사전에 구성해 둔 시트의 열 헤더 순서에 맞춰 유연하게 매핑 기록
 * - 근무자서명 및 확인자서명 열에 서명 시 '서명완료', 미서명 시 '미서명' 텍스트로 깔끔하게 기록
 */
function appendWorkRecord(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRecordsSheet(ss);
  if (!sheet) return null;

  const id = record.id || "rec-" + Date.now();
  const nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  // 서명 여부 판정: 서명했을 때 '서명완료', 안했을 때 '미서명'
  const isWorkerSigned = (record.workerSignature && String(record.workerSignature).trim().length > 0 && String(record.workerSignature) !== "미서명");
  const workerSignStatus = isWorkerSigned ? "서명완료" : "미서명";

  const isVerifierSigned = (record.verifierSignature && String(record.verifierSignature).trim().length > 0 && String(record.verifierSignature) !== "미서명");
  const verifierSignStatus = isVerifierSigned ? "서명완료" : "미서명";

  const wDate = record.workDate || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");

  const data = sheet.getDataRange().getValues();
  if (data && data.length > 0) {
    const headers = data[0].map(function(h) { return String(h || "").trim(); });
    function findCol(candidates) {
      for (let i = 0; i < candidates.length; i++) {
        const idx = headers.indexOf(candidates[i]);
        if (idx !== -1) return idx;
      }
      return -1;
    }

    const row = new Array(headers.length).fill("");
    const colId = findCol(["ID", "id", "순번", "번호"]);
    const colDate = findCol(["근무일자", "일자", "날짜", "근무 일자"]);
    const colType = findCol(["인력유형", "직종", "인력구분", "구분", "업무"]);
    const colName = findCol(["근무자성명", "성명", "이름", "근무자"]);
    const colContact = findCol(["연락처", "전화번호", "휴대폰"]);
    const colStart = findCol(["시작시간", "출근시간", "출근", "시작"]);
    const colEnd = findCol(["종료시간", "퇴근시간", "퇴근", "종료"]);
    const colBreak = findCol(["휴게시간(h)", "휴게시간", "휴게"]);
    const colHours = findCol(["인정시간(h)", "인정시간", "근무시간", "인정 시간", "시간"]);
    const colPay = findCol(["산출급여(원)", "산출급여", "지급액", "급여", "일당", "금액"]);
    const colWSign = findCol(["근무자서명", "본인서명", "서명", "근무자 서명"]);
    const colSignedAt = findCol(["제출일시", "서명일시", "등록일시", "일시"]);
    const colVName = findCol(["확인자성명", "담당자성명", "확인자", "담당자"]);
    const colVSign = findCol(["확인자서명", "담당자서명", "확인", "결재"]);
    const colVAt = findCol(["확인일시", "결재일시"]);
    const colNotes = findCol(["비고", "메모", "비 고"]);

    if (colId !== -1) row[colId] = id;
    if (colDate !== -1) row[colDate] = wDate;
    if (colType !== -1) row[colType] = record.workerType || "기타";
    if (colName !== -1) row[colName] = record.workerName || "";
    if (colContact !== -1) row[colContact] = record.contact || "";
    if (colStart !== -1) row[colStart] = record.startTime || "08:30";
    if (colEnd !== -1) row[colEnd] = record.endTime || "16:30";
    if (colBreak !== -1) row[colBreak] = Number(record.breakHours || 0);
    if (colHours !== -1) row[colHours] = Number(record.workHours || 0);
    if (colPay !== -1) row[colPay] = Number(record.dailyPay || 0);
    if (colWSign !== -1) row[colWSign] = workerSignStatus;
    if (colSignedAt !== -1) row[colSignedAt] = nowStr;
    if (colVName !== -1) row[colVName] = record.verifierName || "";
    if (colVSign !== -1) row[colVSign] = verifierSignStatus;
    if (colVAt !== -1) row[colVAt] = record.verifiedAt || "";
    if (colNotes !== -1) row[colNotes] = record.notes || "";

    sheet.appendRow(row);
  } else {
    const row = [
      id, wDate, record.workerType || "기타", record.workerName || "", record.contact || "",
      record.startTime || "08:30", record.endTime || "16:30", Number(record.breakHours || 0),
      Number(record.workHours || 0), Number(record.dailyPay || 0), workerSignStatus, nowStr,
      record.verifierName || "", verifierSignStatus, record.verifiedAt || "", record.notes || ""
    ];
    sheet.appendRow(row);
  }

  record.id = id;
  record.workerSignature = workerSignStatus;
  record.verifierSignature = verifierSignStatus;
  return record;
}

/**
 * 3. 기간 일괄 서명 반영
 * - 확인자서명 열에 '서명완료' 텍스트와 확인자 성명, 확인일시가 동적 헤더 위치에 정확히 기록됩니다.
 */
function batchVerifyRecords(recordIds, verifierName, signatureData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRecordsSheet(ss);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0].map(function(h) { return String(h || "").trim(); });
  function findCol(candidates, fallback) {
    for (let i = 0; i < candidates.length; i++) {
      const idx = headers.indexOf(candidates[i]);
      if (idx !== -1) return idx;
    }
    return fallback;
  }

  const idColIdx = findCol(["ID", "id", "순번", "번호"], 0);
  const verifierNameIdx = findCol(["확인자성명", "담당자성명", "확인자", "담당자"], 12);
  const verifierSignIdx = findCol(["확인자서명", "담당자서명", "확인", "결재"], 13);
  const verifiedAtIdx = findCol(["확인일시", "결재일시"], 14);

  const nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
  const isSigned = (signatureData && String(signatureData).trim().length > 0 && String(signatureData) !== "미서명");
  const signStatus = isSigned ? "서명완료" : "미서명";

  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][idColIdx]);
    if (recordIds.includes(rowId)) {
      if (verifierNameIdx !== -1) sheet.getRange(i + 1, verifierNameIdx + 1).setValue(verifierName);
      if (verifierSignIdx !== -1) sheet.getRange(i + 1, verifierSignIdx + 1).setValue(signStatus);
      if (verifiedAtIdx !== -1) sheet.getRange(i + 1, verifiedAtIdx + 1).setValue(nowStr);
    }
  }
}

/**
 * 4. 기록 단건 삭제
 */
function deleteRecordById(recordId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRecordsSheet(ss);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0].map(function(h) { return String(h || "").trim(); });
  function findCol(candidates, fallback) {
    for (let i = 0; i < candidates.length; i++) {
      const idx = headers.indexOf(candidates[i]);
      if (idx !== -1) return idx;
    }
    return fallback;
  }
  const idColIdx = findCol(["ID", "id", "순번", "번호"], 0);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(recordId)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * 4-1. 선택된 근무기록 일괄 삭제 (Batch Delete)
 */
function batchDeleteRecords(recordIds) {
  if (!recordIds || !recordIds.length) return 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRecordsSheet(ss);
  if (!sheet) return 0;

  const idSet = new Set(recordIds.map(String));
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;

  const headers = data[0].map(function(h) { return String(h || "").trim(); });
  function findCol(candidates, fallback) {
    for (let i = 0; i < candidates.length; i++) {
      const idx = headers.indexOf(candidates[i]);
      if (idx !== -1) return idx;
    }
    return fallback;
  }
  const idColIdx = findCol(["ID", "id", "순번", "번호"], 0);

  let deletedCount = 0;
  // 행 번호 밀림 방지를 위해 아래쪽 행부터 역순으로 삭제
  for (let i = data.length - 1; i >= 1; i--) {
    if (idSet.has(String(data[i][idColIdx]))) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  return deletedCount;
}

/**
 * 5. 전체 근무기록 조회 (JSON 변환)
 * - 헤더 위치가 변경되거나 ID가 비어있어도 행 누락 없이 완벽 복원
 * - 날짜(YYYY-MM-DD), 시간(HH:mm), 금액, 서명 데이터의 완벽한 직렬화 보장
 * - 최신 제출 기록이 대장 최상단에 바로 보이도록 정렬 반환
 */
function fetchAllRecords() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRecordsSheet(ss);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (!data || data.length <= 1) return [];

  const tz = ss.getSpreadsheetTimeZone() || "Asia/Seoul";

  // 1행 헤더 동적 탐색 (열 순서가 변경되거나 명칭이 조금 달라도 안전 매핑)
  const headers = data[0].map(function(h) { return String(h || "").trim(); });
  function findCol(candidates, fallback) {
    for (let i = 0; i < candidates.length; i++) {
      const idx = headers.indexOf(candidates[i]);
      if (idx !== -1) return idx;
    }
    return fallback;
  }

  const colId = findCol(["ID", "id", "순번"], 0);
  const colDate = findCol(["근무일자", "일자", "날짜"], 1);
  const colType = findCol(["인력유형", "직종", "인력구분"], 2);
  const colName = findCol(["근무자성명", "성명", "이름"], 3);
  const colContact = findCol(["연락처", "전화번호"], 4);
  const colStart = findCol(["시작시간", "출근시간"], 5);
  const colEnd = findCol(["종료시간", "퇴근시간"], 6);
  const colBreak = findCol(["휴게시간(h)", "휴게시간"], 7);
  const colHours = findCol(["인정시간(h)", "인정시간", "근무시간"], 8);
  const colPay = findCol(["산출급여(원)", "산출급여", "지급액", "급여"], 9);
  const colWSign = findCol(["근무자서명", "본인서명", "서명"], 10);
  const colSignedAt = findCol(["제출일시", "서명일시", "등록일시"], 11);
  const colVName = findCol(["확인자성명", "담당자성명"], 12);
  const colVSign = findCol(["확인자서명", "담당자서명"], 13);
  const colVAt = findCol(["확인일시", "결재일시"], 14);
  const colNotes = findCol(["비고", "메모"], 15);

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawName = row[colName];
    const rawDate = row[colDate];
    const rawId = row[colId];
    // 모든 주요 열이 비어있는 빈 행만 제외
    if (!rawName && !rawDate && !rawId) continue;

    // 날짜 정규화 (YYYY-MM-DD 엄격 준수)
    let wDate = "";
    if (rawDate instanceof Date) {
      wDate = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");
    } else if (rawDate) {
      const s = String(rawDate).trim();
      const m = s.match(/(\d{4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})/);
      if (m) {
        wDate = m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
      } else if (s.indexOf('T') !== -1) {
        try {
          wDate = Utilities.formatDate(new Date(s), tz, "yyyy-MM-dd");
        } catch(e) {
          wDate = s.slice(0, 10);
        }
      } else {
        wDate = s;
      }
    }

    // 시간 정규화 (HH:mm)
    function parseTime(val) {
      if (!val) return "";
      if (val instanceof Date) {
        return Utilities.formatDate(val, tz, "HH:mm");
      }
      const str = String(val).trim();
      const tm = str.match(/(\d{1,2}):(\d{2})/);
      if (tm) {
        return ("0" + tm[1]).slice(-2) + ":" + tm[2];
      }
      return str;
    }

    // 서명 텍스트 정규화
    let wSign = String(row[colWSign] || "").trim();
    if (!wSign) wSign = "미서명";
    else if (wSign.length > 5 && wSign !== "미서명" && wSign !== "서명완료" && wSign.indexOf("data:") === -1) {
      wSign = "서명완료";
    }

    let vSign = String(row[colVSign] || "").trim();
    if (!vSign) vSign = "미서명";
    else if (vSign.length > 5 && vSign !== "미서명" && vSign !== "서명완료" && vSign.indexOf("data:") === -1) {
      vSign = "서명완료";
    }

    // 등록일시
    let sAt = "";
    const rawSAt = row[colSignedAt];
    if (rawSAt instanceof Date) {
      sAt = Utilities.formatDate(rawSAt, tz, "yyyy-MM-dd HH:mm:ss");
    } else {
      sAt = String(rawSAt || "");
    }

    // 결재일시
    let vAt = "";
    const rawVAt = row[colVAt];
    if (rawVAt instanceof Date) {
      vAt = Utilities.formatDate(rawVAt, tz, "yyyy-MM-dd HH:mm:ss");
    } else {
      vAt = String(rawVAt || "");
    }

    const recId = rawId ? String(rawId) : ("rec-" + Date.now() + "-" + i);

    records.push({
      id: recId,
      workDate: wDate,
      workerType: String(row[colType] || "기타").trim(),
      workerName: String(rawName || "").trim(),
      contact: String(row[colContact] || "").trim(),
      startTime: parseTime(row[colStart]) || "08:30",
      endTime: parseTime(row[colEnd]) || "16:30",
      breakHours: Number(row[colBreak]) || 0,
      workHours: Number(row[colHours]) || 0,
      dailyPay: Number(row[colPay]) || 0,
      workerSignature: wSign,
      signedAt: sAt,
      verifierName: String(row[colVName] || "").trim(),
      verifierSignature: vSign,
      verifiedAt: vAt,
      notes: String(row[colNotes] || "").trim()
    });
  }

  // 최신 제출 기록이 대장 최상단에 바로 보이도록 역순(Newest first) 정렬하여 반환
  return records.reverse();
}

/**
 * 6. 인력유형 목록 조회 (별도 시트 없이 ScriptProperties 또는 기본값 활용)
 */
function fetchAllWorkerTypes() {
  const defaultTypes = [
    { id: "type-1", name: "급식실 대체인력", defaultStartTime: "07:30", defaultEndTime: "15:30", defaultBreakHours: 1, hourlyWage: 11200, dailyWage: 78400, description: "조리실무사 결원 시 조리 및 배식 지원", insuranceNotes: "고용/산재 적용" },
    { id: "type-2", name: "배움터지킴이", defaultStartTime: "08:30", defaultEndTime: "16:30", defaultBreakHours: 1, hourlyWage: 6000, dailyWage: 48000, description: "학생 등하교 안전지도 및 방문객 안내", insuranceNotes: "자원봉사 실비(비과세)" },
    { id: "type-3", name: "늘봄·돌봄 대체", defaultStartTime: "12:30", defaultEndTime: "17:30", defaultBreakHours: 0.5, hourlyWage: 12500, dailyWage: 56250, description: "돌봄전담사 부재 시 아동 보육 지도", insuranceNotes: "단시간 근로" },
    { id: "type-4", name: "시설보조·환경정비", defaultStartTime: "08:30", defaultEndTime: "16:30", defaultBreakHours: 1, hourlyWage: 10800, dailyWage: 75600, description: "교내 환경정비 및 수목 관리", insuranceNotes: "산재보험 가입" }
  ];

  try {
    const props = PropertiesService.getScriptProperties();
    const saved = props.getProperty("WORKER_TYPES");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}

  return defaultTypes;
}

/**
 * 6-1. 인력유형 목록 저장 (관리자 모드에서 웹으로 간편 저장)
 */
function saveWorkerTypes(types) {
  if (!types || !types.length) return;
  try {
    PropertiesService.getScriptProperties().setProperty("WORKER_TYPES", JSON.stringify(types));
  } catch(e) {
    console.error("인력유형 저장 실패:", e);
  }
}

/**
 * 8. 당월 K-에듀파인 지출품의 집계표 생성
 */
function createEdufineSummarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const records = fetchAllRecords();
  if (records.length === 0) {
    SpreadsheetApp.getUi().alert("등록된 근무기록이 없습니다.");
    return;
  }

  const sheetName = "에듀파인품의집계";
  let summarySheet = ss.getSheetByName(sheetName);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(sheetName);
  }
  summarySheet.clear();

  const headers = ["직종명", "인원수(명)", "근무일수(일)", "총인정시간(h)", "지급총액(원)", "비고"];
  summarySheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");

  const agg = {};
  records.forEach(r => {
    if (!agg[r.workerType]) {
      agg[r.workerType] = { count: 0, days: 0, hours: 0, pay: 0, workers: new Set() };
    }
    agg[r.workerType].days += 1;
    agg[r.workerType].hours += r.workHours;
    agg[r.workerType].pay += r.dailyPay;
    agg[r.workerType].workers.add(r.workerName);
  });

  const rows = [];
  let grandTotalHours = 0;
  let grandTotalPay = 0;

  for (const type in agg) {
    const item = agg[type];
    grandTotalHours += item.hours;
    grandTotalPay += item.pay;
    rows.push([type, item.workers.size, item.days, item.hours, item.pay, "정상 근무 확인"]);
  }

  rows.push(["합계", "-", "-", grandTotalHours, grandTotalPay, ""]);
  summarySheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  summarySheet.getRange(rows.length + 1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f1f5f9");

  SpreadsheetApp.getUi().alert("✅ '에듀파인품의집계' 시트가 성공적으로 생성되었습니다!");
}

/**
 * =========================================================================
 * [Google Apps Script 편집기 테스트용 함수]
 * 편집기 상단에서 함수를 선택하고 [실행] 버튼을 누를 때 사용하는 안전한 테스트 함수입니다.
 * =========================================================================
 */
function testDoGet() {
  const output = doGet();
  Logger.log("doGet 정상 실행 확인: " + output.getTitle());
}

function testFetchRecords() {
  const records = fetchAllRecords();
  Logger.log("현재 저장된 근무기록 건수: " + records.length + "건");
}

