class ShoppingDashboard {
    constructor() {
        this.currentData = [];
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    initializeElements() {
        this.platformSelect = document.getElementById('platform');
        this.categorySelect = document.getElementById('category');
        this.sortSelect = document.getElementById('sort');
        this.searchInput = document.getElementById('search');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.excelBtn = document.getElementById('excelBtn');
        this.loading = document.getElementById('loading');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultCount = document.getElementById('resultCount');
        this.productsGrid = document.getElementById('productsGrid');
    }

    attachEventListeners() {
        this.refreshBtn.addEventListener('click', () => this.loadData());
        this.excelBtn.addEventListener('click', () => this.downloadExcel());
        this.platformSelect.addEventListener('change', () => this.loadData());
        this.categorySelect.addEventListener('change', () => this.loadData());
        this.sortSelect.addEventListener('change', () => this.loadData());
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadData();
            }
        });
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.productsGrid.innerHTML = '';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    async loadData() {
        this.showLoading();
        
        const platform = this.platformSelect.value;
        const category = this.categorySelect.value;
        const sort = this.sortSelect.value;
        const query = this.searchInput.value;

        try {
            let url;
            if (platform === 'naver') {
                url = `/api/naver?category=${category}&sort=${sort}&display=100`;
                if (query) url += `&query=${encodeURIComponent(query)}`;
            } else {
                url = `/api/coupang?category=${category}&limit=100`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.currentData = data.items;
                this.displayProducts(data.items);
                this.updateResultsInfo(data.items.length, platform);
            } else {
                throw new Error(data.message || '데이터 로드 실패');
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.productsGrid.innerHTML = `
                
                    
                    데이터를 불러올 수 없습니다
                    ${error.message}
                    
                         새로고침
                    
                
            `;
        } finally {
            this.hideLoading();
        }
    }

    displayProducts(products) {
        if (!products || products.length === 0) {
            this.productsGrid.innerHTML = `
                
                    검색 결과가 없습니다
                    다른 검색어나 카테고리를 시도해보세요.
                
            `;
            return;
        }

        this.productsGrid.innerHTML = products.map(product => `
            
                ${product.rank}
                
                ${product.title}
                ${product.price}
                ${product.mallName}
                
                     구매하기
                
            
        `).join('');
    }

    updateResultsInfo(count, platform) {
        const platformName = platform === 'naver' ? '네이버' : '쿠팡';
        this.resultsTitle.textContent = `${platformName} 검색 결과`;
        this.resultCount.textContent = `${count}개 상품`;
    }

    downloadExcel() {
        if (!this.currentData || this.currentData.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const csvContent = [
            ['순위', '상품명', '가격', '쇼핑몰', '카테고리', '브랜드'],
            ...this.currentData.map(product => [
                product.rank,
                product.title.replace(/,/g, ' '),
                product.price,
                product.mallName,
                product.category || '',
                product.brand || ''
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `shopping-data-${timestamp}.csv`;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    loadInitialData() {
        this.loadData();
    }
}

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ShoppingDashboard();
});
