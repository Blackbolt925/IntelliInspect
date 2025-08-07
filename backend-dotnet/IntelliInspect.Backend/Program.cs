using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<DatasetService>();

// Configure CORS for Angular dev client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:8080")  // Angular dev server
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add HttpClient for FastAPI integration
builder.Services.AddHttpClient();

// Configure large file upload (up to 14 GB)
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 14L * 1024 * 1024 * 1024; // 14 GB
});
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 14L * 1024 * 1024 * 1024;
});

var app = builder.Build();

// Swagger in development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure middleware pipeline
app.UseHttpsRedirection();

app.UseCors("AllowAngular"); // Enable CORS before controllers

app.UseAuthorization();

app.MapControllers();

app.Run();
