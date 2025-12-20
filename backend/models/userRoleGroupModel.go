package models

type NarysRoleGrupe struct {
	ID      uint `gorm:"primaryKey"`
	NarysID uint
	Narys   Narys
	RoleID  uint
	Role    Role
	GrupeID uint
	Grupe   Grupe
}
