sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.Login", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        email: "",
        password: ""
      }), "loginModel");

    },

    onLoginPress: async function () {
      const oLogin = this.getView().getModel("loginModel").getData();
       
       try {
        const response = await fetch("https://reversionapicontainer.greenglacier-34ca94a2.westus.azurecontainerapps.io/api/security/crudUsers?action=get", {
          method: "POST"
        });

        const result = await response.json();
        const userList = Array.isArray(result.value) ? result.value : [];

        console.log("email:", oLogin.email);
        console.log("contra::", oLogin.password);

        //  Búsqueda por EMAIL y PASSWORD reales
        const user = userList.find(u =>
          (u.EMAIL || "").trim().toLowerCase() === oLogin.email.trim().toLowerCase() &&
          (u.PASSWORD || "").trim() === oLogin.password.trim()
        );

        if (!user) {
          MessageToast.show("Correo o contraseña incorrectos");
          return;
        }

        const first = user.FIRSTNAME || "";
        const last = user.LASTNAME || "";
        user.initials = first && last
          ? first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase()
          : "US";


        // Guarda el usuario autenticado en appView
        const oAppModel = this.getOwnerComponent().getModel("appView");
        oAppModel.setProperty("/isLoggedIn", true);
        oAppModel.setProperty("/currentUser", user);

        console.log(" Usuario autenticado y guardado:", user);

        // Navega a la vista principal
        this.getOwnerComponent().getRouter().navTo("RouteMain");

      } catch (error) {
        console.error(" Error al autenticar:", error);
        MessageToast.show("Error al conectar con la API");
      }
      
    // QUITAR EL COMENTARIO DE ARRIBA Y COMENTAR ESTO PARA LOGEARSE BIEN
    /*
    const oAppModel = this.getOwnerComponent().getModel("appView");
    oAppModel.setProperty("/isLoggedIn", true);
    this.getOwnerComponent().getRouter().navTo("RouteMain");
    //-------------------------------------------------------------*/
    
    } ,
    

      //Funcion para el ojito
    onVerContraseña: function () {
      const oInput = this.byId("passwordInput");
      const bCurrentType = oInput.getType() === "Text";
      oInput.setType(bCurrentType ? "Password" : "Text");
      this.byId("showPasswordButton").setIcon(bCurrentType ? "sap-icon://show" : "sap-icon://hide");
    }
  });
});