package models

import (
	"time"

	"gorm.io/gorm"
)

type Islaida struct {
	gorm.Model
	ID                 uint      `gorm:"primaryKey"`
	KategorijaID       *uint     // Optional category ID
	GroupID            *uint     `json:"group_id"`
	Suma               float64   `gorm:"not null"`
	Data               time.Time `gorm:"not null"`
	Komentaras         string    // Comment
	Pavadinimas        string    `gorm:"not null"` // Name
	MokejimoBudas      string    // Payment method
	PasikartojimoTipas string    // Recurrence type

	// Relationships
	Kategorija *Kategorija `gorm:"foreignKey:KategorijaID"`
}
