export interface Comment {
  cid: string;
  text: string;
  time: string;
  author: string;
  channel: string;
  votes: string;
  replies: number;
  photo: string;
  heart: boolean;
  reply: boolean;
  time_parsed?: number;
  paid?: string;
}

export interface YTConfig {
  INNERTUBE_API_KEY: string;
  INNERTUBE_CONTEXT: {
    client: {
      hl?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Continuation {
  commandMetadata: {
    webCommandMetadata: {
      apiUrl: string;
    };
  };
  continuationCommand: {
    token: string;
  };
}

export interface AjaxResponse {
  [key: string]: any;
}

export interface ProxyConfig {
  uri: string;
}

export interface DownloaderOptions {
  proxy?: ProxyConfig;
}

export const SORT_BY_POPULAR = 0;
export const SORT_BY_RECENT = 1;
