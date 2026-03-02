# Use officiail Node.js image
FROM node:22

# Set working directory inside container
WORKDIR /app

# Copy package files into container
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy application code 
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "start"]