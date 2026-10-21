import { MongooseReviewRepository } from './ReviewRepository';
import { ReviewService } from '../application/review.service';
import { bookRepo } from '../../catalog';

export const reviewRepo = new MongooseReviewRepository();
export const reviewService = new ReviewService(reviewRepo, bookRepo);
