using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using CsvHelper;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using System;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ILogger<SimulationController> _logger;
    private readonly HttpClient _httpClient;

    public SimulationController(ILogger<SimulationController> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    private (string? Start, string? End) LoadSimulationRange()
    {
        var simRangePath = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles", "train_model_timestamps.json");
        if (!System.IO.File.Exists(simRangePath))
            return (null, null);

        try
        {
            var json = System.IO.File.ReadAllText(simRangePath);
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            dict.TryGetValue("simulationStart", out var start);
            dict.TryGetValue("simulationEnd", out var end);
            return (start, end);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to load simulation range: {0}", ex.Message);
            return (null, null);
        }
    }

    [HttpGet("stream")]
    public async Task StreamSimulation()
    {
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        var (simStart, simEnd) = LoadSimulationRange();
        if (string.IsNullOrWhiteSpace(simStart) || string.IsNullOrWhiteSpace(simEnd))
        {
            await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = "Simulation range not available" })}\n\n");
            await Response.Body.FlushAsync();
            return;
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
        var filePath = Path.Combine(uploadDir, "latest.csv");
        if (!System.IO.File.Exists(filePath))
        {
            await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = "CSV file not found" })}\n\n");
            await Response.Body.FlushAsync();
            return;
        }

        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<dynamic>();
        int count = 0;
        const int MAX_ROWS = 30;

        foreach (var record in records)
        {
            if (count >= MAX_ROWS) break;

            var dict = record as IDictionary<string, object>;
            if (dict == null) continue;

            dict.TryGetValue("Timestamp", out var tsObj);
            string timestampStr = tsObj?.ToString() ?? "";

            if (!DateTime.TryParse(timestampStr, out var rowTimestamp)) continue;

            if (rowTimestamp < DateTime.Parse(simStart) || rowTimestamp > DateTime.Parse(simEnd)) continue;

            var jsonPayload = JsonSerializer.Serialize(record);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var fastApiUrl = "http://localhost:8000/simulate-row";
                var response = await _httpClient.PostAsync(fastApiUrl, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var predictionObj = JsonSerializer.Deserialize<JsonDocument>(responseBody);
                    var predictionValue = predictionObj?.RootElement.GetProperty("prediction").GetDouble() ?? 0;
                    var roundedPrediction = Math.Round(predictionValue);

                    dict.TryGetValue("Id", out var idVal);

                    var result = new
                    {
                        time = timestampStr,
                        sampleId = idVal ?? $"SAMP-{count + 1}",
                        prediction = roundedPrediction == 1 ? "Pass" : "Fail",
                        confidence = Math.Round(predictionValue, 4) // Add confidence score (0-1)
                    };

                    string data = JsonSerializer.Serialize(result);
                    await Response.WriteAsync($"data: {data}\n\n");
                    await Response.Body.FlushAsync();
                    _logger.LogInformation("Sent row: {0}", data);

                    count++;
                    await Task.Delay(1000);
                }
                else
                {
                    _logger.LogWarning("FastAPI error: {0}", responseBody);
                    await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = "ML backend error", detail = responseBody })}\n\n");
                    await Response.Body.FlushAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Row prediction error: {0}", ex.Message);
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = ex.Message })}\n\n");
                await Response.Body.FlushAsync();
            }
        }

        _logger.LogInformation("Simulation stream completed");
    }
}
