sap.ui.define(
  [
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
  ],
  function (
    BaseController,
    JSONModel,
    Log,
    MessageToast,
    MessageBox,
    Fragment
  ) {
    "use strict";

    return BaseController.extend(
      "com.invertions.sapfiorimodinv.controller.security.RolesDetail",
      {
        onInit: async function () {
          await this.loadCatalogsOnce();

          const oProcessModel = this.getOwnerComponent().getModel(
            "processCatalogModel"
          );
          const oPrivilegeModel = this.getOwnerComponent().getModel(
            "privilegeCatalogModel"
          );

          if (oProcessModel) {
            this.getView().setModel(oProcessModel, "processCatalogModel");
          }
          if (oPrivilegeModel) {
            this.getView().setModel(oPrivilegeModel, "privilegeCatalogModel");
          }
        },

        loadCatalogsOnce: async function () {
          if (this._catalogsLoaded) return;

          await this.loadCatalog("IdProcesses", "processCatalogModel");
          await this.loadCatalog("IdPrivileges", "privilegeCatalogModel");
          this._catalogsLoaded = true;
        },

        loadCatalog: async function (labelId, modelName) {
          const view = this.getView();

          const response = await fetch(
            "http://localhost:4004/api/security/crudLabels?action=get&labelid=",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );

          const data = await response.json();

          const processes = data.value.filter(
            (v) => v.LABELID === "IdProcesses"
          );
          const privileges = data.value.filter(
            (v) => v.LABELID === "IdPrivileges"
          );

          view.setModel(
            new JSONModel({ values: processes }),
            "processCatalogModel"
          );
          view.setModel(
            new JSONModel({ values: privileges }),
            "privilegeCatalogModel"
          );
        },

        _onRouteMatched: function (oEvent) {
          const sRoleId = decodeURIComponent(
            oEvent.getParameter("arguments").roleId
          );

          const oModel = this.getOwnerComponent().getModel("roles");
          if (!oModel) {
            MessageToast.show("Modelo de roles no disponible.");
            return;
          }

          const aRoles = oModel.getProperty("/value");
          const oRole = aRoles.find((role) => role.ROLEID === sRoleId);

          if (!oRole) {
            MessageToast.show("Rol no encontrado.");
            return;
          }

          const oSelectedModel = new JSONModel(oRole);
          this.getView().setModel(oSelectedModel, "selectedRole");
        },

        _loadRolesDataIntoComponent: async function () {
          try {
            const response = await fetch(
              "http://localhost:4004/api/security/crudRoles?action=get",
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

       

        _loadRoleDetails: function (sRoleId) {
          const oModel = this.getOwnerComponent().getModel("roles");

          if (oModel) {
            const aRoles = oModel.getProperty("/value");

            const oRole = aRoles.find((role) => role.ROLEID === sRoleId);

            if (oRole) {
              const oSelectedRoleModel =
                this.getView().getModel("selectedRole");

              console.log("_loadRoleDetails: Datos del rol cargados:", oRole);

              oSelectedRoleModel.setData(oRole);

              Log.debug(
                "_loadRoleDetails: Datos iniciales del selectedRole",

                oRole
              );

              console.log(
                "Contenido del modelo processCatalogModel:",

                this.getView().getModel("processCatalogModel").getData()
              ); // Agrega este log
            } else {
              MessageToast.show("Rol no encontrado.");
            }
          } else {
            MessageToast.show("Modelo de roles no disponible.");
          }
        },
      }
    );
  }
);
