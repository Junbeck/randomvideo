class VideoPlayer {
    constructor() {
        this.player = null;
        // config.js 파일에서 API 키를 불러옵니다
        this.youtubeService = new YoutubeService(config.YOUTUBE_API_KEY);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('nextVideo').addEventListener('click', () => this.loadRandomVideo());
        document.getElementById('playPause').addEventListener('click', () => {
            if (this.player.getPlayerState() === YT.PlayerState.PLAYING) {
                this.player.pauseVideo();
            } else {
                this.player.playVideo();
            }
        });

        document.getElementById('muteButton').addEventListener('click', () => {
            if (this.player.isMuted()) {
                this.player.unMute();
            } else {
                this.player.mute();
            }
        });

        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.player.setVolume(e.target.value);
        });

        document.getElementById('fullscreen').addEventListener('click', () => {
            const iframe = document.querySelector('#youtube-player');
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            }
        });
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
