export interface YoutubeResponse {
    kind: string
    etag: string
    items: YoutubeVideoDetails[]
    pageInfo: PageInfo
  }
  
  export interface YoutubeVideoDetails {
    kind: string
    etag: string
    id: string
    snippet: Snippet
    statistics?: Statistics
    contentDetails?: any
  }
  
  export interface Snippet {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: Thumbnails
    channelTitle: string
    tags?: string[]
    categoryId: string
    liveBroadcastContent: string
    localized: Localized
    defaultAudioLanguage?: string
  }

  export interface Statistics {
    likeCount: number;
    viewCount: number;
  }
  
  export interface Thumbnails {
    default: ImageRes
    medium: ImageRes
    high: ImageRes
    standard: ImageRes
    maxres: ImageRes
  }
  
  export interface ImageRes {
    url: string
    width: number
    height: number
  }

  export interface Localized {
    title: string
    description: string
  }
  
  export interface PageInfo {
    totalResults: number
    resultsPerPage: number
  }
  