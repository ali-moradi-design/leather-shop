export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  populated?: {
    product?: {
      id: string;
      title: string;
      author: string;
      price: number;
      coverImageUrl?: string;
    };
  };
}

export interface CreateFavoriteInput {
  userId: string;
  productId: string;
}
