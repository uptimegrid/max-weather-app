import http from 'node:http'
import { URL } from 'node:url'

const port = Number(process.env.PORT || 8080)
const geocodingBaseUrl = process.env.GEOCODING_BASE_URL || 'https://geocoding-api.open-meteo.com/v1/search'
const weatherBaseUrl = process.env.WEATHER_BASE_URL || 'https://api.open-meteo.com/v1/forecast'

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Upstream request failed with status ${response.status}`)
  }
  return response.json()
}

async function resolveCity(city) {
  const url = new URL(geocodingBaseUrl)
  url.searchParams.set('name', city)
  url.searchParams.set('count', '1')

  const payload = await fetchJson(url)
  const result = payload.results?.[0]
  if (!result) {
    return null
  }

  return {
    city: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  }
}

async function fetchWeather(location) {
  const url = new URL(weatherBaseUrl)
  url.searchParams.set('latitude', String(location.latitude))
  url.searchParams.set('longitude', String(location.longitude))
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m')
  url.searchParams.set('timezone', 'auto')

  const payload = await fetchJson(url)
  return {
    location,
    current: payload.current,
  }
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)

  if (request.method === 'GET' && url.pathname === '/health') {
    writeJson(response, 200, { status: 'ok' })
    return
  }

  if (request.method === 'GET' && url.pathname === '/weather') {
    const city = url.searchParams.get('city')
    if (!city) {
      writeJson(response, 400, { error: 'Query parameter "city" is required.' })
      return
    }

    try {
      const location = await resolveCity(city)
      if (!location) {
        writeJson(response, 404, { error: `No location found for city "${city}".` })
        return
      }

      const weather = await fetchWeather(location)
      console.log(JSON.stringify({ event: 'weather_request', city, location }))
      writeJson(response, 200, weather)
    } catch (error) {
      console.error(JSON.stringify({ event: 'weather_error', city, message: error.message }))
      writeJson(response, 502, { error: 'Failed to retrieve weather data from upstream provider.' })
    }
    return
  }

  writeJson(response, 404, { error: 'Not found.' })
})

server.listen(port, () => {
  console.log(`max-weather-app listening on port ${port}`)
})
