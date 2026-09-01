import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const REQUIRED_PRODUCTION_ENV_VARS = ['VITE_AUTH0_DOMAIN', 'VITE_AUTH0_CLIENT_ID', 'VITE_AUTH0_AUDIENCE'] as const

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // A production build with a missing Auth0 var doesn't fail — it silently ships
  // Auth0Provider domain="undefined", which sends login to https://undefined/authorize (the
  // exact incident this guards against). Fail the build instead, so a misconfigured Vercel
  // Production environment is caught here, not discovered by a user hitting a broken login.
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), '')
    const missing = REQUIRED_PRODUCTION_ENV_VARS.filter((key) => !env[key])
    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variable(s): ${missing.join(', ')}. ` +
          'Set these in Vercel -> Project Settings -> Environment Variables -> Production, then redeploy.',
      )
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
