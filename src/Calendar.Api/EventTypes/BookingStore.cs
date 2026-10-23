using Calendar.Api.Generated.Models;
using Microsoft.Data.Sqlite;

namespace Calendar.Api.EventTypes;

public sealed class BookingStore
{
    private readonly EventTypeStore eventTypes;

    public BookingStore(EventTypeStore eventTypes)
    {
        this.eventTypes = eventTypes;
        using var connection = eventTypes.Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                event_type_id TEXT NOT NULL REFERENCES event_types(id),
                start_utc INTEGER NOT NULL,
                end_utc INTEGER NOT NULL CHECK (end_utc > start_utc),
                guest_name TEXT NOT NULL,
                guest_email TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_bookings_start ON bookings (start_utc);
            """;
        command.ExecuteNonQuery();
    }

    public IReadOnlyList<(long Start, long End)> BusyBetween(DateTimeOffset start, DateTimeOffset end)
    {
        using var connection = eventTypes.Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT start_utc, end_utc FROM bookings
            WHERE start_utc < $end AND end_utc > $start
            """;
        command.Parameters.AddWithValue("$start", start.ToUnixTimeMilliseconds());
        command.Parameters.AddWithValue("$end", end.ToUnixTimeMilliseconds());
        using var reader = command.ExecuteReader();
        var busy = new List<(long Start, long End)>();
        while (reader.Read())
        {
            busy.Add((reader.GetInt64(0), reader.GetInt64(1)));
        }

        return busy;
    }

    public string? TryCreate(EventType eventType, DateTimeOffset start, DateTimeOffset end,
        string guestName, string guestEmail, Func<bool> timeStillValid)
    {
        using var connection = eventTypes.Open();
        using var transaction = connection.BeginTransaction(deferred: false);
        if (!timeStillValid())
        {
            return null;
        }

        using var conflict = connection.CreateCommand();
        conflict.Transaction = transaction;
        conflict.CommandText = """
            SELECT EXISTS (SELECT 1 FROM bookings
                WHERE start_utc < $end AND end_utc > $start)
            """;
        conflict.Parameters.AddWithValue("$start", start.ToUnixTimeMilliseconds());
        conflict.Parameters.AddWithValue("$end", end.ToUnixTimeMilliseconds());
        if (Convert.ToInt64(conflict.ExecuteScalar()) != 0)
        {
            return null;
        }

        var id = Guid.NewGuid().ToString("N");
        using var insert = connection.CreateCommand();
        insert.Transaction = transaction;
        insert.CommandText = """
            INSERT INTO bookings (id, event_type_id, start_utc, end_utc, guest_name, guest_email)
            VALUES ($id, $eventTypeId, $start, $end, $name, $email)
            """;
        insert.Parameters.AddWithValue("$id", id);
        insert.Parameters.AddWithValue("$eventTypeId", eventType.Id);
        insert.Parameters.AddWithValue("$start", start.ToUnixTimeMilliseconds());
        insert.Parameters.AddWithValue("$end", end.ToUnixTimeMilliseconds());
        insert.Parameters.AddWithValue("$name", guestName);
        insert.Parameters.AddWithValue("$email", guestEmail);
        insert.ExecuteNonQuery();
        transaction.Commit();
        return id;
    }
}
