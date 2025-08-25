# Use the official Node.js runtime as the base image
FROM node:18.19-alpine3.18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Dynatrace ENV vars for Live Debugger
ENV DT_LIVEDEBUGGER_REMOTE_ORIGIN=https://github.com/joshDynatrace/bug-busters
ENV DT_LIVEDEBUGGER_COMMIT=main

# Command to run the application
CMD ["npm", "start"] 
