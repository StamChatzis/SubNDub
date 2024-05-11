export interface SupportedLanguages {
  data: Languages;
}

export interface Languages {
  languages: Language[];
}

export interface Language {
  language: string;
  name: string;
}
