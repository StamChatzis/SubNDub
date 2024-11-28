export interface SubtitleResponse {
  fileName: string,
  format: string,
  fullFileName: string,
  iso: string,
  language: string,
  lastUpdated: number,
  storageUrl: string,
  ownerName: string,
  ownerPhoto: string,
  usersRights: UserRights[],
  isUsed: boolean,
  isUsedBy: string;
}

export interface SharedSubtitleResponse {
  fileName: string,
  format: string,
  fullFileName: string,
  id: string
  iso: string,
  language: string,
  lastUpdated: number,
  requestOwnerEmail: string,
  ownerName: string,
  ownerPhoto: string,
  usersRights: UserRights[],
  isUsed: boolean,
  isUsedBy: string;
}

export interface UserRights{
  userEmail: string,
  right: string,
  userUid: string
}
