FROM node:18-alpine AS builder

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM heroiclabs/nakama:3.21.1

# Copy the compiled JS plugin from the builder stage
COPY --from=builder /backend/build/*.js /nakama/data/modules/
COPY local.yml /nakama/data/local.yml
COPY entrypoint.sh /nakama/entrypoint.sh

# Ensure the entrypoint is executable
RUN chmod +x /nakama/entrypoint.sh

# Entrypoint handles migrations and server startup
ENTRYPOINT ["/bin/sh", "/nakama/entrypoint.sh"]
