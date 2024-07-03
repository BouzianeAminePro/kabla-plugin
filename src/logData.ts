import { ROUTE_REGEX } from './consts';
import { ActionType } from './types';

export function transformToLogData(
  { pageName, timeSpentOnPage }: { pageName: string; timeSpentOnPage: number },
  city: string,
  country: string,
  visitorId: string,
  actionType: ActionType,
  createdAt: Date,
  siteId?: string
) {
  return {
    actionData: JSON.stringify({
      pageName: pageName.match(ROUTE_REGEX)?.shift()?.replace('/', '') || '/',
      timeSpentOnPage,
      city,
      country,
    }),
    visitorId,
    actionTypeId: actionType,
    createdAt,
    siteId,
  };
}
