package database

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
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
		{ID: "u-admin", Email: "admin@maison.co", Name: "Admin", RoleID: roleID[models.RoleAdmin], PasswordHash: hashPassword("admin123"), IsBlocked: false},
		{ID: "u-manager", Email: "manager@maison.co", Name: "Manager", RoleID: roleID[models.RoleManager], PasswordHash: hashPassword("manager123"), IsBlocked: false},
		{ID: "u-warehouse", Email: "warehouse@maison.co", Name: "Warehouse", RoleID: roleID[models.RoleWarehouse], PasswordHash: hashPassword("warehouse123"), IsBlocked: false},
		{ID: "u-executive", Email: "executive@maison.co", Name: "Executive", RoleID: roleID[models.RoleExecutive], PasswordHash: hashPassword("executive123"), IsBlocked: false},
	}

	for _, user := range users {
		if err := db.Where("email = ?", user.Email).FirstOrCreate(&user).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedCategories(db *gorm.DB) error {
	categories := []string{"Living Room", "Dining Room", "Bedroom", "Storage", "Home Office", "Lighting", "Rugs & Textiles"}
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
		{Action: "create", Resource: "user", Effect: "allow", Description: "Create internal and client accounts"},
		{Action: "read", Resource: "user", Effect: "allow", Description: "Read users and client profiles"},
		{Action: "block", Resource: "user", Effect: "allow", Description: "Block or unblock users"},
		{Action: "create", Resource: "product", Effect: "allow", Description: "Create catalog products"},
		{Action: "read", Resource: "product", Effect: "allow", Description: "Read catalog products"},
		{Action: "update", Resource: "product", Effect: "allow", Description: "Update catalog products"},
		{Action: "delete", Resource: "product", Effect: "allow", Description: "Delete catalog products"},
		{Action: "create", Resource: "order", Effect: "allow", Description: "Place orders"},
		{Action: "read", Resource: "order", Effect: "allow", Description: "Read orders"},
		{Action: "update", Resource: "order", Effect: "allow", Description: "Update order details"},
		{Action: "status", Resource: "order", Effect: "allow", Description: "Change order status"},
		{Action: "read", Resource: "audit_log", Effect: "allow", Description: "Read audit log"},
		{Action: "create", Resource: "audit_log", Effect: "allow", Description: "Create audit entries"},
		{Action: "train", Resource: "forecast", Effect: "allow", Description: "Train forecast model"},
		{Action: "read", Resource: "forecast", Effect: "allow", Description: "Read forecast results"},
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
		{Code: string(models.OrderStatusPending), Name: "Pending", SortOrder: 10},
		{Code: string(models.OrderStatusProcessing), Name: "Processing", SortOrder: 20},
		{Code: string(models.OrderStatusShipped), Name: "Shipped", SortOrder: 30},
		{Code: string(models.OrderStatusDelivered), Name: "Delivered", SortOrder: 40},
		{Code: string(models.OrderStatusCancelled), Name: "Cancelled", SortOrder: 50},
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
		{ID: "p1", Name: "Haven Sectional Sofa", CategoryID: catID["Living Room"], Price: 56990, OriginalPrice: int64Ptr(70000), Image: "/images/prod-sofa-1.jpg", Description: "Premium sectional sofa", Dimensions: "W 280cm x D 180cm x H 86cm", Material: "Belgian Linen", StockQty: 12, SKU: "SOF-HVNS-BEI", IsActive: true, Featured: true, Rating: 4.8, Reviews: 124},
		{ID: "p2", Name: "Aria Accent Chair", CategoryID: catID["Living Room"], Price: 14990, Image: "/images/prod-chair-1.jpg", Description: "Accent chair", Dimensions: "W 76cm x D 82cm x H 84cm", Material: "Velvet", StockQty: 28, SKU: "CHR-ARIA-TER", IsActive: true, Featured: true, Rating: 4.7, Reviews: 89},
		{ID: "p3", Name: "Strata Walnut Dining Table", CategoryID: catID["Dining Room"], Price: 4500, OriginalPrice: int64Ptr(6800), Image: "/images/prod-table-1.jpg", Description: "Walnut dining table", Dimensions: "W 200cm x D 95cm x H 76cm", Material: "Walnut", StockQty: 8, SKU: "TBL-STRW-WAL", IsActive: true, Featured: true, Rating: 4.9, Reviews: 56},
		{ID: "p4", Name: "Cloud Platform Bed", CategoryID: catID["Bedroom"], Price: 66990, Image: "/images/prod-bed-1.jpg", Description: "Platform bed", Dimensions: "King", Material: "Linen", StockQty: 15, SKU: "BED-CLPL-CRM", IsActive: true, Featured: true, Rating: 4.9, Reviews: 201},
		{ID: "p5", Name: "Lattice Oak Bookshelf", CategoryID: catID["Storage"], Price: 19990, Image: "/images/prod-shelf-1.jpg", Description: "Bookshelf", Dimensions: "W 90cm", Material: "Oak", StockQty: 20, SKU: "SHF-LTOK-NAT", IsActive: true, Featured: false, Rating: 4.6, Reviews: 43},
		{ID: "p6", Name: "Studio Writing Desk", CategoryID: catID["Home Office"], Price: 5990, Image: "/images/prod-desk-1.jpg", Description: "Writing desk", Dimensions: "W 140cm", Material: "MDF", StockQty: 35, SKU: "DSK-STUD-WHT", IsActive: true, Featured: false, Rating: 4.5, Reviews: 67},
		{ID: "p7", Name: "Soleil Brass Floor Lamp", CategoryID: catID["Lighting"], Price: 3800, Image: "/images/prod-lamp-1.jpg", Description: "Floor lamp", Dimensions: "H 165cm", Material: "Brass", StockQty: 42, SKU: "LMP-SOLB-BRS", IsActive: true, Featured: false, Rating: 4.7, Reviews: 98},
		{ID: "p8", Name: "Marrakesh Wool Rug", CategoryID: catID["Rugs & Textiles"], Price: 6500, OriginalPrice: int64Ptr(8000), Image: "/images/prod-rug-1.jpg", Description: "Wool rug", Dimensions: "250cm x 350cm", Material: "Wool", StockQty: 18, SKU: "RUG-MRKW-CRM", IsActive: true, Featured: false, Rating: 4.8, Reviews: 77},
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
		{ID: "c1", FullName: "Цветков Макар", Phone: "+79185134859", Email: "ice_o@yandex.ru"},
		{ID: "c2", FullName: "Суворова Зинаида", Phone: "+79406551717", Email: "tiger@yandex.ru"},
		{ID: "c3", FullName: "Белоусова Любовь", Phone: "+79393568539", Email: "zeus@yandex.ru"},
		{ID: "c4", FullName: "Медведева Анастасия", Phone: "+79624388906", Email: "apoll@yandex.ru"},
		{ID: "c5", FullName: "Власов Валентин", Phone: "+79542700049", Email: "drago@yandex.ru"},
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
		{ID: "ORD-2025-001", CustomerID: "c1", StatusID: statusByCode[string(models.OrderStatusDelivered)].ID, TotalSum: 3497, Address: "14 Oak Lane, San Francisco, CA 94102", CreatedAt: parseTime("2025-02-15T10:30:00Z")},
		{ID: "ORD-2025-002", CustomerID: "c2", StatusID: statusByCode[string(models.OrderStatusShipped)].ID, TotalSum: 1899, Address: "88 Maple Street, Brooklyn, NY 11201", CreatedAt: parseTime("2025-02-18T14:15:00Z")},
		{ID: "ORD-2025-003", CustomerID: "c3", StatusID: statusByCode[string(models.OrderStatusProcessing)].ID, TotalSum: 1898, Address: "201 Birch Ave, Austin, TX 78701", CreatedAt: parseTime("2025-02-20T09:00:00Z")},
		{ID: "ORD-2025-004", CustomerID: "c4", StatusID: statusByCode[string(models.OrderStatusPending)].ID, TotalSum: 1328, Address: "55 Pine Road, Denver, CO 80203", CreatedAt: parseTime("2025-02-21T16:45:00Z")},
		{ID: "ORD-2025-005", CustomerID: "c5", StatusID: statusByCode[string(models.OrderStatusCancelled)].ID, TotalSum: 1198, Address: "99 Elm Street, Chicago, IL 60601", CreatedAt: parseTime("2025-02-22T11:20:00Z")},
	}
	for i := range orders {
		orders[i].UpdatedAt = orders[i].CreatedAt
	}
	if err := db.Create(&orders).Error; err != nil {
		return err
	}

	items := []models.OrderItem{
		{OrderID: "ORD-2025-001", ProductID: "p1", Qty: 1, Price: 2199}, {OrderID: "ORD-2025-001", ProductID: "p2", Qty: 2, Price: 649},
		{OrderID: "ORD-2025-002", ProductID: "p3", Qty: 1, Price: 1899},
		{OrderID: "ORD-2025-003", ProductID: "p4", Qty: 1, Price: 1549}, {OrderID: "ORD-2025-003", ProductID: "p7", Qty: 1, Price: 349},
		{OrderID: "ORD-2025-004", ProductID: "p5", Qty: 1, Price: 849}, {OrderID: "ORD-2025-004", ProductID: "p8", Qty: 1, Price: 479},
		{OrderID: "ORD-2025-005", ProductID: "p6", Qty: 2, Price: 599},
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
		{ID: "log-001", Action: "Product Updated", Category: models.AuditCategoryProduct, User: "admin@maison.co", Entity: "product", EntityID: "p1", Details: "Updated price of Haven Sectional Sofa from $2,499 to $2,199", Timestamp: parseTime("2025-02-26T09:15:00Z"), Severity: models.AuditSeverityInfo, Result: "ok"},
		{ID: "log-002", Action: "Order Status Changed", Category: models.AuditCategoryOrder, User: "manager@maison.co", Entity: "order", EntityID: "ORD-2025-002", Details: "Order status changed to shipped", Timestamp: parseTime("2025-02-26T10:30:00Z"), Severity: models.AuditSeverityInfo, Result: "ok"},
		{ID: "log-003", Action: "Failed Login Attempt", Category: models.AuditCategoryUser, User: "unknown", Entity: "user", Details: "3 failed login attempts", Timestamp: parseTime("2025-02-23T03:15:00Z"), Severity: models.AuditSeverityCritical, Result: "failed"},
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
