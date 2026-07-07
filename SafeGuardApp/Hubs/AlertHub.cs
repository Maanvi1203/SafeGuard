using Microsoft.AspNetCore.SignalR;

namespace SafeGuardApp.Hubs;

public class AlertHub : Hub
{
    public async Task EscalateReport(object payload)
    {
        await Clients.Group("Admin").SendAsync("AdminAlertReceived", payload);
        await Clients.Caller.SendAsync("EscalationConfirmed", payload);
    }

    public async Task SendVideoRisk(object payload)
    {
        await Clients.Group("Admin").SendAsync("VideoRiskConfirmed", payload);
        await Clients.Caller.SendAsync("VideoRiskConfirmed", payload);
    }

    public async Task JoinRoleGroup(string role)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, role);
    }
}
