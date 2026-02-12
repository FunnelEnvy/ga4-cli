# GA4 API Inventory

## APIs Used

### Google Analytics Data API v1beta
- Base URL: `https://analyticsdata.googleapis.com/v1beta`
- Auth: OAuth2 bearer token or service account
- Scope: `https://www.googleapis.com/auth/analytics.readonly`

### Google Analytics Admin API v1beta
- Base URL: `https://analyticsadmin.googleapis.com/v1beta`
- Auth: Same as Data API

## Endpoints

### Admin API

| Method | Endpoint | CLI Command |
|--------|----------|-------------|
| GET | `/v1beta/properties` | `ga4 properties list` |
| GET | `/v1beta/properties/{propertyId}` | `ga4 properties get` |

### Data API

| Method | Endpoint | CLI Command |
|--------|----------|-------------|
| POST | `/v1beta/properties/{propertyId}:runReport` | `ga4 reports run` |
| POST | `/v1beta/properties/{propertyId}:runRealtimeReport` | `ga4 realtime run` |
| GET | `/v1beta/properties/{propertyId}/metadata` | `ga4 dimensions list`, `ga4 metrics list` |

## Auth

- OAuth2 endpoints: `accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`
- Service account: JWT assertion flow to `oauth2.googleapis.com/token`
- Required scope: `https://www.googleapis.com/auth/analytics.readonly`

## Rate Limits

- 10 concurrent requests per user per project
- 10,000 requests per day per project
- 429 responses include `Retry-After` header

## Pagination

- Admin API (properties list): `pageSize` and `pageToken` query params
- Data API (reports): `limit` and `offset` in request body

## Response Shapes

### Properties List Response
```json
{
  "properties": [
    {
      "name": "properties/123456",
      "displayName": "My Website",
      "createTime": "2024-01-01T00:00:00Z",
      "updateTime": "2024-06-01T00:00:00Z",
      "timeZone": "America/New_York",
      "currencyCode": "USD",
      "industryCategory": "TECHNOLOGY",
      "serviceLevel": "GOOGLE_ANALYTICS_STANDARD"
    }
  ],
  "nextPageToken": "..."
}
```

### Run Report Response
```json
{
  "dimensionHeaders": [{"name": "city"}],
  "metricHeaders": [{"name": "activeUsers", "type": "TYPE_INTEGER"}],
  "rows": [
    {
      "dimensionValues": [{"value": "New York"}],
      "metricValues": [{"value": "1234"}]
    }
  ],
  "rowCount": 100,
  "metadata": {"currencyCode": "USD", "timeZone": "America/New_York"}
}
```

### Metadata Response
```json
{
  "name": "properties/123456/metadata",
  "dimensions": [
    {
      "apiName": "city",
      "uiName": "City",
      "description": "The city from which the user activity originated.",
      "category": "Geography",
      "customDefinition": false
    }
  ],
  "metrics": [
    {
      "apiName": "activeUsers",
      "uiName": "Active users",
      "description": "The number of distinct users who visited your site or app.",
      "category": "User",
      "type": "TYPE_INTEGER",
      "customDefinition": false
    }
  ]
}
```
