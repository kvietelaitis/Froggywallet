package controllers

import (
	"strconv"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetUserGroups(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing user id",
		})
	}

	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}

	id := uint(id64)

	if auth := c.Locals("userID"); auth != nil {
		if authID, ok := auth.(uint); ok {
			if authID != id {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Cannot update other user"})
			}
		}
	}

	var user models.Narys
	if err := initializers.DB.Preload("Grupes").Preload("Nariai").First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   user.Grupes,
	})
}
