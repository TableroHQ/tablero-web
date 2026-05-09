FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Directory.Build.props", "Directory.Packages.props", "./"]
COPY ["src/BuildingBlocks/Bite.BuildingBlocks/Bite.BuildingBlocks.csproj", "src/BuildingBlocks/Bite.BuildingBlocks/"]
COPY ["src/Delivery/Bite.Delivery.Api/Bite.Delivery.Api.csproj", "src/Delivery/Bite.Delivery.Api/"]
RUN dotnet restore "src/Delivery/Bite.Delivery.Api/Bite.Delivery.Api.csproj"
COPY ["src/BuildingBlocks/", "src/BuildingBlocks/"]
COPY ["src/Delivery/", "src/Delivery/"]
RUN dotnet publish "src/Delivery/Bite.Delivery.Api/Bite.Delivery.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Bite.Delivery.Api.dll"]
