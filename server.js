const express = require('express');
const app = express();

// 정적 파일 제공
app.use(express.static('./'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.`);
});
