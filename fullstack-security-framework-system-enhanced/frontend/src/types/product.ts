export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}