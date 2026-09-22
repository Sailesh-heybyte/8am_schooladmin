export const isPermissionDenied = (error) =>
  Boolean(error) && error.status === 403;
