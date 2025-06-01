/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable no-console */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery",
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.catalogs.Catalogs",
      {

        onInit: function () {
          var oModel = new JSONModel();
          var that = this;

          this._oDialog = null;


          $.ajax({
            url: "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudLabels?action=get",
            method: "POST",
            success: function (data) {
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            },
          });
        },

        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getSource().getValue();
          var oTable = this.byId("catalogTable");
          var aItems = oTable.getItems();
          
          if (!sQuery) {
            aItems.forEach(function (oItem) {
              oItem.setVisible(true);
            });
            return;
          }

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            var oData = oContext.getObject();
            var bVisible = Object.keys(oData).some(function (sKey) {
              var value = oData[sKey];

              if (typeof value === "string") {
                return value.toLowerCase().includes(sQuery.toLowerCase());
              } else if (typeof value === "number") {
                return value.toString().includes(sQuery);
              }

              return false;
            });

            oItem.setVisible(bVisible);
          });
        },

        onAddCatalog: function () {
          
          //Inicializa el modelo con estructura completa
          var oModel = new JSONModel({
            COMPANYID: 0,
            CEDIID: 0,
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "", 
            SEQUENCE: 0, 
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
            },
          });
          console.log("Estado ACTIVED en modelo antes de abrir modal:", oModel.getProperty("/DETAIL_ROW/0/ACTIVED"));
          this.getView().setModel(oModel, "addCatalogModel");

          //Cargar el diálogo si no existe
          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.AddCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                // @ts-ignore
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: function () {
            var oView = this.getView();
            var oNewCatalogModel = oView.getModel("addCatalogModel");
            var oCatalogsModel = oView.getModel(); //Se obtiene el modelo general

            // Validar que el modelo existe
            if (!oCatalogsModel) {
                console.error("El modelo 'value' no está disponible en la vista.");
                MessageToast.show("Error interno: modelo no disponible.");
                return;
            }

            //Obtener datos del formulario
            var oFormData = oNewCatalogModel.getData();
            var aCurrentCatalogs = oCatalogsModel.getProperty("/value") || []; 

            //Validaciones
            if (!oFormData.LABELID || !oFormData.LABEL || !oFormData.DESCRIPTION) {
                MessageToast.show("LABELID, LABEL Y DESCRIPTION son campos obligatorios.");
                return;
            }

            //Verificar si el LABELID ya existe en la lista
            var bLabelIdExists = aCurrentCatalogs.some(item => item.LABELID === oFormData.LABELID);
            if (bLabelIdExists) {
                MessageToast.show("El LABELID ya existe, por favor ingrese uno diferente.");
                return;
            }

            var bActived = oFormData.DETAIL_ROW.ACTIVED; //Obtiene el estado del switch

            console.log("Estado ACTIVED antes de guardar:", bActived);
            //Construir objeto con los parámetros correctos
            
              var oParams = {
                        LABELID: oFormData.LABELID,
                        LABEL: oFormData.LABEL,
                        INDEX: oFormData.INDEX || "",
                        COLLECTION: oFormData.COLLECTION || "",
                        SECTION: oFormData.SECTION || "",
                        SEQUENCE: oFormData.SEQUENCE || 0,
                        IMAGE: oFormData.IMAGE || "",
                        DESCRIPTION: oFormData.DESCRIPTION || "",
                        DETAIL_ROW: [{
                              ACTIVED: bActived,
                              DELETED: false
                          }]

                    };

            console.log("Datos enviados al backend:", JSON.stringify(oParams, null, 2));
            
            oView.setBusy(true);

            console.log("Estado ACTIVED antes de guardar:", bActived);

            $.ajax({
                url: "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudLabels?action=create",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ labels: oParams }),
                success: function (response) {
                    oView.setBusy(false);
                    MessageToast.show("Catálogo guardado correctamente.");
                    console.log("Datos enviados", oParams);

                    console.log("Respuesta del backend:", response);

                    //segurar que el estado se asigna correctamente antes de actualizar la tabla
                    oParams.DETAIL_ROW = response.labels?.DETAIL_ROW || oParams.DETAIL_ROW;


                    //Actualizar el modelo directamente
                    
                    oCatalogsModel.setProperty("/value", aCurrentCatalogs);
                    aCurrentCatalogs.push({
                      
                        LABELID: oFormData.LABELID,
                        LABEL: oFormData.LABEL,
                        INDEX: oFormData.INDEX || "",
                        COLLECTION: oFormData.COLLECTION || "",
                        SECTION: oFormData.SECTION || "",
                        SEQUENCE: oFormData.SEQUENCE || 0,
                        IMAGE: oFormData.IMAGE || "",
                        DESCRIPTION: oFormData.DESCRIPTION || "",
                        DETAIL_ROW: {
                              ACTIVED: bActived,
                              DELETED: false
                          }
                    }); 
                    oCatalogsModel.refresh();

                    //Limpiar el modelo después de guardar
                    oNewCatalogModel.setData({
                        LABELID: "", LABEL: "", ALIAS: "", IMAGE: "", DESCRIPTION: "", DETAIL_ROW: [{ ACTIVED: true, DELETED: false }]

                    });

                    //Cerrar diálogo correctamente
                    this.byId("addCatalogDialog").close();
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al guardar: " + (error.responseJSON?.error?.message || "Error en el servidor."));
                }
            });
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        onEditPressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Crear modelo para edición
          var oEditModel = new JSONModel($.extend(true, {}, oData));
          this.getView().setModel(oEditModel, "editModel");

          // Cargar diálogo de edición
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.EditCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                // @ts-ignore
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          //Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          //Validaciones
            if (!oEditedData.LABELID || !oEditedData.LABEL || !oEditedData.DESCRIPTION) {
                MessageToast.show("VALUEID, VALUE y DESCRIPTION son campos obligatorios");
                return;
            }

          var oParams = {
                      LABELID: oEditedData.LABELID,
                      LABEL: oEditedData.LABEL,
                      INDEX: oEditedData.INDEX || "",
                      COLLECTION: oEditedData.COLLECTION || "",
                      SECTION: oEditedData.SECTION || "",
                      SEQUENCE: oEditedData.SEQUENCE || 1,
                      IMAGE: oEditedData.IMAGE || "",
                      DESCRIPTION: oEditedData.DESCRIPTION || "",
                      DETAIL_ROW:[ {
                            ACTIVED: oEditedData.ACTIVED,
                            DELETED: false
                        }]

                  };

          var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudLabels?action=update&labelid=${oEditedData.LABELID}`;

          //Llamada a la API para actualizar
          $.ajax({
            url: sUrl,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              labels: oParams,
            }),
            // @ts-ignore
            success: function (response) {
              MessageToast.show("Registro actualizado correctamente");
              this._oEditDialog.close();

              var updatedIndex = aData.findIndex(
                (item) => item._id === oEditedData._id
              );

              if (updatedIndex !== -1) {
                aData[updatedIndex] = {
                  ...aData[updatedIndex],
                  LABELID: oEditedData.LABELID,
                  VALUEPAID: oEditedData.VALUEPAID,
                  LABEL: oEditedData.LABEL,
                  INDEX: oEditedData.INDEX,
                  COLLECTION: oEditedData.COLLECTION,
                  SECTION: oEditedData.SECTION,
                  SEQUENCE: oEditedData.SEQUENCE,
                  IMAGE: oEditedData.IMAGE,
                  DESCRIPTION: oEditedData.DESCRIPTION,
                };
                oTableModel.setProperty("/value", aData);
              }
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al actualizar: " + error.responseText);
            }.bind(this),
          });
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },


        onDeletePressed: function () {
            if (!this._oSelectedItem) return;

            var oContext = this._oSelectedItem.getBindingContext();
            var oData = oContext.getObject();
            var oView = this.getView();

            if (!oData.LABELID) {
                MessageToast.show("Por favor, seleccione un label antes de eliminar.");
                return;
            }

            var sCheckUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=${oData.LABELID}`;

            // 🔹 Obtener los values relacionados
            $.ajax({
                url: sCheckUrl,
                method: "POST",
                success: function (response) {
                    var aValues = response.value || [];

                    MessageBox.confirm(`Este label tiene ${aValues.length} values relacionados. ¿Desea eliminarlos junto con el label?`, {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.YES) {
                                // 🔹 Eliminar todos los values relacionados primero
                                var aDeleteRequests = aValues.map(function (oValue) {
                                    return $.ajax({
                                        url: `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=fisic&valueid=${oValue.VALUEID}`,
                                        method: "POST"
                                    });
                                });

                                $.when.apply($, aDeleteRequests).then(function () {
                                    // 🔹 Luego eliminar el label
                                    $.ajax({
                                        url: `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=fisic&labelid=${oData.LABELID}`,
                                        method: "POST",
                                        success: function () {
                                            MessageToast.show("Label y values eliminados correctamente.");

                                            var oTableModel = oView.getModel();
                                            var aData = oTableModel.getProperty("/value") || [];
                                            var index = aData.findIndex(item => item.LABELID === oData.LABELID);
                                            if (index !== -1) {
                                                aData.splice(index, 1);
                                                oTableModel.setProperty("/value", aData);
                                            }
                                        }.bind(this),
                                        error: function (error) {
                                            MessageToast.show("Error al eliminar el label: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                                        }.bind(this)
                                    });
                                }).fail(function () {
                                    MessageToast.show("Error al eliminar los values relacionados.");
                                });
                            }
                        }.bind(this)
                    });
                }.bind(this),
                error: function (error) {
                    MessageToast.show("Error al verificar valores relacionados: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                }.bind(this)
            });
        },

        onActivatePressed: function () {
            var oView = this.getView();
            var oLabelsModel = oView.getModel();
            var oSelectedLabel = this._oSelectedItem ? this._oSelectedItem.getBindingContext().getObject() : null;

            // Validación: Verificar si hay un label seleccionado
            if (!oSelectedLabel || !oSelectedLabel.LABELID) {
                MessageToast.show("Por favor, seleccione un label antes de activar.");
                return;
            }

            // Construir la URL para la activación
            var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=activar&labelid=${oSelectedLabel.LABELID}`;

            // Configurar la petición AJAX para activar el label
            oView.setBusy(true);
            $.ajax({
                url: sUrl,
                method: "POST",
                success: function () {
                    oView.setBusy(false);
                    MessageToast.show("Label activado correctamente.");

                    // Actualizar el modelo para reflejar el cambio en la interfaz
                    var currentLabels = oLabelsModel.getProperty("/value") || [];
                    var updatedIndex = currentLabels.findIndex(item => item.LABELID === oSelectedLabel.LABELID);
                    
                    if (updatedIndex !== -1) {
                        currentLabels[updatedIndex].DETAIL_ROW.ACTIVED = true;
                        currentLabels[updatedIndex].DETAIL_ROW.DELETED = false;
                        oLabelsModel.setProperty("/value", currentLabels);
                        oLabelsModel.refresh();
                    }
                }.bind(this),
                error: function (error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al activar: " + (error.responseJSON?.error?.message || "Error en el servidor"));
                }.bind(this)
            });
        },

        onDeactivatePressed: function () {
          var oView = this.getView();
          var oLabelsModel = oView.getModel();
          var oSelectedLabel = this._oSelectedItem ? this._oSelectedItem.getBindingContext().getObject() : null;

          // Validación: Verificar si hay un label seleccionado
          if (!oSelectedLabel || !oSelectedLabel.LABELID) {
              MessageToast.show("Por favor, seleccione un label antes de desactivar.");
              return;
          }

          // Construir la URL con los parámetros requeridos
          var sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=false&labelid=${oSelectedLabel.LABELID}`;

          // Configurar la petición AJAX
          oView.setBusy(true);
          $.ajax({
              url: sUrl,
              method: "POST",
              success: function (response) {
                  oView.setBusy(false);
                  MessageToast.show("Label desactivado correctamente.");

                  // Actualizar el modelo para reflejar el cambio en la interfaz
                  var currentLabels = oLabelsModel.getProperty("/value") || [];
                  var updatedIndex = currentLabels.findIndex(item => item.LABELID === oSelectedLabel.LABELID);
                  
                  if (updatedIndex !== -1) {
                      currentLabels[updatedIndex].DETAIL_ROW.ACTIVED = false;
                      oLabelsModel.setProperty("/value", currentLabels);
                      oLabelsModel.refresh();
                  }
              }.bind(this),
              error: function (error) {
                  oView.setBusy(false);
                  MessageToast.show("Error al desactivar: " + (error.responseJSON?.error?.message || "Error en el servidor"));
              }.bind(this)
          });
      },

      //   _changeStatus: function (bActivate) {
      //     console.log("Activar/Desactivar");

      //     if (!this._oSelectedItem) {
      //       console.log("No hay ítem seleccionado");
      //       return;
      //     }

      //     var oContext = this._oSelectedItem.getBindingContext();
      //     var oData = oContext.getObject();
      //     var sAction = bActivate ? "activate" : "delete";
      //     var sStatusMessage = bActivate ? "activado" : "desactivado";

      //     // Obtener el modelo y los datos actuales
      //     var oTableModel = this.getView().getModel();
      //     var aData = oTableModel.getProperty("/value") || [];

      //     $.ajax({
      //       url:
      //         "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/sec/logicalLabel?status=" +
      //         sAction +
      //         "&&labelID=" +
      //         oData.LABELID,
      //       method: "POST",
      //       contentType: "application/json",
      //       success: function () {
      //         // Actualizar el estado localmente
      //         var index = aData.findIndex(
      //           (item) => item.LABELID === oData.LABELID
      //         );
      //         if (index !== -1) {
      //           // Actualizar solo el campo ACTIVED
      //           aData[index].DETAIL_ROW.ACTIVED = bActivate;

      //           // Actualizar el modelo
      //           oTableModel.setProperty("/value", aData);
      //         }

      //         // Actualizar visibilidad de botones según estado
      //         this.byId("activateButton").setVisible(!bActivate);
      //         this.byId("activateButton").setEnabled(!bActivate);
      //         this.byId("deactivateButton").setVisible(bActivate);
      //         this.byId("deactivateButton").setEnabled(bActivate);

      //         MessageToast.show(
      //           "Registro " + oData.LABELID + ": " + sStatusMessage
      //         );
      //       }.bind(this),
      //       error: function (error) {
      //         MessageToast.show("Error: " + error.responseText);
      //       }.bind(this),
      //     });
      //   },

    

        // _refreshCatalogTable: function () {
        //   // Implementa la lógica para refrescar los datos de la tabla
        //   // @ts-ignore
        //   var oTable = this.byId("catalogTable");
        //   var oModel = this.getView().getModel();

        //   $.ajax({
        //     url: "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/sec/getall",
        //     method: "GET",
        //     success: function (data) {
        //       oModel.setData({ value: data.value });
        //     },
        //   });
        // },

        //Muestra los values en la tabla de la derecha
        
        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;
          var sUrl =
            "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=" +
            encodeURIComponent(sLabelID);
          var that = this;

          $.ajax({
            url: sUrl,
            method: "POST",
            dataType: "json",
            success: function (response) {
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues(response.value || []);

                    // Actualiza el selectedValue en el modelo values
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            },
            error: function () {
              MessageToast.show("Error al cargar valores");
            },
          });

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },


        // @ts-ignore
        onSelectionChange: function (oEvent) {
          // Obtener el item seleccionado
          var oTable = this.byId("catalogTable");
          var oSelectedItem = oTable.getSelectedItem();

          if (!oSelectedItem) {
            this._disableAllActions();
            return;
          }

          // Habilitar todos los botones de acción
          this.byId("editButton").setEnabled(true);
          this.byId("deleteButton").setEnabled(true);

          // Determinar estado para activar/desactivar
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Actualizar visibilidad de botones según estado
          this.byId("activateButton").setVisible(!oData.DETAIL_ROW.ACTIVED);
          this.byId("activateButton").setEnabled(!oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setVisible(oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setEnabled(oData.DETAIL_ROW.ACTIVED);

          // Guardar referencia al item seleccionado
          this._oSelectedItem = oSelectedItem;
        },

        _disableAllActions: function () {
          this.byId("editButton").setEnabled(false);
          this.byId("activateButton").setEnabled(false);
          this.byId("deactivateButton").setEnabled(false);
          this.byId("deleteButton").setEnabled(false);
        },

        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },

        onCenterDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        onExpandDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0px");
          }
        },

      }
    );
  }
);