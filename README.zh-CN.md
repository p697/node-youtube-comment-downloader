# youtube-comment-downloader

一个十分简单的脚本，用于下载 YouTube 评论而无需使用 YouTube API。输出格式为行分隔的 JSON。

[egbertbouman/youtube-comment-downloader](https://github.com/egbertbouman/youtube-comment-downloader) 的 Node.js/TypeScript 移植版本，并添加了代理支持。

## 语言版本

[English](README.md) | **中文**

## 安装

通过 pnpm 安装此包（推荐）：

```bash
pnpm add youtube-comment-downloader
```

或使用 npm：

```bash
npm install youtube-comment-downloader
```

全局 CLI 使用：

```bash
pnpm add -g youtube-comment-downloader
# 或
npm install -g youtube-comment-downloader
```

## 命令行界面使用

```bash
$ youtube-comment-downloader --help
Usage: youtube-comment-downloader [options]

下载 YouTube 评论而无需使用 YouTube API

Options:
  -y, --youtubeid <id>     要下载评论的 YouTube 视频 ID
  -u, --url <url>          要下载评论的 YouTube URL
  -o, --output <file>      输出文件名（输出格式为行分隔的 JSON）
  -p, --pretty             将输出格式更改为缩进的 JSON
  -l, --limit <number>     限制评论数量
  -a, --language <lang>    YouTube 生成文本的语言（例如 zh-CN）
  --proxy <uri>            代理 URI（例如 http://user:pass@proxy.example.com:8080）
  -s, --sort <number>      是否下载热门评论（0）或最新评论（1）。默认为 1
  -h, --help               显示帮助信息
```

### 示例

使用视频 URL 下载评论：

```bash
youtube-comment-downloader --url https://www.youtube.com/watch?v=ScMzIvxBSi4 --output ScMzIvxBSi4.json
```

使用视频 ID 下载评论：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json
```

使用美化格式下载：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --pretty
```

仅下载前 100 条评论：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --limit 100
```

下载热门评论而非最新评论：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --sort 0
```

使用代理下载：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --proxy http://proxy.example.com:8080
```

使用带身份验证的代理下载：

```bash
youtube-comment-downloader --youtubeid ScMzIvxBSi4 --output ScMzIvxBSi4.json --proxy http://username:password@proxy.example.com:8080
```

对于以 `-`（破折号）开头的 YouTube ID，使用 `=` 语法：

```bash
youtube-comment-downloader --youtubeid=-idwithdash --output output.json
```

## 作为库使用

您也可以在 Node.js/TypeScript 项目中以编程方式使用此包：

### JavaScript 示例

```javascript
const { YoutubeCommentDownloader, SORT_BY_POPULAR } = require('youtube-comment-downloader');

async function downloadComments() {
  const downloader = new YoutubeCommentDownloader();
  
  // 从 URL 下载评论
  const comments = downloader.getCommentsFromUrl(
    'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    SORT_BY_POPULAR
  );
  
  // 打印前 10 条评论
  let count = 0;
  for await (const comment of comments) {
    console.log(comment);
    if (++count >= 10) break;
  }
}

downloadComments();
```

### TypeScript 示例

```typescript
import { YoutubeCommentDownloader, SORT_BY_POPULAR, Comment } from 'youtube-comment-downloader';

async function downloadComments(): Promise<void> {
  const downloader = new YoutubeCommentDownloader();
  
  // 从视频 ID 下载评论
  const comments = downloader.getComments('ScMzIvxBSi4', SORT_BY_POPULAR);
  
  // 收集所有评论
  const allComments: Comment[] = [];
  for await (const comment of comments) {
    allComments.push(comment);
  }
  
  console.log(`下载了 ${allComments.length} 条评论`);
}

downloadComments();
```

### 使用代理支持下载

```typescript
import { YoutubeCommentDownloader, SORT_BY_RECENT, Comment } from 'youtube-comment-downloader';

async function downloadWithProxy(): Promise<void> {
  // 创建带代理配置的下载器
  const downloader = new YoutubeCommentDownloader({
    proxy: { uri: 'http://proxy.example.com:8080' }
  });
  
  // 使用代理下载评论
  const comments = downloader.getComments('ScMzIvxBSi4', SORT_BY_RECENT);
  
  for await (const comment of comments) {
    console.log(`${comment.author}: ${comment.text}`);
  }
}

downloadWithProxy();
```

### 使用语言偏好下载

```javascript
const { YoutubeCommentDownloader, SORT_BY_RECENT } = require('youtube-comment-downloader');

async function downloadWithLanguage() {
  const downloader = new YoutubeCommentDownloader();
  
  // 使用中文语言偏好下载评论
  const comments = downloader.getComments(
    'ScMzIvxBSi4',
    SORT_BY_RECENT,
    'zh-CN'  // 语言代码
  );
  
  for await (const comment of comments) {
    console.log(`${comment.author}: ${comment.text}`);
  }
}
```

## API 参考

### `YoutubeCommentDownloader`

用于下载 YouTube 评论的主类。

#### 构造函数

##### `new YoutubeCommentDownloader(options?)`

创建 YouTube 评论下载器的新实例。

- `options` (DownloaderOptions, 可选): 配置选项
  - `proxy` (ProxyConfig, 可选): 代理配置
    - `uri` (string): 代理 URI（例如 `http://proxy.example.com:8080` 或 `http://user:pass@proxy.example.com:8080`）

#### 方法

##### `getComments(youtubeId, sortBy?, language?, sleepTime?)`

通过视频 ID 下载 YouTube 视频的评论。

- `youtubeId` (string): YouTube 视频 ID
- `sortBy` (number, 可选): 排序顺序 - `SORT_BY_RECENT` (1) 或 `SORT_BY_POPULAR` (0)。默认：`SORT_BY_RECENT`
- `language` (string, 可选): YouTube 生成文本的语言代码（例如 'zh-CN', 'en', 'ja'）
- `sleepTime` (number, 可选): 请求之间的休眠时间（秒）。默认：0.1

返回：`AsyncGenerator<Comment>` - 产生评论对象的异步生成器

##### `getCommentsFromUrl(youtubeUrl, sortBy?, language?, sleepTime?)`

通过 URL 下载 YouTube 视频的评论。

- `youtubeUrl` (string): 完整的 YouTube 视频 URL
- `sortBy` (number, 可选): 排序顺序 - `SORT_BY_RECENT` (1) 或 `SORT_BY_POPULAR` (0)。默认：`SORT_BY_RECENT`
- `language` (string, 可选): YouTube 生成文本的语言代码
- `sleepTime` (number, 可选): 请求之间的休眠时间（秒）。默认：0.1

返回：`AsyncGenerator<Comment>` - 产生评论对象的异步生成器

### 评论对象

生成器产生的每个评论都具有以下结构：

```typescript
interface Comment {
  cid: string;         // 评论 ID
  text: string;        // 评论文本内容
  time: string;        // 时间字符串（例如 "2小时前"）
  author: string;      // 评论作者的显示名称
  channel: string;     // 作者的频道 ID
  votes: string;       // 点赞数
  replies: number;     // 回复数
  photo: string;       // 作者头像 URL
  heart: boolean;      // 评论是否收到视频创作者的爱心
  reply: boolean;      // 这是否是对另一条评论的回复
  time_parsed?: number; // Unix 时间戳（如果可解析）
  paid?: string;       // 付费评论/超级聊天消息（如果适用）
}
```

### 常量

- `SORT_BY_POPULAR` (0): 按热门程度排序评论
- `SORT_BY_RECENT` (1): 按最新程度排序评论（最新优先）

## 功能特性

- 无需 YouTube API 密钥
- 支持视频 URL 和视频 ID
- 下载所有评论包括回复
- 按热门或最新排序
- 语言偏好支持
- **代理支持** - 使用 HTTP/HTTPS 代理改善访问
- 失败时自动重试
- 自动处理同意页面
- 支持付费评论/超级聊天
- 行分隔 JSON 或美化格式输出
- 完整的 TypeScript 支持

## 开发

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/yourusername/node-youtube-comment-downloader.git
cd node-youtube-comment-downloader

# 安装依赖（使用 pnpm）
pnpm install

# 构建项目
pnpm run build

# 运行测试
pnpm test

# 以监视模式运行
pnpm run watch
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 以监视模式运行测试
pnpm run test:watch

# 运行带覆盖率的测试
pnpm test -- --coverage
```

## 许可证

MIT

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 免责声明

此包仅用于教育目的。使用此工具时，请尊重 YouTube 的服务条款以及内容创作者和评论者的权利。
