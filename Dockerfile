# Dockerfile

# Stage 1: Build the Go server
FROM golang:1.20 AS go-builder
WORKDIR /app/api
COPY api/ ./api/
RUN go mod tidy && go build -o server

# Stage 2: Build the Next.js app
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 3: Final stage to run both
FROM node:18
WORKDIR /app
COPY --from=go-builder /app/api/server ./api/server
COPY --from=builder /app ./
COPY --from=builder /app/.next ./.next

EXPOSE 3000
EXPOSE 8080

CMD ["sh", "-c", "./api/server & npm run start"]
