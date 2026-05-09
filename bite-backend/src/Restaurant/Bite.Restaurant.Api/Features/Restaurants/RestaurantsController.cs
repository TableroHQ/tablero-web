using Bite.BuildingBlocks.Identity;
using Bite.Restaurant.Api.Domain;
using Bite.Restaurant.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Restaurant.Api.Features.Restaurants;

[ApiController]
[Route("api/restaurant")]
public class RestaurantsController : ControllerBase
{
    private readonly RestaurantDbContext _db;
    private readonly ICurrentUser _me;

    public RestaurantsController(RestaurantDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record RestaurantDto(Guid Id, string Name, string Address, string? Description,
                                string? CoverImageUrl, string Phone, string Timezone,
                                string OpeningTime, string ClosingTime, decimal Overall, int TotalReviews);

    public record CreateRestaurantRequest(string Name, string Address, string Phone,
                                          string Timezone, string OpeningTime, string ClosingTime);

    public record UpdateRestaurantRequest(string? Name, string? Address, string? Description,
                                          string? CoverImageUrl, string? OpeningTime, string? ClosingTime);

    [HttpGet("public/{id:guid}"), AllowAnonymous]
    public async Task<ActionResult<RestaurantDto>> GetPublic(Guid id, CancellationToken ct)
    {
        var r = await _db.Restaurants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return NotFound();
        var rating = await _db.Ratings.AsNoTracking().FirstOrDefaultAsync(s => s.RestaurantId == id, ct);
        return Ok(new RestaurantDto(r.Id, r.Name, r.Address, r.Description, r.CoverImageUrl,
            r.Phone, r.Timezone, r.OpeningTime.ToString(), r.ClosingTime.ToString(),
            rating?.Overall ?? 0, rating?.TotalReviews ?? 0));
    }

    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] CreateRestaurantRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Director, UserRole.Admin)) return Forbid();
        var r = new Domain.Restaurant
        {
            Name = req.Name,
            Address = req.Address,
            Phone = req.Phone,
            Timezone = req.Timezone,
            OpeningTime = TimeOnly.Parse(req.OpeningTime),
            ClosingTime = TimeOnly.Parse(req.ClosingTime),
            OwnerUserId = _me.UserId!.Value
        };
        _db.Restaurants.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetPublic), new { id = r.Id }, new { r.Id });
    }

    [HttpPatch("{id:guid}"), Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRestaurantRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Director, UserRole.Admin)) return Forbid();
        var r = await _db.Restaurants.FindAsync([id], ct);
        if (r is null) return NotFound();
        if (req.Name is not null) r.Name = req.Name;
        if (req.Address is not null) r.Address = req.Address;
        if (req.Description is not null) r.Description = req.Description;
        if (req.CoverImageUrl is not null) r.CoverImageUrl = req.CoverImageUrl;
        if (req.OpeningTime is not null) r.OpeningTime = TimeOnly.Parse(req.OpeningTime);
        if (req.ClosingTime is not null) r.ClosingTime = TimeOnly.Parse(req.ClosingTime);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/restaurant/{restaurantId:guid}/photos")]
public class PhotosController : ControllerBase
{
    private readonly RestaurantDbContext _db;
    private readonly ICurrentUser _me;
    public PhotosController(RestaurantDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record AddPhotoRequest(string Url, int SortOrder);

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Photo>>> List(Guid restaurantId, CancellationToken ct)
        => Ok(await _db.Photos.AsNoTracking().Where(p => p.RestaurantId == restaurantId)
            .OrderBy(p => p.SortOrder).ToListAsync(ct));

    [HttpPost, Authorize]
    public async Task<IActionResult> Add(Guid restaurantId, [FromBody] AddPhotoRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var p = new Photo { RestaurantId = restaurantId, Url = req.Url, SortOrder = req.SortOrder };
        _db.Photos.Add(p);
        await _db.SaveChangesAsync(ct);
        return Ok(p);
    }

    [HttpDelete("{id:guid}"), Authorize]
    public async Task<IActionResult> Delete(Guid restaurantId, Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var p = await _db.Photos.FindAsync([id], ct);
        if (p is null) return NotFound();
        _db.Photos.Remove(p);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/restaurant/{restaurantId:guid}/menu")]
public class PublicMenuController : ControllerBase
{
    private readonly RestaurantDbContext _db;
    public PublicMenuController(RestaurantDbContext db) => _db = db;

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult> GetMenu(Guid restaurantId, CancellationToken ct)
    {
        var items = await _db.MenuCache.AsNoTracking()
            .Where(m => m.RestaurantId == restaurantId)
            .OrderBy(m => m.Category).ThenBy(m => m.Name)
            .ToListAsync(ct);

        var grouped = items.GroupBy(x => x.Category)
            .Select(g => new { category = g.Key, items = g.Select(i => new {
                i.Id, i.Name, i.Description, i.Price, i.ImageUrl,
                allergens = string.IsNullOrEmpty(i.Allergens) ? Array.Empty<string>() : i.Allergens.Split(','),
                i.IsAvailable
            })});

        return Ok(grouped);
    }
}
