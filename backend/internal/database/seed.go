package database

import (
	"fmt"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

func seed(db *gorm.DB) error {
	if err := seedProducts(db); err != nil {
		return err
	}
	if err := seedOrders(db); err != nil {
		return err
	}
	if err := seedAuditLogs(db); err != nil {
		return err
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

	products := []models.Product{
		{
			ID:            "p1",
			Name:          "Haven Sectional Sofa",
			Category:      "Living Room",
			Price:         2199,
			OriginalPrice: int64Ptr(2799),
			Image:         "/images/prod-sofa-1.jpg",
			Description:   "Sink into the ultimate comfort with our Haven Sectional Sofa. Crafted with a kiln-dried hardwood frame and wrapped in premium Belgian linen, this piece effortlessly blends form and function. The deep-set cushions provide hours of comfort, making it perfect for family gatherings or quiet evenings at home.",
			Dimensions:    "W 280cm x D 180cm x H 86cm",
			Material:      "Belgian Linen, Kiln-Dried Hardwood Frame",
			Stock:         12,
			SKU:           "SOF-HVNS-BEI",
			Featured:      true,
			Rating:        4.8,
			Reviews:       124,
		},
		{
			ID:          "p2",
			Name:        "Aria Accent Chair",
			Category:    "Living Room",
			Price:       649,
			Image:       "/images/prod-chair-1.jpg",
			Description: "Make a statement with the Aria Accent Chair. Its sculptural silhouette and rich terracotta velvet upholstery add warmth and personality to any room. Solid oak legs provide a sturdy, grounded feel while keeping the look light and airy.",
			Dimensions:  "W 76cm x D 82cm x H 84cm",
			Material:    "Terracotta Velvet, Solid Oak",
			Stock:       28,
			SKU:         "CHR-ARIA-TER",
			Featured:    true,
			Rating:      4.7,
			Reviews:     89,
		},
		{
			ID:            "p3",
			Name:          "Strata Walnut Dining Table",
			Category:      "Dining Room",
			Price:         1899,
			OriginalPrice: int64Ptr(2299),
			Image:         "/images/prod-table-1.jpg",
			Description:   "The Strata Dining Table is a celebration of natural beauty. Each table is crafted from solid American walnut with a hand-rubbed oil finish that brings out the unique grain patterns. Seats six comfortably, with room for eight when entertaining.",
			Dimensions:    "W 200cm x D 95cm x H 76cm",
			Material:      "Solid American Walnut, Hand-Rubbed Oil Finish",
			Stock:         8,
			SKU:           "TBL-STRW-WAL",
			Featured:      true,
			Rating:        4.9,
			Reviews:       56,
		},
		{
			ID:          "p4",
			Name:        "Cloud Platform Bed",
			Category:    "Bedroom",
			Price:       1549,
			Image:       "/images/prod-bed-1.jpg",
			Description: "Elevate your sleep experience with the Cloud Platform Bed. The low-profile silhouette and padded linen headboard create a serene retreat. Its solid base eliminates the need for a box spring, and the upholstered frame adds a luxurious hotel-like feel.",
			Dimensions:  "W 193cm x D 228cm x H 110cm (King)",
			Material:    "Cream Linen, Solid Pine Frame",
			Stock:       15,
			SKU:         "BED-CLPL-CRM",
			Featured:    true,
			Rating:      4.9,
			Reviews:     201,
		},
		{
			ID:          "p5",
			Name:        "Lattice Oak Bookshelf",
			Category:    "Storage",
			Price:       849,
			Image:       "/images/prod-shelf-1.jpg",
			Description: "Organize your space in style with the Lattice Oak Bookshelf. Five open shelves give you plenty of room for books, plants, and decor, while the natural oak finish blends seamlessly with any interior palette.",
			Dimensions:  "W 90cm x D 35cm x H 200cm",
			Material:    "Natural Oak Veneer, Steel Frame",
			Stock:       20,
			SKU:         "SHF-LTOK-NAT",
			Featured:    false,
			Rating:      4.6,
			Reviews:     43,
		},
		{
			ID:          "p6",
			Name:        "Studio Writing Desk",
			Category:    "Home Office",
			Price:       599,
			Image:       "/images/prod-desk-1.jpg",
			Description: "The Studio Writing Desk is designed for creative minds. Its clean lines, ample surface area, and smart cable management port make it the perfect workspace companion. Works equally well in a dedicated office or as a stylish entry console.",
			Dimensions:  "W 140cm x D 60cm x H 75cm",
			Material:    "Lacquered MDF, Powder-Coated Steel",
			Stock:       35,
			SKU:         "DSK-STUD-WHT",
			Featured:    false,
			Rating:      4.5,
			Reviews:     67,
		},
		{
			ID:          "p7",
			Name:        "Soleil Brass Floor Lamp",
			Category:    "Lighting",
			Price:       349,
			Image:       "/images/prod-lamp-1.jpg",
			Description: "Cast a warm glow with the Soleil Floor Lamp. Its antique brass finish and pleated linen shade combine timeless elegance with modern proportions. An adjustable arm lets you direct light exactly where you need it.",
			Dimensions:  "H 165cm, Shade Diameter 42cm",
			Material:    "Antique Brass, Linen Shade",
			Stock:       42,
			SKU:         "LMP-SOLB-BRS",
			Featured:    false,
			Rating:      4.7,
			Reviews:     98,
		},
		{
			ID:            "p8",
			Name:          "Marrakesh Wool Rug",
			Category:      "Rugs & Textiles",
			Price:         479,
			OriginalPrice: int64Ptr(599),
			Image:         "/images/prod-rug-1.jpg",
			Description:   "Inspired by the intricate geometry of North African architecture, the Marrakesh Rug adds soul and warmth to any floor. Hand-tufted from 100% New Zealand wool, it features a subtle raised texture that rewards a closer look.",
			Dimensions:    "250cm x 350cm",
			Material:      "100% New Zealand Wool",
			Stock:         18,
			SKU:           "RUG-MRKW-CRM",
			Featured:      false,
			Rating:        4.8,
			Reviews:       77,
		},
	}

	return db.Create(&products).Error
}

func seedOrders(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Order{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var products []models.Product
	if err := db.Find(&products).Error; err != nil {
		return err
	}

	productByID := map[string]models.Product{}
	for _, product := range products {
		productByID[product.ID] = product
	}

	orderSeeds := []struct {
		id       string
		customer string
		email    string
		items    []models.CartItem
		total    int64
		status   models.OrderStatus
		date     string
		address  string
	}{
		{
			id:       "ORD-2024-001",
			customer: "Sarah Mitchell",
			email:    "s.mitchell@email.com",
			items: []models.CartItem{
				{Product: productByID["p1"], Quantity: 1},
				{Product: productByID["p2"], Quantity: 2},
			},
			total:   3497,
			status:  models.OrderStatusDelivered,
			date:    "2025-02-15T10:30:00Z",
			address: "14 Oak Lane, San Francisco, CA 94102",
		},
		{
			id:       "ORD-2024-002",
			customer: "James Thornton",
			email:    "j.thornton@email.com",
			items: []models.CartItem{
				{Product: productByID["p3"], Quantity: 1},
			},
			total:   1899,
			status:  models.OrderStatusShipped,
			date:    "2025-02-18T14:15:00Z",
			address: "88 Maple Street, Brooklyn, NY 11201",
		},
		{
			id:       "ORD-2024-003",
			customer: "Elena Rossi",
			email:    "e.rossi@email.com",
			items: []models.CartItem{
				{Product: productByID["p4"], Quantity: 1},
				{Product: productByID["p7"], Quantity: 1},
			},
			total:   1898,
			status:  models.OrderStatusProcessing,
			date:    "2025-02-20T09:00:00Z",
			address: "201 Birch Ave, Austin, TX 78701",
		},
		{
			id:       "ORD-2024-004",
			customer: "Marcus Webb",
			email:    "m.webb@email.com",
			items: []models.CartItem{
				{Product: productByID["p5"], Quantity: 1},
				{Product: productByID["p8"], Quantity: 1},
			},
			total:   1328,
			status:  models.OrderStatusPending,
			date:    "2025-02-21T16:45:00Z",
			address: "55 Pine Road, Denver, CO 80203",
		},
		{
			id:       "ORD-2024-005",
			customer: "Priya Sharma",
			email:    "p.sharma@email.com",
			items: []models.CartItem{
				{Product: productByID["p6"], Quantity: 2},
			},
			total:   1198,
			status:  models.OrderStatusCancelled,
			date:    "2025-02-22T11:20:00Z",
			address: "99 Elm Street, Chicago, IL 60601",
		},
	}

	orders := make([]models.Order, 0, len(orderSeeds))
	for _, seed := range orderSeeds {
		date, err := time.Parse(time.RFC3339, seed.date)
		if err != nil {
			return fmt.Errorf("failed to parse order date %q: %w", seed.date, err)
		}

		order := models.Order{
			ID:       seed.id,
			Customer: seed.customer,
			Email:    seed.email,
			Total:    seed.total,
			Status:   seed.status,
			Date:     date.UTC(),
			Address:  seed.address,
		}

		if err := order.SetItems(seed.items); err != nil {
			return err
		}

		orders = append(orders, order)
	}

	return db.Create(&orders).Error
}

func seedAuditLogs(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.AuditLog{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	logSeeds := []struct {
		id        string
		action    string
		category  models.AuditCategory
		user      string
		details   string
		timestamp string
		severity  models.AuditSeverity
	}{
		{
			id:        "log-001",
			action:    "Product Updated",
			category:  models.AuditCategoryProduct,
			user:      "admin@maison.co",
			details:   "Updated price of Haven Sectional Sofa from $2,499 to $2,199",
			timestamp: "2025-02-26T09:15:00Z",
			severity:  models.AuditSeverityInfo,
		},
		{
			id:        "log-002",
			action:    "Order Status Changed",
			category:  models.AuditCategoryOrder,
			user:      "admin@maison.co",
			details:   "Order ORD-2024-002 status changed from 'processing' to 'shipped'",
			timestamp: "2025-02-26T10:30:00Z",
			severity:  models.AuditSeverityInfo,
		},
		{
			id:        "log-003",
			action:    "Stock Alert",
			category:  models.AuditCategoryProduct,
			user:      "system",
			details:   "Strata Walnut Dining Table stock dropped below threshold (8 units remaining)",
			timestamp: "2025-02-26T11:00:00Z",
			severity:  models.AuditSeverityWarning,
		},
		{
			id:        "log-004",
			action:    "Order Cancelled",
			category:  models.AuditCategoryOrder,
			user:      "admin@maison.co",
			details:   "Order ORD-2024-005 cancelled per customer request - refund initiated",
			timestamp: "2025-02-25T14:20:00Z",
			severity:  models.AuditSeverityWarning,
		},
		{
			id:        "log-005",
			action:    "Product Added",
			category:  models.AuditCategoryProduct,
			user:      "manager@maison.co",
			details:   "New product 'Soleil Brass Floor Lamp' added to Lighting category (SKU: LMP-SOLB-BRS)",
			timestamp: "2025-02-24T16:00:00Z",
			severity:  models.AuditSeverityInfo,
		},
		{
			id:        "log-006",
			action:    "User Login",
			category:  models.AuditCategoryUser,
			user:      "manager@maison.co",
			details:   "Successful admin login from IP 192.168.1.45",
			timestamp: "2025-02-24T15:58:00Z",
			severity:  models.AuditSeverityInfo,
		},
		{
			id:        "log-007",
			action:    "Bulk Stock Update",
			category:  models.AuditCategoryProduct,
			user:      "admin@maison.co",
			details:   "Stock levels updated for 5 products after warehouse inventory count",
			timestamp: "2025-02-23T10:00:00Z",
			severity:  models.AuditSeverityInfo,
		},
		{
			id:        "log-008",
			action:    "Failed Login Attempt",
			category:  models.AuditCategoryUser,
			user:      "unknown",
			details:   "3 consecutive failed login attempts from IP 203.0.113.42",
			timestamp: "2025-02-23T03:15:00Z",
			severity:  models.AuditSeverityCritical,
		},
	}

	logs := make([]models.AuditLog, 0, len(logSeeds))
	for _, seed := range logSeeds {
		timestamp, err := time.Parse(time.RFC3339, seed.timestamp)
		if err != nil {
			return fmt.Errorf("failed to parse audit timestamp %q: %w", seed.timestamp, err)
		}

		logs = append(logs, models.AuditLog{
			ID:        seed.id,
			Action:    seed.action,
			Category:  seed.category,
			User:      seed.user,
			Details:   seed.details,
			Timestamp: timestamp.UTC(),
			Severity:  seed.severity,
		})
	}

	return db.Create(&logs).Error
}

func int64Ptr(value int64) *int64 {
	return &value
}
