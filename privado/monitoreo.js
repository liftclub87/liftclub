/*
  monitoreo.js
  Lee monitoreo.csv, toma las últimas 16 sesiones (~4 semanas) de un atleta,
  las agrupa en 4 bloques cronológicos de 4 sesiones, y grafica el promedio
  (o suma, según la variable) de cada bloque como barras semanales.
*/

function claveOrden(fila) {
  return fila["Anio"] * 10000 + fila["Mes"] * 100 + fila["Dia"];
}

function agruparEnBloques(filas, tamanoBloque) {
  const bloques = [];
  for (let i = 0; i < filas.length; i += tamanoBloque) {
    bloques.push(filas.slice(i, i + tamanoBloque));
  }
  return bloques;
}

function promedio(valores) {
  const nums = valores.filter(v => typeof v === "number" && !isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function suma(valores) {
  const nums = valores.filter(v => typeof v === "number" && !isNaN(v));
  return nums.reduce((a, b) => a + b, 0);
}

function renderMonitoreo(nombreAtleta) {
  Papa.parse("monitoreo.csv?v=" + Date.now(), {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function (results) {
      let filas = results.data.filter(r => r["Nombre"] === nombreAtleta);

      if (filas.length === 0) {
        document.getElementById("monitoreoContenedor").innerHTML =
          `<p class="empty">Todavía no hay datos de monitoreo para ${nombreAtleta}.</p>`;
        return;
      }

      filas.sort((a, b) => claveOrden(a) - claveOrden(b));
      filas = filas.slice(-16);

      const bloques = agruparEnBloques(filas, 4);
      const labels = bloques.map((_, i) => `Semana ${i + 1}`);

      const colorCyan = "#5FCAE7";
      const colorPink = "#ED1D7E";
      const colorYellow = "#FDD700";

      new Chart(document.getElementById("chartSueno"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Horas de sueño (promedio semanal)",
            data: bloques.map(b => promedio(b.map(f => f["Sueño"]))),
            backgroundColor: colorCyan,
            borderRadius: 6,
          }]
        },
        options: chartOptions("Horas")
      });

      new Chart(document.getElementById("chartRPE"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "RPE (promedio semanal)",
            data: bloques.map(b => promedio(b.map(f => f["RPE"]))),
            backgroundColor: colorPink,
            borderRadius: 6,
          }]
        },
        options: chartOptions("RPE (0-10)")
      });

      new Chart(document.getElementById("chartFallos"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Reps falladas (total semanal)",
            data: bloques.map(b => suma(b.map(f => f["RepsFalladas"]))),
            backgroundColor: colorYellow,
            borderRadius: 6,
          }]
        },
        options: chartOptions("Reps falladas")
      });

      const conFase = filas.filter(f => f["FasePeriodo"] && String(f["FasePeriodo"]).trim() !== "");
      const chartFaseEl = document.getElementById("chartFaseWrap");
      if (conFase.length > 0) {
        const conteo = {};
        conFase.forEach(f => {
          const fase = String(f["FasePeriodo"]).trim();
          conteo[fase] = (conteo[fase] || 0) + 1;
        });
        new Chart(document.getElementById("chartFase"), {
          type: "doughnut",
          data: {
            labels: Object.keys(conteo),
            datasets: [{
              data: Object.values(conteo),
              backgroundColor: [colorCyan, colorPink, colorYellow],
            }]
          },
          options: { plugins: { legend: { labels: { color: "#EDEFF1" } } } }
        });
      } else {
        chartFaseEl.style.display = "none";
      }
    },
    error: function () {
      document.getElementById("monitoreoContenedor").innerHTML =
        `<p class="empty">No se pudo cargar monitoreo.csv.</p>`;
    }
  });
}

function chartOptions(ejeY) {
  return {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#EDEFF1" } }
    },
    scales: {
      x: { ticks: { color: "#8b9096" }, grid: { color: "#26282B" } },
      y: { ticks: { color: "#8b9096" }, grid: { color: "#26282B" }, title: { display: true, text: ejeY, color: "#8b9096" } }
    }
  };
}
