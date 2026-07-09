"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  TrendingUp,
  Target,
  Trophy,
  Percent,
  Activity,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { crmApi } from "@/lib/crm-client";
import { money, LEAD_STATUS_META } from "@/lib/crm-ui";
import { StatCard, SectionCard, Spinner } from "@/components/crm/ui";

type Report = {
  kpis: {
    pipelineValue: number;
    weightedValue: number;
    openCount: number;
    wonValue: number;
    wonCount: number;
    wonThisMonthValue: number;
    wonThisMonthCount: number;
    winRate: number;
    activityCount: number;
    openTasks: number;
    overdueTasks: number;
  };
  byStage: { stage: string; label: string; count: number; value: number }[];
  openStages: string[];
  leadsByStatus: { status: string; count: number }[];
};

export default function CrmDashboard() {
  const { data, isLoading } = useQuery<Report>({
    queryKey: ["crm", "reports"],
    queryFn: () => crmApi.get("/api/crm/reports"),
  });

  if (isLoading || !data) return <Spinner />;

  const { kpis, byStage, openStages, leadsByStatus } = data;
  const openStageBars = byStage.filter((s) => openStages.includes(s.stage));
  const maxStageValue = Math.max(1, ...openStageBars.map((s) => s.value));
  const totalLeads = leadsByStatus.reduce((s, l) => s + l.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Sales Overview</h2>
          <p className="text-[13px] text-foreground/40 mt-0.5">Your pipeline at a glance</p>
        </div>
        <Link
          href="/crm/pipeline"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-[13px] font-semibold hover:opacity-90 transition"
        >
          <TrendingUp className="w-4 h-4" />
          Open Pipeline
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Open Pipeline"
          value={money(kpis.pipelineValue)}
          hint={`${kpis.openCount} open deals`}
          icon={<Target className="w-4 h-4" />}
        />
        <StatCard
          label="Weighted Forecast"
          value={money(kpis.weightedValue)}
          hint="probability-adjusted"
          icon={<Percent className="w-4 h-4" />}
        />
        <StatCard
          label="Won This Month"
          value={money(kpis.wonThisMonthValue)}
          hint={`${kpis.wonThisMonthCount} deals`}
          icon={<Trophy className="w-4 h-4" />}
        />
        <StatCard
          label="Win Rate"
          value={`${kpis.winRate}%`}
          hint={`${kpis.wonCount} won all-time`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <StatCard
          label="Activities (30d)"
          value={kpis.activityCount}
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Open Tasks"
          value={kpis.openTasks}
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Overdue Tasks"
          value={kpis.overdueTasks}
          hint={kpis.overdueTasks > 0 ? "needs attention" : "all on track"}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <SectionCard title="Pipeline by Stage">
          <div className="p-5 space-y-3.5">
            {openStageBars.every((s) => s.count === 0) ? (
              <p className="text-[13px] text-foreground/35 py-6 text-center">
                No open opportunities yet.
              </p>
            ) : (
              openStageBars.map((s) => (
                <div key={s.stage}>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="font-medium text-foreground/60">{s.label}</span>
                    <span className="text-foreground/40">
                      {s.count} · {money(s.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                      style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Leads by Status">
          <div className="p-5 space-y-3">
            {totalLeads === 0 ? (
              <p className="text-[13px] text-foreground/35 py-6 text-center">
                No leads captured yet.{" "}
                <Link href="/crm/leads" className="text-orange-500 font-medium">
                  Add one
                </Link>
              </p>
            ) : (
              leadsByStatus.map((l) => {
                const meta = LEAD_STATUS_META[l.status];
                return (
                  <div key={l.status} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta?.className ?? ""}`}
                    >
                      {meta?.label ?? l.status}
                    </span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="h-2 rounded-full bg-black/4 overflow-hidden flex-1">
                        <div
                          className="h-full rounded-full bg-foreground/70"
                          style={{ width: `${(l.count / totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground/50 w-6 text-right">
                        {l.count}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
