import { get, getCookie, remove, setCookie, update } from './helpers';
import { APIConfiguration, Configuration } from './types';

let timeSpentOnPage = 0;

const STORAGE_DATA_KEY_NAME = 'kablaData';
const KABLA_UID_COOKIE = 'kablaUID';
const BACK_END_URL = 'https://kabla-app.vercel.app';
const routeRegex = /\/\w*$/g;

export function kabla(configuration: Configuration) {
  if (configuration?.disable) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const uid = getCookie(KABLA_UID_COOKIE);
  if (!uid) {
    // new user
    import('uuidv4').then(({ uuid }) => {
      setCookie(KABLA_UID_COOKIE, uuid(), 90);
    });
  }

  let oldPathName = document.location.pathname;
  if (configuration.bulkData || undefined === configuration.bulkData) {
    document.onvisibilitychange = () => {
      if (document.visibilityState === 'hidden') {
        const data = get(STORAGE_DATA_KEY_NAME);
        if (!data?.length) {
          return;
        }

        sendInformation(configuration, data);
      }
    };
  }

  // self launch listeners in the begining
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

async function sendInformation({ domainName, bulkData, apiConfig }: Configuration, data: any) {
  if (!domainName || !data || !data?.length) {
    return;
  }

  return await getUserInformation(apiConfig)
    .then(async ({ country, city }) => {
      const isBulk = bulkData || undefined === bulkData;
      const body = isBulk
        ? {
            records: data.map(({ pageName, timeSpentOnPage }: { pageName: string; timeSpentOnPage: number }) =>
              transformToSiteData({ pageName, timeSpentOnPage }, city, country, domainName),
            ),
          }
        : transformToSiteData(data, city, country, domainName);

      return await fetch(apiConfig?.url ?? `${BACK_END_URL}/api/${isBulk ? 'sites' : 'site'}`, {
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiConfig?.authorizationToken ?? apiConfig?.apiKey ?? '',
        },
      })
        .then((response) => response.json())
        .then(() => remove(STORAGE_DATA_KEY_NAME))
        .catch(console.error);
    })
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
        });
      } else {
        await sendInformation(params, {
          pageName: oldPathName,
          timeSpentOnPage,
        });
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

function transformToSiteData(
  data: { pageName: string; timeSpentOnPage: number },
  city: string,
  country: string,
  domainName: string,
) {
  return {
    pageName: data?.pageName?.match(routeRegex)?.shift()?.replace('/', '') || '/',
    timeSpentOnPage: data?.timeSpentOnPage,
    city,
    country,
    domainName,
  };
}
