// Simple i18n service for English/Korean
const translations = {
  en: {
    // CompassView
    compassPermissionTitle: 'Compass Permission Required',
    compassPermissionDesc: 'This app needs access to your device\'s compass to show directions.',
    enableCompass: 'Enable Compass',
    permissionNote: 'Note: Make sure you\'re using HTTPS and on a mobile device with compass sensor.',
    loadingMarkers: 'Loading markers…',
    calibratingCompass: 'Calibrating compass…',
    noMarkers: 'No markers — tap Setup',
    waitingGPS: 'Waiting for GPS…',
    direction: 'direction',
    latitude: 'Latitude',
    longitude: 'Longitude',
    elevation: 'Elevation',
    accuracy: 'Accuracy',
    distance: 'Distance',
    saved: 'Saved',
    calculating: 'Calculating...',
    tapFloorPlan: 'Tap floor plan to set position',
    setupMarkers: '📍 Setup Markers',
    
    // FloorPlanUpload
    setupTitle: 'Setup',
    uploadFloorPlan: 'Upload Floor Plan',
    uploadImage: 'Upload Image',
    removeFloorPlan: 'Remove Floor Plan',
    saveMarker: 'Save Current Position',
    markerName: 'Marker Name',
    markerNamePlaceholder: 'e.g., Exit A',
    saveButton: 'Save',
    savedMarkers: 'Saved Markers',
    noSavedMarkers: 'No saved markers yet',
    deleteButton: 'Delete',
    backToCompass: 'Back to Compass',
    gpsNotAvailable: 'GPS not available',
    pleaseEnterName: 'Please enter a marker name',
    
    // Units
    meters: 'm',
    kilometers: 'km',
  },
  ko: {
    // CompassView
    compassPermissionTitle: '나침반 권한 필요',
    compassPermissionDesc: '이 앱은 방향을 표시하기 위해 기기의 나침반에 접근해야 합니다.',
    enableCompass: '나침반 활성화',
    permissionNote: '참고: HTTPS를 사용하고 나침반 센서가 있는 모바일 기기에서 실행해야 합니다.',
    loadingMarkers: '마커 로딩 중…',
    calibratingCompass: '나침반 보정 중…',
    noMarkers: '마커 없음 — 설정 탭',
    waitingGPS: 'GPS 대기 중…',
    direction: '방향',
    latitude: '위도',
    longitude: '경도',
    elevation: '고도',
    accuracy: '정확도',
    distance: '거리',
    saved: '저장됨',
    calculating: '계산 중...',
    tapFloorPlan: '평면도를 탭하여 위치 설정',
    setupMarkers: '📍 마커 설정',
    
    // FloorPlanUpload
    setupTitle: '설정',
    uploadFloorPlan: '평면도 업로드',
    uploadImage: '이미지 업로드',
    removeFloorPlan: '평면도 제거',
    saveMarker: '현재 위치 저장',
    markerName: '마커 이름',
    markerNamePlaceholder: '예: 출구 A',
    saveButton: '저장',
    savedMarkers: '저장된 마커',
    noSavedMarkers: '저장된 마커가 없습니다',
    deleteButton: '삭제',
    backToCompass: '나침반으로 돌아가기',
    gpsNotAvailable: 'GPS를 사용할 수 없습니다',
    pleaseEnterName: '마커 이름을 입력하세요',
    
    // Units
    meters: 'm',
    kilometers: 'km',
  }
};

let currentLanguage = localStorage.getItem('appLanguage') || 'en';

export const getLanguage = () => currentLanguage;

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    // Trigger storage event for other components
    window.dispatchEvent(new Event('languagechange'));
  }
};

export const t = (key) => {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
};

export const useTranslation = () => {
  return { t, getLanguage, setLanguage };
};
