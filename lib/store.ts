import bcrypt from "bcryptjs";
import type { AppState, Member, Product, Transaction, User } from "@/lib/types";

const STORAGE_KEYS = {
  app: "kasirbintang-app-state",
};

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

export const createSeedData = (): AppState => {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const cashierPassword = bcrypt.hashSync("kasir123", 10);

  const users: User[] = [
    {
      id: "user-admin",
      name: "Administrator",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
    {
      id: "user-kasir",
      name: "Kasir Pertama",
      username: "kasir",
      passwordHash: cashierPassword,
      role: "KASIR",
    },
  ];

  const products: Product[] = [
    {
      id: "prod-1",
      name: "Mouse Wireless Logitech",
      code: "MWS-001",
      price: 120000,
      stock: 12,
      imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=500&q=80",
      description: "Mouse wireless ergonomis untuk kantor dan gaming.",
      status: "ACTIVE",
      createdAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: "prod-2",
      name: "Kabel LAN Cat6",
      code: "LAN-006",
      price: 35000,
      stock: 8,
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80",
      description: "Kabel jaringan CAT6 berkualitas premium.",
      status: "ACTIVE",
      createdAt: "2026-09-02T08:00:00.000Z",
    },
    {
      id: "prod-3",
      name: "Flashdisk 32GB",
      code: "FD-032",
      price: 70000,
      stock: 5,
      imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=500&q=80",
      description: "Flashdisk USB 3.0 kapasitas 32GB.",
      status: "ACTIVE",
      createdAt: "2026-09-04T08:00:00.000Z",
    },
    {
      id: "prod-4",
      name: "Kabel HDMI",
      code: "HDMI-01",
      price: 45000,
      stock: 2,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=500&q=80",
      description: "Kabel HDMI 2m untuk projector dan monitor.",
      status: "ACTIVE",
      createdAt: "2026-09-06T08:00:00.000Z",
    },
    {
      id: "prod-5",
      name: "Keyboard USB",
      code: "KB-USB",
      price: 180000,
      stock: 0,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80",
      description: "Keyboard mekanik dengan koneksi USB.",
      status: "ACTIVE",
      createdAt: "2026-09-08T08:00:00.000Z",
    },
    {
      id: "prod-6",
      name: "Mouse Pad",
      code: "MP-001",
      price: 30000,
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80",
      description: "Mouse pad anti slip ukuran standar.",
      status: "ACTIVE",
      createdAt: "2026-09-10T08:00:00.000Z",
    },
    {
      id: "prod-7",
      name: "Kertas A4 80gsm",
      code: "A4-80",
      price: 25000,
      stock: 48,
      imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80",
      description: "Kertas A4 80gsm untuk kebutuhan kantor dan print.",
      status: "ACTIVE",
      createdAt: "2026-09-11T08:00:00.000Z",
    },
    {
      id: "prod-8",
      name: "Tinta Printer",
      code: "INK-001",
      price: 95000,
      stock: 6,
      imageUrl: "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=500&q=80",
      description: "Tinta printer warna hitam dengan kualitas cetak tajam.",
      status: "ACTIVE",
      createdAt: "2026-09-13T08:00:00.000Z",
    },
  ];

  const members = [
    { id: "member-1", name: "Rina Putri", code: "MBR-1001", phone: "081234567890", createdAt: "2026-09-01T08:00:00.000Z" },
    { id: "member-2", name: "Budi Santoso", code: "MBR-1002", phone: "082345678901", createdAt: "2026-09-10T08:00:00.000Z" },
  ];

  const now = new Date();
  const createRecentDate = (daysAgo: number, hours: number, minutes: number) => {
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  };

  const transactions: Transaction[] = [
    {
      id: "trx-001",
      transactionNumber: "TRX-2026-0001",
      cashierId: "user-kasir",
      cashierName: "Kasir Pertama",
      memberId: "member-1",
      memberName: "Rina Putri",
      paymentMethod: "TUNAI",
      total: 500000,
      amountReceived: 500000,
      changeAmount: 0,
      items: [
        { productId: "prod-1", name: "Mouse Wireless Logitech", price: 120000, quantity: 2 },
        { productId: "prod-7", name: "Kertas A4 80gsm", price: 25000, quantity: 8 },
      ],
      status: "COMPLETED",
      createdAt: createRecentDate(1, 9, 30),
    },
    {
      id: "trx-002",
      transactionNumber: "TRX-2026-0002",
      cashierId: "user-kasir",
      cashierName: "Kasir Pertama",
      paymentMethod: "QRIS",
      total: 235000,
      items: [
        { productId: "prod-3", name: "Flashdisk 32GB", price: 70000, quantity: 1 },
        { productId: "prod-8", name: "Tinta Printer", price: 95000, quantity: 1 },
      ],
      status: "COMPLETED",
      createdAt: createRecentDate(3, 10, 0),
    },
    {
      id: "trx-003",
      transactionNumber: "TRX-2026-0003",
      cashierId: "user-kasir",
      cashierName: "Kasir Pertama",
      paymentMethod: "DEBIT",
      total: 420000,
      items: [
        { productId: "prod-2", name: "Kabel LAN Cat6", price: 35000, quantity: 3 },
        { productId: "prod-4", name: "Kabel HDMI", price: 45000, quantity: 6 },
      ],
      status: "COMPLETED",
      createdAt: createRecentDate(5, 13, 45),
    },
    {
      id: "trx-004",
      transactionNumber: "TRX-2026-0004",
      cashierId: "user-kasir",
      cashierName: "Kasir Pertama",
      paymentMethod: "TUNAI",
      total: 180000,
      items: [{ productId: "prod-6", name: "Mouse Pad", price: 30000, quantity: 6 }],
      status: "COMPLETED",
      createdAt: createRecentDate(6, 16, 15),
    },
  ];

  return { users, products, members, transactions };
};

export const loadAppState = (): AppState => {
  if (typeof window === "undefined") return createSeedData();

  const raw = localStorage.getItem(STORAGE_KEYS.app);
  if (!raw) {
    const seed = createSeedData();
    localStorage.setItem(STORAGE_KEYS.app, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    return parsed;
  } catch {
    const seed = createSeedData();
    localStorage.setItem(STORAGE_KEYS.app, JSON.stringify(seed));
    return seed;
  }
};

export const saveAppState = (state: AppState): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.app, JSON.stringify(state));
  void fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).then((response) => {
    if (!response.ok) {
      console.error("Gagal menyimpan perubahan ke database:", response.status);
    }
  }).catch((error: unknown) => {
    console.error("Gagal menghubungi database:", error);
  });
  window.dispatchEvent(new Event("kasirbintang-state-updated"));
};

export const loadSharedAppState = async (): Promise<AppState> => {
  if (typeof window === "undefined") return createSeedData();

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("State request failed");
    const state = (await response.json()) as AppState;
    localStorage.setItem(STORAGE_KEYS.app, JSON.stringify(state));
    window.dispatchEvent(new Event("kasirbintang-state-updated"));
    return state;
  } catch (error: unknown) {
    console.error("Gagal memuat state dari database; memakai data lokal sementara:", error);
    return loadAppState();
  }
};

export const syncAppState = (setState: (nextState: AppState) => void) => {
  if (typeof window === "undefined") return () => undefined;

  const handleRefresh = () => setState(loadAppState());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.app) {
      handleRefresh();
    }
  };

  window.addEventListener("kasirbintang-state-updated", handleRefresh);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("kasirbintang-state-updated", handleRefresh);
    window.removeEventListener("storage", handleStorage);
  };
};

export const addProduct = (state: AppState, product: Product): AppState => ({
  ...state,
  products: [product, ...state.products],
});

export const updateProduct = (state: AppState, product: Product): AppState => ({
  ...state,
  products: state.products.map((item) => (item.id === product.id ? product : item)),
});

export const deleteProduct = (state: AppState, productId: string): AppState => ({
  ...state,
  products: state.products.filter((item) => item.id !== productId),
});

export const addMember = (state: AppState, member: Member): AppState => ({
  ...state,
  members: [member, ...state.members],
});

export const updateMember = (state: AppState, member: Member): AppState => ({
  ...state,
  members: state.members.map((item) => (item.id === member.id ? member : item)),
});

export const deleteMember = (state: AppState, memberId: string): AppState => ({
  ...state,
  members: state.members.filter((item) => item.id !== memberId),
});

export const addUser = (state: AppState, user: User): AppState => ({
  ...state,
  users: [user, ...state.users],
});

export const updateUser = (state: AppState, user: User): AppState => ({
  ...state,
  users: state.users.map((item) => (item.id === user.id ? user : item)),
});

export const deleteUser = (state: AppState, userId: string): AppState => ({
  ...state,
  users: state.users.filter((item) => item.id !== userId),
});

export const addTransaction = (state: AppState, transaction: Transaction): AppState => ({
  ...state,
  transactions: [transaction, ...state.transactions],
});

export const createProductCode = () => `PRD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const createMemberCode = () => `MBR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export const getStockStatus = (stock: number) => {
  if (stock <= 0) return "Habis";
  if (stock <= 5) return "Menipis";
  return "Aman";
};

export const getProductById = (state: AppState, productId: string) =>
  state.products.find((item) => item.id === productId);

export const getMemberById = (state: AppState, memberId: string) =>
  state.members.find((item) => item.id === memberId);
