// script.js

const apiKey = "f7c6c9accee84002b6254311252603";

let lastWeather = null;
let globeEnabled = true;
let globeScene, globeCamera, globeRenderer, globeMesh;

// MAIN WEATHER FETCH
async function getWeather() {
    const locationInput = document.getElementById("location");
    const location = locationInput.value.trim();

    if (!location) {
        alert("Please enter a location!");
        return;
    }

    try {
        const currentRes = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
                location
            )}&aqi=yes`
        );
        const forecastRes = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
                location
            )}&days=5&aqi=yes`
        );

        const current = await currentRes.json();
        const forecast = await forecastRes.json();

        if (current.error || forecast.error) {
            alert("Location not found!");
            return;
        }

        lastWeather = { current, forecast };

        renderCurrentWeather(current);
        renderForecast(forecast);
        updateBackground(current.current.condition.text);
        animateWeather(current.current.condition.text);
        greetAIIfNeeded();

    } catch (e) {
        console.error(e);
        alert("Unable to fetch weather. Please try again.");
    }
}

// RENDER DOM SECTIONS
function renderCurrentWeather(data) {
    const el = document.getElementById("weather-info");
    const c = data.current;
    const loc = data.location;

    el.innerHTML = `
        <h3>${loc.name}, ${loc.country}</h3>
        <p><strong>${c.condition.text}</strong></p>
        <p>Temperature: ${c.temp_c}°C (Feels like ${c.feelslike_c}°C)</p>
        <p>Humidity: ${c.humidity}% • Wind: ${c.wind_kph} km/h</p>
        <p>UV Index: ${c.uv} • AQI (PM2.5): ${c.air_quality.pm2_5.toFixed(1)}</p>
        <img src="${c.condition.icon}" alt="Weather Icon" />
    `;
}

function renderForecast(data) {
    const el = document.getElementById("forecast-info");
    const days = data.forecast.forecastday;

    let html = `<h3>Next ${days.length} Days</h3>`;
    html += `<ul style="list-style:none;padding-left:0;margin:6px 0 0 0;">`;
    days.forEach((d) => {
        html += `
            <li style="margin-bottom:6px;">
                <strong>${d.date}</strong> - ${d.day.avgtemp_c}°C,
                ${d.day.condition.text}
            </li>
        `;
    });
    html += `</ul>`;
    el.innerHTML = html;
}

// VOICE SEARCH
function startVoiceSearch() {
    const Recognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }
    const recognition = new Recognition();
    recognition.onresult = (event) => {
        document.getElementById("location").value =
            event.results[0][0].transcript;
        getWeather();
    };
    recognition.start();
}

// THEME TOGGLE
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
}

// COMPARE WEATHER
async function compareWeather() {
    const loc1 = prompt("Enter first location:");
    const loc2 = prompt("Enter second location:");

    if (!loc1 || !loc2) {
        alert("Both locations required.");
        return;
    }

    try {
        const [r1, r2] = await Promise.all([
            fetch(
                `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
                    loc1
                )}`
            ),
            fetch(
                `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
                    loc2
                )}`
            ),
        ]);

        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

        const el = document.getElementById("comparison-info");
        el.innerHTML = `
            <h3>Comparison</h3>
            <p><strong>${d1.location.name}</strong> — ${d1.current.temp_c}°C, ${d1.current.condition.text}</p>
            <p><strong>${d2.location.name}</strong> — ${d2.current.temp_c}°C, ${d2.current.condition.text}</p>
        `;
    } catch (e) {
        console.error(e);
        alert("Error while comparing locations.");
    }
}

// HISTORY
async function showHistoricalWeather() {
    const loc = document.getElementById("location").value.trim();
    const date = prompt("Enter date (YYYY-MM-DD):");

    if (!loc || !date) {
        alert("Location and date required.");
        return;
    }

    try {
        const res = await fetch(
            `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(
                loc
            )}&dt=${date}`
        );
        const data = await res.json();

        const el = document.getElementById("weather-info");
        const d = data.forecast.forecastday[0].day;
        el.innerHTML = `
            <h3>${data.location.name} on ${date}</h3>
            <p>${d.condition.text}</p>
            <p>Average Temp: ${d.avgtemp_c}°C • Max: ${d.maxtemp_c}°C • Min: ${d.mintemp_c}°C</p>
        `;
    } catch (e) {
        console.error(e);
        alert("Could not load past weather.");
    }
}

// FUTURE FORECAST (up to 7)
async function showFutureWeather() {
    const loc = document.getElementById("location").value.trim();
    let days = prompt("Enter days (1-7):");

    if (!loc || !days) {
        alert("Location and days required.");
        return;
    }
    days = Math.min(parseInt(days, 10) || 1, 7);

    try {
        const res = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(
                loc
            )}&days=${days}`
        );
        const data = await res.json();
        renderForecast(data);
    } catch (e) {
        console.error(e);
        alert("Could not load forecast.");
    }
}

// PLACEHOLDERS
function toggleAR() {
    alert("AR Mode coming soon! You can describe 3D rain/sun overlays here.");
}

function showAQI() {
    alert("AQI is already shown inside the main weather panel as PM2.5.");
}

function toggle3DGlobe() {
    globeEnabled = !globeEnabled;
    const canvas = document.getElementById("globe-canvas");
    canvas.style.opacity = globeEnabled ? "1" : "0";
}

// BACKGROUND + SIMPLE CLASS
function updateBackground(condition) {
    document.body.classList.remove("sunny-glow");
    let img = "cloudy.jpg";

    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) {
        img = "Rainy.jpg";
    } else if (c.includes("sunny") || c.includes("clear")) {
        img = "sunny.jpg";
        document.body.classList.add("sunny-glow");
    } else {
        img = "cloudy.jpg";
    }

    document.body.style.backgroundImage = `url('${img}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
}

// WEATHER PARTICLE ANIMATIONS
let particleTimeout;
function animateWeather(condition) {
    const container = document.getElementById("weather-particles");
    container.innerHTML = "";
    clearTimeout(particleTimeout);

    const c = condition.toLowerCase();

    // Rain
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) {
        for (let i = 0; i < 120; i++) {
            const drop = document.createElement("div");
            drop.className = "drop";
            drop.style.left = Math.random() * 100 + "vw";
            drop.style.animationDelay = Math.random() * 0.9 + "s";
            drop.style.animationDuration = 0.7 + Math.random() * 0.6 + "s";
            container.appendChild(drop);
        }
    }

    // Snow
    else if (c.includes("snow") || c.includes("sleet") || c.includes("blizzard")) {
        for (let i = 0; i < 80; i++) {
            const flake = document.createElement("div");
            flake.className = "flake";
            flake.style.left = Math.random() * 100 + "vw";
            flake.style.animationDelay = Math.random() * 4 + "s";
            container.appendChild(flake);
        }
    }

    // Clouds / Windy – use GSAP for soft drifting overlay
    else if (c.includes("cloud") || c.includes("overcast") || c.includes("mist")) {
        const cloud = document.createElement("div");
        cloud.style.position = "absolute";
        cloud.style.top = "10vh";
        cloud.style.left = "-40vw";
        cloud.style.width = "60vw";
        cloud.style.height = "26vh";
        cloud.style.background =
            "radial-gradient(circle at 20% 40%, rgba(255,255,255,0.22), transparent 70%)";
        container.appendChild(cloud);

        gsap.to(cloud, {
            x: "120vw",
            duration: 35,
            repeat: -1,
            ease: "linear",
        });
    }

    // Auto clear particles after 60s to save DOM
    particleTimeout = setTimeout(() => (container.innerHTML = ""), 60000);
}

// SIMPLE AI ASSISTANT (NO EXTERNAL API)
function sendChat() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";

    const reply = generateAIReply(text);
    setTimeout(() => appendMessage("bot", reply), 300);
}

function appendMessage(role, text) {
    const log = document.getElementById("chat-log");
    const msg = document.createElement("div");
    msg.className = `message ${role}`;
    const span = document.createElement("span");
    span.textContent = text;
    msg.appendChild(span);
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
}

function generateAIReply(question) {
    if (!lastWeather) {
        return "First, search a location so I can see the latest weather.";
    }

    const { current } = lastWeather.current;
    const temp = current.temp_c;
    const cond = current.condition.text.toLowerCase();

    const q = question.toLowerCase();

    // simple rules
    if (q.includes("umbrella")) {
        if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
            return "Yes, definitely carry an umbrella. It looks rainy.";
        }
        return "You probably don’t need an umbrella, there’s no strong sign of rain.";
    }

    if (q.includes("hot") || q.includes("warm")) {
        if (temp >= 32) return "Yes, it’s quite hot. Stay hydrated and avoid peak noon sun.";
        if (temp >= 26) return "It’s pleasantly warm outside.";
        return "Not really hot, temperature is fairly mild.";
    }

    if (q.includes("cold")) {
        if (temp <= 10) return "Yes, it’s pretty cold. Wear layers and maybe a jacket.";
        if (temp <= 18) return "Slightly cool, a light jacket would be good.";
        return "It doesn’t look cold right now.";
    }

    if (q.includes("bike") || q.includes("ride") || q.includes("walk")) {
        if (cond.includes("rain") || cond.includes("storm")) {
            return "Not ideal for a ride or walk, weather seems rainy or stormy.";
        }
        if (current.wind_kph > 30) {
            return "It’s quite windy. Take care if you’re planning a ride.";
        }
        return "Looks fine for a walk or bike ride. Enjoy!";
    }

    if (q.includes("pollution") || q.includes("aqi") || q.includes("air")) {
        const aqi = current.air_quality.pm2_5;
        let rating = "moderate";
        if (aqi <= 12) rating = "good";
        else if (aqi <= 35) rating = "moderate";
        else if (aqi <= 55) rating = "unhealthy for sensitive groups";
        else rating = "poor";
        return `PM2.5 is ${aqi.toFixed(
            1
        )}, air quality is ${rating}. Avoid long outdoor exposure if you’re sensitive.`;
    }

    return `Right now it is ${temp}°C with ${current.condition.text.toLowerCase()}. It feels like ${
        current.feelslike_c
    }°C. You can ask me about umbrella, walk, bike ride, heat, cold, or air quality.`;
}

function greetAIIfNeeded() {
    const log = document.getElementById("chat-log");
    if (!log.innerHTML.trim()) {
        appendMessage(
            "bot",
            "Weather loaded ✅. Ask me something like “Do I need an umbrella?” or “Is it good for a walk?”"
        );
    }
}

// 3D GLOBE (Three.js)
function initGlobe() {
    const canvas = document.getElementById("globe-canvas");
    globeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    globeRenderer.setPixelRatio(window.devicePixelRatio);
    globeRenderer.setSize(window.innerWidth, window.innerHeight);

    globeScene = new THREE.Scene();
    globeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    globeCamera.position.z = 4;

    const geometry = new THREE.SphereGeometry(1.4, 48, 48);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        emissive: 0x0f172a,
        roughness: 0.7,
        metalness: 0.15,
        wireframe: false,
    });

    globeMesh = new THREE.Mesh(geometry, material);
    globeScene.add(globeMesh);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 3, 5);
    globeScene.add(light);

    const ambient = new THREE.AmbientLight(0x9ca3af, 0.4);
    globeScene.add(ambient);

    function animate() {
        if (globeEnabled) {
            globeMesh.rotation.y += 0.0019;
            globeMesh.rotation.x += 0.0003;
            globeRenderer.render(globeScene, globeCamera);
        }
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("resize", () => {
        globeCamera.aspect = window.innerWidth / window.innerHeight;
        globeCamera.updateProjectionMatrix();
        globeRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// PWA INSTALL PROMPT
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById("install-btn");
    btn.hidden = false;
    btn.addEventListener("click", async () => {
        btn.hidden = true;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    });
});

// SERVICE WORKER
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch(console.error);
    });
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    initGlobe();
});
