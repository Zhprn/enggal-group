const WILAYAH_API_BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export type Province = {
  id: string;
  name: string;
};

export type Regency = {
  id: string;
  province_id: string;
  name: string;
};

async function fetchWilayah<T>(path: string): Promise<T> {
  const primaryUrl = `${WILAYAH_API_BASE_URL}/${path}`;

  try {
    const response = await fetch(primaryUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(primaryUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Proxy HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (fallbackError) {
      console.error(`Gagal memuat data dari ${path}:`, fallbackError);
      return [] as unknown as T;
    }
  }
}

export function fetchProvinces(): Promise<Province[]> {
  return fetchWilayah<Province[]>('provinces.json');
}

export function fetchRegenciesByProvince(provinceId: string): Promise<Regency[]> {
  if (!provinceId) return Promise.resolve([]);
  return fetchWilayah<Regency[]>(`regencies/${provinceId}.json`);
}