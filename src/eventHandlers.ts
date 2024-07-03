import { update } from './helpers';
import { ActionType, Configuration } from './types';
import { sendInformation } from './api';
import { STORAGE_DATA_KEY_NAME } from './consts';

let timeSpentOnPage = 0;
let fetchPromises: Array<Promise<Response | void>> = [];

export function handleSpentTime(oldPathName: string, params: Configuration) {
  const intervalTimeSpentOnPage = 100;
  const timeInterval = setInterval(() => {
    if (oldPathName === document.location.pathname) {
      timeSpentOnPage += intervalTimeSpentOnPage;
    } else {
      clearInterval(timeInterval);
      if (!timeSpentOnPage) return;

      const logData = { pageName: oldPathName, timeSpentOnPage, createdAt: new Date() };
      if (params.bulkData ?? true) {
        update(STORAGE_DATA_KEY_NAME, logData);
      } else {
        fetchPromises.push(sendInformation(params, logData, ActionType.Visit));
      }

      timeSpentOnPage = 0;
    }
  }, intervalTimeSpentOnPage);
}

export function handleCtaListeners(ctaList: string[] = []) {
  if (!ctaList.length) return;
  document.querySelectorAll(ctaList.map(cta => `#${cta}`).join(',')).forEach((ctaElement) =>
    ctaElement.addEventListener('click', (event) => {
      console.log((event?.target as HTMLElement)?.id);
    })
  );
}
