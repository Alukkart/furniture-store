package repositories

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

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

// ProductFilter описывает серверную фильтрацию и постраничную выдачу каталога.
// Пустой фильтр возвращает полный список, поэтому существующие клиенты не меняются.
type ProductFilter struct {
	Category string
	MinPrice *int64
	MaxPrice *int64
	Query    string
	Limit    int
	Offset   int
}

func (r *ProductRepository) List(filter ProductFilter) ([]models.Product, error) {
	q := r.db.Preload("CategoryRef").Order("created_at asc")
	if name := strings.TrimSpace(filter.Category); name != "" && !strings.EqualFold(name, "all") {
		// Сравнение и по точному имени: LOWER() в SQLite не приводит кириллицу.
		q = q.Where(
			"category_id IN (?)",
			r.db.Model(&models.Category{}).Select("id").Where("name = ? OR LOWER(name) = ?", name, strings.ToLower(name)),
		)
	}
	if filter.MinPrice != nil {
		q = q.Where("price >= ?", *filter.MinPrice)
	}
	if filter.MaxPrice != nil {
		q = q.Where("price <= ?", *filter.MaxPrice)
	}
	if search := strings.TrimSpace(filter.Query); search != "" {
		like := "%" + strings.ToLower(search) + "%"
		q = q.Where("LOWER(name) LIKE ? OR LOWER(sku) LIKE ?", like, like)
	}
	if filter.Limit > 0 {
		q = q.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		q = q.Offset(filter.Offset)
	}

	var products []models.Product
	err := q.Find(&products).Error
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
	normalizedName := strings.TrimSpace(name)

	var categories []models.Category
	if err := r.db.Find(&categories).Error; err != nil {
		return 0, err
	}

	for _, category := range categories {
		if strings.EqualFold(strings.TrimSpace(category.Name), normalizedName) {
			return category.ID, nil
		}
	}

	return 0, gorm.ErrRecordNotFound
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

func (r *OrderRepository) ListByCustomerEmail(email string) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.
		Joins("JOIN customers ON customers.id = orders.customer_id").
		Where("LOWER(customers.email) = ?", strings.ToLower(strings.TrimSpace(email))).
		Preload("Customer").
		Preload("StatusRef").
		Preload("Items.Product.CategoryRef").
		Order("orders.created_at desc").
		Find(&orders).Error
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

func (r *OrderRepository) UpdateOrder(tx *gorm.DB, order *models.Order) error {
	res := tx.Save(order)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *OrderRepository) SaveOrderItems(tx *gorm.DB, items []models.OrderItem) error {
	if len(items) == 0 {
		return nil
	}
	return tx.Create(&items).Error
}

func (r *OrderRepository) DeleteOrderItems(tx *gorm.DB, orderID string) error {
	return tx.Where("order_id = ?", orderID).Delete(&models.OrderItem{}).Error
}

func (r *OrderRepository) UpdateStatus(tx *gorm.DB, order *models.Order, statusID uint) error {
	res := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("status_id", statusID)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	order.StatusID = statusID
	return nil
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

// RecordSale пополняет обучающий набор ml_datasets фактом продажи: история
// агрегируется по категории и месяцу, чтобы прогноз строился на данных,
// накапливаемых в процессе работы магазина.
func (r *OrderRepository) RecordSale(tx *gorm.DB, categoryID uint, qty int, price int64) error {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	priceBucket := "mid"
	switch {
	case price < 500:
		priceBucket = "low"
	case price >= 2000:
		priceBucket = "high"
	}

	var row models.MLDataset
	err := tx.Where("dt = ? AND category_id = ?", monthStart, categoryID).First(&row).Error
	if err == nil {
		row.SoldQty += qty
		return tx.Save(&row).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	features, _ := json.Marshal(map[string]any{
		"month":       int(monthStart.Month()),
		"category_id": categoryID,
		"price_level": priceBucket,
		"source":      "orders",
	})
	row = models.MLDataset{
		DT:           monthStart,
		CategoryID:   categoryID,
		PriceBucket:  priceBucket,
		SoldQty:      qty,
		FeaturesJSON: string(features),
	}
	return tx.Create(&row).Error
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

// AuditFilter поддерживает поиск, фильтрацию и постраничную выдачу журнала аудита.
type AuditFilter struct {
	Category string
	Severity string
	Query    string
	Limit    int
	Offset   int
}

func (r *AuditRepository) List(filter AuditFilter) ([]models.AuditLog, error) {
	q := r.db.Order("timestamp desc")
	if category := strings.TrimSpace(filter.Category); category != "" {
		q = q.Where("category = ?", strings.ToLower(category))
	}
	if severity := strings.TrimSpace(filter.Severity); severity != "" {
		q = q.Where("severity = ?", strings.ToLower(severity))
	}
	if search := strings.TrimSpace(filter.Query); search != "" {
		like := "%" + strings.ToLower(search) + "%"
		q = q.Where("LOWER(action) LIKE ? OR LOWER(details) LIKE ? OR LOWER(user) LIKE ?", like, like, like)
	}
	if filter.Limit > 0 {
		q = q.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		q = q.Offset(filter.Offset)
	}

	var logs []models.AuditLog
	err := q.Find(&logs).Error
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
