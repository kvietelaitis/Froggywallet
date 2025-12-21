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

	// Relationships
	Investicijos	   []Investicija `gorm:"foreignKey:NarysID" json:"investicijos"`
	Roles              []Role        `gorm:"many2many:narys_roles;"`
	Grupes             []Grupe       `gorm:"many2many:grupe_nariai;"`
	IsiustiPakvietimai []Pakvietimas `gorm:"foreignKey:PakvietePasiunteID"`
	GautiPakvietimai   []Pakvietimas `gorm:"foreignKey:PakvietePriimeID"`
}
