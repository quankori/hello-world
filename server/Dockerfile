# Use the official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package.json and package-lock.json (if available)
COPY package*.json ./
# Install dependencies
RUN npm install

# Install Nest CLI globally (optional, if needed)
RUN npm install -g @nestjs/cli

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app in development mode
CMD ["npm", "run", "start:dev"]
