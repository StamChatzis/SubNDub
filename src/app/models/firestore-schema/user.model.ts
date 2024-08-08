export interface User {
    uid: string;
    displayName?: string;
    bio?: string;
    ethnicity?: string;
    videos?: Video[];
    ratings?: Rating[];
}

export interface GmailUser extends User {
    email: string;
    photoURL?: string;
}

export interface Video {
    videoId: string;
    title: string;
    subtitles?: Subtitle[];
}

export interface Subtitle {
    subtitleFilePath: string;
    language: string;
    created: Date;
    last_updated: Date;
    usersRights: UserRights[];
    subtitleSharedId?: string;
}

export interface UserRights {
    userId?: string;
    right: string;
    userEmail: string;
}

export interface Rating {
  rating: number;
  comment: string;
  raterId: string;
}
