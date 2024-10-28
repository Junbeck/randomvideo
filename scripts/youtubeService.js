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
        
        // 최근 재생된 비디오 히스토리
        this.playHistory = [];
        this.maxHistory = 10; // 히스토리에 저장할 최대 비디오 수
        this.loadHistoryFromStorage(); // 히스토리 로드
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

    // 히스토리에 비디오 추가
    addToHistory(videoId) {
        this.playHistory.push(videoId);
        if (this.playHistory.length > this.maxHistory) {
            this.playHistory.shift(); // 가장 오래된 비디오 제거
        }
    }

    // 히스토리를 localStorage에 저장
    saveHistoryToStorage() {
        localStorage.setItem('youtubePlayHistory', JSON.stringify(this.playHistory));
    }

    // localStorage에서 히스토리 불러오기
    loadHistoryFromStorage() {
        const savedHistory = localStorage.getItem('youtubePlayHistory');
        if (savedHistory) {
            this.playHistory = JSON.parse(savedHistory);
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

            // 히스토리에 없는 비디오 필터링
            const availableVideos = cachedVideos.filter(video => 
                !this.playHistory.includes(video.data.id)
            );

            let video;

            if (availableVideos.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableVideos.length);
                video = availableVideos[randomIndex].data;
            } else {
                // 모든 캐시된 비디오가 히스토리에 있으면 히스토리 초기화 후 다시 시도
                this.playHistory = [];
                this.saveHistoryToStorage();
                
                if (cachedVideos.length > 0) {
                    const randomIndex = Math.floor(Math.random() * cachedVideos.length);
                    video = cachedVideos[randomIndex].data;
                }
            }

            if (video) {
                this.addToHistory(video.id);
                this.saveHistoryToStorage();
                return video;
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

            // 히스토리에 없는 비디오 필터링
            const newAvailableVideos = data.items.filter(video => 
                !this.playHistory.includes(video.id)
            );

            if (newAvailableVideos.length > 0) {
                const randomIndex = Math.floor(Math.random() * newAvailableVideos.length);
                video = newAvailableVideos[randomIndex];
            } else {
                // 모든 비디오가 히스토리에 있으면 히스토리 초기화 후 다시 선택
                this.playHistory = [];
                this.saveHistoryToStorage();
                const randomIndex = Math.floor(Math.random() * data.items.length);
                video = data.items[randomIndex];
            }

            if (video) {
                this.addToHistory(video.id);
                this.saveHistoryToStorage();
                return video;
            } else {
                throw new Error('적절한 비디오를 찾을 수 없습니다.');
            }

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
