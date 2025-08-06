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
            var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json);
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

    [HttpPost("test-single-row")]
    public async Task<IActionResult> TestSingleRow()
    {
        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
        var filePath = Path.Combine(uploadDir, "latest.csv");

        if (!System.IO.File.Exists(filePath))
            return NotFound("No uploaded CSV found.");

        // Read first data row
        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        try
        {
            csv.Read();
            csv.ReadHeader();
            if (!csv.Read())
                return BadRequest("No data rows in CSV");

            var recordObj = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            foreach (string header in csv.HeaderRecord ?? Array.Empty<string>())
            {
                var value = csv.GetField(header);
                if (string.Equals(header, "Timestamp", StringComparison.OrdinalIgnoreCase))
                {
                    recordObj[header] = value ?? "";
                }
                else
                {
                    if (double.TryParse(value, out double num))
                        recordObj[header] = num;
                    else
                        recordObj[header] = 0;
                }
            }

            _logger.LogInformation("Sending single row to FastAPI: {Row}", System.Text.Json.JsonSerializer.Serialize(recordObj));

            var fastApiUrl = "http://localhost:8000/simulate-row";
            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(recordObj), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(fastApiUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("FastAPI Response: {Response}", responseContent);

            if (response.IsSuccessStatusCode)
            {
                var predictionObj = System.Text.Json.JsonSerializer.Deserialize<JsonDocument>(responseContent);
                var predictionValue = predictionObj?.RootElement.GetProperty("prediction").GetDouble() ?? 0;
                var roundedPrediction = Math.Round(predictionValue);

                return Ok(new
                {
                    timestamp = recordObj["Timestamp"],
                    id = recordObj.GetValueOrDefault("Id", -1),
                    prediction = (int)roundedPrediction
                });
            }
            else
            {
                return BadRequest(new { error = "FastAPI error", details = responseContent });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Error in TestSingleRow: {0}", ex);
            return StatusCode(500, $"Internal error: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Simulate([FromForm] string? simulationStart, [FromForm] string? simulationEnd)
    {
        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
        var filePath = Path.Combine(uploadDir, "latest.csv");
        if (!System.IO.File.Exists(filePath))
            return NotFound("No uploaded CSV found.");

        // Fallback to saved simulation range if not provided
        string? simStart = simulationStart;
        string? simEnd = simulationEnd;
        if (string.IsNullOrWhiteSpace(simStart) || string.IsNullOrWhiteSpace(simEnd))
        {
            var (savedStart, savedEnd) = LoadSimulationRange();
            if (!string.IsNullOrWhiteSpace(savedStart) && !string.IsNullOrWhiteSpace(savedEnd))
            {
                simStart = savedStart;
                simEnd = savedEnd;
            }
            else
            {
                return BadRequest("Simulation start/end not provided and not found in file.");
            }
        }

        // Adjust end date to include the full day
        if (DateTime.TryParse(simEnd, out var endDate))
        {
            simEnd = endDate.AddDays(1).ToString("yyyy-MM-dd");
        }

        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        try
        {
            await StreamResults();
            return new EmptyResult();
        }
        catch (Exception ex)
        {
            _logger.LogError("Fatal error in simulation: {0}", ex);
            return StatusCode(500, new { error = ex.Message });
        }

        async Task StreamResults()
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            try
            {
                const int MAX_RESPONSES = 30;
                _logger.LogInformation("Starting simulation stream for date range: {Start} to {End} (max {MaxResponses} rows)", 
                    simStart, simEnd, MAX_RESPONSES);
                var records = csv.GetRecords<dynamic>();
                int rowCount = 0;
                int processedCount = 0;
                foreach (var record in records)
                {
                    if (processedCount >= MAX_RESPONSES)
                    {
                        var limitMessage = JsonSerializer.Serialize(new { 
                            message = $"Simulation stopped after {MAX_RESPONSES} rows to prevent overload. Narrow your date range for more focused results." 
                        });
                        await Response.WriteAsync($"data: {limitMessage}\n\n");
                        await Response.Body.FlushAsync();
                        _logger.LogInformation("Simulation stopped after reaching {MaxResponses} row limit", MAX_RESPONSES);
                        break;
                    }
                    // Access dynamic record with case-insensitivity
                    IDictionary<string, object> dict = record as IDictionary<string, object>;
                    if (dict == null)
                    {
                        _logger.LogWarning("Skipped row {Count}: Invalid record format", rowCount + 1);
                        continue;
                    }
                    rowCount++;

                    string timestampStr = "";
                    if (dict.TryGetValue("Timestamp", out var tsObj) || dict.TryGetValue("timestamp", out tsObj))
                    {
                        timestampStr = tsObj?.ToString() ?? "";
                    }

                    if (!DateTime.TryParse(timestampStr, out var rowTimestamp))
                    {
                        _logger.LogWarning("Skipped row {Count}: Invalid timestamp format '{Timestamp}'", rowCount, timestampStr);
                        continue;
                    }

                    if (rowTimestamp < DateTime.Parse(simStart) || rowTimestamp > DateTime.Parse(simEnd))
                    {
                        _logger.LogDebug("Skipped row {Count}: Timestamp {Timestamp} outside range", rowCount, timestampStr);
                        continue;
                    }

                    processedCount++;
                    var fastApiUrl = "http://localhost:8000/simulate-row";
                    _logger.LogDebug("Processing row {Count}/{Total}: Preparing request for {Timestamp}", processedCount, rowCount, timestampStr);
                    var jsonPayload = System.Text.Json.JsonSerializer.Serialize(record);
                    var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                    try
                    {
                        var response = await _httpClient.PostAsync(fastApiUrl, content);
                        var responseContent = await response.Content.ReadAsStringAsync();
                        
                        if (response.IsSuccessStatusCode)
                        {
                            var predictionObj = JsonSerializer.Deserialize<JsonDocument>(responseContent);
                            var predictionValue = predictionObj?.RootElement.GetProperty("prediction").GetDouble() ?? 0;
                            var roundedPrediction = Math.Round(predictionValue);

                            object idValue = -1;
                            if (dict.TryGetValue("Id", out var rawId))
                            {
                                idValue = rawId;
                            }

                            var result = JsonSerializer.Serialize(new
                            {
                                timestamp = timestampStr,
                                id = idValue,
                                prediction = (int)roundedPrediction
                            });

                            await Response.WriteAsync($"data: {result}\n\n");
                            await Response.Body.FlushAsync();
                            _logger.LogInformation("Sent prediction for row {Count}/{MaxResponses}: Timestamp={Timestamp}, ID={ID}, Prediction={Prediction}", 
                                processedCount, MAX_RESPONSES, timestampStr, idValue, (int)roundedPrediction);
                            
                            // Add a 1-second delay between rows
                            await Task.Delay(1000);
                        }
                        else
                        {
                            _logger.LogWarning("FastAPI returned non-success for row at {Timestamp}: {Status} {Body}", 
                                timestampStr, response.StatusCode, responseContent);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("Error calling FastAPI for row at {Timestamp}: {Message}", timestampStr, ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Error during simulation: {0}", ex);
                await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { error = ex.Message })}\n\n");
                await Response.Body.FlushAsync();
            }
        }
    }
}