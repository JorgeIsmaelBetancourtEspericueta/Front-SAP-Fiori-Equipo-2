sap.ui.define(
  [
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/table/rowmodes/Fixed", 
    "sap/ui/table/rowmodes/Interactive", 
  ],
  function (
    BaseController,
    JSONModel,
    Log,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    Fragment,
    Fixed,
    Interactive
  ) {
    "use strict";

    return BaseController.extend(
      "com.invertions.sapfiorimodinv.controller.security.RolesMaster",
      {
        onInit: function () {
          this._catalogsLoaded = false;
          this.initModels();

          this.loadRolesData();

          if (!this._pDialog) {
            this._pDialog = Fragment.load({
              name: "com.invertions.sapfiorimodinv.view.security.fragments.AddRoleDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }

          this.getView().setModel(
            new JSONModel({
              rowMode: "Fixed", 
            }),
            "ui"
          );

          this.byId("rowModeSelector").attachSelectionChange(
            this.onRowModeChange,
            this
          );
        },

        initModels: function () {
          const view = this.getView();
          view.setModel(
            new JSONModel({
              ROLEID: "",
              ROLENAME: "",
              DESCRIPTION: "",
              PRIVILEGES: [],
              DETAIL_ROW: {
                ACTIVED: false,
                DELETED: false,
              },
            }),
            "selectedRole"
          );

          view.setModel(
            new JSONModel({
              ROLEID: "",
              ROLENAME: "",
              DESCRIPTION: "",
              NEW_PROCESSID: "",
              NEW_PRIVILEGES: [],
              PRIVILEGES: [],
              isEditMode: false, 
              isRoleIdEditable: true, 
            }),
            "newRoleModel"
          );
        },


        loadCatalogsOnce: async function () {
          if (!this._catalogsLoaded) {
            await this.loadCatalog("IdProcesses", "processCatalogModel");
            await this.loadCatalog("IdPrivileges", "privilegeCatalogModel");
            this._catalogsLoaded = true;
          }
        },

        onOpenDialog: async function () {
          await this.loadCatalogsOnce();

          const oNewRoleModel = this.getView().getModel("newRoleModel");
          oNewRoleModel.setData({
            ROLEID: "",
            ROLENAME: "",
            DESCRIPTION: "",
            NEW_PROCESSID: "",
            NEW_PRIVILEGES: [],
            PRIVILEGES: [],
            isEditMode: false,
            isRoleIdEditable: true, 
          });

          this._pDialog.then(function (oDialog) {
            oDialog.setTitle("Crear Rol");
            oDialog.open();
          });
        },

        onUpdateRole: async function () {
          await this.loadCatalogsOnce();

          const oTable = this.byId("rolesTable");
          const iIndex = oTable.getSelectedIndex();

          if (iIndex === -1) {
            MessageToast.show("Selecciona un rol para editar.");
            console.log("onUpdateRole: No hay rol seleccionado.");
            return;
          }

          const oRoleFromTable = oTable.getContextByIndex(iIndex).getObject();
          console.log(
            "onUpdateRole: Rol seleccionado de la tabla (básico):",
            oRoleFromTable
          );

          let oSelectedRole = this.getView().getModel("selectedRole").getData();
          console.log(
            "onUpdateRole: Contenido inicial del modelo 'selectedRole':",
            oSelectedRole
          );

          if (
            !oSelectedRole ||
            oSelectedRole.ROLEID !== oRoleFromTable.ROLEID ||
            !oSelectedRole.PRIVILEGES
          ) {
            MessageToast.show("Cargando detalles del rol para edición...");
            console.log(
              "onUpdateRole: Recargando detalles del rol con onRoleSelected..."
            );
            await this.onRoleSelected();
            oSelectedRole = this.getView().getModel("selectedRole").getData(); 
            console.log(
              "onUpdateRole: Contenido de 'selectedRole' después de recarga:",
              oSelectedRole
            );
          }

          
          if (
            !oSelectedRole ||
            !oSelectedRole.ROLEID ||
            !Array.isArray(oSelectedRole.PRIVILEGES)
          ) {
            MessageBox.warning(
              "No se pudo cargar la información completa del rol (privilegios). Por favor, intenta de nuevo o verifica el servicio de detalle."
            );
            console.error(
              "onUpdateRole: Fallo en la verificación final de 'selectedRole'. Faltan datos esenciales o 'PRIVILEGES' no es un array."
            );
            return; 
          }

          console.log(
            "onUpdateRole: 'selectedRole' validado, procediendo con la creación de oDialogData:",
            oSelectedRole
          );

          const oDialogData = {
            ROLEID: oSelectedRole.ROLEID,
            ROLENAME: oSelectedRole.ROLENAME,
            DESCRIPTION: oSelectedRole.DESCRIPTION,
            PRIVILEGES: oSelectedRole.PRIVILEGES || [],
            NEW_PROCESSID: "", 
            NEW_PRIVILEGES: [], 
            isEditMode: true, 
            isRoleIdEditable: false,
          };

          console.log(
            "onUpdateRole: Datos a cargar en roleDialogModel para edición:",
            oDialogData
          );

         

          const oRoleDialogModel = this.getView().getModel("newRoleModel"); // Usar newRoleModel como se define en initModels
          oRoleDialogModel.setData(oDialogData);

         

          this._pDialog.then(function (oDialog) {
            oDialog.setTitle("Editar Rol");
            oDialog.open();
            console.log("onUpdateRole: Diálogo abierto.");
          });
        },
        onRoleSelected: async function () {
          const oTable = this.byId("rolesTable");
          const iIndex = oTable.getSelectedIndex();
          if (iIndex === -1) {
            this.getView().getModel("selectedRole").setData({});
            const oRolesView = this.getView().getParent().getParent();
            const oUiStateModel = oRolesView.getModel("uiState");
            if (oUiStateModel) {
              oUiStateModel.setProperty("/isDetailVisible", false);
            }
            return;
          }

          const oRolesView = this.getView().getParent().getParent();
          const oUiStateModel = oRolesView.getModel("uiState");

          if (oUiStateModel) {
            oUiStateModel.setProperty("/isDetailVisible", true);
          }

          const oRoleFromList = oTable.getContextByIndex(iIndex).getObject();
          const sId = encodeURIComponent(oRoleFromList.ROLEID);

          try {
            const res = await fetch(
              `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudRoles?action=get&roleid=${sId}`,
              {
                method: "POST", 
              }
            );
            const result = await res.json();

            if (!result?.value?.length) {
              MessageBox.warning(
                "No se encontró información detallada del rol."
              );
              this.getView().getModel("selectedRole").setData({});
              return;
            }

            this.getOwnerComponent().setModel(
              new JSONModel(result.value[0]),
              "selectedRole"
            );
            const oBackendData = result.value[0];
            console.log(
              "onRoleSelected: Detalle del rol recibido del backend (oBackendData):",
              oBackendData
            );

          
            const aTransformedPrivileges = (oBackendData.PROCESSES || []).map(
              (process) => {
                return {
                  PROCESSID: process.PROCESSID,
                  PRIVILEGEID: (process.PRIVILEGES || []).map(
                    (priv) => priv.PRIVILEGEID
                  ),
                };
              }
            );

            const oTransformedRoleData = {
              ROLEID: oBackendData.ROLEID,
              ROLENAME: oBackendData.ROLENAME,
              DESCRIPTION: oBackendData.DESCRIPTION,
              PRIVILEGES: aTransformedPrivileges, 
            };

            console.log(
              "onRoleSelected: Datos transformados para 'selectedRole':",
              oTransformedRoleData
            );

            this.getView()
              .getModel("selectedRole")
              .setData(oTransformedRoleData);

            console.log(
              "onRoleSelected: Modelo 'selectedRole' actualizado con los datos:",
              this.getView().getModel("selectedRole").getData()
            );
          } catch (e) {
            MessageBox.error(
              "Error al obtener el detalle del rol: " + e.message
            );
            Log.error("Error fetching role detail:", e);
          }
        },

        onDialogClose: function () {
          this._pDialog.then(function (oDialog) {
            oDialog.close();
          });
        },

        onAddPrivilege: function () {
          const oModel = this.getView().getModel("newRoleModel");
          const oData = oModel.getData();

          if (
            !oData.NEW_PROCESSID ||
            !Array.isArray(oData.NEW_PRIVILEGES) ||
            oData.NEW_PRIVILEGES.length === 0
          ) {
            MessageToast.show("Selecciona proceso y al menos un privilegio.");
            return;
          }

          oData.NEW_PRIVILEGES.forEach((privilegeId) => {
            const isDuplicate = oData.PRIVILEGES.some(
              (p) =>
                p.PROCESSID === oData.NEW_PROCESSID &&
                (Array.isArray(p.PRIVILEGEID)
                  ? p.PRIVILEGEID.includes(privilegeId)
                  : p.PRIVILEGEID === privilegeId)
            );

            if (!isDuplicate) {
              oData.PRIVILEGES.push({
                PROCESSID: "IdProcess-"+oData.NEW_PROCESSID,
                PRIVILEGEID: [privilegeId], 
              });
            } else {
              MessageToast.show(
                `El privilegio ${privilegeId} para el proceso ${oData.NEW_PROCESSID} ya ha sido agregado.`
              );
            }
          });

          oData.NEW_PROCESSID = "";
          oData.NEW_PRIVILEGES = [];
          oModel.setData(oData);
        },

        onSaveRole: async function () {
          const oView = this.getView();
          const oData = oView.getModel("newRoleModel").getData();
          const bIsEditMode = oData.isEditMode;

          if (!oData.ROLEID || !oData.ROLENAME) {
            MessageToast.show("ID y Nombre del Rol son obligatorios.");
            return;
          }

          const oRolePayload = {
            ROLEID: oData.ROLEID,
            ROLENAME: oData.ROLENAME,
            DESCRIPTION: oData.DESCRIPTION,
            PRIVILEGES: oData.PRIVILEGES,
          };

          let sMethod = "POST";
          let sUrl = `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudRoles?action=${
            bIsEditMode ? "update" : "create"
          }`;

          if (bIsEditMode) {
            sUrl += `&roleid=${encodeURIComponent(oData.ROLEID)}`;
          }

          try {
            const response = await fetch(sUrl, {
              method: sMethod,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roles: oRolePayload }),
            });

            if (!response.ok) throw new Error(await response.text());

            MessageToast.show(
              `Rol ${bIsEditMode ? "actualizado" : "guardado"} correctamente.`
            );
            this._pDialog.then(function (oDialog) {
              oDialog.close();
            });

            const oRolesModel = this.getOwnerComponent().getModel("roles");
            let aAllRoles = oRolesModel.getProperty("/valueAll") || [];

            if (bIsEditMode) {
              const iExistingRoleIndex = aAllRoles.findIndex(
                (role) => role.ROLEID === oData.ROLEID
              );
              if (iExistingRoleIndex !== -1) {
                oRolePayload.DETAIL_ROW = aAllRoles[iExistingRoleIndex]
                  .DETAIL_ROW || { ACTIVED: true, DELETED: false };
                aAllRoles[iExistingRoleIndex] = oRolePayload;
              }
            } else {
              oRolePayload.DETAIL_ROW = { ACTIVED: true, DELETED: false };
              aAllRoles.push(oRolePayload);
            }

            oRolesModel.setProperty("/valueAll", aAllRoles);
            this._applyAllFilters();
          } catch (err) {
            MessageBox.error("Error al guardar el rol: " + err.message);
            Log.error("Error saving role:", err);
          }
        },
        
        _handleRoleAction: async function (options) {
          const oModel = this.getView().getModel("selectedRole");
          const oData = oModel ? oModel.getData() : null;
          const that = this; 

          if (!oData || !oData.ROLEID) {
            MessageToast.show("No se encontró el ROLEID.");
            return;
          }

          MessageBox[options.dialogType](
            options.message.replace("{ROLENAME}", oData.ROLENAME),
            {
              title: options.title,
              actions: options.actions,
              emphasizedAction: options.emphasizedAction,
              onClose: async function (oAction) {
                if (oAction === options.confirmAction) {
                  try {
                    const response = await fetch(
                      `${options.url}${oData.ROLEID}`, 
                      {
                        method: options.method,
                        headers: { "Content-Type": "application/json" }, 
                      }
                    );

                    const result = await response.json(); 

                    if (result && !result.error) {
                      MessageToast.show(options.successMessage);
                    
                      await that._loadRolesDataIntoComponent(); 

                      that
                        .getOwnerComponent()
                        .getRouter()
                        .navTo("RouteRolesMaster", {}, true);
                    } else {
                      MessageBox.error(
                        "Error: " + (result?.message || "desconocido")
                      );
                    }
                  } catch (error) {
                    MessageBox.error("Error en la petición: " + error.message);
                    Log.error("Error in _handleRoleAction:", error);
                  }
                }
              },
            }
          );
        },
        _loadRolesDataIntoComponent: async function () {
          try {
            const response = await fetch(
              "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudRoles?action=get",
              {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch roles data from backend.");
            }

            const data = await response.json();
            const oRolesComponentModel =
              this.getOwnerComponent().getModel("roles");

            if (oRolesComponentModel) {
              oRolesComponentModel.setData(data);
              Log.info("Roles data reloaded into component model.");
            } else {
              this.getOwnerComponent().setModel(new JSONModel(data), "roles");
              Log.info(
                "Roles model created and loaded into component for the first time."
              );
            }
            return data; 
          } catch (error) {
            Log.error("Error loading roles data:", error);
            MessageBox.error(
              "Error al cargar los datos de roles: " + error.message
            );
            return null; 
          }
        },

        onDesactivateRole: function () {
          this._handleRoleAction({
            dialogType: "confirm",
            message:
              '¿Estás seguro de que deseas desactivar el rol "{ROLENAME}"?',
            title: "Confirmar desactivación",
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            confirmAction: MessageBox.Action.YES,
            method: "POST",
            url: "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?roleid=", 
            successMessage: "Rol desactivado correctamente.",
          });
        },
        onDeleteRole: function () {
          const oTable = this.byId("rolesTable");
          const iIndex = oTable.getSelectedIndex();
          if (iIndex === -1) {
            MessageToast.show("Selecciona un rol para eliminar.");
            return;
          }

          const oRole = oTable.getContextByIndex(iIndex).getObject();

          if (oRole.DETAIL_ROW?.DELETED) {
            MessageToast.show(
              `El rol "${oRole.ROLENAME}" ya está marcado como eliminado.`
            );
            return;
          }

          MessageBox.confirm(
            `¿Estás seguro de que quieres eliminar el rol "${oRole.ROLENAME}"? Esta acción lo marcará como eliminado y no será visible en la lista por defecto.`,
            {
              title: "Eliminar Rol",
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.OK,
              onClose: async (sAction) => {
                if (sAction === MessageBox.Action.OK) {
                  try {
                    const response = await fetch(
                      `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?roleid=${oRole.ROLEID}&borrado=fisic`, 
                      {
                        method: "POST", 
                        headers: { "Content-Type": "application/json" },
                      }
                    );

                    if (!response.ok) throw new Error(await response.text());

                    MessageToast.show(
                      `Rol "${oRole.ROLENAME}" eliminado correctamente.`
                    );

                    const oRolesModel =
                      this.getOwnerComponent().getModel("roles");
                    const aAllRoles =
                      oRolesModel.getProperty("/valueAll") || [];
                    const iRoleIndex = aAllRoles.findIndex(
                      (r) => r.ROLEID === oRole.ROLEID
                    );

                    if (iRoleIndex !== -1) {
                      aAllRoles[iRoleIndex].DETAIL_ROW.DELETED = true;
                      aAllRoles[iRoleIndex].DETAIL_ROW.ACTIVED = false; 
                      oRolesModel.setProperty("/valueAll", aAllRoles);
                      this._applyAllFilters(); 
                    }
                    this.getView().getModel("selectedRole").setData({});
                    const oRolesView = this.getView().getParent().getParent();
                    const oUiStateModel = oRolesView.getModel("uiState");
                    if (oUiStateModel) {
                      oUiStateModel.setProperty("/isDetailVisible", false);
                    }
                  } catch (err) {
                    MessageBox.error(
                      "Error al eliminar el rol: " + err.message
                    );
                    Log.error("Error deleting role:", err);
                  }
                }
              },
            }
          );
        },

        loadRolesData: async function () {
          try {
            const response = await fetch(
              "https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudRoles?action=get",
              { method: "POST" }
            );
            if (!response.ok) {
              const errorText = await response.text();
              Log.error(
                `Error fetching roles: ${response.status} - ${errorText}`
              );
              MessageBox.error(`Error al cargar los roles: ${errorText}`);
              return;
            }
            const data = await response.json();
            const aAllRoles = (data.value || []).filter(
              (role) => role.DETAIL_ROW?.DELETED === false
            );

            const oRolesModel = new JSONModel({
              value: [], 
              valueAll: aAllRoles, 
              filterKey: "active", 
              searchQuery: "", 
            });
            this.getOwnerComponent().setModel(oRolesModel, "roles");
            this._applyAllFilters(); 
            Log.info("Datos de roles cargados.");
          } catch (error) {
            Log.error("Error al cargar roles:", error);
            MessageBox.error(
              "Error al cargar los roles. Por favor, revise la consola."
            );
          }
        },

        onRemovePrivilege: function (oEvent) {
          const oModel = this.getView().getModel("newRoleModel");
          const oData = oModel.getData();

          const oItem = oEvent.getSource().getParent();
          const oContext = oItem.getBindingContext("newRoleModel");
          const iIndex = oContext.getPath().split("/").pop();

          oData.PRIVILEGES.splice(iIndex, 1);
          oModel.setData(oData);
        },

        loadCatalog: async function (labelId, modelName) {
          const view = this.getView();
          try {
            const response = await fetch(
              `https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=${labelId}`,
              {
                method: "POST", // Assuming POST for GET is intentional
                headers: { "Content-Type": "application/json" },
              }
            );
            if (!response.ok) {
              throw new Error(
                `Error fetching ${labelId}: ${response.statusText}`
              );
            }
            const data = await response.json();
            const filteredValues =
              data.value?.filter((v) => v.LABELID === labelId) || [];
            view.setModel(new JSONModel({ values: filteredValues }), modelName);
            Log.info(`Catalog '${labelId}' loaded into model '${modelName}'.`);
          } catch (error) {
            Log.error(`Error loading catalog '${labelId}':`, error);
            MessageBox.error(`Error al cargar el catálogo de ${labelId}.`);
          }
        },

        onFilterRoles: function (oEvent) {
          const sKey = oEvent.getSource().getSelectedKey();
          const oRolesModel = this.getOwnerComponent().getModel("roles");
          oRolesModel.setProperty("/filterKey", sKey);
          this._applyAllFilters();
        },

        onMultiSearch: function () {
          const sQuery = this.byId("searchRoleName").getValue().toLowerCase();
          const oRolesModel = this.getOwnerComponent().getModel("roles");
          oRolesModel.setProperty("/searchQuery", sQuery);
          this._applyAllFilters();
        },

        _applyAllFilters: function () {
          const oRolesModel = this.getOwnerComponent().getModel("roles");
          const aAllRoles = oRolesModel.getProperty("/valueAll") || [];
          const sFilterKey = oRolesModel.getProperty("/filterKey");
          const sSearchQuery = (
            oRolesModel.getProperty("/searchQuery") || ""
          ).toLowerCase();

          let aFilteredByStatus = [];

          switch (sFilterKey) {
            case "active":
              aFilteredByStatus = aAllRoles.filter(
                (r) =>
                  r.DETAIL_ROW?.ACTIVED === true &&
                  r.DETAIL_ROW?.DELETED === false
              );
              break;
            case "inactive":
              aFilteredByStatus = aAllRoles.filter(
                (r) =>
                  r.DETAIL_ROW?.ACTIVED === false &&
                  r.DETAIL_ROW?.DELETED === false
              );
              break;
            case "deleted": 
              aFilteredByStatus = aAllRoles.filter(
                (r) => r.DETAIL_ROW?.DELETED === true
              );
              break;
            case "all":
              aFilteredByStatus = aAllRoles;
              break;
            default:
              aFilteredByStatus = aAllRoles.filter(
                (r) =>
                  r.DETAIL_ROW?.ACTIVED === true &&
                  r.DETAIL_ROW?.DELETED === false
              );
          }

          let aFinalFilteredRoles = [];
          if (sSearchQuery) {
            aFinalFilteredRoles = aFilteredByStatus.filter((oRole) => {
              const sRoleId = (oRole.ROLEID || "").toLowerCase();
              const sRoleName = (oRole.ROLENAME || "").toLowerCase();
              const sDescription = (oRole.DESCRIPTION || "").toLowerCase();

              if (
                sRoleId.includes(sSearchQuery) ||
                sRoleName.includes(sSearchQuery) ||
                sDescription.includes(sSearchQuery)
              ) {
                return true;
              }

              if (oRole.PROCESSES && Array.isArray(oRole.PROCESSES)) {
                for (const oProcess of oRole.PROCESSES) {
                  const sProcessName = (
                    oProcess.PROCESSNAME || ""
                  ).toLowerCase();
                  const sApplicationName = (
                    oProcess.APPLICATIONNAME || ""
                  ).toLowerCase();
                  const sViewName = (oProcess.VIEWNAME || "").toLowerCase();

                  if (
                    sProcessName.includes(sSearchQuery) ||
                    sApplicationName.includes(sSearchQuery) ||
                    sViewName.includes(sSearchQuery)
                  ) {
                    return true;
                  }

                  if (
                    oProcess.PRIVILEGES &&
                    Array.isArray(oProcess.PRIVILEGES)
                  ) {
                    for (const oPrivilege of oProcess.PRIVILEGES) {
                      const sPrivilegeName = (
                        oPrivilege.PRIVILEGENAME || ""
                      ).toLowerCase();
                      if (sPrivilegeName.includes(sSearchQuery)) {
                        return true;
                      }
                    }
                  }
                }
              }
              return false;
            });
          } else {
            aFinalFilteredRoles = aFilteredByStatus;
          }

          oRolesModel.setProperty("/value", aFinalFilteredRoles);
          const oSelectedRoleData = this.getView()
            .getModel("selectedRole")
            .getData();
          if (oSelectedRoleData && oSelectedRoleData.ROLEID) {
            const bIsSelectedRoleStillVisible = aFinalFilteredRoles.some(
              (r) => r.ROLEID === oSelectedRoleData.ROLEID
            );
            if (!bIsSelectedRoleStillVisible) {
              this.getView().getModel("selectedRole").setData({});
              const oRolesView = this.getView().getParent().getParent();
              const oUiStateModel = oRolesView.getModel("uiState");
              if (oUiStateModel) {
                oUiStateModel.setProperty("/isDetailVisible", false);
              }
            }
          }
        },

        onRowModeChange: function (oEvent) {
          const sKey = oEvent.getSource().getSelectedKey();
          const oTable = this.byId("rolesTable");
          let oRowMode;

          if (sKey === "Fixed") {
            oRowMode = new Fixed({ rowCount: 20 });
          } else if (sKey === "Interactive") {
            oRowMode = new Interactive();
          }

          if (oRowMode) {
            oTable.setRowMode(oRowMode);
          }
        },
      }
    );
  }
);
