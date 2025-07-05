export function useDateFormat() {
  const formatDate = (date: Date | string | any | null | undefined) => {
    if (!date) return "";
    // Handle Firestore Timestamp objects
    if (
      typeof date === "object" &&
      date !== null &&
      typeof date.toDate === "function"
    ) {
      return formatDate(date.toDate());
    }
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
