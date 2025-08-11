#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 用于验证生产环境部署所需的环境变量是否正确配置
 */

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

const recommendedEnvVars = [
  'VITE_USE_REAL_API',
  'VITE_API_TIMEOUT',
  'VITE_APP_NAME',
  'VITE_APP_VERSION'
]

const optionalEnvVars = [
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_ERROR_TRACKING',
  'VITE_ENABLE_REAL_TIME',
  'VITE_API_RETRY_ATTEMPTS',
  'VITE_API_RETRY_DELAY'
]

function checkEnvVar(varName, isRequired = false) {
  const value = process.env[varName]
  const status = value ? '✅' : isRequired ? '❌' : '⚠️'
  const statusText = value ? 'SET' : isRequired ? 'MISSING' : 'NOT SET'

  console.log(`${status} ${varName}: ${statusText}`)

  if (value && varName.includes('SUPABASE_URL')) {
    if (value.includes('localhost') || value.includes('your-project')) {
      console.log(`  ⚠️  Warning: ${varName} appears to be a placeholder value`)
    }
  }

  if (value && varName.includes('SUPABASE_ANON_KEY')) {
    if (value.includes('your_') || value.length < 20) {
      console.log(`  ⚠️  Warning: ${varName} appears to be a placeholder value`)
    }
  }

  return !!value
}

function verifyEnvironment() {
  console.log('\n🔍 YesSales Admin - Environment Variables Verification\n')

  let allRequiredSet = true
  let recommendedSet = 0
  let optionalSet = 0

  console.log('📋 Required Variables:')
  requiredEnvVars.forEach(varName => {
    const isSet = checkEnvVar(varName, true)
    if (!isSet) allRequiredSet = false
  })

  console.log('\n📋 Recommended Variables:')
  recommendedEnvVars.forEach(varName => {
    if (checkEnvVar(varName)) recommendedSet++
  })

  console.log('\n📋 Optional Variables:')
  optionalEnvVars.forEach(varName => {
    if (checkEnvVar(varName)) optionalSet++
  })

  console.log('\n' + '='.repeat(50))

  if (allRequiredSet) {
    console.log('✅ All required environment variables are set!')
  } else {
    console.log('❌ Some required environment variables are missing!')
    console.log('   Please configure them before deploying to production.')
  }

  console.log('📊 Summary:')
  console.log(
    `   • Required: ${requiredEnvVars.filter((_, i) => checkEnvVar(requiredEnvVars[i])).length}/${requiredEnvVars.length}`
  )
  console.log(`   • Recommended: ${recommendedSet}/${recommendedEnvVars.length}`)
  console.log(`   • Optional: ${optionalSet}/${optionalEnvVars.length}`)

  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('\n🔗 Supabase Configuration:')
    console.log(`   URL: ${process.env.VITE_SUPABASE_URL}`)
    console.log(`   Key: ${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`)
  }

  if (process.env.NODE_ENV === 'production' && !allRequiredSet) {
    console.log('\n⚠️  Production deployment may fail without required variables!')
    process.exit(1)
  }

  console.log('\n💡 For Vercel deployment guide, see: VERCEL_SETUP.md')
  console.log('')
}

// 运行验证
verifyEnvironment()
