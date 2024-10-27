class VideoPlayer {
    constructor() {
        this.player = null;
        // API 키를 직접 입력하는 방식으로 임시 변경
        this.youtubeService = new YoutubeService('AIzaSyDd52_WYRemvwauhJcJiZkFh0jauhqnsmU'); // 여기에 발급받은 API 키를 입력하세요
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('nextVideo').addEventListener('click', () => this.loadRandomVideo());
    }

    initPlayer() {
        if (typeof YT === 'undefined') {
            // YouTube IFrame API가 아직 로드되지 않은 경우
            window.onYouTubeIframeAPIReady = () => {
                this.createPlayer();
            };
        } else {
            // YouTube IFrame API가 이미 로드된 경우
            this.createPlayer();
        }
    }

    createPlayer() {
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1
            },
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this)
            }
        });
    }

    onPlayerReady(event) {
        // 플레이어가 준비되면 첫 비디오를 로드합니다
        this.loadRandomVideo();
    }

    onPlayerStateChange(event) {
        // 필요한 경우 여기에 상태 변경 처리를 추가합니다
    }

    async loadRandomVideo() {
        try {
            const video = await this.youtubeService.getRandomVideo();
            if (this.player && video) {
                this.player.loadVideoById(video.id);
                this.updateVideoInfo(video.snippet);
            }
        } catch (error) {
            console.error('비디오 로드 실패:', error);
            alert(error.message || '비디오를 불러오는데 실패했습니다.');
        }
    }

    updateVideoInfo(snippet) {
        document.getElementById('videoTitle').textContent = snippet.title;
        document.getElementById('channelTitle').textContent = snippet.channelTitle;
        document.getElementById('youtubeLink').href = `https://youtube.com/watch?v=${this.player.getVideoData().video_id}`;
    }
}

// 페이지 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new VideoPlayer();
    app.initPlayer();
});
