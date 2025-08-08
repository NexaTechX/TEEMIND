#!/usr/bin/env node

console.log('🧪 Testing AI Setup for Tee Shine...\n');

// Check environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

console.log('📋 Environment Variables Status:');
let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Configured' : '❌ Missing';
  const displayValue = value ? `${value.substring(0, 20)}...` : 'Not set';
  console.log(`${varName}: ${status} (${displayValue})`);
  
  if (!value) {
    allConfigured = false;
  }
});

console.log('\n🔧 Setup Instructions:');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('1. Supabase credentials are missing');
  console.log('   - Run: node update-env.js');
  console.log('   - Get your service role key from: https://supabase.com/dashboard/project/esdlmfladvlwcghbnmkk/settings/api');
}

if (!process.env.OPENAI_API_KEY) {
  console.log('2. OpenAI API key is missing');
  console.log('   - Get your API key from: https://platform.openai.com/api-keys');
  console.log('   - Add it to your .env.local file');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('3. Supabase service role key is missing');
  console.log('   - Get it from: https://supabase.com/dashboard/project/esdlmfladvlwcghbnmkk/settings/api');
  console.log('   - Add it to your .env.local file');
}

if (allConfigured) {
  console.log('\n🎉 All environment variables are configured!');
  console.log('You can now:');
  console.log('- Start the development server: npm run dev');
  console.log('- Test the AI chat functionality');
  console.log('- Generate goal plans and frameworks');
} else {
  console.log('\n⚠️  Please configure the missing environment variables before starting the application.');
}

console.log('\n📚 Available Features:');
console.log('- AI-powered goal planning and frameworks');
console.log('- Business strategy generation');
console.log('- Chat with Tee Shine personality');
console.log('- Progress tracking and goal management');
