export function useDateFormat() {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(parsedDate);
  };

  return { formatDate };
}
