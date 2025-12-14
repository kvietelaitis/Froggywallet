package models

import "gorm.io/gorm"

type Busena string

const (
	BusenaPatvirtintas Busena = "Patvirtintas" // Confirmed
	BusenaLaukiamas    Busena = "Laukiamas"    // Waiting
	BusenaAtsisakytas  Busena = "Atsisakytas"  // Rejected
	BusenaPasibaiges   Busena = "Pasibaiges"   // Expired
)

// Pakvietimas (Invitation)
type Pakvietimas struct {
	gorm.Model
	ID                 uint   `gorm:"primaryKey"`
	SektoriusID        *uint  // Optional sector ID
	GrupeID            *uint  // Optional group ID
	PakvietePasiunteID uint   `gorm:"not null"` // Inviter (sender) ID
	PakvietePriimeID   *uint  // Invitee (receiver) ID
	Token              string `gorm:"not null`
	ElPastas           string `gorm:"not null"`                             // Email
	Busena             Busena `gorm:"type:varchar(50);default:'Laukiamas'"` // Status

	// Relationships
	Grupe         *Grupe `gorm:"foreignKey:GrupeID"`
	PasiunteNarys Narys  `gorm:"foreignKey:PakvietePasiunteID"`
	PriimeNarys   Narys  `gorm:"foreignKey:PakvietePriimeID"`
}
