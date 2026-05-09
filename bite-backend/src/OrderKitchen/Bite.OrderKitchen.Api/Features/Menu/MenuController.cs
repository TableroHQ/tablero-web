using Bite.BuildingBlocks.Identity;
using Bite.OrderKitchen.Api.Domain;
using Bite.OrderKitchen.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.OrderKitchen.Api.Features.Menu;

[ApiController]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly ICurrentUser _me;
    private readonly IPublishEndpoint _bus;

    public MenuController(OrderDbContext db, ICurrentUser me, IPublishEndpoint bus)
    { _db = db; _me = me; _bus = bus; }

    public record CategoryDto(Guid Id, string Name, int SortOrder);
    public record MenuItemDto(Guid Id, Guid CategoryId, string CategoryName, string Name, string? Description,
                              decimal Price, string? ImageUrl, string[] Allergens, bool IsAvailable);

    public record CreateCategoryRequest(Guid RestaurantId, string Name, int SortOrder);
    public record CreateItemRequest(Guid RestaurantId, Guid CategoryId, string Name, string? Description,
                                    decimal Price, string? ImageUrl, string Allergens);
    public record UpdateItemRequest(string? Name, string? Description, decimal? Price, string? ImageUrl,
                                    string? Allergens, Guid? CategoryId);

    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MenuItemDto>>> List([FromQuery] Guid restaurantId, CancellationToken ct)
    {
        var items = await (from i in _db.MenuItems
                           join c in _db.Categories on i.CategoryId equals c.Id
                           where i.RestaurantId == restaurantId
                           orderby c.SortOrder, i.Name
                           select new MenuItemDto(i.Id, i.CategoryId, c.Name, i.Name, i.Description,
                                                  i.Price, i.ImageUrl,
                                                  string.IsNullOrEmpty(i.Allergens) ? Array.Empty<string>() : i.Allergens.Split(','),
                                                  i.IsAvailable))
                          .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("categories"), Authorize]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var c = new MenuCategory { RestaurantId = req.RestaurantId, Name = req.Name, SortOrder = req.SortOrder };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        return Ok(c);
    }

    [HttpPost("items"), Authorize]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var m = new MenuItem
        {
            RestaurantId = req.RestaurantId, CategoryId = req.CategoryId,
            Name = req.Name, Description = req.Description, Price = req.Price,
            ImageUrl = req.ImageUrl, Allergens = req.Allergens
        };
        _db.MenuItems.Add(m);
        await _db.SaveChangesAsync(ct);
        return Ok(m);
    }

    [HttpPatch("items/{id:guid}"), Authorize]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var m = await _db.MenuItems.FindAsync([id], ct);
        if (m is null) return NotFound();
        if (req.Name is not null)        m.Name = req.Name;
        if (req.Description is not null) m.Description = req.Description;
        if (req.Price.HasValue)          m.Price = req.Price.Value;
        if (req.ImageUrl is not null)    m.ImageUrl = req.ImageUrl;
        if (req.Allergens is not null)   m.Allergens = req.Allergens;
        if (req.CategoryId.HasValue)     m.CategoryId = req.CategoryId.Value;
        m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("items/{id:guid}"), Authorize]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var m = await _db.MenuItems.FindAsync([id], ct);
        if (m is null) return NotFound();
        _db.MenuItems.Remove(m);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("items/{id:guid}/toggle-availability"), Authorize]
    public async Task<IActionResult> Toggle86(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Chef, UserRole.Admin, UserRole.Director)) return Forbid();
        var m = await _db.MenuItems.FindAsync([id], ct);
        if (m is null) return NotFound();
        m.IsAvailable = !m.IsAvailable;
        m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        if (!m.IsAvailable)
            await _bus.Publish(new BuildingBlocks.Contracts.MenuItemUnavailable(m.Id, m.RestaurantId), ct);
        return Ok(new { available = m.IsAvailable });
    }
}
