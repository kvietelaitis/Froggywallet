package main

import (
	"os"

	"github.com/KvietelaitisMartynas/froggywallet/backend/controllers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/middleware"
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
		AllowOrigins:     allowOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	api := app.Group("/api")

	api.Get("/users", controllers.GetUsers)
	api.Post("/login", controllers.Login)
	api.Post("/register", controllers.Register)
	api.Post("/login/2fa", controllers.Login2FA)
	api.Post("/2fa/generate", controllers.Generate2FA)
	api.Post("/2fa/verify", controllers.Verify2FA)
	api.Post("/logout", controllers.Logout)

	api.Get("/me", middleware.RequireAuth, controllers.Me)

	loans := api.Group("/loans", middleware.RequireAuth)
	loans.Get("/", controllers.GetLoans)
	loans.Get("/upcoming", controllers.GetUpcomingPayments)
	loans.Get("/:id", controllers.GetLoan)
	loans.Post("/", controllers.CreateLoan)
	loans.Put("/:id", controllers.UpdateLoan)
	loans.Delete("/:id", controllers.DeleteLoan)
	loans.Post("/:id/pay", controllers.PayLoan)
	loans.Get("/:id/calculate", controllers.CalculateMonthlyPayment)

	debtors := api.Group("/debtors", middleware.RequireAuth)
	debtors.Get("/", controllers.GetDebtors)
	debtors.Get("/filter", controllers.FilterDebtors)
	debtors.Get("/loan/:loanId", controllers.GetDebtorsByLoan)
	debtors.Post("/", controllers.CreateDebtor)
	debtors.Put("/:id", controllers.UpdateDebtor)
	debtors.Delete("/:id", controllers.DeleteDebtor)

	incomes := api.Group("/incomes", middleware.RequireAuth)
	incomes.Post("/create-income", controllers.CreateIncome)
	incomes.Get("/user/:id", controllers.GetIncomes) // Changed from /:id to /user/:id
	incomes.Get("/:id", controllers.GetIncome)
	incomes.Put("/:id", controllers.UpdateIncome)
	incomes.Delete("/:id", controllers.DeleteIncome)

	groups := api.Group("/groups", middleware.RequireAuth)
	groups.Get("/:id", controllers.GetUserGroups)

	user := api.Group("/user", middleware.RequireAuth)
	user.Put("/change-info/:id", controllers.ChangeUserInfo)
	user.Put("/change-password/:id", controllers.ChangePassword)

	expenses := api.Group("/expenses")
	expenses.Get("/", controllers.GetExpenses)
	expenses.Get("/:id", controllers.GetExpense)
	expenses.Post("/", controllers.CreateExpense)
	expenses.Put("/:id", controllers.UpdateExpense)
	expenses.Delete("/:id", controllers.DeleteExpense)

	categories := api.Group("/categories")
	categories.Get("/", controllers.GetCategories)
	categories.Post("/", controllers.CreateCategory)

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
