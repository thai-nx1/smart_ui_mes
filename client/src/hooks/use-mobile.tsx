import * as React from "react"

// Giới hạn kích thước màn hình di động, được cài đặt là 768px
const MOBILE_BREAKPOINT = 640 // Giảm xuống để đảm bảo dạng bảng hiển thị ở màn hình lớn hơn

// Tạo interface cho kết quả trả về
export interface MobileInfo {
  isMobile: boolean;
  screenWidth: number;
}

// Hook kiểm tra xem thiết bị hiện tại có phải là di động không
export function useIsMobile(): MobileInfo {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [screenWidth, setScreenWidth] = React.useState<number>(window.innerWidth)

  React.useEffect(() => {
    // Sử dụng MediaQueryList API để theo dõi thay đổi kích thước màn hình
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Hàm xử lý khi kích thước màn hình thay đổi
    const onChange = () => {
      const width = window.innerWidth
      setScreenWidth(width)
      setIsMobile(width < MOBILE_BREAKPOINT)
      console.log('Current screen size:', width < MOBILE_BREAKPOINT ? 'mobile' : 'desktop', 'width:', width)
    }
    
    // Đăng ký sự kiện thay đổi
    mql.addEventListener("change", onChange)
    
    // Khởi tạo giá trị ban đầu
    onChange()
    
    // Dọn dẹp khi component unmount
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Trả về đối tượng với thông tin chi tiết
  return { isMobile, screenWidth }
}

// Hook trả về loại màn hình chi tiết hơn
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    // Kiểm tra kích thước ban đầu
    checkScreenSize()

    // Thêm trình nghe sự kiện thay đổi kích thước
    window.addEventListener('resize', checkScreenSize)

    // Dọn dẹp
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return screenSize
}
