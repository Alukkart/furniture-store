package ai

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

const modelVersion = 2

type Service struct {
	db          *gorm.DB
	modelPath   string
	datasetPath string
	model       *ModelArtifact
}

type ModelArtifact struct {
	Version      int             `json:"version"`
	TrainedAt    time.Time       `json:"trainedAt"`
	FeatureNames []string        `json:"featureNames"`
	TransitModel BoostModel      `json:"transitModel"`
	RiskModel    BoostModel      `json:"riskModel"`
	Metrics      ModelMetrics    `json:"metrics"`
	Summary      TrainingSummary `json:"summary"`
}

type BoostModel struct {
	InitialGuess float64         `json:"initialGuess"`
	LearningRate float64         `json:"learningRate"`
	Trees        []DecisionStump `json:"trees"`
}

type ModelMetrics struct {
	ETAMAE       float64 `json:"etaMae"`
	ETARMSE      float64 `json:"etaRmse"`
	RiskBrier    float64 `json:"riskBrier"`
	RiskAccuracy float64 `json:"riskAccuracy"`
}

type TrainingSummary struct {
	Samples         int      `json:"samples"`
	Products        int      `json:"products"`
	SupplierRegions []string `json:"supplierRegions"`
	ShippingModes   []string `json:"shippingModes"`
	TargetHorizon   string   `json:"targetHorizon"`
}

type DecisionStump struct {
	FeatureIndex int     `json:"featureIndex"`
	Threshold    float64 `json:"threshold"`
	LeftValue    float64 `json:"leftValue"`
	RightValue   float64 `json:"rightValue"`
}

type historyRow struct {
	ProductID           string
	ProductName         string
	Category            string
	Month               int
	MonthIndex          int
	Price               float64
	Stock               float64
	Featured            float64
	SupplierRegion      string
	ShippingMode        string
	DistanceKm          float64
	CustomsComplexity   float64
	PortCongestion      float64
	StockPressure       float64
	TransitDays         float64
	DelayRisk           float64
	RecentOrderPressure float64
}

type encodedSample struct {
	Features []float64
	Target   float64
}

type ForecastResponse struct {
	PlanningDays      int                `json:"planningDays"`
	GeneratedAt       time.Time          `json:"generatedAt"`
	Metrics           ModelMetrics       `json:"metrics"`
	ModelSummary      TrainingSummary    `json:"modelSummary"`
	ShipmentForecasts []ShipmentForecast `json:"shipmentForecasts"`
	RegionForecasts   []RegionForecast   `json:"regionForecasts"`
}

type ShipmentForecast struct {
	ProductID             string  `json:"productId"`
	ProductName           string  `json:"productName"`
	Category              string  `json:"category"`
	SupplierRegion        string  `json:"supplierRegion"`
	ShippingMode          string  `json:"shippingMode"`
	EstimatedDeliveryDate string  `json:"estimatedDeliveryDate"`
	EstimatedTransitDays  int     `json:"estimatedTransitDays"`
	DelayRiskScore        float64 `json:"delayRiskScore"`
	DelayRiskLabel        string  `json:"delayRiskLabel"`
	OnTimeProbability     float64 `json:"onTimeProbability"`
	Stock                 int     `json:"stock"`
	Price                 int64   `json:"price"`
	PrimaryRiskFactor     string  `json:"primaryRiskFactor"`
	Explanation           string  `json:"explanation"`
}

type RegionForecast struct {
	SupplierRegion      string  `json:"supplierRegion"`
	AverageTransitDays  float64 `json:"averageTransitDays"`
	AverageDelayRisk    float64 `json:"averageDelayRisk"`
	HighRiskShipments   int     `json:"highRiskShipments"`
	ForecastedShipments int     `json:"forecastedShipments"`
}

type supplierProfile struct {
	Region            string
	ShippingMode      string
	DistanceKm        float64
	CustomsComplexity float64
}

func NewService(db *gorm.DB, modelPath, datasetPath string) (*Service, error) {
	service := &Service{
		db:          db,
		modelPath:   modelPath,
		datasetPath: datasetPath,
	}

	if err := service.ensureReady(); err != nil {
		return nil, err
	}

	return service, nil
}

func (s *Service) ensureReady() error {
	if model, err := loadModel(s.modelPath); err == nil && model.Version == modelVersion {
		s.model = model
		return nil
	}

	artifact, dataset, err := s.train()
	if err != nil {
		return err
	}

	if err := saveDataset(s.datasetPath, dataset); err != nil {
		return err
	}
	if err := saveModel(s.modelPath, artifact); err != nil {
		return err
	}

	s.model = artifact
	return nil
}

func (s *Service) train() (*ModelArtifact, []historyRow, error) {
	products, orders, err := s.loadDomainData()
	if err != nil {
		return nil, nil, err
	}

	dataset := buildShipmentDataset(products, orders)
	if len(dataset) == 0 {
		return nil, nil, errors.New("delivery training dataset is empty")
	}

	featureNames, transitSamples, riskSamples := encodeSamples(dataset)
	trainTransit, testTransit := splitSamples(transitSamples)
	trainRisk, testRisk := splitSamples(riskSamples)

	transitModel, transitTargets, transitPreds := fitBoostModel(trainTransit, testTransit, 28, 0.16)
	riskModel, riskTargets, riskPreds := fitBoostModel(trainRisk, testRisk, 24, 0.14)

	regions := uniqueSupplierRegions(dataset)
	modes := uniqueShippingModes(dataset)
	sort.Strings(regions)
	sort.Strings(modes)

	return &ModelArtifact{
		Version:      modelVersion,
		TrainedAt:    time.Now().UTC(),
		FeatureNames: featureNames,
		TransitModel: transitModel,
		RiskModel:    riskModel,
		Metrics: ModelMetrics{
			ETAMAE:       computeMAE(transitTargets, transitPreds),
			ETARMSE:      computeRMSE(transitTargets, transitPreds),
			RiskBrier:    computeBrierScore(riskTargets, riskPreds),
			RiskAccuracy: computeRiskAccuracy(riskTargets, riskPreds),
		},
		Summary: TrainingSummary{
			Samples:         len(dataset),
			Products:        len(products),
			SupplierRegions: regions,
			ShippingModes:   modes,
			TargetHorizon:   "delivery ETA and delay risk",
		},
	}, dataset, nil
}

func (s *Service) Forecast(planningDays int) (ForecastResponse, error) {
	if planningDays <= 0 {
		planningDays = 30
	}
	if s.model == nil {
		if err := s.ensureReady(); err != nil {
			return ForecastResponse{}, err
		}
	}

	products, orders, err := s.loadDomainData()
	if err != nil {
		return ForecastResponse{}, err
	}

	now := time.Now().UTC()
	orderPressure := categoryOrderPressure(orders)
	shipmentForecasts := make([]ShipmentForecast, 0, len(products))
	regionAgg := map[string]*RegionForecast{}

	for _, product := range products {
		row := currentShipmentRow(product, orderPressure, int(now.Month()))
		features := encodeRowFeatures(row, s.model.FeatureNames)

		eta := math.Max(4, predictBoostModel(s.model.TransitModel, features))
		riskScore := clamp(predictBoostModel(s.model.RiskModel, features), 0.04, 0.96)
		deliveryDate := now.AddDate(0, 0, int(math.Round(eta)))

		riskLabel := classifyDelayRisk(riskScore)
		primaryRisk := describePrimaryRisk(row)
		explanation := fmt.Sprintf(
			"%s shipment from %s via %s is tracking %d transit days. Main risk driver: %s.",
			product.Name,
			row.SupplierRegion,
			strings.ToLower(row.ShippingMode),
			int(math.Round(eta)),
			primaryRisk,
		)

		item := ShipmentForecast{
			ProductID:             product.ID,
			ProductName:           product.Name,
			Category:              product.Category,
			SupplierRegion:        row.SupplierRegion,
			ShippingMode:          row.ShippingMode,
			EstimatedDeliveryDate: deliveryDate.Format(time.RFC3339),
			EstimatedTransitDays:  int(math.Round(eta)),
			DelayRiskScore:        round2(riskScore * 100),
			DelayRiskLabel:        riskLabel,
			OnTimeProbability:     round2((1 - riskScore) * 100),
			Stock:                 product.Stock,
			Price:                 product.Price,
			PrimaryRiskFactor:     primaryRisk,
			Explanation:           explanation,
		}
		shipmentForecasts = append(shipmentForecasts, item)

		agg := regionAgg[row.SupplierRegion]
		if agg == nil {
			agg = &RegionForecast{SupplierRegion: row.SupplierRegion}
			regionAgg[row.SupplierRegion] = agg
		}
		agg.AverageTransitDays += eta
		agg.AverageDelayRisk += riskScore * 100
		agg.ForecastedShipments++
		if riskScore >= 0.55 {
			agg.HighRiskShipments++
		}
	}

	sort.Slice(shipmentForecasts, func(i, j int) bool {
		if shipmentForecasts[i].DelayRiskScore == shipmentForecasts[j].DelayRiskScore {
			return shipmentForecasts[i].EstimatedTransitDays > shipmentForecasts[j].EstimatedTransitDays
		}
		return shipmentForecasts[i].DelayRiskScore > shipmentForecasts[j].DelayRiskScore
	})

	regionForecasts := make([]RegionForecast, 0, len(regionAgg))
	for _, region := range regionAgg {
		if region.ForecastedShipments > 0 {
			region.AverageTransitDays = round2(region.AverageTransitDays / float64(region.ForecastedShipments))
			region.AverageDelayRisk = round2(region.AverageDelayRisk / float64(region.ForecastedShipments))
		}
		regionForecasts = append(regionForecasts, *region)
	}
	sort.Slice(regionForecasts, func(i, j int) bool {
		return regionForecasts[i].AverageDelayRisk > regionForecasts[j].AverageDelayRisk
	})

	return ForecastResponse{
		PlanningDays:      planningDays,
		GeneratedAt:       now,
		Metrics:           s.model.Metrics,
		ModelSummary:      s.model.Summary,
		ShipmentForecasts: shipmentForecasts,
		RegionForecasts:   regionForecasts,
	}, nil
}

func (s *Service) loadDomainData() ([]models.Product, []models.Order, error) {
	var products []models.Product
	if err := s.db.Order("name asc").Find(&products).Error; err != nil {
		return nil, nil, err
	}

	var orders []models.Order
	if err := s.db.Order("date asc").Find(&orders).Error; err != nil {
		return nil, nil, err
	}

	return products, orders, nil
}

func buildShipmentDataset(products []models.Product, orders []models.Order) []historyRow {
	orderPressure := categoryOrderPressure(orders)
	rows := make([]historyRow, 0, len(products)*18)
	currentMonth := int(time.Now().UTC().Month())

	for monthIndex := 0; monthIndex < 18; monthIndex++ {
		month := ((currentMonth - 17 + monthIndex - 1 + 12*3) % 12) + 1
		portCongestion := congestionForMonth(month)
		trend := 0.35 + float64(monthIndex%6)*0.12

		for _, product := range products {
			profile := supplierForProduct(product)
			stockPressure := stockPressure(product.Stock)
			orderLoad := orderPressure[product.Category]
			expedite := 0.0
			if product.Featured {
				expedite = -1.2
			}

			transitDays := baseTransitDays(profile) +
				portCongestion*5.5 +
				profile.CustomsComplexity*4.2 +
				stockPressure*3.8 +
				orderLoad*6.0 +
				priceUrgency(product.Price) +
				trend +
				expedite

			delayRisk := clamp(
				0.12+
					portCongestion*0.28+
					profile.CustomsComplexity*0.22+
					(profile.DistanceKm/10000.0)*0.18+
					stockPressure*0.14+
					orderLoad*0.16+
					shippingRisk(profile.ShippingMode),
				0.03,
				0.97,
			)

			rows = append(rows, historyRow{
				ProductID:           product.ID,
				ProductName:         product.Name,
				Category:            product.Category,
				Month:               month,
				MonthIndex:          monthIndex,
				Price:               float64(product.Price),
				Stock:               float64(product.Stock),
				Featured:            boolToFloat(product.Featured),
				SupplierRegion:      profile.Region,
				ShippingMode:        profile.ShippingMode,
				DistanceKm:          profile.DistanceKm,
				CustomsComplexity:   profile.CustomsComplexity,
				PortCongestion:      portCongestion,
				StockPressure:       stockPressure,
				TransitDays:         round2(math.Max(4, transitDays)),
				DelayRisk:           round4(delayRisk),
				RecentOrderPressure: orderLoad,
			})
		}
	}

	return rows
}

func currentShipmentRow(product models.Product, orderPressure map[string]float64, month int) historyRow {
	profile := supplierForProduct(product)
	return historyRow{
		ProductID:           product.ID,
		ProductName:         product.Name,
		Category:            product.Category,
		Month:               month,
		Price:               float64(product.Price),
		Stock:               float64(product.Stock),
		Featured:            boolToFloat(product.Featured),
		SupplierRegion:      profile.Region,
		ShippingMode:        profile.ShippingMode,
		DistanceKm:          profile.DistanceKm,
		CustomsComplexity:   profile.CustomsComplexity,
		PortCongestion:      congestionForMonth(month),
		StockPressure:       stockPressure(product.Stock),
		RecentOrderPressure: orderPressure[product.Category],
	}
}

func encodeSamples(rows []historyRow) ([]string, []encodedSample, []encodedSample) {
	categories := distinctValues(rows, func(row historyRow) string { return row.Category })
	regions := distinctValues(rows, func(row historyRow) string { return row.SupplierRegion })
	modes := distinctValues(rows, func(row historyRow) string { return row.ShippingMode })

	featureNames := []string{
		"price_norm",
		"stock_norm",
		"featured",
		"month_sin",
		"month_cos",
		"distance_norm",
		"customs_complexity",
		"port_congestion",
		"stock_pressure",
		"recent_order_pressure",
	}
	for _, category := range categories {
		featureNames = append(featureNames, "category_"+normalizeFeature(category))
	}
	for _, region := range regions {
		featureNames = append(featureNames, "region_"+normalizeFeature(region))
	}
	for _, mode := range modes {
		featureNames = append(featureNames, "mode_"+normalizeFeature(mode))
	}

	transitSamples := make([]encodedSample, 0, len(rows))
	riskSamples := make([]encodedSample, 0, len(rows))
	for _, row := range rows {
		features := encodeRowFeatures(row, featureNames)
		transitSamples = append(transitSamples, encodedSample{Features: features, Target: row.TransitDays})
		riskSamples = append(riskSamples, encodedSample{Features: features, Target: row.DelayRisk})
	}

	return featureNames, transitSamples, riskSamples
}

func encodeRowFeatures(row historyRow, featureNames []string) []float64 {
	features := make([]float64, 0, len(featureNames))
	angle := 2 * math.Pi * float64(row.Month) / 12.0

	for _, featureName := range featureNames {
		switch {
		case featureName == "price_norm":
			features = append(features, row.Price/2500.0)
		case featureName == "stock_norm":
			features = append(features, math.Min(row.Stock, 60)/60.0)
		case featureName == "featured":
			features = append(features, row.Featured)
		case featureName == "month_sin":
			features = append(features, math.Sin(angle))
		case featureName == "month_cos":
			features = append(features, math.Cos(angle))
		case featureName == "distance_norm":
			features = append(features, row.DistanceKm/10000.0)
		case featureName == "customs_complexity":
			features = append(features, row.CustomsComplexity)
		case featureName == "port_congestion":
			features = append(features, row.PortCongestion)
		case featureName == "stock_pressure":
			features = append(features, row.StockPressure)
		case featureName == "recent_order_pressure":
			features = append(features, row.RecentOrderPressure)
		case strings.HasPrefix(featureName, "category_"):
			features = append(features, boolMatch(featureName, "category_", row.Category))
		case strings.HasPrefix(featureName, "region_"):
			features = append(features, boolMatch(featureName, "region_", row.SupplierRegion))
		case strings.HasPrefix(featureName, "mode_"):
			features = append(features, boolMatch(featureName, "mode_", row.ShippingMode))
		default:
			features = append(features, 0.0)
		}
	}

	return features
}

func splitSamples(samples []encodedSample) ([]encodedSample, []encodedSample) {
	trainSet := make([]encodedSample, 0, len(samples))
	testSet := make([]encodedSample, 0, len(samples)/5)
	for idx, sample := range samples {
		if idx%5 == 0 {
			testSet = append(testSet, sample)
		} else {
			trainSet = append(trainSet, sample)
		}
	}
	if len(testSet) == 0 && len(trainSet) > 0 {
		testSet = append(testSet, trainSet[len(trainSet)-1])
		trainSet = trainSet[:len(trainSet)-1]
	}
	return trainSet, testSet
}

func fitBoostModel(trainSet, testSet []encodedSample, rounds int, learningRate float64) (BoostModel, []float64, []float64) {
	initial := meanTarget(trainSet)
	predictions := make([]float64, len(trainSet))
	for idx := range predictions {
		predictions[idx] = initial
	}

	trees := make([]DecisionStump, 0, rounds)
	for round := 0; round < rounds; round++ {
		residuals := make([]float64, len(trainSet))
		for idx, sample := range trainSet {
			residuals[idx] = sample.Target - predictions[idx]
		}

		stump, ok := bestStump(trainSet, residuals)
		if !ok {
			break
		}

		trees = append(trees, stump)
		for idx, sample := range trainSet {
			predictions[idx] += learningRate * stump.predict(sample.Features)
		}
	}

	model := BoostModel{
		InitialGuess: initial,
		LearningRate: learningRate,
		Trees:        trees,
	}

	targets := make([]float64, 0, len(testSet))
	evalPreds := make([]float64, 0, len(testSet))
	for _, sample := range testSet {
		targets = append(targets, sample.Target)
		evalPreds = append(evalPreds, predictBoostModel(model, sample.Features))
	}

	return model, targets, evalPreds
}

func bestStump(samples []encodedSample, residuals []float64) (DecisionStump, bool) {
	if len(samples) == 0 {
		return DecisionStump{}, false
	}

	featureCount := len(samples[0].Features)
	bestScore := math.MaxFloat64
	best := DecisionStump{}
	found := false

	for featureIdx := 0; featureIdx < featureCount; featureIdx++ {
		values := make([]float64, 0, len(samples))
		for _, sample := range samples {
			values = append(values, sample.Features[featureIdx])
		}
		sort.Float64s(values)

		thresholds := make([]float64, 0, len(values))
		for idx := 1; idx < len(values); idx++ {
			if values[idx] == values[idx-1] {
				continue
			}
			thresholds = append(thresholds, (values[idx]+values[idx-1])/2)
		}
		if len(thresholds) == 0 {
			thresholds = append(thresholds, values[0])
		}

		for _, threshold := range thresholds {
			var leftSum, rightSum float64
			var leftCount, rightCount int
			for idx, sample := range samples {
				if sample.Features[featureIdx] <= threshold {
					leftSum += residuals[idx]
					leftCount++
				} else {
					rightSum += residuals[idx]
					rightCount++
				}
			}
			if leftCount == 0 || rightCount == 0 {
				continue
			}

			leftMean := leftSum / float64(leftCount)
			rightMean := rightSum / float64(rightCount)
			score := 0.0
			for idx, sample := range samples {
				pred := rightMean
				if sample.Features[featureIdx] <= threshold {
					pred = leftMean
				}
				diff := residuals[idx] - pred
				score += diff * diff
			}

			if score < bestScore {
				bestScore = score
				best = DecisionStump{
					FeatureIndex: featureIdx,
					Threshold:    threshold,
					LeftValue:    leftMean,
					RightValue:   rightMean,
				}
				found = true
			}
		}
	}

	return best, found
}

func (d DecisionStump) predict(features []float64) float64 {
	if d.FeatureIndex >= len(features) {
		return d.RightValue
	}
	if features[d.FeatureIndex] <= d.Threshold {
		return d.LeftValue
	}
	return d.RightValue
}

func predictBoostModel(model BoostModel, features []float64) float64 {
	result := model.InitialGuess
	for _, tree := range model.Trees {
		result += model.LearningRate * tree.predict(features)
	}
	return result
}

func saveModel(path string, model *ModelArtifact) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	payload, err := json.MarshalIndent(model, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, payload, 0o644)
}

func loadModel(path string) (*ModelArtifact, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var artifact ModelArtifact
	if err := json.Unmarshal(payload, &artifact); err != nil {
		return nil, err
	}
	return &artifact, nil
}

func saveDataset(path string, rows []historyRow) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{
		"product_id", "product_name", "category", "month", "month_index", "price", "stock",
		"featured", "supplier_region", "shipping_mode", "distance_km", "customs_complexity",
		"port_congestion", "stock_pressure", "recent_order_pressure", "transit_days", "delay_risk",
	}
	if err := writer.Write(header); err != nil {
		return err
	}

	for _, row := range rows {
		record := []string{
			row.ProductID,
			row.ProductName,
			row.Category,
			fmt.Sprintf("%d", row.Month),
			fmt.Sprintf("%d", row.MonthIndex),
			fmt.Sprintf("%.2f", row.Price),
			fmt.Sprintf("%.2f", row.Stock),
			fmt.Sprintf("%.0f", row.Featured),
			row.SupplierRegion,
			row.ShippingMode,
			fmt.Sprintf("%.2f", row.DistanceKm),
			fmt.Sprintf("%.4f", row.CustomsComplexity),
			fmt.Sprintf("%.4f", row.PortCongestion),
			fmt.Sprintf("%.4f", row.StockPressure),
			fmt.Sprintf("%.4f", row.RecentOrderPressure),
			fmt.Sprintf("%.2f", row.TransitDays),
			fmt.Sprintf("%.4f", row.DelayRisk),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}

	return writer.Error()
}

func categoryOrderPressure(orders []models.Order) map[string]float64 {
	counts := map[string]float64{}
	for _, order := range orders {
		items, err := order.Items()
		if err != nil {
			continue
		}
		for _, item := range items {
			counts[item.Product.Category] += float64(item.Quantity)
		}
	}

	maxValue := 0.0
	for _, value := range counts {
		if value > maxValue {
			maxValue = value
		}
	}
	if maxValue == 0 {
		return counts
	}
	for key, value := range counts {
		counts[key] = round4(math.Min(1, value/maxValue))
	}
	return counts
}

func supplierForProduct(product models.Product) supplierProfile {
	switch product.Category {
	case "Living Room":
		return supplierProfile{Region: "Western Europe", ShippingMode: "Sea Freight", DistanceKm: 2600, CustomsComplexity: 0.28}
	case "Bedroom":
		return supplierProfile{Region: "Eastern Europe", ShippingMode: "Road Freight", DistanceKm: 1400, CustomsComplexity: 0.18}
	case "Dining Room":
		return supplierProfile{Region: "Mediterranean", ShippingMode: "Sea Freight", DistanceKm: 3100, CustomsComplexity: 0.26}
	case "Home Office":
		return supplierProfile{Region: "Central Europe", ShippingMode: "Road Freight", DistanceKm: 1800, CustomsComplexity: 0.16}
	case "Lighting":
		return supplierProfile{Region: "East Asia", ShippingMode: "Air Freight", DistanceKm: 7900, CustomsComplexity: 0.42}
	case "Rugs & Textiles":
		return supplierProfile{Region: "South Asia", ShippingMode: "Sea Freight", DistanceKm: 6200, CustomsComplexity: 0.38}
	default:
		return supplierProfile{Region: "Baltics", ShippingMode: "Road Freight", DistanceKm: 900, CustomsComplexity: 0.12}
	}
}

func baseTransitDays(profile supplierProfile) float64 {
	switch profile.ShippingMode {
	case "Air Freight":
		return 7 + profile.DistanceKm/2200.0
	case "Sea Freight":
		return 16 + profile.DistanceKm/700.0
	default:
		return 5 + profile.DistanceKm/450.0
	}
}

func congestionForMonth(month int) float64 {
	seasonal := 0.32 + 0.18*(1+math.Sin(2*math.Pi*float64(month-1)/12.0))/2
	switch month {
	case 8, 11, 12:
		seasonal += 0.14
	case 1, 2:
		seasonal += 0.08
	}
	return round4(clamp(seasonal, 0.15, 0.82))
}

func stockPressure(stock int) float64 {
	switch {
	case stock <= 5:
		return 0.95
	case stock <= 10:
		return 0.70
	case stock <= 20:
		return 0.38
	default:
		return 0.12
	}
}

func priceUrgency(price int64) float64 {
	switch {
	case price >= 1800:
		return -0.9
	case price >= 900:
		return -0.3
	default:
		return 0.4
	}
}

func shippingRisk(mode string) float64 {
	switch mode {
	case "Sea Freight":
		return 0.16
	case "Air Freight":
		return 0.08
	default:
		return 0.05
	}
}

func describePrimaryRisk(row historyRow) string {
	type factor struct {
		label string
		score float64
	}
	factors := []factor{
		{label: "port congestion", score: row.PortCongestion},
		{label: "customs clearance", score: row.CustomsComplexity},
		{label: "low stock urgency", score: row.StockPressure},
		{label: "long-haul distance", score: row.DistanceKm / 10000.0},
		{label: "order backlog", score: row.RecentOrderPressure},
	}
	sort.Slice(factors, func(i, j int) bool { return factors[i].score > factors[j].score })
	return factors[0].label
}

func classifyDelayRisk(score float64) string {
	switch {
	case score >= 0.68:
		return "High"
	case score >= 0.42:
		return "Medium"
	default:
		return "Low"
	}
}

func meanTarget(samples []encodedSample) float64 {
	if len(samples) == 0 {
		return 0
	}
	total := 0.0
	for _, sample := range samples {
		total += sample.Target
	}
	return total / float64(len(samples))
}

func computeMAE(actual, predicted []float64) float64 {
	if len(actual) == 0 {
		return 0
	}
	sum := 0.0
	for idx := range actual {
		sum += math.Abs(predicted[idx] - actual[idx])
	}
	return round4(sum / float64(len(actual)))
}

func computeRMSE(actual, predicted []float64) float64 {
	if len(actual) == 0 {
		return 0
	}
	sum := 0.0
	for idx := range actual {
		diff := predicted[idx] - actual[idx]
		sum += diff * diff
	}
	return round4(math.Sqrt(sum / float64(len(actual))))
}

func computeBrierScore(actual, predicted []float64) float64 {
	if len(actual) == 0 {
		return 0
	}
	sum := 0.0
	for idx := range actual {
		diff := clamp(predicted[idx], 0, 1) - clamp(actual[idx], 0, 1)
		sum += diff * diff
	}
	return round4(sum / float64(len(actual)))
}

func computeRiskAccuracy(actual, predicted []float64) float64 {
	if len(actual) == 0 {
		return 0
	}
	matches := 0
	for idx := range actual {
		if classifyDelayRisk(actual[idx]) == classifyDelayRisk(predicted[idx]) {
			matches++
		}
	}
	return round4(float64(matches) / float64(len(actual)) * 100)
}

func distinctValues(rows []historyRow, pick func(historyRow) string) []string {
	set := map[string]struct{}{}
	for _, row := range rows {
		set[pick(row)] = struct{}{}
	}
	values := make([]string, 0, len(set))
	for value := range set {
		values = append(values, value)
	}
	sort.Strings(values)
	return values
}

func uniqueSupplierRegions(rows []historyRow) []string {
	return distinctValues(rows, func(row historyRow) string { return row.SupplierRegion })
}

func uniqueShippingModes(rows []historyRow) []string {
	return distinctValues(rows, func(row historyRow) string { return row.ShippingMode })
}

func normalizeFeature(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "&", "and")
	value = strings.ReplaceAll(value, " ", "_")
	value = strings.ReplaceAll(value, "-", "_")
	return value
}

func boolMatch(featureName, prefix, actual string) float64 {
	if strings.TrimPrefix(featureName, prefix) == normalizeFeature(actual) {
		return 1.0
	}
	return 0.0
}

func boolToFloat(value bool) float64 {
	if value {
		return 1
	}
	return 0
}

func clamp(value, minValue, maxValue float64) float64 {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

func round2(value float64) float64 {
	return math.Round(value*100) / 100
}

func round4(value float64) float64 {
	return math.Round(value*10000) / 10000
}
