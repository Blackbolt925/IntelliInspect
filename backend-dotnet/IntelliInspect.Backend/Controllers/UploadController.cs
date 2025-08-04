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
    public async Task<IActionResult> UploadCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("CSV file is required.");

        var rows = new List<Dictionary<string, string>>();
        try
        {
            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var records = csv.GetRecords<dynamic>();

            foreach (var record in records)
            {
                var dict = ((IDictionary<string, object>)record)
                    .ToDictionary(k => k.Key, k => k.Value?.ToString() ?? "");
                rows.Add(dict);
            }
        }
        catch (Exception ex)
        {
            return BadRequest($"Error parsing CSV: {ex.Message}");
        }

        if (rows.Count == 0)
            return BadRequest("CSV contains no rows.");

        var columnNames = rows[0].Keys.ToList();
        int totalRows = rows.Count;
        int totalCols = columnNames.Count;

        int responseCount = 0;

        DateTime startTimestamp = new DateTime(2021, 1, 1, 0, 0, 0);
        DateTime endTimestamp = startTimestamp.AddSeconds(totalRows - 1);

        for (int i = 0; i < totalRows; i++)
        {
            var row = rows[i];

            // Augment with timestamp
            row["Timestamp"] = startTimestamp.AddSeconds(i).ToString("yyyy-MM-dd HH:mm:ss");

            // Count Response == 1
            if (row.ContainsKey("Response") && row["Response"] == "1")
                responseCount++;
        }

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
