package main

import (
	"os"

	"github.com/KvietelaitisMartynas/froggywallet/backend/controllers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectToDatabase()
	initializers.SyncDatabase()
}

func main() {
	// load templates
	//engine := html.New("./views", ".tmpl")

	// setup app
	// app := fiber.New(fiber.Config{
	// 	Views: engine,
	// })

	app := fiber.New()

	allowOrigins := os.Getenv("FRONTEND_URL")

	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	api := app.Group("/api")
	api.Get("/users", controllers.GetUsers)
	api.Post("/login", controllers.Login)
	api.Post("/register", controllers.Register)

	// 2FA Routes
	api.Post("/login/2fa", controllers.Login2FA)       // The separate screen for 2FA Login
	api.Post("/2fa/generate", controllers.Generate2FA) // For Settings: Generate QR Code
	api.Post("/2fa/verify", controllers.Verify2FA)

	// // setup routes
	// frontend_routes := []string{
	// 	"/",
	// 	"/about",
	// }

	// for _, route := range frontend_routes {
	// 	app.Get(route, controllers.UsersIndex)
	// }

	// start app
	app.Listen(":" + os.Getenv("PORT"))
}
