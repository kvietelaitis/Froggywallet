package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"strconv"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type UpdateGroupRequest struct {
	Pavadinimas string `json:"pavadinimas"`
	Aprasymas   string `json:"aprasymas"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreateInviteRequest struct {
	Email string `json:"el_pastas"`
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

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

	// preload group and its members, then return []Grupe
	if err := initializers.DB.Preload("Grupe").Preload("Grupe.Nariai").First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	if user.GrupeID == nil {
		return c.JSON(fiber.Map{"status": "success", "data": []models.Grupe{}})
	}
	return c.JSON(fiber.Map{"status": "success", "data": []models.Grupe{user.Grupe}})
}

func GetGroup(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var group models.Grupe
	if err := initializers.DB.Preload("Nariai").First(&group, uint(id64)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	members := make([]fiber.Map, 0, len(group.Nariai))
	for _, m := range group.Nariai {
		members = append(members, fiber.Map{
			"id":       m.ID,
			"name":     m.Vardas,
			"username": m.VartotojoVardas,
			"email":    m.ElPastas,
		})
	}

	dto := fiber.Map{
		"id":          group.ID,
		"name":        group.Pavadinimas,
		"description": group.Aprasymas,
		"members":     members,
	}

	return c.JSON(fiber.Map{"status": "success", "data": dto})
}

func UpdateGroup(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}
	groupID := uint(id64)

	// auth
	userLoc := c.Locals("userID")
	if userLoc == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	userID, ok := userLoc.(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	// load user to verify membership (and optional role)
	var user models.Narys
	if err := initializers.DB.Preload("Role").First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user not found"})
	}

	// require user belongs to the group (or extend with role check if desired)
	if user.GrupeID == nil || *user.GrupeID != groupID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "not allowed to update this group"})
	}

	// parse body (support Lithuanian and English keys)
	var body UpdateGroupRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	// load group
	var group models.Grupe
	if err := initializers.DB.First(&group, groupID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	// apply updates (prefer pavadinimas/aprasymas, fallback to name/description)
	if body.Pavadinimas != "" {
		group.Pavadinimas = body.Pavadinimas
	} else if body.Name != "" {
		group.Pavadinimas = body.Name
	}
	if body.Aprasymas != "" {
		group.Aprasymas = body.Aprasymas
	} else if body.Description != "" {
		group.Aprasymas = body.Description
	}

	if err := initializers.DB.Save(&group).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not update group"})
	}

	// return normalized DTO (with members)
	if err := initializers.DB.Preload("Nariai").First(&group, group.ID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not reload group"})
	}
	members := make([]fiber.Map, 0, len(group.Nariai))
	for _, m := range group.Nariai {
		members = append(members, fiber.Map{
			"id":       m.ID,
			"name":     m.Vardas,
			"username": m.VartotojoVardas,
			"email":    m.ElPastas,
		})
	}

	dto := fiber.Map{
		"id":          group.ID,
		"name":        group.Pavadinimas,
		"description": group.Aprasymas,
		"members":     members,
	}
	return c.JSON(fiber.Map{"status": "success", "data": dto})
}

func CreateInvite(c *fiber.Ctx) error {
	groupIDp, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	groupID := uint(groupIDp)

	uidLoc := c.Locals("userID")
	if uidLoc == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	senderID := uidLoc.(uint)

	var sender models.Narys
	if err := initializers.DB.Preload("Role").First(&sender, senderID).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	if sender.GrupeID == nil || *sender.GrupeID != groupID {
		return c.Status(403).JSON(fiber.Map{"error": "Not a member"})
	}

	if sender.Role.RolesPavadinimas != "Administratorius" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
	}

	var body CreateInviteRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid body",
		})
	}

	if body.Email == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Email required",
		})
	}

	var existing models.Pakvietimas
	if err := initializers.DB.Where("el_pastas = ? AND grupe_id = ? AND busena = ?",
		body.Email, groupID, models.BusenaLaukiamas).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invite already exists"})
	}

	invite := models.Pakvietimas{
		GrupeID:            &groupID,
		PakvietePasiunteID: senderID,
		ElPastas:           body.Email,
		Token:              generateToken(),
		Busena:             models.BusenaLaukiamas,
	}

	if err := initializers.DB.Create(&invite).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create invite",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"id":    invite.ID,
			"token": invite.Token,
			"email": invite.ElPastas,
		},
	})
}
