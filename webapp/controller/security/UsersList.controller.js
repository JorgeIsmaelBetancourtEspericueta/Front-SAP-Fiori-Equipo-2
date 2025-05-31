/* eslint-disable valid-jsdoc */
/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable fiori-custom/sap-no-localhost */
sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(BaseController,JSONModel,Log,Fragment,MessageToast,MessageBox){
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.UsersList",{
        onInit: function(){

            // Esto desactiva los botones cuando entras a la vista, hasta que selecciones un usuario en la tabla se activan
            var oViewModel = new JSONModel({
                buttonsEnabled: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            //

            // Carga los usuarios
            this.loadUsers();
        },

        /**
         * Funcion para cargar la lista de usuarios.
         */
        loadUsers: function () {
            var oTable = this.byId("IdTable1UsersManageTable");
            var oModel = new JSONModel();
            var that = this;

            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudUsers?action=get", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
            })
            .then(res => res.json())
            .then(data => {
                data.value.forEach(user => {
                    user.FORMAT_ROLES = that.formatRoles(user.ROLES);
                });
                console.log(data);
                oModel.setData(data);
                oTable.setModel(oModel);
            })
            .catch(err => {
                if(err.message === ("Cannot read properties of undefined (reading 'setModel')")){
                    return;
                }else{
                    MessageToast.show("Error al cargar usuarios: " + err.message);
                }      
            });       
        },

        loadCompanies: function() {
            var oView = this.getView();
            var oCompaniesModel = new JSONModel();

            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=IdCompanies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(data => {
                oCompaniesModel.setData({ companies: data.value });
                oView.setModel(oCompaniesModel, "companiesModel"); // Usa un modelo nombrado
            })
            .catch(err => MessageToast.show("Error al cargar compañías: " + err.message));
        },

        onCompanySelected: function(oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();

            // Limpiar el ComboBox de cedis
            var oView = this.getView();
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "editcomboBoxCedis"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxCedis"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            // Limpiar el ComboBox de departamentos
            var oView = this.getView();
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "editcomboBoxDepartments"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxDepartments"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            this.loadCedis(sSelectedKey);
        },

        loadCedis: function(companyId) {
            var oView = this.getView();
            var oCedisModel = new JSONModel();

            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=IdCedis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(data => {
                // Filtramos los departamentos que correspondan a la empresa seleccionada
                var filtered = data.value.filter(function(depto) {
                    return depto.VALUEPAID === `IdCompanies-${companyId}`;
                });
                oCedisModel.setData({ cedis: filtered });
                oView.setModel(oCedisModel, "cedisModel");
            })
            .catch(err => MessageToast.show("Error al cargar departamentos: " + err.message));
        },

        onCediSelected: function(oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();

            // Limpiar el ComboBox de departamentos
            var oView = this.getView();
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "editcomboBoxDepartments"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxDepartments"));
            if (oComboBoxDepto && typeof oComboBoxDepto.setSelectedKey === "function") {
                oComboBoxDepto.setSelectedKey(""); // Limpia la selección
            }

            this.loadDeptos(sSelectedKey);
        },

        loadDeptos: function(companyId){
            var oView = this.getView();
            var oDeptosModel = new JSONModel();

            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudValues?action=get&labelid=IdDepartments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(data => {
                // Filtramos los departamentos que correspondan a la empresa seleccionada
                var filtered = data.value.filter(function(depto) {
                    return depto.VALUEPAID === `IdCedis-${companyId}`;
                });
                oDeptosModel.setData({ departments: filtered });
                oView.setModel(oDeptosModel, "deptosModel");
            })
            .catch(err => MessageToast.show("Error al cargar departamentos: " + err.message));
        },


        /**
         * Funcion para cargar la lista de roles y poderlos visualizar en el combobox
         * Esto va cambiar ya que quiere que primero carguemos las compañías, luego que carguemos los deptos
         * Y en base a las compañías y depto que coloquemos, se muestren los roles que pertenecen a esta compañía y depto.
         */
        loadRoles: function () {
            var oView = this.getView();
            var oRolesModel = new JSONModel();
            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudRoles?action=get", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then(data => {
                oRolesModel.setData({ roles: data.value });
                oView.setModel(oRolesModel);
            })
            .catch(err => MessageToast.show("Error al cargar roles: " + err.message));        
        },


        /**
         * Esto es para formatear los roles al cargarlos de la bd y que aparezcan separados por un guion medio en la tabla.
         * Ejemplo: Usuario auxiliar-Investor-etc...
         */
        formatRoles: function (rolesArray) {
            return Array.isArray(rolesArray) 
                ? rolesArray.map(role => role.ROLENAME).join("-") 
                : "";
        },

        editFormatRoles: function (rolesArray) {
            if (!Array.isArray(rolesArray) || rolesArray.length === 0) {
                return "";
            }
            // Modelo de roles
            var oRolesModel = this.getView().getModel();
            if (!oRolesModel) {
                this.loadRoles();
                oRolesModel = this.getView().getModel();
            }
            var aRoles = oRolesModel.getProperty("/roles");
            // Mapea los ROLEID a ROLENAME
            return rolesArray.map(function(roleObj) {
                var found = aRoles.find(function(r) { return r.ROLEID === roleObj.ROLEID; });
                return found ? found.ROLENAME : roleObj.ROLEID;
            }).join("-");
        },

        /**
         * Este evento se encarga de crear los items en el VBox con el nombre de los roles que se vayan agregando.
         */
        onRoleSelected: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var sSelectedText = oComboBox.getSelectedItem().getText();

            var oVBox;
            // Este if valida si es la modal de add user o edit user en la que se estáran colocando los roles
            if (oComboBox.getId().includes("editcomboBoxRoles")) {
                oVBox = this.getView().byId("editselectedRolesVBox");  // Update User VBox
            } else {
                oVBox = this.getView().byId("selectedRolesVBox");   // Create User VBox
            }
            // Validar duplicados
            var bExists = oVBox.getItems().some(oItem => oItem.data("roleId") === sSelectedKey);
            if (bExists) {
                MessageToast.show("El rol ya ha sido añadido.");
                return;
            }

            // Crear item visual del rol seleccionado
            var oHBox = new sap.m.HBox({
                items: [
                    new sap.m.Label({ text: sSelectedText }).addStyleClass("sapUiSmallMarginEnd"),
                    // @ts-ignore
                    new sap.m.Button({
                        icon: "sap-icon://decline",
                        type: "Transparent",
                        press: () => oVBox.removeItem(oHBox)
                    })
                ]
            });

            oHBox.data("roleId", sSelectedKey);
            oVBox.addItem(oHBox);
        },

        //===================================================
        //=============== AÑADIR USUARIO ====================
        //===================================================

        /**
         * Función onpress del botón para agregar un nuevo usuario
         */
        onAddUser : function() {
        var oView = this.getView();

        // Modelo para el nuevo usuario
        var oNewUserModel = new sap.ui.model.json.JSONModel({
            USERID: "",
            PASSWORD: "",
            ALIAS: "",
            FIRSTNAME: "",
            LASTNAME: "",
            BALANCE: "",
            BIRTHDAYDATE: null,
            EMPLOYEEID: "",
            EMAIL: "",
            PHONENUMBER: "",
            EXTENSION: "",
            AVATAR: "",
            DEPARTMENT: "",
            FUNCTION: "",
            STREET: "",
            POSTALCODE: "",
            CITY: "",
            REGION: "",
            STATE: "",
            COUNTRY: ""
        });
        oView.setModel(oNewUserModel, "newUserModel");

        if (!this._oCreateUserDialog) {
            Fragment.load({
                id: oView.getId(),
                name: "com.invertions.sapfiorimodinv.view.security.fragments.AddUserDialog",
                controller: this
            }).then(oDialog => {
                this._oCreateUserDialog = oDialog;
                oView.addDependent(oDialog);
                this.loadRoles();
                this.loadCompanies();
                this._oCreateUserDialog.open();
            });
        } else {
            this._oCreateUserDialog.open();
        }
    },

        onSaveUser: function() {
            var oView = this.getView();
            var oNewUserModel = oView.getModel("newUserModel");
            var oData = oNewUserModel.getData();

            // Obtener la compañía seleccionada
            /** @type {sap.m.ComboBox} */
            var oComboBox = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxCompanies"));
            var VID = oComboBox.getProperty("selectedKey");
            var oCompaniesModel = oView.getModel("companiesModel");
            if (oCompaniesModel) {
                var aCompanies = oCompaniesModel.getProperty("/companies");
                var oSelectedCompany = aCompanies.find(function(company) {
                    return company.VALUEID == VID;
            });
            }

            

            // Extraer los valores de la compañía seleccionada
            var COMPANYID = oSelectedCompany ? oSelectedCompany.VALUEID : "";
            var COMPANYNAME = oSelectedCompany ? oSelectedCompany.VALUE : "";
            var COMPANYALIAS = oSelectedCompany ? oSelectedCompany.ALIAS : "";

            // Obtener el departamento seleccionado
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxDepartments"));
            var DEPARTMENT = oComboBoxDepto.getSelectedItem() ? oComboBoxDepto.getSelectedItem().getText() : "";
            
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxCedis"));
            var CEDIID = oComboBoxDepto.getProperty("selectedKey") ? oComboBoxDepto.getProperty("selectedKey") : "";

            // Obtener roles seleccionados
            /** @type {sap.m.VBox} */
            var oVBox = /** @type {sap.m.VBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "selectedRolesVBox"));
            var ROLES = oVBox.getItems().map(function(oItem) {
                return { ROLEID: oItem.data("roleId") };
            });

            /** @type {sap.m.DatePicker} */
            var oDatePicker = /** @type {sap.m.DatePicker} */ (sap.ui.core.Fragment.byId(oView.getId(), "inputUserBirthdayDate"));
            var oDate = oDatePicker.getDateValue(); // Esto sí es un objeto Date o null

            var sBirthday = "";
            if (oDate) {
                var day = String(oDate.getDate()).padStart(2, '0');
                var month = String(oDate.getMonth() + 1).padStart(2, '0');
                var year = oDate.getFullYear();
                sBirthday = `${day}.${month}.${year}`;
            }

            // Construye el objeto usuario
            var oUser = {
                USERID: oData.USERID,
                USERNAME: oData.FIRSTNAME + " " + oData.LASTNAME,
                PASSWORD: oData.PASSWORD,
                ALIAS: oData.ALIAS,
                FIRSTNAME: oData.FIRSTNAME,
                LASTNAME: oData.LASTNAME,
                EMPLOYEEID: oData.EMPLOYEEID,
                EXTENSION: oData.EXTENSION,
                PHONENUMBER: oData.PHONENUMBER,
                EMAIL: oData.EMAIL,
                BIRTHDAYDATE: sBirthday,
                AVATAR: oData.AVATAR,
                COMPANYID,
                COMPANYNAME,
                COMPANYALIAS,
                CEDIID,
                DEPARTMENT,
                FUNCTION: oData.FUNCTION,
                BALANCE: parseFloat(oData.BALANCE) || 0,
                STREET: oData.STREET,
                POSTALCODE: parseInt(oData.POSTALCODE, 10),
                CITY: oData.CITY,
                REGION: oData.REGION,
                STATE: oData.STATE,
                COUNTRY: oData.COUNTRY,
                ROLES
            };

            console.log(JSON.stringify(oUser));

            var oTable = this.byId("IdTable1UsersManageTable");
            var aAllUsers = oTable.getModel().getData().value;
            var error = this._validateUser(oUser, aAllUsers, false);
            if (error) {
                MessageBox.error(error);
                return;
            }

            // Llama a la API para guardar el usuario
            fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudUsers?action=create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({users : oUser})
            })
            .then(async response => {
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Error al guardar usuario: " + errorText);
                }
                return response.json();
            })
            .then(data => {
                MessageToast.show("Usuario guardado correctamente");
                this._oCreateUserDialog.close();
                // Actualizar el modelo local de la tabla
                var oTable = this.byId("IdTable1UsersManageTable");
                var oModel = oTable.getModel();
                var oTableData = oModel.getData();

                var newUser = data.value && data.value[0] && data.value[0].user;
                console.log("Nuevo usuario:", newUser);
                // Formatea los roles
                newUser.FORMAT_ROLES = this.editFormatRoles(newUser.ROLES);

                // Agrega el nuevo usuario
                oTableData.value.push(newUser);
                oModel.setData(oTableData);
            })
            .catch(error => {
                MessageBox.error("No se pudo guardar el usuario:\n" + error.message);
            });
        },

        onCancelUser: function(){
            if (this._oCreateUserDialog) {
                this._oCreateUserDialog.close();
            }
        },

        //===================================================
        //=============== EDITAR USUARIO ====================
        //===================================================

        /**
         * Función onpress del botón para editar un nuevo usuario
         * Agregar la lógica para cargar la info a la modal
         */
        onEditUser: function() {
            var oView = this.getView();

            if (!this.selectedUser) {
                MessageToast.show("Selecciona un usuario para editar");
                return;
            }

            var oEditUserModel = new sap.ui.model.json.JSONModel(Object.assign({}, this.selectedUser));
            oView.setModel(oEditUserModel, "editUserModel");

            // Cargar roles, compañías y departamentos
            var that = this;
            this.loadRoles();
            this.loadCompanies();
            this.loadCedis(this.selectedUser.COMPANYID);
            this.loadDeptos(this.selectedUser.CEDIID);

            if (!this._oEditUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.invertions.sapfiorimodinv.view.security.fragments.EditUserDialog",
                    controller: this
                }).then(oDialog => {
                    this._oEditUserDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._oEditUserDialog.open();
                    this._fillEditRolesVBox();
                });
            } else {
                this._oEditUserDialog.open();
                // Selecciona la compañía si el ComboBox ya existe
                var oCombo = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxCompanies"));
                if (oCombo && this.selectedUser.COMPANYID) {
                    oCombo.setSelectedKey(this.selectedUser.COMPANYID);
                }

                var oCombo = /** @type {sap.m.ComboBox} */ (sap.ui.core.Fragment.byId(oView.getId(), "comboBoxDepartments"));
                if (oCombo && this.selectedUser.DEPARTMENT) {
                    oCombo.setSelectedKey(this.selectedUser.DEPARTMENT);
                }

                this._fillEditRolesVBox();
            }
        },

        /**
         * Llena el VBox de roles seleccionados en la edición
         */
        _fillEditRolesVBox: function() {
            var oView = this.getView();
            var oVBox = oView.byId("editselectedRolesVBox");
            if (!oVBox) return;
            oVBox.removeAllItems();
            // Obtener los roles
            var oRolesModel = oView.getModel();
            var aRolesCatalog = oRolesModel ? oRolesModel.getProperty("/roles") : [];

            var aRoles = (this.selectedUser && this.selectedUser.ROLES) ? this.selectedUser.ROLES : [];
            aRoles.forEach(function(role) {
                // Busca el nombre del rol usando el ROLEID
                var found = aRolesCatalog.find(function(r) { return r.ROLEID === role.ROLEID; });
                var roleName = found ? found.ROLENAME : role.ROLEID;

                var oHBox = new sap.m.HBox({
                    items: [
                        new sap.m.Label({ text: roleName }).addStyleClass("sapUiSmallMarginEnd"),
                        new sap.m.Button({
                            icon: "sap-icon://decline",
                            type: sap.m.ButtonType.Transparent,
                            press: function() { oVBox.removeItem(oHBox); }
                        })
                    ]
                });
                oHBox.data("roleId", role.ROLEID);
                oVBox.addItem(oHBox);
            });
        },

        onEditSaveUser: function() {
            var oView = this.getView();
            var oEditUserModel = oView.getModel("editUserModel");
            var oData = oEditUserModel.getData();

            // Obtener la compañía seleccionada
            var oComboBox = /** @type {sap.m.ComboBox} */ 
            (sap.ui.core.Fragment.byId(oView.getId(), "editComboBoxCompanies"));
            var VID = oComboBox.getSelectedKey();
            var oCompaniesModel = oView.getModel("companiesModel");
            var aCompanies = oCompaniesModel.getProperty("/companies");
            var oSelectedCompany = aCompanies.find(function(company) {
                return company.VALUEID == VID;
            });

            // Extraer los valores de la compañía seleccionada
            var COMPANYID = oSelectedCompany ? oSelectedCompany.VALUEID : "";
            var COMPANYNAME = oSelectedCompany ? oSelectedCompany.VALUE : "";
            var COMPANYALIAS = oSelectedCompany ? oSelectedCompany.ALIAS : "";

            // Obtener el departamento seleccionado
            /** @type {sap.m.ComboBox} */
            var oComboBoxDepto = /** @type {sap.m.ComboBox} */ 
            (sap.ui.core.Fragment.byId(oView.getId(), "editcomboBoxDepartments"));
            var DEPARTMENT = oComboBoxDepto.getSelectedItem() ? oComboBoxDepto.getSelectedItem().getText() : "";
            
            /** @type {sap.m.ComboBox} */
            var oComboBoxCedi = /** @type {sap.m.ComboBox} */ 
            (sap.ui.core.Fragment.byId(oView.getId(), "editcomboBoxCedis"));
            var CEDIID = oComboBoxCedi.getSelectedKey() ? oComboBoxCedi.getSelectedKey() : "";

            // Obtener roles seleccionados
            var oVBox = oView.byId("editselectedRolesVBox");
            var ROLES = oVBox.getItems().map(function(oItem) {
                return { ROLEID: oItem.data("roleId") };
            });

            // Obtener y formatear la fecha de nacimiento
            var sBirthday = "";
            /** @type {sap.m.DatePicker} */
            var oDatePicker = /** @type {sap.m.DatePicker} */ (sap.ui.core.Fragment.byId(oView.getId(), "editUserBirthdayDate"));
            var oDate = oDatePicker.getDateValue();

            // Si el usuario no interactuó con el DatePicker, intenta convertir el valor del modelo
            if (!oDate && oData.BIRTHDAYDATE) {
                sBirthday = oData.BIRTHDAYDATE;
            }



            if (oDate) {
                var day = String(oDate.getDate()).padStart(2, '0');
                var month = String(oDate.getMonth() + 1).padStart(2, '0');
                var year = oDate.getFullYear();
                sBirthday = `${day}.${month}.${year}`;
            }

            // Construye el objeto usuario actualizado
            var oUser = {
                USERID: oData.USERID,
                USERNAME: oData.FIRSTNAME + " " + oData.LASTNAME,
                PASSWORD: oData.PASSWORD,
                ALIAS: oData.ALIAS,
                FIRSTNAME: oData.FIRSTNAME,
                LASTNAME: oData.LASTNAME,
                EMPLOYEEID: oData.EMPLOYEEID,
                EXTENSION: oData.EXTENSION,
                PHONENUMBER: oData.PHONENUMBER,
                EMAIL: oData.EMAIL,
                BIRTHDAYDATE: sBirthday,
                AVATAR: oData.AVATAR,
                COMPANYID,
                COMPANYNAME,
                COMPANYALIAS,
                CEDIID,
                DEPARTMENT,
                FUNCTION: oData.FUNCTION,
                BALANCE: parseFloat(oData.BALANCE) || 0,
                STREET: oData.STREET,
                POSTALCODE: parseInt(oData.POSTALCODE, 10),
                CITY: oData.CITY,
                REGION: oData.REGION,
                STATE: oData.STATE,
                COUNTRY: oData.COUNTRY,
                ROLES
            };
            console.log("Usuario a actualizar:", JSON.stringify(oUser));
            this._originalUserId = this.selectedUser.USERID;
            var oTable = this.byId("IdTable1UsersManageTable");
            var aAllUsers = oTable.getModel().getData().value;
            var error = this._validateUser(oUser, aAllUsers, true);
            if (error) {
                MessageBox.error(error);
                return;
            }

            // Llama a la API para actualizar el usuario
            fetch(`https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudUsers?action=update&userid=${encodeURIComponent(this.selectedUser.USERID)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ users: oUser })
            })
            .then(async response => {
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Error al actualizar usuario: " + errorText);
                }
                return response.json();
            })
            .then(data => {
                MessageToast.show("Usuario actualizado correctamente");
                // Actualiza el modelo local de la tabla
                var oTable = this.byId("IdTable1UsersManageTable");
                var oModel = oTable.getModel();
                var oTableData = oModel.getData();

                
                var idx = oTableData.value.findIndex(u => u.USERID === this._originalUserId);
                if (idx !== -1) {
                    oTableData.value[idx] = oUser;
                    oTableData.value[idx].FORMAT_ROLES = this.editFormatRoles(oUser.ROLES);
                    
                    oModel.setData(oTableData);
                }
                //this._originalUserId = null;
                // Actualizar this.selectedUser para que apunte al objeto actualizado
                this.selectedUser = oTableData.value[idx];
                this._oEditUserDialog.close();
            })
            .catch(error => {
                MessageBox.error("No se pudo actualizar el usuario:\n" + error.message);
            });
        },

        onEditCancelUser: function(){
            if (this._oEditUserDialog) {
                var oView = this.getView();
                // Limpia el modelo editUserModel
                var oEditUserModel = oView.getModel("editUserModel");
                if (oEditUserModel) {
                    oEditUserModel.setData({
                        USERID: "",
                        PASSWORD: "",
                        USERNAME: "",
                        ALIAS: "",
                        FIRSTNAME: "",
                        LASTNAME: "",
                        BALANCE: "",
                        BIRTHDAYDATE: null,
                        EMPLOYEEID: "",
                        EMAIL: "",
                        PHONENUMBER: "",
                        EXTENSION: "",
                        AVATAR: "",
                        DEPARTMENT: "",
                        FUNCTION: "",
                        STREET: "",
                        POSTALCODE: "",
                        CITY: "",
                        REGION: "",
                        STATE: "",
                        COUNTRY: "",
                        COMPANYID: "",
                        CEDIID: "",
                        ROLES: []
                    });
                }

                this._oEditUserDialog.close();
            }
        },

        // ===================================================
        // ================= Validaciones ====================
        // ===================================================
        _validateUser: function(oUser, aAllUsers, isEdit = false) {
            var errors = [];

            const fieldNames = {
                USERID: "Usuario",
                PASSWORD: "Contraseña",
                FIRSTNAME: "Nombre",
                LASTNAME: "Apellido",
                EMAIL: "Correo electrónico",
                COMPANYID: "Compañía",
                DEPARTMENT: "Departamento"
            };

            // Campos obligatorios
            const requiredFields = [
                "USERID", "PASSWORD", "FIRSTNAME","LASTNAME", "EMAIL", "COMPANYID", "DEPARTMENT"
            ];
            for (let field of requiredFields) {
                if (!oUser[field] || String(oUser[field]).trim() === "") {
                    errors.push(`El campo "${fieldNames[field] || field}" es obligatorio.`);
                }
            }

            // USERID único
            const isDuplicate = aAllUsers.some(u =>
                    u.USERID === oUser.USERID && u.USERID !== this._originalUserId
                );

                if (isDuplicate) {
                    errors.push("El USERID ya existe. Debe ser único.");
                }


            // if (!isEdit || (isEdit && oUser.USERID !== this._originalUserId)) {
            //     if (aAllUsers.some(u => u.USERID === oUser.USERID)) {
            //         errors.push("El USERID ya existe. Debe ser único.");
            //     }
            // }

            // Número de teléfono válido
            if (!this.isValidPhoneNumber(oUser.PHONENUMBER)) {
                errors.push("El número de teléfono no es válido.");
            }

            // Email válido
            if (!this.isValidEmail(oUser.EMAIL)) {
                errors.push("El correo electrónico no es válido.");
            }

            // Balance numérico
            if (isNaN(oUser.BALANCE)) {
                errors.push("El balance debe ser un número.");
            }

            // Al menos un rol
            if (!Array.isArray(oUser.ROLES) || oUser.ROLES.length === 0) {
                errors.push("Debes asignar al menos un rol.");
            }

            return errors.length > 0 ? errors.join("\n") : null;
        },

        // ===================================================
        // ========= Eliminar Usuario Fisicamente ============
        // ===================================================

        /**
         * Función onDeleteUser .
         */
        onDeleteUser: function(){
            if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas eliminar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar eliminación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.deleteUser(that.selectedUser.USERID);
                        }
                    }
                });
            }else{
                MessageToast.show("Selecciona un usuario para eliminar de la base de datos");
            }
        },

        deleteUser: function(UserId){
            var that = this;
            fetch(`https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=fisic&userid=${encodeURIComponent(UserId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(async response => {
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Error al eliminar usuario: " + errorText);
                }
                return response.json();
            })
            .then(data => {
                MessageToast.show("Usuario eliminado correctamente");
                // Elimina el usuario del array y actualiza el modelo
                var oTable = that.byId("IdTable1UsersManageTable");
                var oModel = oTable.getModel();
                var oData = oModel.getData();
                oData.value = oData.value.filter(u => u.USERID !== UserId);
                oModel.setData(oData);
            })
            .catch(error => {
                MessageBox.error("No se pudo eliminar el usuario:\n" + error.message);
            });
        },

        // ===================================================
        // ============ Desactivar el usuario ================
        // ===================================================

        /**
         * Función onDesactivateUser.
         */
        onDesactivateUser: function(){
            if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas desactivar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar desactivación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.desactivateUser(that.selectedUser.USERID);
                        }
                    }
                });
            }else{
                MessageToast.show("Selecciona un usuario para desactivar");
            }
        },

        desactivateUser: function (UserId) {
            var that = this;
            fetch(`https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=logic&userid=${encodeURIComponent(UserId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(async response => {
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error("Error al desactivar usuario: " + errorText);
                    }
                    return response.json();
                })
                .then(data => {
                    MessageToast.show("Usuario desactivado correctamente");
                    // Se actualiza el modelo localmente sin volver a llamar a la API
                    var oTable = that.byId("IdTable1UsersManageTable");
                    var oModel = oTable.getModel();
                    var oData = oModel.getData();
                    var user = oData.value.find(u => u.USERID === UserId);

                    if (user) {
                        // Asegurar que DETAIL_ROW exista y tenga la estructura mínima
                        user.DETAIL_ROW = {
                            ...user.DETAIL_ROW,
                            ACTIVED: false,
                            DELETED: true,
                            DETAIL_ROW_REG: user.DETAIL_ROW?.DETAIL_ROW_REG || []
                        };
                    }

                    oModel.setData(oData);
                })
                .catch(error => {
                    MessageBox.error("No se pudo desactivar el usuario:\n" + error.message);
                });
        },



        // ===================================================
        // ============== Activar el usuario =================
        // ===================================================

        /**
         * Función onActivateUser.
         */
        onActivateUser: function(){
            if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas activar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar activación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.activateUser(that.selectedUser.USERID);
                        }
                    }
                });
            }else{
                MessageToast.show("Selecciona un usuario para activar");
            }
        },
        activateUser: function (UserId) {
            var that = this;
            fetch(`https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/deleteAny?borrado=activar&userid=${encodeURIComponent(UserId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(async response => {
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error("Error al activar usuario: " + errorText);
                    }
                    return response.json();
                })
                .then(data => {
                    MessageToast.show("Usuario activado correctamente");
                    // Se actualiza el modelo localmente sin volver a llamar a la API
                    var oTable = that.byId("IdTable1UsersManageTable");
                    var oModel = oTable.getModel();
                    var oData = oModel.getData();
                    var user = oData.value.find(u => u.USERID === UserId);

                    if (user) {
                        // Asegurar que DETAIL_ROW exista y tenga la estructura mínima
                        user.DETAIL_ROW = {
                            ...user.DETAIL_ROW,
                            ACTIVED: true,
                            DELETED: false,
                            DETAIL_ROW_REG: user.DETAIL_ROW?.DETAIL_ROW_REG || []
                        };
                    }

                    oModel.setData(oData);
                })
                .catch(error => {
                    MessageBox.error("No se pudo activar el usuario:\n" + error.message);
                });
        },


        //===================================================
        //=============== Funciones de la tabla =============
        //===================================================

        /**
         * Función que obtiene el usuario que se selecciona en la tabla en this.selectedUser se guarda todo el usuario
         * Además activa los botones de editar/eliminar/desactivar y activar
         */
        onUserRowSelected: function () {
            var oTable = this.byId("IdTable1UsersManageTable");
            var iSelectedIndex = oTable.getSelectedIndex();

            if (iSelectedIndex < 0) {
                this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
                return;
            }

            var oContext = oTable.getContextByIndex(iSelectedIndex);
            var UserData = oContext.getObject();

            this.selectedUser = UserData;

            // Activa los botones
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", true);
        },

        onSearchUser: function (oEvent) {
            var sQuery = oEvent.getSource().getValue().toLowerCase();
            var oTable = this.byId("IdTable1UsersManageTable");
            var oBinding = oTable.getBinding("rows");
            if (!oBinding) return;

            // Si la búsqueda está vacía, elimina los filtros
            if (!sQuery) {
                oBinding.filter([]);
                return;
            }

            // Crea un array de filtros para todos los campos relevantes
            var aFilters = [];

            // Campos a buscar
            var aFields = [
                "USERID", "USERNAME", "FIRSTNAME", "LASTNAME", "EMAIL", "COMPANYNAME", "DEPARTMENT", "PHONENUMBER","BIRTHDAYDATE", "FUNCTION"
            ];

            aFields.forEach(function (field) {
                aFilters.push(new sap.ui.model.Filter(field, sap.ui.model.FilterOperator.Contains, sQuery));
            });

            aFilters.push(
                new sap.ui.model.Filter({
                    path: "ROLES",
                    test: function(aRoles) {
                        if (!Array.isArray(aRoles)) return false;
                        return aRoles.some(function(role) {
                            return (role.ROLENAME && role.ROLENAME.toLowerCase().includes(sQuery)) ||
                                (role.ROLEID && role.ROLEID.toLowerCase().includes(sQuery));
                        });
                    }
                })
            );

            // Filtro especial para "activo"/"inactivo"
            if (sQuery === "activo" || sQuery === "inactivo") {
                aFilters = [
                    new sap.ui.model.Filter("DETAIL_ROW/ACTIVED", sap.ui.model.FilterOperator.EQ, sQuery === "activo")
                ];
            }

            // Aplica el filtro
            oBinding.filter(new sap.ui.model.Filter(aFilters, false)); // false = OR, true = AND
        },

        onRefresh: function(){
            this.loadUsers();
        },


        //===================================================
        //=========== Validar email y phonenumber ===========
        //===================================================

        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        isValidPhoneNumber: function(phone) {
            var sNumbers = phone.replace(/\D/g, "");
            if (sNumbers.length === 10 || sNumbers === "") {
                return true;
            } else {
                return false;
            }
        },

        onPhoneLiveChange: function(oEvent) {
            var sValue = oEvent.getParameter("value").replace(/\D/g, ""); // Solo números
            // Formato: 999-999-9999
            if (sValue.length > 3 && sValue.length <= 6)
                sValue = sValue.slice(0,3) + "-" + sValue.slice(3);
            else if (sValue.length > 6)
                sValue = sValue.slice(0,3) + "-" + sValue.slice(3,6) + "-" + sValue.slice(6,10);
            oEvent.getSource().setValue(sValue);
        }


    });
});