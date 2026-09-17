/* =========================================================
   AMÉRICAN BULLY CROSSFIT
   CONEXIÓN CON APPWRITE
   ========================================================= */

(async function () {

    // ---------------------------------------------------------
    // 1. CARGAR APPWRITE
    // ---------------------------------------------------------

    const Appwrite = await import(
        "https://cdn.jsdelivr.net/npm/appwrite/+esm"
    );

    const {
        Client,
        Account,
        TablesDB,
        Query
    } = Appwrite;


    // ---------------------------------------------------------
    // 2. CONFIGURACIÓN DE APPWRITE
    // ---------------------------------------------------------

    const ENDPOINT = "https://nyc.cloud.appwrite.io/v1";

    const PROJECT_ID = "6aaa90840010bd6a2337";

    const DATABASE_ID = "6aab296600088de94501";


    // Tablas

    const TABLES = {

        profiles: "6aab2cf8003591239c45",

        months: "6aab3042001d02942abf",

        weeks: "6aab3afa000faa3f18d1",

        workouts: "6aab3cdd001cd829e2e8",

        movements: "6aab3eb0003429eca956",

        results: "6aab406a00168cbe2431",

        personalRecords: "6aab417a00299ee77444"

    };


    // ---------------------------------------------------------
    // 3. CREAR CONEXIÓN
    // ---------------------------------------------------------

    const client = new Client()
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID);

    const account = new Account(client);

    const tablesDB = new TablesDB(client);


    // ---------------------------------------------------------
    // 4. FUNCIONES AUXILIARES
    // ---------------------------------------------------------

    function getPageName() {

        return window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    }


    function redirect(page) {

        window.location.href = page;

    }


    function showMessage(message, type = "error") {

        const possibleElements = [
            "loginMessage",
            "loginError",
            "errorMessage",
            "message"
        ];

        let element = null;

        for (const id of possibleElements) {

            const found = document.getElementById(id);

            if (found) {

                element = found;
                break;

            }

        }

        if (element) {

            element.textContent = message;

            element.style.display = "block";

            element.className = type;

        } else {

            console.log(message);

        }

    }


    // ---------------------------------------------------------
    // 5. OBTENER USUARIO ACTUAL
    // ---------------------------------------------------------

    async function getCurrentUser() {

        try {

            const user = await account.get();

            return user;

        } catch (error) {

            return null;

        }

    }


    // ---------------------------------------------------------
    // 6. OBTENER PERFIL DEL USUARIO
    // ---------------------------------------------------------

    async function getProfile(userId) {

        try {

            const response = await tablesDB.listRows({

                databaseId: DATABASE_ID,

                tableId: TABLES.profiles,

                queries: [

                    Query.equal("user_id", userId),

                    Query.limit(1)

                ]

            });

            if (response.rows.length === 0) {

                return null;

            }

            return response.rows[0];

        } catch (error) {

            console.error(
                "Error obteniendo perfil:",
                error
            );

            return null;

        }

    }


    // ---------------------------------------------------------
    // 7. INICIAR SESIÓN
    // ---------------------------------------------------------

    async function login(email, password) {

        try {

            // Eliminar una sesión anterior si existe

            try {

                await account.deleteSession("current");

            } catch (e) {

                // No pasa nada si no había sesión

            }


            // Crear nueva sesión

            await account.createEmailPasswordSession({

                email: email,

                password: password

            });


            // Obtener usuario

            const user = await account.get();


            // Buscar perfil

            const profile = await getProfile(user.$id);


            if (!profile) {

                await account.deleteSession("current");

                throw new Error(
                    "Tu usuario existe, pero todavía no tiene un perfil registrado."
                );

            }


            // Verificar usuario activo

            if (profile.active !== true) {

                await account.deleteSession("current");

                throw new Error(
                    "Tu cuenta está desactivada. Contacta al coach."
                );

            }


            // Guardar datos básicos de sesión local
            // Esto NO sustituye la seguridad de Appwrite.

            sessionStorage.setItem(
                "americanBullyUser",
                JSON.stringify({

                    id: user.$id,

                    name: profile.name,

                    role: profile.role,

                    active: profile.active

                })

            );


            // -------------------------------------------------
            // REDIRECCIÓN SEGÚN ROL
            // -------------------------------------------------

            if (profile.role === "coach") {

                redirect("coach.html");

                return;

            }


            if (profile.role === "athlete") {

                redirect("athlete.html");

                return;

            }


            // Si el rol no coincide

            await account.deleteSession("current");

            throw new Error(
                "El rol de este usuario no es válido."
            );


        } catch (error) {

            console.error("Error de inicio de sesión:", error);

            showMessage(
                error.message ||
                "No se pudo iniciar sesión."
            );

        }

    }


    // ---------------------------------------------------------
    // 8. CERRAR SESIÓN
    // ---------------------------------------------------------

    async function logout() {

        try {

            await account.deleteSession("current");

        } catch (error) {

            console.log(
                "No había una sesión activa."
            );

        }

        sessionStorage.removeItem(
            "americanBullyUser"
        );

        redirect("login.html");

    }


    // ---------------------------------------------------------
    // 9. PROTEGER PÁGINAS PRIVADAS
    // ---------------------------------------------------------

    async function protectPrivatePage() {

        const page = getPageName();


        const privatePages = [

            "athlete.html",

            "coach.html",

            "biblioteca.html"

        ];


        if (!privatePages.includes(page)) {

            return;

        }


        const user = await getCurrentUser();


        if (!user) {

            redirect("login.html");

            return;

        }


        const profile = await getProfile(user.$id);


        if (!profile || profile.active !== true) {

            await logout();

            return;

        }


        // -----------------------------------------------------
        // CONTROL DE ROLES
        // -----------------------------------------------------

        if (
            page === "coach.html" &&
            profile.role !== "coach"
        ) {

            redirect("athlete.html");

            return;

        }


        if (
            page === "athlete.html" &&
            profile.role !== "athlete"
        ) {

            redirect("coach.html");

            return;

        }


        // -----------------------------------------------------
        // MOSTRAR NOMBRE DEL USUARIO
        // -----------------------------------------------------

        const nameElements = [

            "userName",

            "athleteName",

            "welcomeName",

            "profileName"

        ];


        nameElements.forEach(function (id) {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    profile.name;

            }

        });


        // -----------------------------------------------------
        // MOSTRAR DATOS GLOBALES
        // -----------------------------------------------------

        window.AmericanBullyUser = {

            id: user.$id,

            email: user.email,

            name: profile.name,

            phone: profile.phone || "",

            role: profile.role,

            active: profile.active

        };

    }


    // ---------------------------------------------------------
    // 10. CONECTAR FORMULARIO DE LOGIN
    // ---------------------------------------------------------

    function setupLoginForm() {

        const form =
            document.getElementById("loginForm");


        if (!form) {

            return;

        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const emailInput =
                    document.getElementById("email") ||
                    document.getElementById("loginEmail");


                const passwordInput =
                    document.getElementById("password") ||
                    document.getElementById("loginPassword");


                if (!emailInput || !passwordInput) {

                    showMessage(
                        "No se encontraron los campos de acceso."
                    );

                    return;

                }


                const email =
                    emailInput.value.trim();


                const password =
                    passwordInput.value;


                if (!email || !password) {

                    showMessage(
                        "Introduce tu correo y contraseña."
                    );

                    return;

                }


                showMessage(
                    "Iniciando sesión...",
                    "loading"
                );


                await login(
                    email,
                    password
                );

            }
        );

    }


    // ---------------------------------------------------------
    // 11. BOTONES DE CERRAR SESIÓN
    // ---------------------------------------------------------

    function setupLogoutButtons() {

        const buttons = document.querySelectorAll(
            "#logoutBtn, .logout-btn, [data-logout]"
        );


        buttons.forEach(function (button) {

            button.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    await logout();

                }
            );

        });

    }


    // ---------------------------------------------------------
    // 12. CARGAR PROGRAMACIÓN PÚBLICA
    // ---------------------------------------------------------

    async function getPublishedMonths() {

        try {

            const response =
                await tablesDB.listRows({

                    databaseId: DATABASE_ID,

                    tableId: TABLES.months,

                    queries: [

                        Query.equal(
                            "published",
                            true
                        ),

                        Query.orderDesc(
                            "year"
                        ),

                        Query.orderDesc(
                            "month_number"
                        )

                    ]

                });


            return response.rows;

        } catch (error) {

            console.error(
                "Error cargando meses:",
                error
            );

            return [];

        }

    }


    // ---------------------------------------------------------
    // 13. CARGAR SEMANAS
    // ---------------------------------------------------------

    async function getPublishedWeeks(monthId) {

        try {

            const response =
                await tablesDB.listRows({

                    databaseId: DATABASE_ID,

                    tableId: TABLES.weeks,

                    queries: [

                        Query.equal(
                            "month_id",
                            monthId
                        ),

                        Query.equal(
                            "published",
                            true
                        ),

                        Query.orderAsc(
                            "week_number"
                        )

                    ]

                });


            return response.rows;

        } catch (error) {

            console.error(
                "Error cargando semanas:",
                error
            );

            return [];

        }

    }


    // ---------------------------------------------------------
    // 14. CARGAR WORKOUTS PUBLICADOS
    // ---------------------------------------------------------

    async function getPublishedWorkouts(
        monthId,
        weekId
    ) {

        try {

            const response =
                await tablesDB.listRows({

                    databaseId: DATABASE_ID,

                    tableId: TABLES.workouts,

                    queries: [

                        Query.equal(
                            "month_id",
                            monthId
                        ),

                        Query.equal(
                            "week_id",
                            weekId
                        ),

                        Query.equal(
                            "published",
                            true
                        ),

                        Query.orderAsc(
                            "day"
                        )

                    ]

                });


            return response.rows;

        } catch (error) {

            console.error(
                "Error cargando workouts:",
                error
            );

            return [];

        }

    }


    // ---------------------------------------------------------
    // 15. EXPONER FUNCIONES PARA LAS OTRAS PÁGINAS
    // ---------------------------------------------------------

    window.AmericanBully = {

        client,

        account,

        tablesDB,

        databaseId: DATABASE_ID,

        tables: TABLES,

        getCurrentUser,

        getProfile,

        login,

        logout,

        getPublishedMonths,

        getPublishedWeeks,

        getPublishedWorkouts

    };


    // ---------------------------------------------------------
    // 16. INICIAR
    // ---------------------------------------------------------

    setupLoginForm();

    setupLogoutButtons();

    await protectPrivatePage();


    console.log(
        "✅ AMÉRICAN BULLY conectado con Appwrite"
    );

})();
