import { useState } from "react";
import { Search, Filter, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { members, Member } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Members() {
  const [search, setSearch] = useState("");
  const [filterPkg, setFilterPkg] = useState<string>("All");
  const [filterExpiring, setFilterExpiring] = useState(false);

  const filtered = members.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPkg !== "All" && m.package !== filterPkg) return false;
    if (filterExpiring && m.daysLeft > 7) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <Button className="gap-2"><span>+ Add Member</span></Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {["All", "Bronze", "Silver", "Gold"].map((p) => (
            <Button key={p} variant={filterPkg === p ? "default" : "outline"} size="sm" onClick={() => setFilterPkg(p)}>
              {p}
            </Button>
          ))}
        </div>
        <Button variant={filterExpiring ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setFilterExpiring(!filterExpiring)}>
          <Filter className="w-3.5 h-3.5" /> Expiring Soon
        </Button>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 font-medium">ID</th>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Phone</th>
              <th className="pb-3 font-medium">Package</th>
              <th className="pb-3 font-medium">Start Date</th>
              <th className="pb-3 font-medium">Expiry Date</th>
              <th className="pb-3 font-medium">Days Left</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Points</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 font-mono text-xs">{m.id}</td>
                <td className="py-3 font-medium text-foreground">{m.name}</td>
                <td className="py-3">{m.phone}</td>
                <td className="py-3">
                  <span className={`badge-${m.package.toLowerCase()}`}>{m.package}</span>
                </td>
                <td className="py-3">{m.startDate}</td>
                <td className="py-3">{m.expiryDate}</td>
                <td className={`py-3 font-semibold ${m.daysLeft <= 5 ? "text-destructive" : "text-foreground"}`}>
                  {m.daysLeft <= 0 ? "Expired" : m.daysLeft}
                </td>
                <td className="py-3">
                  <span className={`badge-${m.status.toLowerCase()}`}>{m.status}</span>
                </td>
                <td className="py-3 font-semibold">{m.totalPoints}</td>
                <td className="py-3">
                  <Link to={`/members/${m.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs"><Eye className="w-3.5 h-3.5" /> View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
