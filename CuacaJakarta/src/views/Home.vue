<template>
  <ion-page>
    <ion-header collapse="condense" translucent>
      <ion-toolbar color="transparent">
        <ion-title class="text-2xl font-bold text-white">
          {{ cityName }}
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- Mode siang/malam otomatis -->
    <ion-content :fullscreen="true" :class="[isNight ? 'weather-bg-night' : 'weather-bg-day']">
      <!-- CURRENT WEATHER -->
      <div class="current-section">
        <div class="weather-icon">
          <img :src="weatherAnimation" alt="weather animation" class="weather-anim" />
        </div>

        <!-- 🌡️ Suhu sekarang -->
        <h1 class="temp">{{ currentTemp }}°C</h1>
        <p class="desc text-lg capitalize">{{ weatherDesc }}</p>

        <!-- 📍 Nama kota -->
        <p class="city text-lg font-semibold mt-1 opacity-90">📍 {{ cityName }}</p>

        <!-- 🗓️ Tanggal dan waktu -->
        <p class="date mt-1">{{ currentDate }}</p>
      </div>

      <!-- WEATHER INFO -->
      <div class="info-grid">
        <div class="info-item">
          <p class="label">🌡️ Max/Min</p>
          <p>{{ todayMax }}° / {{ todayMin }}°</p>
        </div>
        <div class="info-item">
          <p class="label">💧 Humidity</p>
          <p>{{ humidity }}%</p>
        </div>
        <div class="info-item">
          <p class="label">🌬️ Wind</p>
          <p>{{ windSpeed }} km/h</p>
        </div>
        <div class="info-item">
          <p class="label">☀️ Sunrise</p>
          <p>{{ sunrise }}</p>
        </div>
        <div class="info-item">
          <p class="label">🌇 Sunset</p>
          <p>{{ sunset }}</p>
        </div>
      </div>

      <!-- 24-HOUR FORECAST -->
      <section class="forecast-section">
        <h2 class="section-title">24-Hour Forecast ({{ selectedDayLabel }})</h2>
        <transition name="fade-slide" mode="out-in">
          <div key="forecast" class="hourly-scroll">
            <div v-for="(hour, i) in hourlyForecast" :key="i" class="hour-card">
              <p class="time">{{ hour.time }}</p>
              <p class="temp-small">{{ hour.temp }}°</p>
            </div>
          </div>
        </transition>
      </section>

      <!-- TEMPERATURE CHART -->
      <section ref="chartSection" class="chart-section">
        <h2 class="section-title">Temperature Chart — {{ cityName }}</h2>

        <transition name="fade" mode="out-in">
          <div v-if="hourlyChartData?.labels?.length" key="chart" class="chart-wrapper">
            <LineChart :data="hourlyChartData" :options="chartOptions" />
          </div>
          <p v-else key="loading" class="text-center opacity-80">Loading chart data...</p>
        </transition>
      </section>

      <!-- 5-DAY FORECAST -->
      <section class="forecast-section">
        <h2 class="section-title">5-Day Forecast</h2>
        <ion-grid>
          <ion-row>
            <ion-col
              size="6"
              v-for="(day, i) in dailyForecast"
              :key="i"
              class="ion-text-center"
            >
              <ion-card
                class="day-card"
                :class="{ active: selectedDayIndex === i }"
                @click="selectDay(i)"
              >
                <ion-card-content>
                  <p class="date-small">{{ day.date }}</p>
                  <p class="temp-small">{{ day.min }}° / {{ day.max }}°</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/vue";
import { defineComponent, ref, nextTick } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "@/theme/home.css";

Chart.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

export default defineComponent({
  name: "Home",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    LineChart: Line,
  },
  setup() {
    const chartSection = ref<HTMLElement | null>(null);
    return { chartSection };
  },
  data() {
    return {
      latitude: -6.2,
      longitude: 106.8,
      cityName: "Jakarta",
      isNight: false,
      currentTemp: 0,
      weatherDesc: "",
      weatherCode: 0,
      currentDate: "",
      todayMax: 0,
      todayMin: 0,
      humidity: 0,
      windSpeed: 0,
      sunrise: "",
      sunset: "",
      hourlyForecast: [] as any[],
      dailyForecast: [] as any[],
      fullHourlyData: [] as any[],
      selectedDayIndex: 0,
      selectedDayLabel: "",
      hourlyChartData: {
        labels: [] as string[],
        datasets: [
          {
            label: "Temperature (°C)",
            data: [] as number[],
            borderWidth: 2,
            borderColor: "#ffffff",
            tension: 0.4,
            pointRadius: 3,
            fill: false,
          },
        ],
      } as ChartData<"line">,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: {
              color: "#fff",
              autoSkip: false,
              callback: function (val: any, index: number, ticks: any) {
                // ✅ tampilkan label tiap 3 jam sekali: 00, 03, 06, dst.
                return index % 3 === 0 ? ticks[index].label : "";
              },
            },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
        },
      } as any,
    };
  },
  computed: {
    weatherAnimation(): string {
      const base =
        "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/";
      const hour = new Date().getHours();
      const code = this.weatherCode;
      this.isNight = hour >= 18 || hour < 6;

      if (this.isNight) {
        if ([0, 1, 2].includes(code)) return base + "night.svg";
        if ([3].includes(code)) return base + "cloudy-night-1.svg";
        if ([61, 63, 65, 80, 81].includes(code)) return base + "rainy-6.svg";
        return base + "night.svg";
      } else {
        if ([0].includes(code)) return base + "day.svg";
        if ([1, 2].includes(code)) return base + "cloudy-day-1.svg";
        if ([3].includes(code)) return base + "cloudy.svg";
        if ([61, 63, 65, 80, 81].includes(code)) return base + "rainy-6.svg";
        return base + "day.svg";
      }
    },
  },
  mounted() {
    this.loadWeather();
  },
  methods: {
    async loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        const now = new Date();
        this.currentDate = now.toLocaleString("id-ID", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const hourIndex = now.getHours();
        this.currentTemp = Math.round(data.hourly.temperature_2m[hourIndex]);
        this.humidity = data.hourly.relative_humidity_2m[hourIndex];
        this.windSpeed = Math.round(data.hourly.windspeed_10m[hourIndex]);
        this.weatherCode = data.hourly.weathercode[hourIndex];
        this.weatherDesc = this.mapWeatherCode(this.weatherCode);

        this.todayMax = Math.round(data.daily.temperature_2m_max[0]);
        this.todayMin = Math.round(data.daily.temperature_2m_min[0]);
        this.sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        this.sunset = new Date(data.daily.sunset[0]).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

        this.fullHourlyData = data.hourly.time.map((t: string, i: number) => ({
          datetime: new Date(t),
          temp: Math.round(data.hourly.temperature_2m[i]),
        }));

        this.dailyForecast = data.daily.time.slice(0, 5).map((t: string, i: number) => ({
          date: new Date(t).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          dateFull: new Date(t).toISOString().split("T")[0],
          min: Math.round(data.daily.temperature_2m_min[i]),
          max: Math.round(data.daily.temperature_2m_max[i]),
        }));

        this.selectDay(0);
      } catch (err) {
        console.error("Open-Meteo fetch error:", err);
      }
    },

    // ✅ Chart & forecast dimulai dari jam 00:00
    selectDay(index: number) {
      this.selectedDayIndex = index;
      const selectedDate = this.dailyForecast[index].dateFull;
      this.selectedDayLabel = this.dailyForecast[index].date;

      const selectedData = this.fullHourlyData
        .filter((item) => item.datetime.toISOString().split("T")[0] === selectedDate)
        .sort((a, b) => a.datetime.getHours() - b.datetime.getHours());

      this.hourlyForecast = selectedData.map((h) => ({
        time: h.datetime.getHours().toString().padStart(2, "0") + ":00",
        temp: h.temp,
      }));

      this.hourlyChartData = {
        labels: this.hourlyForecast.map((h) => h.time),
        datasets: [
          {
            label: "Temperature (°C)",
            data: this.hourlyForecast.map((h) => h.temp),
            borderWidth: 2,
            borderColor: "#ffffff",
            tension: 0.4,
            pointRadius: 3,
            fill: false,
          },
        ],
      };

      // Auto-scroll ke chart
      nextTick(() => {
        const section = this.$refs.chartSection as HTMLElement;
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },

    mapWeatherCode(code: number): string {
      const desc: Record<number, string> = {
        0: "Cerah",
        1: "Cerah Sebagian",
        2: "Berawan",
        3: "Mendung",
        45: "Berkabut",
        48: "Kabut Tebal",
        61: "Hujan Ringan",
        63: "Hujan Sedang",
        65: "Hujan Lebat",
        80: "Hujan Lokal",
        81: "Hujan Lebat",
        95: "Badai Petir",
      };
      return desc[code] ?? "Tidak diketahui";
    },
  },
});
</script>
