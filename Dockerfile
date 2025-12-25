# Use official Node.js image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all your code files
COPY . .

# Set permission for the user (Hugging Face security requirement)
RUN chown -R 1000:1000 /app
USER 1000

# ⚠️ CRITICAL: Set the PORT to 7860 for Hugging Face
ENV PORT=7860
EXPOSE 7860

# Start the server
CMD ["node", "server.js"]
