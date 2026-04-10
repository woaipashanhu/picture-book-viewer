import { useState, useEffect } from 'react';
import type { Book } from '../types/book';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('./books.json')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load books:', err);
        setLoading(false);
      });
  }, []);

  const getPrevBook = (currentIndex: number): number => {
    return currentIndex <= 0 ? books.length - 1 : currentIndex - 1;
  };

  const getNextBook = (currentIndex: number): number => {
    return currentIndex >= books.length - 1 ? 0 : currentIndex + 1;
  };

  return { books, loading, getPrevBook, getNextBook };
}
