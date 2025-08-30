import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as chrono from 'chrono-node';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  Comment,
  YTConfig,
  Continuation,
  AjaxResponse,
  SORT_BY_RECENT,
  DownloaderOptions,
} from './types';
import { searchDict, regexSearch, sleep } from './utils';

const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v={youtube_id}';
const YOUTUBE_CONSENT_URL = 'https://consent.youtube.com/save';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36';

const YT_CFG_RE = /ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/;
const YT_INITIAL_DATA_RE =
  /(?:window\s*\[\s*["']ytInitialData["']\s*\]|ytInitialData)\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/;
const YT_HIDDEN_INPUT_RE =
  /<input\s+type="hidden"\s+name="([A-Za-z0-9_]+)"\s+value="([A-Za-z0-9_\-.]*)"\s*(?:required|)\s*>/g;

export class YoutubeCommentDownloader {
  private session: AxiosInstance;

  constructor(options?: DownloaderOptions) {
    const axiosConfig: any = {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: 'CONSENT=YES+cb',
      },
      withCredentials: true,
      timeout: 60000,
    };

    if (options?.proxy?.uri) {
      const httpsAgent = new HttpsProxyAgent(options.proxy.uri);
      axiosConfig.httpsAgent = httpsAgent;
      axiosConfig.httpAgent = httpsAgent;
    }

    this.session = axios.create(axiosConfig);
  }

  private async ajaxRequest(
    endpoint: Continuation,
    ytcfg: YTConfig,
    retries: number = 5,
    sleepTime: number = 20,
  ): Promise<AjaxResponse | null> {
    const url = `https://www.youtube.com${endpoint.commandMetadata.webCommandMetadata.apiUrl}`;
    const data = {
      context: ytcfg.INNERTUBE_CONTEXT,
      continuation: endpoint.continuationCommand.token,
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.session.post(url, data, {
          params: { key: ytcfg.INNERTUBE_API_KEY },
        });

        if (response.status === 200) {
          return response.data;
        }
        if (response.status === 403 || response.status === 413) {
          return null;
        }
      } catch (error: any) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          // Timeout error, retry
        } else {
          console.error('Error in ajax request:', error.message);
        }
      }

      if (attempt < retries - 1) {
        await sleep(sleepTime * 1000);
      }
    }

    return null;
  }

  async *getComments(
    youtubeId: string,
    sortBy: number = SORT_BY_RECENT,
    language?: string,
    sleepTime: number = 0.1,
  ): AsyncGenerator<Comment> {
    const url = YOUTUBE_VIDEO_URL.replace('{youtube_id}', youtubeId);
    yield* this.getCommentsFromUrl(url, sortBy, language, sleepTime);
  }

  async *getCommentsFromUrl(
    youtubeUrl: string,
    sortBy: number = SORT_BY_RECENT,
    language?: string,
    sleepTime: number = 0.1,
  ): AsyncGenerator<Comment> {
    let response: AxiosResponse;

    try {
      response = await this.session.get(youtubeUrl);
    } catch (error: any) {
      console.error('Error fetching YouTube page:', error.message);
      return;
    }

    // Handle consent page if needed
    if (
      response.request?.res?.responseUrl &&
      response.request.res.responseUrl.includes('consent')
    ) {
      const consentParams = this.extractConsentParams(response.data);
      if (consentParams) {
        consentParams['continue'] = youtubeUrl;
        consentParams['set_eom'] = 'false';
        consentParams['set_ytc'] = 'true';
        consentParams['set_apyt'] = 'true';

        try {
          response = await this.session.post(YOUTUBE_CONSENT_URL, null, {
            params: consentParams,
          });
        } catch (error: any) {
          console.error('Error handling consent:', error.message);
          return;
        }
      }
    }

    const html = response.data;

    // Extract ytcfg
    const ytcfgMatch = regexSearch(html, YT_CFG_RE, 1, '');
    if (!ytcfgMatch) {
      console.error('Unable to extract YouTube configuration');
      return;
    }

    let ytcfg: YTConfig;
    try {
      ytcfg = JSON.parse(ytcfgMatch);
    } catch (error) {
      console.error('Failed to parse YouTube configuration');
      return;
    }

    if (language) {
      ytcfg.INNERTUBE_CONTEXT.client.hl = language;
    }

    // Extract initial data
    const dataMatch = regexSearch(html, YT_INITIAL_DATA_RE, 1, '');
    if (!dataMatch) {
      console.error('Unable to extract initial data');
      return;
    }

    let data: any;
    try {
      data = JSON.parse(dataMatch);
    } catch (error) {
      console.error('Failed to parse initial data');
      return;
    }

    // Find the item section renderer
    const itemSection = searchDict(data, 'itemSectionRenderer').next().value;
    if (!itemSection) {
      // Comments might be disabled
      return;
    }

    const renderer = searchDict(itemSection, 'continuationItemRenderer').next().value;
    if (!renderer) {
      // Comments disabled
      return;
    }

    // Get sort menu
    let sortMenu = searchDict(data, 'sortFilterSubMenuRenderer').next().value?.subMenuItems || [];

    if (!sortMenu.length) {
      // No sort menu, might be community posts
      const sectionList = searchDict(data, 'sectionListRenderer').next().value || {};
      const continuations = Array.from(searchDict(sectionList, 'continuationEndpoint'));

      if (continuations.length > 0) {
        const ajaxData = await this.ajaxRequest(continuations[0] as Continuation, ytcfg);
        if (ajaxData) {
          sortMenu =
            searchDict(ajaxData, 'sortFilterSubMenuRenderer').next().value?.subMenuItems || [];
        }
      }
    }

    if (!sortMenu.length || sortBy >= sortMenu.length) {
      throw new Error('Failed to set sorting');
    }

    const continuations: Continuation[] = [sortMenu[sortBy].serviceEndpoint];

    while (continuations.length > 0) {
      const continuation = continuations.shift()!;
      const response = await this.ajaxRequest(continuation, ytcfg);

      if (!response) {
        break;
      }

      // Check for errors
      const error = searchDict(response, 'externalErrorMessage').next().value;
      if (error) {
        throw new Error(`Error returned from server: ${error}`);
      }

      // Get actions
      const reloadActions = Array.from(searchDict(response, 'reloadContinuationItemsCommand'));
      const appendActions = Array.from(searchDict(response, 'appendContinuationItemsAction'));
      const actions = [...reloadActions, ...appendActions];

      for (const action of actions) {
        for (const item of action.continuationItems || []) {
          const targetId = action.targetId;

          if (
            targetId === 'comments-section' ||
            targetId === 'engagement-panel-comments-section' ||
            targetId === 'shorts-engagement-panel-comments-section'
          ) {
            // Process continuations for comments and replies
            const newContinuations = Array.from(
              searchDict(item, 'continuationEndpoint'),
            ) as Continuation[];
            continuations.unshift(...newContinuations);
          }

          if (targetId?.startsWith('comment-replies-item') && item.continuationItemRenderer) {
            // Process 'Show more replies' button
            const buttonRenderer = searchDict(item, 'buttonRenderer').next().value;
            if (buttonRenderer?.command) {
              continuations.push(buttonRenderer.command);
            }
          }
        }
      }

      // Extract payment information
      const surfacePayloads = Array.from(searchDict(response, 'commentSurfaceEntityPayload'));
      const payments: Record<string, string> = {};

      for (const payload of surfacePayloads) {
        if (payload.pdgCommentChip) {
          const simpleText = searchDict(payload, 'simpleText').next().value || '';
          payments[payload.key] = simpleText;
        }
      }

      // Map payment keys to comment IDs if payments exist
      if (Object.keys(payments).length > 0) {
        const viewModels = Array.from(searchDict(response, 'commentViewModel'))
          .map((vm: any) => vm.commentViewModel)
          .filter(Boolean);

        const surfaceKeys: Record<string, string> = {};
        for (const vm of viewModels) {
          if (vm.commentSurfaceKey && vm.commentId) {
            surfaceKeys[vm.commentSurfaceKey] = vm.commentId;
          }
        }

        // Remap payments using surface keys
        const remappedPayments: Record<string, string> = {};
        for (const [key, payment] of Object.entries(payments)) {
          if (surfaceKeys[key]) {
            remappedPayments[surfaceKeys[key]] = payment;
          }
        }
        Object.assign(payments, remappedPayments);
      }

      // Extract toolbar states
      const toolbarPayloads = Array.from(
        searchDict(response, 'engagementToolbarStateEntityPayload'),
      );
      const toolbarStates: Record<string, any> = {};
      for (const payload of toolbarPayloads) {
        toolbarStates[payload.key] = payload;
      }

      // Extract comments
      const commentPayloads = Array.from(searchDict(response, 'commentEntityPayload')).reverse();

      for (const comment of commentPayloads) {
        const properties = comment.properties;
        const cid = properties.commentId;
        const author = comment.author;
        const toolbar = comment.toolbar;
        const toolbarState = toolbarStates[properties.toolbarStateKey] || {};

        const result: Comment = {
          cid,
          text: properties.content?.content || '',
          time: properties.publishedTime || '',
          author: author.displayName || '',
          channel: author.channelId || '',
          votes: toolbar.likeCountNotliked?.trim() || '0',
          replies: parseInt(toolbar.replyCount || '0'),
          photo: author.avatarThumbnailUrl || '',
          heart: toolbarState.heartState === 'TOOLBAR_HEART_STATE_HEARTED',
          reply: cid.includes('.'),
        };

        // Parse time
        try {
          const timeStr = result.time.split('(')[0].trim();
          const parsedDate = chrono.parseDate(timeStr);
          if (parsedDate) {
            result.time_parsed = Math.floor(parsedDate.getTime() / 1000);
          }
        } catch (error) {
          // Ignore parsing errors
        }

        // Add payment info if exists
        if (payments[cid]) {
          result.paid = payments[cid];
        }

        yield result;
      }

      await sleep(sleepTime * 1000);
    }
  }

  private extractConsentParams(html: string): Record<string, string> | null {
    const params: Record<string, string> = {};
    let match;

    const regex = new RegExp(YT_HIDDEN_INPUT_RE.source, 'g');
    while ((match = regex.exec(html)) !== null) {
      params[match[1]] = match[2];
    }

    return Object.keys(params).length > 0 ? params : null;
  }
}

export { SORT_BY_POPULAR, SORT_BY_RECENT } from './types';
