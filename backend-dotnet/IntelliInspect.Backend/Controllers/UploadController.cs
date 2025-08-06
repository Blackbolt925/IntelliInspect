using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Globalization;
using System.Data;
using CsvHelper;
using System.Text;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ILogger<UploadController> _logger;

    public UploadController(ILogger<UploadController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    [RequestSizeLimit(2147483648)] // 2GB
    public async Task<IActionResult> UploadCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("CSV file is required.");

        int totalRows = 0;
        int totalCols = 0;
        int responseCount = 0;
        List<string> columnNames = new List<string>();
        DateTime startTimestamp = new DateTime(2021, 1, 1, 0, 0, 0);
        DateTime endTimestamp = startTimestamp;

        try
        {
            // Create directory if it doesn't exist
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
            Directory.CreateDirectory(uploadDir);

            // Define the file path
            var filePath = Path.Combine(uploadDir, "latest.csv");

            // Read and process the uploaded file, then write processed rows to latest.csv
            using var inputStream = file.OpenReadStream();
            using var reader = new StreamReader(inputStream);

            string? headerLine = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(headerLine))
                return BadRequest("CSV contains no header row.");

            // Get original column names (don't add Timestamp here yet)
            var originalColumnNames = headerLine.Split(',').Select(h => h.Trim()).ToList();
            int originalColCount = originalColumnNames.Count;

            // Create final column names list (original + Timestamp)
            columnNames = new List<string>(originalColumnNames);
            totalCols = columnNames.Count; // This now includes the timestamp column
            columnNames.Add("Timestamp");
            
            var processedRows = new List<Dictionary<string, string>>();
            string? line;
            int i = 0;

            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var values = line.Split(',').Select(v => v.Trim()).ToArray();

                // Check against original column count (not including timestamp)
                if (values.Length != originalColCount)
                {
                    _logger.LogWarning($"Skipping malformed row {i + 1}: expected {originalColCount} columns, got {values.Length}");
                    continue; // skip malformed rows
                }

                var rowDict = new Dictionary<string, string>();

                // Add original column values
                for (int c = 0; c < originalColCount; c++)
                {
                    rowDict[originalColumnNames[c]] = values[c];
                }

                // Add timestamp (starts from 2021-01-01 00:00:00, adds 1 second per row)
                rowDict["Timestamp"] = startTimestamp.AddSeconds(i).ToString("yyyy-MM-dd HH:mm:ss");

                // Count responses if needed
                if (rowDict.ContainsKey("Response") && rowDict["Response"] == "1")
                    responseCount++;

                processedRows.Add(rowDict);
                i++;
            }

            totalRows = i;
            endTimestamp = startTimestamp.AddSeconds(totalRows - 1);

            _logger.LogInformation($"Processing {processedRows.Count} rows with timestamp column");

            // Write processed rows (with timestamp) to latest.csv
            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            using (var streamWriter = new StreamWriter(fileStream))
            using (var csvWriter = new CsvWriter(streamWriter, CultureInfo.InvariantCulture))
            {
                // Write headers
                foreach (var col in columnNames)
                {
                    csvWriter.WriteField(col);
                }
                csvWriter.NextRecord();

                // Write data rows
                foreach (var row in processedRows)
                {
                    foreach (var col in columnNames)
                    {
                        row.TryGetValue(col, out var value);
                        csvWriter.WriteField(value ?? string.Empty);
                    }
                    csvWriter.NextRecord();
                }

                // Ensure data is written to file
                csvWriter.Flush();
                streamWriter.Flush();
            }

            _logger.LogInformation($"Processed CSV with {processedRows.Count} rows and timestamps saved to: {Path.GetFullPath(filePath)}");
        }

        catch (Exception ex)
        {
            return BadRequest($"Error parsing CSV: {ex.Message}");
        }

        if (totalRows == 0)
            return BadRequest("CSV contains no rows.");

        double percentResponseOne = (double)responseCount / totalRows * 100.0;

        return Ok(new
        {
            totalRows,
            totalCols,
            percentResponseEqualsOne = percentResponseOne,
            startTimestamp = startTimestamp.ToString("yyyy-MM-dd HH:mm:ss"),
            endTimestamp = endTimestamp.ToString("yyyy-MM-dd HH:mm:ss"),
        });
    }
}