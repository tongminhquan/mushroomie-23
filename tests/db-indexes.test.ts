import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ROOT = path.resolve(__dirname, '..')
const SCHEMA = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8')
const MIGRATION = fs.readFileSync(
  path.join(ROOT, 'prisma/migrations/20260727040000_add_hot_path_indexes/migration.sql'),
  'utf8',
)

/** Các bảng migration 20260727040000 thêm index. */
const TABLES = ['posts', 'products', 'reviews', 'orders', 'email_logs'] as const

/** model Prisma -> tên bảng thật (@@map). */
const MODEL_TO_TABLE: Record<string, string> = {
  Post: 'posts',
  Product: 'products',
  Review: 'reviews',
  Order: 'orders',
  EmailLog: 'email_logs',
}

function modelBody(model: string): string {
  const match = SCHEMA.match(new RegExp(`^model ${model} \\{[\\s\\S]*?^\\}`, 'm'))
  assert.ok(match, `không tìm thấy model ${model}`)
  return match[0]
}

/** Prisma đặt tên index theo mẫu <table>_<col1>_<col2>_idx. */
function expectedIndexNames(model: string): string[] {
  const table = MODEL_TO_TABLE[model]
  return [...modelBody(model).matchAll(/@@index\(\[([^\]]+)\]\)/g)].map((match) => {
    const columns = match[1].split(',').map((column) => column.trim())
    return `${table}_${columns.join('_')}_idx`
  })
}

test('every index declared in the schema has a matching CREATE INDEX in the migration', () => {
  const missing: string[] = []

  for (const model of Object.keys(MODEL_TO_TABLE)) {
    for (const name of expectedIndexNames(model)) {
      if (!MIGRATION.includes(`\`${name}\``)) missing.push(`${model} -> ${name}`)
    }
  }

  assert.deepEqual(missing, [], 'schema khai index nhưng migration chưa tạo')
})

test('the migration does not create indexes the schema no longer declares', () => {
  const declared = new Set(Object.keys(MODEL_TO_TABLE).flatMap(expectedIndexNames))
  const created = [...MIGRATION.matchAll(/CREATE INDEX `([^`]+)`/g)].map((match) => match[1])

  const orphaned = created.filter((name) => !declared.has(name))
  assert.deepEqual(orphaned, [], 'migration tạo index không còn trong schema')
})

test('the migration only performs additive index work', () => {
  // Migration này chạy trên production database đang có dữ liệu thật. Bất kỳ lệnh nào
  // ngoài CREATE INDEX đều phải được xem xét thủ công, không lọt qua review.
  const statements = MIGRATION.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('--'))

  for (const statement of statements) {
    assert.ok(
      statement.startsWith('CREATE INDEX '),
      `lệnh không phải CREATE INDEX trong migration: ${statement}`,
    )
  }

  assert.ok(!/DROP|TRUNCATE|DELETE|ALTER TABLE|MODIFY/i.test(MIGRATION))
})

test('hot query paths are covered by an index', () => {
  // Mỗi entry: bảng + cột dẫn đầu mà truy vấn nóng lọc theo.
  const required: Array<[string, string]> = [
    ['posts', 'status'], // /tin-tuc, related posts
    ['products', 'status'], // /san-pham, gợi ý sản phẩm
    ['reviews', 'product_id'], // aggregateRating trên trang sản phẩm
    ['orders', 'order_status'], // cron /api/cron/review-requests
    ['email_logs', 'template_key'], // chống gửi email trùng
  ]

  for (const [table, leadingColumn] of required) {
    const pattern = new RegExp(`CREATE INDEX \`${table}_[^\`]+\` ON \`${table}\`\\(\`${leadingColumn}\``)
    assert.match(MIGRATION, pattern, `${table} thiếu index dẫn đầu bằng ${leadingColumn}`)
  }
})

test('index-bearing tables are all still mapped to the expected table names', () => {
  for (const [model, table] of Object.entries(MODEL_TO_TABLE)) {
    assert.ok(
      modelBody(model).includes(`@@map("${table}")`),
      `${model} không còn map tới bảng ${table} — migration sẽ trỏ sai bảng`,
    )
  }

  assert.deepEqual([...TABLES].sort(), Object.values(MODEL_TO_TABLE).sort())
})
