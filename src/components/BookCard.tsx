import type { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left focus:outline-none active:scale-[0.97] transition-transform duration-200"
    >
      <div className="bg-white rounded-card shadow-sm overflow-hidden border border-warm-border">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={book.cover}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-3">
          <h3 className="font-display text-bark font-semibold text-base leading-tight truncate">
            {book.title}
          </h3>
          {book.description && (
            <p className="text-bark-light text-xs mt-1 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}
          {book.date && (
            <p className="text-bark-light text-xs mt-1.5 opacity-60">
              {book.date}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
