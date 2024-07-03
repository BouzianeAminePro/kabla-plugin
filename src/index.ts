import { get, getCookie, setCookie } from './helpers';
import { handleSpentTime, handleCtaListeners } from './eventHandlers';
import { sendInformation } from './api';
import { Configuration, ActionType } from './types';
import { STORAGE_DATA_KEY_NAME, KABLA_UID_COOKIE, MAX_COOKIE_DATE, BACK_END_URL } from './consts';

let fetchPromises: Array<Promise<Response | void>> = [];

export function kabla(configuration: Configuration) {
  if (configuration?.disable || typeof window === 'undefined') {
    return;
  }

  const uid = getCookie(KABLA_UID_COOKIE);
  if (!uid) {
    import('uuidv4').then(async ({ uuid }) => {
      const visitorUID = uuid();
      setCookie(KABLA_UID_COOKIE, visitorUID, MAX_COOKIE_DATE);

      fetchPromises.push(
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
      );
    });
  }

  let oldPathName = document.location.pathname;
  if (configuration.bulkData ?? true) {
    document.onvisibilitychange = async () => {
      if (document.visibilityState !== 'hidden') return;

      const data = get(STORAGE_DATA_KEY_NAME);
      if (!data?.length) return;

      fetchPromises.push(sendInformation(configuration, data, ActionType.Visit));

      await Promise.all(fetchPromises);
    };
  }

  triggerListeners(oldPathName, configuration);

  const observer = new MutationObserver(() => {
    if (oldPathName !== document.location.pathname) {
      oldPathName = document.location.pathname;
      triggerListeners(oldPathName, configuration);
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

function triggerListeners(pathname: string, { blackList = [], ctaList = [], ...params }: Partial<Configuration>) {
  if (!blackList.includes(document.location.pathname)) {
    handleSpentTime(pathname, params);
    handleCtaListeners(ctaList);
  }
}

export function useKabla(configuration: Configuration) {
  return kabla(configuration);
}
