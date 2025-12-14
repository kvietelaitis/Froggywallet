package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"strconv"

	"github.com/KvietelaitisMartynas/froggywallet/backend/helpers"
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
	if err := initializers.DB.Preload("Grupe").Preload("Grupe.Nariai").Preload("Role").First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	currentUserRole := ""
	if user.Role.RolesPavadinimas != "" {
		currentUserRole = user.Role.RolesPavadinimas
	}

	if user.GrupeID == nil {
		return c.JSON(fiber.Map{"status": "success", "data": []models.Grupe{}})
	}

	return c.JSON(fiber.Map{"status": "success", "data": []models.Grupe{user.Grupe}, "currentUserRole": currentUserRole})
}

func GetGroup(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	userLoc := c.Locals("userID")
	var currentUserRole string
	if userLoc != nil {
		userID := userLoc.(uint)
		var user models.Narys
		if err := initializers.DB.Preload("Role").First(&user, userID).Error; err == nil {
			currentUserRole = user.Role.RolesPavadinimas
		}
	}

	currentUserId := uint(0)
	if userLoc != nil {
		currentUserId = userLoc.(uint)
	}

	var group models.Grupe
	if err := initializers.DB.Preload("Nariai.Role").First(&group, uint(id64)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	members := make([]fiber.Map, 0, len(group.Nariai))
	for _, m := range group.Nariai {
		members = append(members, fiber.Map{
			"id":       m.ID,
			"name":     m.Vardas,
			"username": m.VartotojoVardas,
			"email":    m.ElPastas,
			"role":     m.Role.RolesPavadinimas,
		})
	}

	dto := fiber.Map{
		"id":              group.ID,
		"name":            group.Pavadinimas,
		"description":     group.Aprasymas,
		"members":         members,
		"currentUserRole": currentUserRole,
		"currentUserId":   currentUserId,
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

	if user.Role.RolesPavadinimas != "Administratorius" && user.Role.RolesPavadinimas != "Admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
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

	if sender.Role.RolesPavadinimas != "Administratorius" && sender.Role.RolesPavadinimas != "Admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
	}

	var group models.Grupe
	if err := initializers.DB.First(&group, groupID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
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

	// Send invite email asynchronously
	go func() {
		if err := helpers.SendInviteEmail(invite.ElPastas, invite.Token, group.Pavadinimas); err != nil {
			log.Printf("Failed to send invite email to %s: %v", invite.ElPastas, err)
		} else {
			log.Printf("Invite email sent to %s", invite.ElPastas)
		}
	}()

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"id":    invite.ID,
			"token": invite.Token,
			"email": invite.ElPastas,
		},
	})
}

type UpdateMemberRoleRequest struct {
	RoleName string `json:"role"`
}

func UpdateMemberRole(c *fiber.Ctx) error {
	groupIDp, _ := strconv.ParseUint(c.Params("groupId"), 10, 64)
	memberIDp, _ := strconv.ParseUint(c.Params("memberId"), 10, 64)
	groupID, memberID := uint(groupIDp), uint(memberIDp)

	// auth
	uidLoc := c.Locals("userID")
	if uidLoc == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	requesterID := uidLoc.(uint)

	// verify requester is admin of this group
	var requester models.Narys
	if err := initializers.DB.Preload("Role").First(&requester, requesterID).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "user not found"})
	}
	if requester.GrupeID == nil || *requester.GrupeID != groupID {
		return c.Status(403).JSON(fiber.Map{"error": "not a member"})
	}
	if requester.Role.RolesPavadinimas != "Admin" && requester.Role.RolesPavadinimas != "Administratorius" {
		return c.Status(403).JSON(fiber.Map{"error": "admin required"})
	}

	var body UpdateMemberRoleRequest
	if err := c.BodyParser(&body); err != nil || body.RoleName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "role required"})
	}

	// find target member
	var member models.Narys
	if err := initializers.DB.First(&member, memberID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "member not found"})
	}
	if member.GrupeID == nil || *member.GrupeID != groupID {
		return c.Status(400).JSON(fiber.Map{"error": "user not in this group"})
	}

	// find or create role
	var role models.Role
	if err := initializers.DB.FirstOrCreate(&role, models.Role{RolesPavadinimas: body.RoleName}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to get role"})
	}

	member.RoleID = &role.ID
	if err := initializers.DB.Save(&member).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update member"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "role updated"})
}

func RemoveMember(c *fiber.Ctx) error {
	groupIDp, _ := strconv.ParseUint(c.Params("groupId"), 10, 64)
	memberIDp, _ := strconv.ParseUint(c.Params("memberId"), 10, 64)
	groupID, memberID := uint(groupIDp), uint(memberIDp)

	// auth
	uidLoc := c.Locals("userID")
	if uidLoc == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	requesterID := uidLoc.(uint)

	// verify requester is admin
	var requester models.Narys
	if err := initializers.DB.Preload("Role").First(&requester, requesterID).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "user not found"})
	}
	if requester.GrupeID == nil || *requester.GrupeID != groupID {
		return c.Status(403).JSON(fiber.Map{"error": "not a member"})
	}
	if requester.Role.RolesPavadinimas != "Admin" && requester.Role.RolesPavadinimas != "Administratorius" {
		return c.Status(403).JSON(fiber.Map{"error": "admin required"})
	}

	// prevent self-removal if only admin (optional safeguard)
	if memberID == requesterID {
		return c.Status(400).JSON(fiber.Map{"error": "cannot remove yourself"})
	}

	// find target
	var member models.Narys
	if err := initializers.DB.First(&member, memberID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "member not found"})
	}
	if member.GrupeID == nil || *member.GrupeID != groupID {
		return c.Status(400).JSON(fiber.Map{"error": "user not in this group"})
	}

	// remove from group (set GrupeID to nil)
	member.GrupeID = nil
	member.RoleID = nil
	if err := initializers.DB.Save(&member).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to remove member"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "member removed"})
}
