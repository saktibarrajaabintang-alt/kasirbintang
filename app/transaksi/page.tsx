"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Minus, PackageSearch, Plus, ReceiptText, Search, ShoppingCart, Trash2 } from "lucide-react";
import { AppShell, EmptyState, SimpleBadge, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { addTransaction, formatCurrency, loadAppState, loadSharedAppState, saveAppState } from "@/lib/store";
import type { CartItem, Member, PaymentMethod, Product, Transaction } from "@/lib/types";

const paymentMethods: Array<{ key: PaymentMethod; label: string; description: string }> = [
  { key: "TUNAI", label: "Tunai", description: "Bayar dengan uang tunai" },
  { key: "QRIS", label: "QRIS", description: "Scan QRIS" },
  { key: "DEBIT", label: "Debit", description: "Kartu debit" },
];

export default function TransaksiPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [productSearch, setProductSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberChoice, setMemberChoice] = useState<"yes" | "no" | "none">("no");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TUNAI");
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const session = parseSessionCookieValue(document.cookie.split("pos_session=")[1]?.split(";")[0]);
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
    setState(loadAppState());
    void loadSharedAppState().then(setState);

    const handleStateSync = () => setState(loadAppState());
    window.addEventListener("kasirbintang-state-updated", handleStateSync);
    window.addEventListener("storage", handleStateSync);
    window.addEventListener("focus", handleStateSync);

    const handleVisibilityChange = () => {
      if (!document.hidden) handleStateSync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("kasirbintang-state-updated", handleStateSync);
      window.removeEventListener("storage", handleStateSync);
      window.removeEventListener("focus", handleStateSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const productList = useMemo(() => {
    return state.products.filter((product) => {
      const matches = `${product.name} ${product.code}`.toLowerCase().includes(productSearch.toLowerCase());
      return matches;
    });
  }, [state.products, productSearch]);

  const memberList = useMemo(() => {
    return state.members.filter((member) => `${member.name} ${member.code} ${member.phone}`.toLowerCase().includes(memberSearch.toLowerCase()));
  }, [state.members, memberSearch]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const transactionTotal = subtotal;
  const selectedMember = selectedMemberId ? state.members.find((member) => member.id === selectedMemberId) ?? null : null;
  const changeAmount = paymentMethod === "TUNAI" ? Math.max(receivedAmount - transactionTotal, 0) : 0;

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item,
        );
      }
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const adjustQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, nextQty) };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const completeTransaction = () => {
    if (!user || cart.length === 0) return;

    const nextTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      transactionNumber: `TRX-${new Date().getFullYear()}-${String(state.transactions.length + 1).padStart(4, "0")}`,
      cashierId: user.id,
      cashierName: user.name,
      memberId: selectedMemberId ?? undefined,
      memberName: selectedMember ?? undefined ? selectedMember?.name : undefined,
      paymentMethod,
      total: transactionTotal,
      amountReceived: paymentMethod === "TUNAI" ? receivedAmount : undefined,
      changeAmount: paymentMethod === "TUNAI" ? changeAmount : undefined,
      items: cart,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    const nextProducts = state.products.map((product) => {
      const cartItem = cart.find((item) => item.productId === product.id);
      if (!cartItem) return product;
      return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
    });

    const nextState = {
      ...state,
      products: nextProducts,
      transactions: [nextTransaction, ...state.transactions],
    };

    setState(nextState);
    saveAppState(nextState);

    setSuccessTx(nextTransaction);
    setCart([]);
    setSelectedMemberId(null);
    setMemberChoice("no");
    setShowCheckout(false);
    setReceivedAmount(0);
    setProductSearch("");
  };

  const handlePrintReceipt = () => {
    if (!successTx) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const itemRows = successTx.items
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
          </tr>
        `,
      )
      .join("");

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Struk ${successTx.transactionNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #243B53;
              background: white;
            }
            .receipt {
              max-width: 420px;
              margin: 0 auto;
              border: 1px solid #D8E5F0;
              padding: 20px;
            }
            h1 {
              font-size: 20px;
              text-align: center;
              margin: 0 0 8px;
            }
            .meta {
              font-size: 12px;
              text-align: center;
              margin-bottom: 16px;
              color: #71879D;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              padding: 6px 4px;
              border-bottom: 1px solid #EAF2FA;
              text-align: left;
              vertical-align: top;
            }
            th {
              color: #71879D;
              font-weight: 700;
            }
            .total {
              margin-top: 12px;
              font-size: 13px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
            }
            .grand {
              font-weight: 700;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Tekno Citra Negara Business Center</h1>
            <div class="meta">ID: ${successTx.id}<br />No: ${successTx.transactionNumber}</div>

            <div class="total">
              <div class="total-row"><span>Kasir</span><span>${successTx.cashierName}</span></div>
              <div class="total-row"><span>Member</span><span>${successTx.memberName ?? "Non Member"}</span></div>
              <div class="total-row"><span>Pembayaran</span><span>${successTx.paymentMethod}</span></div>
              <div class="total-row"><span>Tanggal</span><span>${new Date(successTx.createdAt).toLocaleString("id-ID")}</span></div>
            </div>

            <table style="margin-top: 16px;">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div class="total">
              <div class="total-row"><span>Subtotal</span><span>${formatCurrency(successTx.total)}</span></div>
              <div class="total-row"><span>Jumlah Bayar</span><span>${successTx.amountReceived !== undefined ? formatCurrency(successTx.amountReceived) : formatCurrency(successTx.total)}</span></div>
              ${successTx.changeAmount !== undefined ? `<div class="total-row"><span>Kembalian</span><span>${formatCurrency(successTx.changeAmount)}</span></div>` : ""}
              <div class="total-row grand"><span>Total</span><span>${formatCurrency(successTx.total)}</span></div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((transaction) => {
      const matchesSearch = `${transaction.transactionNumber} ${transaction.cashierName}`.toLowerCase().includes(transactionSearch.toLowerCase());
      const matchesPayment = paymentFilter === "ALL" || transaction.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [state.transactions, transactionSearch, paymentFilter]);

  if (!user) return null;

  if (user.role === "ADMIN") {
    return (
      <AppShell user={user}>
        <div className="space-y-6">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Transaksi</div>
            <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Riwayat Transaksi</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Total Pendapatan" value={formatCurrency(state.transactions.reduce((sum, item) => sum + item.total, 0))} icon={<ShoppingCart size={18} />} />
            <StatCard title="Transaksi" value={String(state.transactions.length)} icon={<PackageSearch size={18} />} />
            <StatCard title="Pembayaran Tunai" value={String(state.transactions.filter((item) => item.paymentMethod === "TUNAI").length)} icon={<CreditCard size={18} />} />
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
                <input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Cari nomor transaksi" className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5285C0]" />
              </div>
              <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 text-sm text-[#243B53] outline-none focus:border-[#5285C0]">
                <option value="ALL">Semua Metode</option>
                <option value="TUNAI">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#D8E5F0] bg-white">
            {filteredTransactions.length === 0 ? (
              <div className="p-8"><EmptyState title="Belum ada data" description="Belum ada transaksi yang tercatat." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F3F8FC] text-[#71879D]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nomor</th>
                      <th className="px-4 py-3 font-medium">Kasir</th>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Pembayaran</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-[#EAF2FA] hover:bg-[#F3F8FC]">
                        <td className="px-4 py-3 font-medium text-[#243B53]">{transaction.transactionNumber}</td>
                        <td className="px-4 py-3">{transaction.cashierName}</td>
                        <td className="px-4 py-3">{transaction.memberName ?? "-"}</td>
                        <td className="px-4 py-3"><SimpleBadge label={transaction.paymentMethod} tone={transaction.paymentMethod === "TUNAI" ? "green" : transaction.paymentMethod === "QRIS" ? "blue" : "amber"} /></td>
                        <td className="px-4 py-3 text-[#243B53]">{formatCurrency(transaction.total)}</td>
                        <td className="px-4 py-3 text-[#71879D]">{new Date(transaction.createdAt).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">POS Kasir</div>
            <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Transaksi Penjualan</h1>
          </div>
          <div className="rounded-xl border border-[#D8E5F0] bg-white px-3 py-2 text-sm font-medium text-[#243B53]">Kasir: {user.name}</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
                <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Cari produk..." className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5285C0]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {productList.length === 0 ? (
                <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="Belum ada produk" description="Belum ada produk sesuai pencarian." /></div>
              ) : (
                productList.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-[#D8E5F0] bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative">
                      <img src={product.imageUrl ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"} alt={product.name} className="h-28 w-full rounded-xl object-cover" />
                      {product.stock <= 5 && product.stock > 0 ? <div className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Stok menipis</div> : null}
                      {product.stock === 0 ? <div className="absolute left-2 top-2 rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">Habis</div> : null}
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#243B53]">{product.name}</div>
                        <div className="text-xs text-[#71879D]">{product.code}</div>
                      </div>
                      <div className="text-sm font-bold text-[#3F6F9F]">{formatCurrency(product.price)}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#71879D]">
                      <span>Stok: {product.stock}</span>
                      <button disabled={product.stock <= 0} onClick={() => handleAddToCart(product)} className="rounded-lg bg-[#5285C0] px-3 py-1.5 font-medium text-white transition hover:bg-[#3F6F9F] disabled:cursor-not-allowed disabled:bg-slate-300">Tambah</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#243B53]">Keranjang</h2>
              <span className="text-sm text-[#71879D]">{cart.length} item</span>
            </div>

            <div className="space-y-3">
              {cart.length === 0 ? (
                <EmptyState title="Keranjang kosong" description="Belum ada produk yang dipilih." />
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-[#243B53]">{item.name}</div>
                        <div className="text-xs text-[#71879D]">{formatCurrency(item.price)} / item</div>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustQuantity(item.productId, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E5F0] bg-white text-[#243B53]">
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-[#243B53]">{item.quantity}</span>
                        <button onClick={() => adjustQuantity(item.productId, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E5F0] bg-white text-[#243B53]">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="font-semibold text-[#3F6F9F]">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-[#EAF2FA] pt-4">
              <div className="flex justify-between text-sm text-[#71879D]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-bold text-[#243B53]">
                <span>Total</span>
                <span>{formatCurrency(transactionTotal)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium text-[#243B53]">Apakah pelanggan memiliki member?</div>
                <div className="flex gap-2">
                  <button onClick={() => setMemberChoice("yes")} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${memberChoice === "yes" ? "border-[#5285C0] bg-[#EAF2FA] text-[#5285C0]" : "border-[#D8E5F0] bg-white text-[#243B53]"}`}>Ya</button>
                  <button onClick={() => { setMemberChoice("no"); setSelectedMemberId(null); }} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${memberChoice === "no" ? "border-[#5285C0] bg-[#EAF2FA] text-[#5285C0]" : "border-[#D8E5F0] bg-white text-[#243B53]"}`}>Bukan Member</button>
                </div>
              </div>

              {memberChoice === "yes" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
                    <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Cari member" className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5285C0]" />
                  </div>
                  <div className="space-y-2">
                    {memberList.length === 0 ? <p className="text-xs text-[#71879D]">Tidak ada member yang cocok.</p> : memberList.map((member) => (
                      <button key={member.id} onClick={() => setSelectedMemberId(member.id)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${selectedMemberId === member.id ? "border-[#5285C0] bg-[#EAF2FA]" : "border-[#D8E5F0] bg-white"}`}>
                        <div>
                          <div className="font-semibold text-[#243B53]">{member.name}</div>
                          <div className="text-xs text-[#71879D]">{member.code} • {member.phone}</div>
                        </div>
                        <SimpleBadge label="Pilih" tone="blue" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button onClick={() => setShowCheckout(true)} disabled={cart.length === 0} className="w-full rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F] disabled:cursor-not-allowed disabled:bg-slate-300">Checkout</button>
            </div>
          </div>
        </div>
      </div>

      {showCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243B53]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[#D8E5F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#243B53]">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="rounded-lg border border-[#D8E5F0] px-3 py-1.5 text-sm text-[#71879D]">Tutup</button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-[#F3F8FC] p-4">
                <div className="mb-3 flex justify-between text-sm text-[#71879D]">
                  <span>Ringkasan pesanan</span>
                  <span>Member: {selectedMember ? selectedMember.name : "Non Member"}</span>
                </div>
                {cart.map((item) => (
                  <div key={item.productId} className="mb-2 flex justify-between text-sm text-[#243B53]">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-[#D8E5F0] pt-3 text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base font-bold text-[#243B53]">
                  <span>Total</span>
                  <span>{formatCurrency(transactionTotal)}</span>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-[#243B53]">Metode pembayaran</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {paymentMethods.map((method) => (
                    <button key={method.key} onClick={() => setPaymentMethod(method.key)} className={`rounded-xl border p-3 text-left ${paymentMethod === method.key ? "border-[#5285C0] bg-[#EAF2FA] text-[#5285C0]" : "border-[#D8E5F0] bg-white text-[#243B53]"}`}>
                      <div className="font-semibold">{method.label}</div>
                      <div className="mt-1 text-[11px] text-[#71879D]">{method.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "TUNAI" ? (
                <div>
                  <div className="mb-2 text-sm font-medium text-[#243B53]">Uang diterima</div>
                  <input type="number" value={receivedAmount || ""} onChange={(event) => setReceivedAmount(Number(event.target.value))} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" placeholder="Masukkan nominal" />
                  <div className="mt-3 flex gap-2">
                    {[50000, 100000, 200000].map((amount) => (
                      <button key={amount} onClick={() => setReceivedAmount(amount)} className="rounded-lg border border-[#D8E5F0] bg-white px-3 py-1.5 text-xs font-medium text-[#243B53]">{formatCurrency(amount)}</button>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-[#243B53]">Kembalian: <span className="font-semibold">{formatCurrency(changeAmount)}</span></div>
                  {receivedAmount < transactionTotal ? <div className="mt-2 text-xs text-red-600">Uang yang diterima belum mencukupi.</div> : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D8E5F0] bg-[#F3F8FC] p-4 text-sm text-[#243B53]">
                  <div className="mb-2 font-semibold">{paymentMethod === "QRIS" ? "Pembayaran QRIS" : "Pembayaran Debit"}</div>
                  {paymentMethod === "QRIS" ? (
                    <div className="rounded-xl border border-[#D8E5F0] bg-white p-4 text-center">
                      <img src="/qris.png" alt="QRIS KBSTORE.ID, Cipayung" className="mx-auto aspect-square w-full max-w-[280px] object-contain" />
                      <div className="mt-3 text-xs text-[#71879D]">Scan QRIS untuk menyelesaikan pembayaran.</div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#D8E5F0] bg-white p-5 text-center text-[#71879D]">Masukkan kartu debit pada mesin EDC.</div>
                  )}
                </div>
              )}

              <button onClick={completeTransaction} disabled={paymentMethod === "TUNAI" && receivedAmount < transactionTotal} className="w-full rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F] disabled:cursor-not-allowed disabled:bg-slate-300">Bayar Sekarang</button>
            </div>
          </div>
        </div>
      ) : null}

      {successTx ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#243B53]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#D8E5F0] bg-white p-6 shadow-xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
              <h3 className="text-2xl font-bold text-[#243B53]">Transaksi Berhasil</h3>
              <div className="mt-2 text-sm text-[#71879D]">{successTx.transactionNumber}</div>
            </div>

            <div className="mb-5 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] p-4 text-sm text-[#243B53]">
              <div className="mb-3 flex items-center justify-between border-b border-[#D8E5F0] pb-2">
                <span className="font-semibold text-[#243B53]">ID Transaksi</span>
                <span className="font-medium">{successTx.id}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span>Kasir</span>
                <span>{successTx.cashierName}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span>Member</span>
                <span>{successTx.memberName ?? "Non Member"}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span>Pembayaran</span>
                <span>{successTx.paymentMethod}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span>Tanggal</span>
                <span>{new Date(successTx.createdAt).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-[#D8E5F0] bg-white p-4">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#71879D]">Daftar Barang</div>

              <div className="space-y-3 text-sm text-[#243B53]">
                {successTx.items.map((item) => (
                  <div key={`${successTx.id}-${item.productId}`} className="flex items-start justify-between gap-3 border-b border-[#EAF2FA] pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[#71879D]">{item.quantity} x {formatCurrency(item.price)}</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] p-4 text-sm text-[#243B53]">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(successTx.total)}</span></div>
              <div className="mt-2 flex justify-between"><span>Jumlah Dibayar</span><span>{successTx.amountReceived !== undefined ? formatCurrency(successTx.amountReceived) : formatCurrency(successTx.total)}</span></div>
              {successTx.changeAmount !== undefined ? <div className="mt-2 flex justify-between"><span>Kembalian</span><span>{formatCurrency(successTx.changeAmount)}</span></div> : null}
              <div className="mt-3 flex justify-between border-t border-[#D8E5F0] pt-3 text-base font-bold text-[#243B53]">
                <span>Total</span>
                <span>{formatCurrency(successTx.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={handlePrintReceipt} className="flex-1 rounded-xl border border-[#D8E5F0] bg-white px-4 py-3 text-sm font-semibold text-[#243B53]">Cetak ke PDF</button>
              <button onClick={() => setSuccessTx(null)} className="flex-1 rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">Transaksi Baru</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
