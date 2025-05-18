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
    "sap/ui/core/Item",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    DateFormat,
    MessageBox,
    VizFrame,
    FlattenedDataset,
    FeedItem,
    Item
  ) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.investments.Investments",
      {
        _oResourceBundle: null,
        _bSidebarExpanded: true,
        _sSidebarOriginalSize: "380px",
        oModel: null,

        onInit: function () {
          this._initSymbolModel();
          this._initStrategyResultModel();
          this.getView().addEventDelegate({
            onAfterRendering: this._onViewAfterRendering.bind(this),
          });
          this._initViewModel();
          this._initStrategyAnalysisModel();
          this._setDefaultDates();
          this._loadResourceBundle();
          this._setSidebarOriginalSize();
        },

        _initStrategyResultModel: function () {
          const initialResultData = {
            tableData: [],
            signal: null,
            rule: null,
            result: null,
            historicalPrices: [],
            chart_data: [],
            hasResults: false,
            date_from: null,
            date_to: null,
            moving_averages: { short: null, long: null },
            signals: [],
            busy: false,
          };
          this.oModel = new JSONModel(initialResultData);
          this.getView().setModel(this.oModel, "strategyResultModel");
        },

        _initViewModel: function () {
          var oViewModel = new JSONModel({
            selectedTab: "table",
            selectedPoint: null,
          });
          this.getView().setModel(oViewModel, "viewModel");
        },

        _initStrategyAnalysisModel: function () {
          var oStrategyAnalysisModelData = {
            balance: 1000,
            stock: 1,
            strategyKey: "",
            longSMA: 200,
            shortSMA: 50,
            simpleRSI: 14,
            startDate: null,
            endDate: null,
            controlsVisible: false,
            maControlsVisible: true,
            rsiControlVisible: false,
            stockControlVisible: true,
            strategies: [
              { key: "", text: "Seleccione una estrategia..." },
              { key: "MACrossover", text: "Cargando textos..." },
              { key: "ReversionSimple", text: "Cargando textos..." },
            ],
          };
          var oStrategyAnalysisModel = new JSONModel(
            oStrategyAnalysisModelData
          );
          this.getView().setModel(
            oStrategyAnalysisModel,
            "strategyAnalysisModel"
          );
        },

        _loadResourceBundle: function () {
          var oI18nModel = this.getOwnerComponent().getModel("i18n");
          if (oI18nModel) {
            try {
              var oResourceBundle = oI18nModel.getResourceBundle();
              if (
                oResourceBundle &&
                typeof oResourceBundle.getText === "function"
              ) {
                this._oResourceBundle = oResourceBundle;
                this._updateStrategyOptions();
                console.log("Textos de i18n cargados correctamente.");
              } else {
                throw new Error("ResourceBundle no válido");
              }
            } catch (error) {
              console.error("Error al cargar ResourceBundle:", error);
              this._setDefaultStrategyOptions();
            }
          } else {
            console.error(
              "Modelo i18n no encontrado. Usando textos por defecto."
            );
            this._setDefaultStrategyOptions();
          }
        },

        _updateStrategyOptions: function () {
          var oStrategyAnalysisModel = this.getView().getModel(
            "strategyAnalysisModel"
          );
          oStrategyAnalysisModel.setProperty("/strategies", [
            {
              key: "",
              text: this._oResourceBundle.getText("selectStrategyPlaceholder"),
            },
            {
              key: "MACrossover",
              text: this._oResourceBundle.getText(
                "movingAverageCrossoverStrategy"
              ),
            },
            {
              key: "ReversionSimple",
              text: this._oResourceBundle.getText("simpleReversionStrategy"),
            },
          ]);
        },

        _setDefaultStrategyOptions: function () {
          var oStrategyAnalysisModel = this.getView().getModel(
            "strategyAnalysisModel"
          );
          oStrategyAnalysisModel.setProperty("/strategies", [
            {
              key: "",
              text: "Error i18n: Seleccione...",
            },
            { key: "MACrossover", text: "Error i18n: Cruce Medias..." },
            { key: "ReversionSimple", text: "No i18n/Error: Reversión Simple" },
          ]);
        },

        _setSidebarOriginalSize: function () {
          var oSidebarLayoutData = this.byId("sidebarLayoutData");
          if (oSidebarLayoutData) {
            this._sSidebarOriginalSize = oSidebarLayoutData.getSize();
          } else {
            var oSidebarVBox = this.byId("sidebarVBox");
            if (oSidebarVBox && oSidebarVBox.getLayoutData()) {
              this._sSidebarOriginalSize = oSidebarVBox
                .getLayoutData()
                .getSize();
            }
          }
        },

        onTabSelect: function (oEvent) {
          var sKey = oEvent.getParameter("key");
          this.getView()
            .getModel("viewModel")
            .setProperty("/selectedTab", sKey);
        },

        _onViewAfterRendering: function () {
          this._configureChart();
        },

        _initSymbolModel: function () {
          const oSymbolModel = new JSONModel({
            symbols: [
              { symbol: "TSLA", name: "Tesla" },
              { symbol: "AAPL", name: "Apple" },
              { symbol: "MSFT", name: "Microsoft" },
              { symbol: "IBM", name: "IBM" },
            ],
          });
          this.getView().setModel(oSymbolModel, "symbolModel");
        },

        _transformDataForVizFrame: function (aApiData) {
          if (!aApiData || !Array.isArray(aApiData)) {
            return [];
          }
          return aApiData.map((oItem) => {
            let dateValue = oItem.date || oItem.DATE;
            let closeValue = parseFloat(oItem.close || oItem.CLOSE);
            if (isNaN(closeValue)) closeValue = null;

            return {
              DATE: dateValue,
              OPEN: parseFloat(oItem.open) || null,
              HIGH: parseFloat(oItem.high) || null,
              LOW: parseFloat(oItem.low) || null,
              CLOSE: closeValue,
              VOLUME: parseFloat(oItem.volume) || null,
            };
          });
        },

        _configureChart: function () {
          const oVizFrame = this.byId("idVizFrame");
          if (!oVizFrame) {
            console.warn(
              "Función _configureChart: VizFrame con ID 'idVizFrame' no encontrado en este punto del ciclo de vida."
            );
            return;
          }

          oVizFrame.setVizProperties({
            plotArea: {
              dataLabel: { visible: false },
              window: {
                start: null,
                end: null,
              },
            },
            valueAxis: {
              title: { text: "Precio de Cierre (USD)" },
            },
            timeAxis: {
              title: { text: "Fecha" },
              levels: ["day", "month", "year"],
              label: {
                formatString: "dd/MM/yy",
              },
            },
            title: {
              text: "Histórico de Precios de Acciones",
            },
            legend: {
              visible: true,
            },
            toolTip: {
              visible: true,
              formatString: "#,##0.00",
            },
            interaction: {
              zoom: {
                enablement: "enabled",
              },
              selectability: {
                mode: "single",
              },
            },
          });
        },

        _setDefaultDates: function () {
          var oStrategyAnalysisModel = this.getView().getModel(
            "strategyAnalysisModel"
          );
          var oToday = new Date();
          oStrategyAnalysisModel.setProperty("/endDate", new Date(oToday));
          var oStartDate = new Date(oToday);
          oStartDate.setMonth(oStartDate.getMonth() - 6);
          oStrategyAnalysisModel.setProperty(
            "/startDate",
            new Date(oStartDate)
          );
        },

        onStrategyChange: function (oEvent) {
          var oStrategyAnalysisModel = this.getView().getModel(
            "strategyAnalysisModel"
          );
          var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
          oStrategyAnalysisModel.setProperty(
            "/controlsVisible",
            !!sSelectedKey
          );

          if (sSelectedKey === "ReversionSimple") {
            oStrategyAnalysisModel.setProperty("/maControlsVisible", false);
            oStrategyAnalysisModel.setProperty("/rsiControlVisible", true);
            oStrategyAnalysisModel.setProperty("/stockControlVisible", false);
          } else if (sSelectedKey === "MACrossover") {
            oStrategyAnalysisModel.setProperty("/maControlsVisible", true);
            oStrategyAnalysisModel.setProperty("/rsiControlVisible", false);
            oStrategyAnalysisModel.setProperty("/stockControlVisible", true);
          } else {
            oStrategyAnalysisModel.setProperty("/maControlsVisible", false);
            oStrategyAnalysisModel.setProperty("/rsiControlVisible", false);
            oStrategyAnalysisModel.setProperty("/stockControlVisible", true);
          }
          oStrategyAnalysisModel.setProperty("/strategyKey", sSelectedKey);
        },

        onRunAnalysisPress: function () {
          var oView = this.getView();
          var oStrategyModel = oView.getModel("strategyAnalysisModel");
          var oResultModel = this.oModel;
          var oAnalysisPanel =
            this.byId("strategyAnalysisPanelTable")?.byId(
              "strategyAnalysisPanel"
            ) ||
            this.byId("strategyAnalysisPanelChart")?.byId(
              "strategyAnalysisPanel"
            );
          var oResultPanel =
            this.byId("strategyResultPanel") ||
            sap.ui.core.Fragment.byId("strategyResultPanel");
          var sSymbol = oView.byId("symbolSelector").getSelectedKey();

          if (!oStrategyModel.getProperty("/strategyKey")) {
            MessageBox.warning("Seleccione una estrategia");
            return;
          }
          if (!sSymbol) {
            MessageBox.warning("Seleccione un símbolo (ej: AAPL)");
            return;
          }

          const sRSIValue = oStrategyModel.getProperty("/simpleRSI");
          const iRSIValue = parseFloat(sRSIValue);

          if (
            oStrategyModel.getProperty("/strategyKey") === "ReversionSimple" &&
            (isNaN(iRSIValue) || iRSIValue <= 0)
          ) {
            MessageBox.warning(
              "Por favor, ingrese un valor RSI válido (número mayor que 0)."
            );
            return;
          }

          const startDate = oStrategyModel.getProperty("/startDate");
          const endDate = oStrategyModel.getProperty("/endDate");
          if (startDate && endDate && startDate > endDate) {
            MessageBox.warning(
              "La fecha de inicio debe ser anterior a la fecha de fin."
            );
            return;
          }

          if (oAnalysisPanel) {
            oAnalysisPanel.setExpanded(false);
          }
          if (oResultPanel) {
            oResultPanel.setExpanded(true);
          }

          let sStrategyPath = "macrossover";
          let rsiPeriod = iRSIValue;
          let shortSMA = oStrategyModel.getProperty("/shortSMA");
          let longSMA = oStrategyModel.getProperty("/longSMA");
          let startDateFormatted = this._formatDate(startDate);
          let endDateFormatted = this._formatDate(endDate);
          let initialInvestment = 30000;
          let simulationName = oStrategyModel.getProperty("/strategyKey");

          if (oStrategyModel.getProperty("/strategyKey") === "MACrossover") {
            sStrategyPath = "macrossover";
          } else if (
            oStrategyModel.getProperty("/strategyKey") === "ReversionSimple"
          ) {
            sStrategyPath = "reversionsimple";
          }

          let fetchUrl = `http://localhost:4004/api/inv/crudSimulation?action=post&symbol=${sSymbol}&initial_investment=${initialInvestment}&simulationName=${simulationName}&startDate=${startDateFormatted}&endDate=${endDateFormatted}`;
          if (sStrategyPath === "reversionsimple") {
            fetchUrl += `&rsiPeriod=${rsiPeriod}`;
          } else if (sStrategyPath === "macrossover") {
            fetchUrl += `&shortSMA=${shortSMA}&longSMA=${longSMA}`;
          }

          console.log("URL de Fetch:", fetchUrl);

          oResultModel.setProperty("/busy", true);

          fetch(fetchUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              console.log("Respuesta de la API:", response);
              if (!response.ok) {
                return response.text().then((text) => {
                  throw new Error(
                    `Error de la API: ${response.status} - ${text}`
                  );
                });
              }
              return response.json();
            })
            .then((data) => {
              console.log("Datos recibidos:", data);

              const historicalPrices =
                data.value?.[0]?.simulation?.historicalPrices || [];

              const simulationData = data.value?.[0]?.simulation;

              oResultModel.setProperty("/hasResults", true);
              oResultModel.setProperty("/result", simulationData.result || 0);
              oResultModel.setProperty("/historicalPrices", historicalPrices);
              oResultModel.setProperty(
                "/chart_data",
                this._prepareTableData(historicalPrices)
              );

              oResultModel.setProperty("/date_from", simulationData.startDate);
              oResultModel.setProperty("/date_to", simulationData.endDate);
              oResultModel.setProperty(
                "/signal",
                simulationData?.specs || null
              );

              if (simulationData?.simulationName === "ReversionSimple") {
                oResultModel.setProperty("/moving_averages", {
                  short:
                    simulationData?.rsiPeriod ||
                    oStrategyModel.getProperty("/simpleRSI") ||
                    null,
                  long: null,
                });
              } else {
                oResultModel.setProperty("/moving_averages", {
                  short:
                    simulationData?.shortSMA ||
                    oStrategyModel.getProperty("/shortSMA") ||
                    null,
                  long:
                    simulationData?.longSMA ||
                    oStrategyModel.getProperty("/longSMA") ||
                    null,
                });
              }

              oResultModel.setProperty("/signals", []);
              this._updateChart(historicalPrices);
              MessageToast.show("Datos de precios cargados.");
            })
            .catch((error) => {
              console.error("Error:", error);
              MessageBox.error(
                "Error al obtener datos de simulación: " + error.message
              );
            })
            .finally(() => {
              oResultModel.setProperty("/busy", false);
            });
        },

        _formatDate: function (oDate) {
          return oDate
            ? DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(
                oDate
              )
            : null;
        },

        _prepareTableData: function (aData) {
          if (!Array.isArray(aData)) {
            console.warn("_prepareTableData: Input is not an array:", aData);
            return [];
          }

          const preparedData = aData.map((oItem) => {
            const formattedItem = {
              DATE: oItem.date || null,
              OPEN: oItem.open || null,
              HIGH: oItem.high || null,
              LOW: oItem.low || null,
              CLOSE: oItem.close || null,
              VOLUME: oItem.volume || null,
              INDICATORS: oItem.indicators || "",
              SIGNALS: oItem.signal || "Esperar",
              RULES: oItem.rules || " ",
              SHARES: oItem.shares || 0,
            };
            return formattedItem;
          });
          return preparedData;
        },

        _updateChart: function (aHistoricalPrices) {
          const oVizFrame = this.byId("idVizFrame");
          if (!oVizFrame) {
            return;
          }

          try {
            if (oVizFrame.getDataset()) {
              oVizFrame.getDataset().destroy();
            }
            if (typeof oVizFrame.removeAllFeedItems === "function") {
              oVizFrame.removeAllFeedItems();
            } else if (typeof oVizFrame.destroyFeeds === "function") {
              oVizFrame.destroyFeeds();
            }
          } catch (error) {
            console.error("Error cleaning VizFrame:", error);
          }

          const oDataset = new FlattenedDataset({
            data: {
              path: "/chart_data",
            },
            dimensions: [
              {
                name: "Fecha",
                value: "{DATE}",
                dataType: "date",
              },
            ],
            measures: [
              { name: "Open", value: "{OPEN}" },
              { name: "High", value: "{HIGH}" },
              { name: "Low", value: "{LOW}" },
              { name: "Close", value: "{CLOSE}" },
              { name: "Volume", value: "{VOLUME}" },
            ],
          });

          oVizFrame.setDataset(oDataset);

          const oModel = this.oModel;
          oVizFrame.setModel(oModel);
          oVizFrame.setVizType("line");

          const aFeedItems = [
            new FeedItem({
              uid: "timeAxis",
              type: "Dimension",
              values: ["Fecha"],
            }),
            new FeedItem({
              uid: "valueAxis",
              type: "Measure",
              values: ["Close"],
            }),
            new FeedItem({
              uid: "valueAxis",
              type: "Measure",
              values: ["Open"],
            }),
            new FeedItem({
              uid: "valueAxis",
              type: "Measure",
              values: ["High"],
            }),
            new FeedItem({
              uid: "valueAxis",
              type: "Measure",
              values: ["Low"],
            }),
          ];

          aFeedItems.forEach((oItem) => {
            if (typeof oVizFrame.addFeedItem === "function") {
              oVizFrame.addFeedItem(oItem);
            } else if (typeof oVizFrame.addFeed === "function") {
              oVizFrame.addFeed(oItem);
            } else {
              console.error(
                "VizFrame no soporta addFeedItem ni addFeed. La gráfica puede no mostrarse correctamente."
              );
            }
          });
        },

        _insertDataIntoTable: function (aData, oTable) {
          if (!oTable) {
            console.error("No se encontró la tabla con el ID 'resultsTable'");
            return;
          }
          oTable.removeAllItems();

          if (!aData || aData.length === 0) {
            const oNoDataText = new sap.m.Text({ text: "No data available" });
            const oNoDataRow = new sap.m.ColumnListItem({
              cells: [oNoDataText],
            });
            oTable.addItem(oNoDataRow);
            return;
          }

          aData.forEach((itemData) => {
            const oRow = new sap.m.ColumnListItem({
              cells: [
                new sap.m.Text({ text: itemData.DATE }),
                new sap.m.Text({ text: itemData.OPEN }),
                new sap.m.Text({ text: itemData.HIGH }),
                new sap.m.Text({ text: itemData.LOW }),
                new sap.m.Text({ text: itemData.CLOSE }),
                new sap.m.Text({ text: itemData.VOLUME }),
                new sap.m.Text({ text: itemData.INDICATORS || "" }),
                new sap.m.Text({ text: itemData.SIGNALS || "Esperar" }),
                new sap.m.Text({ text: itemData.RULES || " " }),
                new sap.m.Text({ text: itemData.SHARES || 0 }),
              ],
            });
            oTable.addItem(oRow);
          });
        },

        _formatDateForTable: function (sDate) {
          if (!sDate) return "";
          const oDateFormat = DateFormat.getDateInstance({
            pattern: "dd/MM/yyyy",
          });
          return oDateFormat.format(new Date(sDate));
        },

        onDataPointSelect: function (oEvent) {
          const oData = oEvent.getParameter("data");
          console.log("Datos seleccionados:", oData);

          if (oData && oData.length > 0) {
            const oSelectedData = oData[0];
            console.log("Datos del punto seleccionado:", oSelectedData);

            const sFecha = oSelectedData.data.DATE;
            const fPrecioCierre = oSelectedData.data.CLOSE;

            if (sFecha && fPrecioCierre !== undefined) {
              const oViewModel = this.getView().getModel("viewModel");
              oViewModel.setProperty("/selectedPoint", {
                DATE: sFecha,
                CLOSE: fPrecioCierre,
              });
            } else {
              console.warn(
                "Los datos seleccionados no contienen DATE o CLOSE."
              );
            }
          } else {
            console.warn("No se seleccionaron datos.");
          }
        },

        updateStrategyResultModel: function (controller, apiData) {
          if (
            !controller ||
            !apiData ||
            !apiData.value ||
            apiData.value.length === 0
          ) {
            console.error("Error: Controlador o datos de la API inválidos.");
            return;
          }

          const simulationData = apiData.value[0].simulation;

          if (!simulationData) {
            console.error(
              "Error: No se encontró la simulación en los datos de la API."
            );
            return;
          }

          const modelData = {
            hasResults: true,
            date_from: simulationData.startDate,
            date_to: simulationData.endDate,
            moving_averages: {
              short: null,
              long: null,
            },
            signal: null,
            result: simulationData.result,
            signals: [],
            busy: false,
          };

          const historicalPrices = simulationData.historicalPrices || [];
          modelData.chart_data = controller._prepareTableData(historicalPrices);
          modelData.historicalPrices = historicalPrices;

          controller.oModel.setData(modelData);
          controller.oModel.refresh(true);
        },
      }
    );
  }
);
