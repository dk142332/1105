// Vercel 서버리스 함수 엔드포인트 주소입니다 (/api/dust?sido=지역명).
const API_URL = '/api/dust';

// 화면의 주요 DOM 요소들을 가져옵니다.
const sidoSelect = document.getElementById('sidoSelect');
const summaryAreaTitle = document.getElementById('summaryAreaTitle');
const averagePm10Element = document.getElementById('averagePm10');
const averageStatusElement = document.getElementById('averageStatus');
const cardGrid = document.getElementById('cardGrid');

// 미세먼지 수치에 대한 유효성을 검사하고 표시용 문자열을 반환하는 함수입니다.
function formatDustValue(value) {
  // 측정값이 없거나 '-' 기호일 경우 '측정 안 됨'으로 표시합니다.
  if (!value || value.trim() === '-' || isNaN(Number(value))) {
    return '측정 안 됨';
  }
  // 정상적인 수치일 경우 단위(µg/m³)를 붙여 반환합니다.
  return `${value} µg/m³`;
}

// 에어코리아 pm10Grade 등급 코드(1~4)에 따른 라벨 및 CSS 클래스를 반환하는 함수입니다.
function getGradeInfo(grade) {
  // 등급별 텍스트 및 클래스 매핑 객체입니다.
  switch (grade) {
    case '1':
      return { text: '좋음', className: 'grade-1' };
    case '2':
      return { text: '보통', className: 'grade-2' };
    case '3':
      return { text: '나쁨', className: 'grade-3' };
    case '4':
      return { text: '매우나쁨', className: 'grade-4' };
    default:
      // 등급 값이 비어있거나 올바르지 않으면 기본 회색 스타일을 적용합니다.
      return { text: '정보 없음', className: 'grade-unknown' };
  }
}

// 평균 미세먼지 수치에 따른 등급 텍스트와 색상을 설정하는 함수입니다.
function updateSummaryCard(averageValue, sidoName) {
  // 요약 영역의 제목을 현재 선택된 시도로 변경합니다.
  summaryAreaTitle.textContent = `${sidoName} 평균 미세먼지`;

  // 유효한 평균값이 없는 경우의 예외 처리입니다.
  if (averageValue === null) {
    averagePm10Element.textContent = '-';
    averageStatusElement.textContent = '유효한 측정 데이터가 없습니다.';
    return;
  }

  // 계산된 평균 수치를 반올림하여 큰 숫자로 표시합니다.
  averagePm10Element.textContent = `${averageValue} µg/m³`;

  // 한국 환경부 미세먼지(PM10) 기준에 따른 상태 메시지를 안내합니다.
  if (averageValue <= 30) {
    averageStatusElement.textContent = '현재 대기질 상태: 좋음 (파랑)';
  } else if (averageValue <= 80) {
    averageStatusElement.textContent = '현재 대기질 상태: 보통 (초록)';
  } else if (averageValue <= 150) {
    averageStatusElement.textContent = '현재 대기질 상태: 나쁨 (주황)';
  } else {
    averageStatusElement.textContent = '현재 대기질 상태: 매우나쁨 (빨강)';
  }
}

// 측정소 목록 데이터를 받아 화면에 카드 형태로 렌더링하는 함수입니다.
function renderCards(stationList, sidoName) {
  // 기존 카드 목록을 모두 비웁니다.
  cardGrid.innerHTML = '';

  // 유효한 미세먼지 합산 점수와 유효한 측정소 수를 카운트하기 위한 변수입니다.
  let validPm10Total = 0;
  let validStationCount = 0;

  // 측정소 목록을 순회하며 카드를 생성합니다.
  stationList.forEach(item => {
    // 측정소 이름, 미세먼지, 초미세먼지, 측정 시각, 등급을 추출합니다.
    const stationName = item.stationName || '알 수 없음';
    const pm10Raw = item.pm10Value;
    const pm25Raw = item.pm25Value;
    const dataTime = item.dataTime || '-';
    const pm10Grade = item.pm10Grade;

    // 측정값이 '-'이거나 숫자가 아닐 경우 평균 계산에서 제외합니다.
    if (pm10Raw && pm10Raw.trim() !== '-' && !isNaN(Number(pm10Raw))) {
      validPm10Total += Number(pm10Raw);
      validStationCount += 1;
    }

    // 등급 정보(클래스명, 등급 텍스트)를 가져옵니다.
    const gradeInfo = getGradeInfo(pm10Grade);

    // 카드 요소를 생성합니다.
    const card = document.createElement('div');
    // 공통 카드 클래스와 등급별 색상 클래스를 함께 부여합니다.
    card.className = `dust-card ${gradeInfo.className}`;

    // 카드의 내부 HTML 구조를 조립합니다.
    card.innerHTML = `
      <div class="card-header">
        <span class="station-name">${stationName}</span>
        <span class="grade-badge">${gradeInfo.text}</span>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">미세먼지 (PM10)</span>
          <span class="info-value">${formatDustValue(pm10Raw)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">초미세먼지 (PM2.5)</span>
          <span class="info-value">${formatDustValue(pm25Raw)}</span>
        </div>
      </div>
      <div class="card-footer">
        측정 시각: ${dataTime}
      </div>
    `;

    // 완성된 카드를 그리드에 추가합니다.
    cardGrid.appendChild(card);
  });

  // 유효한 측정소가 있다면 평균을 계산하고, 없다면 null을 전달합니다.
  const averageValue = validStationCount > 0 ? Math.round(validPm10Total / validStationCount) : null;
  // 평균 수치 요약 카드를 업데이트합니다.
  updateSummaryCard(averageValue, sidoName);
}

// 선택된 시도의 대기오염 데이터를 Vercel 서버리스 API(/api/dust)로부터 호출하는 함수입니다.
async function fetchAirData(sidoName) {
  // 데이터 로딩 중임을 사용자에게 표시합니다.
  averagePm10Element.textContent = '...';
  averageStatusElement.textContent = `${sidoName} 지역 대기질 정보를 불러오는 중입니다...`;
  cardGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #777;">데이터를 불러오는 중입니다...</p>';

  try {
    // /api/dust?sido=지역명 형태로 서버리스 함수를 호출합니다.
    const response = await fetch(`${API_URL}?sido=${encodeURIComponent(sidoName)}`);
    const data = await response.json();

    // 서버리스 함수에서 에러 응답(한국어 메시지)을 보냈을 때 처리합니다.
    if (!response.ok || data.error) {
      throw new Error(data.error || '서버 응답 오류가 발생했습니다.');
    }

    // 응답 데이터에서 측정소 아이템 목록을 추출합니다.
    const items = data?.response?.body?.items;

    // 데이터가 비어있거나 유효하지 않은 경우 안내 메시지를 표시합니다.
    if (!items || items.length === 0) {
      averagePm10Element.textContent = '-';
      averageStatusElement.textContent = '조회된 측정소 데이터가 없습니다.';
      cardGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #777;">조회된 측정소가 없습니다.</p>';
      return;
    }

    // 정상적으로 수신된 데이터를 바탕으로 카드를 렌더링합니다.
    renderCards(items, sidoName);
  } catch (error) {
    // 에러 발생 시 한국어 메시지를 화면에 출력합니다.
    console.error('대기오염 정보 로드 실패:', error);
    averagePm10Element.textContent = '!';
    averageStatusElement.textContent = error.message;
    cardGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #e53e3e;">${error.message}</p>`;
  }
}

// 시도 선택 드롭다운의 값이 변경되었을 때 실행되는 이벤트 리스너입니다.
sidoSelect.addEventListener('change', (event) => {
  // 선택된 시도 이름을 가져옵니다.
  const selectedSido = event.target.value;
  // 변경된 시도로 서버리스 API를 호출합니다.
  fetchAirData(selectedSido);
});

// 페이지가 처음 로드되었을 때 기본 선택값(서울)으로 데이터를 조회합니다.
window.addEventListener('DOMContentLoaded', () => {
  fetchAirData(sidoSelect.value);
});
