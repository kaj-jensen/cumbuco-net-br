# Property inventory audit

Audit date: 2026-07-15

## Summary

- 11 active property records after removing the duplicate Beach Sun record and the discontinued Casa Viviana listing
- 197 locally stored original gallery images
- No missing gallery files
- Every record has guest, bedroom, bathroom, coordinate, description, and amenity data
- The duplicate Beach Sun listing has been resolved
- Historical exact service charges have been replaced with confirmation-based wording

## Decisions required

### 1. Beach Sun Cumbuco duplicate — resolved

The records `beach-sun-cumbuco` (WordPress ID 2108) and `beach-sun-cumbuco-2` (WordPress ID 2578) have the same:

- title
- property type
- guest, bedroom, and bathroom counts
- 100 m2 size
- coordinates
- amenities
- cover image

The first record has four photos. The second has one photo and a newer version of substantially the same description. The descriptions contain different historical cleaning and electricity charges.

Resolution: the owner confirmed there is one Beach Sun Cumbuco. The four-photo `beach-sun-cumbuco` record is retained, and the one-photo `beach-sun-cumbuco-2` legacy URL redirects to it.

### 2. Casa Viviana / Villa Priscila — resolved

The owner confirmed that Casa Viviana, previously stored under the legacy slug `villa-priscila`, is no longer available. The property record and gallery have been removed, and both former URL variants redirect to the property catalogue.

### 3. Dunas Village facts conflict — resolved

The owner confirmed the active listing should show 6 guests, 3 bedrooms, and 2 bathrooms. The structured record now matches the description.

### 4. Commercial terms — resolved

The following descriptions contained electricity charges, cleaning fees, or checkout terms inherited from old WordPress content:

- Beach Sun Cumbuco
- Dream Village 301-H
- Dream Village 301-V
- Dream Village 302-V
- Dream Village 401-H
- Dunas Village
- Villa Branca

Resolution: the owner approved replacing the historical exact prices with: “Electricity and optional services may be charged separately. We will confirm all costs before booking.”

## Capacity checks — resolved

The owner confirmed the following capacities:

| Property | Guests | Bedrooms | Bathrooms |
| --- | ---: | ---: | ---: |
| Casa Chick | 14 | 5 | 7 |
| Casa Maria Flor Cumbuco | 14 | 4 | 5 |
| Villa Branca | 20 | 6 | 8 |

## Gallery coverage

All active properties have between 4 and 31 photos. Beach Sun has the smallest gallery with four photos.

## Remaining cleanup order

1. Rewrite and proofread the migrated property descriptions.
2. Configure the private Google Calendar iCal feeds in Cloudflare and verify live synchronization.
3. Add secure email delivery to the enquiry flow if required alongside WhatsApp.
