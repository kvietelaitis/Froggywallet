package models

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	ID               uint   `gorm:"primaryKey"`
	RolesPavadinimas string `gorm:"unique;not null"` // Role name

	// Relationships
	Nariai []Narys `gorm:"foreignKey:RoleID"`
}
