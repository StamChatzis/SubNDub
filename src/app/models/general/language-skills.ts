export interface Languages {
  languages: ForeignLanguage[];
}

export interface ForeignLanguage {
  language: string;
  level: SkillLevel;
}

export interface MotherLanguage{
  mother_language: string;
}

export interface SkillLevel {
  level: string
  description: string
}
