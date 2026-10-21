import { MongooseFavoriteRepository } from './FavoriteRepository';
import { FavoriteService } from '../application/favorite.service';
import { bookRepo } from '../../catalog';

export const favoriteRepo = new MongooseFavoriteRepository();
export const favoriteService = new FavoriteService(favoriteRepo, bookRepo);
