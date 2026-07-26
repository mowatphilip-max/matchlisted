// Scotland-wide area model: regions → council areas → places.
// A Quiet Seeker's brief stores area ids (`council/place-slug`); a Hush Home
// sits in exactly one area id. Matching scores exact place > same council >
// same region (see lib/match.ts). Place lists are curated and easily extended.

export interface Council {
  id: string;
  name: string;
  lat: number;
  lng: number;
  places: string[];
}

export interface Region {
  id: string;
  name: string;
  councils: Council[];
}

export const REGIONS: Region[] = [
  {
    id: "edinburgh-lothians",
    name: "Edinburgh & the Lothians",
    councils: [
      {
        id: "edinburgh",
        name: "City of Edinburgh",
        lat: 55.9533,
        lng: -3.1883,
        places: [
          "City Centre",
          "New Town",
          "Stockbridge",
          "Bruntsfield",
          "Morningside",
          "Marchmont",
          "Leith",
          "Portobello",
          "Corstorphine",
          "Colinton",
          "South Queensferry",
        ],
      },
      {
        id: "east-lothian",
        name: "East Lothian",
        lat: 55.95,
        lng: -2.77,
        places: [
          "Musselburgh",
          "Haddington",
          "North Berwick",
          "Dunbar",
          "Gullane",
          "Gifford",
          "Aberlady",
          "Longniddry",
          "Prestonpans",
          "Tranent",
          "East Linton",
        ],
      },
      {
        id: "midlothian",
        name: "Midlothian",
        lat: 55.83,
        lng: -3.06,
        places: ["Dalkeith", "Penicuik", "Bonnyrigg", "Roslin", "Gorebridge"],
      },
      {
        id: "west-lothian",
        name: "West Lothian",
        lat: 55.9,
        lng: -3.55,
        places: ["Linlithgow", "Livingston", "Bathgate", "Broxburn", "Whitburn"],
      },
    ],
  },
  {
    id: "glasgow-clyde",
    name: "Glasgow & the Clyde",
    councils: [
      {
        id: "glasgow",
        name: "Glasgow City",
        lat: 55.8642,
        lng: -4.2518,
        places: [
          "City Centre",
          "West End",
          "Shawlands",
          "Southside",
          "Dennistoun",
          "Pollokshields",
          "Merchant City",
        ],
      },
      {
        id: "east-dunbartonshire",
        name: "East Dunbartonshire",
        lat: 55.94,
        lng: -4.22,
        places: ["Bearsden", "Milngavie", "Bishopbriggs", "Kirkintilloch"],
      },
      {
        id: "west-dunbartonshire",
        name: "West Dunbartonshire",
        lat: 55.96,
        lng: -4.57,
        places: ["Dumbarton", "Clydebank", "Balloch"],
      },
      {
        id: "east-renfrewshire",
        name: "East Renfrewshire",
        lat: 55.77,
        lng: -4.33,
        places: ["Newton Mearns", "Giffnock", "Clarkston", "Eaglesham"],
      },
      {
        id: "renfrewshire",
        name: "Renfrewshire",
        lat: 55.84,
        lng: -4.43,
        places: ["Paisley", "Bridge of Weir", "Houston", "Renfrew"],
      },
      {
        id: "inverclyde",
        name: "Inverclyde",
        lat: 55.93,
        lng: -4.78,
        places: ["Greenock", "Gourock", "Kilmacolm", "Wemyss Bay"],
      },
      {
        id: "north-lanarkshire",
        name: "North Lanarkshire",
        lat: 55.83,
        lng: -3.92,
        places: ["Motherwell", "Cumbernauld", "Airdrie", "Coatbridge"],
      },
      {
        id: "south-lanarkshire",
        name: "South Lanarkshire",
        lat: 55.67,
        lng: -3.87,
        places: [
          "Hamilton",
          "East Kilbride",
          "Lanark",
          "Strathaven",
          "Bothwell",
        ],
      },
    ],
  },
  {
    id: "ayrshire-arran",
    name: "Ayrshire & Arran",
    councils: [
      {
        id: "north-ayrshire",
        name: "North Ayrshire",
        lat: 55.71,
        lng: -4.77,
        places: [
          "Largs",
          "Irvine",
          "Kilwinning",
          "West Kilbride",
          "Ardrossan",
          "Millport",
          "Brodick",
        ],
      },
      {
        id: "east-ayrshire",
        name: "East Ayrshire",
        lat: 55.5,
        lng: -4.37,
        places: ["Kilmarnock", "Stewarton", "Galston"],
      },
      {
        id: "south-ayrshire",
        name: "South Ayrshire",
        lat: 55.28,
        lng: -4.65,
        places: ["Ayr", "Prestwick", "Troon", "Girvan", "Alloway"],
      },
    ],
  },
  {
    id: "stirling-central",
    name: "Stirling & Central",
    councils: [
      {
        id: "stirling",
        name: "Stirling",
        lat: 56.12,
        lng: -4.0,
        places: [
          "Stirling",
          "Bridge of Allan",
          "Dunblane",
          "Callander",
          "Aberfoyle",
        ],
      },
      {
        id: "falkirk",
        name: "Falkirk",
        lat: 56.0,
        lng: -3.78,
        places: ["Falkirk", "Grangemouth", "Larbert", "Bo'ness"],
      },
      {
        id: "clackmannanshire",
        name: "Clackmannanshire",
        lat: 56.11,
        lng: -3.75,
        places: ["Alloa", "Dollar", "Tillicoultry"],
      },
    ],
  },
  {
    id: "tayside-fife",
    name: "Tayside & Fife",
    councils: [
      {
        id: "fife",
        name: "Fife",
        lat: 56.25,
        lng: -3.15,
        places: [
          "St Andrews",
          "Dunfermline",
          "Kirkcaldy",
          "Cupar",
          "Anstruther",
          "Elie",
          "Falkland",
          "Dalgety Bay",
        ],
      },
      {
        id: "dundee",
        name: "Dundee City",
        lat: 56.462,
        lng: -2.9707,
        places: ["City Centre", "Broughty Ferry", "West End"],
      },
      {
        id: "angus",
        name: "Angus",
        lat: 56.7,
        lng: -2.92,
        places: ["Arbroath", "Montrose", "Forfar", "Carnoustie", "Kirriemuir"],
      },
      {
        id: "perth-kinross",
        name: "Perth & Kinross",
        lat: 56.4,
        lng: -3.43,
        places: [
          "Perth",
          "Dunkeld",
          "Pitlochry",
          "Crieff",
          "Blairgowrie",
          "Kinross",
          "Aberfeldy",
        ],
      },
    ],
  },
  {
    id: "north-east",
    name: "Aberdeen & the North East",
    councils: [
      {
        id: "aberdeen",
        name: "Aberdeen City",
        lat: 57.1497,
        lng: -2.0943,
        places: [
          "City Centre",
          "West End",
          "Cults",
          "Bridge of Don",
          "Ferryhill",
        ],
      },
      {
        id: "aberdeenshire",
        name: "Aberdeenshire",
        lat: 57.28,
        lng: -2.38,
        places: [
          "Stonehaven",
          "Inverurie",
          "Banchory",
          "Ellon",
          "Ballater",
          "Westhill",
          "Peterhead",
          "Fraserburgh",
        ],
      },
      {
        id: "moray",
        name: "Moray",
        lat: 57.53,
        lng: -3.25,
        places: ["Elgin", "Forres", "Buckie", "Fochabers"],
      },
    ],
  },
  {
    id: "highlands-islands",
    name: "Highlands & Islands",
    councils: [
      {
        id: "highland",
        name: "Highland",
        lat: 57.48,
        lng: -4.22,
        places: [
          "Inverness",
          "Nairn",
          "Aviemore",
          "Fort William",
          "Ullapool",
          "Dornoch",
          "Thurso",
          "Portree",
        ],
      },
      {
        id: "argyll-bute",
        name: "Argyll & Bute",
        lat: 56.25,
        lng: -5.25,
        places: [
          "Oban",
          "Helensburgh",
          "Dunoon",
          "Rothesay",
          "Campbeltown",
          "Inveraray",
        ],
      },
      {
        id: "western-isles",
        name: "Na h-Eileanan Siar",
        lat: 58.21,
        lng: -6.38,
        places: ["Stornoway", "Tarbert (Harris)"],
      },
      {
        id: "orkney",
        name: "Orkney Islands",
        lat: 58.98,
        lng: -2.96,
        places: ["Kirkwall", "Stromness"],
      },
      {
        id: "shetland",
        name: "Shetland Islands",
        lat: 60.15,
        lng: -1.15,
        places: ["Lerwick", "Scalloway"],
      },
    ],
  },
  {
    id: "south-scotland",
    name: "The Borders & South West",
    councils: [
      {
        id: "scottish-borders",
        name: "Scottish Borders",
        lat: 55.55,
        lng: -2.78,
        places: [
          "Peebles",
          "Melrose",
          "Kelso",
          "Galashiels",
          "Hawick",
          "Jedburgh",
          "Selkirk",
        ],
      },
      {
        id: "dumfries-galloway",
        name: "Dumfries & Galloway",
        lat: 55.07,
        lng: -3.6,
        places: [
          "Dumfries",
          "Castle Douglas",
          "Kirkcudbright",
          "Moffat",
          "Stranraer",
          "Gretna",
        ],
      },
    ],
  },
];

export function slugify(place: string): string {
  return place
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function areaId(councilId: string, place: string): string {
  return `${councilId}/${slugify(place)}`;
}

export interface AreaInfo {
  id: string;
  place: string;
  councilId: string;
  councilName: string;
  regionId: string;
  regionName: string;
  lat: number;
  lng: number;
}

const areaIndex = new Map<string, AreaInfo>();
for (const region of REGIONS) {
  for (const council of region.councils) {
    for (const place of council.places) {
      const id = areaId(council.id, place);
      areaIndex.set(id, {
        id,
        place,
        councilId: council.id,
        councilName: council.name,
        regionId: region.id,
        regionName: region.name,
        lat: council.lat,
        lng: council.lng,
      });
    }
  }
}

export const ALL_AREAS: AreaInfo[] = [...areaIndex.values()];

export function getArea(id: string): AreaInfo | undefined {
  return areaIndex.get(id);
}

/** "Largs, North Ayrshire" — the label used across the UI. */
export function areaLabel(id: string): string {
  const a = areaIndex.get(id);
  if (!a) return id;
  return `${a.place}, ${a.councilName}`;
}

/** Short label without the council, for tight card layouts. */
export function areaShortLabel(id: string): string {
  return areaIndex.get(id)?.place ?? id;
}

export function searchAreas(query: string, limit = 12): AreaInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: AreaInfo[] = [];
  const contains: AreaInfo[] = [];
  for (const a of areaIndex.values()) {
    const hay = `${a.place} ${a.councilName} ${a.regionName}`.toLowerCase();
    if (a.place.toLowerCase().startsWith(q)) starts.push(a);
    else if (hay.includes(q)) contains.push(a);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
