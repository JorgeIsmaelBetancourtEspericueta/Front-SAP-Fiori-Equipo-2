async function obtenerDatosSimulacion() {
  const url = "http://localhost:4004/api/inv/crudSimulation";

  const params = new URLSearchParams({
    action: "post",
    symbol: "IBM",
    initial_investment: "30000",
    simulationName: "ReversionSimple",
    startDate: "2023-01-01",
    endDate: "2025-05-13",
    rsiPeriod: "14",
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status}`);
    }

    const data = await response.json();

    // Mostrar toda la respuesta por si acaso
    console.log("Respuesta completa:");
    console.log(JSON.stringify(data, null, 2));

    // Acceder correctamente a historicalPrices
    const precios = data.value?.[0]?.simulation?.historicalPrices;

    if (Array.isArray(precios)) {
      console.log("Precios históricos de la simulación:");
      precios.forEach((item, index) => {
        console.log(`--- Día ${index + 1} ---`);
        console.log(`Fecha: ${item.date}`);
        console.log(`Open: ${item.open}`);
        console.log(`High: ${item.high}`);
        console.log(`Low: ${item.low}`);
        console.log(`Close: ${item.close}`);
        console.log(`Volumen: ${item.volume}`);
        console.log(`SMA: ${item.indicators?.sma}`);
        console.log(`RSI: ${item.indicators?.rsi}`);
        console.log(`Señal: ${item.signal}`);
        console.log(`Reglas: ${item.rules}`);
        console.log(`Acciones: ${item.shares}`);
        console.log("-------------------");
      });
    } else {
      console.log("No se encontraron datos históricos.");
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
  }
}

obtenerDatosSimulacion();
