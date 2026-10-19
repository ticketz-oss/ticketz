import axios from "axios";
import NodeCache from "node-cache";
import AppError from "../../errors/AppError";

const cache = new NodeCache({ stdTTL: 60 * 60 * 24, useClones: false });
const client = axios.create({
  baseURL: "https://countriesnow.space/api/v0.1/countries",
  timeout: 5000
});

export interface CountryOption {
  code: string;
  name: string;
}

export interface StateOption {
  code: string;
  name: string;
}

const cached = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  const value = cache.get<T>(key);
  if (value) return value;
  try {
    const loaded = await loader();
    cache.set(key, loaded);
    return loaded;
  } catch {
    throw new AppError("ERR_PROSPECCAO_LOCALIDADES_INDISPONIVEIS", 502);
  }
};

export const listCountries = (): Promise<CountryOption[]> =>
  cached("countries", async () => {
    const { data } = await client.get("/iso");
    return (data?.data || [])
      .map((country: { Iso2: string; name: string }) => ({
        code: country.Iso2,
        name: country.name
      }))
      .sort((a: CountryOption, b: CountryOption) =>
        a.name.localeCompare(b.name)
      );
  });

export const resolveCountry = async (code: string): Promise<CountryOption> => {
  const country = (await listCountries()).find(
    item => item.code.toUpperCase() === String(code || "").toUpperCase()
  );
  if (!country) throw new AppError("ERR_PROSPECCAO_PAIS_INVALIDO", 400);
  return country;
};

export const listStates = async (
  countryCode: string
): Promise<StateOption[]> => {
  const country = await resolveCountry(countryCode);
  return cached(`states:${country.code}`, async () => {
    const { data } = await client.get("/states/q", {
      params: { country: country.name }
    });
    return (data?.data?.states || []).map(
      (state: { state_code: string; name: string }) => ({
        code: state.state_code,
        name: state.name
      })
    );
  });
};

export const resolveState = async (
  countryCode: string,
  stateCode?: string
): Promise<StateOption | null> => {
  if (!stateCode) return null;
  const state = (await listStates(countryCode)).find(
    item => item.code.toUpperCase() === stateCode.toUpperCase()
  );
  if (!state) throw new AppError("ERR_PROSPECCAO_ESTADO_INVALIDO", 400);
  return state;
};

export const listCities = async (
  countryCode: string,
  stateCode?: string
): Promise<string[]> => {
  const country = await resolveCountry(countryCode);
  const state = await resolveState(countryCode, stateCode);
  const key = `cities:${country.code}:${state?.code || "all"}`;
  return cached(key, async () => {
    const path = state ? "/state/cities/q" : "/cities/q";
    const { data } = await client.get(path, {
      params: { country: country.name, state: state?.name }
    });
    return (data?.data || []).sort((a: string, b: string) =>
      a.localeCompare(b)
    );
  });
};

export const resolveLocation = async ({
  countryCode,
  stateCode,
  cityName
}: {
  countryCode: string;
  stateCode?: string;
  cityName?: string;
}) => {
  const country = await resolveCountry(countryCode);
  const state = await resolveState(countryCode, stateCode);
  const requestedCity = String(cityName || "").trim();
  let city: string | null = null;
  if (requestedCity) {
    const cities = await listCities(countryCode, stateCode);
    city =
      cities.find(item => item.toLowerCase() === requestedCity.toLowerCase()) ||
      null;
    if (!city) throw new AppError("ERR_PROSPECCAO_CIDADE_INVALIDA", 400);
  }
  return {
    country,
    state,
    city,
    query: [city, state?.name, country.name].filter(Boolean).join(", ")
  };
};
