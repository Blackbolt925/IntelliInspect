using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using CsvHelper;
using System.Text;

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
        var metadata = _datasetService.GetMetadata();
        if (metadata == null)
            return BadRequest("No dataset uploaded.");
        
        return Ok(new { 
            minDate = metadata.startTimestamp, 
            maxDate = metadata.endTimestamp 
        });
    }

    [HttpPost("validate")]
    public IActionResult ValidateDateRanges([FromBody] DateRangeRequest request)
    {
        var metadata = _datasetService.GetMetadata();
        if (metadata == null)
            return BadRequest("No dataset uploaded.");

        var minDate = DateTime.Parse(metadata.startTimestamp);
        var maxDate = DateTime.Parse(metadata.endTimestamp);

        var ranges = new[]
        {
            new { Name = "Train", Start = DateTime.Parse(request.TrainStart), End = DateTime.Parse(request.TrainEnd) },
            new { Name = "Test", Start = DateTime.Parse(request.TestStart), End = DateTime.Parse(request.TestEnd) },
            new { Name = "Sim", Start = DateTime.Parse(request.SimStart), End = DateTime.Parse(request.SimEnd) }
        };

        // Validate ranges
        var errors = new List<string>();
        
        foreach (var range in ranges)
        {
            if (range.Start < minDate || range.End > maxDate)
                errors.Add($"{range.Name} range is outside dataset boundaries.");
            if (range.Start > range.End)
                errors.Add($"{range.Name} start date must be before end date.");
        }

        // Check for overlaps
        for (int i = 0; i < ranges.Length; i++)
        {
            for (int j = i + 1; j < ranges.Length; j++)
            {
                if (ranges[i].End >= ranges[j].Start && ranges[j].End >= ranges[i].Start)
                    errors.Add($"{ranges[i].Name} and {ranges[j].Name} ranges cannot overlap.");
            }
        }

        if (errors.Any())
            return Ok(new { 
                status = "invalid", 
                message = "Date ranges are invalid.", 
                errors = errors.ToArray() 
            });

        // Calculate monthly counts
        var chartData = _datasetService.GetMonthlyCounts(ranges.Select(r => new { r.Start, r.End }).ToArray());
        
        return Ok(new { 
            status = "valid", 
            message = "Date ranges validated successfully.", 
            chartData = chartData 
        });
    }

    [HttpPost("submit")]
    public IActionResult SubmitDateRanges([FromBody] DateRangeRequest request)
    {
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
        if (!File.Exists(_csvFilePath))
            return null;

        try
        {
            using var reader = new StreamReader(_csvFilePath);
            
            // Read header line
            var headerLine = reader.ReadLine();
            if (string.IsNullOrEmpty(headerLine))
                return null;

            var headers = headerLine.Split(',').Select(h => h.Trim()).ToArray();
            var timestampIndex = Array.IndexOf(headers, "Timestamp");
            
            if (timestampIndex == -1)
                return null;

            string firstTimestamp = null;
            string lastTimestamp = null;
            int recordCount = 0;

            // Read data lines
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
                return null;

            return new { 
                startTimestamp = firstTimestamp, 
                endTimestamp = lastTimestamp,
                totalRecords = recordCount 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error reading CSV metadata: {ex.Message}");
            return null;
        }
    }

    public List<dynamic> GetMonthlyCounts(dynamic[] ranges)
    {
        if (!File.Exists(_csvFilePath))
            return new List<dynamic>();

        try
        {
            using var reader = new StreamReader(_csvFilePath);
            
            // Read header line
            var headerLine = reader.ReadLine();
            if (string.IsNullOrEmpty(headerLine))
                return new List<dynamic>();

            var headers = headerLine.Split(',').Select(h => h.Trim()).ToArray();
            var timestampIndex = Array.IndexOf(headers, "Timestamp");
            
            if (timestampIndex == -1)
                return new List<dynamic>();

            var records = new List<DateTime>();
            
            // Read data lines and extract timestamps
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

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

            // Group by month and year
            var monthlyGroups = records
                .GroupBy(timestamp => new { Year = timestamp.Year, Month = timestamp.Month })
                .OrderBy(g => g.Key.Year)
                .ThenBy(g => g.Key.Month);

            foreach (var monthGroup in monthlyGroups)
            {
                var monthName = new DateTime(monthGroup.Key.Year, monthGroup.Key.Month, 1).ToString("MMM");
                var trainVolume = 0;
                var testVolume = 0;
                var simVolume = 0;

                foreach (var timestamp in monthGroup)
                {
                    // Check which range this record falls into
                    for (int i = 0; i < ranges.Length; i++)
                    {
                        var range = ranges[i];
                        if (timestamp >= range.Start && timestamp <= range.End)
                        {
                            switch (i)
                            {
                                case 0: trainVolume++; break;
                                case 1: testVolume++; break;
                                case 2: simVolume++; break;
                            }
                            break;
                        }
                    }
                }

                chartData.Add(new
                {
                    month = monthName,
                    year = monthGroup.Key.Year,
                    trainVolume = trainVolume,
                    testVolume = testVolume,
                    simVolume = simVolume
                });
            }

            return chartData;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error calculating monthly counts: {ex.Message}");
            return new List<dynamic>();
        }
    }

    public void SaveDateRanges(DateRangeRequest request)
    {
        // Store the date ranges (you can implement persistence as needed)
        _logger.LogInformation($"Saving date ranges: Train({request.TrainStart} to {request.TrainEnd}), Test({request.TestStart} to {request.TestEnd}), Sim({request.SimStart} to {request.SimEnd})");
    }
}