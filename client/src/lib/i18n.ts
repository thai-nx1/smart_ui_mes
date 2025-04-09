import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Các nguồn ngôn ngữ
const resources = {
  en: {
    translation: {
      // Thông tin ứng dụng
      app: {
        title: 'Dynamic Form Management System',
        shortTitle: 'Dynamic Form',
        description: 'Create dynamic forms with advanced features',
        login: 'Login',
        nav: {
          home: 'Home',
          forms: 'Forms',
          workflow: 'Workflow',
          settings: 'Settings'
        }
      },
      // Trang chủ
      home: {
        description: 'Create, manage, and submit customized forms quickly and easily.',
        viewForms: 'View Forms',
        viewWorkflow: 'Workflow System',
        fieldTypes: 'Field Types',
        features: {
          textTitle: 'Text & Paragraph',
          textDescription: 'Collect short text or long paragraphs from users.',
          choiceTitle: 'Choice',
          choiceDescription: 'Allow users to select one or more options from a list.',
          numberTitle: 'Number & Date',
          numberDescription: 'Collect numeric data and dates with precise formatting.'
        }
      },
      // Các chuỗi chung
      common: {
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        required: 'Required',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        // Màu sắc
        colors: {
          purple: 'Purple',
          blue: 'Blue',
          green: 'Green',
          orange: 'Orange', 
          red: 'Red',
          violet: 'Violet'
        }
      },
      // Cài đặt chủ đề
      theme: {
        toggleLight: 'Toggle light mode',
        toggleDark: 'Toggle dark mode',
        selectMode: 'Select mode',
        selectStyle: 'Select style',
        selectColor: 'Select color',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        professional: 'Professional',
        tint: 'Tint',
        vibrant: 'Vibrant',
        settings: 'Theme settings'
      },
      // Các chuỗi liên quan đến form
      form: {
        createNew: 'Create New Form',
        preview: 'Preview',
        submit: 'Submit',
        addField: 'Add Field',
        editField: 'Edit Field',
        deleteField: 'Delete Field',
        fieldName: 'Field Name',
        fieldType: 'Field Type',
        fieldDescription: 'Field Description',
        fieldRequired: 'Required Field',
        fieldOptions: 'Field Options',
        enterName: 'Enter name',
        enterDescription: 'Enter description',
        noFields: 'No fields available',
        formSubmitted: 'Form submitted successfully',
        confirmDelete: 'Are you sure you want to delete this field?',
        // Các loại trường
        fieldTypes: {
          text: 'Text',
          paragraph: 'Paragraph',
          number: 'Number',
          singleChoice: 'Single Choice',
          multiChoice: 'Multiple Choice',
          date: 'Date',
          input: 'Input',
          cache: 'Cache (Offline)',
          audioRecord: 'Audio Recording',
          screenRecord: 'Screen Recording',
          import: 'Import',
          export: 'Export',
          qrScan: 'QR/Barcode Scan',
          gps: 'GPS Location',
          choose: 'Choose',
          select: 'Select',
          search: 'Search',
          filter: 'Filter',
          dashboard: 'Dashboard',
          photo: 'Photo'
        }
      },
      // QR Scanner
      qrScanner: {
        scanQrCode: 'Scan QR/Barcode',
        scanSuccess: 'Scan successful',
        scanFailed: 'Scan failed',
        scanAgain: 'Scan another',
        startScan: 'Start scanning',
        scannedCode: 'Scanned code',
        type: 'Type',
        pressToScan: 'Press to scan QR/Barcode'
      },
      // GPS
      gps: {
        getLocation: 'Get current location',
        updateLocation: 'Update location',
        locationInfo: 'Location information',
        coordinates: 'Coordinates',
        time: 'Time',
        locationError: 'Could not get location',
        permissionDenied: 'Location permission denied',
        unavailable: 'Location information unavailable',
        timeout: 'Location request timed out',
        browserNotSupported: 'Your browser does not support geolocation',
        fetchingLocation: 'Getting location...'
      },
      // Audio
      audio: {
        record: 'Record',
        recording: 'Recording',
        startRecording: 'Start Recording',
        stopRecording: 'Stop Recording',
        recordAgain: 'Record Again',
        deleteRecording: 'Delete Recording',
        recordingFailed: 'Recording failed',
        noMicAccess: 'Cannot access microphone. Please allow permission and try again.'
      },
      // Cache
      cache: {
        savedLocally: 'Saved locally at',
        offlineSupport: 'Data will automatically be restored when the page is reloaded, even without an internet connection.',
        cachedField: 'This field is cached and works offline'
      },
      // Validation
      validation: {
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        invalidNumber: 'Please enter a valid number',
        invalidDate: 'Please enter a valid date'
      },
      // Multi-language
      language: {
        selectLanguage: 'Select language',
        english: 'English',
        vietnamese: 'Vietnamese'
      }
    }
  },
  vi: {
    translation: {
      // Thông tin ứng dụng
      app: {
        title: 'Hệ thống Quản lý Form Động',
        shortTitle: 'Form Động',
        description: 'Tạo biểu mẫu động với các tính năng nâng cao',
        login: 'Đăng nhập',
        nav: {
          home: 'Trang chủ',
          forms: 'Biểu mẫu',
          workflow: 'Quy trình',
          settings: 'Cài đặt'
        }
      },
      // Trang chủ
      home: {
        description: 'Tạo, quản lý và gửi các biểu mẫu tùy chỉnh một cách nhanh chóng và dễ dàng.',
        viewForms: 'Xem danh sách form',
        viewWorkflow: 'Hệ thống Workflow',
        fieldTypes: 'Các loại trường dữ liệu',
        features: {
          textTitle: 'Văn bản & Đoạn văn',
          textDescription: 'Thu thập văn bản ngắn hoặc các đoạn văn dài từ người dùng.',
          choiceTitle: 'Lựa chọn',
          choiceDescription: 'Cho phép người dùng chọn một hoặc nhiều tùy chọn từ danh sách.',
          numberTitle: 'Số & Ngày tháng',
          numberDescription: 'Thu thập dữ liệu số và ngày tháng với định dạng chính xác.'
        }
      },
      // Các chuỗi chung
      common: {
        save: 'Lưu',
        cancel: 'Hủy',
        confirm: 'Xác nhận',
        delete: 'Xóa',
        edit: 'Sửa',
        add: 'Thêm',
        search: 'Tìm kiếm',
        filter: 'Lọc',
        required: 'Bắt buộc',
        loading: 'Đang tải...',
        success: 'Thành công',
        error: 'Lỗi',
        // Màu sắc
        colors: {
          purple: 'Tím',
          blue: 'Xanh dương',
          green: 'Xanh lá',
          orange: 'Cam', 
          red: 'Đỏ',
          violet: 'Tím đậm'
        }
      },
      // Cài đặt chủ đề
      theme: {
        toggleLight: 'Chuyển sang chế độ sáng',
        toggleDark: 'Chuyển sang chế độ tối',
        selectMode: 'Chọn chế độ',
        selectStyle: 'Chọn phong cách',
        selectColor: 'Chọn màu sắc',
        light: 'Sáng',
        dark: 'Tối',
        system: 'Theo hệ thống',
        professional: 'Chuyên nghiệp',
        tint: 'Sắc thái',
        vibrant: 'Sống động',
        settings: 'Cài đặt giao diện'
      },
      // Các chuỗi liên quan đến form
      form: {
        createNew: 'Tạo biểu mẫu mới',
        preview: 'Xem trước',
        submit: 'Gửi',
        addField: 'Thêm trường',
        editField: 'Sửa trường',
        deleteField: 'Xóa trường',
        fieldName: 'Tên trường',
        fieldType: 'Loại trường',
        fieldDescription: 'Mô tả trường',
        fieldRequired: 'Trường bắt buộc',
        fieldOptions: 'Tùy chọn trường',
        enterName: 'Nhập tên',
        enterDescription: 'Nhập mô tả',
        noFields: 'Không có trường nào',
        formSubmitted: 'Biểu mẫu đã được gửi thành công',
        confirmDelete: 'Bạn có chắc chắn muốn xóa trường này không?',
        // Các loại trường
        fieldTypes: {
          text: 'Văn bản',
          paragraph: 'Đoạn văn',
          number: 'Số',
          singleChoice: 'Một lựa chọn',
          multiChoice: 'Nhiều lựa chọn',
          date: 'Ngày',
          input: 'Nhập liệu',
          cache: 'Bộ nhớ đệm (Ngoại tuyến)',
          audioRecord: 'Ghi âm',
          screenRecord: 'Ghi màn hình',
          import: 'Nhập',
          export: 'Xuất',
          qrScan: 'Quét QR/Barcode',
          gps: 'Vị trí GPS',
          choose: 'Chọn',
          select: 'Lựa chọn',
          search: 'Tìm kiếm',
          filter: 'Lọc',
          dashboard: 'Bảng điều khiển',
          photo: 'Ảnh'
        }
      },
      // QR Scanner
      qrScanner: {
        scanQrCode: 'Quét mã QR/Barcode',
        scanSuccess: 'Quét thành công',
        scanFailed: 'Quét thất bại',
        scanAgain: 'Quét mã khác',
        startScan: 'Bắt đầu quét',
        scannedCode: 'Mã đã quét',
        type: 'Loại',
        pressToScan: 'Nhấn để quét mã QR/Barcode'
      },
      // GPS
      gps: {
        getLocation: 'Nhấn để lấy vị trí hiện tại',
        updateLocation: 'Cập nhật vị trí',
        locationInfo: 'Thông tin vị trí',
        coordinates: 'Toạ độ',
        time: 'Thời gian',
        locationError: 'Không thể lấy vị trí của bạn',
        permissionDenied: 'Bạn đã từ chối quyền truy cập vị trí',
        unavailable: 'Thông tin vị trí không khả dụng',
        timeout: 'Quá thời gian yêu cầu vị trí',
        browserNotSupported: 'Trình duyệt của bạn không hỗ trợ định vị',
        fetchingLocation: 'Đang lấy vị trí...'
      },
      // Audio
      audio: {
        record: 'Ghi âm',
        recording: 'Đang ghi âm',
        startRecording: 'Bắt đầu ghi âm',
        stopRecording: 'Dừng ghi âm',
        recordAgain: 'Ghi âm lại',
        deleteRecording: 'Xóa bản ghi âm',
        recordingFailed: 'Ghi âm thất bại',
        noMicAccess: 'Không thể truy cập microphone. Vui lòng cho phép quyền và thử lại.'
      },
      // Cache
      cache: {
        savedLocally: 'Đã lưu cục bộ lúc',
        offlineSupport: 'Dữ liệu sẽ tự động được khôi phục khi trang được tải lại, ngay cả khi không có kết nối mạng.',
        cachedField: 'Trường này được lưu cache và hoạt động khi offline'
      },
      // Validation
      validation: {
        required: 'Trường này là bắt buộc',
        invalidEmail: 'Địa chỉ email không hợp lệ',
        invalidNumber: 'Vui lòng nhập số hợp lệ',
        invalidDate: 'Vui lòng nhập ngày hợp lệ'
      },
      // Multi-language
      language: {
        selectLanguage: 'Chọn ngôn ngữ',
        english: 'Tiếng Anh',
        vietnamese: 'Tiếng Việt'
      }
    }
  }
};

i18n
  .use(LanguageDetector) // Tự động phát hiện ngôn ngữ từ trình duyệt
  .use(initReactI18next) // Tích hợp với React
  .init({
    resources,
    fallbackLng: 'vi', // Ngôn ngữ mặc định khi không tìm thấy bản dịch
    interpolation: {
      escapeValue: false, // React đã tự xử lý việc thoát chuỗi
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

// Thêm phương thức để dễ dàng chuyển đổi giữa các ngôn ngữ
export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng);
};

// Lấy ngôn ngữ hiện tại
export const getCurrentLanguage = () => {
  return i18n.language || 'vi'; // Mặc định là tiếng Việt nếu không xác định được
};

export default i18n;