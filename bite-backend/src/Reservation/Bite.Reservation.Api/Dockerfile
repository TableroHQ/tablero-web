FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Directory.Build.props", "Directory.Packages.props", "./"]
COPY ["src/BuildingBlocks/Bite.BuildingBlocks/Bite.BuildingBlocks.csproj", "src/BuildingBlocks/Bite.BuildingBlocks/"]
COPY ["src/Reservation/Bite.Reservation.Api/Bite.Reservation.Api.csproj", "src/Reservation/Bite.Reservation.Api/"]
RUN dotnet restore "src/Reservation/Bite.Reservation.Api/Bite.Reservation.Api.csproj"
COPY ["src/BuildingBlocks/", "src/BuildingBlocks/"]
COPY ["src/Reservation/", "src/Reservation/"]
RUN dotnet publish "src/Reservation/Bite.Reservation.Api/Bite.Reservation.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Bite.Reservation.Api.dll"]
