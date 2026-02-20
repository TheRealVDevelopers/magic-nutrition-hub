import { useState } from "react";
import { dailySalesData, paymentSplitData } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const membershipRevenue = [
  { pkg: "Bronze", revenue: 7500, count: 5 },
  { pkg: "Silver", revenue: 17500, count: 7 },
  { pkg: "Gold", revenue: 28000, count: 7 },
];

export default function BillingReports() {
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [toDate, setToDate] = useState("2026-02-20");
  const totalRevenue = dailySalesData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Billing Reports</h2>
          <p className="text-sm text-muted-foreground">Revenue analytics and sales breakdown</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36 h-9" />
          <span className="text-muted-foreground text-sm">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36 h-9" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily Sales */}
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-1">Daily Sales Report</h3>
          <p className="text-sm text-muted-foreground mb-3">Total Revenue: <strong className="text-primary">₹{totalRevenue.toLocaleString()}</strong></p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,15%,90%)" />
              <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(122,46%,33%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Split */}
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Payment Mode Split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={paymentSplitData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {paymentSplitData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product-wise */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-3">Product-wise Sales Report</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Product</th><th className="pb-2 text-center">Qty Sold</th><th className="pb-2 text-right">Revenue</th></tr></thead>
          <tbody>
            {dailySalesData.map((d, i) => (
              <tr key={i} className="border-b border-border/50"><td className="py-2">{d.product}</td><td className="py-2 text-center">{d.qty}</td><td className="py-2 text-right font-semibold">₹{d.revenue.toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Membership Revenue */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-3">Membership Revenue Report</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Package</th><th className="pb-2 text-center">Count</th><th className="pb-2 text-right">Revenue</th></tr></thead>
          <tbody>
            {membershipRevenue.map((m, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2"><span className={`badge-${m.pkg.toLowerCase()}`}>{m.pkg}</span></td>
                <td className="py-2 text-center">{m.count}</td>
                <td className="py-2 text-right font-semibold">₹{m.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
