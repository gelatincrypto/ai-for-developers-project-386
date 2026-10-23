using Calendar.Api.Controllers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(options =>
    options.JsonSerializerOptions.Converters.Add(new HealthStatusJsonConverter()));

var app = builder.Build();

app.MapControllers();

app.Run();

public partial class Program { }
