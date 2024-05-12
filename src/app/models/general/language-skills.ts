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

export enum SkillLevel {
  A1 = 'A1: Beginner',
  A2 = 'A2: Pre-Intermediate',
  B1 = 'B1: Intermediate',
  B2 = 'B2: Upper-Intermediate',
  C1 = 'C1: Advanced',
  C2 = 'C2: Mastery',
}
