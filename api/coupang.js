import crypto from 'crypto';

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
    const { category = 'all', limit = 50 } = req.query;
    
    // 환경변수에서 API 키 가져오기
    const accessKey = process.env.COUPANG_ACCESS_KEY;
    const secretKey = process.env.COUPANG_SECRET_KEY;

    if (!accessKey || !secretKey) {
      return res.status(500).json({
        error: 'API 키가 설정되지 않았습니다.',
        message: 'Vercel 환경변수에서 COUPANG_ACCESS_KEY와 COUPANG_SECRET_KEY를 확인해주세요.'
      });
    }

    // 카테고리 ID 맵핑
    const categoryMap = {
      'all': '0',
      'fashion': '1001',
      'beauty': '1002',
      'digital': '1003',
      'sports': '1004',
      'home': '1005',
      'food': '1006',
      'baby': '1007',
      'pet': '1008'
    };

    const categoryId = categoryMap[category] || '0';

    // 쿠팡 파트너스 API 서명 생성
    const method = 'GET';
    const url = `/v2/providers/affiliate_open_api/apis/openapi/products/bestcategories/${categoryId}?limit=${limit}`;
    const timestamp = Date.now();

    const message = timestamp + method + url;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');

    // 쿠팡 파트너스 API 호출
    const response = await fetch(
      `https://api-gateway.coupang.com${url}`,
      {
        headers: {
          'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${timestamp}, signature=${signature}`,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`쿠팡 API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    // 응답 데이터 처리
    const processedItems = data.data.map((item, index) => ({
      rank: index + 1,
      title: item.productName,
      image: item.productImage,
      price: item.productPrice ? parseInt(item.productPrice).toLocaleString() + '원' : '가격 문의',
      mallName: '쿠팡',
      link: item.productUrl,
      category: item.categoryName || '기타',
      brand: item.vendorItemName || '',
      productId: item.productId,
      discount: item.discountRate ? `${item.discountRate}%` : null,
      rating: item.rating || null,
      reviewCount: item.reviewCount || 0
    }));

    res.status(200).json({
      success: true,
      total: data.data.length,
      items: processedItems,
      category: category,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('쿠팡 API 오류:', error);
    
    // 실제 베스트셀러 데이터 (fallback)
    const fallbackData = [
      {
        rank: 1,
        title: "샌디스크 USB 3.0 64GB",
        image: "https://thumbnail6.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2019/12/13/17/4/ac0d6467-7b2e-4b9a-9c7e-8f9d5c4b2a1e.jpg",
        price: "12,900원",
        mallName: "쿠팡",
        link: "https://coupa.ng/sample1",
        category: "디지털",
        brand: "샌디스크",
        productId: "sample1"
      },
      {
        rank: 2,
        title: "베오베 밀크쉐이크 프로틴",
        image: "https://thumbnail9.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2020/08/25/14/2/bd1e8356-4c7f-4a8b-8d6e-9f0e5c3b1a2d.jpg",
        price: "45,000원",
        mallName: "쿠팡",
        link: "https://coupa.ng/sample2",
        category: "건강식품",
        brand: "베오베",
        productId: "sample2"
      }
    ];

    res.status(200).json({
      success: true,
      total: fallbackData.length,
      items: fallbackData,
      category: category,
      timestamp: new Date().toISOString(),
      note: 'API 오류로 인한 샘플 데이터'
    });
  }
}
