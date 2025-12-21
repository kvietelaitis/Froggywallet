package initializers

import (
	"os"

	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectToDatabase() {
	var err error
	dsn := os.Getenv("DB_URL")
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database")
	}
}

func SyncDatabase() {
	DB.AutoMigrate(
		// Core entities
		&models.Role{},
		&models.Narys{},
		&models.Grupe{},
		&models.NarysRoleGrupe{},
		&models.Sektorius{},

		// Financial entities
		&models.Investicija{},
		&models.RinkosDuomenys{},
		&models.Pajama{},
		&models.Islaida{},
		&models.Kategorija{},

		// Budget and limits
		&models.Biudzetas{},
		&models.Riba{},

		// Loans
		&models.Paskola{},
		&models.Skolininkas{},

		// Groups and invitations
		&models.Pakvietimas{},
	)
}
