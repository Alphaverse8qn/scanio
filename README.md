# 📱 Scratch Card Dialer

Scan a scratch card barcode/number and auto-dial it — no typing required.

## Features
- 📷 Live camera with animated scan frame
- 🔦 Torch/flashlight toggle
- 🔍 Extracts numeric codes from barcodes, QR codes, and Code128
- 📟 Shows each digit clearly before dialing
- 📞 One-tap "Dial Now" opens the native phone dialer with the number pre-filled
- 📋 Also copies to clipboard as a backup
- 🔄 Rescan button if the wrong number was detected

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start

# 3. Scan the QR code with Expo Go (iOS/Android)
```

## How it works

1. Point the camera at the scratch card's **barcode** (most cards have one).
2. The app detects the code automatically and vibrates to confirm.
3. The scanned number slides up in a panel — review each digit.
4. Tap **Dial Now** → your phone's dialer opens with the number ready.

## Supported code formats
- QR Code
- Code 128 / Code 39
- EAN-13
- PDF417
- Plain numeric strings (8–20 digits)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Number looks wrong | Tap **Rescan** and try again with better lighting |
| Can't open dialer | Number is copied to clipboard — paste manually |
| Camera permission denied | Go to Settings → Apps → Camera → Allow |

## Permissions required
- **Camera** — to scan the card
- **Phone** (Android) — to open the dialer with the number

## Notes
- On iOS, `Linking.openURL('tel:...')` pre-fills the dialer but still requires the user to press Call — this is an iOS restriction.
- The torch toggle helps in low-light conditions.
