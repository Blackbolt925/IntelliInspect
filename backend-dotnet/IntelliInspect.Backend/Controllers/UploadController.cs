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
            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            string? headerLine = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(headerLine))
                return BadRequest("CSV contains no header row.");

            columnNames = headerLine.Split(',').Select(h => h.Trim()).ToList();
            totalCols = columnNames.Count;

            string? line;
            int i = 0;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;
                var values = line.Split(',');
                if (values.Length != totalCols)
                    continue; // skip malformed rows

                // Build dictionary for row if needed
                var rowDict = new Dictionary<string, string>();
                for (int c = 0; c < totalCols; c++)
                {
                    rowDict[columnNames[c]] = values[c];
                }

                // Augment with timestamp (not returned, but for parity)
                // rowDict["Timestamp"] = startTimestamp.AddSeconds(i).ToString("yyyy-MM-dd HH:mm:ss");

                // Count Response == 1
                if (rowDict.ContainsKey("Response") && rowDict["Response"] == "1")
                    responseCount++;

                i++;
            }
            totalRows = i;
            endTimestamp = startTimestamp.AddSeconds(totalRows - 1);
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
