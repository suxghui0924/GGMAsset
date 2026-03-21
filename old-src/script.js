document.addEventListener('DOMContentLoaded', () => {
    const assetGrid = document.getElementById('assetGrid');
    const searchInput = document.getElementById('searchInput');
    const resultCount = document.getElementById('resultCount');
    const noResults = document.getElementById('noResults');
    const pageTitle = document.getElementById('pageTitle');
    const categoryItems = document.querySelectorAll('#categoryList li');
    const resetBtn = document.getElementById('resetFilters');
    const sortSelect = document.getElementById('sortSelect');

    let currentCategory = 'all';
    let currentSearch = '';
    let currentSort = 'name';

    if (typeof assets === 'undefined') {
        console.error("Asset data could not be loaded.");
        resultCount.textContent = "오류: 데이터베이스 연결 실패";
        return;
    }

    const renderCards = () => {
        assetGrid.innerHTML = '';

        // 검색어와 카테고리 필터 동시 적용
        let filtered = assets.filter(asset => {
            const matchesSearch = asset.title.toLowerCase().includes(currentSearch.toLowerCase());
            const matchesCategory = currentCategory === 'all' ||
                asset.tags.some(tag => {
                    if (currentCategory === 'UI') return tag.includes('UI');
                    if (currentCategory === 'Misc') return tag.includes('기타');
                    if (currentCategory === 'VFX') return tag.includes('VFX');
                    if (currentCategory === '3D') return tag.includes('3D');
                    return tag === currentCategory;
                });
            return matchesSearch && matchesCategory;
        });

        // 정렬 적용
        if (currentSort === 'name') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (currentSort === 'newest') {
            filtered.sort((a, b) => b.id - a.id);
        }

        if (filtered.length === 0) {
            assetGrid.classList.add('hidden');
            noResults.classList.remove('hidden');
            resultCount.textContent = `0 개의 결과`;
            return;
        }

        assetGrid.classList.remove('hidden');
        noResults.classList.add('hidden');
        resultCount.textContent = `${filtered.length} 개의 결과`;

        const fragment = document.createDocumentFragment();

        filtered.forEach((asset) => {
            const card = document.createElement('div');
            card.className = 'asset-card';

            const tagText = asset.tags ? asset.tags.join(', ') : '패키지';
            const searchQuery = encodeURIComponent(`${asset.title}.unitypackage`);
            const driveSearchUrl = `https://drive.google.com/drive/search?q=${searchQuery}`;
            const storeUrl = asset.storeUrl || `https://assetstore.unity.com/?q=${encodeURIComponent(asset.title)}`;

            // 유튜브 및 비디오 핸들링 로직
            let mediaHtml = '';
            const imgUrl = asset.image || `https://picsum.photos/400/250?grayscale`;

            // 유튜브 ID 추출 정규식
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const ytMatch = imgUrl.match(ytRegex);

            if (ytMatch) {
                const videoId = ytMatch[1];
                const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                // 배경으로 썸네일을 깔고 그 위에 iframe을 올립니다.
                // 오리진 설정을 추가하여 로컬 환경(file://)에서의 오류 가능성을 줄입니다.
                const origin = window.location.origin === "null" ? "" : `&origin=${window.location.origin}`;

                mediaHtml = `
                    <div class="yt-wrapper" style="background-image: url('${thumbnail}'), url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg');">
                        <iframe class="card-media" 
                            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1${origin}" 
                            frameborder="0" 
                            allow="autoplay; encrypted-media" 
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin"></iframe>
                    </div>`;
            } else if (imgUrl.match(/\.(mp4|webm|ogg)$/i)) {
                mediaHtml = `<video src="${imgUrl}" autoplay muted loop playsinline class="card-media"></video>`;
            } else {
                mediaHtml = `<img src="${imgUrl}" alt="${asset.title}" class="card-media" loading="lazy" onerror="this.src='no-image.png';">`;
            }

            card.innerHTML = `
                <div class="card-image">
                    ${mediaHtml}
                    <div class="media-overlay"></div>
                </div>
                <div class="card-content">
                    <div class="card-tag" title="${tagText}">${tagText}</div>
                    <h3 class="card-title" title="${asset.title}">${asset.title}</h3>
                    <div class="card-type">유니티 패키지</div>
                    
                    <div class="card-actions">
                        <a href="${driveSearchUrl}" target="_blank" class="btn-primary">다운로드</a>
                        <a href="${storeUrl}" target="_blank" class="btn-secondary">스토어</a>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });

        assetGrid.appendChild(fragment);
    };

    // 초기 렌더링
    renderCards();

    // 검색 핸들러
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        renderCards();
    });

    // 정렬 핸들러
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderCards();
    });

    // 카테고리 클릭 핸들러
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            currentCategory = item.getAttribute('data-category');
            pageTitle.textContent = currentCategory === 'all' ? '모든 카테고리의 에셋' : `카테고리: "${item.textContent}"`;
            renderCards();
        });
    });

    // 초기화 버튼 핸들러
    resetBtn.addEventListener('click', () => {
        currentSearch = '';
        currentCategory = 'all';
        currentSort = 'name';

        searchInput.value = '';
        sortSelect.value = 'name';
        categoryItems.forEach(i => i.classList.remove('active'));
        categoryItems[0].classList.add('active');
        pageTitle.textContent = '모든 카테고리의 에셋';

        renderCards();
    });

    console.log("%c[SYSTEM] GGM 유니티 스토어 스타일 인터페이스 활성화됨.", "color: #0078d4; font-weight: bold;");
});
