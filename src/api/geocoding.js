const toUiPlace = (feature) => {
  const { properties, geometry } = feature;
  const area = properties.city || properties.county || properties.district;
  const parts = [properties.name, properties.street, area, properties.state];
  return {
    id: `${properties.osm_type}${properties.osm_id}`,
    label: [...new Set(parts.filter(Boolean))].join(", "),
    lat: geometry.coordinates[1],
    lng: geometry.coordinates[0],
  };
};

export const searchPlaces = async (query, near, signal) => {
  const params = new URLSearchParams({
    q: query,
    limit: "6",
    lang: "en",
    lat: String(near[0]),
    lon: String(near[1]),
    bbox: "68.1,6.5,97.4,35.7",
  });
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error("Place search failed. Please try again.");
  }
  const data = await response.json();
  return data.features.map(toUiPlace);
};
