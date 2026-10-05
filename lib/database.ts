import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AppState, Member, Product, Transaction, User } from "@/lib/types";
import { createSeedData } from "@/lib/store";

interface TimestampRow extends RowDataPacket {
  created_at: string | Date | null;
}

interface UserRow extends TimestampRow {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: User["role"];
}

interface ProductRow extends TimestampRow {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  status: Product["status"];
}

interface MemberRow extends TimestampRow {
  id: string;
  name: string;
  code: string;
  phone: string | null;
}

interface TransactionRow extends TimestampRow {
  id: string;
  transaction_number: string;
  cashier_id: string;
  cashier_name: string;
  member_id: string | null;
  member_name: string | null;
  payment_method: Transaction["paymentMethod"];
  total: number;
  amount_received: number | null;
  change_amount: number | null;
  items: Transaction["items"] | string;
  status: Transaction["status"];
}

interface ForeignKeyRow extends RowDataPacket {
  CONSTRAINT_NAME: string;
}

const globalForDatabase = globalThis as typeof globalThis & {
  mysqlPool?: Pool;
  mysqlSchemaReady?: Promise<void>;
};

const createDatabasePool = (): Pool => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Isi koneksi MySQL di .env.local.");
  }

  const url = new URL(connectionString);
  if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
    throw new Error("DATABASE_URL harus menggunakan protokol mysql://.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!url.hostname || !url.username || !database) {
    throw new Error("DATABASE_URL harus berisi host, user, dan nama database.");
  }

  return mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: true,
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
  });
};

const getPool = (): Pool => {
  if (!globalForDatabase.mysqlPool) {
    globalForDatabase.mysqlPool = createDatabasePool();
  }
  return globalForDatabase.mysqlPool;
};

const initializeSchema = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'KASIR') NOT NULL DEFAULT 'KASIR',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      price DECIMAL(12,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      image_url VARCHAR(255) NULL,
      description TEXT NULL,
      status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      phone VARCHAR(30) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      transaction_number VARCHAR(50) NOT NULL UNIQUE,
      cashier_id VARCHAR(64) NOT NULL,
      cashier_name VARCHAR(100) NOT NULL,
      member_id VARCHAR(64) NULL,
      member_name VARCHAR(100) NULL,
      payment_method ENUM('TUNAI', 'QRIS', 'DEBIT') NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      amount_received DECIMAL(12,2) NULL,
      change_amount DECIMAL(12,2) NULL,
      items JSON NOT NULL,
      status ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [foreignKeys] = await pool.query<ForeignKeyRow[]>(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transactions'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  for (const { CONSTRAINT_NAME: name } of foreignKeys) {
    const escapedName = name.replace(/`/g, "``");
    await pool.query(`ALTER TABLE transactions DROP FOREIGN KEY \`${escapedName}\``);
  }
};

const ensureSchema = async (pool: Pool): Promise<void> => {
  if (!globalForDatabase.mysqlSchemaReady) {
    globalForDatabase.mysqlSchemaReady = initializeSchema(pool).catch((error: unknown) => {
      globalForDatabase.mysqlSchemaReady = undefined;
      throw error;
    });
  }
  await globalForDatabase.mysqlSchemaReady;
};

const toIsoString = (value: string | Date | null): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();

  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Format created_at dari database tidak valid: ${value}`);
  }
  return parsed.toISOString();
};

const asDate = (value: string | undefined): Date =>
  value ? new Date(value) : new Date();

const isAppState = (value: unknown): value is AppState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AppState>;
  return (
    Array.isArray(state.users) &&
    Array.isArray(state.products) &&
    Array.isArray(state.members) &&
    Array.isArray(state.transactions)
  );
};

const readLegacyState = async (): Promise<AppState> => {
  const statePath = path.join(process.cwd(), ".data", "app-state.json");
  try {
    const value: unknown = JSON.parse(await readFile(statePath, "utf8"));
    if (!isAppState(value)) {
      throw new Error("File state lama tidak memiliki format yang valid.");
    }
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createSeedData();
    }
    throw error;
  }
};

const queryState = async (pool: Pool): Promise<AppState> => {
  const [[users], [products], [members], [transactions]] = await Promise.all([
    pool.query<UserRow[]>("SELECT id, name, username, password_hash, role, created_at FROM users ORDER BY created_at, id"),
    pool.query<ProductRow[]>("SELECT id, name, code, price, stock, image_url, description, status, created_at FROM products ORDER BY created_at, id"),
    pool.query<MemberRow[]>("SELECT id, name, code, phone, created_at FROM members ORDER BY created_at, id"),
    pool.query<TransactionRow[]>("SELECT id, transaction_number, cashier_id, cashier_name, member_id, member_name, payment_method, total, amount_received, change_amount, items, status, created_at FROM transactions ORDER BY created_at DESC, id"),
  ]);

  return {
    users: users.map((row): User => ({
      id: row.id,
      name: row.name,
      username: row.username,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: toIsoString(row.created_at),
    })),
    products: products.map((row): Product => ({
      id: row.id,
      name: row.name,
      code: row.code,
      price: row.price,
      stock: row.stock,
      imageUrl: row.image_url ?? undefined,
      description: row.description ?? undefined,
      status: row.status,
      createdAt: toIsoString(row.created_at),
    })),
    members: members.map((row): Member => ({
      id: row.id,
      name: row.name,
      code: row.code,
      phone: row.phone ?? "",
      createdAt: toIsoString(row.created_at),
    })),
    transactions: transactions.map((row): Transaction => ({
      id: row.id,
      transactionNumber: row.transaction_number,
      cashierId: row.cashier_id,
      cashierName: row.cashier_name,
      memberId: row.member_id ?? undefined,
      memberName: row.member_name ?? undefined,
      paymentMethod: row.payment_method,
      total: row.total,
      amountReceived: row.amount_received ?? undefined,
      changeAmount: row.change_amount ?? undefined,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
      status: row.status,
      createdAt: toIsoString(row.created_at),
    })),
  };
};

export const saveDatabaseState = async (state: AppState): Promise<void> => {
  const pool = getPool();
  await ensureSchema(pool);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM transactions");
    await connection.query("DELETE FROM products");
    await connection.query("DELETE FROM members");
    await connection.query("DELETE FROM users");

    for (const user of state.users) {
      await connection.execute(
        "INSERT INTO users (id, name, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [user.id, user.name, user.username, user.passwordHash, user.role, asDate(user.createdAt)],
      );
    }
    for (const product of state.products) {
      await connection.execute(
        "INSERT INTO products (id, name, code, price, stock, image_url, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [product.id, product.name, product.code, product.price, product.stock, product.imageUrl ?? null, product.description ?? null, product.status, asDate(product.createdAt)],
      );
    }
    for (const member of state.members) {
      await connection.execute(
        "INSERT INTO members (id, name, code, phone, created_at) VALUES (?, ?, ?, ?, ?)",
        [member.id, member.name, member.code, member.phone || null, asDate(member.createdAt)],
      );
    }
    for (const transaction of state.transactions) {
      await connection.execute(
        "INSERT INTO transactions (id, transaction_number, cashier_id, cashier_name, member_id, member_name, payment_method, total, amount_received, change_amount, items, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          transaction.id,
          transaction.transactionNumber,
          transaction.cashierId,
          transaction.cashierName,
          transaction.memberId ?? null,
          transaction.memberName ?? null,
          transaction.paymentMethod,
          transaction.total,
          transaction.amountReceived ?? null,
          transaction.changeAmount ?? null,
          JSON.stringify(transaction.items),
          transaction.status,
          asDate(transaction.createdAt),
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Rollback transaksi database gagal:", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
};

export const loadDatabaseState = async (): Promise<AppState> => {
  const pool = getPool();
  await ensureSchema(pool);

  const state = await queryState(pool);
  if (
    state.users.length === 0 &&
    state.products.length === 0 &&
    state.members.length === 0 &&
    state.transactions.length === 0
  ) {
    const initialState = await readLegacyState();
    await saveDatabaseState(initialState);
    return initialState;
  }

  return state;
};
