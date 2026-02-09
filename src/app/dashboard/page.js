// app/dashboard/page.js
"use client";
import { useSettings } from "../../context/SettingsContext";
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Clock, 
  FileText 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
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

export default function DashboardPage() {
  const { t, darkMode } = useSettings();

  // Chart Colors based on theme
  const chartColor = darkMode ? "#60a5fa" : "#2563eb"; // Blue 400 (dark) vs Blue 600 (light)
  const gridColor = darkMode ? "#334155" : "#e2e8f0";
  const textColor = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div className="space-y-8">
      
      {/* 1. Quick Actions Row */}
      <div className="flex flex-wrap gap-4">
        <ActionButton label={t.newProject} icon={<Plus size={18} />} color="bg-blue-600" />
        <ActionButton label={t.newEstimate} icon={<Plus size={18} />} color="bg-emerald-600" />
        <ActionButton label={t.newQuote} icon={<Plus size={18} />} color="bg-indigo-600" />
        <ActionButton label={t.logTime} icon={<Clock size={18} />} color="bg-orange-600" />
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.activeProjects} 
          value="12" 
          trend="+2 this month" 
          icon={<Users className="text-blue-600" />} 
        />
        <StatCard 
          title={t.totalQuotes} 
          value="$1.2M" 
          trend="8 pending" 
          icon={<FileText className="text-indigo-600" />} 
        />
        <StatCard 
          title={t.hoursThisWeek} 
          value="142.5" 
          trend="On track" 
          icon={<Clock className="text-orange-600" />} 
        />
        <StatCard 
          title={t.revenue} 
          value="$84k" 
          trend="+12% vs last mo" 
          icon={<TrendingUp className="text-emerald-600" />} 
        />
      </div>

      {/* 3. Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Weekly Hours & Productivity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  stroke={textColor} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={textColor} 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke={chartColor} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {t.recentActivity}
          </h3>
          <div className="space-y-6">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex flex-col pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <span className="font-semibold text-gray-800 text-sm">
                  {project.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">Client: {project.client}</span>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${project.status === 'Active' ? 'bg-blue-100 text-blue-700' : 
                      project.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-700'}`}>
                    {project.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.budget}
                  </span>
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
    <button className={`${color} hover:opacity-90 text-white flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/10 transition transform active:scale-95`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-xs font-medium text-emerald-600">
        {trend}
      </div>
    </div>
  );
}