package services

import (
	"errors"
	"math"
	"os"
	"path/filepath"
	"time"

	"backend/internal/ai"
	"backend/internal/repositories"
)

type ForecastRow struct {
	CategoryID     uint    `json:"category_id"`
	Category       string  `json:"category"`
	ForecastQty    int     `json:"forecast_qty"`
	RecommendedBuy int     `json:"recommended_buy"`
	Factors        string  `json:"factors"`
	Confidence     float64 `json:"confidence"`
}

type ForecastResponse struct {
	TrainedAt time.Time     `json:"trained_at"`
	MAE       float64       `json:"mae"`
	RMSE      float64       `json:"rmse"`
	Period    int           `json:"period_months"`
	Rows      []ForecastRow `json:"rows"`
}

type ForecastService struct {
	repo      *repositories.ForecastRepository
	modelPath string
}

func NewForecastService(repo *repositories.ForecastRepository, modelPath string) *ForecastService {
	return &ForecastService{repo: repo, modelPath: modelPath}
}

func (s *ForecastService) TrainAndSave() (ai.ModelArtifact, error) {
	rows, err := s.repo.TrainingRows()
	if err != nil {
		return ai.ModelArtifact{}, err
	}
	if len(rows) == 0 {
		return ai.ModelArtifact{}, errors.New("no training data")
	}

	samples := make([]ai.Sample, 0, len(rows))
	for _, row := range rows {
		samples = append(samples, ai.Sample{CategoryID: row.CategoryID, Date: row.DT, SoldQty: float64(row.SoldQty)})
	}

	artifact := ai.Train(samples)
	if err := ai.Save(s.modelPath, artifact); err != nil {
		return ai.ModelArtifact{}, err
	}
	return artifact, nil
}

func (s *ForecastService) Forecast(periodMonths int) (ForecastResponse, error) {
	if periodMonths <= 0 {
		periodMonths = 3
	}

	artifact, err := ai.Load(s.modelPath)
	if err != nil {
		if os.IsNotExist(err) {
			artifact, err = s.TrainAndSave()
		}
		if err != nil {
			return ForecastResponse{}, err
		}
	}

	categories, err := s.repo.Categories()
	if err != nil {
		return ForecastResponse{}, err
	}

	rows := make([]ForecastRow, 0, len(categories))
	for _, c := range categories {
		pred := ai.Predict(artifact, c.ID, periodMonths, time.Now().UTC())
		total := 0.0
		for _, p := range pred {
			total += p
		}
		forecast := int(math.Round(total))
		reco := int(math.Max(0, float64(forecast)-float64(forecast)*0.2))
		conf := 1.0
		if artifact.RMSE > 0 {
			conf = math.Max(0.2, 1.0-artifact.RMSE/math.Max(1.0, float64(forecast)))
		}
		rows = append(rows, ForecastRow{
			CategoryID:     c.ID,
			Category:       c.Name,
			ForecastQty:    forecast,
			RecommendedBuy: reco,
			Factors:        "category + seasonality + price bucket trend",
			Confidence:     conf,
		})
	}

	return ForecastResponse{
		TrainedAt: artifact.TrainedAt,
		MAE:       artifact.MAE,
		RMSE:      artifact.RMSE,
		Period:    periodMonths,
		Rows:      rows,
	}, nil
}

func DefaultModelPath() string {
	return filepath.Join("data", "forecast_model.json")
}
