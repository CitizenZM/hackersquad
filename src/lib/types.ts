export interface FlashcardScene {
  id: string;
  sceneOrder: number;
  imageUrl: string | null;
  textSnippet: string;
  duration: number | null;
  prompt?: string | null;
}

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  example?: string | null;
  imageUrl?: string | null;
}
