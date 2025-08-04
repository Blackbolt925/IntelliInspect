FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["IntelliInspect.Backend/IntelliInspect.Backend.csproj", "IntelliInspect.Backend/"]
RUN dotnet restore "IntelliInspect.Backend/IntelliInspect.Backend.csproj"
COPY . .
WORKDIR "/src/IntelliInspect.Backend"
RUN dotnet build "IntelliInspect.Backend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IntelliInspect.Backend.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IntelliInspect.Backend.dll"]