import axios from 'axios';

export default class WeatherService {
  apiUrl: string;

  constructor() {
    // kita ambil temperature_2m + weathercode (kalau mau icon/deteksi cuaca)
    this.apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m,weathercode';
  }

  async getWeatherData() {
    const response = await axios.get(this.apiUrl);
    // API mengembalikan struktur { hourly: { time: [...], temperature_2m: [...], weathercode: [...] } }
    return response.data.hourly;
  }
}
