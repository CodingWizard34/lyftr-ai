# Multi-stage Dockerfile for React/Vite Frontend

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Small Runtime Nginx Image
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Configure Nginx to listen on port 3000 with SPA fallback
RUN sed -i 's/listen       80;/listen       3000;/' /etc/nginx/conf.d/default.conf && \
    sed -i '/location \/ {/a \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
