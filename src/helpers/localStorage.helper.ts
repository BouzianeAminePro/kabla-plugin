export function get(key: string) {
  try {
    const value = localStorage.getItem(key);
    if (null === value) {
      return null;
    }

    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

export function set(key: string, value: any) {
  return localStorage.setItem(key, JSON.stringify(value));
}

export function remove(key: string) {
  return localStorage.removeItem(key);
}

export function update(key: string, value: any) {
  let data = get(key);
  if (null === data) {
    data = [];
  }

  return set(key, [...data, value]);
}
