package database

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

var (
	seedAdminUserID     = seedID("u", "2025-01-10T09:00:00Z")
	seedManagerUserID   = seedID("u", "2025-01-10T09:15:00Z")
	seedWarehouseUserID = seedID("u", "2025-01-10T09:30:00Z")
	seedExecutiveUserID = seedID("u", "2025-01-10T09:45:00Z")

	seedSofaProductID      = seedID("p", "2025-02-01T08:00:00Z")
	seedChairProductID     = seedID("p", "2025-02-01T08:10:00Z")
	seedTableProductID     = seedID("p", "2025-02-01T08:20:00Z")
	seedBedProductID       = seedID("p", "2025-02-01T08:30:00Z")
	seedBookshelfProductID = seedID("p", "2025-02-01T08:40:00Z")
	seedDeskProductID      = seedID("p", "2025-02-01T08:50:00Z")
	seedLampProductID      = seedID("p", "2025-02-01T09:00:00Z")
	seedRugProductID       = seedID("p", "2025-02-01T09:10:00Z")
	seedTvStandProductID   = seedID("p", "2025-02-01T09:20:00Z")
	seedCoffeeTableID      = seedID("p", "2025-02-01T09:30:00Z")
	seedNightstandID       = seedID("p", "2025-02-01T09:40:00Z")
	seedDresserID          = seedID("p", "2025-02-01T09:50:00Z")
	seedSideboardID        = seedID("p", "2025-02-01T10:00:00Z")
	seedBarChairID         = seedID("p", "2025-02-01T10:10:00Z")
	seedOfficeChairID      = seedID("p", "2025-02-01T10:20:00Z")
	seedWallShelfID        = seedID("p", "2025-02-01T10:30:00Z")
	seedWardrobeID         = seedID("p", "2025-02-01T10:40:00Z")
	seedConsoleID          = seedID("p", "2025-02-01T10:50:00Z")
	seedTableLampID        = seedID("p", "2025-02-01T11:00:00Z")
	seedPendantLightID     = seedID("p", "2025-02-01T11:10:00Z")
	seedThrowID            = seedID("p", "2025-02-01T11:20:00Z")
	seedCurtainsID         = seedID("p", "2025-02-01T11:30:00Z")

	seedCustomer1ID = seedID("c", "2025-02-12T10:00:00Z")
	seedCustomer2ID = seedID("c", "2025-02-12T10:10:00Z")
	seedCustomer3ID = seedID("c", "2025-02-12T10:20:00Z")
	seedCustomer4ID = seedID("c", "2025-02-12T10:30:00Z")
	seedCustomer5ID = seedID("c", "2025-02-12T10:40:00Z")

	seedOrder1ID = seedID("ORD", "2025-02-15T10:30:00Z")
	seedOrder2ID = seedID("ORD", "2025-02-18T14:15:00Z")
	seedOrder3ID = seedID("ORD", "2025-02-20T09:00:00Z")
	seedOrder4ID = seedID("ORD", "2025-02-21T16:45:00Z")
	seedOrder5ID = seedID("ORD", "2025-02-22T11:20:00Z")

	seedAuditLog1ID = seedID("log", "2025-02-26T09:15:00Z")
	seedAuditLog2ID = seedID("log", "2025-02-26T10:30:00Z")
	seedAuditLog3ID = seedID("log", "2025-02-23T03:15:00Z")
)

func seed(db *gorm.DB) error {
	if err := seedRolesAndUsers(db); err != nil {
		return err
	}
	if err := seedCategories(db); err != nil {
		return err
	}
	if err := seedPermissions(db); err != nil {
		return err
	}
	if err := seedOrderStatuses(db); err != nil {
		return err
	}
	if err := seedProducts(db); err != nil {
		return err
	}
	if err := seedCustomersOrdersAndItems(db); err != nil {
		return err
	}
	if err := seedAuditLogs(db); err != nil {
		return err
	}
	if err := seedMLDataset(db); err != nil {
		return err
	}
	return nil
}

func seedRolesAndUsers(db *gorm.DB) error {
	roles := []models.Role{
		{Name: models.RoleAdmin},
		{Name: models.RoleManager},
		{Name: models.RoleWarehouse},
		{Name: models.RoleExecutive},
		{Name: models.RoleClient},
	}
	for _, role := range roles {
		if err := db.Where("name = ?", role.Name).FirstOrCreate(&role).Error; err != nil {
			return err
		}
	}

	var allRoles []models.Role
	if err := db.Find(&allRoles).Error; err != nil {
		return err
	}
	roleID := map[models.RoleName]uint{}
	for _, role := range allRoles {
		roleID[role.Name] = role.ID
	}

	users := []models.User{
		{ID: seedAdminUserID, Email: "admin@maison.co", Name: "Администратор", RoleID: roleID[models.RoleAdmin], PasswordHash: hashPassword("admin123"), IsBlocked: false},
		{ID: seedManagerUserID, Email: "manager@maison.co", Name: "Менеджер", RoleID: roleID[models.RoleManager], PasswordHash: hashPassword("manager123"), IsBlocked: false},
		{ID: seedWarehouseUserID, Email: "warehouse@maison.co", Name: "Кладовщик", RoleID: roleID[models.RoleWarehouse], PasswordHash: hashPassword("warehouse123"), IsBlocked: false},
		{ID: seedExecutiveUserID, Email: "executive@maison.co", Name: "Руководитель", RoleID: roleID[models.RoleExecutive], PasswordHash: hashPassword("executive123"), IsBlocked: false},
	}

	for _, user := range users {
		if err := db.Where("email = ?", user.Email).FirstOrCreate(&user).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedCategories(db *gorm.DB) error {
	categories := []string{"Гостиная", "Столовая", "Спальня", "Хранение", "Домашний офис", "Освещение", "Ковры и текстиль"}
	for _, name := range categories {
		category := models.Category{Name: name}
		if err := db.Where("name = ?", name).FirstOrCreate(&category).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedPermissions(db *gorm.DB) error {
	permissions := []models.Permission{
		{Action: "create", Resource: "user", Effect: "allow", Description: "Создание внутренних и клиентских аккаунтов"},
		{Action: "read", Resource: "user", Effect: "allow", Description: "Просмотр пользователей и профилей клиентов"},
		{Action: "block", Resource: "user", Effect: "allow", Description: "Блокировка и разблокировка пользователей"},
		{Action: "create", Resource: "product", Effect: "allow", Description: "Добавление товаров в каталог"},
		{Action: "read", Resource: "product", Effect: "allow", Description: "Просмотр каталога товаров"},
		{Action: "update", Resource: "product", Effect: "allow", Description: "Редактирование карточек товаров"},
		{Action: "delete", Resource: "product", Effect: "allow", Description: "Удаление товаров из каталога"},
		{Action: "create", Resource: "order", Effect: "allow", Description: "Оформление заказов"},
		{Action: "read", Resource: "order", Effect: "allow", Description: "Просмотр заказов"},
		{Action: "update", Resource: "order", Effect: "allow", Description: "Редактирование данных заказа"},
		{Action: "status", Resource: "order", Effect: "allow", Description: "Изменение статуса заказа"},
		{Action: "read", Resource: "audit_log", Effect: "allow", Description: "Просмотр журнала аудита"},
		{Action: "create", Resource: "audit_log", Effect: "allow", Description: "Создание записей аудита"},
		{Action: "train", Resource: "forecast", Effect: "allow", Description: "Обучение модели прогноза"},
		{Action: "read", Resource: "forecast", Effect: "allow", Description: "Просмотр результатов прогноза"},
	}

	for _, permission := range permissions {
		item := permission
		if err := db.Where("action = ? AND resource = ? AND effect = ?", permission.Action, permission.Resource, permission.Effect).FirstOrCreate(&item).Error; err != nil {
			return err
		}
	}

	var roles []models.Role
	if err := db.Find(&roles).Error; err != nil {
		return err
	}
	var storedPermissions []models.Permission
	if err := db.Find(&storedPermissions).Error; err != nil {
		return err
	}

	roleMap := map[models.RoleName]uint{}
	for _, role := range roles {
		roleMap[role.Name] = role.ID
	}
	permMap := map[string]uint{}
	for _, permission := range storedPermissions {
		permMap[permission.Action+":"+permission.Resource] = permission.ID
	}

	assignments := map[models.RoleName][]string{
		models.RoleAdmin: {
			"create:user", "read:user", "block:user",
			"create:product", "read:product", "update:product", "delete:product",
			"create:order", "read:order", "update:order", "status:order",
			"read:audit_log", "create:audit_log",
			"train:forecast", "read:forecast",
		},
		models.RoleManager: {
			"read:user",
			"create:product", "read:product", "update:product",
			"read:order", "update:order", "status:order",
			"read:audit_log", "create:audit_log",
			"read:forecast",
		},
		models.RoleWarehouse: {
			"read:product",
			"read:order", "update:order", "status:order",
			"read:audit_log",
		},
		models.RoleExecutive: {
			"read:order",
			"read:audit_log",
			"train:forecast", "read:forecast",
		},
		models.RoleClient: {
			"create:user", "read:user",
			"read:product",
			"create:order", "read:order",
		},
	}

	for roleName, items := range assignments {
		for _, item := range items {
			rolePermission := models.RolePermission{
				RoleID:       roleMap[roleName],
				PermissionID: permMap[item],
			}
			if err := db.Where("role_id = ? AND permission_id = ?", rolePermission.RoleID, rolePermission.PermissionID).FirstOrCreate(&rolePermission).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func seedOrderStatuses(db *gorm.DB) error {
	statuses := []models.OrderStatusRef{
		{Code: string(models.OrderStatusPending), Name: "Ожидает обработки", SortOrder: 10},
		{Code: string(models.OrderStatusProcessing), Name: "В обработке", SortOrder: 20},
		{Code: string(models.OrderStatusShipped), Name: "Передан в доставку", SortOrder: 30},
		{Code: string(models.OrderStatusDelivered), Name: "Доставлен", SortOrder: 40},
		{Code: string(models.OrderStatusCancelled), Name: "Отменён", SortOrder: 50},
	}
	for _, st := range statuses {
		item := st
		if err := db.Where("code = ?", st.Code).FirstOrCreate(&item).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedProducts(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Product{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var categories []models.Category
	if err := db.Find(&categories).Error; err != nil {
		return err
	}
	catID := map[string]uint{}
	for _, c := range categories {
		catID[c.Name] = c.ID
	}

	products := []models.Product{
		{ID: seedSofaProductID, Name: "Модульный диван «Гавань»", CategoryID: catID["Гостиная"], Price: 56990, OriginalPrice: int64Ptr(70000), Image: "/images/prod-sofa-1.jpg", Description: "Просторный модульный диван для гостиной с мягкой глубокой посадкой", Dimensions: "Ш 280 см × Г 180 см × В 86 см", Material: "Бельгийский лён", StockQty: 12, SKU: "SOF-HVNS-BEI", IsActive: true, Featured: true, Rating: 4.8, Reviews: 124},
		{ID: seedChairProductID, Name: "Акцентное кресло «Ария»", CategoryID: catID["Гостиная"], Price: 14990, Image: "/images/prod-chair-1.jpg", Description: "Мягкое кресло для зоны отдыха или чтения", Dimensions: "Ш 76 см × Г 82 см × В 84 см", Material: "Велюр", StockQty: 28, SKU: "CHR-ARIA-TER", IsActive: true, Featured: true, Rating: 4.7, Reviews: 89},
		{ID: seedTableProductID, Name: "Обеденный стол «Страта» из ореха", CategoryID: catID["Столовая"], Price: 4500, OriginalPrice: int64Ptr(6800), Image: "/images/prod-table-1.jpg", Description: "Обеденный стол из натурального ореха для семьи из 6–8 человек", Dimensions: "Ш 200 см × Г 95 см × В 76 см", Material: "Массив ореха", StockQty: 8, SKU: "TBL-STRW-WAL", IsActive: true, Featured: true, Rating: 4.9, Reviews: 56},
		{ID: seedBedProductID, Name: "Кровать-платформа «Облако»", CategoryID: catID["Спальня"], Price: 66990, Image: "/images/prod-bed-1.jpg", Description: "Кровать с мягким изголовьем и устойчивым основанием", Dimensions: "King Size", Material: "Лён", StockQty: 15, SKU: "BED-CLPL-CRM", IsActive: true, Featured: true, Rating: 4.9, Reviews: 201},
		{ID: seedBookshelfProductID, Name: "Стеллаж «Латтис» из дуба", CategoryID: catID["Хранение"], Price: 19990, Image: "/images/prod-shelf-1.jpg", Description: "Открытый дубовый стеллаж для книг и декора", Dimensions: "Ш 90 см", Material: "Дуб", StockQty: 20, SKU: "SHF-LTOK-NAT", IsActive: true, Featured: false, Rating: 4.6, Reviews: 43},
		{ID: seedDeskProductID, Name: "Письменный стол «Студио»", CategoryID: catID["Домашний офис"], Price: 5990, Image: "/images/prod-desk-1.jpg", Description: "Компактный письменный стол для домашнего кабинета", Dimensions: "Ш 140 см", Material: "МДФ", StockQty: 35, SKU: "DSK-STUD-WHT", IsActive: true, Featured: false, Rating: 4.5, Reviews: 67},
		{ID: seedLampProductID, Name: "Торшер «Солей»", CategoryID: catID["Освещение"], Price: 3800, Image: "/images/prod-lamp-1.jpg", Description: "Напольный светильник с тёплым рассеянным светом", Dimensions: "В 165 см", Material: "Латунь", StockQty: 42, SKU: "LMP-SOLB-BRS", IsActive: true, Featured: false, Rating: 4.7, Reviews: 98},
		{ID: seedRugProductID, Name: "Шерстяной ковёр «Марракеш»", CategoryID: catID["Ковры и текстиль"], Price: 6500, OriginalPrice: int64Ptr(8000), Image: "/images/prod-rug-1.jpg", Description: "Плотный шерстяной ковёр с геометрическим орнаментом", Dimensions: "250 см × 350 см", Material: "Шерсть", StockQty: 18, SKU: "RUG-MRKW-CRM", IsActive: true, Featured: false, Rating: 4.8, Reviews: 77},
	}

	for i := range products {
		products[i].SyncViewFields()
	}

	return db.Create(&products).Error
}

func seedCustomersOrdersAndItems(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Order{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	customers := []models.Customer{
		{ID: seedCustomer1ID, FullName: "Илья Соколов", Phone: "+7 916 245-18-37", Email: "i.sokolov@yandex.ru"},
		{ID: seedCustomer2ID, FullName: "Мария Романова", Phone: "+7 921 334-72-18", Email: "m.romanova@mail.ru"},
		{ID: seedCustomer3ID, FullName: "Артём Ковалёв", Phone: "+7 903 118-44-29", Email: "art.kovalev@yandex.ru"},
		{ID: seedCustomer4ID, FullName: "Екатерина Смирнова", Phone: "+7 965 807-11-56", Email: "ek.smirnova@mail.ru"},
		{ID: seedCustomer5ID, FullName: "Дмитрий Воробьёв", Phone: "+7 981 440-63-90", Email: "d.vorobev@yandex.ru"},
	}
	for _, c := range customers {
		item := c
		if err := db.Where("id = ?", c.ID).FirstOrCreate(&item).Error; err != nil {
			return err
		}
	}

	statusByCode, err := getStatusMap(db)
	if err != nil {
		return err
	}

	orders := []models.Order{
		{ID: seedOrder1ID, CustomerID: seedCustomer1ID, StatusID: statusByCode[string(models.OrderStatusDelivered)].ID, TotalSum: 3497, Address: "г. Москва, Ленинский проспект, д. 62, кв. 41", CreatedAt: parseTime("2025-02-15T10:30:00Z")},
		{ID: seedOrder2ID, CustomerID: seedCustomer2ID, StatusID: statusByCode[string(models.OrderStatusShipped)].ID, TotalSum: 1899, Address: "г. Санкт-Петербург, ул. Типанова, д. 14, кв. 87", CreatedAt: parseTime("2025-02-18T14:15:00Z")},
		{ID: seedOrder3ID, CustomerID: seedCustomer3ID, StatusID: statusByCode[string(models.OrderStatusProcessing)].ID, TotalSum: 1898, Address: "г. Казань, ул. Чистопольская, д. 33, кв. 12", CreatedAt: parseTime("2025-02-20T09:00:00Z")},
		{ID: seedOrder4ID, CustomerID: seedCustomer4ID, StatusID: statusByCode[string(models.OrderStatusPending)].ID, TotalSum: 1328, Address: "г. Екатеринбург, ул. Малышева, д. 18, кв. 24", CreatedAt: parseTime("2025-02-21T16:45:00Z")},
		{ID: seedOrder5ID, CustomerID: seedCustomer5ID, StatusID: statusByCode[string(models.OrderStatusCancelled)].ID, TotalSum: 1198, Address: "г. Новосибирск, Красный проспект, д. 101, кв. 9", CreatedAt: parseTime("2025-02-22T11:20:00Z")},
	}
	for i := range orders {
		orders[i].UpdatedAt = orders[i].CreatedAt
	}
	if err := db.Create(&orders).Error; err != nil {
		return err
	}

	items := []models.OrderItem{
		{OrderID: seedOrder1ID, ProductID: seedSofaProductID, Qty: 1, Price: 2199}, {OrderID: seedOrder1ID, ProductID: seedChairProductID, Qty: 2, Price: 649},
		{OrderID: seedOrder2ID, ProductID: seedTableProductID, Qty: 1, Price: 1899},
		{OrderID: seedOrder3ID, ProductID: seedBedProductID, Qty: 1, Price: 1549}, {OrderID: seedOrder3ID, ProductID: seedLampProductID, Qty: 1, Price: 349},
		{OrderID: seedOrder4ID, ProductID: seedBookshelfProductID, Qty: 1, Price: 849}, {OrderID: seedOrder4ID, ProductID: seedRugProductID, Qty: 1, Price: 479},
		{OrderID: seedOrder5ID, ProductID: seedDeskProductID, Qty: 2, Price: 599},
	}
	return db.Create(&items).Error
}

func seedAuditLogs(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.AuditLog{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	logs := []models.AuditLog{
		{ID: seedAuditLog1ID, Action: "Обновление товара", Category: models.AuditCategoryProduct, User: "admin@maison.co", Entity: "product", EntityID: seedSofaProductID, Details: "Цена товара «Модульный диван „Гавань“» изменена с 2 499 ₽ до 2 199 ₽", Timestamp: parseTime("2025-02-26T09:15:00Z"), Severity: models.AuditSeverityInfo, Result: "ok"},
		{ID: seedAuditLog2ID, Action: "Смена статуса заказа", Category: models.AuditCategoryOrder, User: "manager@mmaison.co", Entity: "order", EntityID: seedOrder2ID, Details: "Статус заказа изменён на «Передан в доставку»", Timestamp: parseTime("2025-02-26T10:30:00Z"), Severity: models.AuditSeverityInfo, Result: "ok"},
		{ID: seedAuditLog3ID, Action: "Неудачная попытка входа", Category: models.AuditCategoryUser, User: "неизвестный пользователь", Entity: "user", Details: "Зафиксировано 3 неудачных попытки входа", Timestamp: parseTime("2025-02-23T03:15:00Z"), Severity: models.AuditSeverityCritical, Result: "failed"},
	}
	return db.Create(&logs).Error
}

func seedMLDataset(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.MLDataset{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var categories []models.Category
	if err := db.Find(&categories).Error; err != nil {
		return err
	}

	rows := make([]models.MLDataset, 0, len(categories)*24)
	now := time.Now().UTC()
	for _, c := range categories {
		for i := 1; i <= 24; i++ {
			dt := now.AddDate(0, -i, 0)
			seasonality := 1.0
			if dt.Month() == time.November || dt.Month() == time.December {
				seasonality = 1.25
			}
			base := 20 + int(c.ID*2)
			sold := int(float64(base+i%6) * seasonality)
			priceBucket := "mid"
			features := map[string]any{
				"month":       int(dt.Month()),
				"category_id": c.ID,
				"seasonality": seasonality,
				"price_level": priceBucket,
			}
			raw, _ := json.Marshal(features)
			rows = append(rows, models.MLDataset{
				DT:           dt,
				CategoryID:   c.ID,
				PriceBucket:  priceBucket,
				SoldQty:      sold,
				FeaturesJSON: string(raw),
			})
		}
	}

	return db.Create(&rows).Error
}

func getStatusMap(db *gorm.DB) (map[string]models.OrderStatusRef, error) {
	var statuses []models.OrderStatusRef
	if err := db.Find(&statuses).Error; err != nil {
		return nil, err
	}
	out := make(map[string]models.OrderStatusRef, len(statuses))
	for _, st := range statuses {
		out[st.Code] = st
	}
	return out, nil
}

func parseTime(value string) time.Time {
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Now().UTC()
	}
	return t.UTC()
}

func int64Ptr(value int64) *int64 {
	return &value
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte("maison-salt:" + password))
	return hex.EncodeToString(hash[:])
}

func seedID(prefix, ts string) string {
	return fmt.Sprintf("%s-%d", prefix, parseTime(ts).UnixNano())
}
