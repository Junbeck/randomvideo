// 예시: 유효한 비디오 ID를 사용하는지 확인
const videoId = "유효한_비디오_ID";
const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=YOUR_API_KEY&part=snippet,contentDetails,statistics`);
