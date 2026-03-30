package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repositories"
)

type OrderService struct {
	repo *repositories.OrderRepository
}

func NewOrderService(repo *repositories.OrderRepository) *OrderService {
	return &OrderService{repo: repo}
}

func (s *OrderService) List() ([]models.OrderResponse, error) {
	orders, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]models.OrderResponse, 0, len(orders))
	for _, order := range orders {
		result = append(result, mapOrderResponse(order))
	}
	return result, nil
}

func (s *OrderService) ListByCustomerEmail(email string) ([]models.OrderResponse, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, errors.New("email is required")
	}

	orders, err := s.repo.ListByCustomerEmail(email)
	if err != nil {
		return nil, err
	}

	result := make([]models.OrderResponse, 0, len(orders))
	for _, order := range orders {
		result = append(result, mapOrderResponse(order))
	}
	return result, nil
}

type CreateOrderInput struct {
	Customer string
	Email    string
	Address  string
	Items    []models.CartItem
}

type UpdateOrderInput struct {
	Customer string
	Email    string
	Address  string
	Date     time.Time
	Status   models.OrderState
	Items    []models.CartItem
}

func (s *OrderService) Create(input CreateOrderInput) (models.OrderResponse, error) {
	input.Customer = strings.TrimSpace(input.Customer)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Address = strings.TrimSpace(input.Address)

	if input.Customer == "" {
		return models.OrderResponse{}, errors.New("customer is required")
	}
	if input.Email == "" {
		return models.OrderResponse{}, errors.New("email is required")
	}
	if input.Address == "" {
		return models.OrderResponse{}, errors.New("address is required")
	}
	if len(input.Items) == 0 {
		return models.OrderResponse{}, errors.New("items are required")
	}

	pendingStatus, err := s.repo.FindStatusByCode(string(models.OrderStatusPending))
	if err != nil {
		return models.OrderResponse{}, err
	}

	tx := s.repo.Begin()
	if tx.Error != nil {
		return models.OrderResponse{}, tx.Error
	}

	customer, err := s.repo.FindOrCreateCustomer(tx, input.Customer, input.Email)
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, err
	}

	total := int64(0)
	orderItems := make([]models.OrderItem, 0, len(input.Items))
	for _, item := range input.Items {
		productID := strings.TrimSpace(item.Product.ID)
		if productID == "" {
			tx.Rollback()
			return models.OrderResponse{}, errors.New("product.id is required for each cart item")
		}
		if item.Quantity <= 0 {
			tx.Rollback()
			return models.OrderResponse{}, errors.New("quantity must be greater than 0")
		}

		product, getErr := s.repo.FindProductForUpdate(tx, productID)
		if getErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, fmt.Errorf("product %s not found", productID)
		}
		if product.StockQty < item.Quantity {
			tx.Rollback()
			return models.OrderResponse{}, fmt.Errorf("insufficient stock for %s", product.Name)
		}

		product.StockQty -= item.Quantity
		if saveErr := tx.Save(&product).Error; saveErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, saveErr
		}

		total += int64(item.Quantity) * product.Price
		orderItems = append(orderItems, models.OrderItem{ProductID: product.ID, Qty: item.Quantity, Price: product.Price})
	}

	order := models.Order{
		ID:         repositories.GenerateID("ORD"),
		CustomerID: customer.ID,
		StatusID:   pendingStatus.ID,
		TotalSum:   total,
		Address:    input.Address,
		CreatedAt:  time.Now().UTC(),
	}
	order.UpdatedAt = order.CreatedAt
	if err := s.repo.SaveOrder(tx, &order); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, err
	}
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
	}
	if err := s.repo.SaveOrderItems(tx, orderItems); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return models.OrderResponse{}, err
	}

	stored, err := s.repo.GetByID(order.ID)
	if err != nil {
		return models.OrderResponse{}, err
	}
	return mapOrderResponse(stored), nil
}

func (s *OrderService) UpdateStatus(orderID string, status models.OrderState) (models.OrderResponse, models.OrderState, error) {
	if strings.TrimSpace(orderID) == "" {
		return models.OrderResponse{}, "", errors.New("invalid order id")
	}
	if !models.IsValidOrderStatus(status) {
		return models.OrderResponse{}, "", errors.New("invalid status")
	}

	tx := s.repo.Begin()
	if tx.Error != nil {
		return models.OrderResponse{}, "", tx.Error
	}

	order, err := s.repo.GetByID(orderID)
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}
	prev := models.OrderState(order.StatusRef.Code)
	statusRef, err := s.repo.FindStatusByCode(string(status))
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	if err := s.repo.UpdateStatus(tx, &order, statusRef.ID); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	updated, err := s.repo.GetByID(orderID)
	if err != nil {
		return models.OrderResponse{}, "", err
	}

	return mapOrderResponse(updated), prev, nil
}

func (s *OrderService) Update(orderID string, input UpdateOrderInput) (models.OrderResponse, models.OrderState, error) {
	if strings.TrimSpace(orderID) == "" {
		return models.OrderResponse{}, "", errors.New("invalid order id")
	}
	input.Customer = strings.TrimSpace(input.Customer)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Address = strings.TrimSpace(input.Address)
	if input.Customer == "" {
		return models.OrderResponse{}, "", errors.New("customer is required")
	}
	if input.Email == "" {
		return models.OrderResponse{}, "", errors.New("email is required")
	}
	if input.Address == "" {
		return models.OrderResponse{}, "", errors.New("address is required")
	}
	if len(input.Items) == 0 {
		return models.OrderResponse{}, "", errors.New("items are required")
	}
	if !models.IsValidOrderStatus(input.Status) {
		return models.OrderResponse{}, "", errors.New("invalid status")
	}
	if input.Date.IsZero() {
		input.Date = time.Now().UTC()
	}

	tx := s.repo.Begin()
	if tx.Error != nil {
		return models.OrderResponse{}, "", tx.Error
	}

	order, err := s.repo.GetByID(orderID)
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}
	prev := models.OrderState(order.StatusRef.Code)

	customer, err := s.repo.FindOrCreateCustomer(tx, input.Customer, input.Email)
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}
	statusRef, err := s.repo.FindStatusByCode(string(input.Status))
	if err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	for _, item := range order.Items {
		product, getErr := s.repo.FindProductForUpdate(tx, item.ProductID)
		if getErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, "", getErr
		}
		product.StockQty += item.Qty
		if saveErr := tx.Save(&product).Error; saveErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, "", saveErr
		}
	}

	total := int64(0)
	newItems := make([]models.OrderItem, 0, len(input.Items))
	for _, item := range input.Items {
		productID := strings.TrimSpace(item.Product.ID)
		if productID == "" {
			tx.Rollback()
			return models.OrderResponse{}, "", errors.New("product.id is required for each cart item")
		}
		if item.Quantity <= 0 {
			tx.Rollback()
			return models.OrderResponse{}, "", errors.New("quantity must be greater than 0")
		}

		product, getErr := s.repo.FindProductForUpdate(tx, productID)
		if getErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, "", fmt.Errorf("product %s not found", productID)
		}
		if product.StockQty < item.Quantity {
			tx.Rollback()
			return models.OrderResponse{}, "", fmt.Errorf("insufficient stock for %s", product.Name)
		}

		product.StockQty -= item.Quantity
		if saveErr := tx.Save(&product).Error; saveErr != nil {
			tx.Rollback()
			return models.OrderResponse{}, "", saveErr
		}

		total += int64(item.Quantity) * product.Price
		newItems = append(newItems, models.OrderItem{
			OrderID:   order.ID,
			ProductID: product.ID,
			Qty:       item.Quantity,
			Price:     product.Price,
		})
	}

	if err := s.repo.DeleteOrderItems(tx, order.ID); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}
	if err := s.repo.SaveOrderItems(tx, newItems); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	order.CustomerID = customer.ID
	order.StatusID = statusRef.ID
	order.TotalSum = total
	order.Address = input.Address
	order.CreatedAt = input.Date.UTC()
	order.UpdatedAt = time.Now().UTC()

	if err := s.repo.UpdateOrder(tx, &order); err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return models.OrderResponse{}, "", err
	}

	updated, err := s.repo.GetByID(orderID)
	if err != nil {
		return models.OrderResponse{}, "", err
	}
	return mapOrderResponse(updated), prev, nil
}

func mapOrderResponse(order models.Order) models.OrderResponse {
	items := make([]models.CartItem, 0, len(order.Items))
	for _, item := range order.Items {
		item.Product.Category = item.Product.CategoryRef.Name
		item.Product.SyncViewFields()
		items = append(items, models.CartItem{Product: item.Product, Quantity: item.Qty})
	}

	return models.OrderResponse{
		ID:       order.ID,
		Customer: order.Customer.FullName,
		Email:    order.Customer.Email,
		Items:    items,
		Total:    order.TotalSum,
		Status:   models.OrderState(order.StatusRef.Code),
		Date:     order.CreatedAt,
		Address:  order.Address,
	}
}
