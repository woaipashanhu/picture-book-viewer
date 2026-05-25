export interface Book {
  id: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  pages: string[];
  pageTexts?: string[];
  pageTextsEn?: string[];
}