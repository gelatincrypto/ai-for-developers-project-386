using System.Globalization;
using Calendar.Api.Generated.Models;

namespace Calendar.Api.EventTypes;

public sealed class SlotSchedule(IConfiguration configuration, TimeProvider clock)
{
    private readonly TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById(
        configuration["Owner:TimeZone"] ?? throw new InvalidOperationException("Owner:TimeZone is required."));

    public AvailableSlots GetSlots(EventType eventType)
    {
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, timeZone).DateTime);
        var slots = new List<AvailableSlot>();

        for (var day = 0; day < 14; day++)
        {
            var date = today.AddDays(day);
            if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                continue;
            }

            for (var minute = 9 * 60; minute + eventType.DurationMinutes <= 18 * 60; minute += 30)
            {
                var localStart = date.ToDateTime(new TimeOnly(minute / 60, minute % 60));
                if (timeZone.IsInvalidTime(localStart))
                {
                    continue;
                }

                var start = new DateTimeOffset(localStart, timeZone.GetUtcOffset(localStart));
                var end = TimeZoneInfo.ConvertTime(start.AddMinutes(eventType.DurationMinutes), timeZone);
                if (start <= now || DateOnly.FromDateTime(end.DateTime) != date ||
                    end.TimeOfDay > TimeSpan.FromHours(18))
                {
                    continue;
                }

                slots.Add(new AvailableSlot
                {
                    Start = start.ToString("O", CultureInfo.InvariantCulture),
                    End = end.ToString("O", CultureInfo.InvariantCulture),
                });
            }
        }

        return new AvailableSlots { OwnerTimeZone = timeZone.Id, Slots = slots };
    }
}
