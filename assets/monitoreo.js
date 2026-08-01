/*
  monitoreo.js
  Lee monitoreo.csv y dibuja los 4 gráficos de un atleta, mostrando solo sus
  últimas 16 sesiones (~4 semanas) individuales, no promedios por mes.
*/

function claveOrden(fila) {
  return fila["Anio"] * 10000 + fila["Mes"] * 100 + fila["Dia"];
}

function etiquetaFecha(fila) {
  const dia = String(fila["Dia"]).padStart(2, "0");
  const mes = String(fila["Mes"]).padStart(2, "0");
  return `${dia}/${mes}`;
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

      // Ordenar por fecha y quedarnos solo con las últimas 16 sesiones (~4 semanas)
      filas.sort((a, b) => claveOrden(a) - claveOrden(b));
      filas = filas.slice(-16);

      const labels = filas.map(etiquetaFecha);
      const colorCyan = "#5FCAE7";
      const colorPink = "#ED1D7E";
      const colorYellow = "#FDD700";

      new Chart(document.getElementById("chartSueno"), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Horas de sueño",
            data: filas.map(f => f["Sueño"]),
            borderColor: colorCyan,
            backgroundColor: colorCyan + "33",
            tension: 0.3,
            fill: true,
          }]
        },
        options: chartOptions("Horas")
      });

      new Chart(document.getElementById("chartRPE"), {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "RPE",
            data: filas.map(f => f["RPE"]),
            borderColor: colorPink,
            backgroundColor: colorPink + "33",
            tension: 0.3,
            fill: true,
          }]
        },
        options: chartOptions("RPE (0-10)")
      });

      new Chart(document.getElementById("chartFallos"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Reps falladas",
            data: filas.map(f => f["RepsFalladas"]),
            backgroundColor: colorYellow,
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
