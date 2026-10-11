const toMetres = ([lng, lat], latitude) => [
  lng * 111320 * Math.cos((latitude * Math.PI) / 180),
  lat * 110540,
];

export const splitPath = (path, position) => {
  const latitude = position[1];
  const [px, py] = toMetres(position, latitude);
  let best = { distance: Infinity, index: 0, point: path[0] };

  for (let i = 0; i < path.length - 1; i += 1) {
    const [ax, ay] = toMetres(path[i], latitude);
    const [bx, by] = toMetres(path[i + 1], latitude);
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    const along =
      lengthSquared === 0
        ? 0
        : Math.min(
            Math.max(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared, 0),
            1,
          );
    const x = ax + (bx - ax) * along;
    const y = ay + (by - ay) * along;
    const distance = Math.hypot(px - x, py - y);

    if (distance < best.distance) {
      best = {
        distance,
        index: i,
        point: [
          path[i][0] + (path[i + 1][0] - path[i][0]) * along,
          path[i][1] + (path[i + 1][1] - path[i][1]) * along,
        ],
      };
    }
  }

  return {
    done: [...path.slice(0, best.index + 1), best.point],
    ahead: [best.point, ...path.slice(best.index + 1)],
    distanceMetres: best.distance,
  };
};
