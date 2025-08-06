#!/bin/bash

echo "📋 Copying database schema to clipboard..."
echo ""

# Check if pbcopy is available (macOS)
if command -v pbcopy &> /dev/null; then
    cat supabase-schema.sql | pbcopy
    echo "✅ Schema copied to clipboard!"
    echo ""
    echo "🎯 Now follow these steps:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Click 'New query' or the + button"
    echo "4. Paste the schema (Cmd+V)"
    echo "5. Click 'Run' button"
    echo ""
    echo "🔍 If you can't find SQL Editor:"
    echo "- Look for 'Database' in the sidebar"
    echo "- Or try 'Table Editor' → 'SQL' tab"
    echo "- Or check the top navigation menu"
    echo ""
    echo "📞 Need help? Tell me what you see in your dashboard!"
elif command -v xclip &> /dev/null; then
    cat supabase-schema.sql | xclip -selection clipboard
    echo "✅ Schema copied to clipboard!"
    echo ""
    echo "🎯 Now follow these steps:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Click 'New query' or the + button"
    echo "4. Paste the schema (Ctrl+V)"
    echo "5. Click 'Run' button"
else
    echo "⚠️  Couldn't copy to clipboard automatically."
    echo ""
    echo "📋 Please copy the schema manually:"
    echo "1. Open 'supabase-schema.sql' file"
    echo "2. Select all content (Ctrl+A or Cmd+A)"
    echo "3. Copy (Ctrl+C or Cmd+C)"
    echo "4. Paste into Supabase SQL Editor"
    echo ""
    echo "🎯 Then follow these steps:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Find 'SQL Editor' in the sidebar"
    echo "3. Create new query"
    echo "4. Paste and run the schema"
fi

echo ""
echo "🔍 Common Supabase Dashboard Locations:"
echo "- Left sidebar: 'SQL Editor'"
echo "- Top menu: 'Database' → 'SQL Editor'"
echo "- Dashboard: 'SQL Editor' card"
echo "- Table Editor: 'SQL' tab" 