import type { Book } from '@modules/catalog/domain/book.entity';
import { toBookDto } from '@modules/catalog/application/dto/book.mapper';

export function presentBook(book: Book) {
  return toBookDto(book);
}

export function presentBooks(books: Book[]) {
  return books.map(presentBook);
}
