#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up environment variables for Tee Shine...\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Please check if your environment variables are properly configured.');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- OPENAI_API_KEY');
  console.log('- NEXTAUTH_SECRET');
  console.log('- NEXTAUTH_URL');
  return;
}

// Create .env.local template
const envTemplate = `# Supabase Configuration
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
# Get this from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth Configuration
# Generate a random string for NEXTAUTH_SECRET
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file with template values');
  console.log('\n📝 Please update the following in your .env.local file:');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL');
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key');
  console.log('3. SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key');
  console.log('4. OPENAI_API_KEY - Your OpenAI API key');
  console.log('5. NEXTAUTH_SECRET - A random string for NextAuth');
  console.log('\n🔗 Get Supabase credentials from: https://supabase.com/dashboard');
  console.log('🔗 Get OpenAI API key from: https://platform.openai.com/api-keys');
  console.log('\n⚠️  After updating .env.local, restart your development server');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
}
