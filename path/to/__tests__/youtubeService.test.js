const YoutubeService = require('../youtubeService');

test('getRandomVideo should return a video object', async () => {
  const video = await YoutubeService.getRandomVideo();
  expect(video).toHaveProperty('id');
  expect(video).toHaveProperty('title');
});
