import { useEffect, useRef } from 'react';
import BookCard from './BookCard';
import type { Book } from '../types/book';

interface BookGridProps {
  books: Book[];
  onSelect: (index: number) => void;
  scrollToIndex?: number | null;
}

export default function BookGrid({ books, onSelect, scrollToIndex }: BookGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 返回主页时滚动到上次阅读的绘本位置
  useEffect(() => {
    if (scrollToIndex == null || !scrollRef.current) return;

    // 找到对应索引的卡片元素并滚动到可视区域
    const card = scrollRef.current.querySelector(`[data-book-index="${scrollToIndex}"]`);
    if (card) {
      // 延迟一帧确保布局已稳定
      requestAnimationFrame(() => {
        card.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
    }
  }, [scrollToIndex]);

  return (
    <div className="h-full flex flex-col bg-cream">
      {/* Header */}
      <header className="flex-shrink-0 px-5 pt-safe-top pb-3">
        <div className="pt-6 pb-2">
          <h1 className="font-display text-bark text-3xl font-bold tracking-tight">
            刘费曼的绘本
          </h1>
          <p className="text-bark-light text-sm mt-1 font-body">
            {books.length} books
          </p>
        </div>
      </header>

      {/* Grid - responsive columns with horizontal card layout */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto book-grid-scroll px-4 pb-8">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-bark-light text-lg">No books yet</p>
            <p className="text-bark-light text-sm mt-1 opacity-60">
              Add books to the books/ folder
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {books.map((book, index) => (
              <div key={book.id} data-book-index={index}>
                <BookCard
                  book={book}
                  onClick={() => onSelect(index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}