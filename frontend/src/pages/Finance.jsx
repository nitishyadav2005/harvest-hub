
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Finance.css";


export default function Finance() {
    const [farmId, setFarmId] = useState(null);

    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState("ALL");

    const initialForm = {
        type: "INCOME",
        category: "",
        title: "",
        amount: "",
        transactionDate: new Date().toISOString().slice(0, 10),
        notes: ""
    };

    const [form, setForm] = useState(initialForm);

    const loadFinance = useCallback(async (id) => {
        try {
            setLoading(true);
            setError("");

            const [summaryResponse, transactionsResponse] =
                await Promise.all([
                    api.get(`/finance/farms/${id}/summary`),
                    api.get(`/finance/farms/${id}/transactions`)
                ]);

            setSummary(summaryResponse.data);
            setTransactions(transactionsResponse.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Finance data load nahi ho saka."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function initialize() {
            try {
                const response = await api.get("/farms");
                const farms = response.data;

                if (!farms || farms.length === 0) {
                    setError(
                        "Pehle Fields & Crops section mein farm create karo."
                    );
                    setLoading(false);
                    return;
                }

                const id = farms[0].id;
                setFarmId(id);

                await loadFinance(id);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Farm details load nahi ho sake."
                );
                setLoading(false);
            }
        }

        initialize();
    }, [loadFinance]);

    const resetForm = () => {
        setForm({
            ...initialForm,
            transactionDate: new Date().toISOString().slice(0, 10)
        });
        setEditingId(null);
    };

    const openAddModal = () => {
        resetForm();
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        resetForm();
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "type" ? { category: "" } : {})
        }));
    };

    const handleEdit = (transaction) => {
        setEditingId(transaction.id);

        setForm({
            type: transaction.type || "INCOME",
            category: transaction.category || "",
            title: transaction.title || "",
            amount: String(transaction.amount ?? ""),
            transactionDate:
                transaction.transactionDate ||
                new Date().toISOString().slice(0, 10),
            notes: transaction.notes || ""
        });

        setError("");
        setShowModal(true);
    };

    const handleAddTransaction = async (event) => {
        event.preventDefault();

        if (!farmId || saving) return;

        const isEditing = editingId !== null;

        try {
            setSaving(true);
            setError("");

            const payload = {
                farmId,
                type: form.type,
                category: form.category,
                title: form.title.trim(),
                amount: Number(form.amount),
                transactionDate: form.transactionDate,
                notes: form.notes.trim()
            };

            if (isEditing) {
                await api.put(
                    `/finance/farms/${farmId}/transactions/${editingId}`,
                    payload
                );
            } else {
                await api.post("/finance/transactions", payload);
            }

            setShowModal(false);
            resetForm();

            await loadFinance(farmId);
        } catch (err) {
            console.error("Transaction save error:", err);
            console.error("Server response:", err.response?.data);

            setError(
                err.response?.data?.message ||
                `Transaction ${isEditing ? "update" : "save"} nahi ho saka.`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (transactionId) => {
        if (
            !window.confirm(
                "Kya tum ye transaction delete karna chahte ho?"
            )
        ) {
            return;
        }

        try {
            setError("");

            await api.delete(
                `/finance/farms/${farmId}/transactions/${transactionId}`
            );

            await loadFinance(farmId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Transaction delete nahi ho saka."
            );
        }
    };

    const visibleTransactions = transactions.filter((transaction) => {
        return filter === "ALL" || transaction.type === filter;
    });

    const monthlyData = useMemo(() => {
        const today = new Date();
        const months = [];

        // Current month aur pichhle 5 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
            );

            months.push({
                key: `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`,
                month: date.toLocaleString("en-IN", {
                    month: "short"
                }),
                income: 0,
                expenses: 0
            });
        }

        transactions.forEach((transaction) => {
            if (!transaction.transactionDate) return;

            const date = String(transaction.transactionDate).slice(0, 10);
            const monthKey = date.slice(0, 7);

            const monthData = months.find(
                (item) => item.key === monthKey
            );

            if (!monthData) return;

            const amount = Number(transaction.amount) || 0;

            if (transaction.type === "INCOME") {
                monthData.income += amount;
            } else if (transaction.type === "EXPENSE") {
                monthData.expenses += amount;
            }
        });

        return months.map((item) => ({
            ...item,
            income: Number(item.income.toFixed(2)),
            expenses: Number(item.expenses.toFixed(2))
        }));
    }, [transactions]);

    const expenseCategoryData = useMemo(() => {
        const categories = {};

        transactions.forEach((transaction) => {
            if (transaction.type !== "EXPENSE") return;

            const category = transaction.category || "Other Expense";
            categories[category] =
                (categories[category] || 0) +
                (Number(transaction.amount) || 0);
        });

        return Object.entries(categories)
            .map(([name, value]) => ({
                name,
                value: Number(value.toFixed(2))
            }))
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    const chartColors = [
        "#258653",
        "#E5A443",
        "#4D85D9",
        "#9565C7",
        "#E47765",
        "#56A8A0"
    ];

    const formatMoney = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);

    return (
        <div className="finance-layout">
            <Sidebar />

            <main className="finance-main">
                <header className="finance-header">
                    <div>
                        <p className="finance-eyebrow">
                            HARVESTHUB MANAGEMENT
                        </p>
                        <h1>Finance & Expenses 💰</h1>
                        <p>
                            Apne farm ki income, expenses aur profit track karo.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="finance-primary-btn"
                        onClick={openAddModal}
                    >
                        + Add Transaction
                    </button>
                </header>

                {error && (
                    <div className="finance-error" role="alert">
                        {error}
                    </div>
                )}

                <section className="finance-summary-grid">
                    <article className="finance-summary-card income-card">
                        <span className="finance-card-icon">↗</span>
                        <p>Total Income</p>
                        <h2>
                            {loading
                                ? "Loading..."
                                : formatMoney(summary.totalIncome)}
                        </h2>
                        <span>Recorded earnings</span>
                    </article>

                    <article className="finance-summary-card expense-card">
                        <span className="finance-card-icon">↘</span>
                        <p>Total Expenses</p>
                        <h2>
                            {loading
                                ? "Loading..."
                                : formatMoney(summary.totalExpenses)}
                        </h2>
                        <span>Recorded spending</span>
                    </article>

                    <article className="finance-summary-card profit-card">
                        <span className="finance-card-icon">₹</span>
                        <p>Net Profit</p>
                        <h2>
                            {loading
                                ? "Loading..."
                                : formatMoney(summary.netProfit)}
                        </h2>
                        <span>Income minus expenses</span>
                    </article>
                </section>

                <section className="finance-charts-grid">
                    <article className="finance-chart-card">
                        <div className="finance-section-header">
                            <div>
                                <h2>Income vs Expenses</h2>
                                <p>Monthly financial overview</p>
                            </div>
                        </div>

                        <div className="finance-chart-container">
                            {loading ? (
                                <p className="finance-empty">Loading chart...</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={monthlyData}
                                        margin={{
                                            top: 12,
                                            right: 12,
                                            left: 4,
                                            bottom: 4
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E6EDE7"
                                        />

                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: "#66756A", fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tick={{ fill: "#66756A", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={55}
                                            tickFormatter={(value) =>
                                                value >= 1000
                                                    ? `₹${(value / 1000).toFixed(1)}k`
                                                    : `₹${value}`
                                            }
                                        />

                                        <Tooltip
                                            formatter={(value, name) => [
                                                formatMoney(value),
                                                name
                                            ]}
                                        />

                                        <Legend />

                                        <Bar
                                            dataKey="income"
                                            name="Income"
                                            fill="#258653"
                                            radius={[5, 5, 0, 0]}
                                        />

                                        <Bar
                                            dataKey="expenses"
                                            name="Expenses"
                                            fill="#E5A443"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </article>

                    <article className="finance-chart-card">
                        <div className="finance-section-header">
                            <div>
                                <h2>Expense Breakdown</h2>
                                <p>Spending by category</p>
                            </div>
                        </div>

                        <div className="finance-chart-container">
                            {loading ? (
                                <p className="finance-empty">Loading chart...</p>
                            ) : expenseCategoryData.length === 0 ? (
                                <div className="finance-empty">
                                    <span>🌱</span>
                                    <h3>No expenses recorded</h3>
                                    <p>Add an expense to see your category breakdown.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseCategoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={52}
                                            outerRadius={85}
                                            paddingAngle={3}
                                        >
                                            {expenseCategoryData.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={
                                                        chartColors[
                                                        index % chartColors.length
                                                            ]
                                                    }
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value) => formatMoney(value)}
                                        />

                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </article>
                </section>

                <section className="finance-transactions-panel">
                    <div className="finance-section-header">
                        <div>
                            <h2>Recent Transactions</h2>
                            <p>Your farm's financial activity</p>
                        </div>

                        <select
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value)
                            }
                            aria-label="Filter transactions"
                        >
                            <option value="ALL">All Transactions</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expenses</option>
                        </select>
                    </div>

                    {loading ? (
                        <p className="finance-empty">
                            Loading transactions...
                        </p>
                    ) : visibleTransactions.length === 0 ? (
                        <div className="finance-empty">
                            <span>🌱</span>
                            <h3>No transactions yet</h3>
                            <p>
                                Add your first income or expense to get started.
                            </p>
                            <button
                                type="button"
                                className="finance-secondary-btn"
                                onClick={openAddModal}
                            >
                                Add your first transaction
                            </button>
                        </div>
                    ) : (
                        <div className="finance-table-wrapper">
                            <table className="finance-table">
                                <thead>
                                <tr>
                                    <th>Transaction</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                                </thead>

                                <tbody>
                                {visibleTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>
                                            <strong>
                                                {transaction.title}
                                            </strong>
                                            {transaction.notes && (
                                                <small>
                                                    {transaction.notes}
                                                </small>
                                            )}
                                        </td>

                                        <td>{transaction.category}</td>
                                        <td>{transaction.transactionDate}</td>

                                        <td>
                                                <span
                                                    className={`finance-type-badge ${
                                                        transaction.type === "INCOME"
                                                            ? "type-income"
                                                            : "type-expense"
                                                    }`}
                                                >
                                                    {transaction.type}
                                                </span>
                                        </td>

                                        <td
                                            className={
                                                transaction.type === "INCOME"
                                                    ? "finance-income-amount"
                                                    : "finance-expense-amount"
                                            }
                                        >
                                            {transaction.type === "INCOME"
                                                ? "+"
                                                : "-"}
                                            {formatMoney(transaction.amount)}
                                        </td>


                                        <td>
                                            <div className="finance-row-actions">
                                                <button
                                                    type="button"
                                                    className="finance-icon-action finance-icon-edit"
                                                    onClick={() => handleEdit(transaction)}
                                                    title="Edit transaction"
                                                    aria-label="Edit transaction"
                                                >
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M12 20H21" />
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="finance-icon-action finance-icon-delete"
                                                    onClick={() => handleDelete(transaction.id)}
                                                    title="Delete transaction"
                                                    aria-label="Delete transaction"
                                                >
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4h8v2" />
                                                        <path d="M19 6l-1 14H6L5 6" />
                                                        <path d="M10 11v5" />
                                                        <path d="M14 11v5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>


                {showModal && (
                    <div
                        className="finance-modal-overlay"
                        onClick={closeModal}
                    >
                        <section
                            className="finance-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="finance-modal-title"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="finance-modal-header">
                                <div className="finance-modal-heading">
                                    <h2 id="finance-modal-title">
                                        {editingId !== null
                                            ? "Edit Farm Transaction"
                                            : "Add New Farm Transaction"}
                                    </h2>

                                    <p>
                                        Record income, expenses, and other farm
                                        financial activities.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="finance-close-btn"
                                    onClick={closeModal}
                                    aria-label="Close dialog"
                                    disabled={saving}
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                className="finance-form"
                                onSubmit={handleAddTransaction}
                            >
                                <label>
                                    Transaction Type *
                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="INCOME">Income</option>
                                        <option value="EXPENSE">Expense</option>
                                    </select>
                                </label>

                                <label>
                                    Transaction Title *
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Wheat sale"
                                        maxLength={200}
                                        required
                                    />
                                </label>

                                <label>
                                    Category *
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select category</option>

                                        {form.type === "INCOME" ? (
                                            <>
                                                <option value="Crop Sale">
                                                    Crop Sale
                                                </option>
                                                <option value="Other Income">
                                                    Other Income
                                                </option>
                                                <option value="Government Subsidy">
                                                    Government Subsidy
                                                </option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Seeds">Seeds</option>
                                                <option value="Fertilizer">
                                                    Fertilizer
                                                </option>
                                                <option value="Labour">Labour</option>
                                                <option value="Equipment">
                                                    Equipment
                                                </option>
                                                <option value="Irrigation">
                                                    Irrigation
                                                </option>
                                                <option value="Other Expense">
                                                    Other Expense
                                                </option>
                                            </>
                                        )}
                                    </select>
                                </label>

                                <label>
                                    Amount (₹) *
                                    <input
                                        name="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={handleInputChange}
                                        placeholder="Enter amount"
                                        required
                                    />
                                </label>

                                <label>
                                    Transaction Date *
                                    <input
                                        name="transactionDate"
                                        type="date"
                                        value={form.transactionDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label className="finance-form-full">
                                    Transaction Notes
                                    <textarea
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Payment details, transaction notes..."
                                        maxLength={1000}
                                        rows={3}
                                    />
                                </label>

                                <div className="finance-modal-actions">
                                    <button
                                        type="button"
                                        className="finance-secondary-btn"
                                        onClick={closeModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="finance-primary-btn"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Please wait..."
                                            : editingId !== null
                                                ? "Update Transaction"
                                                : "Save Transaction"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}

            </main>
        </div>
    );
}
