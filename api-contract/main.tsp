import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

@service(#{ title: "Календарь звонков" })
@info(#{ version: "1.0.0" })
namespace CalendarApi {
  model HealthResponse {
    status: "ok";
  }

  @doc("Проверить доступность API.")
  @tag("Health")
  @get
  @route("/api/health")
  op getHealth(): HealthResponse;
}
