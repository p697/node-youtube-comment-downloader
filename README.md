# youtube-comment-downloader

**English** | [中文](README.zh-CN.md)

Simple script for downloading Youtube comments without using the Youtube API. The output is in line delimited JSON.

Node.js/TypeScript port of [egbertbouman/youtube-comment-downloader](https://github.com/egbertbouman/youtube-comment-downloader) with added proxy support.

## Installation

Install this package via pnpm (recommended):

```bash
pnpm add youtube-comment-downloader
```

Or using npm:

```bash
npm install youtube-comment-downloader
```

For global CLI usage:

```bash
pnpm add -g youtube-comment-downloader
# or
npm install -g youtube-comment-downloader
```

## Usage as command-line interface

```bash
$ youtube-comment-downloader --help
Usage: youtube-comment-downloader [options]

Download Youtube comments without using the Youtube API

Options:
  -y, --youtubeid <id>     ID of Youtube video for which to download the comments
  -u, --url <url>          Youtube URL for which to download the comments
  -o, --output <file>      Output filename (output format is line delimited JSON)
  -p, --pretty             Change the output format to indented JSON
  -l, --limit <number>     Limit the number of comments
  -a, --language <lang>    Language for Youtube generated text (e.g. en)
  --proxy <uri>            Proxy URI (e.g. http://user:pass@proxy.example.com:8080)
  -s, --sort <number>      Whether to download popular (0) or recent comments (1). Defaults to 1
  -h, --help               display help for command
```

### Examples

Download comments using video URL:

```bash
youtube-comment-downloader --url https://www.youtube.com/watch?v=ScMzIvxBSi4 --output ScMzIvxBSi4.json
```

Download comments using video ID:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json
```

Download with pretty formatting:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --pretty
```

Download only first 100 comments:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --limit 100
```

Download popular comments instead of recent:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --sort 0
```

Download using proxy:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --proxy http://proxy.example.com:8080
```

Download using proxy with authentication:

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --proxy http://username:password@proxy.example.com:8080
```

For Youtube IDs starting with `-` (dash), use the `=` syntax:

```bash
youtube-comment-downloader --youtubeid=-idwithdash --output output.json
```

## Usage as library

You can also use this package programmatically in your Node.js/TypeScript projects:

### JavaScript Example

```javascript
const { YoutubeCommentDownloader, SORT_BY_POPULAR } = require('youtube-comment-downloader');

async function downloadComments() {
  const downloader = new YoutubeCommentDownloader();
  
  // Download comments from URL
  const comments = downloader.getCommentsFromUrl(
    'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    SORT_BY_POPULAR
  );
  
  // Print first 10 comments
  let count = 0;
  for await (const comment of comments) {
    console.log(comment);
    if (++count >= 10) break;
  }
}

downloadComments();
```

### TypeScript Example

```typescript
import { YoutubeCommentDownloader, SORT_BY_POPULAR, Comment } from 'youtube-comment-downloader';

async function downloadComments(): Promise<void> {
  const downloader = new YoutubeCommentDownloader();
  
  // Download comments from video ID
  const comments = downloader.getComments('ScMzIvxBSi4', SORT_BY_POPULAR);
  
  // Collect all comments
  const allComments: Comment[] = [];
  for await (const comment of comments) {
    allComments.push(comment);
  }
  
  console.log(`Downloaded ${allComments.length} comments`);
}

downloadComments();
```

### Download with proxy support

```typescript
import { YoutubeCommentDownloader, SORT_BY_RECENT, Comment } from 'youtube-comment-downloader';

async function downloadWithProxy(): Promise<void> {
  // Create downloader with proxy configuration
  const downloader = new YoutubeCommentDownloader({
    proxy: { uri: 'http://proxy.example.com:8080' }
  });
  
  // Download comments using proxy
  const comments = downloader.getComments('ScMzIvxBSi4', SORT_BY_RECENT);
  
  for await (const comment of comments) {
    console.log(`${comment.author}: ${comment.text}`);
  }
}

downloadWithProxy();
```

### Download with language preference

```javascript
const { YoutubeCommentDownloader, SORT_BY_RECENT } = require('youtube-comment-downloader');

async function downloadWithLanguage() {
  const downloader = new YoutubeCommentDownloader();
  
  // Download comments with English language preference
  const comments = downloader.getComments(
    'ScMzIvxBSi4',
    SORT_BY_RECENT,
    'en'  // Language code
  );
  
  for await (const comment of comments) {
    console.log(`${comment.author}: ${comment.text}`);
  }
}
```

## API Reference

### `YoutubeCommentDownloader`

Main class for downloading YouTube comments.

#### Constructor

##### `new YoutubeCommentDownloader(options?)`

Creates a new instance of the YouTube comment downloader.

- `options` (DownloaderOptions, optional): Configuration options
  - `proxy` (ProxyConfig, optional): Proxy configuration
    - `uri` (string): Proxy URI (e.g., `http://proxy.example.com:8080` or `http://user:pass@proxy.example.com:8080`)

#### Methods

##### `getComments(youtubeId, sortBy?, language?, sleepTime?)`

Downloads comments for a YouTube video by its ID.

- `youtubeId` (string): The YouTube video ID
- `sortBy` (number, optional): Sort order - `SORT_BY_RECENT` (1) or `SORT_BY_POPULAR` (0). Default: `SORT_BY_RECENT`
- `language` (string, optional): Language code for YouTube generated text (e.g., 'en', 'es', 'fr')
- `sleepTime` (number, optional): Sleep time in seconds between requests. Default: 0.1

Returns: `AsyncGenerator<Comment>` - An async generator that yields comment objects

##### `getCommentsFromUrl(youtubeUrl, sortBy?, language?, sleepTime?)`

Downloads comments for a YouTube video by its URL.

- `youtubeUrl` (string): The full YouTube video URL
- `sortBy` (number, optional): Sort order - `SORT_BY_RECENT` (1) or `SORT_BY_POPULAR` (0). Default: `SORT_BY_RECENT`
- `language` (string, optional): Language code for YouTube generated text
- `sleepTime` (number, optional): Sleep time in seconds between requests. Default: 0.1

Returns: `AsyncGenerator<Comment>` - An async generator that yields comment objects

### Comment Object

Each comment yielded by the generator has the following structure:

```typescript
interface Comment {
  cid: string;         // Comment ID
  text: string;        // Comment text content
  time: string;        // Time string (e.g., "2 hours ago")
  author: string;      // Comment author's display name
  channel: string;     // Author's channel ID
  votes: string;       // Number of likes
  replies: number;     // Number of replies
  photo: string;       // Author's avatar URL
  heart: boolean;      // Whether the comment has a heart from video creator
  reply: boolean;      // Whether this is a reply to another comment
  time_parsed?: number; // Unix timestamp (if parseable)
  paid?: string;       // Paid comment/SuperChat message (if applicable)
}
```

### Constants

- `SORT_BY_POPULAR` (0): Sort comments by popularity
- `SORT_BY_RECENT` (1): Sort comments by recency (newest first)

## Features

- No YouTube API key required
- Supports both video URLs and video IDs
- Download all comments including replies
- Sort by popular or recent
- Language preference support
- **Proxy support** - Use HTTP/HTTPS proxies for improved access
- Automatic retry on failure
- Handles consent pages automatically
- Supports paid comments/SuperChats
- Line-delimited JSON or pretty formatted output
- Full TypeScript support

## Development

### Building from source

```bash
# Clone the repository
git clone https://github.com/yourusername/node-youtube-comment-downloader.git
cd node-youtube-comment-downloader

# Install dependencies (using pnpm)
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Run in watch mode
pnpm run watch
```

### Running tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm test -- --coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This package is for educational purposes only. Please respect YouTube's Terms of Service and the rights of content creators and commenters when using this tool.
