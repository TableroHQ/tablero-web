# ────────── BUILD ──────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Directory.Build.props", "Directory.Packages.props", "./"]
COPY ["src/Gateway/Bite.Gateway/Bite.Gateway.csproj", "src/Gateway/Bite.Gateway/"]
RUN dotnet restore "src/Gateway/Bite.Gateway/Bite.Gateway.csproj"
COPY ["src/Gateway/Bite.Gateway/", "src/Gateway/Bite.Gateway/"]
RUN dotnet publish "src/Gateway/Bite.Gateway/Bite.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ────────── RUNTIME ──────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Bite.Gateway.dll"]
