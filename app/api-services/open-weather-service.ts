import { redis } from '../data-access/redis-connection';

const API_KEY = process.env.WEATHER_API_KEY;
const baseURL = 'https://api.openweathermap.org/data/2.5/weather';
const TEN_MINUTES = 1000 * 60 * 10; // in milliseconds

interface FetchWeatherDataParams {
  lat: number;
  lon: number;
  units: string;
}

export async function fetchWeatherData({
  lat,
  lon,
  units,
}: FetchWeatherDataParams) {
  
  const queryString = `lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;

  // Check cache in Redis
  const cacheEntry = await redis.get(queryString);
  if (cacheEntry) {
    return JSON.parse(cacheEntry);
  }

  // Fetch data from OpenWeather API if not in cache
  const response = await fetch(`${baseURL}?${queryString}&appid=${API_KEY}`)
  const data = await response.text() // avoid an unnecessary extra JSON.stringify
  await redis.set(queryString, data, {PX: TEN_MINUTES}) // The PX option sets the expiry time
  return JSON.parse(data)
}



export async function getGeoCoordsForPostalCode(
  postalCode: string,
  countryCode: string,
) {
  const url = `http://api.openweathermap.org/geo/1.0/zip?zip=${postalCode},${countryCode}&appid=${API_KEY}`;

  const queryString = `zip=${postalCode},${countryCode}`;

  // Check cache in Redis
  const cacheEntry = await redis.get(queryString);
  if (cacheEntry) {
    return JSON.parse(cacheEntry);
  }

  // Fetch data from OpenWeather API if not in cache
  const response = await fetch(url);
  const data = await response.json();

  // Store data in Redis with expiration time
  await redis.set(queryString, JSON.stringify(data), {
    PX: TEN_MINUTES, // Expiry time in milliseconds
  });

  return data;
}