// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import jsQR from 'jsqr';
// @ts-ignore
import html2pdf from 'html2pdf.js';

/**
 * Xử lý các trường dữ liệu đặc biệt như SCREEN_RECORD, PHOTO, IMPORT, EXPORT, v.v.
 */

export interface SpecialFieldResult {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Chụp ảnh từ camera của thiết bị
 */
export async function capturePhoto(): Promise<SpecialFieldResult> {
  try {
    // Kiểm tra nếu trình duyệt hỗ trợ mediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        message: 'Trình duyệt không hỗ trợ truy cập camera.',
      };
    }

    // Tạo stream từ camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Tạo video element để hiển thị stream
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    
    // Đợi video đã sẵn sàng
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
    
    // Tạo canvas để chụp ảnh từ video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Vẽ frame từ video lên canvas
    const context = canvas.getContext('2d');
    if (!context) {
      return {
        success: false,
        message: 'Không thể tạo context cho canvas.',
      };
    }
    
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Dừng stream camera sau khi đã chụp
    stream.getTracks().forEach(track => track.stop());
    
    // Chuyển đổi canvas thành data URL (base64)
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    return {
      success: true,
      data: dataUrl,
    };
  } catch (error) {
    console.error('Lỗi khi chụp ảnh:', error);
    return {
      success: false,
      message: `Lỗi khi chụp ảnh: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Quét QR code từ camera của thiết bị
 */
export async function scanQRCode(): Promise<SpecialFieldResult> {
  try {
    // Kiểm tra nếu trình duyệt hỗ trợ mediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        message: 'Trình duyệt không hỗ trợ truy cập camera.',
      };
    }

    // Tạo stream từ camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Tạo video element để hiển thị stream
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    
    // Đợi video đã sẵn sàng
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
    
    // Thiết lập quét QR code từ video stream
    return new Promise<SpecialFieldResult>((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        resolve({
          success: false,
          message: 'Không thể tạo context cho canvas.',
        });
        return;
      }
      
      // Hàm quét QR trong frame
      const scanFrame = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Phân tích QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code) {
            // Dừng stream và trả về kết quả
            stream.getTracks().forEach(track => track.stop());
            resolve({
              success: true,
              data: code.data,
            });
          } else {
            // Tiếp tục quét nếu chưa tìm thấy QR code
            requestAnimationFrame(scanFrame);
          }
        } else {
          requestAnimationFrame(scanFrame);
        }
      };
      
      // Bắt đầu quét
      scanFrame();
      
      // Đặt timeout để dừng quét sau 30 giây
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        resolve({
          success: false,
          message: 'Quá thời gian quét QR, vui lòng thử lại.',
        });
      }, 30000);
    });
  } catch (error) {
    console.error('Lỗi khi quét QR code:', error);
    return {
      success: false,
      message: `Lỗi khi quét QR code: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Ghi màn hình
 */
export async function recordScreen(): Promise<SpecialFieldResult> {
  try {
    // Kiểm tra nếu trình duyệt hỗ trợ getDisplayMedia API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return {
        success: false,
        message: 'Trình duyệt không hỗ trợ ghi màn hình.',
      };
    }

    // Tạo stream từ màn hình
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    
    // Tạo MediaRecorder để ghi stream
    const mediaRecorder = new MediaRecorder(stream);
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    // Xử lý khi ghi hoàn tất
    const recordingPromise = new Promise<SpecialFieldResult>((resolve) => {
      mediaRecorder.onstop = () => {
        // Kết hợp các chunks thành một blob
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Chuyển đổi blob thành data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve({
            success: true,
            data: base64data,
          });
        };
        
        reader.readAsDataURL(blob);
      };
    });
    
    // Bắt đầu ghi
    mediaRecorder.start();
    
    // Dừng ghi khi người dùng dừng chia sẻ màn hình
    stream.getVideoTracks()[0].onended = () => {
      mediaRecorder.stop();
    };
    
    // Trả về promise để đợi kết quả từ quá trình ghi
    return recordingPromise;
  } catch (error) {
    console.error('Lỗi khi ghi màn hình:', error);
    return {
      success: false,
      message: `Lỗi khi ghi màn hình: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Ghi âm
 */
export async function recordAudio(): Promise<SpecialFieldResult> {
  try {
    // Kiểm tra nếu trình duyệt hỗ trợ getUserMedia API với audio
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        message: 'Trình duyệt không hỗ trợ ghi âm.',
      };
    }

    // Tạo stream từ mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Tạo MediaRecorder để ghi stream
    const mediaRecorder = new MediaRecorder(stream);
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    // Bắt đầu ghi
    mediaRecorder.start();
    
    // Đặt thời gian ghi (tối đa 1 phút)
    const MAX_RECORDING_TIME = 60000; // 1 phút
    
    // Xử lý khi ghi hoàn tất
    const recordingPromise = new Promise<SpecialFieldResult>((resolve) => {
      mediaRecorder.onstop = () => {
        // Dừng stream
        stream.getTracks().forEach(track => track.stop());
        
        // Kết hợp các chunks thành một blob
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Chuyển đổi blob thành data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve({
            success: true,
            data: base64data,
          });
        };
        
        reader.readAsDataURL(blob);
      };
    });
    
    // Tạo giao diện điều khiển ghi âm
    const recordingControl = document.createElement('div');
    recordingControl.style.position = 'fixed';
    recordingControl.style.bottom = '20px';
    recordingControl.style.left = '50%';
    recordingControl.style.transform = 'translateX(-50%)';
    recordingControl.style.padding = '10px 20px';
    recordingControl.style.backgroundColor = '#00B1D2';
    recordingControl.style.color = 'white';
    recordingControl.style.borderRadius = '20px';
    recordingControl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    recordingControl.style.zIndex = '9999';
    recordingControl.style.cursor = 'pointer';
    recordingControl.innerHTML = 'Đang ghi âm... Nhấn để dừng';
    
    document.body.appendChild(recordingControl);
    
    // Dừng ghi khi người dùng bấm vào control
    recordingControl.onclick = () => {
      mediaRecorder.stop();
      document.body.removeChild(recordingControl);
    };
    
    // Tự động dừng sau thời gian tối đa
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        if (document.body.contains(recordingControl)) {
          document.body.removeChild(recordingControl);
        }
      }
    }, MAX_RECORDING_TIME);
    
    // Trả về promise để đợi kết quả từ quá trình ghi
    return recordingPromise;
  } catch (error) {
    console.error('Lỗi khi ghi âm:', error);
    return {
      success: false,
      message: `Lỗi khi ghi âm: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Lấy vị trí GPS
 */
export async function getGPSLocation(): Promise<SpecialFieldResult> {
  try {
    // Kiểm tra nếu trình duyệt hỗ trợ Geolocation API
    if (!navigator.geolocation) {
      return {
        success: false,
        message: 'Trình duyệt không hỗ trợ xác định vị trí GPS.',
      };
    }

    // Lấy vị trí hiện tại
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
    
    // Lấy tọa độ từ kết quả
    const { latitude, longitude, accuracy } = position.coords;
    
    return {
      success: true,
      data: {
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp,
      },
    };
  } catch (error) {
    console.error('Lỗi khi lấy vị trí GPS:', error);
    return {
      success: false,
      message: `Lỗi khi lấy vị trí GPS: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Import dữ liệu từ file
 */
export async function importData(): Promise<SpecialFieldResult> {
  try {
    // Tạo input type=file ẩn và kích hoạt click để mở hộp thoại chọn file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv,.txt,.xlsx,.xls';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Trigger click trên input để mở dialog chọn file
    fileInput.click();
    
    // Đợi người dùng chọn file
    const fileSelected = await new Promise<SpecialFieldResult>((resolve) => {
      fileInput.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) {
          resolve({
            success: false,
            message: 'Không có file nào được chọn.',
          });
          return;
        }
        
        // Đọc nội dung file
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target?.result;
          resolve({
            success: true,
            data: {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              content,
            },
          });
        };
        
        reader.onerror = () => {
          resolve({
            success: false,
            message: 'Lỗi khi đọc file.',
          });
        };
        
        // Đọc file theo định dạng thích hợp
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          reader.readAsText(file);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'text/plain' || file.name.endsWith('.txt')) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      };
      
      // Xử lý trường hợp người dùng đóng dialog mà không chọn file
      fileInput.onabort = () => {
        resolve({
          success: false,
          message: 'Người dùng đã hủy chọn file.',
        });
      };
    });
    
    // Dọn dẹp
    document.body.removeChild(fileInput);
    
    return fileSelected;
  } catch (error) {
    console.error('Lỗi khi import dữ liệu:', error);
    return {
      success: false,
      message: `Lỗi khi import dữ liệu: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Export dữ liệu ra file
 */
export async function exportData(data: any, fileType: 'json' | 'csv' | 'pdf' = 'json', fileName?: string): Promise<SpecialFieldResult> {
  try {
    let content = '';
    let mimeType = '';
    let extension = '';
    
    // Xử lý theo định dạng được chọn
    if (fileType === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (fileType === 'csv') {
      // Chuyển đổi dữ liệu thành CSV
      if (Array.isArray(data)) {
        // Lấy header từ keys của object đầu tiên
        const headers = Object.keys(data[0] || {});
        const csvContent = [
          headers.join(','), // Header row
          ...data.map(row => 
            headers.map(header => {
              const cellValue = row[header];
              // Xử lý trường hợp chuỗi có chứa dấu phẩy
              return typeof cellValue === 'string' && cellValue.includes(',') 
                ? `"${cellValue}"` 
                : cellValue;
            }).join(',')
          )
        ].join('\n');
        
        content = csvContent;
      } else {
        // Nếu không phải array, chuyển đổi thành CSV đơn giản
        const entries = Object.entries(data);
        content = entries.map(([key, value]) => `${key},${value}`).join('\n');
      }
      
      mimeType = 'text/csv';
      extension = 'csv';
    } else if (fileType === 'pdf') {
      // Sử dụng html2pdf để tạo PDF
      // Tạo một div tạm thời chứa dữ liệu HTML để chuyển thành PDF
      const tempDiv = document.createElement('div');
      
      if (typeof data === 'string') {
        // Nếu là HTML string
        tempDiv.innerHTML = data;
      } else {
        // Nếu là object hoặc array, tạo bảng HTML
        let htmlContent = '<h2>Exported Data</h2>';
        
        if (Array.isArray(data)) {
          htmlContent += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">';
          
          // Headers
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            htmlContent += '<tr>';
            headers.forEach(header => {
              htmlContent += `<th>${header}</th>`;
            });
            htmlContent += '</tr>';
            
            // Rows
            data.forEach(row => {
              htmlContent += '<tr>';
              headers.forEach(header => {
                htmlContent += `<td>${row[header]}</td>`;
              });
              htmlContent += '</tr>';
            });
          }
          
          htmlContent += '</table>';
        } else {
          // Object
          htmlContent += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">';
          htmlContent += '<tr><th>Key</th><th>Value</th></tr>';
          
          Object.entries(data).forEach(([key, value]) => {
            htmlContent += `<tr><td>${key}</td><td>${value}</td></tr>`;
          });
          
          htmlContent += '</table>';
        }
        
        tempDiv.innerHTML = htmlContent;
      }
      
      document.body.appendChild(tempDiv);
      
      // Tạo PDF từ div
      const pdfOutput = await html2pdf()
        .from(tempDiv)
        .outputPdf();
      
      // Dọn dẹp div tạm
      document.body.removeChild(tempDiv);
      
      return {
        success: true,
        data: pdfOutput,
      };
    }
    
    // Tạo Blob từ nội dung
    const blob = new Blob([content], { type: mimeType });
    
    // Tạo URL từ Blob
    const url = URL.createObjectURL(blob);
    
    // Tạo thẻ a và kích hoạt download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName || `export_${new Date().getTime()}.${extension}`;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Dọn dẹp
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }, 100);
    
    return {
      success: true,
      data: url,
    };
  } catch (error) {
    console.error('Lỗi khi export dữ liệu:', error);
    return {
      success: false,
      message: `Lỗi khi export dữ liệu: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Tạo QR Code từ text/data
 */
export async function generateQRCode(data: string): Promise<SpecialFieldResult> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data);
    
    return {
      success: true,
      data: qrDataUrl,
    };
  } catch (error) {
    console.error('Lỗi khi tạo QR code:', error);
    return {
      success: false,
      message: `Lỗi khi tạo QR code: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}