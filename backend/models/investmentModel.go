package models

import (
	"time"

	"gorm.io/gorm"
)

type Investicija struct {
	gorm.Model
	ID           uint      `gorm:"primaryKey"`
	SektoriusID  uint      `gorm:"not null"`
	Pavadinimas  string    `gorm:"not null"` // Name
	Kiekis       int       `gorm:"not null"` // Quantity
	PirkimoKaina float64   `gorm:"not null"` // Purchase price
	PirkimoData  time.Time `gorm:"not null"` // Purchase date

	// Relationships
	SektoriusObj   Sektorius        `gorm:"foreignKey:SektoriusID"`
	RinkosDuomenys []RinkosDuomenys `gorm:"foreignKey:InvesticijaID"`
}
