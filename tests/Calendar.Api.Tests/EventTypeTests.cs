using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Calendar.Api.Tests;

public class EventTypeTests
{
    [Fact]
    public async Task OwnerCreatesType_AndGuestReadsCatalog_AfterRestart()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"calendar-test-{Guid.NewGuid():N}.db");
        try
        {
            using (var factory = CreateFactory(databasePath))
            {
                using var owner = factory.CreateClient();
                using var guest = factory.CreateClient();
                var input = new { id = "consultation", title = "Консультация", description = "Знакомство", durationMinutes = 45 };

                Assert.Equal(HttpStatusCode.Unauthorized, (await guest.PostAsJsonAsync("/api/event-types", input)).StatusCode);
                Assert.Empty((await guest.GetFromJsonAsync<EventType[]>("/api/event-types"))!);
                Assert.Equal(HttpStatusCode.OK, (await owner.PostAsJsonAsync("/api/owner/session",
                    new { username = "test-owner", password = "test-password" })).StatusCode);

                using var created = await owner.PostAsJsonAsync("/api/event-types", input);
                Assert.Equal(HttpStatusCode.OK, created.StatusCode);
                Assert.Equal(new EventType("consultation", "Консультация", "Знакомство", 45),
                    await created.Content.ReadFromJsonAsync<EventType>());
                Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync("/api/event-types", input)).StatusCode);
                Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync("/api/event-types",
                    new { id = "bad", title = " ", description = "Знакомство", durationMinutes = 30 })).StatusCode);
                Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync("/api/event-types",
                    new { id = "bad", title = "Тест", description = "Тест", durationMinutes = 0 })).StatusCode);
                Assert.Equal(new[] { new EventType("consultation", "Консультация", "Знакомство", 45) },
                    await guest.GetFromJsonAsync<EventType[]>("/api/event-types"));
            }

            using var restarted = CreateFactory(databasePath);
            using var visitor = restarted.CreateClient();
            Assert.Equal(new[] { new EventType("consultation", "Консультация", "Знакомство", 45) },
                await visitor.GetFromJsonAsync<EventType[]>("/api/event-types"));
        }
        finally
        {
            File.Delete(databasePath);
        }
    }

    private static WebApplicationFactory<Program> CreateFactory(string databasePath) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("Calendar:DatabasePath", databasePath)
                .UseSetting("Owner:Username", "test-owner")
                .UseSetting("Owner:Password", "test-password"));

    private sealed record EventType(string Id, string Title, string Description, int DurationMinutes);
}
