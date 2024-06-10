export class SharedVideo {
    id: string;
    lastUpdated: number;
    fileName: string;
    fullFileName: string;
    format: string;
    language: string;
    iso: string;
    right: string;
    videoId: string;
    email: string;
    usersRights: { userEmail: string, right: string }[];
    requestOnwerEmail?: string;
}
