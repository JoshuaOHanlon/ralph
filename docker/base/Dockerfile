# Ralphberry Base Image
# Contains Claude CLI and common dependencies for running jobs

FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    jq \
    curl \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create workspace directory
RUN mkdir -p /workspace

# Copy the ralphberry runner script
COPY scripts/ralphberry-runner.sh /usr/local/bin/ralphberry-runner
RUN chmod +x /usr/local/bin/ralphberry-runner

# Set working directory
WORKDIR /workspace

# Default command
CMD ["ralphberry-runner"]
