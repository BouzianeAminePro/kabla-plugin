import { get, remove, update } from './helpers';
import { APIConfiguration, Configuration } from './types';

let timeSpentOnPage = 0;

const STORAGE_DATA_KEY_NAME = 'kablaData';
const BACK_END_URL = 'http://localhost:3000';

export function kabla(configuration: Configuration) {
  if (configuration?.disable) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  let oldPathName = document.location.pathname;
  if (configuration.bulkData || undefined === configuration.bulkData) {
    document.onvisibilitychange = () => {
      if (document.visibilityState === 'hidden') {
        const data = get(STORAGE_DATA_KEY_NAME);
        if (!data || !data?.length) {
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

  const routeRegex = /\/\w*$/g;

  return await getCity(apiConfig)
    // .then(({country, city}) => {
    .then(({ country, city }) => {
      // my database check first for client id use ouath 2
      const isBulk = bulkData || undefined === bulkData;
      const body = isBulk
        ? {
            records: data.map(({ pageName, timeSpentOnPage }: { pageName: string; timeSpentOnPage: number }) => ({
              pageName: pageName.match(routeRegex)?.shift()?.replace('/', '') || '/',
              timeSpentOnPage,
              city,
              country,
              domainName,
            })),
          }
        : {
            pageName: data.pageName.match(routeRegex)?.shift()?.replace('/', '') || '/',
            timeSpentOnPage: data.timeSpentOnPage,
            city,
            country,
            domainName,
          };

      fetch(apiConfig?.url ?? `${BACK_END_URL}/api/${isBulk ? 'sites' : 'site'}`, {
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
    ctaElement.addEventListener('click', (event: any) => {
      console.log(event.target.id);
    }),
  );
}

function getCity(apiConfig?: APIConfiguration) {
  return fetch('https://api.ipify.org/?format=json')
    .then((response) => response.json())
    .then(({ ip }) =>
      fetch(`${BACK_END_URL}/api/source`, {
        headers: {
          Authorization: apiConfig?.apiKey ?? '',
          'x-real-ip': ip,
        },
      })
        .then((response) => response.json())
        .then((data) => data)
        .catch(console.error),
    )
    .catch(console.error);
}

export function useKabla(params: Configuration) {
  return kabla(params);
}
