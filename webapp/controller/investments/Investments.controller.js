sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
  ],
  function (Controller, JSONModel, MessageToast, DateFormat, MessageBox) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.investments.Investments",
      {
        // Variables de clase
        _oResourceBundle: null,
        _sSidebarOriginalSize: "380px",

        // CONSTANTES
        _CONSTANTS: {
          DEFAULT_BALANCE: 1000,
          DEFAULT_STOCK: 1,
          DEFAULT_SHORT_SMA: 50,
          DEFAULT_LONG_SMA: 200,
          API_ENDPOINT: "http://localhost:4004/api/inv/crudSimulation", // Base URL, action will be added
          SIMULATION_ACTION: "post", //Added action as constant
        },

        onInit: function () {
          this._initModels();
          this._setDefaultDates();
          this._loadI18nTexts();
          this._setupViewDelegates();
        },

        // Inicialización de modelos
        _initModels: function () {
          this._createSymbolModel();
          this._createPriceDataModel();
          this._createViewModel();
          this._createStrategyAnalysisModel();
          this._createStrategyResultModel();
        },

        _createSymbolModel: function () {
          this.getView().setModel(
            new JSONModel({
              symbols: [
                { symbol: "TSLA", name: "Tesla" },
                { symbol: "AAPL", name: "Apple" },
                { symbol: "IBM", name: "IBM" },
              ],
            }),
            "symbolModel"
          );
        },

        _createPriceDataModel: function () {
          this.getView().setModel(new JSONModel({ value: [] }), "priceData");
        },

        _createViewModel: function () {
          this.getView().setModel(
            new JSONModel({
              selectedTab: "table",
            }),
            "viewModel"
          );
        },

        _createStrategyAnalysisModel: function () {
          this.getView().setModel(
            new JSONModel({
              balance: this._CONSTANTS.DEFAULT_BALANCE,
              stock: this._CONSTANTS.DEFAULT_STOCK,
              strategyKey: "",
              longSMA: this._CONSTANTS.DEFAULT_LONG_SMA,
              shortSMA: this._CONSTANTS.DEFAULT_SHORT_SMA,
              startDate: null,
              endDate: null,
              controlsVisible: false,
              strategies: [], // Will be populated in _loadI18nTexts
            }),
            "strategyAnalysisModel"
          );
        },

        _createStrategyResultModel: function () {
          this.getView().setModel(
            new JSONModel({
              hasResults: false,
              chart_data: [],
              signals: [],
              result: null,
              simulationName: "", // Added for consistency
              symbol: "",
              startDate: null,
              endDate: null,
            }),
            "strategyResultModel"
          );
        },

        // Carga textos i18n
        _loadI18nTexts: function () {
          var oI18nModel = this.getOwnerComponent().getModel("i18n");
          if (!oI18nModel) {
            console.error("Modelo i18n no encontrado");
            return;
          }

          try {
            this._oResourceBundle = oI18nModel.getResourceBundle();
            this.getView()
              .getModel("strategyAnalysisModel")
              .setProperty("/strategies", [
                {
                  key: "",
                  text: this._oResourceBundle.getText(
                    "selectStrategyPlaceholder"
                  ),
                },
                {
                  key: "Reversión Simple",
                  text: this._oResourceBundle.getText(
                    "movingAverageCrossoverStrategy"
                  ),
                },
              ]);
          } catch (error) {
            console.error("Error al cargar ResourceBundle:", error);
          }
        },

        // Configurar delegados de vista
        _setupViewDelegates: function () {
          this.getView().addEventDelegate({
            onAfterRendering: this._onViewAfterRendering.bind(this),
          });
        },

        // Configurar gráfico
        _onViewAfterRendering: function () {
          const oVizFrame = this.byId("idVizFrame");
          if (!oVizFrame) return;

          oVizFrame.setVizProperties({
            plotArea: {
              dataShape: {
                primaryAxis: ["line", "line", "line", "point", "point"],
              },
              colorPalette: [
                "#0074D9",
                "#FFDC00",
                "#FFA500",
                "#2ecc40",
                "#ff4136",
              ],
              dataLabel: { visible: false },
              marker: {
                visible: true,
                shape: [
                  "circle",
                  "circle",
                  "circle",
                  "triangleUp",
                  "triangleDown",
                ],
              },
              window: {
                start: "firstDataPoint",
                end: "lastDataPoint",
              },
            },
            valueAxis: {
              title: { text: "Precio de Cierre (USD)" },
              visible: true,
            },
            timeAxis: {
              title: { text: "Fecha" },
              levels: ["day", "month", "year"],
              label: { formatString: "dd/MM/yy" },
            },
            title: { text: "Histórico de Precios de Acciones" },
            legend: { visible: true },
            toolTip: {
              visible: true,
              formatString: [
                ["PrecioCierre", ":.2f USD"],
                ["PrecioInicial", ":.2f"],
                ["High", ":.2f"],
                ["Open", ":.2f USD"],
                ["SMA", ":.2f USD"],
              ],
            },
            interaction: {
              zoom: { enablement: "enabled" },
              selectability: { mode: "single" },
            },
          });
        },

        // Métodos de fecha
        _setDefaultDates: function () {
          var oModel = this.getView().getModel("strategyAnalysisModel");
          var oToday = new Date();
          var oStartDate = new Date(oToday);
          oStartDate.setMonth(oStartDate.getMonth() - 6);

          oModel.setProperty("/endDate", new Date(oToday));
          oModel.setProperty("/startDate", new Date(oStartDate));
        },

        _formatDate: function (oDate) {
          return oDate
            ? DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(
                oDate
              )
            : null;
        },

        // Event Handlers
        onTabSelect: function (oEvent) {
          var sKey = oEvent.getParameter("key");
          this.getView()
            .getModel("viewModel")
            .setProperty("/selectedTab", sKey);
        },

        onStrategyChange: function (oEvent) {
          var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
          this.getView()
            .getModel("strategyAnalysisModel")
            .setProperty("/controlsVisible", !!sSelectedKey);
        },

        onRunAnalysisPress: function () {
          var oView = this.getView();
          var oStrategyModel = oView.getModel("strategyAnalysisModel");
          var oResultModel = oView.getModel("strategyResultModel");
          var sSymbol = oView.byId("symbolSelector").getSelectedKey();

          // Validaciones
          if (!this._validateAnalysisInputs(oStrategyModel, sSymbol)) return;

          // Configurar y llamar API
          this._callAnalysisAPI(sSymbol, oStrategyModel, oResultModel);
        },

        _validateAnalysisInputs: function (oStrategyModel, sSymbol) {
          if (!oStrategyModel.getProperty("/strategyKey")) {
            MessageBox.warning("Seleccione una estrategia");
            return false;
          }
          if (!sSymbol) {
            MessageBox.warning("Seleccione un símbolo (ej: AAPL)");
            return false;
          }
          return true;
        },

        _callAnalysisAPI: function (sSymbol, oStrategyModel, oResultModel) {
          const sStartDate = this._formatDate(
            oStrategyModel.getProperty("/startDate")
          );
          const sEndDate = this._formatDate(
            oStrategyModel.getProperty("/endDate")
          );
          const sSpecs = `SHORT:${oStrategyModel.getProperty(
            "/shortSMA"
          )}&LONG:${oStrategyModel.getProperty("/longSMA")}`;

          const sUrl = `${this._CONSTANTS.API_ENDPOINT}?action=${this._CONSTANTS.SIMULATION_ACTION}&symbol=${sSymbol}&initial_investment=${this._CONSTANTS.DEFAULT_BALANCE}&simulationName=ReversionSimple&startDate=${sStartDate}&endDate=${sEndDate}&rsiPeriod=14&specs=${sSpecs}`;

          fetch(sUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) =>
              response.ok ? response.json() : Promise.reject(response)
            )
            .then((data) =>
              this._handleAnalysisResponse(data, oStrategyModel, oResultModel)
            )
            .catch((error) => {
              console.error("Error:", error);
              MessageBox.error("Error al obtener datos de simulación");
            });
        },

        _handleAnalysisResponse: function (data, oStrategyModel, oResultModel) {
          console.log("Datos recibidos:", data);
          const simulationData = data.value?.[0]?.simulation;
          if (!simulationData) {
            MessageBox.error("No se recibieron datos de simulación válidos.");
            return;
          }
          console.log("Datos para la gráfica:", simulationData?.chart_data);
          console.log("Señales:", simulationData?.signals);

          // Actualizar modelo de resultados
          oResultModel.setData({
            hasResults: true,
            chart_data: this._prepareTableData(
              simulationData?.chart_data || [],
              simulationData?.signals || [],
              simulationData?.signals || [] // Use signals for transactions
            ),
            signals: simulationData?.signals || [],
            result: simulationData?.result || 0, // Use result from simulation data
            simulationName:
              simulationData?.simulationName || "Moving Average Crossover", // keep simulation name
            symbol:
              simulationData?.symbol || oStrategyModel.getProperty("/symbol"), // Get symbol from response
            startDate:
              simulationData?.startDate ||
              oStrategyModel.getProperty("/startDate"),
            endDate:
              simulationData?.endDate || oStrategyModel.getProperty("/endDate"),
          });

          // Actualizar balance
          var currentBalance = oStrategyModel.getProperty("/balance") || 0;
          var realProfit = simulationData?.summary?.realProfit || 0; // Get the realProfit
          var stock = oStrategyModel.getProperty("/stock") || 1;

          oStrategyModel.setProperty("/balance", currentBalance + realProfit);
          MessageToast.show(
            `Se añadieron $${realProfit.toFixed(2)} a tu balance.`
          );
        },

        _prepareTableData: function (aData, aSignals, aTransactions) {
          if (!Array.isArray(aData)) return [];

          const oDateFormat = DateFormat.getDateInstance({
            pattern: "dd/MM/yyyy",
          });
          let currentShares = 0; // Track shares in real-time.

          return aData.map((oItem) => {
            const oDate = oItem.Date ? new Date(oItem.Date) : null; // Use 'Date' from historicalPrices
            const sDateKey = oDate ? oDate.toISOString() : "";

            // Find the signal for this date
            const oSignal = aSignals.find((signal) => {
              const signalDate = signal.date ? new Date(signal.date) : null;
              return signalDate && signalDate.toISOString() === sDateKey;
            });

            // Find the transaction for this date
            const oTransaction = aTransactions.find((transaction) => {
              const transactionDate = transaction.date
                ? new Date(transaction.date)
                : null;
              return (
                transactionDate && transactionDate.toISOString() === sDateKey
              );
            });

            // Update shareholdings based on transactions
            if (oTransaction) {
              currentShares =
                oTransaction.unitsBought !== undefined
                  ? oTransaction.unitsBought
                  : 0;
            }
            return {
              DATE: oDate ? oDateFormat.format(oDate) : "",
              DATE_GRAPH: oDate,
              OPEN: oItem.Open,
              HIGH: oItem.High,
              LOW: oItem.Low,
              CLOSE: oItem.Close,
              VOLUME: oItem.Volume,
              INDICATORS: oItem.Indicators,
              SIGNALS: oSignal?.signal?.toUpperCase() || "-",
              RULES: oSignal?.reasoning || "-",
              SHARES: currentShares.toFixed(4),
            };
          });
        },

        onRefreshChart: function () {
          var oSymbolModel = this.getView().getModel("symbolModel");
          var sCurrentSymbol =
            oSymbolModel.getProperty("/selectedSymbol") ||
            oSymbolModel.getProperty("/symbols")[0]?.symbol;

          if (sCurrentSymbol) {
            this._loadPriceData(sCurrentSymbol);
          } else {
            MessageToast.show("Por favor, seleccione un símbolo.");
          }
        },

        formatDate: function (oDate) {
          if (!oDate) return "";
          return DateFormat.getDateInstance({
            pattern: "dd/MM/yyyy",
          }).format(new Date(oDate));
        },

        formatSignalCount: function (aSignals, sType) {
          if (!Array.isArray(aSignals)) return "0";
          return aSignals.filter((s) => s.signal === sType).length.toString(); // use s.signal
        },

        formatStopLossCount: function (aSignals) {
          if (!Array.isArray(aSignals)) return "0";
          return aSignals
            .filter((s) => s.reasoning?.includes("Stop Loss"))
            .length.toString(); // Check for "Stop Loss"
        },

        formatSignalState: function (sType) {
          return sType === "BUY" ? "Success" : "Error"; //check against "BUY"
        },

        formatCurrency: function (value) {
          if (!value) return "$0.00";
          return `$${parseFloat(value).toFixed(2)}`;
        },

        formatSignalPrice: function (value) {
          if (!value) return "";
          return `$${parseFloat(value).toFixed(2)}`;
        },
        onDataPointSelect: function (oEvent) {
          const oData = oEvent.getParameter("data");
          if (!oData || oData.length === 0) return;

          const oSelectedData = oData[0].data;
          if (
            oSelectedData &&
            oSelectedData.DATE &&
            oSelectedData.CLOSE !== undefined
          ) {
            this.getView().getModel("viewModel").setProperty("/selectedPoint", {
              DATE: oSelectedData.DATE,
              CLOSE: oSelectedData.CLOSE,
            });
          }
        },
      }
    );
  }
);
