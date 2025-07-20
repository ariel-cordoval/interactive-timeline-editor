#!/bin/bash

# Interactive Timeline Implementation - Backup Script

echo "🔄 Creating backup of Interactive Timeline Implementation..."

# Get current directory name and parent directory
PROJECT_DIR=$(basename "$(pwd)")
PARENT_DIR=$(dirname "$(pwd)")
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="${PROJECT_DIR// /_}_BACKUP_$DATE"

# Go to parent directory to create backup
cd "$PARENT_DIR"

# Create directory backup
echo "📁 Creating directory backup..."
cp -R "$PROJECT_DIR" "$BACKUP_NAME"

# Create compressed backup  
echo "📦 Creating compressed backup..."
tar -czf "$BACKUP_NAME.tar.gz" "$PROJECT_DIR"

# Show results
echo "✅ Backup completed!"
echo "📁 Directory backup: $BACKUP_NAME"
echo "📦 Compressed backup: $BACKUP_NAME.tar.gz"
ls -lh "$BACKUP_NAME.tar.gz"

echo ""
echo "🎯 To restore from backup:"
echo "   tar -xzf '$BACKUP_NAME.tar.gz'"
echo "   or copy from directory: $BACKUP_NAME"
