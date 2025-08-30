import { YoutubeCommentDownloader, SORT_BY_POPULAR, SORT_BY_RECENT } from '../src/downloader';
import { Comment } from '../src/types';

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=PQUcIbSEBCM';
const TEST_VIDEO_ID = 'PQUcIbSEBCM';

function validateComment(comment: Comment): void {
  // Required fields validation
  expect(typeof comment.cid).toBe('string');
  expect(comment.cid.length).toBeGreaterThan(0);

  expect(typeof comment.text).toBe('string');
  expect(comment.text.length).toBeGreaterThan(0);

  expect(typeof comment.time).toBe('string');
  expect(comment.time.length).toBeGreaterThan(0);

  expect(typeof comment.author).toBe('string');
  expect(comment.author.length).toBeGreaterThan(0);

  expect(typeof comment.channel).toBe('string');
  expect(comment.channel.length).toBeGreaterThan(0);

  expect(typeof comment.votes).toBe('string');

  expect(typeof comment.replies).toBe('number');
  expect(comment.replies).toBeGreaterThanOrEqual(0);

  expect(typeof comment.photo).toBe('string');
  expect(comment.photo.length).toBeGreaterThan(0);

  expect(typeof comment.heart).toBe('boolean');
  expect(typeof comment.reply).toBe('boolean');

  // Optional fields validation
  if (comment.time_parsed !== undefined) {
    expect(typeof comment.time_parsed).toBe('number');
    expect(comment.time_parsed).toBeGreaterThan(0);
  }

  if (comment.paid !== undefined) {
    expect(typeof comment.paid).toBe('string');
  }
}

describe('Integration Tests - Real YouTube Video', () => {
  let downloader: YoutubeCommentDownloader;

  beforeAll(() => {
    downloader = new YoutubeCommentDownloader();
  });

  describe('Download comments by video ID', () => {
    test('should download recent comments successfully', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_RECENT, 'en', 0);

      let count = 0;
      const maxComments = 10;

      try {
        for await (const comment of generator) {
          comments.push(comment);
          validateComment(comment);
          count++;

          // Log first comment for debugging
          if (count === 1) {
            console.log('First comment sample:', {
              author: comment.author,
              textPreview: comment.text.substring(0, 50) + '...',
              time: comment.time,
              votes: comment.votes,
              replies: comment.replies,
            });
          }

          if (count >= maxComments) {
            break;
          }
        }
      } catch (error) {
        console.error('Error during comment download:', error);
        throw error;
      }

      expect(comments.length).toBeGreaterThan(0);
      expect(comments.length).toBeLessThanOrEqual(maxComments);

      // Verify we have both main comments and potentially some replies
      const mainComments = comments.filter((c) => !c.reply);
      const replyComments = comments.filter((c) => c.reply);

      expect(mainComments.length).toBeGreaterThan(0);
      console.log(
        `Downloaded ${mainComments.length} main comments and ${replyComments.length} replies`,
      );
    }, 60000);

    test('should download popular comments successfully', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_POPULAR, 'en', 0);

      let count = 0;
      const maxComments = 5;

      for await (const comment of generator) {
        comments.push(comment);
        validateComment(comment);
        count++;

        if (count >= maxComments) {
          break;
        }
      }

      expect(comments.length).toBeGreaterThan(0);
      expect(comments.length).toBeLessThanOrEqual(maxComments);

      // Popular comments should generally have more votes
      console.log(
        'Popular comments votes:',
        comments.map((c) => c.votes),
      );
    }, 60000);
  });

  describe('Download comments by video URL', () => {
    test('should download comments from URL successfully', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getCommentsFromUrl(TEST_VIDEO_URL, SORT_BY_RECENT, 'en', 0);

      let count = 0;
      const maxComments = 5;

      for await (const comment of generator) {
        comments.push(comment);
        validateComment(comment);
        count++;

        if (count >= maxComments) {
          break;
        }
      }

      expect(comments.length).toBeGreaterThan(0);
      expect(comments.length).toBeLessThanOrEqual(maxComments);
    }, 60000);
  });

  describe('Language support', () => {
    test('should handle different language settings', async () => {
      const languages = ['en', 'zh', 'ja'];

      for (const lang of languages) {
        const comments: Comment[] = [];
        const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_RECENT, lang, 0);

        let count = 0;
        const maxComments = 2;

        for await (const comment of generator) {
          comments.push(comment);
          validateComment(comment);
          count++;

          if (count >= maxComments) {
            break;
          }
        }

        if (comments.length > 0) {
          console.log(`Language ${lang}: Downloaded ${comments.length} comments`);
        }
      }
    }, 90000);
  });

  describe('Comment structure validation', () => {
    test('should have consistent comment structure across multiple comments', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_RECENT, 'en', 0);

      let count = 0;
      const maxComments = 20;

      for await (const comment of generator) {
        comments.push(comment);
        validateComment(comment);
        count++;

        if (count >= maxComments) {
          break;
        }
      }

      expect(comments.length).toBeGreaterThan(0);

      // Check for variety in comment types
      const hasMainComments = comments.some((c) => !c.reply);

      expect(hasMainComments).toBe(true);

      console.log('Comment variety check:', {
        total: comments.length,
        mainComments: comments.filter((c) => !c.reply).length,
        replies: comments.filter((c) => c.reply).length,
        withVotes: comments.filter((c) => parseInt(c.votes) > 0).length,
        withReplies: comments.filter((c) => c.replies > 0).length,
        withHearts: comments.filter((c) => c.heart).length,
        withTimeParsed: comments.filter((c) => c.time_parsed !== undefined).length,
      });
    }, 60000);
  });

  describe('Error handling', () => {
    test('should handle invalid video ID gracefully', async () => {
      const generator = downloader.getComments('invalid-video-id', SORT_BY_RECENT, 'en', 0);

      const comments: Comment[] = [];
      let errorThrown = false;

      try {
        for await (const comment of generator) {
          comments.push(comment);
          if (comments.length >= 1) {
            break;
          }
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeDefined();
      }

      // Either no comments should be returned or an error should be thrown
      expect(comments.length === 0 || errorThrown).toBe(true);
    }, 30000);

    test('should handle invalid URL gracefully', async () => {
      const invalidUrl = 'https://www.youtube.com/watch?v=invalid-video-id';
      const generator = downloader.getCommentsFromUrl(invalidUrl, SORT_BY_RECENT, 'en', 0);

      const comments: Comment[] = [];
      let errorThrown = false;

      try {
        for await (const comment of generator) {
          comments.push(comment);
          if (comments.length >= 1) {
            break;
          }
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeDefined();
      }

      // Either no comments should be returned or an error should be thrown
      expect(comments.length === 0 || errorThrown).toBe(true);
    }, 30000);
  });
});
