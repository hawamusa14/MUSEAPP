import { requireUser } from "@/lib/auth";
import { getCalendarHub } from "@/lib/data/plans";
import { CalendarHub } from "@/components/calendar/calendar-hub";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string; day?: string; view?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getCalendarHub(user.id, params);

  return <CalendarHub data={data} />;
}
