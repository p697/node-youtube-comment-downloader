import { SORT_BY_POPULAR, YoutubeCommentDownloader } from '../src/downloader';

const proxyUrl = '';

const runTest = async () => {
  const downloader = new YoutubeCommentDownloader({
    proxy: {
      uri: proxyUrl,
    },
  });

  // Download comments from URL
  const comments = downloader.getCommentsFromUrl(
    'https://www.youtube.com/watch?v=PQUcIbSEBCM',
    SORT_BY_POPULAR,
  );

  // Print first 10 comments
  let count = 0;
  for await (const comment of comments) {
    console.log(comment);
    if (++count >= 20) break;
  }
};

runTest();
