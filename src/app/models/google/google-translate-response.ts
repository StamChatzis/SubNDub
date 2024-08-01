export interface GoogleTranslateResponse {
  data: GoogleTranslations;
}

export interface GoogleTranslations {
  detectedSourceLanguage: string;
  translatedText: string;
}

export interface Translation {
  translatedText: string;
  detectedSourceLanguage: string;
}

export interface Translations {
  translations: Translation[];
}

export interface ResponseObject {
  data: Translations;
}

export interface GoogleDetectionResponseData {
  data: GoogleDetectionArray
}

export interface GoogleDetectionArray{
  detections: GoogleDetectionObject[]
}

export interface GoogleDetectionObject {
  0: {
    confidence: string;
    isReliable: boolean;
    language: string;
  }
}
