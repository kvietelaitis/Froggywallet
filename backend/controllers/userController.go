package controllers

import (
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetUsers(c *fiber.Ctx) error {
	var users []models.Narys

	initializers.DB.Find(&users)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   users,
	})
}
