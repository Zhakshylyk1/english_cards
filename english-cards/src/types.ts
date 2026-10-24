export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordCard {
  id: string;
  ru: string;
  en: string;
  difficulty: Difficulty;
  options: string[];
}
