package models

import (
	"time"

	"gorm.io/gorm"
)

type Investicija struct {
	gorm.Model
	ID           uint      `gorm:"primaryKey" json:"id"`
	NarysID      uint      `gorm:"not null" json:"narys_id"`   // Connect investment to user
	SektoriusID  uint      `gorm:"not null" json:"sektorius_id"`
	Pavadinimas  string    `gorm:"not null" json:"pavadinimas"`
	Kiekis       int       `gorm:"not null" json:"kiekis"`
	PirkimoKaina float64   `gorm:"not null" json:"pirkimo_kaina"`
	PirkimoData  time.Time `gorm:"not null" json:"pirkimo_data"`

	// Relationships
	Narys          Narys     `gorm:"foreignKey:NarysID" json:"narys"`
	SektoriusObj   Sektorius `gorm:"foreignKey:SektoriusID" json:"SektoriusObj"`
}
