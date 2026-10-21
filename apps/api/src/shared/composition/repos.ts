import { userRepo, roleRepo, permissionRepo, refreshTokenRepo } from '../../modules/identity';
import { bookRepo } from '../../modules/catalog';
import { cartRepo, orderRepo } from '../../modules/ordering';
import { reviewRepo } from '../../modules/reviews';
import { favoriteRepo } from '../../modules/engagement';
import { discountRepo } from '../../modules/promotions';
import { issueRepo } from '../../modules/reporting';

export const repos = {
  books: bookRepo,
  users: userRepo,
  orders: orderRepo,
  reviews: reviewRepo,
  permissions: permissionRepo,
  roles: roleRepo,
  refreshTokens: refreshTokenRepo,
  issues: issueRepo,
  carts: cartRepo,
  favorites: favoriteRepo,
  discounts: discountRepo,
};
