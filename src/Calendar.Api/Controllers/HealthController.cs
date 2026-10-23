using Calendar.Api.Generated.Controllers;
using Calendar.Api.Generated.Models;
using Microsoft.AspNetCore.Mvc;

namespace Calendar.Api.Controllers;

public sealed class HealthController : HealthApiController
{
    public override IActionResult GetHealth() => Ok(new HealthResponse { Status = HealthResponse.StatusEnum.OkEnum });
}
