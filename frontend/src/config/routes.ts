export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:id',
  CREATE_EVENT: '/events/new',
  EDIT_EVENT: '/events/:id/edit',
  ATTENDEES: '/events/:id/attendees',
} as const;

export type RouteKeys = keyof typeof ROUTES;
export type RoutePaths = typeof ROUTES[RouteKeys];