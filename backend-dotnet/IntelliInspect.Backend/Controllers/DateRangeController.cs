using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class DateRangeController : ControllerBase
{
    private readonly ILogger<DateRangeController> _logger;
    private readonly DatasetService _datasetService;

    public DateRangeController(ILogger<DateRangeController> logger, DatasetService datasetService)
    {
        _logger = logger;
        _datasetService = datasetService;
    }

    [HttpGet("constraints")]
    public IActionResult GetDateConstraints()
    {
        _logger.LogInformation("[GET] /api/DateRange/constraints requested");

        var metadata = _datasetService.GetMetadata();

        if (metadata == null)
        {
            _logger.LogWarning("[GET] No metadata found. Returning default constraints.");
            return Ok(new
            {
                minDate = "2020-12-31",
                maxDate = "2020-12-31"
            });
        }

        try
        {
            _logger.LogInformation($"[GET] Metadata startTimestamp = {metadata.startTimestamp}, endTimestamp = {metadata.endTimestamp}");

            var minDate = DateTime.Parse(metadata.startTimestamp).ToString("yyyy-MM-dd HH:mm:ss");
            var maxDate = DateTime.Parse(metadata.endTimestamp).ToString("yyyy-MM-dd HH:mm:ss");

            _logger.LogInformation($"[GET] Parsed constraints: minDate = {minDate}, maxDate = {maxDate}");

            return Ok(new
            {
                minDate,
                maxDate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[GET] Failed to parse metadata: {ex.Message}");
            return StatusCode(500, $"Error parsing metadata: {ex.Message}");
        }
    }

    [HttpPost("validate")]
public IActionResult ValidateDateRanges([FromBody] DateRangeRequest request)
{
    _logger.LogInformation("[POST] /api/DateRange/validate called");

    var metadata = _datasetService.GetMetadata();
    if (metadata == null)
    {
        _logger.LogWarning("[POST] Validation failed: No dataset uploaded.");
        return BadRequest("No dataset uploaded.");
    }

    _logger.LogInformation($"[POST] Metadata range: {metadata.startTimestamp} to {metadata.endTimestamp}");

    var minDate = DateTime.Parse(metadata.startTimestamp);
    var maxDate = DateTime.Parse(metadata.endTimestamp);

    var ranges = new[]
    {
        new { Name = "Train", Start = DateTime.Parse(request.TrainStart), End = DateTime.Parse(request.TrainEnd) },
        new { Name = "Test", Start = DateTime.Parse(request.TestStart), End = DateTime.Parse(request.TestEnd) },
        new { Name = "Sim", Start = DateTime.Parse(request.SimStart), End = DateTime.Parse(request.SimEnd) }
    };

    var errors = new List<string>();

    foreach (var range in ranges)
    {
        _logger.LogInformation($"[POST] Validating range {range.Name}: {range.Start} to {range.End}");

        if (range.Start < minDate || range.End > maxDate)
            errors.Add($"{range.Name} range is outside dataset boundaries.");

        if (range.Start > range.End)
            errors.Add($"{range.Name} start date must be before end date.");
    }

    // Overlap check removed intentionally

    if (errors.Any())
    {
        _logger.LogWarning("[POST] Validation failed with errors: " + string.Join("; ", errors));
        return Ok(new
        {
            status = "invalid",
            message = "Date ranges are invalid.",
            errors = errors.ToArray()
        });
    }

    _logger.LogInformation("[POST] Validation successful. Computing chart data...");

    var chartData = _datasetService.GetMonthlyCounts(ranges.Select(r => new { r.Start, r.End }).ToArray());

    _logger.LogInformation($"[POST] Validation and chart computation complete. Records returned: {chartData.Count}");

    return Ok(new
    {
        status = "valid",
        message = "Date ranges validated successfully.",
        chartData = chartData
    });
}


    [HttpPost("submit")]
    public IActionResult SubmitDateRanges([FromBody] DateRangeRequest request)
    {
        _logger.LogInformation("[POST] /api/DateRange/submit called");
        _datasetService.SaveDateRanges(request);
        return Ok(new { message = "Date ranges submitted successfully." });
    }
}

public class DateRangeRequest
{
    public string TrainStart { get; set; }
    public string TrainEnd { get; set; }
    public string TestStart { get; set; }
    public string TestEnd { get; set; }
    public string SimStart { get; set; }
    public string SimEnd { get; set; }
    public int? TrainDays { get; set; }
    public int? TestDays { get; set; }
    public int? SimDays { get; set; }
}

public class DatasetService
{
    private readonly ILogger<DatasetService> _logger;
    private readonly string _csvFilePath;

    public DatasetService(ILogger<DatasetService> logger)
    {
        _logger = logger;
        _csvFilePath = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles", "latest.csv");
    }

    public dynamic GetMetadata()
    {
        _logger.LogInformation("[DatasetService] Reading metadata from latest.csv");

        if (!File.Exists(_csvFilePath))
        {
            _logger.LogWarning("[DatasetService] latest.csv not found");
            return null;
        }

        try
        {
            using var reader = new StreamReader(_csvFilePath);
            var headerLine = reader.ReadLine();
            if (string.IsNullOrEmpty(headerLine))
            {
                _logger.LogWarning("[DatasetService] Header line is empty");
                return null;
            }

            var headers = headerLine.Split(',').Select(h => h.Trim()).ToArray();
            var timestampIndex = Array.IndexOf(headers, "Timestamp");

            if (timestampIndex == -1)
            {
                _logger.LogWarning("[DatasetService] Timestamp column not found");
                return null;
            }

            string firstTimestamp = null;
            string lastTimestamp = null;
            int recordCount = 0;
            string line;

            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var values = line.Split(',').Select(v => v.Trim()).ToArray();
                if (values.Length > timestampIndex)
                {
                    var timestamp = values[timestampIndex];
                    if (firstTimestamp == null)
                        firstTimestamp = timestamp;
                    lastTimestamp = timestamp;
                    recordCount++;
                }
            }

            if (firstTimestamp == null || lastTimestamp == null)
            {
                _logger.LogWarning("[DatasetService] No valid timestamps found in file");
                return null;
            }

            _logger.LogInformation($"[DatasetService] Metadata loaded: {recordCount} records, start = {firstTimestamp}, end = {lastTimestamp}");

            return new
            {
                startTimestamp = firstTimestamp,
                endTimestamp = lastTimestamp,
                totalRecords = recordCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError($"[DatasetService] Error reading metadata: {ex.Message}");
            return null;
        }
    }

    public List<dynamic> GetMonthlyCounts(dynamic[] ranges)
    {
        _logger.LogInformation("[DatasetService] Calculating monthly counts");

        if (!File.Exists(_csvFilePath))
        {
            _logger.LogWarning("[DatasetService] latest.csv not found");
            return new List<dynamic>();
        }

        try
        {
            using var reader = new StreamReader(_csvFilePath);
            var headerLine = reader.ReadLine();
            if (string.IsNullOrEmpty(headerLine))
            {
                _logger.LogWarning("[DatasetService] CSV header is empty");
                return new List<dynamic>();
            }

            var headers = headerLine.Split(',').Select(h => h.Trim()).ToArray();
            var timestampIndex = Array.IndexOf(headers, "Timestamp");

            if (timestampIndex == -1)
            {
                _logger.LogWarning("[DatasetService] Timestamp column not found");
                return new List<dynamic>();
            }

            var records = new List<DateTime>();
            string line;

            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                var values = line.Split(',').Select(v => v.Trim()).ToArray();
                if (values.Length > timestampIndex)
                {
                    if (DateTime.TryParse(values[timestampIndex], out var timestamp))
                    {
                        records.Add(timestamp);
                    }
                }
            }

            var chartData = new List<dynamic>();

            var monthlyGroups = records
                .GroupBy(t => new { t.Year, t.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month);

            foreach (var group in monthlyGroups)
            {
                var monthName = new DateTime(group.Key.Year, group.Key.Month, 1).ToString("MMM");
                int train = 0, test = 0, sim = 0;

                foreach (var timestamp in group)
                {
                    for (int i = 0; i < ranges.Length; i++)
                    {
                        var r = ranges[i];
                        if (timestamp >= r.Start && timestamp <= r.End)
                        {
                            if (i == 0) train++;
                            else if (i == 1) test++;
                            else if (i == 2) sim++;
                            break;
                        }
                    }
                }

                chartData.Add(new
                {
                    month = monthName,
                    year = group.Key.Year,
                    trainVolume = train,
                    testVolume = test,
                    simVolume = sim
                });
            }

            _logger.LogInformation($"[DatasetService] Monthly counts calculated: {chartData.Count} groups");

            return chartData;
        }
        catch (Exception ex)
        {
            _logger.LogError($"[DatasetService] Error calculating monthly counts: {ex.Message}");
            return new List<dynamic>();
        }
    }

    public void SaveDateRanges(DateRangeRequest request)
    {
        _logger.LogInformation($"[DatasetService] Saving date ranges: Train({request.TrainStart} to {request.TrainEnd}), Test({request.TestStart} to {request.TestEnd}), Sim({request.SimStart} to {request.SimEnd})");
    }
}
