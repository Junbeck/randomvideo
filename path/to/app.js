async function loadRandomVideo() {
    try {
        const video = await YoutubeService.getRandomVideo();
        // 비디오를 플레이어에 로드하는 로직
    } catch (error) {
        console.error("비디오 로드 실패:", error);
        // 사용자에게 오류 메시지 표시
    }
}
