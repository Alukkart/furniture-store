package ai

import (
	"encoding/json"
	"math"
	"os"
	"path/filepath"
	"sort"
	"time"
)

type Sample struct {
	CategoryID uint
	Date       time.Time
	SoldQty    float64
}

type CategoryModel struct {
	CategoryID uint    `json:"category_id"`
	Intercept  float64 `json:"intercept"`
	Trend      float64 `json:"trend"`
	SeasonAmp  float64 `json:"season_amp"`
}

type ModelArtifact struct {
	TrainedAt time.Time       `json:"trained_at"`
	MAE       float64         `json:"mae"`
	RMSE      float64         `json:"rmse"`
	Models    []CategoryModel `json:"models"`
}

func Train(samples []Sample) ModelArtifact {
	byCategory := map[uint][]Sample{}
	for _, s := range samples {
		byCategory[s.CategoryID] = append(byCategory[s.CategoryID], s)
	}

	artifact := ModelArtifact{TrainedAt: time.Now().UTC(), Models: []CategoryModel{}}
	allAbs := []float64{}
	allSq := []float64{}

	for categoryID, rows := range byCategory {
		sort.Slice(rows, func(i, j int) bool { return rows[i].Date.Before(rows[j].Date) })
		if len(rows) < 4 {
			continue
		}

		trainCut := int(math.Max(2, float64(len(rows))*0.8))
		if trainCut >= len(rows) {
			trainCut = len(rows) - 1
		}
		train := rows[:trainCut]
		test := rows[trainCut:]

		model := fitCategoryModel(categoryID, train)
		artifact.Models = append(artifact.Models, model)

		for i, r := range test {
			pred := predictRow(model, float64(trainCut+i), int(r.Date.Month()))
			err := r.SoldQty - pred
			allAbs = append(allAbs, math.Abs(err))
			allSq = append(allSq, err*err)
		}
	}

	artifact.MAE = avg(allAbs)
	artifact.RMSE = math.Sqrt(avg(allSq))
	return artifact
}

func Predict(artifact ModelArtifact, categoryID uint, periods int, start time.Time) []float64 {
	model, ok := findModel(artifact.Models, categoryID)
	if !ok {
		return []float64{}
	}

	result := make([]float64, 0, periods)
	for i := 0; i < periods; i++ {
		dt := start.AddDate(0, i, 0)
		value := predictRow(model, float64(i), int(dt.Month()))
		if value < 0 {
			value = 0
		}
		result = append(result, value)
	}
	return result
}

func Save(path string, artifact ModelArtifact) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(artifact, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, raw, 0o644)
}

func Load(path string) (ModelArtifact, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return ModelArtifact{}, err
	}
	var artifact ModelArtifact
	if err := json.Unmarshal(raw, &artifact); err != nil {
		return ModelArtifact{}, err
	}
	return artifact, nil
}

func fitCategoryModel(categoryID uint, rows []Sample) CategoryModel {
	if len(rows) == 0 {
		return CategoryModel{CategoryID: categoryID}
	}

	x := make([]float64, len(rows))
	y := make([]float64, len(rows))
	for i, row := range rows {
		x[i] = float64(i)
		y[i] = row.SoldQty
	}
	trend, intercept := linearRegression(x, y)

	monthAvg := make(map[int][]float64)
	for _, row := range rows {
		m := int(row.Date.Month())
		monthAvg[m] = append(monthAvg[m], row.SoldQty)
	}
	overall := avg(y)
	winter := avg(monthAvg[12])
	summer := avg(monthAvg[7])
	seasonAmp := 0.0
	if overall > 0 {
		seasonAmp = (winter - summer) / overall
	}

	return CategoryModel{CategoryID: categoryID, Intercept: intercept, Trend: trend, SeasonAmp: seasonAmp}
}

func predictRow(model CategoryModel, idx float64, month int) float64 {
	base := model.Intercept + model.Trend*idx
	season := 1.0
	if month == 11 || month == 12 {
		season += model.SeasonAmp
	}
	if month == 6 || month == 7 {
		season -= model.SeasonAmp / 2
	}
	return base * season
}

func linearRegression(x, y []float64) (slope, intercept float64) {
	if len(x) == 0 || len(x) != len(y) {
		return 0, 0
	}
	mx := avg(x)
	my := avg(y)
	var num, den float64
	for i := range x {
		num += (x[i] - mx) * (y[i] - my)
		den += (x[i] - mx) * (x[i] - mx)
	}
	if den == 0 {
		return 0, my
	}
	slope = num / den
	intercept = my - slope*mx
	return slope, intercept
}

func avg(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	s := 0.0
	for _, v := range values {
		s += v
	}
	return s / float64(len(values))
}

func findModel(models []CategoryModel, categoryID uint) (CategoryModel, bool) {
	for _, m := range models {
		if m.CategoryID == categoryID {
			return m, true
		}
	}
	return CategoryModel{}, false
}
