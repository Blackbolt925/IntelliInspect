# Stage 1: Build Angular app
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --configuration=production

# Stage 2: NGINX to serve it
FROM nginx:stable-alpine

# Replace default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build
COPY --from=builder /app/dist/frontend-angular/browser /usr/share/nginx/html
RUN mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
