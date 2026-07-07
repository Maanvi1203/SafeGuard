# SafeGuardApp/Dockerfile
# Render deploy target for the ASP.NET Core SafeGuard app.

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SafeGuardApp.csproj ./
RUN dotnet restore SafeGuardApp.csproj

COPY . ./
RUN dotnet publish SafeGuardApp.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

COPY --from=build /app/publish ./

EXPOSE 10000

CMD ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-10000} dotnet SafeGuardApp.dll"]
