sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "jquery"
], function (BaseController, JSONModel, MessageBox, MessageToast, Filter, Fragment, FilterOperator, $) {
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.catalogs.Values", {
        // Método de inicialización del controlador
        onInit: function () {
            // Modelo para los valores
            this.getView().setModel(new JSONModel({
                values: [],
                selectedValue: null
            }), "values");
            this.getView().setModel(new JSONModel({
                values: [],       // Datos de la tabla
                selectedValueIn: null  // 🔥 Para controlar los botones
            }), "values");

            // Modelo para los datos del formulario
            this.getView().setModel(new JSONModel({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            }), "newValueModel");
        },

        // Método para cargar los valores en el modelo
        loadValues: function (aValues) {
            this.getView().getModel("values").setProperty("/values", aValues || []);
        },
        
        // Método para abrir el diálogo de selección de valores
        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oSelectedData = oItem.getBindingContext("values").getObject();
            // Actualiza el modelo newValueModel con los datos seleccionados
            this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: oSelectedData.VALUEID,
                VALUE: oSelectedData.VALUE,
                VALUEPAID: oSelectedData.VALUEPAID,
                ALIAS: oSelectedData.ALIAS,
                IMAGE: oSelectedData.IMAGE,
                DESCRIPTION: oSelectedData.DESCRIPTION
            });

            // Activa el modo de edición
            this.getView().getModel("values").setProperty("/selectedValueIn", true);
        },

        // Método para esditar el nuevo valor
        onEditValue: function () {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oValuesModel = oView.getModel("values");

            // Obtener datos del formulario
            var oFormData = oNewValueModel.getData();
            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");
            var oAddValueModel = oView.getModel("addValueModel");
            var oAddData = oAddValueModel.getData(); // Datos del modelo de edición
            var sFinalValuePaid1 = oAddData.VALUEPAID1 ? oAddData.VALUEPAID1 : "";

            // Validaciones
            if (!oFormData.VALUEID || !oFormData.VALUE || !oFormData.DESCRIPTION) {
                MessageToast.show("VALUEID, VALUE y DESCRIPTION son campos obligatorios.");
                return;
            }

            // Obtener la opción seleccionada del ComboBox
            var sSelectedValuePaid2 = this.byId("valuePaidComboBox2").getSelectedKey();

            // Si hay una selección, usarla; si no, mantener el valor original
            var sFinalValuePaid = sSelectedValuePaid2 ? sSelectedValuePaid2 : oFormData.VALUEPAID;

            if(sSelectedValuePaid2 !== ""){
                // Construir objeto con todos los parámetros
                var oParams = {
                    LABELID: oSelectedCatalog.LABELID,
                    VALUEPAID: `${sFinalValuePaid1}-${sFinalValuePaid}`,
                    VALUEID: oFormData.VALUEID,
                    VALUE: oFormData.VALUE,
                    ALIAS: oFormData.ALIAS || "",
                    IMAGE: oFormData.IMAGE || "",
                    DESCRIPTION: oFormData.DESCRIPTION || "",
                    DETAIL_ROW: [{ ACTIVED: true, DELETED: false }]
                };
            }else{
                var oParams = {
                    LABELID: oSelectedCatalog.LABELID,
                    VALUEPAID: sFinalValuePaid,
                    VALUEID: oFormData.VALUEID,
                    VALUE: oFormData.VALUE,
                    ALIAS: oFormData.ALIAS || "",
                    IMAGE: oFormData.IMAGE || "",
                    DESCRIPTION: oFormData.DESCRIPTION || "",
                    DETAIL_ROW: [{ ACTIVED: true, DELETED: false }]
                };
            }
            // Configurar llamada AJAX con POST
            oView.setBusy(true);
            console.log("Valor de VALUEPAID2:", sFinalValuePaid);
            $.ajax({
                url: `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=update&valueid=${oFormData.VALUEID}`,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ values: oParams }),
                success: function () {
                    oView.setBusy(false);
                    MessageToast.show("Valor actualizado correctamente.");

                    // Actualizar el modelo directamente
                    var currentValues = oValuesModel.getProperty("/values") || [];
                    var updatedIndex = currentValues.findIndex(item => item.VALUEID === oFormData.VALUEID);

                    if(sSelectedValuePaid2 !== ""){
                        if (updatedIndex !== -1) {
                            currentValues[updatedIndex] = {
                                ...currentValues[updatedIndex],
                                VALUEPAID: `${sFinalValuePaid1}-${sFinalValuePaid}`,
                                VALUE: oFormData.VALUE,
                                ALIAS: oFormData.ALIAS,
                                IMAGE: oFormData.IMAGE,
                                DESCRIPTION: oFormData.DESCRIPTION
                            };
                            oValuesModel.setProperty("/values", currentValues);
                            oValuesModel.refresh();
                        }
                }else{
                    if (updatedIndex !== -1) {
                            currentValues[updatedIndex] = {
                                ...currentValues[updatedIndex],
                                VALUEPAID: sFinalValuePaid,
                                VALUE: oFormData.VALUE,
                                ALIAS: oFormData.ALIAS,
                                IMAGE: oFormData.IMAGE,
                                DESCRIPTION: oFormData.DESCRIPTION
                            };
                            oValuesModel.setProperty("/values", currentValues);
                            oValuesModel.refresh();
                        }
                }
                    // Cerrar diálogo
                    this.byId("editDialogValue").close();
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al actualizar: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                }.bind(this)
            });
        },
        
        // Método para guardar un nuevo valor
        onSaveValues: function () {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oValuesModel = oView.getModel("values");

            // Obtener datos del formulario
            var oAddValueModel = oView.getModel("addValueModel");
            var oFormData = oNewValueModel.getData(); // Lo mantienes para los otros campos
            var oAddData = oAddValueModel.getData();  // Para los VALUEPAID

            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");

            // Validaciones
            if (!oFormData.VALUEID || !oFormData.VALUE || !oFormData.DESCRIPTION) {
                MessageToast.show("VALUEID, VALUE y DESCRIPTION son campos obligatorios");
                return;
            }

            const validLabels = [
                "IdApplications",
                "IdViews",
                "IdProcesses",
                "IdRoles",
                "IdPrivileges",
            ];
            console.log("VALUEPAID", oAddData.VALUEPAID1);
            console.log("VALUEPAID2", oAddData.VALUEPAID2);
            // Objeto para enviar
            var oParams = {
                COMPANYID: 0,
                CEDIID: 0,
                LABELID: oSelectedCatalog.LABELID || "", // Previene errores si no hay catálogo seleccionado
                VALUEPAID:  oAddData.VALUEPAID1 && oAddData.VALUEPAID2
                ? `${oAddData.VALUEPAID1}-${oAddData.VALUEPAID2}`
                : "",
                VALUEID: oFormData.VALUEID,
                VALUE: oFormData.VALUE,
                ALIAS: oFormData.ALIAS || "",
                SEQUENCE: oSelectedCatalog?.SEQUENCE || 2,
                IMAGE: oFormData.IMAGE || "",
                VALUESAPID: "",
                DESCRIPTION: oFormData.DESCRIPTION || "",
                ROUTE: "",
                DETAIL_ROW:[ {
                    ACTIVED: true,
                    DELETED: false,
                    DETAIL_ROW_REG: []
                }],
                
            };
            console.log("Datos enviados al backend:", JSON.stringify(oParams, null, 2));

             // Definir la variable que tomará el valor anterior
            var parentLabel = "";

            // Si LABELID está en validLabels y no es "IdApplications", obtener el anterior
            if (validLabels.includes(oFormData.LABELID) && oFormData.LABELID !== "IdApplications") {
                const index = validLabels.indexOf(oFormData.LABELID);
                parentLabel = index > 0 ? validLabels[index - 1] : "";
            }
            // Configurar llamada AJAX con POST y asegurarse de que los datos se envíen correctamente
            oView.setBusy(true);

            $.ajax({
                url: `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=create`,
                method: "POST",
                contentType: "application/json", // Asegura que el servidor reciba JSON
                data: JSON.stringify({values: oParams}), // Envía los datos en formato JSON
                success: function (response) {
                    oView.setBusy(false);
                    MessageToast.show("Valor guardado correctamente");

                    // Actualizar el modelo directamente
                    var currentValues = oValuesModel.getProperty("/values") || [];
                    currentValues.push({
                        VALUEID: oFormData.VALUEID,
                        VALUE: oFormData.VALUE,
                        VALUEPAID: oAddData.VALUEPAID1 && oAddData.VALUEPAID2
                        ? `${oAddData.VALUEPAID1}-${oAddData.VALUEPAID2}`
                        : "",
                        ALIAS: oFormData.ALIAS,
                        IMAGE: oFormData.IMAGE,
                        DESCRIPTION: oFormData.DESCRIPTION,
                        DETAIL_ROW: {
                            ACTIVED: true,
                            DELETED: false
                        }
                    });

                    console.log("Datos", currentValues);
                    oValuesModel.setProperty("/values", currentValues);

                    // Limpiar los campos después de guardar
                    oNewValueModel.setData({
                        VALUEID: "",
                        VALUE: "",
                        VALUEPAID: "",
                        ALIAS: "",
                        IMAGE: "",
                        DESCRIPTION: ""
                    });


                    // Cerrar diálogo correctamente
                    this.byId("addValueDialog").close(); // Usa el ID del fragmento si aplica
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al guardar: " +
                        (error.responseJSON?.error?.message || "Error en el servidor"));
                }
            });
        },

        //Filtrado de VALUES
        onFilterChange: function (oEvent) {
            var sQuery = oEvent.getSource().getValue(); // Captura el texto de búsqueda desde el campo correcto
            var oTable = this.byId("valuesTable"); // Referencia a la tabla
            var aItems = oTable.getItems(); // Obtiene los registros de la tabla

            if (!sQuery) {
                //Si la búsqueda está vacía, se restauran todos los valores
                aItems.forEach(function (oItem) {
                    oItem.setVisible(true);
                });
                return;
            }

            //Filtrar por cualquier campo en la tabla
            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("values"); 
                if (!oContext) return;

                var oData = oContext.getObject();
                var bVisible = Object.keys(oData).some(function (sKey) {
                    var value = oData[sKey];

                    if (typeof value === "string") {
                        return value.toLowerCase().includes(sQuery.toLowerCase());
                    } else if (typeof value === "number") {
                        return value.toString().includes(sQuery);
                    } else if (typeof value === "boolean") {
                        return (value ? "activo" : "inactivo").includes(sQuery.toLowerCase());
                    }

                    return false;
                });

                oItem.setVisible(bVisible);
            });
        },

        /*_loadValuesByLabel: function(sLabelID) {
            var oView = this.getView();
            
            $.ajax({
                url: "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/sec/valuesCRUD?procedure=get&labelID=" + encodeURIComponent(sLabelID),
                method: "GET",
                success: function(data) {
                    oView.getModel("values").setProperty("/values", data.value || []);
                }.bind(this),
                error: function(error) {
                    MessageToast.show("Error al cargar valores");
                    console.error("Error loading values:", error);
                }
            });
        },*/
        
        // StatusValueDecline: function () {
        //     this.StatusValue(false, true, "delete");
        // },

        //Borrado logico
        StatusValueDecline: function () {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oFormData = oNewValueModel.getData(); // Aquí obtenemos los datos del value correctamente

            // Validación: Verificar si el value tiene un VALUEID
            if (!oFormData || !oFormData.VALUEID) {
                console.log("Error: No se encontró VALUEID en oFormData.", oFormData);
                MessageToast.show("Por favor, seleccione un value antes de desactivar.");
                return;
            }

            console.log("VALUEID correcto para desactivar:", oFormData.VALUEID);

            // Construir la URL para la desactivación
            var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=false&valueid=${oFormData.VALUEID}`;

            // Configurar la petición AJAX para desactivar el value
            oView.setBusy(true);
            $.ajax({
                url: sUrl,
                method: "POST",
                success: function () {
                    oView.setBusy(false);
                    MessageToast.show("Value desactivado correctamente.");

                    // Actualizar el modelo para reflejar el cambio en la interfaz
                    var oValuesModel = oView.getModel("values");
                    var currentValues = oValuesModel.getProperty("/values") || [];
                    var updatedIndex = currentValues.findIndex(item => item.VALUEID === oFormData.VALUEID);
                    
                    if (updatedIndex !== -1) {
                        currentValues[updatedIndex].DETAIL_ROW.ACTIVED = false;
                        oValuesModel.setProperty("/values", currentValues);
                        oValuesModel.refresh();
                    }
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al desactivar: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                }.bind(this)
            });
        },


        // StatusValueAccept: function () {
        //     this.StatusValue(true, false, "actived");
        // },

        StatusValueAccept: function () {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel"); 
            var oFormData = oNewValueModel.getData(); // Aquí obtenemos el VALUEID correctamente

            // Validación: Verificar si el value tiene un VALUEID
            if (!oFormData || !oFormData.VALUEID) {
                console.log("Error: No se encontró VALUEID en oFormData.", oFormData);
                MessageToast.show("Por favor, seleccione un value antes de activar.");
                return;
            }

            console.log("VALUEID correcto para activar:", oFormData.VALUEID);

            // Construir la URL para la activación
            var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=activar&valueid=${oFormData.VALUEID}`;

            // Configurar la petición AJAX para activar el value
            oView.setBusy(true);
            $.ajax({
                url: sUrl,
                method: "POST",
                success: function () {
                    oView.setBusy(false);
                    MessageToast.show("Value activado correctamente.");

                    // Actualizar el modelo para reflejar el cambio en la interfaz
                    var oValuesModel = oView.getModel("values");
                    var currentValues = oValuesModel.getProperty("/values") || [];
                    var updatedIndex = currentValues.findIndex(item => item.VALUEID === oFormData.VALUEID);

                    if (updatedIndex !== -1) {
                        currentValues[updatedIndex].DETAIL_ROW.ACTIVED = true;
                        currentValues[updatedIndex].DETAIL_ROW.DELETED = false;
                        oValuesModel.setProperty("/values", currentValues);
                        oValuesModel.refresh();
                    }
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al activar: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                }.bind(this)
            });
        },

       

        onDeleteValue: function () {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oValuesModel = oView.getModel("values");

            // Obtener datos del formulario
            var oFormData = oNewValueModel.getData();

            // Validaciones
            if (!oFormData || !oFormData.VALUEID) {
                console.log("Error: No se encontró VALUEID en oFormData.", oFormData);
                MessageToast.show("Por favor, seleccione un value antes de eliminar.");
                return;
            }

            console.log("VALUEID correcto para eliminar:", oFormData.VALUEID);

            // Mensaje de confirmación antes de eliminar
            MessageBox.confirm("¿Está seguro de eliminar este value?", {
                title: "Confirmar Eliminación",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // ✅ Si el usuario presiona "OK", ejecuta la eliminación
                        oView.setBusy(true);

                        $.ajax({
                            url: `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=fisic&valueid=${oFormData.VALUEID}`,
                            method: "POST",
                            success: function () {
                                oView.setBusy(false);
                                MessageToast.show("Valor eliminado correctamente.");

                                // Actualizar el modelo directamente
                                var currentValues = oValuesModel.getProperty("/values") || [];
                                var filteredValues = currentValues.filter(item => item.VALUEID !== oFormData.VALUEID);
                                oValuesModel.setProperty("/values", filteredValues);
                                oValuesModel.refresh();

                                this._cleanModels();
                            }.bind(this),
                            error: function (error) {
                                oView.setBusy(false);
                                MessageToast.show("Error al eliminar: " +
                                    (error.responseJSON?.error?.message || "Error en el servidor"));
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
        },
        
        onChangeValue: function () {
            var oView = this.getView();
            var oValuesModel = oView.getModel("values");
            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");

            if (!oSelectedCatalog) {
                MessageToast.show("Por favor, seleccione un valor antes de editar.");
                return;
            }

            // Identificar el LABELID padre para el ComboBox
            const validLabels = ["IdApplications", "IdViews", "IdProcesses", "IdRoles", "IdPrivileges"];
            var parentLabel = "";
            if (validLabels.includes(oSelectedCatalog.LABELID) && oSelectedCatalog.LABELID !== "IdApplications") {
                const index = validLabels.indexOf(oSelectedCatalog.LABELID);
                parentLabel = index > 0 ? validLabels[index - 1] : "";
            }

            var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=${parentLabel}`;
            var that = this;

            // Llamada AJAX para obtener opciones del ComboBox
            $.ajax({
                url: sUrl,
                method: "POST",
                success: function (data) {
                    var aValues = data.value || [];
                    var aComboBoxItems = aValues.map(item => ({ key: item.VALUEID, text: item.VALUEID }));

                    if (validLabels.includes(oSelectedCatalog.LABELID) && oSelectedCatalog.LABELID !== "IdApplications") {
                        // Crear el modelo con los valores del ComboBox y la información del Value
                        var oEditModel = new JSONModel({
                            LABELID: oSelectedCatalog.LABELID,
                            VALUEPAID1: parentLabel,
                            VALUEPAID2: oSelectedCatalog.VALUEPAID, // Preseleccionar el existente
                            ComboBoxItems: aComboBoxItems, // Rellenar opciones del ComboBox
                            VALUEID: oSelectedCatalog.VALUEID,
                            VALUE: oSelectedCatalog.VALUE,
                            ALIAS: oSelectedCatalog.ALIAS,
                            IMAGE: oSelectedCatalog.IMAGE,
                            DESCRIPTION: oSelectedCatalog.DESCRIPTION,
                            DETAIL_ROW: { ACTIVED: true, DELETED: false }
                        });
                }else{
                        var oEditModel = new JSONModel({
                            LABELID: oSelectedCatalog.LABELID,
                            VALUEPAID1: parentLabel,
                            VALUEPAID2: "", // Rellenar opciones del ComboBox
                            VALUEID: oSelectedCatalog.VALUEID,
                            VALUE: oSelectedCatalog.VALUE,
                            ALIAS: oSelectedCatalog.ALIAS,
                            IMAGE: oSelectedCatalog.IMAGE,
                            DESCRIPTION: oSelectedCatalog.DESCRIPTION,
                            DETAIL_ROW: { ACTIVED: true, DELETED: false }
                        });
                }
                    // Asignar el modelo a la vista
                    that.getView().setModel(oEditModel, "addValueModel");

                    // Abrir el diálogo de edición
                    if (!that._oEditDialog) {
                        Fragment.load({
                            id: that.getView().getId(),
                            name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.EditValueDialog",
                            controller: that,
                        }).then(function (oDialog) {
                            that._oEditDialog = oDialog;
                            that.getView().addDependent(oDialog);
                            oDialog.open();
                        });
                    } else {
                        that._oEditDialog.open();
                    }
                },
                error: function (err) {
                    MessageToast.show("Error al cargar opciones del ComboBox.");
                    console.error("Error en la llamada AJAX:", err);
                }
            });
        },

        onAddValues: function () {
            var oView = this.getView();
            var oValuesModel = oView.getModel("values");
            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");

            // Lista de etiquetas válidas
            const validLabels = [
                "IdApplications",
                "IdViews",
                "IdProcesses",
                "IdRoles",
                "IdPrivileges",
            ];

            // Calcular parentLabel basado en LABELID
            var parentLabel = "";
            if (validLabels.includes(oSelectedCatalog.LABELID) && oSelectedCatalog.LABELID !== "IdApplications") {
                const index = validLabels.indexOf(oSelectedCatalog.LABELID);
                parentLabel = index > 0 ? validLabels[index - 1] : "";
            }

            // Llamada a la API para obtener los VALUEID del catálogo padre
            var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=${parentLabel}`;
            var that = this; // Para mantener el contexto dentro del callback

            $.ajax({
                url: sUrl,
                method: "POST",
                success: function (data) {
                    // Convertir los resultados en items para el ComboBox
                    console.log("Respuesta del backend:", data);

                    var aValues = data.value || [];
                    var aComboBoxItems = aValues.map(function (item) {
                        return { key: item.VALUEID, text: item.VALUEID };
                    });

                    // Crear el modelo para el diálogo
                    // Si LABELID es "IdApplications" o no está en validLabels, no se muestra el ComboBox
                if (validLabels.includes(oSelectedCatalog.LABELID) && oSelectedCatalog.LABELID !== "IdApplications") {

                    var oModel = new JSONModel({
                        COMPANYID: 0,
                        CEDIID: 0,
                        LABELID: oSelectedCatalog.LABELID,
                        VALUEPAID1: parentLabel,
                        VALUEPAID2: aComboBoxItems.length > 0 ? aComboBoxItems[0].key : "",
                        ComboBoxItems: aComboBoxItems,
                        VALUEID: "",
                        VALUE: "",
                        ALIAS: "",
                        SEQUENCE: 30,
                        IMAGE: "",
                        VALUESAPID: "",
                        DESCRIPTION: "",
                        ROUTE: "",
                        DETAIL_ROW: {
                            ACTIVED: true,
                            DELETED: false
                        },
                        DETAIL_ROW_REG: []
                    })
                }else{
                    var oModel = new JSONModel({
                        COMPANYID: 0,
                        CEDIID: 0,
                        LABELID: oSelectedCatalog.LABELID,
                        VALUEPAID1: parentLabel,
                        VALUEPAID2: "", // ComboBox vacío
                        ComboBoxItems: [], // Sin opciones
                        VALUEID: "",
                        VALUE: "",
                        ALIAS: "",
                        SEQUENCE: 30,
                        IMAGE: "",
                        VALUESAPID: "",
                        DESCRIPTION: "",
                        ROUTE: "",
                        DETAIL_ROW: {
                            ACTIVED: true,
                            DELETED: false
                        },
                        DETAIL_ROW_REG: []
                    })

                }

                    // Asignar el modelo al diálogo
                    that.getView().setModel(oModel, "addValueModel");

                    // Abrir el diálogo
                    if (!that._oAddDialog) {
                        Fragment.load({
                            id: that.getView().getId(),
                            name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.AddValueDialog",
                            controller: that,
                        }).then(function (oDialog) {
                            that._oAddDialog = oDialog;
                            that.getView().addDependent(oDialog);
                            oDialog.open();
                        });
                    } else {
                        that._oAddDialog.open();
                    }
                },
                error: function (err) {
                    MessageToast.show("Error al cargar valores del catálogo padre");
                    console.error("Error en la llamada AJAX:", err);
                }
            });
        },



        onCancelEdit: function () {
            if (this._oEditDialog) {
                this._oEditDialog.close();
            }
            this._cleanModels();
        },

        onCancelValues: function () {
            if (this._oAddDialog) {
                this._oAddDialog.close();
            }
            this._cleanModels();
        },
        
        _cleanModels: function () {
            // Limpiar modelo de valores seleccionados
            this.getView().getModel("newValueModel").setData({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            });

            // Limpiar modelo de añadir valores (si existe)
            if (this.getView().getModel("addValueModel")) {
                this.getView().getModel("addValueModel").setData({
                    VALUEID: "",
                    VALUE: "",
                    VALUEPAID: "",
                    ALIAS: "",
                    IMAGE: "",
                    DESCRIPTION: ""
                });
            }

            // Resetear selección
            this.getView().getModel("values").setProperty("/selectedValueIn", null);

            // Deseleccionar items en la tabla
            var oTable = this.byId("valuesTable");
            if (oTable) {
                oTable.removeSelections();
            }
        }


    });
});