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

	var nrgList []models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ?", id).
		Preload("Grupe").
		Preload("Role").
		Find(&nrgList).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "information not found"})
	}

	groups := make([]fiber.Map, 0, len(nrgList))

	for _, nrg := range nrgList {
		group := nrg.Grupe

		// For each group, get all members
		var groupMembers []models.NarysRoleGrupe
		if err := initializers.DB.
			Where("grupe_id = ?", group.ID).
			Preload("Narys").
			Preload("Role").
			Find(&groupMembers).Error; err != nil {
			continue // skip this group if error
		}

		members := make([]fiber.Map, 0, len(groupMembers))
		for _, gm := range groupMembers {
			members = append(members, fiber.Map{
				"id":       gm.Narys.ID,
				"name":     gm.Narys.Vardas,
				"username": gm.Narys.VartotojoVardas,
				"email":    gm.Narys.ElPastas,
				"role":     gm.Role.RolesPavadinimas,
			})
		}

		isAdmin := nrg.Role.RolesPavadinimas == "Admin" || nrg.Role.RolesPavadinimas == "Administratorius"
		groups = append(groups, fiber.Map{
			"id":          group.ID,
			"name":        group.Pavadinimas,
			"description": group.Aprasymas,
			"role":        nrg.Role.RolesPavadinimas,
			"isAdmin":     isAdmin,
			"members":     members,
		})
	}

	return c.JSON(fiber.Map{"status": "success", "data": fiber.Map{"groups": groups}})
}

func GetGroup(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	userLoc := c.Locals("userID")
	var userID uint
	if userLoc != nil {
		userID = userLoc.(uint)
	}

	// Find the user's role in this group
	var nrg models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", userID, uint(id64)).
		Preload("Role").
		First(&nrg).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "relation not found"})
	}
	currentUserRole := nrg.Role.RolesPavadinimas

	// Load group with members via join table
	var group models.Grupe
	if err := initializers.DB.
		Preload("NarysRoleGrupe.Narys").
		Preload("NarysRoleGrupe.Role").
		First(&group, uint(id64)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	members := make([]fiber.Map, 0, len(group.NarysRoleGrupe))
	for _, nrg := range group.NarysRoleGrupe {
		members = append(members, fiber.Map{
			"id":       nrg.Narys.ID,
			"name":     nrg.Narys.Vardas,
			"username": nrg.Narys.VartotojoVardas,
			"email":    nrg.Narys.ElPastas,
			"role":     nrg.Role.RolesPavadinimas,
		})
	}

	dto := fiber.Map{
		"id":              group.ID,
		"name":            group.Pavadinimas,
		"description":     group.Aprasymas,
		"members":         members,
		"currentUserRole": currentUserRole,
		"currentUserId":   userID,
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

	var nrg models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", userID, uint(id64)).
		Preload("Role").
		First(&nrg).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "relation not found"})
	}

	isAdmin := nrg.Role.RolesPavadinimas == "Admin" || nrg.Role.RolesPavadinimas == "Administratorius"

	if !isAdmin {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
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

	members := make([]fiber.Map, 0, len(group.NarysRoleGrupe))
	for _, nrg := range group.NarysRoleGrupe {
		members = append(members, fiber.Map{
			"id":       nrg.Narys.ID,
			"name":     nrg.Narys.Vardas,
			"username": nrg.Narys.VartotojoVardas,
			"email":    nrg.Narys.ElPastas,
			"role":     nrg.Role.RolesPavadinimas,
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

	var nrg models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", senderID, uint(groupID)).
		Preload("Role").
		First(&nrg).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "relation not found"})
	}

	isAdmin := nrg.Role.RolesPavadinimas == "Admin" || nrg.Role.RolesPavadinimas == "Administratorius"

	if !isAdmin {
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

	var role models.Role
	if err := initializers.DB.Where("roles_pavadinimas = ?", "Member").First(&role).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to find default role"})
	}

	var user models.Narys
	if err := initializers.DB.Where("el_pastas = ?", body.Email).First(&user).Error; err == nil {
		// User exists, check if already in group
		var nrg models.NarysRoleGrupe
		if err := initializers.DB.Where("narys_id = ? AND grupe_id = ?", user.ID, groupID).First(&nrg).Error; err == nil {
			// Already a member
			return c.Status(400).JSON(fiber.Map{"error": "User is already a member of this group"})
		}
		// Not a member, add to group
		nrg = models.NarysRoleGrupe{
			NarysID: user.ID,
			GrupeID: groupID,
			RoleID:  role.ID, // assign appropriate role
		}
		if err := initializers.DB.Create(&nrg).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to add user to group"})
		}
		// Optionally notify user
		return c.JSON(fiber.Map{"status": "success", "message": "User added to group"})
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

	var nrg models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", requesterID, uint(groupID)).
		Preload("Role").
		First(&nrg).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "relation not found"})
	}

	isAdmin := nrg.Role.RolesPavadinimas == "Admin" || nrg.Role.RolesPavadinimas == "Administratorius"

	if !isAdmin {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
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

	var nrg_of_member models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", memberID, groupID).
		First(&nrg_of_member).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "user not in this group"})
	}

	// find or create role
	var role models.Role
	if err := initializers.DB.Where("roles_pavadinimas = ?", body.RoleName).First(&role).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "role not found"})
	}

	nrg.RoleID = role.ID
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

	var nrg models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", requesterID, uint(groupID)).
		Preload("Role").
		First(&nrg).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "relation not found"})
	}

	isAdmin := nrg.Role.RolesPavadinimas == "Admin" || nrg.Role.RolesPavadinimas == "Administratorius"

	if !isAdmin {
		return c.Status(403).JSON(fiber.Map{"error": "Admin required"})
	}

	// prevent self-removal if only admin (optional safeguard)
	if memberID == requesterID {
		return c.Status(400).JSON(fiber.Map{"error": "cannot remove yourself"})
	}

	var nrg_of_member models.NarysRoleGrupe
	if err := initializers.DB.
		Where("narys_id = ? AND grupe_id = ?", memberID, groupID).
		First(&nrg_of_member).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "user not in this group"})
	}

	if err := initializers.DB.Delete(&nrg).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to remove member from group"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "member removed"})
}
