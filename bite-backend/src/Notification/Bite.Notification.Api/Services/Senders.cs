using SendGrid;
using SendGrid.Helpers.Mail;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace Bite.Notification.Api.Services;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}

public sealed class SendGridEmailSender : IEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendGridEmailSender> _log;
    public SendGridEmailSender(IConfiguration config, ILogger<SendGridEmailSender> log)
    { _config = config; _log = log; }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var apiKey = _config["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("SG.changeme"))
        {
            _log.LogInformation("[DEV] would email {To}: {Subject}", to, subject);
            return;
        }
        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(_config["SendGrid:From"], _config["SendGrid:FromName"]);
        var msg = MailHelper.CreateSingleEmail(from, new EmailAddress(to), subject, "", htmlBody);
        await client.SendEmailAsync(msg, ct);
    }
}

public interface ISmsSender
{
    Task SendAsync(string to, string body, CancellationToken ct = default);
}

public sealed class TwilioSmsSender : ISmsSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<TwilioSmsSender> _log;
    public TwilioSmsSender(IConfiguration config, ILogger<TwilioSmsSender> log)
    { _config = config; _log = log; }

    public async Task SendAsync(string to, string body, CancellationToken ct = default)
    {
        var sid = _config["Twilio:AccountSid"];
        if (string.IsNullOrEmpty(sid) || sid.StartsWith("AC_changeme"))
        {
            _log.LogInformation("[DEV] would SMS {To}: {Body}", to, body);
            return;
        }
        await MessageResource.CreateAsync(
            to: new PhoneNumber(to),
            from: new PhoneNumber(_config["Twilio:From"]),
            body: body);
    }
}
