# UniSell User Flow

This shows how students move through UniSell, from signing up to selling or buying an item and meeting up. It matches our low-fi wireframes. We'll update it if our interviews show something different.

## Who uses it

- **Buyer:** a DOrSU student looking for a school item (like Mervie Jane Albite in our personas).
- **Seller:** a DOrSU student who wants to sell something they don't need anymore, or sells new items (like Edgardo Balayo in our personas).
- One person can be both. The app doesn't separate the two.

## Getting started

1. Open the app and see the splash screen.
2. Go through the short onboarding, or skip it.
3. Sign up with name, student email, student ID, and course/year. Or log in if you already have an account.
4. Land on the Home Feed, which says "Hi, \[name\]".

## Buyer flow (Mervie)

1. On Home, browse the listings, pick a category chip, or use the search bar.
2. Open an item to see photos, price, condition, description, the seller's rating, and the meetup spots they allow.
3. Save the item for later, or choose how to ask:
   - Tap **Message** to chat with the seller first, or
   - Tap **Reserve** to ask for the item.
4. For Reserve, pick one of the seller's meetup spots and confirm. The request is now **Pending**.
5. Chat with the seller in the app to agree on the time and details.
6. When the seller accepts, the Reservations tab shows **Accepted** with the meetup details.
7. Meet at the campus spot, check the item, and pay in cash.
8. After the seller marks it as sold, rate the seller.

## Seller flow (Edgardo)

1. Tap **Sell (+)** in the bottom bar.
2. Add photos, title, category, condition, price, and description.
3. Choose which campus meetup spots work for you: Library Entrance, Canteen, Admin Building, Gymnasium, or Main Gate.
4. Tap **Post**. The item shows up in the feed and in My Listings as **Available**.
5. When someone reserves it, a request appears under Reservations. The item shows as **Reserved** for other students.
6. Chat with the buyer, then **Accept** or **Decline** the request.
7. Meet the buyer at the agreed spot and get paid in cash.
8. Tap **Mark as sold** on the listing. It now shows **Sold**.

## What happens to a reservation

| Status | What it means | What happens next |
| --- | --- | --- |
| Pending | Buyer asked to reserve, seller hasn't answered | Seller accepts or declines. Buyer can cancel. |
| Accepted | Seller agreed and a meetup spot is set | Buyer and seller meet. Seller marks the item as sold. |
| Declined | Seller said no | Item becomes Available again. |
| Cancelled | Buyer backed out | Item becomes Available again. |
| Completed | Item was handed over and marked as sold | Buyer can rate the seller. |

## Screens in the app

The bottom bar has five tabs. Here's what lives under each one.

| Tab | Screens |
| --- | --- |
| Home | Home Feed, Search and Filters, Item Detail, Reserve Confirmation |
| Saved | Saved Items |
| Sell (+) | Post Item |
| Chats | Chat List, Chat Thread, Meetup Details |
| Profile | My Profile, My Listings, Reservations, Reviews, Settings, Log out |

Outside the tabs: Splash, Onboarding, Register, Login, and Rate Seller.

## Edge cases we plan for

- **Item already reserved:** other students see a Reserved tag and can't reserve it.
- **Seller declines or buyer cancels:** the item goes back to Available.
- **Item sold:** it's marked Sold and can't be reserved.
- **Someone doesn't show up:** the other person can message in the chat, and the seller can cancel the reservation. \[we may add a report option later\]
- **No results or no listings yet:** we show an empty state instead of a blank screen.
- **No internet or an error:** we show a message and a retry option.

## Things we kept out on purpose

- No cart and no online payment. It's cash at the meetup.
- No delivery. Students meet at campus spots.

## Notes

- This flow is a draft based on our planning and wireframes. We'll update it with what our interviews tell us.
- Drafted with AI help. See AI\_DISCLOSURE\_LOG.md.
