/*
  plan.js
  Lógica compartida para leer plan.csv y renderizar las tarjetas de un atleta,
  agrupadas por día. Se usa igual en Dana.html, Kevin.html, etc. — cada página
  solo necesita llamar a renderPlan("NombreDelAtleta").
*/

// Asigna un color de la paleta según el porcentaje de intensidad.
function colorPorcentaje(pct) {
  if (pct === "" || pct === null || pct === undefined) return null;
  const p = parseFloat(pct);
  if (isNaN(p)) return null;
  if (p < 0.78) return "var(--cyan)";
  if (p < 0.90) return "var(--yellow)";
  return "var(--pink)";
}

function renderPlan(nombreAtleta) {
  const contenedor = document.getElementById("planContenedor");
  const tituloAtleta = document.getElementById("tituloAtleta");
  if (tituloAtleta) tituloAtleta.textContent = nombreAtleta;

  Papa.parse("plan.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const filas = results.data.filter(r => r["Atleta"] === nombreAtleta);

      if (filas.length === 0) {
        contenedor.innerHTML = `<p class="empty">Todavía no hay un plan cargado para ${nombreAtleta}.</p>`;
        return;
      }

      // Agrupar por Semana, y dentro de cada semana por Día
      const semanas = {};
      filas.forEach(r => {
        const sKey = r["Semana"];
        if (!semanas[sKey]) semanas[sKey] = { meta: r, dias: {} };
        const dKey = r["Dia"];
        if (!semanas[sKey].dias[dKey]) semanas[sKey].dias[dKey] = [];
        semanas[sKey].dias[dKey].push(r);
      });

      let html = "";

      Object.keys(semanas).sort((a, b) => a - b).forEach(sKey => {
        const semana = semanas[sKey];
        const meta = semana.meta;

        html += `
          <div class="weekHead">
            <div class="weekTitle">Semana ${sKey}</div>
            <div class="weekMeta">
              ${meta["Fecha Inicio"]} – ${meta["Fecha Fin"]}
              ${meta["Nota Semana"] ? " · " + meta["Nota Semana"] : ""}
              ${meta["Vol Semana (reps>=70%)"] ? " · Vol. efectivo: " + meta["Vol Semana (reps>=70%)"] + " reps" : ""}
            </div>
          </div>
        `;

        Object.keys(semana.dias).forEach(dKey => {
          const ejercicios = semana.dias[dKey];
          const bloque = ejercicios[0]["Bloque"];

          html += `<div class="dayLabel">${dKey} &middot; ${bloque}</div><div class="cardGrid">`;

          ejercicios.forEach(ex => {
            const color = colorPorcentaje(ex["Porcentaje"]);
            const pctTexto = ex["Porcentaje"] ? Math.round(parseFloat(ex["Porcentaje"]) * 100) + "%" : "—";
            const series = ex["Series"] || "—";
            const reps = ex["Reps"] || "—";
            const kg = ex["Kg"] || "—";

            html += `
              <div class="exCard" ${color ? `style="border-left-color:${color}"` : ""}>
                <div class="exTag">${ex["Enfoque"] || ""}</div>
                <div class="exName">${ex["Ejercicio"]}</div>
                <div class="exStats">
                  <span>${series}<small>series</small></span>
                  <span>${reps}<small>reps</small></span>
                  <span>${kg}<small>kg</small></span>
                  <span ${color ? `style="color:${color}"` : ""}>${pctTexto}<small>%</small></span>
                </div>
              </div>
            `;
          });

          html += `</div>`;
        });
      });

      contenedor.innerHTML = html;
    },
    error: function () {
      contenedor.innerHTML = `<p class="empty">No se pudo cargar plan.csv. Verifica que el archivo esté en la raíz del sitio.</p>`;
    }
  });
}
