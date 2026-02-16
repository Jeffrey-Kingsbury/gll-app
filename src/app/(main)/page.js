// app/dashboard/page.js
"use client";
import { useSettings } from "../../context/SettingsContext";
import {
  Plus,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Hammer,
  ArrowRight
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Mock Data ---
const data = [
  { name: 'Mon', hours: 4, active: 2 },
  { name: 'Tue', hours: 7, active: 3 },
  { name: 'Wed', hours: 5, active: 3 },
  { name: 'Thu', hours: 8, active: 4 },
  { name: 'Fri', hours: 6, active: 4 },
  { name: 'Sat', hours: 3, active: 2 },
  { name: 'Sun', hours: 0, active: 1 },
];

const recentProjects = [
  { id: 1, name: "Kitchen Reno - Smith Residence", status: "Active", client: "John Smith", budget: "$45,000" },
  { id: 2, name: "Downtown Office Fit-out", status: "Pending", client: "TechCorp Inc.", budget: "$120,000" },
  { id: 3, name: "Basement Finishing", status: "Completed", client: "Sarah Parker", budget: "$28,500" },
];

import { createAuthClient } from "better-auth/client"; // Import Client
const authClient = createAuthClient(); // Initialize
const handleGoogleLogin = async () => {
  setIsLoading(true);
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/" // Where to go after login
  });
};

export default function DashboardPage() {
  const { t, darkMode } = useSettings();

  // Chart Colors - Stone/Amber Theme
  // Light: Amber-600 (#d97706) | Dark: Amber-400 (#fbbf24)
  const chartColor = darkMode ? "#fbbf24" : "#d97706";
  const gridColor = darkMode ? "#44403c" : "#e7e5e4"; // Stone-700 vs Stone-200
  const textColor = darkMode ? "#a8a29e" : "#78716c"; // Stone-400 vs Stone-500

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Quick Actions Row */}
      <div className="flex flex-wrap gap-4">
        <ActionButton
          label={t.newProject || "New Project"}
          icon={<Hammer size={18} />}
          color="bg-stone-900 hover:bg-stone-800 text-[#eaddcf]"
        />
        <ActionButton
          label={t.newEstimate || "New Estimate"}
          icon={<Plus size={18} />}
          color="bg-amber-700 hover:bg-amber-600 text-white"
        />
        <ActionButton
          label={t.newQuote || "New Quote"}
          icon={<FileText size={18} />}
          color="bg-stone-600 hover:bg-stone-500 text-white"
        />
        <ActionButton
          label={t.logTime || "Log Time"}
          icon={<Clock size={18} />}
          color="bg-[#eaddcf] hover:bg-[#decbc0] text-stone-900"
        />
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.activeProjects || "Active Projects"}
          value="12"
          trend="+2 this month"
          trendPositive={true}
          icon={<Users className="text-stone-600 dark:text-stone-300" />}
        />
        <StatCard
          title={t.totalQuotes || "Total Quotes"}
          value="$1.2M"
          trend="8 pending"
          trendPositive={null} // Neutral
          icon={<FileText className="text-amber-600 dark:text-amber-400" />}
        />
        <StatCard
          title={t.hoursThisWeek || "Hours (Week)"}
          value="142.5"
          trend="On track"
          trendPositive={true}
          icon={<Clock className="text-stone-600 dark:text-stone-300" />}
        />
        <StatCard
          title={t.revenue || "Revenue"}
          value="$84k"
          trend="+12% vs last mo"
          trendPositive={true}
          icon={<TrendingUp className="text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      {/* 3. Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-stone-900 dark:text-[#eaddcf] font-serif">
              Weekly Productivity
            </h3>
            <select className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-sm rounded-lg px-2 py-1 outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  fontSize={12}
                />
                <YAxis
                  stroke={textColor}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1c1917' : '#fff', // stone-900 vs white
                    borderRadius: '8px',
                    border: '1px solid ' + (darkMode ? '#44403c' : '#e7e5e4'),
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: darkMode ? '#eaddcf' : '#1c1917', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke={chartColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-stone-900 dark:text-[#eaddcf] font-serif">
              {t.recentActivity || "Recent Projects"}
            </h3>
            <button className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex flex-col pb-4 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0 group">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm group-hover:text-amber-600 transition-colors cursor-pointer">
                    {project.name}
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    {project.budget}
                  </span>
                </div>
                <span className="text-xs text-stone-500 mt-1">{project.client}</span>
                <div className="mt-2">
                  <StatusPill status={project.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Components ---

function ActionButton({ label, icon, color }) {
  return (
    <button className={`${color} flex items-center gap-3 px-6 py-4 rounded-xl font-medium shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 flex-1 md:flex-none justify-center`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, trend, trendPositive, icon }) {
  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 transition hover:border-amber-500/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-stone-500 uppercase tracking-wide">{title}</span>
        <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-stone-900 dark:text-[#eaddcf] mb-1 font-serif">
        {value}
      </div>
      <div className={`text-xs font-medium flex items-center gap-1 ${trendPositive === true ? "text-emerald-600" :
        trendPositive === false ? "text-red-500" :
          "text-stone-500"
        }`}>
        {trendPositive === true && <TrendingUp size={12} />}
        {trend}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Active: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    Pending: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
    Completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}