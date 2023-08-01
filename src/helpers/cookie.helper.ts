export function getCookie(name: string) {
  const cookies = document.cookie.split('; ');
  try {
    const value = cookies?.find((key: string) => key.includes(name))?.split('=')?.[1];
    if (undefined === value) {
      return null;
    }

    return decodeURIComponent(value);
  } catch (e) {
    return null;
  }
}

export function setCookie(name: string, value: string, expires?: Date | number) {
  const cookies = document.cookie.split('; ');
  try {
    const cookie = cookies?.find((key: string) => key === name);
    let expiresIn;
    if (undefined === cookie) {
      if (expires) {
        switch (typeof expires) {
          case 'object':
            expiresIn = (expires as Date).toUTCString();
            break;
          case 'number':
            const date = new Date();
            date.setDate(date.getDate() + expires);
            expiresIn = date.toUTCString();
            break;
        }
      }
    }

    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresIn}`;
  } catch (e) {
    return null;
  }
}

export function removeCookie(name: string) {
  const cookies = document.cookie.split('; ');
  try {
    const cookie = cookies?.find((key: string) => key === name);
    if (cookie) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } else {
      console.warn(`This cookie ${name} doesn't exists !`);
    }
  } catch (e) {
    return null;
  }
}
