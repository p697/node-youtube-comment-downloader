#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { YoutubeCommentDownloader, SORT_BY_RECENT } from './downloader';
import type { Comment } from './types';

const INDENT = 4;

async function main() {
  program
    .name('youtube-comment-downloader')
    .description('Download Youtube comments without using the Youtube API')
    .option('-y, --youtubeid <id>', 'ID of Youtube video for which to download the comments')
    .option('-u, --url <url>', 'Youtube URL for which to download the comments')
    .option('-o, --output <file>', 'Output filename (output format is line delimited JSON)')
    .option('-p, --pretty', 'Change the output format to indented JSON')
    .option('-l, --limit <number>', 'Limit the number of comments', parseInt)
    .option('-a, --language <lang>', 'Language for Youtube generated text (e.g. en)')
    .option('--proxy <uri>', 'Proxy URI (e.g. http://user:pass@proxy.example.com:8080)')
    .option(
      '-s, --sort <number>',
      'Whether to download popular (0) or recent comments (1). Defaults to 1',
      parseInt,
      SORT_BY_RECENT,
    )
    .parse(process.argv);

  const options = program.opts();

  const youtubeId = options.youtubeid;
  const youtubeUrl = options.url;
  const output = options.output;
  const limit = options.limit;
  const pretty = options.pretty;
  const language = options.language;
  const sortBy = options.sort;
  const proxyUri = options.proxy;

  if ((!youtubeId && !youtubeUrl) || !output) {
    console.error('Error: you need to specify a Youtube ID/URL and an output filename');
    program.help();
    process.exit(1);
  }

  // Create output directory if needed
  const outputDir = path.dirname(output);
  if (outputDir && outputDir !== '.' && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Downloading Youtube comments for', youtubeId || youtubeUrl);

  const downloaderOptions = proxyUri ? { proxy: { uri: proxyUri } } : undefined;
  const downloader = new YoutubeCommentDownloader(downloaderOptions);

  let generator: AsyncGenerator<Comment>;
  if (youtubeId) {
    generator = downloader.getComments(youtubeId, sortBy, language);
  } else {
    generator = downloader.getCommentsFromUrl(youtubeUrl!, sortBy, language);
  }

  let fd: number | null = null;
  let count = 0;
  const startTime = Date.now();

  try {
    // Open file for writing
    fd = fs.openSync(output, 'w');

    if (pretty) {
      fs.writeSync(fd, '{\n' + ' '.repeat(INDENT) + '"comments": [\n');
    }

    let firstComment = true;
    for await (const comment of generator) {
      if (limit && count >= limit) {
        break;
      }

      let commentStr: string;
      if (pretty) {
        if (!firstComment) {
          fs.writeSync(fd, ',\n');
        }
        commentStr = JSON.stringify(comment, null, INDENT)
          .split('\n')
          .map((line, i) =>
            i === 0 ? ' '.repeat(INDENT * 2) + line : ' '.repeat(INDENT * 2) + line,
          )
          .join('\n');
        fs.writeSync(fd, commentStr);
        firstComment = false;
      } else {
        commentStr = JSON.stringify(comment);
        fs.writeSync(fd, commentStr + '\n');
      }

      count++;
      process.stdout.write(`Downloaded ${count} comment(s)\r`);
    }

    if (pretty && count > 0) {
      fs.writeSync(fd, '\n' + ' '.repeat(INDENT) + ']\n}');
    }

    const elapsed = (Date.now() - startTime) / 1000;
    if (count > 0) {
      console.log(`\n[${elapsed.toFixed(2)} seconds] Done!`);
    } else {
      console.log('No comment available!');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (fd !== null) {
      fs.closeSync(fd);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
