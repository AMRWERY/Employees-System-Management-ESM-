import type { TeamMember } from "@/types/teams";

export function useDepartmentName(member: MaybeRef<TeamMember | null>) {
  const teamStore = useTeamStore();
  const { t } = useI18n();

  return computed(() => {
    const m = unref(member);
    if (!m) return "";

    // Handle case where no team is assigned
    if (!m.teamId) return t("dashboard.not_assigned");

    // Find the team in the store
    const team = teamStore.teams.find((t) => t.id === m.teamId);

    // Return team name if found, or fallback message
    return team?.name || t("dashboard.team_not_found");
  });
}
