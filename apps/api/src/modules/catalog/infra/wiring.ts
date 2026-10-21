import { MongooseBookRepository } from './BookRepository';
import { BookService } from '../application/book.service';

export const bookRepo = new MongooseBookRepository();
export const bookService = new BookService(bookRepo);
