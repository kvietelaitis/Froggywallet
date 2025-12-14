package models

import (
	"gorm.io/gorm"
)

type Narys struct {
	gorm.Model
	ElPastas         string `gorm:"unique;not null"` // Email
	Slaptazodis      string `gorm:"not null"`        // Password (hashed)
	Vardas           string `gorm:"not null"`        // First name
	Pavarde          string `gorm:"not null"`        // Last name
	VartotojoVardas  string `gorm:"unique"`          // Username
	TwoFactorSecret  string `json:"-"`
	TwoFactorEnabled bool   `gorm:"default:false"`

	RoleID *uint
	Role   Role `gorm:"foreignKey:RoleID"`

	GrupeID *uint
	Grupe   Grupe `gorm:"foreignKey:GrupeID"`

	Sektoriai          []Sektorius   `gorm:"foreignKey:NarysID"`
	IsiustiPakvietimai []Pakvietimas `gorm:"foreignKey:PakvietePasiunteID"`
	GautiPakvietimai   []Pakvietimas `gorm:"foreignKey:PakvietePriimeID"`
}
