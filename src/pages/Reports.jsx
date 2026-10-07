import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

const REPORTS_API = `${API}/reports/index.php`;

const peso = (value) =>
    "₱" +
    Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

// yyyy-mm-dd in the user's own time zone
const toISO = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return toISO(date);
};

const presets = [
    { label: "Today", from: () => toISO(new Date()), to: () => toISO(new Date()) },
    { label: "Last 7 days", from: () => daysAgo(6), to: () => toISO(new Date()) },
    { label: "Last 30 days", from: () => daysAgo(29), to: () => toISO(new Date()) },
    {
        label: "This month",
        from: () => {
            const now = new Date();
            return toISO(new Date(now.getFullYear(), now.getMonth(), 1));
        },
        to: () => toISO(new Date())
    }
];

const shortDay = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric"
    });


function Reports() {

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [from, setFrom] = useState(daysAgo(29));
    const [to, setTo] = useState(toISO(new Date()));
    const [activePreset, setActivePreset] = useState("Last 30 days");

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const loadReport = async (rangeFrom, rangeTo) => {

        try {

            setLoading(true);
            setError("");

            const response = await apiFetch(
                `${REPORTS_API}?from=${rangeFrom}&to=${rangeTo}`
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to load the report.");
            }

            setReport(result);

        } catch (err) {

            setError(err.message || "Failed to load the report.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadReport(from, to);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const applyPreset = (preset) => {
        const nextFrom = preset.from();
        const nextTo = preset.to();

        setFrom(nextFrom);
        setTo(nextTo);
        setActivePreset(preset.label);
        loadReport(nextFrom, nextTo);
    };

    const applyCustom = (event) => {
        event.preventDefault();
        setActivePreset("");
        loadReport(from, to);
    };


    const maxSales = useMemo(
        () => Math.max(1, ...(report?.daily || []).map((day) => day.sales)),
        [report]
    );

    const maxQuantity = useMemo(
        () => Math.max(1, ...(report?.top_products || []).map((p) => Number(p.quantity))),
        [report]
    );

    const totalPayments = useMemo(
        () => (report?.payments || []).reduce((sum, p) => sum + Number(p.sales), 0) || 1,
        [report]
    );

    const maxCategory = useMemo(
        () => Math.max(1, ...(report?.categories || []).map((c) => Number(c.revenue))),
        [report]
    );


    const exportCsv = () => {

        if (!report) {
            return;
        }

        const rows = [
            ["Siomai House sales report", `${report.range.from} to ${report.range.to}`],
            [],
            ["Revenue", report.summary.revenue],
            ["Orders", report.summary.orders],
            ["Items sold", report.summary.items_sold],
            ["Average order", report.summary.average_order.toFixed(2)],
            [],
            ["Date", "Orders", "Sales"],
            ...report.daily.map((d) => [d.day, d.orders, d.sales]),
            [],
            ["Top product", "Quantity", "Revenue"],
            ...report.top_products.map((p) => [p.product_name, p.quantity, p.revenue])
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const url = URL.createObjectURL(
            new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
        );

        const link = document.createElement("a");
        link.href = url;
        link.download = `siomai-report-${report.range.from}-to-${report.range.to}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    };


    const summary = report?.summary;
    const daily = report?.daily || [];
    const labelEvery = Math.max(1, Math.ceil(daily.length / 8));


    return (

        <div className="app-shell">

            <Sidebar
                active="Reports"
                user={user}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Reports</h1>
                        <p>Sales summary for Siomai House.</p>
                    </div>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={exportCsv}
                        disabled={!report}
                    >
                        Download CSV
                    </button>

                </header>


                <div className="report-filters">

                    <div className="report-presets">

                        {presets.map((preset) => (

                            <button
                                key={preset.label}
                                type="button"
                                className={
                                    activePreset === preset.label
                                        ? "report-chip active"
                                        : "report-chip"
                                }
                                onClick={() => applyPreset(preset)}
                            >
                                {preset.label}
                            </button>

                        ))}

                    </div>

                    <form className="report-custom" onSubmit={applyCustom}>

                        <input
                            type="date"
                            value={from}
                            max={to}
                            onChange={(event) => setFrom(event.target.value)}
                        />

                        <span>to</span>

                        <input
                            type="date"
                            value={to}
                            min={from}
                            onChange={(event) => setTo(event.target.value)}
                        />

                        <button type="submit" className="primary-btn">
                            Apply
                        </button>

                    </form>

                </div>


                {error && (
                    <div className="orders-error">{error}</div>
                )}


                <section className="stat-grid">

                    <div className="stat-card">
                        <span>Revenue</span>
                        <strong>{peso(summary?.revenue)}</strong>
                        <small>Cancelled orders excluded</small>
                    </div>

                    <div className="stat-card">
                        <span>Orders</span>
                        <strong>{summary?.orders ?? 0}</strong>
                        <small>In the selected dates</small>
                    </div>

                    <div className="stat-card">
                        <span>Items Sold</span>
                        <strong>{summary?.items_sold ?? 0}</strong>
                        <small>Total quantity</small>
                    </div>

                    <div className="stat-card">
                        <span>Average Order</span>
                        <strong>{peso(summary?.average_order)}</strong>
                        <small>Revenue ÷ orders</small>
                    </div>

                </section>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Sales per Day</h3>
                        <span>
                            {report ? `${shortDay(report.range.from)} – ${shortDay(report.range.to)}` : ""}
                        </span>
                    </div>

                    {loading ? (

                        <div className="orders-empty">Loading report...</div>

                    ) : daily.every((d) => d.sales === 0) ? (

                        <div className="orders-empty">No sales in these dates.</div>

                    ) : (

                        <div className="report-chart">

                            {daily.map((day, index) => (

                                <div
                                    key={day.day}
                                    className="report-bar-col"
                                    title={`${shortDay(day.day)}: ${peso(day.sales)} · ${day.orders} order${day.orders !== 1 ? "s" : ""}`}
                                >

                                    <div className="report-bar-track">
                                        <div
                                            className="report-bar"
                                            style={{
                                                height: `${(day.sales / maxSales) * 100}%`
                                            }}
                                        />
                                    </div>

                                    <span className="report-bar-label">
                                        {index % labelEvery === 0 ? shortDay(day.day) : ""}
                                    </span>

                                </div>

                            ))}

                        </div>

                    )}

                </section>


                <section className="panel-grid">

                    <div className="panel">

                        <div className="panel-title">
                            <h3>Top Products</h3>
                            <span>By quantity sold</span>
                        </div>

                        {(report?.top_products || []).length === 0 ? (

                            <div className="orders-empty">No data yet.</div>

                        ) : (

                            <div className="report-list">

                                {report.top_products.map((product, index) => (

                                    <div key={index} className="report-row">

                                        <div className="report-row-head">
                                            <strong>
                                                {index + 1}. {product.product_name || "Deleted product"}
                                            </strong>
                                            <span>
                                                {product.quantity} sold · {peso(product.revenue)}
                                            </span>
                                        </div>

                                        <div className="report-meter">
                                            <div
                                                style={{
                                                    width: `${(Number(product.quantity) / maxQuantity) * 100}%`
                                                }}
                                            />
                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>


                    <div className="panel">

                        <div className="panel-title">
                            <h3>Payment Methods</h3>
                            <span>Share of sales</span>
                        </div>

                        {(report?.payments || []).length === 0 ? (

                            <div className="orders-empty">No data yet.</div>

                        ) : (

                            <div className="report-list">

                                {report.payments.map((payment) => {

                                    const share = (Number(payment.sales) / totalPayments) * 100;

                                    return (

                                        <div key={payment.payment_method} className="report-row">

                                            <div className="report-row-head">
                                                <strong>{payment.payment_method}</strong>
                                                <span>
                                                    {payment.orders_count} order
                                                    {Number(payment.orders_count) !== 1 ? "s" : ""} · {peso(payment.sales)} · {share.toFixed(0)}%
                                                </span>
                                            </div>

                                            <div className="report-meter">
                                                <div style={{ width: `${share}%` }} />
                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                        )}


                        <div className="panel-title report-subtitle">
                            <h3>Categories</h3>
                            <span>By revenue</span>
                        </div>

                        {(report?.categories || []).length === 0 ? (

                            <div className="orders-empty">No data yet.</div>

                        ) : (

                            <div className="report-list">

                                {report.categories.map((category) => (

                                    <div key={category.category} className="report-row">

                                        <div className="report-row-head">
                                            <strong>{category.category}</strong>
                                            <span>
                                                {category.quantity} sold · {peso(category.revenue)}
                                            </span>
                                        </div>

                                        <div className="report-meter">
                                            <div
                                                style={{
                                                    width: `${(Number(category.revenue) / maxCategory) * 100}%`
                                                }}
                                            />
                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}


export default Reports;
