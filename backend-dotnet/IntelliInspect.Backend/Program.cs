using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS for Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// HTTP client for FastAPI
builder.Services.AddHttpClient();

// Large file upload support
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 14L * 1024 * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 14L * 1024 * 1024 * 1024;
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
// Dev tools


// Middleware
//app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();
app.Run();