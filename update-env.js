#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Updating environment variables with Supabase credentials...\n');

// Supabase project details
const supabaseUrl = 'https://esdlmfladvlwcghbnmkk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGxtZmxhZHZsd2NnaGJubWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTQxMzksImV4cCI6MjA2NDEzMDEzOX0.QNHbu3z3kqpy8cBb-Dmx3BEmZbFy2HokyrS8t7BKTjo';

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📝 Found existing .env.local file');
} else {
  console.log('📝 Creating new .env.local file');
}

// Update or add Supabase variables
let updatedContent = envContent;

// Update NEXT_PUBLIC_SUPABASE_URL
if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
  updatedContent = updatedContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`
  );
} else {
  updatedContent += `\nNEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`;
}

// Update NEXT_PUBLIC_SUPABASE_ANON_KEY
if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
  updatedContent = updatedContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`
  );
} else {
  updatedContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`;
}

// Add placeholder for service role key if not exists
if (!envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
  updatedContent += `\nSUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here`;
}

// Add other required variables if not exists
if (!envContent.includes('OPENAI_API_KEY=')) {
  updatedContent += `\nOPENAI_API_KEY=your_openai_api_key_here`;
}

if (!envContent.includes('NEXTAUTH_SECRET=')) {
  updatedContent += `\nNEXTAUTH_SECRET=your_nextauth_secret_here`;
}

if (!envContent.includes('NEXTAUTH_URL=')) {
  updatedContent += `\nNEXTAUTH_URL=http://localhost:3000`;
}

try {
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ Updated .env.local file with Supabase credentials');
  console.log('\n📋 Current configuration:');
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey.substring(0, 20)}...`);
  console.log('\n⚠️  You still need to:');
  console.log('1. Get your SUPABASE_SERVICE_ROLE_KEY from: https://supabase.com/dashboard/project/esdlmfladvlwcghbnmkk/settings/api');
  console.log('2. Add your OPENAI_API_KEY from: https://platform.openai.com/api-keys');
  console.log('3. Generate a random string for NEXTAUTH_SECRET');
  console.log('\n🔄 After updating the remaining variables, restart your development server');
} catch (error) {
  console.error('❌ Error updating .env.local file:', error.message);
}
