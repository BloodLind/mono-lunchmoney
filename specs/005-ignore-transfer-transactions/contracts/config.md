# Config Contract: Ignore Transfer Transactions

## Config Shape

The config file may contain a dedicated ignored transfer source list:

```json
{
  "ignoredMonobankAccounts": [
    {
      "enabled": true,
      "monoAccountId": "abc123",
      "monoDisplayName": "Mono White UAH ****2222",
      "monoType": "white",
      "monoCurrencyCode": 980,
      "currency": "uah",
      "maskedPan": "4444******2222",
      "ibanSha256": "64-character-sha256-hex"
    }
  ],
  "accounts": []
}
```

## Rules

- `ignoredMonobankAccounts` defaults to an empty list.
- Ignored transfer sources are independent from `accounts`.
- A source may appear in both lists, but an enabled ignored source must not be fetched/imported as a syncable mapping.
- `ibanSha256` stores only a hash of the source IBAN; full IBAN must not be written to config.
- `maskedPan` must remain masked; full PAN must not be written to config.
- Config validation rejects malformed `ibanSha256` values.

## Sanitized Display

`config show` may display:

```json
{
  "ignoredMonobankAccounts": [
    {
      "enabled": true,
      "monoDisplayName": "Mono White UAH ****2222",
      "monoType": "white",
      "monoCurrencyCode": 980,
      "currency": "uah",
      "monoAccountId": "abc...123",
      "maskedPan": "4444******2222",
      "hasIbanMatcher": true
    }
  ]
}
```

`config show` must not display:

- API tokens
- full Monobank account ids
- full card/PAN values
- full IBAN values
- raw `ibanSha256` values unless explicitly needed for a diagnostic mode not covered by this feature
