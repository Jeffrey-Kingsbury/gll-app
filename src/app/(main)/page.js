"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext"; // Ensure path is correct
import {
  Plus, TrendingUp, Users, Clock, FileText, Hammer, ArrowRight,
  BarChart2, Calendar, Filter
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { getDashboardStatsAction, getCustomChartDataAction } from "./actions";

export default function DashboardPage() {
  const { t } = useSettings();
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalEstimates: 0,
    hoursWeek: 0,
    revenueMonth: 0,
    recentProjects: []
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Custom Chart State ---
  const [chartConfig, setChartConfig] = useState({
    metric: "hours", // hours, revenue, projects
    groupBy: "day", // day, week, month, project, employee
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0]
  });

  // --- 1. Load Initial Stats ---
  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStatsAction();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  // --- 2. Load Chart Data (When config changes) ---
  useEffect(() => {
    async function loadChart() {
      const data = await getCustomChartDataAction(chartConfig);
      setChartData(data);
    }
    loadChart();
  }, [chartConfig]);

  // --- Theme Colors ---
  const chartColor = "#fbbf24"; // Amber
  const gridColor = "#44403c";
  const textColor = "#a8a29e";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* 1. Quick Actions Row */}
      <div className="flex flex-wrap gap-4">
        <ActionButton label="New Project" icon={<Hammer size={18} />} color="bg-stone-800 text-amber-500" />
        <ActionButton label="New Estimate" icon={<Plus size={18} />} color="bg-amber-700 hover:bg-amber-600 text-white" />
        <ActionButton label="New Quote" icon={<FileText size={18} />} color="bg-stone-600 hover:bg-stone-500 text-white" />
        <ActionButton label="Log Time" icon={<Clock size={18} />} color="bg-[#eaddcf] hover:bg-[#decbc0] text-stone-900" />
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<Users className="text-stone-300" />}
        />
        <StatCard
          title="Total Estimates"
          value={`$${stats.totalEstimates.toLocaleString()}`}
          icon={<FileText className="text-amber-400" />}
        />
        <StatCard
          title="Hours (This Week)"
          value={stats.hoursWeek}
          icon={<Clock className="text-stone-300" />}
        />
        <StatCard
          title="Revenue (Month)"
          value={`$${stats.revenueMonth.toLocaleString()}`}
          icon={<TrendingUp className="text-emerald-400" />}
        />
      </div>

      {/* 3. Custom Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-800">

          {/* Chart Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-stone-800 pb-4">
            <h3 className="text-lg font-bold text-[#eaddcf] font-serif flex items-center gap-2">
              <BarChart2 size={20} className="text-amber-600" />
              Custom Analytics
            </h3>

            <div className="flex flex-wrap gap-2">
              {/* Metric Selector */}
              <select
                value={chartConfig.metric}
                onChange={(e) => setChartConfig({ ...chartConfig, metric: e.target.value })}
                className="bg-stone-800 border border-stone-700 text-stone-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="hours">Hours Logged</option>
                <option value="revenue">Estimate Revenue</option>
                <option value="projects">Projects Created</option>
              </select>

              {/* Group By Selector */}
              <select
                value={chartConfig.groupBy}
                onChange={(e) => setChartConfig({ ...chartConfig, groupBy: e.target.value })}
                className="bg-stone-800 border border-stone-700 text-stone-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="day">By Day</option>
                <option value="week">By Week</option>
                <option value="month">By Month</option>
                <option value="project">By Project</option>
                <option value="employee">By Employee</option>
              </select>

              {/* Date Range (Simple Last 30 Days toggle for demo, or date inputs) */}
              <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
                <Calendar size={14} className="text-stone-400" />
                <input
                  type="date"
                  value={chartConfig.startDate}
                  onChange={(e) => setChartConfig({ ...chartConfig, startDate: e.target.value })}
                  className="bg-transparent text-xs text-stone-300 outline-none w-24"
                />
                <span className="text-stone-400">-</span>
                <input
                  type="date"
                  value={chartConfig.endDate}
                  onChange={(e) => setChartConfig({ ...chartConfig, endDate: e.target.value })}
                  className="bg-transparent text-xs text-stone-300 outline-none w-24"
                />
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <BarChart2 size={48} className="mb-4 opacity-20" />
                <p>No data found for this selection.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
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
                    fontSize={11}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis
                    stroke={textColor}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '8px',
                      border: `1px solid #44403c`,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#eaddcf', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: textColor, marginBottom: '0.5rem', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name={chartConfig.metric === 'revenue' ? 'Revenue ($)' : chartConfig.metric === 'hours' ? 'Hours' : 'Count'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-800 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#eaddcf] font-serif">
              Recent Projects
            </h3>
            <button className="text-stone-400 hover:text-stone-200 transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {stats.recentProjects.length === 0 ? (
              <p className="text-stone-400 text-sm italic">No recent activity.</p>
            ) : stats.recentProjects.map((project) => (
              <div key={project.internalid} className="flex flex-col pb-4 border-b border-stone-800 last:border-0 last:pb-0 group">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-stone-200 text-sm group-hover:text-amber-600 transition-colors cursor-pointer">
                    {project.name}
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    ${parseFloat(project.budget || 0).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-stone-500 mt-1">{project.client_name || "Unknown Client"}</span>
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

// --- Components ---

function ActionButton({ label, icon, color }) {
  return (
    <button className={`${color} flex items-center gap-3 px-6 py-4 rounded-xl font-medium shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 flex-1 md:flex-none justify-center`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-800 transition hover:border-amber-500/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{title}</span>
        <div className="p-2 bg-stone-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-[#eaddcf] mb-1 font-serif">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Active: "bg-amber-100 text-amber-800 border-amber-200",
    Pending: "bg-stone-100 text-stone-600 border-stone-200",
    Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Planning: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}