#!/bin/bash

#############################################################################
# Frontend-Backend Connection Fix Script for EC2
#
# This script automatically fixes the connection issue between frontend
# and backend when deployed on EC2.
#
# Usage: ./fix-frontend-backend-connection.sh
#
# Prerequisites:
# - Run this script from /var/www/newborn-nest directory
# - Ensure you have necessary permissions
# - Backend should be set up with PM2
# - Nginx should be configured
#############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}=================================================="
    echo -e "$1"
    echo -e "==================================================${NC}"
    echo ""
}

# Check if running from correct directory
check_directory() {
    print_header "Step 1: Checking Directory"

    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
        print_error "This script must be run from the project root directory (e.g., /var/www/newborn-nest)"
        print_info "Current directory: $(pwd)"
        exit 1
    fi

    print_success "Running from correct directory: $(pwd)"
}

# Detect EC2 public IP
detect_ec2_ip() {
    print_header "Step 2: Detecting EC2 Public IP"

    # Try to get EC2 public IP from metadata service
    EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")

    if [[ -z "$EC2_PUBLIC_IP" ]]; then
        print_warning "Could not auto-detect EC2 public IP"
        print_info "You can manually set it by editing backend/.env after this script runs"
        EC2_PUBLIC_IP="YOUR_EC2_IP"
    else
        print_success "Detected EC2 Public IP: $EC2_PUBLIC_IP"
    fi
}

# Create frontend .env.production
create_frontend_env() {
    print_header "Step 3: Creating Frontend .env.production"

    if [[ -f ".env.production" ]]; then
        print_warning ".env.production already exists"
        print_info "Backing up to .env.production.backup"
        cp .env.production .env.production.backup
    fi

    cat > .env.production << EOF
# Frontend Production Environment Configuration
# This file is used during the build process to configure API endpoints

# Use relative URL so requests go through nginx proxy
VITE_API_URL=/api

# Alternative: Use full EC2 URL (not recommended)
# VITE_API_URL=http://${EC2_PUBLIC_IP}/api
EOF

    print_success "Created .env.production"
    print_info "Content:"
    cat .env.production | grep -v "^#" | grep -v "^$"
}

# Configure backend .env
configure_backend_env() {
    print_header "Step 4: Configuring Backend .env"

    cd backend

    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.production" ]]; then
            print_info "Creating .env from .env.production template"
            cp .env.production .env
        else
            print_error "No .env or .env.production found in backend/"
            print_info "Creating default .env file"
            cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://${EC2_PUBLIC_IP}

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./data

# API Configuration
API_PREFIX=/api
EOF
        fi
    fi

    # Update CORS_ORIGIN if we detected the IP
    if [[ "$EC2_PUBLIC_IP" != "YOUR_EC2_IP" ]]; then
        print_info "Updating CORS_ORIGIN to http://${EC2_PUBLIC_IP}"

        # Update or add CORS_ORIGIN
        if grep -q "^CORS_ORIGIN=" .env; then
            sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://${EC2_PUBLIC_IP}|" .env
        else
            echo "CORS_ORIGIN=http://${EC2_PUBLIC_IP}" >> .env
        fi
    fi

    print_success "Backend .env configured"
    print_info "CORS setting:"
    grep "CORS_ORIGIN" .env

    cd ..
}

# Create data directory
ensure_data_directory() {
    print_header "Step 5: Ensuring Data Directory Exists"

    if [[ ! -d "backend/data" ]]; then
        mkdir -p backend/data
        chmod 755 backend/data
        print_success "Created backend/data directory"
    else
        print_success "Data directory already exists"
    fi

    print_info "Directory permissions:"
    ls -ld backend/data
}

# Install dependencies
install_dependencies() {
    print_header "Step 6: Installing Dependencies"

    print_info "Installing frontend dependencies..."
    npm install --quiet
    print_success "Frontend dependencies installed"

    print_info "Installing backend dependencies..."
    cd backend
    npm install --quiet
    cd ..
    print_success "Backend dependencies installed"
}

# Build frontend
build_frontend() {
    print_header "Step 7: Building Frontend"

    print_info "Building frontend with production configuration..."
    print_info "This may take a few minutes..."

    # Clean previous build
    if [[ -d "dist" ]]; then
        rm -rf dist/
        print_info "Removed old build"
    fi

    # Build with production environment
    NODE_ENV=production npm run build

    print_success "Frontend built successfully"
    print_info "Build output directory: dist/"
}

# Verify build
verify_build() {
    print_header "Step 8: Verifying Build"

    print_info "Checking for localhost references in build..."

    if grep -r "localhost:5000" dist/ > /dev/null 2>&1; then
        print_error "Found localhost:5000 references in build!"
        print_warning "The frontend may not connect to backend correctly"
        print_info "This usually means .env.production was not loaded during build"

        # Show where references were found
        print_info "Found in these files:"
        grep -r "localhost:5000" dist/ | cut -d: -f1 | sort -u

        return 1
    else
        print_success "Build verification passed - no localhost references found"
    fi
}

# Restart services
restart_services() {
    print_header "Step 9: Restarting Services"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found - skipping backend restart"
        print_info "You'll need to restart the backend manually"
    else
        print_info "Restarting backend with PM2..."

        # Check if process exists
        if pm2 list | grep -q "newborn-nest-api"; then
            pm2 restart newborn-nest-api
            print_success "Backend restarted"
        else
            print_warning "newborn-nest-api not found in PM2"
            print_info "Starting backend..."
            cd backend
            pm2 start server.js --name newborn-nest-api
            pm2 save
            cd ..
            print_success "Backend started"
        fi
    fi

    # Reload nginx
    if command -v nginx &> /dev/null; then
        print_info "Reloading nginx..."
        sudo systemctl reload nginx
        print_success "Nginx reloaded"
    else
        print_warning "Nginx not found - skipping nginx reload"
    fi
}

# Test backend health
test_backend() {
    print_header "Step 10: Testing Backend"

    print_info "Testing backend health endpoint..."

    # Wait a moment for backend to start
    sleep 2

    RESPONSE=$(curl -s http://localhost:5000/api/health || echo "ERROR")

    if [[ "$RESPONSE" == "ERROR" ]]; then
        print_error "Backend is not responding"
        print_info "Check backend logs with: pm2 logs newborn-nest-api"
        return 1
    else
        print_success "Backend is responding"
        print_info "Response: $RESPONSE"
    fi
}

# Print final status
print_final_status() {
    print_header "Deployment Summary"

    echo -e "${GREEN}✓ Configuration Complete!${NC}"
    echo ""
    echo "Frontend Configuration:"
    echo "  • .env.production created with VITE_API_URL=/api"
    echo "  • Build completed and verified"
    echo ""
    echo "Backend Configuration:"
    echo "  • .env configured with CORS_ORIGIN=http://${EC2_PUBLIC_IP}"
    echo "  • Backend restarted with PM2"
    echo ""
    echo "Services Status:"
    if command -v pm2 &> /dev/null; then
        pm2 list | grep newborn-nest || echo "  • Backend: Not running with PM2"
    fi
    if command -v nginx &> /dev/null; then
        sudo systemctl status nginx --no-pager -l | grep "Active:" || echo "  • Nginx: Unknown status"
    fi
    echo ""

    print_header "Testing Instructions"

    echo "1. Open your browser to: http://${EC2_PUBLIC_IP}"
    echo ""
    echo "2. Press F12 to open Developer Console"
    echo ""
    echo "3. Check for errors:"
    echo "   • Console tab - Should see NO CORS errors"
    echo "   • Network tab - Requests should go to /api/patients (not localhost)"
    echo ""
    echo "4. Test features:"
    echo "   • Create new patient"
    echo "   • Upload images"
    echo "   • View patient list"
    echo ""

    print_header "Troubleshooting Commands"

    echo "View backend logs:"
    echo "  pm2 logs newborn-nest-api"
    echo ""
    echo "View nginx logs:"
    echo "  sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "Check backend config:"
    echo "  cat backend/.env | grep CORS"
    echo ""
    echo "Verify build:"
    echo "  grep -r 'localhost:5000' dist/ || echo 'Build is clean'"
    echo ""
    echo "Test backend directly:"
    echo "  curl http://localhost:5000/api/health"
    echo "  curl http://${EC2_PUBLIC_IP}/api/health"
    echo ""

    print_header "Next Steps"

    if [[ "$EC2_PUBLIC_IP" == "YOUR_EC2_IP" ]]; then
        print_warning "Manual action required:"
        echo "  1. Edit backend/.env and set CORS_ORIGIN to your actual EC2 IP"
        echo "  2. Run: pm2 restart newborn-nest-api"
    fi

    echo ""
    print_success "Deployment script completed successfully!"
    echo ""
}

# Main execution
main() {
    clear

    print_header "Frontend-Backend Connection Fix"
    echo "This script will configure your EC2 deployment to fix"
    echo "the connection between frontend and backend."
    echo ""
    echo "Press Ctrl+C to cancel, or Enter to continue..."
    read

    # Run all steps
    check_directory
    detect_ec2_ip
    create_frontend_env
    configure_backend_env
    ensure_data_directory
    install_dependencies
    build_frontend
    verify_build
    restart_services
    test_backend
    print_final_status
}

# Run main function
main
