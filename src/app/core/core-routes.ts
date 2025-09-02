import { Routes } from "@angular/router"
import { routes } from "../app.routes"

export const coreRoutes: Routes = [
    {
        path:"login",
        loadComponent: () => import("./login/login").then(m => m.Login)
    }


]