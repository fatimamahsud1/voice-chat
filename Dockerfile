# Stage 1: Build the Next.js app
FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Build the Go server
FROM golang:1.20 AS go-builder

WORKDIR /app

# Copy Go files and build the server
COPY api/ ./api/
WORKDIR /app/api
RUN go build -o server

# Stage 3: Final stage to run both
FROM node:18

WORKDIR /app

# Copy Next.js output from stage 1
COPY --from=builder /app ./
COPY --from=builder /app/.next ./.next

# Copy Go server from stage 2
COPY --from=go-builder /app/api/server ./api/server

EXPOSE 3000
EXPOSE 8080

CMD ["sh", "-c", "./api/server & npm run start"]
