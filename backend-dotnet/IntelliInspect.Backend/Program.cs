using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add HTTP client for ML service communication
builder.Services.AddHttpClient("MLService", client =>
{
    client.BaseAddress = new Uri("http://localhost:8000/"); // ML service URL
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 14L * 1024 * 1024 * 1024; // 14 GB, adjust as needed
});
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 14L * 1024 * 1024 * 1024; // 14 GB
});
var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();

app.Run();