export const getRoadPath = async (points) => {
  const coordinates = points.map(([lng, lat]) => `${lng},${lat}`).join(";");

  const saved = sessionStorage.getItem(`road-path:${coordinates}`);
  if (saved) return JSON.parse(saved);

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
  );
  if (!response.ok) {
    throw new Error("Couldn't load the road path for this route.");
  }
  const data = await response.json();
  const path = data.routes[0].geometry.coordinates;

  sessionStorage.setItem(`road-path:${coordinates}`, JSON.stringify(path));
  return path;
};
