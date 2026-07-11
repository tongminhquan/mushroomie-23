import 'dotenv/config'

const required = ['DATABASE_URL']
const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error(`Build configuration missing: ${missing.join(', ')}`)
  process.exit(1)
}
