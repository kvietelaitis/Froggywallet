package controllers

import (
	"strconv"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type UserInfoInput struct {
	FirstName string `json:"vardas"`
	LastName  string `json:"pavarde"`
	Username  string `json:"vartotojo_vardas"`
	Email     string `json:"el_pastas"`
}

func GetUsers(c *fiber.Ctx) error {
	var users []models.Narys

	initializers.DB.Find(&users)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   users,
	})
}

func ChangeUserInfo(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing income id",
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
	if err := initializers.DB.First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var input UserInfoInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	if input.Email != "" && input.Email != user.ElPastas {
		var existing models.Narys
		if err := initializers.DB.Where("el_pastas = ?", input.Email).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already taken"})
		}
	}

	if input.Username != "" && input.Username != user.VartotojoVardas {
		var existing models.Narys
		if err := initializers.DB.Where("vartotojo_vardas = ?", input.Username).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Username already taken"})
		}
	}

	updates := map[string]interface{}{
		"Vardas":          input.FirstName,
		"Pavarde":         input.LastName,
		"VartotojoVardas": input.Username,
		"ElPastas":        input.Email,
	}

	if err := initializers.DB.Model(&user).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not update user",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User info updated successfully",
	})
}
