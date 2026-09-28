// Demonstration data — the single source for every fictional person and home
// in a demo run. Read by two things that previously disagreed:
//
//   - scripts/demo/seed-demo.mjs writes these into the LOCAL demo database
//     (seeker_briefs drive matching; hush_homes are browsable listings).
//   - lib/mowatt-seekers.ts returns DEMO_SEEKERS as the "Who's looking"
//     directory when MATCHLISTED_DEMO=1.
//
// Before this file, the directory returned an empty list in demo mode — so the
// buyers that powered matching existed, but the public page listing buyers
// said "0 Quiet Seekers". Now both surfaces show the same people.
//
// DEMO-VIDEO.md rule 3 applies to everything here: no real person, no real
// address, no real listing photo. Names are role labels, addresses are
// "Demonstration Road", and homes carry no photos so no real listing image can
// appear on screen.
//
// This file is imported by a plain Node script via type-stripping, so it must
// stay plain data: no enums, no runtime imports, `import type` only.

export type DemoPosition =
  | "cash-nothing-to-sell"
  | "cash-after-sale"
  | "mortgage-sold"
  | "mortgage-to-sell"
  | "first-time-buyer";

export type DemoBriefType =
  | "detached"
  | "semi-detached"
  | "terraced"
  | "bungalow"
  | "flat"
  | "cottage";

export type DemoSeeker = {
  /** Area ids, fully qualified, e.g. "east-lothian/north-berwick". */
  areas: string[];
  min: number;
  max: number;
  beds: number;
  /** Empty means open to any type. */
  types: DemoBriefType[];
  position: DemoPosition;
  headline: string;
  /** Short first-person line for the directory card. */
  story: string;
  garden: boolean;
};

const EL = (place: string) => `east-lothian/${place}`;
const ED = (place: string) => `edinburgh/${place}`;

// The first twelve are the original supporting cast from DEMO-VIDEO.md. Their
// ORDER IS LOAD-BEARING: the seed numbers them QS-9101..QS-9112, and the video's
// Match Report scene counts on exactly these twelve for Graham's North Berwick
// home. Append new buyers at the end; never reorder or remove these.
export const DEMO_SEEKERS: DemoSeeker[] = [
  { areas: [EL("north-berwick"), EL("gullane")], min: 450000, max: 600000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Family of five heading for the coast", story: "Three kids, one dog, and a long-held promise of living by the sea.", garden: true },
  { areas: [EL("north-berwick")], min: 400000, max: 550000, beds: 3, types: ["detached", "semi-detached"], position: "mortgage-sold", headline: "Already sold, ready to move by spring", story: "Our flat has sold and the mortgage is agreed. We just need the right house.", garden: true },
  { areas: [EL("north-berwick"), EL("aberlady")], min: 500000, max: 700000, beds: 4, types: ["detached", "cottage"], position: "cash-after-sale", headline: "Downsizing from the farm, not too far", story: "Handing the farm to the next generation and staying close enough to visit.", garden: true },
  { areas: [EL("gullane"), EL("north-berwick"), EL("longniddry")], min: 420000, max: 575000, beds: 3, types: [], position: "mortgage-to-sell", headline: "Two teachers after a garden and a view", story: "Open to any kind of house, as long as there is somewhere to sit outside.", garden: true },
  { areas: [EL("north-berwick")], min: 480000, max: 650000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Returning to Scotland after twenty years away", story: "Coming home, with no chain and a very clear idea of where.", garden: true },
  { areas: [EL("dunbar"), EL("north-berwick")], min: 380000, max: 520000, beds: 3, types: ["detached", "bungalow"], position: "mortgage-sold", headline: "Room for the dog, and the dog's friends", story: "A big garden matters more to us than a big kitchen.", garden: true },
  { areas: [EL("north-berwick"), EL("gullane")], min: 550000, max: 800000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Golfers who never want to drive to the course", story: "Walking distance to a first tee is the whole brief, honestly.", garden: true },
  { areas: [EL("aberlady"), EL("gullane")], min: 400000, max: 600000, beds: 3, types: ["detached", "cottage"], position: "first-time-buyer", headline: "Working from home, want to hear the sea", story: "Both remote now. A spare room for an office and a view would be perfect.", garden: false },
  { areas: [EL("north-berwick")], min: 350000, max: 480000, beds: 3, types: ["semi-detached", "terraced"], position: "mortgage-to-sell", headline: "Near the school, near the high street", story: "Two primary-age kids and a strong preference for walking everywhere.", garden: false },
  { areas: [EL("haddington"), EL("east-linton")], min: 300000, max: 420000, beds: 3, types: ["cottage", "terraced"], position: "mortgage-to-sell", headline: "Market-town life with a proper butcher", story: "Character over square footage. Somewhere with a real high street.", garden: false },
  { areas: [EL("musselburgh"), EL("prestonpans")], min: 220000, max: 320000, beds: 2, types: ["flat", "terraced"], position: "first-time-buyer", headline: "First home, close to the train", story: "Deposit saved, mortgage agreed in principle, commuting into town.", garden: false },
  { areas: [EL("dunbar")], min: 260000, max: 360000, beds: 3, types: ["semi-detached"], position: "mortgage-sold", headline: "Swapping the city flat for a back garden", story: "Our Edinburgh flat has sold. We want a garden and a slower pace.", garden: true },

  // Edinburgh buyers — appended so the region filter on /seekers has something
  // on both sides. They look nowhere in East Lothian, so they do not change
  // the North Berwick Match Report count the video relies on.
  { areas: [ED("portobello"), ED("leith")], min: 350000, max: 460000, beds: 3, types: ["terraced", "flat"], position: "mortgage-sold", headline: "Sea air without leaving the city", story: "We want the beach and the tram, and we are not willing to choose.", garden: false },
  { areas: [ED("morningside"), ED("bruntsfield")], min: 320000, max: 420000, beds: 2, types: ["flat"], position: "first-time-buyer", headline: "First flat near the Meadows", story: "A main-door or top-floor flat, walking distance to both our work.", garden: false },
  { areas: [ED("stockbridge")], min: 450000, max: 620000, beds: 3, types: ["flat", "terraced"], position: "cash-after-sale", headline: "Colony house, if one ever comes up", story: "Patient buyers. We know exactly which streets, and we will wait.", garden: false },
  { areas: [ED("leith"), ED("portobello")], min: 240000, max: 330000, beds: 2, types: ["flat"], position: "first-time-buyer", headline: "Two nurses, one short commute", story: "Shift work means the journey to the hospital matters more than anything.", garden: false },
];

export type DemoHome = {
  /** Seller account key; seller01, seller02 … become @example.com emails. */
  seller: string;
  sellerName: string;
  headline: string;
  areaId: string;
  addressLine: string;
  price: number;
  beds: number;
  baths: number;
  type: "detached" | "semi-detached" | "terraced" | "bungalow" | "flat" | "cottage" | "townhouse";
  garden: boolean;
  features: string[];
  description: string;
};

// Additional live homes. Graham's home is NOT in this list — he is a named
// actor in the demo video and is seeded separately with his viewing slots.
// Each of these is priced and located so that at least one DEMO_SEEKER
// genuinely matches it, so a signed-in buyer sees real Match % scores.
export const DEMO_HOMES: DemoHome[] = [
  {
    seller: "seller01",
    sellerName: "Demo seller 1",
    headline: "Golfers' house, a short walk to the first tee",
    areaId: EL("gullane"),
    addressLine: "2 Demonstration Road, Gullane",
    price: 625000,
    beds: 4,
    baths: 3,
    type: "detached",
    garden: true,
    features: ["parking", "garage", "ensuite"],
    description: "A detached four-bedroom home on a quiet road, close to the links. Demonstration listing.",
  },
  {
    seller: "seller02",
    sellerName: "Demo seller 2",
    headline: "Stone cottage beside the nature reserve",
    areaId: EL("aberlady"),
    addressLine: "3 Demonstration Lane, Aberlady",
    price: 468000,
    beds: 3,
    baths: 2,
    type: "cottage",
    garden: true,
    features: ["period-features", "home-office"],
    description: "A restored stone cottage with a walled garden and a study. Demonstration listing.",
  },
  {
    seller: "seller03",
    sellerName: "Demo seller 3",
    headline: "Family semi with a proper back garden",
    areaId: EL("dunbar"),
    addressLine: "4 Demonstration Terrace, Dunbar",
    price: 318000,
    beds: 3,
    baths: 1,
    type: "semi-detached",
    garden: true,
    features: ["parking"],
    description: "A bright semi-detached house with a long, south-facing garden. Demonstration listing.",
  },
  {
    seller: "seller04",
    sellerName: "Demo seller 4",
    headline: "Townhouse two minutes from the market square",
    areaId: EL("haddington"),
    addressLine: "5 Demonstration Wynd, Haddington",
    price: 362000,
    beds: 3,
    baths: 2,
    type: "terraced",
    garden: false,
    features: ["period-features"],
    description: "A Georgian terraced townhouse in the centre of town. Demonstration listing.",
  },
  {
    seller: "seller05",
    sellerName: "Demo seller 5",
    headline: "Bright flat a short walk from the station",
    areaId: EL("musselburgh"),
    addressLine: "6 Demonstration Court, Musselburgh",
    price: 248000,
    beds: 2,
    baths: 1,
    type: "flat",
    garden: false,
    features: ["parking"],
    description: "A second-floor flat with two double bedrooms, close to the train. Demonstration listing.",
  },
  {
    seller: "seller06",
    sellerName: "Demo seller 6",
    headline: "Terraced house one street back from the prom",
    areaId: ED("portobello"),
    addressLine: "7 Demonstration Street, Portobello",
    price: 435000,
    beds: 3,
    baths: 2,
    type: "terraced",
    garden: false,
    features: ["sea-views", "period-features"],
    description: "A terraced house a minute from the beach, with sea glimpses from the top floor. Demonstration listing.",
  },
  {
    seller: "seller07",
    sellerName: "Demo seller 7",
    headline: "Main-door flat near the Meadows",
    areaId: ED("bruntsfield"),
    addressLine: "8 Demonstration Place, Bruntsfield",
    price: 372000,
    beds: 2,
    baths: 1,
    type: "flat",
    garden: false,
    features: ["period-features"],
    description: "A main-door flat with high ceilings and original cornicing. Demonstration listing.",
  },
];
