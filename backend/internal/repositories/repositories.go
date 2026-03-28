package repositories

import (
	"errors"
	"strings"

	"backend/internal/models"

	"gorm.io/gorm"
)

type ProductRepository struct{ db *gorm.DB }
type OrderRepository struct{ db *gorm.DB }
type UserRepository struct{ db *gorm.DB }
type AuditRepository struct{ db *gorm.DB }
type ForecastRepository struct{ db *gorm.DB }

type CategoryRepository struct{ db *gorm.DB }

type CustomerRepository struct{ db *gorm.DB }

func NewProductRepository(db *gorm.DB) *ProductRepository   { return &ProductRepository{db: db} }
func NewOrderRepository(db *gorm.DB) *OrderRepository       { return &OrderRepository{db: db} }
func NewUserRepository(db *gorm.DB) *UserRepository         { return &UserRepository{db: db} }
func NewAuditRepository(db *gorm.DB) *AuditRepository       { return &AuditRepository{db: db} }
func NewForecastRepository(db *gorm.DB) *ForecastRepository { return &ForecastRepository{db: db} }
func NewCategoryRepository(db *gorm.DB) *CategoryRepository { return &CategoryRepository{db: db} }
func NewCustomerRepository(db *gorm.DB) *CustomerRepository { return &CustomerRepository{db: db} }

func (r *ProductRepository) List() ([]models.Product, error) {
	var products []models.Product
	err := r.db.Preload("CategoryRef").Order("created_at asc").Find(&products).Error
	if err != nil {
		return nil, err
	}
	for i := range products {
		products[i].Category = products[i].CategoryRef.Name
		products[i].SyncViewFields()
	}
	return products, nil
}

func (r *ProductRepository) GetByID(id string) (models.Product, error) {
	var product models.Product
	err := r.db.Preload("CategoryRef").First(&product, "id = ?", id).Error
	if err != nil {
		return models.Product{}, err
	}
	product.Category = product.CategoryRef.Name
	product.SyncViewFields()
	return product, nil
}

func (r *ProductRepository) FindCategoryIDByName(name string) (uint, error) {
	var c models.Category
	err := r.db.Where("LOWER(name) = ?", strings.ToLower(strings.TrimSpace(name))).First(&c).Error
	if err != nil {
		return 0, err
	}
	return c.ID, nil
}

func (r *ProductRepository) Create(product *models.Product) error {
	product.SyncDBFields()
	return r.db.Create(product).Error
}

func (r *ProductRepository) Update(product *models.Product) error {
	product.SyncDBFields()
	return r.db.Save(product).Error
}

func (r *ProductRepository) Delete(id string) error {
	result := r.db.Delete(&models.Product{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *OrderRepository) List() ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Customer").Preload("StatusRef").Preload("Items.Product.CategoryRef").Order("created_at desc").Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) GetByID(id string) (models.Order, error) {
	var order models.Order
	err := r.db.Preload("Customer").Preload("StatusRef").Preload("Items.Product.CategoryRef").First(&order, "id = ?", id).Error
	return order, err
}

func (r *OrderRepository) FindStatusByCode(code string) (models.OrderStatusRef, error) {
	var status models.OrderStatusRef
	err := r.db.Where("code = ?", code).First(&status).Error
	return status, err
}

func (r *OrderRepository) SaveOrder(tx *gorm.DB, order *models.Order) error {
	return tx.Create(order).Error
}

func (r *OrderRepository) SaveOrderItems(tx *gorm.DB, items []models.OrderItem) error {
	if len(items) == 0 {
		return nil
	}
	return tx.Create(&items).Error
}

func (r *OrderRepository) UpdateStatus(tx *gorm.DB, order *models.Order, statusID uint) error {
	order.StatusID = statusID
	return tx.Save(order).Error
}

func (r *OrderRepository) Begin() *gorm.DB {
	return r.db.Begin()
}

func (r *OrderRepository) FindOrCreateCustomer(tx *gorm.DB, fullName, email string) (models.Customer, error) {
	var c models.Customer
	err := tx.Where("email = ?", email).First(&c).Error
	if err == nil {
		if strings.TrimSpace(fullName) != "" && c.FullName != fullName {
			c.FullName = fullName
			if saveErr := tx.Save(&c).Error; saveErr != nil {
				return models.Customer{}, saveErr
			}
		}
		return c, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Customer{}, err
	}
	c = models.Customer{ID: GenerateID("c"), FullName: fullName, Email: email}
	if err := tx.Create(&c).Error; err != nil {
		return models.Customer{}, err
	}
	return c, nil
}

func (r *OrderRepository) FindProductForUpdate(tx *gorm.DB, id string) (models.Product, error) {
	var product models.Product
	err := tx.Preload("CategoryRef").First(&product, "id = ?", id).Error
	if err != nil {
		return models.Product{}, err
	}
	product.Category = product.CategoryRef.Name
	product.SyncViewFields()
	return product, nil
}

func (r *UserRepository) FindByEmail(email string) (models.User, error) {
	var user models.User
	err := r.db.Preload("Role").Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).First(&user).Error
	return user, err
}

func (r *UserRepository) List() ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("Role").Order("created_at asc").Find(&users).Error
	return users, err
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) SetBlocked(id string, blocked bool) error {
	res := r.db.Model(&models.User{}).Where("id = ?", id).Update("is_blocked", blocked)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *UserRepository) FindRoleByName(name models.RoleName) (models.Role, error) {
	var role models.Role
	err := r.db.Where("name = ?", name).First(&role).Error
	return role, err
}

func (r *AuditRepository) List() ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Order("timestamp desc").Find(&logs).Error
	return logs, err
}

func (r *AuditRepository) Create(entry *models.AuditLog) error {
	return r.db.Create(entry).Error
}

func (r *ForecastRepository) TrainingRows() ([]models.MLDataset, error) {
	var rows []models.MLDataset
	err := r.db.Order("dt asc").Find(&rows).Error
	return rows, err
}

func (r *ForecastRepository) Categories() ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Order("name asc").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) List() ([]models.Category, error) {
	var items []models.Category
	err := r.db.Order("name asc").Find(&items).Error
	return items, err
}

func (r *CategoryRepository) Create(item *models.Category) error {
	return r.db.Create(item).Error
}

func (r *CustomerRepository) List() ([]models.Customer, error) {
	var items []models.Customer
	err := r.db.Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *CustomerRepository) Create(item *models.Customer) error {
	return r.db.Create(item).Error
}
