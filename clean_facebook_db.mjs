import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Bắt đầu kiểm tra tài khoản Facebook trong Database...')

  // Vì DB không lưu trường `provider` nên chúng ta chỉ có thể tìm dựa vào `password_hash = ''`
  const socialUsers = await prisma.user.findMany({
    where: {
      password_hash: ''
    }
  })

  console.log('Tổng số user đăng nhập qua Social (Google/Facebook):', socialUsers.length)
  console.log(socialUsers)

  // Tìm những user có tên chứa "Facebook" (nếu có fallback)
  const fbFallbackUsers = socialUsers.filter(u => u.name && u.name.includes('Facebook'))
  if (fbFallbackUsers.length > 0) {
    console.log('Sẽ xóa các user fallback của Facebook:', fbFallbackUsers)
    await prisma.user.deleteMany({
      where: {
        id: { in: fbFallbackUsers.map(u => u.id) }
      }
    })
    console.log('Đã xóa', fbFallbackUsers.length, 'user')
  } else {
    console.log('Không tìm thấy user nào có tên chứa "Facebook".')
  }

  console.log('Lưu ý: Nếu user đăng nhập bằng Facebook và lấy tên thật, sẽ không thể phân biệt với Google vì model User không có cột provider.')
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy dọn dẹp:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
