/**
 * 태어난 도시 좌표 사전 (cities.ts)
 * ------------------------------------------------------------------
 * 어센던트와 하우스는 '태어난 곳'의 위도·경도와 그곳의 표준시에 따라 달라집니다.
 * 별자리(태양·달·행성)는 도시와 무관하지만, Whole Sign 하우스의 시작점이
 * 어센던트이므로 도시 입력이 결과 전체를 좌우합니다.
 *
 * - tz: 그 도시의 표준시 UTC 오프셋(시간). 서머타임은 반영하지 않습니다(프로토타입 한계, PLAN.md 참고).
 * - 좌표는 도시 중심 기준 소수점 4자리.
 */

export type City = {
  id: string;
  name: string;
  en: string;
  region: string;
  lat: number;
  lon: number;
  tz: number;
};

const KR = (id: string, name: string, en: string, region: string, lat: number, lon: number): City => ({
  id: `kr-${id}`,
  name,
  en,
  region,
  lat,
  lon,
  tz: 9,
});

const WORLD = (
  id: string,
  name: string,
  en: string,
  region: string,
  lat: number,
  lon: number,
  tz: number,
): City => ({ id: `w-${id}`, name, en, region, lat, lon, tz });

export const CITIES: City[] = [
  KR('seoul', '서울', 'Seoul', '서울', 37.5665, 126.978),
  KR('busan', '부산', 'Busan', '부산', 35.1796, 129.0756),
  KR('daegu', '대구', 'Daegu', '대구', 35.8714, 128.6014),
  KR('incheon', '인천', 'Incheon', '인천', 37.4563, 126.7052),
  KR('gwangju', '광주', 'Gwangju', '광주', 35.1595, 126.8526),
  KR('daejeon', '대전', 'Daejeon', '대전', 36.3504, 127.3845),
  KR('ulsan', '울산', 'Ulsan', '울산', 35.5384, 129.3114),
  KR('sejong', '세종', 'Sejong', '세종', 36.48, 127.289),
  KR('suwon', '수원', 'Suwon', '경기', 37.2636, 127.0286),
  KR('seongnam', '성남', 'Seongnam', '경기', 37.42, 127.1265),
  KR('goyang', '고양', 'Goyang', '경기', 37.6584, 126.832),
  KR('yongin', '용인', 'Yongin', '경기', 37.2411, 127.1776),
  KR('bucheon', '부천', 'Bucheon', '경기', 37.5034, 126.766),
  KR('ansan', '안산', 'Ansan', '경기', 37.3219, 126.8309),
  KR('anyang', '안양', 'Anyang', '경기', 37.3943, 126.9568),
  KR('namyangju', '남양주', 'Namyangju', '경기', 37.636, 127.2165),
  KR('hwaseong', '화성', 'Hwaseong', '경기', 37.1995, 126.8312),
  KR('pyeongtaek', '평택', 'Pyeongtaek', '경기', 36.9921, 127.1129),
  KR('uijeongbu', '의정부', 'Uijeongbu', '경기', 37.7381, 127.0337),
  KR('siheung', '시흥', 'Siheung', '경기', 37.38, 126.803),
  KR('paju', '파주', 'Paju', '경기', 37.7599, 126.78),
  KR('gimpo', '김포', 'Gimpo', '경기', 37.6153, 126.7156),
  KR('gwangmyeong', '광명', 'Gwangmyeong', '경기', 37.4786, 126.8646),
  KR('gunpo', '군포', 'Gunpo', '경기', 37.3614, 126.9352),
  KR('hanam', '하남', 'Hanam', '경기', 37.5393, 127.2148),
  KR('osan', '오산', 'Osan', '경기', 37.1498, 127.0771),
  KR('icheon', '이천', 'Icheon', '경기', 37.272, 127.435),
  KR('anseong', '안성', 'Anseong', '경기', 37.008, 127.28),
  KR('guri', '구리', 'Guri', '경기', 37.5943, 127.1296),
  KR('pocheon', '포천', 'Pocheon', '경기', 37.8949, 127.2003),
  KR('yangju', '양주', 'Yangju', '경기', 37.7853, 127.0457),
  KR('dongducheon', '동두천', 'Dongducheon', '경기', 37.9034, 127.0606),
  KR('gwacheon', '과천', 'Gwacheon', '경기', 37.4292, 126.9876),
  KR('yeoju', '여주', 'Yeoju', '경기', 37.298, 127.637),
  KR('chuncheon', '춘천', 'Chuncheon', '강원', 37.8813, 127.73),
  KR('wonju', '원주', 'Wonju', '강원', 37.3422, 127.9202),
  KR('gangneung', '강릉', 'Gangneung', '강원', 37.7519, 128.8761),
  KR('sokcho', '속초', 'Sokcho', '강원', 38.207, 128.5918),
  KR('donghae', '동해', 'Donghae', '강원', 37.5247, 129.1143),
  KR('samcheok', '삼척', 'Samcheok', '강원', 37.4499, 129.165),
  KR('taebaek', '태백', 'Taebaek', '강원', 37.1641, 128.9857),
  KR('hongcheon', '홍천', 'Hongcheon', '강원', 37.697, 127.888),
  KR('cheongju', '청주', 'Cheongju', '충북', 36.6424, 127.489),
  KR('chungju', '충주', 'Chungju', '충북', 36.991, 127.9259),
  KR('jecheon', '제천', 'Jecheon', '충북', 37.1326, 128.1911),
  KR('cheonan', '천안', 'Cheonan', '충남', 36.8151, 127.1139),
  KR('asan', '아산', 'Asan', '충남', 36.7898, 127.0018),
  KR('gongju', '공주', 'Gongju', '충남', 36.4465, 127.119),
  KR('seosan', '서산', 'Seosan', '충남', 36.7849, 126.4503),
  KR('nonsan', '논산', 'Nonsan', '충남', 36.1871, 127.0987),
  KR('boryeong', '보령', 'Boryeong', '충남', 36.3334, 126.6128),
  KR('dangjin', '당진', 'Dangjin', '충남', 36.8899, 126.6459),
  KR('jeonju', '전주', 'Jeonju', '전북', 35.8242, 127.148),
  KR('iksan', '익산', 'Iksan', '전북', 35.9483, 126.9576),
  KR('gunsan', '군산', 'Gunsan', '전북', 35.9676, 126.736),
  KR('jeongeup', '정읍', 'Jeongeup', '전북', 35.5699, 126.8561),
  KR('namwon', '남원', 'Namwon', '전북', 35.4164, 127.3905),
  KR('gimje', '김제', 'Gimje', '전북', 35.8032, 126.8809),
  KR('mokpo', '목포', 'Mokpo', '전남', 34.8118, 126.3922),
  KR('yeosu', '여수', 'Yeosu', '전남', 34.7604, 127.6622),
  KR('suncheon', '순천', 'Suncheon', '전남', 34.9506, 127.4872),
  KR('naju', '나주', 'Naju', '전남', 35.0158, 126.7109),
  KR('gwangyang', '광양', 'Gwangyang', '전남', 34.9407, 127.6958),
  KR('damyang', '담양', 'Damyang', '전남', 35.3214, 126.9881),
  KR('haenam', '해남', 'Haenam', '전남', 34.5737, 126.5991),
  KR('muan', '무안', 'Muan', '전남', 34.9904, 126.4818),
  KR('jangheung', '장흥', 'Jangheung', '전남', 34.6816, 126.9069),
  KR('gangjin', '강진', 'Gangjin', '전남', 34.6421, 126.7671),
  KR('wando', '완도', 'Wando', '전남', 34.311, 126.755),
  KR('jindo', '진도', 'Jindo', '전남', 34.4868, 126.263),
  KR('pohang', '포항', 'Pohang', '경북', 36.019, 129.3435),
  KR('gyeongju', '경주', 'Gyeongju', '경북', 35.8562, 129.2247),
  KR('gumi', '구미', 'Gumi', '경북', 36.1195, 128.3446),
  KR('andong', '안동', 'Andong', '경북', 36.5684, 128.7294),
  KR('gimcheon', '김천', 'Gimcheon', '경북', 36.1398, 128.1136),
  KR('yeongju', '영주', 'Yeongju', '경북', 36.8057, 128.624),
  KR('sangju', '상주', 'Sangju', '경북', 36.4109, 128.1591),
  KR('mungyeong', '문경', 'Mungyeong', '경북', 36.5866, 128.1867),
  KR('gyeongsan', '경산', 'Gyeongsan', '경북', 35.8251, 128.7415),
  KR('yeongdeok', '영덕', 'Yeongdeok', '경북', 36.415, 129.365),
  KR('uljin', '울진', 'Uljin', '경북', 36.993, 129.4005),
  KR('ulleung', '울릉', 'Ulleung', '경북', 37.4844, 130.9057),
  KR('changwon', '창원', 'Changwon', '경남', 35.2281, 128.6811),
  KR('gimhae', '김해', 'Gimhae', '경남', 35.2285, 128.8894),
  KR('yangsan', '양산', 'Yangsan', '경남', 35.335, 129.037),
  KR('jinju', '진주', 'Jinju', '경남', 35.1801, 128.1076),
  KR('geoje', '거제', 'Geoje', '경남', 34.8806, 128.6215),
  KR('tongyeong', '통영', 'Tongyeong', '경남', 34.8544, 128.4331),
  KR('sacheon', '사천', 'Sacheon', '경남', 35.0035, 128.0645),
  KR('miryang', '밀양', 'Miryang', '경남', 35.5038, 128.7466),
  KR('geochang', '거창', 'Geochang', '경남', 35.6866, 127.9094),
  KR('jeju', '제주', 'Jeju', '제주', 33.4996, 126.5312),
  KR('seogwipo', '서귀포', 'Seogwipo', '제주', 33.2541, 126.5601),

  WORLD('tokyo', '도쿄', 'Tokyo', '일본', 35.6762, 139.6503, 9),
  WORLD('osaka', '오사카', 'Osaka', '일본', 34.6937, 135.5023, 9),
  WORLD('fukuoka', '후쿠오카', 'Fukuoka', '일본', 33.5904, 130.4017, 9),
  WORLD('nagoya', '나고야', 'Nagoya', '일본', 35.1815, 136.9066, 9),
  WORLD('sapporo', '삿포로', 'Sapporo', '일본', 43.0618, 141.3545, 9),
  WORLD('okinawa', '오키나와', 'Okinawa', '일본', 26.2124, 127.6809, 9),
  WORLD('beijing', '베이징', 'Beijing', '중국', 39.9042, 116.4074, 8),
  WORLD('shanghai', '상하이', 'Shanghai', '중국', 31.2304, 121.4737, 8),
  WORLD('hongkong', '홍콩', 'Hong Kong', '중국', 22.3193, 114.1694, 8),
  WORLD('taipei', '타이베이', 'Taipei', '대만', 25.033, 121.5654, 8),
  WORLD('singapore', '싱가포르', 'Singapore', '싱가포르', 1.3521, 103.8198, 8),
  WORLD('bangkok', '방콕', 'Bangkok', '태국', 13.7563, 100.5018, 7),
  WORLD('hanoi', '하노이', 'Hanoi', '베트남', 21.0278, 105.8342, 7),
  WORLD('hochiminh', '호치민', 'Ho Chi Minh', '베트남', 10.8231, 106.6297, 7),
  WORLD('manila', '마닐라', 'Manila', '필리핀', 14.5995, 120.9842, 8),
  WORLD('jakarta', '자카르타', 'Jakarta', '인도네시아', -6.2088, 106.8456, 7),
  WORLD('delhi', '델리', 'Delhi', '인도', 28.6139, 77.209, 5.5),
  WORLD('dubai', '두바이', 'Dubai', 'UAE', 25.2048, 55.2708, 4),
  WORLD('istanbul', '이스탄불', 'Istanbul', '튀르키예', 41.0082, 28.9784, 3),
  WORLD('moscow', '모스크바', 'Moscow', '러시아', 55.7558, 37.6173, 3),
  WORLD('london', '런던', 'London', '영국', 51.5074, -0.1278, 0),
  WORLD('paris', '파리', 'Paris', '프랑스', 48.8566, 2.3522, 1),
  WORLD('berlin', '베를린', 'Berlin', '독일', 52.52, 13.405, 1),
  WORLD('rome', '로마', 'Rome', '이탈리아', 41.9028, 12.4964, 1),
  WORLD('madrid', '마드리드', 'Madrid', '스페인', 40.4168, -3.7038, 1),
  WORLD('barcelona', '바르셀로나', 'Barcelona', '스페인', 41.3874, 2.1686, 1),
  WORLD('amsterdam', '암스테르담', 'Amsterdam', '네덜란드', 52.3676, 4.9041, 1),
  WORLD('zurich', '취리히', 'Zurich', '스위스', 47.3769, 8.5417, 1),
  WORLD('vienna', '빈', 'Vienna', '오스트리아', 48.2082, 16.3738, 1),
  WORLD('prague', '프라하', 'Prague', '체코', 50.0755, 14.4378, 1),
  WORLD('newyork', '뉴욕', 'New York', '미국', 40.7128, -74.006, -5),
  WORLD('losangeles', '로스앤젤레스', 'Los Angeles', '미국', 34.0522, -118.2437, -8),
  WORLD('sanfrancisco', '샌프란시스코', 'San Francisco', '미국', 37.7749, -122.4194, -8),
  WORLD('seattle', '시애틀', 'Seattle', '미국', 47.6062, -122.3321, -8),
  WORLD('chicago', '시카고', 'Chicago', '미국', 41.8781, -87.6298, -6),
  WORLD('boston', '보스턴', 'Boston', '미국', 42.3601, -71.0589, -5),
  WORLD('washington', '워싱턴', 'Washington', '미국', 38.9072, -77.0369, -5),
  WORLD('miami', '마이애미', 'Miami', '미국', 25.7617, -80.1918, -5),
  WORLD('honolulu', '호놀룰루', 'Honolulu', '미국', 21.3069, -157.8583, -10),
  WORLD('toronto', '토론토', 'Toronto', '캐나다', 43.6532, -79.3832, -5),
  WORLD('vancouver', '밴쿠버', 'Vancouver', '캐나다', 49.2827, -123.1207, -8),
  WORLD('mexicocity', '멕시코시티', 'Mexico City', '멕시코', 19.4326, -99.1332, -6),
  WORLD('saopaulo', '상파울루', 'Sao Paulo', '브라질', -23.5505, -46.6333, -3),
  WORLD('buenosaires', '부에노스아이레스', 'Buenos Aires', '아르헨티나', -34.6037, -58.3816, -3),
  WORLD('sydney', '시드니', 'Sydney', '호주', -33.8688, 151.2093, 10),
  WORLD('melbourne', '멜버른', 'Melbourne', '호주', -37.8136, 144.9631, 10),
  WORLD('auckland', '오클랜드', 'Auckland', '뉴질랜드', -36.8485, 174.7633, 12),
  WORLD('cairo', '카이로', 'Cairo', '이집트', 30.0444, 31.2357, 2),
  WORLD('johannesburg', '요하네스버그', 'Johannesburg', '남아공', -26.2041, 28.0473, 2),
  WORLD('nairobi', '나이로비', 'Nairobi', '케냐', -1.2921, 36.8219, 3),
];

export const DEFAULT_CITY: City = CITIES[0];

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 이름·영문·지역으로 도시를 찾습니다. 정확히 일치 → 앞부분 일치 → 포함 순. */
export function searchCities(query: string, limit = 6): City[] {
  const q = normalize(query);
  if (!q) return CITIES.slice(0, limit);
  const exact: City[] = [];
  const prefix: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const fields = [normalize(c.name), normalize(c.en), normalize(c.region)];
    if (fields.some((f) => f === q)) exact.push(c);
    else if (fields.some((f) => f.startsWith(q))) prefix.push(c);
    else if (fields.some((f) => f.includes(q))) contains.push(c);
  }
  return [...exact, ...prefix, ...contains].slice(0, limit);
}

export function findCity(query: string): City | null {
  const q = normalize(query);
  if (!q) return null;
  return CITIES.find((c) => normalize(c.name) === q || normalize(c.en) === q) ?? null;
}
