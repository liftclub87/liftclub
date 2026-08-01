/*
  monitoreo.js
  Lógica compartida para leer monitoreo.csv y renderizar los 4 gráficos de un
  atleta (sueño, RPE, reps falladas, fase del periodo), agrupados por mes.
  Se usa igual en cada página de monitoreo — solo llaman a renderMonitoreo("Nombre").
*/

function agruparPorMes(filas, campo, tipo) {
  // tipo: "promedio" o "suma"
  const meses = {};
  filas.forEach(f => {
    const mes = f["Fecha"].slice(0, 7); // "2026-05"
    const valor = parseFloat(f[campo]);
    if (isNaN(valor)) return;
    if (!meses[mes]) meses[mes] = [];
    meses[mes].push(valor);
  });
  const labels = Object.keys(meses).sort();
  const datos = labels.map(m => {
    const vals = meses[m];
    if (tipo === "suma") return vals.reduce((a, b) => a + b, 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  return { labels, datos };
}

function nombreMes(mesKey) {
  const [anio, mes] = mesKey.split("-");
  const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return nombres[parseInt(mes, 10) - 1] + " " + anio.slice(2);
}

function renderMonitoreo(nombreAtleta) {
  Papa.parse("monitoreo.csv?v=" + Date.now(), {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const filas = results.data.filter(r => r["Nombre"] === nombreAtleta);

      if (filas.length === 0) {
        document.getElementById("monitoreoContenedor").innerHTML =
          `<p class="empty">Todavía no hay datos de monitoreo para ${nombreAtleta}.</p>`;
        return;
      }

      const colorCyan = "#5FCAE7";
      const colorPink = "#ED1D7E";
      const colorYellow = "#FDD700";

      // Gráfico 1: Sueño (promedio mensual)
      const sueno = agruparPorMes(filas, "Sueño", "promedio");
      new Chart(document.getElementById("chartSueno"), {
        type: "line",
        data: {
          labels: sueno.labels.map(nombreMes),
          datasets: [{
            label: "Horas de sueño (promedio)",
            data: sueno.datos,
            borderColor: colorCyan,
            backgroundColor: colorCyan + "33",
            tension: 0.3,
            fill: true,
          }]
        },
        options: chartOptions("Horas")
      });

      // Gráfico 2: RPE (promedio mensual)
      const rpe = agruparPorMes(filas, "RPE", "promedio");
      new Chart(document.getElementById("chartRPE"), {
        type: "line",
        data: {
          labels: rpe.labels.map(nombreMes),
          datasets: [{
            label: "RPE (promedio)",
            data: rpe.datos,
            borderColor: colorPink,
            backgroundColor: colorPink + "33",
            tension: 0.3,
            fill: true,
          }]
        },
        options: chartOptions("RPE (0-10)")
      });

      // Gráfico 3: Reps falladas (suma mensual)
      const fallos = agruparPorMes(filas, "RepsFalladas", "suma");
      new Chart(document.getElementById("chartFallos"), {
        type: "bar",
        data: {
          labels: fallos.labels.map(nombreMes),
          datasets: [{
            label: "Reps falladas (total)",
            data: fallos.datos,
            backgroundColor: colorYellow,
          }]
        },
        options: chartOptions("Reps falladas")
      });

      // Gráfico 4: Fase del periodo (solo si hay datos, es decir, solo atletas mujeres)
      const conFase = filas.filter(f => f["FasePeriodo"] && f["FasePeriodo"].trim() !== "");
      const chartFaseEl = document.getElementById("chartFaseWrap");
      if (conFase.length > 0) {
        const conteo = {};
        conFase.forEach(f => {
          const fase = f["FasePeriodo"].trim();
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
