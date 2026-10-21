export interface CartItem {
  productId: string;
  sku: string;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: Date;
  createdAt: Date;
}

export interface AddCartItemInput {
  productId: string;
  sku: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}
