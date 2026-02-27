import React from "react";
import SectionHeader from "./SectionHeader";
import StatCard from "./StatCard";
import ActivityAccordion from "./ActivityAccordion";
import LogWorkForm from "./LogWorkForm";
import LogVacationForm from "./LogVacationForm";
import {
  BarChart2,
  Palmtree,
  Briefcase,
  Activity,
  Clock,
  Sun,
} from "lucide-react";
import { usePortalData } from "../portal/PortalDataProvider";
import { useLanguage } from "../i18n";

export default function EmployeeSidebar() {
  const { user, projects } = usePortalData();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm">
      {/* My Stats Section */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title={t('employeeDashboard.myStats')}
          icon={<BarChart2 className="size-[14px] text-[#62748E]" />}
        />
        <StatCard
          title={t('employeeDashboard.vacationRemaining')}
          value={user?.remainingVacationDays ?? "-"}
          unit={t('employeeDashboard.days')}
          icon={<Palmtree className="size-6 text-[#155DFC]" />}
          iconBgColor="bg-[#EFF6FF]"
        />
        <StatCard
          title={t('employeeDashboard.assignedProjects')}
          value={projects.length}
          icon={<Briefcase className="size-6 text-[#62748E]" />}
          iconBgColor="bg-[#F1F5F9]"
        />
      </section>

      {/* Log Activity Section */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title={t('employeeDashboard.logActivity')}
          icon={<Activity className="size-[14px] text-[#62748E]" />}
        />
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <ActivityAccordion
            title={t('employeeDashboard.logWorkHours')}
            icon={<Clock className="size-[18px] text-[#155DFC]" />}
            defaultExpanded={true}
          >
            <LogWorkForm />
          </ActivityAccordion>

          <ActivityAccordion
            title={t('employeeDashboard.logVacation')}
            icon={<Palmtree className="size-[18px] text-[#EA580C]" />}
            isLast={true}
          >
            <LogVacationForm />
          </ActivityAccordion>
        </div>
      </section>
    </div>
  );
}
