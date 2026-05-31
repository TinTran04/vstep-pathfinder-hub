using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BusinessLogicLayer.Services.Implements;

public static class PayOsSignatureHelper
{
    public static string CreateSignature(IDictionary<string, string> values, string checksumKey)
    {
        var data = string.Join('&', values
            .OrderBy(item => item.Key, StringComparer.Ordinal)
            .Select(item => $"{item.Key}={item.Value}"));

        return HmacSha256(data, checksumKey);
    }

    public static string CreateSignature(JsonElement data, string checksumKey)
    {
        var values = data.EnumerateObject()
            .OrderBy(property => property.Name, StringComparer.Ordinal)
            .Select(property => $"{property.Name}={ToPayOsValue(property.Value)}");

        return HmacSha256(string.Join('&', values), checksumKey);
    }

    private static string HmacSha256(string data, string checksumKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(checksumKey);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }

    private static string ToPayOsValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Null => "null",
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Array => JsonSerializer.Serialize(value.EnumerateArray().Select(SortJsonElement)),
            JsonValueKind.Object => JsonSerializer.Serialize(SortJsonElement(value)),
            _ => string.Empty
        };
    }

    private static object? SortJsonElement(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Object => value.EnumerateObject()
                .OrderBy(property => property.Name, StringComparer.Ordinal)
                .ToDictionary(property => property.Name, property => SortJsonElement(property.Value)),
            JsonValueKind.Array => value.EnumerateArray().Select(SortJsonElement).ToList(),
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.TryGetInt64(out var longValue)
                ? longValue
                : value.GetDecimal().ToString(CultureInfo.InvariantCulture),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => null
        };
    }
}
