import { SubtitleFormat } from "src/app/services/details-view-service.service";

export interface CommunityHelpRequest {
    filename: string;
    format: SubtitleFormat
    iso: string;
    language: string;
    requestId?: string;
    requestedBy: string;
    requestedByID: string;
    status: RequestStatus
    timestamp: number;
    videoId: string;
    subtitleId?: string;
}

export enum RequestStatus {
    Open = 'open',
    Closed = 'closed'
}
