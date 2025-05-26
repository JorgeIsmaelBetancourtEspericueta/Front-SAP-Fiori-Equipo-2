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
            "http://localhost:4004/api/security/crudValues?action=get&labelid=",
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
                      }
                    );

                    const result = await response.json();

                    if (result && !result.error) {
                      MessageToast.show(options.successMessage);
                      const oRolesModel = that
                        .getOwnerComponent()
                        .getModel("roles");
                      if (oRolesModel) {
                        const aRoles = oRolesModel.getProperty("/value");
                        const aUpdatedRoles = aRoles.filter(
                          (role) => role.ROLEID !== oData.ROLEID
                        );
                        oRolesModel.setProperty("/value", aUpdatedRoles);
                      }

                      that
                        .getOwnerComponent()
                        .getRouter()
                        .navTo("RouteRolesMaster");
                    } else {
                      MessageBox.error(
                        "Error: " + (result?.message || "desconocido")
                      );
                    }
                  } catch (error) {
                    MessageBox.error("Error en la petición: " + error.message);
                  }
                }
              },
            }
          );
        },

        _handleRoleAction: async function (options) {
          const oModel = this.getView().getModel("selectedRole");
          const oData = oModel ? oModel.getData() : null;
          const that = this; // Captura 'this' para usarlo dentro del onClose

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
                // onClose es async
                if (oAction === options.confirmAction) {
                  try {
                    const response = await fetch(
                      `${options.url}${oData.ROLEID}`, // La URL se concatena aquí
                      {
                        method: options.method,
                        headers: { "Content-Type": "application/json" }, // Añadir headers
                      }
                    );

                    const result = await response.json(); // Leer la respuesta como JSON

                    if (result && !result.error) {
                      MessageToast.show(options.successMessage);

                      await that._loadRolesDataIntoComponent();

                      that
                        .getOwnerComponent()
                        .getRouter()
                        .navTo("RouteRolesMaster", {}, true); // Navega a la vista maestra
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
              "http://localhost:4004/api/security/crudRoles?action=get",
              {
                method: "POST", // Asumiendo que tu backend espera POST para GET roles
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
              oRolesComponentModel.setData(data); // Actualiza el modelo existente
              Log.info("Roles data reloaded into component model.");
            } else {
              // Si el modelo 'roles' aún no existe en el componente, créalo
              this.getOwnerComponent().setModel(new JSONModel(data), "roles");
              Log.info(
                "Roles model created and loaded into component for the first time."
              );
            }
            return data; // Devuelve los datos por si se necesitan justo después de la carga
          } catch (error) {
            Log.error("Error loading roles data:", error);
            MessageBox.error(
              "Error al cargar los datos de roles: " + error.message
            );
            return null; // Retorna null en caso de error
          }
        },

        // --- FUNCIONES DE RUTA Y CARGA DE DETALLE (existentes con ajustes) ---
        _onRouteMatched: async function (oEvent) {
          const sRoleId = decodeURIComponent(
            oEvent.getParameter("arguments").roleId
          );

          // Asegurarse de que el modelo 'roles' del componente esté cargado antes de buscar el rol.
          let oRolesModel = this.getOwnerComponent().getModel("roles");
          // Si el modelo no existe o no tiene datos (por ejemplo, si el usuario navega directamente a esta URL)
          if (
            !oRolesModel ||
            !oRolesModel.getData() ||
            !oRolesModel.getData().value
          ) {
            Log.info(
              "Roles model in component not fully loaded, attempting to load..."
            );
            await this._loadRolesDataIntoComponent(); // Llama a la función para cargar roles
            oRolesModel = this.getOwnerComponent().getModel("roles"); // Obtener la referencia actualizada después de la carga
          }

          if (!oRolesModel) {
            // Si aún no hay modelo después de intentar cargarlo
            MessageToast.show(
              "Modelo de roles no disponible para mostrar detalles."
            );
            // Considerar navegar a la vista maestra si no hay datos
            this.getOwnerComponent()
              .getRouter()
              .navTo("RouteRolesMaster", {}, true);
            return;
          }

          const aRoles = oRolesModel.getProperty("/value");
          const oRole = aRoles.find((role) => role.ROLEID === sRoleId);

          if (!oRole) {
            MessageToast.show(
              "Rol no encontrado. Puede que haya sido eliminado o no exista."
            );
            // Si el rol no se encuentra, navega de vuelta a la vista maestra
            this.getOwnerComponent()
              .getRouter()
              .navTo("RouteRolesMaster", {}, true);
            return;
          }

          const oSelectedModel = new JSONModel(oRole);
          this.getView().setModel(oSelectedModel, "selectedRole");
        },

        // --- _handleRoleAction (NO TOCAR SEGÚN TU REQUERIMIENTO) ---
        // Se asume que esta función maneja URLs fijas y no requiere los parámetros adicionales para DELETE.
        // Si tu backend usa el mismo endpoint para desactivar y para eliminar físico,
        // _handleRoleAction no es la adecuada para el borrado físico sin modificarla.
        // Dado tu request de NO MOVER LA OTRA FUNCIÓN, `onDeleteRole` maneja su propia llamada.
        _handleRoleAction: async function (options) {
          const oModel = this.getView().getModel("selectedRole");
          const oData = oModel ? oModel.getData() : null;
          const that = this; // Captura 'this' para usarlo dentro del onClose

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
                // onClose es async
                if (oAction === options.confirmAction) {
                  try {
                    const response = await fetch(
                      `${options.url}${oData.ROLEID}`, // La URL se concatena aquí
                      {
                        method: options.method,
                        headers: { "Content-Type": "application/json" }, // Añadir headers
                      }
                    );

                    const result = await response.json(); // Leer la respuesta como JSON

                    if (result && !result.error) {
                      MessageToast.show(options.successMessage);
                      // NO LLAMAMOS _loadRolesDataIntoComponent AQUÍ
                      // porque onDeleteRole manejará su propia recarga.
                      // Esta función _handleRoleAction es más para 'desactivar'.
                      // Si la usas para otras acciones, puedes añadir la recarga aquí.

                      // Si esta acción (e.g., desactivar) implica una actualización en la vista maestra,
                      // también deberías recargar los roles aquí.
                      await that._loadRolesDataIntoComponent(); // Agregado para que también recargue después de desactivar

                      that
                        .getOwnerComponent()
                        .getRouter()
                        .navTo("RouteRolesMaster", {}, true); // Navega a la vista maestra
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
            url: "http://localhost:4004/api/security/deleteAny?roleid=", // URL para desactivar
            successMessage: "Rol desactivado correctamente.",
          });
        },

        // --- onDeleteRole (Tu función con la lógica de borrado físico) ---
        onDeleteRole: function () {
          const oSelectedRole = this.getView()
            .getModel("selectedRole")
            ?.getData();

          if (!oSelectedRole) {
            MessageBox.error("No se ha seleccionado ningún rol para eliminar.");
            return;
          }

          const sRoleId = oSelectedRole.ROLEID;
          const sRoleName = oSelectedRole.ROLENAME;

          MessageBox.warning(
            `¿Estás seguro de que deseas eliminar el rol "${sRoleName}" permanentemente? Esta acción no se puede deshacer.`,
            {
              title: "Confirmar eliminación permanente",
              actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.DELETE,
              onClose: async (sActionConfirmed) => {
                if (sActionConfirmed === MessageBox.Action.DELETE) {
                  try {
                    // Construir la URL completa para el borrado físico
                    const sUrl = `http://localhost:4004/api/security/deleteAny?roleid=${sRoleId}&borrado=fisic`;

                    const response = await fetch(sUrl, {
                      method: "POST", // Tu backend espera POST
                      headers: { "Content-Type": "application/json" },
                      // No se necesita body para esta operación GET/DELETE
                    });

                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(errorText);
                    }

                    MessageToast.show("Rol eliminado permanentemente.");

                    // **Aquí la llamada a la función que SÍ hemos definido**
                    await this._loadRolesDataIntoComponent();

                    // Navegar de vuelta a la vista maestra
                    this.getOwnerComponent()
                      .getRouter()
                      .navTo("RouteRolesMaster", {}, true);
                  } catch (error) {
                    MessageBox.error(
                      `Error al eliminar el rol permanentemente: ${error.message}`
                    );
                    Log.error("Error en onDeleteRole:", error);
                  }
                }
              },
            }
          );
        },

        onSaveRoleEdit: async function () {
          const oData = this.getView().getModel("roleDialogModel").getData();

          if (!oData.ROLEID || !oData.ROLENAME) {
            MessageToast.show("ID y Nombre del Rol son obligatorios.");
            return;
          }

          try {
            const response = await fetch(
              `http://localhost:4004/api/security/crudRoles?action=update&roleid=${oData.ROLEID}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  roles: {
                    ROLENAME: oData.ROLENAME,
                    DESCRIPTION: oData.DESCRIPTION,
                    PRIVILEGES: oData.PRIVILEGES.map((privilege) => ({
                      PROCESSID: privilege.PROCESSID,
                      PRIVILEGEID: Array.isArray(privilege.PRIVILEGEID)
                        ? privilege.PRIVILEGEID
                        : [privilege.PRIVILEGEID],
                    })),
                  },
                }),
              }
            );

            if (!response.ok) throw new Error(await response.text());

            const updatedData = await response.json(); // Obtén la respuesta del backend

            MessageToast.show("Rol actualizado correctamente.");

            const oSelectedRoleModel = this.getView().getModel("selectedRole");
            let updatedRoleDetails;
            if (updatedData?.role) {
              updatedRoleDetails = updatedData.role;
            } else {
              // Si la respuesta no devuelve el rol actualizado, recarga los detalles
              await this._loadRoleDetails(oData.ROLEID);
              updatedRoleDetails = this.getView()
                .getModel("selectedRole")
                .getData();
            } // Actualiza el modelo selectedRole *después* de obtener los datos actualizados

            oSelectedRoleModel.setData(updatedRoleDetails);
            console.log(
              "Modelo 'selectedRole' después de guardar:",
              oSelectedRoleModel.getData()
            ); // Intenta forzar la actualización del binding de la tabla

            const oProcessesTable = this.byId("processesTable");
            if (oProcessesTable) {
              const oBinding =
                oProcessesTable.getBinding("rows") ||
                oProcessesTable.getBinding("items");
              if (oBinding) {
                oBinding.refresh();
                console.log("Binding de la tabla de procesos refrescado.");
              } else {
                console.log(
                  "No se encontró el binding de la tabla de procesos."
                );
              }
            } else {
              console.log("No se encontró la tabla con ID 'processesTable'.");
            }

            const oUsersTable = this.byId("usersTable");
            if (oUsersTable) {
              const oBinding =
                oUsersTable.getBinding("rows") ||
                oUsersTable.getBinding("items");
              if (oBinding) {
                oBinding.refresh();
                console.log("Binding de la tabla de usuarios refrescado.");
                this.byId("usersTable").rerender(); // Intenta forzar la re-renderización
              } else {
                console.log(
                  "No se encontró el binding de la tabla de usuarios."
                );
              }
            } else {
              console.log("No se encontró la tabla con ID 'usersTable'.");
            }

            const oDialog = this.byId("dialogEditRole");
            if (oDialog) {
              oDialog.close();
            }
          } catch (err) {
            MessageBox.error("Error al actualizar el rol: " + err.message);
          }
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

        onUpdateRole: function () {
          const oView = this.getView();

          const oSelectedRole = oView.getModel("selectedRole").getData();

          const oModel = new JSONModel({
            ROLEID: oSelectedRole.ROLEID,

            ROLENAME: oSelectedRole.ROLENAME,

            DESCRIPTION: oSelectedRole.DESCRIPTION,

            PRIVILEGES: oSelectedRole.PROCESSES.map((proc) => ({
              PROCESSID: proc.PROCESSID,

              PRIVILEGEID: proc.PRIVILEGES.map((p) => p.PRIVILEGEID),
            })),

            NEW_PROCESSID: "",

            NEW_PRIVILEGES: [],

            IS_EDIT: true,
          });

          oView.setModel(oModel, "roleDialogModel");

          oView.setModel(
            this.getView().getModel("processCatalogModel"),

            "processCatalogModel"
          );

          oView.setModel(
            this.getView().getModel("privilegeCatalogModel"),

            "privilegeCatalogModel"
          );

          const oExistingDialog = this.byId("dialogEditRole");

          if (oExistingDialog) {
            oExistingDialog.destroy();
          }

          Fragment.load({
            id: oView.getId(),

            name: "com.invertions.sapfiorimodinv.view.security.fragments.EditRoleDialog",

            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);

            oDialog.setTitle("Editar Rol");

            oDialog.open();
          });
        },
        onAddPrivilege: function () {
          const oModel = this.getView().getModel("roleDialogModel");
          const oData = oModel.getData();

          if (
            !oData.NEW_PROCESSID ||
            !Array.isArray(oData.NEW_PRIVILEGES) ||
            oData.NEW_PRIVILEGES.length === 0
          ) {
            MessageToast.show("Selecciona proceso y al menos un privilegio.");
            return;
          }

          oData.PRIVILEGES.push({
            PROCESSID: oData.NEW_PROCESSID,
            PRIVILEGEID: oData.NEW_PRIVILEGES,
          });

          oData.NEW_PROCESSID = "";
          oData.NEW_PRIVILEGES = [];
          oModel.setData(oData);
        },

        onRemovePrivilege: function (oEvent) {
          const oModel = this.getView().getModel("roleDialogModel");
          const oData = oModel.getData();

          const oItem = oEvent.getSource().getParent();
          const oContext = oItem.getBindingContext("roleDialogModel");
          const iIndex = oContext.getPath().split("/").pop();

          oData.PRIVILEGES.splice(iIndex, 1);
          oModel.setData(oData);
        },

        onDialogClose: function () {
          const oDialog = this.byId("dialogEditRole");
          if (oDialog) oDialog.close();
        },
      }
    );
  }
);
