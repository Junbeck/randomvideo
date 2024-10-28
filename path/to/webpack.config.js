const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'bundle.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // 기존 설정...
  devtool: 'source-map', // 'eval' 대신 'source-map' 사용
  // 기타 최적화 설정...
};
