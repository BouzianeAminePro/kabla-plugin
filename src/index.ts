import { get, getCookie, remove, setCookie, update } from './helpers';
import { APIConfiguration, Configuration } from './types';

const STORAGE_DATA_KEY_NAME = 'kablaData';
const KABLA_UID_COOKIE = 'kablaUID';
const MAX_COOKIE_DATE = 'January 1, 2038 01:15:00';
const BACK_END_URL = 'https://kabla-app.vercel.app';
const ROUTE_REGEX = /\/\w*$/g;

let timeSpentOnPage = 0;
let fetchs: Array<Promise<Response | void>> = [];

export function kabla(configuration: Configuration) {
  if (configuration?.disable || typeof window === 'undefined') {
    return;
  }

  const uid = getCookie(KABLA_UID_COOKIE);
  if (!uid) {
    import('uuidv4').then(async ({ uuid }) => {
      const visitorUID = uuid();
      setCookie(KABLA_UID_COOKIE, visitorUID, new Date(MAX_COOKIE_DATE));
      // TODO: add 1 to new visitors so we can have metric such as how many visitors
      fetchs = [
        fetch(`${BACK_END_URL}/api/visitor`, {
          method: 'POST',
          body: JSON.stringify({
            id: visitorUID,
            siteId: configuration?.apiConfig?.siteId,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: configuration?.apiConfig?.apiKey ?? '',
          },
        }),
        ...fetchs,
      ];
    });
  }

  let oldPathName = document.location.pathname;
  if (configuration.bulkData || undefined === configuration.bulkData) {
    document.onvisibilitychange = async () => {
      if (document.visibilityState !== 'hidden') return;

      const data = get(STORAGE_DATA_KEY_NAME);
      if (!data?.length) return;

      fetchs.push(sendInformation(configuration, data, ActionType.Visit));

      return await Promise.all(fetchs);
    };
  }

  triggerListeners(oldPathName, configuration);

  const observer = new MutationObserver(() => {
    if (oldPathName !== document.location.pathname) {
      oldPathName = document.location.pathname;
      triggerListeners(oldPathName, configuration);
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

function triggerListeners(pathname: string, { blackList = [], ctaList = [], ...params }: Partial<Configuration>) {
  if (!blackList?.includes(document.location.pathname)) {
    handleSpentTime(pathname, params);
    handleCtaListeners(ctaList);
  }
}

async function sendInformation({ bulkData, apiConfig }: Configuration, data: any, actionType: ActionType) {
  if (!data || !data?.length) {
    return;
  }

  const visitorId = String(getCookie(KABLA_UID_COOKIE));

  const { country, city } = (await getUserInformation(apiConfig)) ?? {};

  const isBulk = bulkData || undefined === bulkData;
  const body = isBulk
    ? {
        records: data.map(
          ({ pageName, timeSpentOnPage, createdAt }: { pageName: string; timeSpentOnPage: number; createdAt: Date }) =>
            transformToLogData(
              { pageName, timeSpentOnPage },
              city,
              country,
              visitorId,
              actionType,
              createdAt,
              apiConfig?.siteId,
            ),
        ),
      }
    : transformToLogData(data, city, country, visitorId, actionType, data?.createdAt, apiConfig?.siteId);

  const stringifiedBody = JSON.stringify(body);

  return await fetch(apiConfig?.url ?? `${BACK_END_URL}/api`, {
    body: JSON.stringify({ data: stringifiedBody, isBulk }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiConfig?.authorizationToken ?? apiConfig?.apiKey ?? '',
      userId: getCookie(KABLA_UID_COOKIE) ?? '',
    },
  })
    .then((response) => response.json())
    .then(() => remove(STORAGE_DATA_KEY_NAME))
    .catch(console.error);
}

function handleSpentTime(oldPathName: string, params: Configuration) {
  const intervalTimeSpentOnPage = 100;
  const timeInterval = setInterval(async () => {
    if (oldPathName === document.location.pathname) {
      timeSpentOnPage += intervalTimeSpentOnPage;
    } else {
      clearInterval(timeInterval);
      if (!timeSpentOnPage) return;
      if (params.bulkData || undefined === params.bulkData) {
        update(STORAGE_DATA_KEY_NAME, {
          pageName: oldPathName,
          timeSpentOnPage,
          createdAt: new Date(),
        });
      } else {
        fetchs.push(
          sendInformation(
            params,
            {
              pageName: oldPathName,
              timeSpentOnPage,
              createdAt: new Date(),
            },
            ActionType.Visit,
          ),
        );
      }

      timeSpentOnPage = 0;
    }
  }, intervalTimeSpentOnPage);
}

function handleCtaListeners(ctaList: Array<string> = []) {
  if (!ctaList || !ctaList.length) return;
  document.querySelectorAll(ctaList.map((cta: string) => `#${cta}`).join(', ')).forEach((ctaElement) =>
    ctaElement.addEventListener('click', (event: Event) => {
      console.log((event?.target as HTMLElement)?.id);
    }),
  );
}

function getUserInformation(apiConfig?: APIConfiguration) {
  return fetch(`${BACK_END_URL}/api/source`, {
    headers: {
      Authorization: apiConfig?.apiKey ?? '',
    },
  })
    .then((response) => response.json())
    .then((data) => data)
    .catch(console.error);
}

export function useKabla(configuration: Configuration) {
  return kabla(configuration);
}

function transformToLogData(
  data: { pageName: string; timeSpentOnPage: number },
  city: string,
  country: string,
  visitorId: string,
  actionType: ActionType,
  createdAt: Date,
  siteId?: number,
) {
  return {
    actionData: JSON.stringify({
      pageName: data?.pageName?.match(ROUTE_REGEX)?.shift()?.replace('/', '') || '/',
      timeSpentOnPage: data?.timeSpentOnPage,
      city,
      country,
    }),
    visitorId,
    actionTypeId: actionType,
    createdAt,
    siteId,
  };
}

enum ActionType {
  Visit = 1,
}
