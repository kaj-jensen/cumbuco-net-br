export const destinationGuide = {
  hub: {
    label: "Cumbuco guide",
    href: "/city/cumbuco/",
  },
  sections: [
    {
      topic: "where-to-stay",
      label: "Where to stay",
      href: "/city/cumbuco/where-to-stay/",
      description: "Understand Cumbuco's areas and choose the right base.",
    },
    {
      topic: "restaurants",
      label: "Restaurantes",
      href: "/city/cumbuco/restaurants/",
      description: "Beach restaurants, local cooking, cafés, pizza, and bars.",
    },
    {
      topic: "things-to-do",
      label: "Things to do",
      href: "/city/cumbuco/things-to-do/",
      description: "Lagoons, buggy tours, riding, surfing, and sunset experiences.",
    },
    {
      topic: "beaches",
      label: "Beaches & lagoons",
      href: "/city/cumbuco/beaches/",
      description: "The coast, freshwater lagoons, and places worth exploring.",
    },
    {
      topic: "kiteboarding",
      label: "Kiteboarding",
      href: "/city/cumbuco/kiteboarding/",
      description: "Wind seasons, kite spots, schools, equipment, and safety.",
    },
    {
      topic: "travel-planning",
      label: "Plan your trip",
      href: "/city/cumbuco/travel-information/",
      description: "Airport transfers, weather, currency, transport, and practical advice.",
    },
    {
      topic: "local-businesses",
      label: "Local directory",
      href: "/city/cumbuco/local-businesses/",
      description: "Checked direct links for dining, accommodation, kite schools, and local services.",
    },
  ],
} as const;

export const businessCategories = [
  { value: "restaurant", label: "Restaurantes", schemaType: "Restaurant" },
  { value: "cafe", label: "Cafés", schemaType: "CafeOrCoffeeShop" },
  { value: "bar", label: "Bars", schemaType: "BarOrPub" },
  { value: "hotel", label: "Hotels", schemaType: "Hotel" },
  { value: "pousada", label: "Pousadas", schemaType: "LodgingBusiness" },
  { value: "beach-club", label: "Beach clubs", schemaType: "LocalBusiness" },
  { value: "kite-school", label: "Kite schools", schemaType: "SportsActivityLocation" },
  { value: "shop", label: "Shops", schemaType: "Store" },
  { value: "activity", label: "Activities", schemaType: "TouristAttraction" },
  { value: "transport", label: "Transport", schemaType: "LocalBusiness" },
  { value: "service", label: "Local services", schemaType: "LocalBusiness" },
] as const;

export type DestinationGuideTopic = typeof destinationGuide.sections[number]["topic"];
export type BusinessCategory = typeof businessCategories[number]["value"];
