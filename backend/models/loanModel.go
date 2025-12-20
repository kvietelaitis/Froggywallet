package models

import (
	"time"

	"gorm.io/gorm"
)

type Paskola struct {
	gorm.Model
	ID                  uint      `gorm:"primaryKey"`
	NarysID             uint      `gorm:"index"`
	MokejimoKiekis      float64   `gorm:"not null"` // Payment amount
	KitasMokejimas      time.Time `gorm:"not null"` // Next payment
	PaskutinisMokejimas time.Time // Last payment
	Pajamos             float64   // Income (interest earned)
	VisaSkolaDouble     float64   `gorm:"column:visa_skola"` // Total debt

	// Relationships
	Skolininkai []Skolininkas `gorm:"foreignKey:PaskolaID"`
}
