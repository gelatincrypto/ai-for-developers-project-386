using Calendar.Api.EventTypes;
using Calendar.Api.Generated.Controllers;
using Calendar.Api.Generated.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Calendar.Api.Controllers;

public sealed class EventTypesController(EventTypeStore store) : EventTypesApiController
{
    public override IActionResult CreateEventType(EventTypeInput eventTypeInput)
    {
        if (string.IsNullOrWhiteSpace(eventTypeInput.Id) ||
            string.IsNullOrWhiteSpace(eventTypeInput.Title) ||
            string.IsNullOrWhiteSpace(eventTypeInput.Description) ||
            eventTypeInput.DurationMinutes <= 0)
        {
            return BadRequest(new { error = "Заполните идентификатор, название, описание и положительную длительность." });
        }

        if (!store.TryCreate(eventTypeInput))
        {
            return Conflict(new { error = "Тип события с таким идентификатором уже существует." });
        }

        return Ok(new EventType
        {
            Id = eventTypeInput.Id,
            Title = eventTypeInput.Title.Trim(),
            Description = eventTypeInput.Description.Trim(),
            DurationMinutes = eventTypeInput.DurationMinutes,
        });
    }

    [AllowAnonymous]
    public override IActionResult ListEventTypes() => Ok(store.List());
}
