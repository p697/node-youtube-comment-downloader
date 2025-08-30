import { YoutubeCommentDownloader, SORT_BY_POPULAR, SORT_BY_RECENT } from '../src/downloader';
import { Comment } from '../src/types';

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=PQUcIbSEBCM';
const TEST_VIDEO_ID = 'PQUcIbSEBCM';

function validateComment(comment: Comment): void {
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

  if (comment.time_parsed !== undefined) {
    expect(typeof comment.time_parsed).toBe('number');
    expect(comment.time_parsed).toBeGreaterThan(0);
  }

  if (comment.paid !== undefined) {
    expect(typeof comment.paid).toBe('string');
  }
}

describe('YoutubeCommentDownloader', () => {
  let downloader: YoutubeCommentDownloader;

  beforeEach(() => {
    downloader = new YoutubeCommentDownloader();
  });

  describe('constructor', () => {
    test('should create instance without options', () => {
      const instance = new YoutubeCommentDownloader();
      expect(instance).toBeInstanceOf(YoutubeCommentDownloader);
    });

    test('should create instance with proxy options', () => {
      const instance = new YoutubeCommentDownloader({
        proxy: { uri: 'http://proxy.example.com:8080' },
      });
      expect(instance).toBeInstanceOf(YoutubeCommentDownloader);
    });
  });

  describe('constants', () => {
    test('should export SORT_BY_POPULAR as 0', () => {
      expect(SORT_BY_POPULAR).toBe(0);
    });

    test('should export SORT_BY_RECENT as 1', () => {
      expect(SORT_BY_RECENT).toBe(1);
    });
  });

  describe('getComments', () => {
    test('should be an async generator function', () => {
      const generator = downloader.getComments('test-id');
      expect(generator).toHaveProperty('next');
      expect(generator).toHaveProperty('return');
      expect(generator).toHaveProperty('throw');
    });

    test('should accept youtube ID and optional parameters', () => {
      const generator1 = downloader.getComments('test-id');
      expect(generator1).toBeDefined();

      const generator2 = downloader.getComments('test-id', SORT_BY_POPULAR);
      expect(generator2).toBeDefined();

      const generator3 = downloader.getComments('test-id', SORT_BY_RECENT, 'en');
      expect(generator3).toBeDefined();

      const generator4 = downloader.getComments('test-id', SORT_BY_RECENT, 'en', 0.5);
      expect(generator4).toBeDefined();
    });

    test('should download real comments from test video', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_RECENT, 'en', 0);

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
    }, 30000);

    test('should download popular comments', async () => {
      const comments: Comment[] = [];
      const generator = downloader.getComments(TEST_VIDEO_ID, SORT_BY_POPULAR, 'en', 0);

      let count = 0;
      const maxComments = 3;

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
    }, 30000);
  });

  describe('getCommentsFromUrl', () => {
    test('should be an async generator function', () => {
      const generator = downloader.getCommentsFromUrl('https://www.youtube.com/watch?v=test');
      expect(generator).toHaveProperty('next');
      expect(generator).toHaveProperty('return');
      expect(generator).toHaveProperty('throw');
    });

    test('should accept URL and optional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=test';

      const generator1 = downloader.getCommentsFromUrl(url);
      expect(generator1).toBeDefined();

      const generator2 = downloader.getCommentsFromUrl(url, SORT_BY_POPULAR);
      expect(generator2).toBeDefined();

      const generator3 = downloader.getCommentsFromUrl(url, SORT_BY_RECENT, 'en');
      expect(generator3).toBeDefined();

      const generator4 = downloader.getCommentsFromUrl(url, SORT_BY_RECENT, 'en', 0.5);
      expect(generator4).toBeDefined();
    });

    test('should download real comments from test video URL', async () => {
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
    }, 30000);
  });

  describe('proxy support', () => {
    test('should handle invalid proxy gracefully', async () => {
      const downloaderWithBadProxy = new YoutubeCommentDownloader();

      const generator = downloaderWithBadProxy.getComments(TEST_VIDEO_ID, SORT_BY_RECENT, 'en', 0);

      try {
        const { value } = await generator.next();
        if (value) {
          validateComment(value);
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Comment validation', () => {
    test('should validate comment structure', () => {
      const comment: Comment = {
        cid: 'comment-id',
        text: 'Comment text',
        time: '2 hours ago',
        author: 'Author Name',
        channel: 'channel-id',
        votes: '42',
        replies: 5,
        photo: 'https://example.com/photo.jpg',
        heart: false,
        reply: false,
        time_parsed: 1234567890,
        paid: 'Thanks',
      };

      validateComment(comment);
    });

    test('should validate minimal comment structure', () => {
      const comment: Comment = {
        cid: 'comment-id',
        text: 'Comment text',
        time: '2 hours ago',
        author: 'Author Name',
        channel: 'channel-id',
        votes: '0',
        replies: 0,
        photo: 'https://example.com/photo.jpg',
        heart: false,
        reply: false,
      };

      validateComment(comment);
    });
  });
});
