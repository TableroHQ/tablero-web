using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace Bite.Restaurant.Api.Features.Qr;

[ApiController]
[Route("api/restaurant/qr")]
public class QrCodeController : ControllerBase
{
    /// <summary>Generates a QR PNG that points at the public ordering URL for a table.</summary>
    [HttpGet("{tableId:guid}")]
    public IActionResult Generate(Guid tableId, [FromQuery] string baseUrl = "https://bite.com")
    {
        var url = $"{baseUrl.TrimEnd('/')}/qr?t={tableId}";
        using var gen = new QRCodeGenerator();
        var data = gen.CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
        var pngQr = new PngByteQRCode(data);
        var png = pngQr.GetGraphic(20);
        return File(png, "image/png", $"table-{tableId}.png");
    }
}
