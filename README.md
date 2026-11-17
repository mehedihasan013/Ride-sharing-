# CholoBhairab (চলো ভৈরব) - Multi-Modal Ride-Sharing Platform

A localized multi-modal ride-sharing and intercity transit platform tailored for **Bhairab, Dhaka Division, Bangladesh**.

## Key Highlights
- **Multi-Modal Vehicles**: Motorbikes, CNG Auto-rickshaws, and Easy-Bikes (Tomtom electric 3-wheelers) for intra-city; scheduled microbuses/cars for Bhairab–Dhaka/Kishoreganj/Brahmanbaria.
- **InDrive-Style Fare Bidding**: Real-time fare negotiation between passengers and drivers via WebSockets.
- **Cash-First with Prepaid Driver Wallet**: Passengers pay cash; platform automatically deducts 7–10% commission from the driver's bKash/Nagad prepaid balance.
- **Localized Mapping**: High-frequency Bhairab landmark indexing with Barikoi API and MapLibre/OSM.
- **Full Bangla Audio/UI**: Audio broadcast of ride opportunities for local drivers with tiered NID/Ward Councilor onboarding.

## Architecture & Directory Structure
```
Ride sharing/
├── backend/              # NestJS / TypeScript REST & WebSocket Server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/     # Phone OTP & JWT
│   │   │   ├── drivers/  # Driver KYC & Tiered verification
│   │   │   ├── rides/    # Real-time bidding state machine & dispatch
│   │   │   ├── geo/      # Bhairab landmark catalog & Barikoi mapping
│   │   │   ├── wallet/   # bKash / Nagad driver wallet & commission ledger
│   │   │   └── safety/   # Live tracking link & 999 SOS
├── apps/
│   ├── passenger_app/    # Flutter Mobile App for Riders
│   └── driver_app/       # Flutter Mobile App for Drivers (Bangla Audio & Bids)
└── docs/                 # Architecture, DB Schemas, & API References
```

For the complete technical blueprint, see [ride_sharing_master_plan.md](file:///C:/Users/LMehe/.gemini/antigravity/brain/a0c7e091-a68e-44f5-bb84-cc1b1cebaee4/ride_sharing_master_plan.md).
