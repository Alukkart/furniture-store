FROM golang:1.24-alpine

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go install github.com/swaggo/swag/cmd/swag@v1.16.6
RUN swag init -g main.go -o docs

RUN go build main.go

EXPOSE 1488

CMD ["./main"]
