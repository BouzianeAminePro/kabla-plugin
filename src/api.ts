import { BACK_END_URL, KABLA_UID_COOKIE, STORAGE_DATA_KEY_NAME } from './consts';
import { getCookie, remove } from './helpers';
import { transformToLogData } from './logData';
import { ActionType, APIConfiguration, Configuration } from './types';

export async function sendInformation(config: Configuration, data: any, actionType: ActionType) {
    const { bulkData, apiConfig } = config;
    if (!data?.length) return;

    const visitorId = getCookie(KABLA_UID_COOKIE) || '';

    const { country, city } = (await getUserInformation(apiConfig)) || {};

    const body = bulkData ?? true
        ? {
            records: data.map(({ pageName, timeSpentOnPage, createdAt }: { pageName: string; timeSpentOnPage: number; createdAt: Date }) =>
                transformToLogData({ pageName, timeSpentOnPage },
                    city,
                    country,
                    visitorId,
                    actionType,
                    createdAt,
                    apiConfig?.siteId))
        }
        : transformToLogData(data, city, country, visitorId, actionType, data?.createdAt, apiConfig?.siteId);

    return fetch(apiConfig?.url ?? `${BACK_END_URL}/api`, {
        body: JSON.stringify({ data: JSON.stringify(body), isBulk: bulkData ?? true }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: apiConfig?.authorizationToken ?? apiConfig?.apiKey ?? '',
            userId: visitorId,
        },
    })
        .then((response) => response.json())
        .then(() => remove(STORAGE_DATA_KEY_NAME))
        .catch(console.error);
}

export async function getUserInformation(apiConfig?: APIConfiguration) {
    try {
        const response = await fetch(`${BACK_END_URL}/api/source`, {
            headers: {
                Authorization: apiConfig?.apiKey ?? '',
            },
        });
        return response.json();
    } catch (error) {
        console.error(error);
    }
}
