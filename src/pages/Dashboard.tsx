import { IndianRupee, Users, CalendarClock, UserCheck, HeartHandshake, Plus, ShoppingCart, ClipboardCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { members, salesTrendData, membershipGrowthData, productSalesData, packageDistributionData } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const stats = [
  { label: "Today's Revenue", value: "₹4,970", icon: IndianRupee, color: "text-primary" },
  { label: "Monthly Revenue", value: "₹1,24,500", icon: IndianRupee, color: "text-primary" },
  { label: "Active Members", value: "8", icon: Users, color: "text-info" },
  { label: "Expiring in 7 Days", value: "3", icon: CalendarClock, color: "text-accent" },
  { label: "Today's Attendance", value: "7", icon: UserCheck, color: "text-success" },
  { label: "Volunteers Present", value: "4", icon: HeartHandshake, color: "text-warning" },
];

const expiringMembers = members.filter(m => m.daysLeft > 0 && m.daysLeft <= 3);

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your club overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Sales Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,15%,90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(122,46%,33%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Membership Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={membershipGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,15%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="members" fill="hsl(122,46%,33%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Product-wise Sales</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={productSalesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {productSalesData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Package Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={packageDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {packageDistributionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringMembers.length > 0 && (
        <div className="stat-card border-l-4 border-l-accent">
          <h3 className="font-heading font-semibold text-foreground mb-3">⚠️ Membership Expiry Alerts</h3>
          <div className="space-y-2">
            {expiringMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.package} • Expires in {m.daysLeft} day(s)</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7">Send Reminder</Button>
                  <Button size="sm" className="text-xs h-7">Renew Now</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/members">
          <Button variant="outline" className="w-full gap-2 h-12 justify-start"><UserPlus className="w-4 h-4" /> Add Member</Button>
        </Link>
        <Link to="/billing">
          <Button variant="outline" className="w-full gap-2 h-12 justify-start"><ShoppingCart className="w-4 h-4" /> New Bill</Button>
        </Link>
        <Link to="/members">
          <Button variant="outline" className="w-full gap-2 h-12 justify-start"><ClipboardCheck className="w-4 h-4" /> Mark Attendance</Button>
        </Link>
        <Link to="/volunteers">
          <Button variant="outline" className="w-full gap-2 h-12 justify-start"><Plus className="w-4 h-4" /> Add Volunteer</Button>
        </Link>
      </div>
    </div>
  );
}
