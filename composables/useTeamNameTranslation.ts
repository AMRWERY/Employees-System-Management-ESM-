type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T);

export function useTeamName() {
  const { t } = useI18n();
  const teamStore = useTeamStore();

  // Helper function to generate translation key
  const generateTranslationKey = (rawName: string) => {
    return rawName
      .toLowerCase()
      .replace(/\(.*?\)/g, "") // Remove text in parentheses
      .replace(/[^a-z0-9]+/g, "_") // Replace special chars with underscores
      .replace(/_+/g, "_") // Remove consecutive underscores
      .replace(/(^_|_$)/g, "") // Trim leading/trailing underscores
      .replace(/_it$/, ""); // Remove trailing "_it"
  };

  const getTeamName = (
    teamId: MaybeRefOrGetter<string | null | undefined>,
    fallbackName: MaybeRefOrGetter<string | null | undefined> = undefined
  ) => {
    const id = typeof teamId === "function" ? teamId() : unref(teamId);
    const name =
      typeof fallbackName === "function"
        ? fallbackName()
        : unref(fallbackName as MaybeRef<string | null | undefined>);

    // Get raw team name
    let rawName = "";

    if (id) {
      const team = teamStore.teams.find((t) => t.id === id);
      rawName = team?.name || name || t("dashboard.team_not_found");
    } else {
      rawName = name || t("dashboard.not_assigned");
    }

    const translationKey = generateTranslationKey(rawName);

    return t(`teams.${translationKey}`, rawName);
  };

  const computedTeamName = (
    teamId: MaybeRefOrGetter<string | null | undefined>,
    fallbackName: MaybeRefOrGetter<string | null | undefined> = undefined
  ) => {
    return computed(() => getTeamName(teamId, fallbackName));
  };

  return {
    getTeamName,
    computedTeamName,
  };
}
