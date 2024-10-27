class YoutubeService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.categoryId = '10'; // Music category
        this.cache = new Map();
        
        // API 호출 제한 설정
        this.dailyQuotaLimit = 10000; // 일일 최대 쿼터
        this.quotaUsed = 0; // 사용된 쿼터
        this.quotaResetTime = this.getNextResetTime(); // 다음 쿼터 리셋 시간
        
        // localStorage에서 저장된 쿼터 정보 불러오기
        this.loadQuotaFromStorage();
    }

    // 다음 날 자정 시간 계산
    getNextResetTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    // localStorage에 쿼터 정보 저장
    saveQuotaToStorage() {
        const quotaInfo = {
            used: this.quotaUsed,
            resetTime: this.quotaResetTime
        };
        localStorage.setItem('youtubeQuota', JSON.stringify(quotaInfo));
    }

    // localStorage에서 쿼터 정보 불러오기
    loadQuotaFromStorage() {
        const savedQuota = localStorage.getItem('youtubeQuota');
        if (savedQuota) {
            const quotaInfo = JSON.parse(savedQuota);
            
            // 리셋 시간이 지났으면 쿼터 초기화
            if (Date.now() >= quotaInfo.resetTime) {
                this.resetQuota();
            } else {
                this.quotaUsed = quotaInfo.used;
                this.quotaResetTime = quotaInfo.resetTime;
            }
        }
    }

    // 쿼터 초기화
    resetQuota() {
        this.quotaUsed = 0;
        this.quotaResetTime = this.getNextResetTime();
        this.saveQuotaToStorage();
    }

    // API 호출 가능 여부 확인
    canMakeApiCall(cost = 1) {
        // 현재 시간이 리셋 시간을 지났으면 쿼터 초기화
        if (Date.now() >= this.quotaResetTime) {
            this.resetQuota();
            return true;
        }

        // 남은 쿼터 확인
        return (this.quotaUsed + cost) <= this.dailyQuotaLimit;
    }

    async getRandomVideo() {
        try {
            // 캐시된 비디오가 있으면 사용
            const cachedVideos = Array.from(this.cache.values())
                .filter(item => Date.now() - item.timestamp < 3600000); // 1시간 이내 캐시만 사용

            if (cachedVideos.length > 0) {
                const randomCached = cachedVideos[Math.floor(Math.random() * cachedVideos.length)];
                return randomCached.data;
            }

            // API 호출 가능 여부 확인 (videos.list는 약 1-2 유닛 소비)
            if (!this.canMakeApiCall(2)) {
                throw new Error('일일 API 할당량을 모두 사용했습니다. 내일 다시 시도해주세요.');
            }

            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=${this.categoryId}&maxResults=50&key=${this.apiKey}`);
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                throw new Error('비디오를 찾을 수 없습니다.');
            }

            // 쿼터 사용량 업데이트
            this.quotaUsed += 2;
            this.saveQuotaToStorage();

            // 받아온 비디오들을 캐시에 저장
            data.items.forEach(video => {
                this.cacheVideo(video.id, video);
            });

            const randomIndex = Math.floor(Math.random() * data.items.length);
            return data.items[randomIndex];
        } catch (error) {
            console.error('비디오 가져오기 실패:', error);
            throw error;
        }
    }

    cacheVideo(videoId, videoData) {
        this.cache.set(videoId, {
            data: videoData,
            timestamp: Date.now()
        });
    }
}
