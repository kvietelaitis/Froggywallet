package initializers

import (
	"log"

	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
)

func SeedRoles() {
	roles := []models.Role{
		{RolesPavadinimas: "Admin"},
		{RolesPavadinimas: "Member"},
		{RolesPavadinimas: "Guest"},
	}

	for _, role := range roles {
		var existing models.Role
		if err := DB.Where("roles_pavadinimas = ?", role.RolesPavadinimas).First(&existing).Error; err != nil {
			if err := DB.Create(&role).Error; err != nil {
				log.Printf("Failed to create role %s: %v", role.RolesPavadinimas, err)
			}
		}
	}
}
