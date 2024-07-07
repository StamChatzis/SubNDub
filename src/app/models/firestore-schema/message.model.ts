export class Message {
    id?: string;
    sender: string;
    recipient: string;
    subject: string;
    createdAt: Date;
    status: string;
    subtitle_name: string; 
    subtitleId?: string;
    body:string;
    iso:string;
    language:string;
    videoId:string;
    format?: string;
    videoTitle?: string;
}