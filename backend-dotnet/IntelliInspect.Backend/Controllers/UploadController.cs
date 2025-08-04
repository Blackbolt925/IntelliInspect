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
        double minValue = double.MaxValue;
        double maxValue = double.MinValue;

        foreach (var row in rows)
        {
            if (row.ContainsKey("Response") && row["Response"] == "1")
                responseCount++;

            foreach (var val in row.Values)
            {
                if (double.TryParse(val, NumberStyles.Any, CultureInfo.InvariantCulture, out double num))
                {
                    if (num < minValue) minValue = num;
                    if (num > maxValue) maxValue = num;
                }
            }
        }

        double percentResponseOne = (double)responseCount / totalRows * 100.0;

        return Ok(new
        {
            totalRows,
            totalCols,
            percentResponseEqualsOne = percentResponseOne,
            minValue,
            maxValue
        });
    }
}
