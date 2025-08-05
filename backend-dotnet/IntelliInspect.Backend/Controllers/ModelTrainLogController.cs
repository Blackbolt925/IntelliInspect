using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntelliInspect.Backend.Controllers
{
    [ApiController]
    [Route("api/train-model")]
    public class ModelTrainLogController : ControllerBase
    {
        private readonly ILogger<ModelTrainLogController> _logger;

        public ModelTrainLogController(ILogger<ModelTrainLogController> logger)
        {
            _logger = logger;
        }

        public class TrainModelLogRequest
        {
            public string TrainStart { get; set; }
            public string TrainEnd { get; set; }
            public string TestStart { get; set; }
            public string TestEnd { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> LogTrainModel([FromBody] TrainModelLogRequest request)
        {
            _logger.LogInformation($"[TrainModelLog] TrainStart={request.TrainStart}, TrainEnd={request.TrainEnd}, TestStart={request.TestStart}, TestEnd={request.TestEnd}");

            // Path to the CSV file to send
            var csvFilePath = "UploadedFiles/latest.csv";
            if (!System.IO.File.Exists(csvFilePath))
            {
                _logger.LogError($"CSV file not found at {csvFilePath}");
                return NotFound(new { error = "CSV file not found" });
            }

            using var httpClient = new System.Net.Http.HttpClient();
            using var multipartContent = new System.Net.Http.MultipartFormDataContent();
            multipartContent.Add(new System.Net.Http.StringContent(request.TrainStart ?? ""), "trainStart");
            multipartContent.Add(new System.Net.Http.StringContent(request.TrainEnd ?? ""), "trainEnd");
            multipartContent.Add(new System.Net.Http.StringContent(request.TestStart ?? ""), "testStart");
            multipartContent.Add(new System.Net.Http.StringContent(request.TestEnd ?? ""), "testEnd");
            using var fileStream = System.IO.File.OpenRead(csvFilePath);
            multipartContent.Add(new System.Net.Http.StreamContent(fileStream), "file", "latest.csv");

            // URL of FastAPI service
            var fastApiUrl = "http://localhost:8000/train-model";
            var response = await httpClient.PostAsync(fastApiUrl, multipartContent);
            var responseContent = await response.Content.ReadAsStringAsync();

            return Content(responseContent, response.Content.Headers.ContentType?.ToString() ?? "application/json");
        }
    }
}
