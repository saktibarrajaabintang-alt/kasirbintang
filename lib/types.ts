export type Role = "ADMIN" | "KASIR";

export type PaymentMethod = "TUNAI" | "QRIS" | "DEBIT";

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: Role;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  code: string;
  phone: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  cashierId: string;
  cashierName: string;
  memberId?: string;
  memberName?: string;
  paymentMethod: PaymentMethod;
  total: number;
  amountReceived?: number;
  changeAmount?: number;
  items: CartItem[];
  status: "COMPLETED";
  createdAt: string;
}

export interface AppState {
  users: User[];
  products: Product[];
  members: Member[];
  transactions: Transaction[];
}
