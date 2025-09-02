export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query, category = 'all', sort = 'sim', start = 1, display = 50 } = req.query;
    
    // 환경변수에서 API 키 가져오기
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'API 키가 설정되지 않았습니다.',
        message: 'Vercel 환경변수에서 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 확인해주세요.'
      });
    }

    // 검색어 설정 (카테고리별)
    let searchQuery = query || '인기상품';
    if (category !== 'all') {
      const categoryMap = {
        'fashion': '패션',
        'beauty': '화장품',
        'digital': '디지털',
        'sports': '스포츠',
        'home': '생활용품',
        'food': '식품',
        'baby': '유아용품',
        'pet': '반려동물용품'
      };
      searchQuery = categoryMap[category] || searchQuery;
    }

    // 네이버 쇼핑 API 호출
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(searchQuery)}&start=${start}&display=${display}&sort=${sort}`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'User-Agent': 'Mozilla/5.0 (compatible; NaverShoppingBot/1.0)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    // 응답 데이터 처리
    const processedItems = data.items.map((item, index) => ({
      rank: parseInt(start) + index,
      title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      image: item.image,
      price: item.lprice ? parseInt(item.lprice).toLocaleString() + '원' : '가격 문의',
      mallName: item.mallName,
      link: item.link,
      category: item.category1 || '기타',
      brand: item.brand || '',
      productId: item.productId || Math.random().toString(36).substr(2, 9)
    }));

    res.status(200).json({
      success: true,
      total: data.total,
      start: data.start,
      display: data.display,
      items: processedItems,
      query: searchQuery,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('네이버 API 오류:', error);
    res.status(500).json({
      error: '네이버 API 호출 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
